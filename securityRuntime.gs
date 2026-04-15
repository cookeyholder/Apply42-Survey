const SECURITY_CACHE_KEYS = {
    FORM_CTX_PREFIX: "secFormCtx_",
    NONCE_USED_PREFIX: "secNonceUsed_",
    RATE_LIMIT_PREFIX: "secRate_",
    ALERT_COUNTER_PREFIX: "secAlert_",
};

const SECURITY_LIMITS = {
    formTtlSec: 600,
    maxRequestAgeMs: 10 * 60 * 1000,
    submitPerMinute: 12,
    submitBlockSec: 300,
};

function toSha256Hex(input) {
    const digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(input || ""),
        Utilities.Charset.UTF_8,
    );
    return digest
        .map((byte) => (byte < 0 ? byte + 256 : byte))
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
}

function getRequestParamFirst(parameters, key) {
    if (!parameters || typeof parameters !== "object") return "";
    const value = parameters[key];
    if (Array.isArray(value)) {
        return String(value[0] || "").trim();
    }
    if (value === undefined || value === null) {
        return "";
    }
    return String(value).trim();
}

function generateSecurityToken() {
    return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function maskEmail(email) {
    const value = String(email || "");
    const parts = value.split("@");
    if (parts.length !== 2) return "***";
    const name = parts[0];
    if (name.length <= 2) return "***@" + parts[1];
    return `${name[0]}***${name[name.length - 1]}@${parts[1]}`;
}

function sanitizeLogPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return payload;
    }
    const clone = { ...payload };
    if (clone.sessionEmail) clone.sessionEmail = maskEmail(clone.sessionEmail);
    if (clone.userEmail) clone.userEmail = maskEmail(clone.userEmail);
    if (clone.requestedUserEmail) clone.requestedUserEmail = maskEmail(clone.requestedUserEmail);
    if (clone.effectiveUserEmail) clone.effectiveUserEmail = maskEmail(clone.effectiveUserEmail);
    if (clone.csrfToken) clone.csrfToken = "***";
    if (clone.csrfNonce) clone.csrfNonce = "***";
    return clone;
}

function logSecurityEvent(eventType, payload = {}) {
    const safePayload = sanitizeLogPayload(payload);
    Logger.log(
        "(SECURITY_EVENT)%s",
        JSON.stringify({
            eventType,
            at: Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss"),
            ...safePayload,
        }),
    );
}

function issueSubmissionSecurityContext(sessionEmail) {
    const csrfToken = generateSecurityToken();
    const csrfNonce = generateSecurityToken();
    const now = Date.now();
    const ctx = {
        tokenHash: toSha256Hex(csrfToken),
        nonceHash: toSha256Hex(csrfNonce),
        sessionEmail,
        issuedAtMs: now,
        expiresAtMs: now + SECURITY_LIMITS.maxRequestAgeMs,
        action: "submission.write",
    };

    const cache = CacheService.getScriptCache();
    cache.put(
        SECURITY_CACHE_KEYS.FORM_CTX_PREFIX + ctx.nonceHash,
        JSON.stringify(ctx),
        SECURITY_LIMITS.formTtlSec,
    );

    return {
        csrfToken,
        csrfNonce,
        requestTs: String(now),
        serviceOrigin: getServiceOrigin(),
    };
}

function getServiceOrigin() {
    try {
        const url = getServiceUrl();
        if (!url) return "";
        return new URL(url).origin;
    } catch (error) {
        return "";
    }
}

function assertSubmissionSecurity(request, sessionEmail) {
    const parameters = request?.parameters || {};
    const csrfToken = getRequestParamFirst(parameters, "csrfToken");
    const csrfNonce = getRequestParamFirst(parameters, "csrfNonce");
    const requestTsRaw = getRequestParamFirst(parameters, "requestTs");
    const requestOrigin = getRequestParamFirst(parameters, "requestOrigin");

    if (!csrfToken || !csrfNonce || !requestTsRaw) {
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "缺少必要的安全驗證資訊",
        );
    }

    const requestTs = Number(requestTsRaw);
    if (!Number.isFinite(requestTs)) {
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "安全驗證資料格式錯誤",
        );
    }

    const ageMs = Date.now() - requestTs;
    if (ageMs < -30000 || ageMs > SECURITY_LIMITS.maxRequestAgeMs) {
        logSecurityEvent("request_expired", {
            sessionEmail,
            ageMs,
            requestTs,
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "請重新整理頁面後再提交",
        );
    }

    const serviceOrigin = getServiceOrigin();
    if (serviceOrigin && requestOrigin && serviceOrigin !== requestOrigin) {
        logSecurityEvent("origin_mismatch", {
            sessionEmail,
            requestOrigin,
            serviceOrigin,
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "請求來源驗證失敗",
        );
    }

    const nonceHash = toSha256Hex(csrfNonce);
    const cache = CacheService.getScriptCache();
    const usedKey = SECURITY_CACHE_KEYS.NONCE_USED_PREFIX + nonceHash;
    if (cache.get(usedKey)) {
        logSecurityEvent("replay_detected", { sessionEmail, nonceHash });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "偵測到重放請求，已拒絕",
        );
    }

    const ctxKey = SECURITY_CACHE_KEYS.FORM_CTX_PREFIX + nonceHash;
    const rawCtx = cache.get(ctxKey);
    if (!rawCtx) {
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "安全憑證已失效，請重新整理頁面",
        );
    }

    const ctx = JSON.parse(rawCtx);
    if (ctx.sessionEmail !== sessionEmail) {
        logSecurityEvent("session_mismatch", {
            sessionEmail,
            ctxEmail: ctx.sessionEmail,
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "使用者身分驗證失敗",
        );
    }

    if (ctx.tokenHash !== toSha256Hex(csrfToken)) {
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "CSRF token 驗證失敗",
        );
    }

    cache.remove(ctxKey);
    cache.put(usedKey, "1", SECURITY_LIMITS.formTtlSec);
}

function assertRateLimit(endpoint, identity, limit = SECURITY_LIMITS.submitPerMinute) {
    const cache = CacheService.getScriptCache();
    const nowMinute = Math.floor(Date.now() / 60000);
    const key = SECURITY_CACHE_KEYS.RATE_LIMIT_PREFIX + toSha256Hex(`${endpoint}|${identity}|${nowMinute}`).slice(0, 24);
    const current = Number(cache.get(key) || "0");
    if (current >= limit) {
        logSecurityEvent("rate_limited", { endpoint, identity });
        incrementAlertCounter(`${endpoint}:rate_limited`);
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "請求過於頻繁，請稍後再試",
        );
    }
    cache.put(key, String(current + 1), 60);
}

function incrementAlertCounter(ruleName) {
    const cache = CacheService.getScriptCache();
    const minuteBucket = Math.floor(Date.now() / 60000);
    const key =
        SECURITY_CACHE_KEYS.ALERT_COUNTER_PREFIX +
        toSha256Hex(`${ruleName}|${minuteBucket}`).slice(0, 24);
    const current = Number(cache.get(key) || "0") + 1;
    cache.put(key, String(current), 120);
    if (current >= 5) {
        Logger.log(
            "(SECURITY_ALERT)%s",
            JSON.stringify({
                ruleName,
                level: "high",
                minuteBucket,
                count: current,
            }),
        );
    }
}

function runSecurityAlertDrill() {
    incrementAlertCounter("drill:simulated-attack");
    incrementAlertCounter("drill:simulated-attack");
    incrementAlertCounter("drill:simulated-attack");
    incrementAlertCounter("drill:simulated-attack");
    incrementAlertCounter("drill:simulated-attack");
    return true;
}
