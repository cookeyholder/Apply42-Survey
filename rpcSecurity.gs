const RPC_WHITELIST = Object.freeze({
    getStatisticsSummaryData: {
        roles: ["學生", "老師"],
        resource: "statistics.summary.read",
        rateLimit: 30,
    },
    getStatisticsGroupDetail: {
        roles: ["學生", "老師"],
        resource: "statistics.group-detail.read",
        rateLimit: 40,
    },
    getRawStatisticsData: {
        roles: ["老師"],
        resource: "statistics.raw.read",
        rateLimit: 30,
    },
    getUniqueGroupNames: {
        roles: ["老師"],
        resource: "statistics.group-names.read",
        rateLimit: 30,
    },
});

let __internalAccessDepth = 0;

function runWithInternalAccess_(fn) {
    __internalAccessDepth += 1;
    try {
        return fn();
    } finally {
        __internalAccessDepth = Math.max(0, __internalAccessDepth - 1);
    }
}

function assertInternalAccess_(resource = "internal.call") {
    if (__internalAccessDepth > 0) {
        return true;
    }

    logAuthorizationDenial({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        resource,
        reason: "direct_rpc_call_blocked",
    });
    throw createAuthorizationError(
        AUTH_ERROR_CODES.FORBIDDEN,
        "禁止直接呼叫內部函式",
    );
}

function assertRpcWhitelistAccess_(functionName) {
    assertInternalAccess_("assertRpcWhitelistAccess_");
    const policy = RPC_WHITELIST[functionName];
    if (!policy) {
        logAuthorizationDenial({
            code: AUTH_ERROR_CODES.FORBIDDEN,
            resource: `rpc.${functionName}`,
            reason: "rpc_not_in_whitelist",
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "此 RPC 端點未開放",
        );
    }

    const context = getAuthorizedUserContext(policy.roles, policy.resource);
    if (typeof policy.rateLimit === "number" && policy.rateLimit > 0) {
        assertRateLimit(policy.resource, context.sessionEmail, policy.rateLimit);
    }
    return context;
}
