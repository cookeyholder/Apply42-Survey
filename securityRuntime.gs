const SECURITY_CACHE_KEYS = {
    FORM_CTX_PREFIX: "secFormCtx_",
    NONCE_USED_PREFIX: "secNonceUsed_",
    RATE_LIMIT_PREFIX: "secRate_",
};

const SECURITY_LIMITS = {
    formTtlSec: 600,
    maxRequestAgeMs: 10 * 60 * 1000,
    submitPerMinute: 12,
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
    if (Array.isArray(value)) return String(value[0] || "").trim();
    if (value === undefined || value === null) return "";
    return String(value).trim();
}

function generateSecurityToken() {
    return (
        Utilities.getUuid().replace(/-/g, "") +
        Utilities.getUuid().replace(/-/g, "")
    );
}

function logSecurityEvent(eventType, payload = {}) {
    Logger.log(
        "(SECURITY_EVENT)%s",
        JSON.stringify({
            eventType,
            at: Utilities.formatDate(
                new Date(),
                "Asia/Taipei",
                "yyyy-MM-dd HH:mm:ss",
            ),
            ...payload,
        }),
    );
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

function issueSubmissionSecurityContext(sessionEmail) {
    const csrfToken = generateSecurityToken();
    const csrfNonce = generateSecurityToken();
    const now = Date.now();
    const nonceHash = toSha256Hex(csrfNonce);

    const ctx = {
        tokenHash: toSha256Hex(csrfToken),
        nonceHash,
        sessionEmail,
        issuedAtMs: now,
        expiresAtMs: now + SECURITY_LIMITS.maxRequestAgeMs,
        action: "submission.write",
    };

    CacheService.getScriptCache().put(
        SECURITY_CACHE_KEYS.FORM_CTX_PREFIX + nonceHash,
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
        logSecurityEvent("request_expired", { sessionEmail, ageMs });
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
    const minuteBucket = Math.floor(Date.now() / 60000);
    const key =
        SECURITY_CACHE_KEYS.RATE_LIMIT_PREFIX +
        toSha256Hex(`${endpoint}|${identity}|${minuteBucket}`).slice(0, 24);
    const current = Number(cache.get(key) || "0");
    if (current >= limit) {
        logSecurityEvent("rate_limited", { endpoint, identity });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "請求過於頻繁，請稍後再試",
        );
    }
    cache.put(key, String(current + 1), 60);
}
