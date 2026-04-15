const AUTH_ERROR_CODES = {
    FORBIDDEN: "AUTH_FORBIDDEN",
    UNAUTHORIZED: "AUTH_UNAUTHORIZED",
    OUT_OF_SCOPE: "AUTH_OUT_OF_SCOPE",
};

/**
 * @description 建立標準化授權錯誤
 * @param {string} code
 * @param {string} message
 * @returns {Error}
 */
function createAuthorizationError(code, message) {
    const error = new Error(message);
    error.name = "AuthorizationError";
    error.code = code;
    return error;
}

/**
 * @description 建立標準化授權拒絕事件
 * @param {Object} event
 */
function logAuthorizationDenial(event) {
    const payload = {
        type: "AUTH_DENY",
        at: Utilities.formatDate(
            new Date(),
            "Asia/Taipei",
            "yyyy-MM-dd HH:mm:ss",
        ),
        ...event,
    };
    Logger.log("(AUTH_DENY)%s", JSON.stringify(payload));
}

/**
 * @description 解析使用者角色
 * @param {Object<string, any>} user
 * @returns {string}
 */
function resolveUserRole(user) {
    if (!user || typeof user !== "object") {
        return "";
    }

    const directRole = String(user.userType || "").trim();
    if (directRole === "學生" || directRole === "老師" || directRole === "管理") {
        return directRole;
    }

    const roleField = String(user["角色"] || "").trim();
    if (roleField === "學生" || roleField === "老師" || roleField === "管理") {
        return roleField;
    }

    if (String(user["是否管理員"] || "").trim() === "是") {
        return "管理";
    }

    return "";
}

/**
 * @description 取得授權後的伺服器端身分
 * @param {string[]} requiredRoles
 * @param {string} resource
 * @returns {{sessionEmail: string, user: Object<string, any>, role: string}}
 */
function getAuthorizedUserContext(requiredRoles, resource) {
    const sessionEmail = Session.getActiveUser().getEmail();
    if (!sessionEmail) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
            resource,
            reason: "missing_session_email",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.UNAUTHORIZED,
            "使用者尚未登入或無有效身分",
        );
    }

    const user = getUserData();
    if (!user) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
            resource,
            sessionEmail,
            reason: "user_not_found",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.UNAUTHORIZED,
            "找不到可授權的使用者資料",
        );
    }

    const role = resolveUserRole(user);
    if (!role) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.FORBIDDEN,
            resource,
            sessionEmail,
            reason: "missing_role",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "使用者角色未定義",
        );
    }

    if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
        const allow = requiredRoles.includes(role);
        if (!allow) {
            logAuthorizationDenial({
                code: AUTH_ERROR_CODES.FORBIDDEN,
                resource,
                sessionEmail,
                role,
                requiredRoles,
                reason: "role_not_allowed",
            });
            throw createAuthorizationError(
                AUTH_ERROR_CODES.FORBIDDEN,
                "使用者無操作權限",
            );
        }
    }

    const userEmail = String(user["信箱"] || "").trim();
    if (userEmail && userEmail !== sessionEmail) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.FORBIDDEN,
            resource,
            sessionEmail,
            userEmail,
            role,
            reason: "identity_mismatch",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "使用者身分驗證失敗",
        );
    }

    return { sessionEmail, user, role };
}

/**
 * @description 解析老師可管理班級列表
 * @param {Object<string, any>} teacherUser
 * @returns {string[]}
 */
function getTeacherAuthorizedClasses(teacherUser) {
    const raw = String(teacherUser?.["班級"] || "");
    return raw
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");
}

/**
 * @description 檢查老師查詢班級是否在授權範圍內
 * @param {string[]} requestedClassNames
 * @param {string[]} authorizedClassNames
 * @param {string} sessionEmail
 */
function assertTeacherClassScope(
    requestedClassNames,
    authorizedClassNames,
    sessionEmail,
) {
    const authorizedSet = new Set(authorizedClassNames);
    const outOfScope = requestedClassNames.filter(
        (className) => !authorizedSet.has(className),
    );

    if (outOfScope.length > 0) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.OUT_OF_SCOPE,
            resource: "teacher.class.read",
            sessionEmail,
            requestedClassNames,
            authorizedClassNames,
            outOfScope,
            reason: "teacher_scope_violation",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.OUT_OF_SCOPE,
            "查詢班級超出授權範圍",
        );
    }
}
