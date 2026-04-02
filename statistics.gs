/**
 * @description 顯示統計頁面
 */
function showStatisticsPage() {
    let htmlOutput = HtmlService.createHtmlOutputFromFile(
        "statisticsTemplate.html",
    )
        .setWidth(900)
        .setHeight(700);
    htmlOutput = setXFrameOptionsSafely(htmlOutput); // Use the existing safe wrapper
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "各志願選填統計");
}

/**
 * @description 判斷志願欄位步長（支援連續欄位與交錯欄位）
 * @param {string[]} headers 工作表標頭
 * @param {number} startIndex 第一個志願欄位索引
 * @param {string[]} secondChoiceHeaders 第二志願可能標頭名稱
 * @returns {number} 欄位步長（1 或 2）
 */
function resolveChoiceStep(headers, startIndex, secondChoiceHeaders) {
    if (startIndex < 0) return 1;

    const candidateOffsets = [1, 2];
    for (const offset of candidateOffsets) {
        const nextHeader = headers[startIndex + offset];
        if (secondChoiceHeaders.includes(nextHeader)) {
            return offset;
        }
    }

    return 1;
}

const STATS_PERFORMANCE_BUDGET = {
    firstScreenMs: 1500,
    maxPayloadBytes: 120000,
    maxRenderNodes: 300,
    defaultTopN: 10,
};

const STATS_CACHE_TTL = {
    summary: 300,
    groupDetail: 600,
    snapshot: 600,
};

const STATS_CACHE_KEYS = {
    snapshot: "STATISTICS_SNAPSHOT_V2",
    summary: "STATISTICS_SUMMARY_V2",
    groupDetailPrefix: "STATISTICS_GROUP_DETAIL_V2_",
};

function toHexString(bytes) {
    return bytes
        .map((byte) => {
            const normalized = byte < 0 ? byte + 256 : byte;
            return normalized.toString(16).padStart(2, "0");
        })
        .join("");
}

function getStatisticsGroupDetailCacheKey(groupName, page, pageSize) {
    const source = `${groupName}|${page}|${pageSize}`;
    const digestBytes = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        source,
        Utilities.Charset.UTF_8,
    );
    return STATS_CACHE_KEYS.groupDetailPrefix + toHexString(digestBytes).slice(0, 32);
}

function buildChoiceLabel(choiceCode, choiceName) {
    const safeCode = String(choiceCode || "").trim();
    let safeName = String(choiceName || "").trim();

    // 移除名稱尾端的「該校可報志願數」附註，避免統計標籤過長
    safeName = safeName
        .replace(/\(該校可報志願數[:：]?\s*\d+\)\s*$/u, "")
        .trim();

    // 若名稱已含代碼前綴（例：103037-國立XX大學_YY系），避免重複顯示代碼
    if (safeCode && safeName.startsWith(safeCode)) {
        safeName = safeName
            .slice(safeCode.length)
            .replace(/^[-_\s]+/u, "")
            .trim();
    }

    if (safeCode && safeName) {
        return `${safeCode} ${safeName}`;
    }
    if (safeCode) {
        return safeCode;
    }
    if (safeName) {
        return safeName;
    }
    return "未命名志願";
}

function getStatisticsVersion(generatedAt) {
    const date = new Date(generatedAt);
    if (Number.isNaN(date.getTime())) {
        return `v${Date.now()}`;
    }

    const pad2 = (value) => String(value).padStart(2, "0");
    return `v${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}

function getStatisticsSnapshot() {
    const cached = getCacheData(STATS_CACHE_KEYS.snapshot);
    if (cached) {
        return cached;
    }

    if (!studentChoiceSheet) {
        return { error: "「考生志願列表」工作表不存在，無法產生統計資料。" };
    }

    const studentData = studentChoiceSheet.getDataRange().getValues();
    if (studentData.length < 2) {
        return { error: "「考生志願列表」沒有足夠的資料可供統計。" };
    }

    const headers = studentData[0];
    const isJoinedIndex = headers.indexOf("是否參加集體報名");
    const groupCodeIndex = headers.indexOf("報考群(類)代碼");
    const groupNameIndex = headers.indexOf("報考群(類)名稱");
    const choiceCodeStartIndex =
        headers.indexOf("志願1代碼") !== -1
            ? headers.indexOf("志願1代碼")
            : headers.indexOf("志願1校系代碼");
    const choiceNameStartIndex = headers.indexOf("志願1校系名稱");

    if (isJoinedIndex === -1) {
        return { error: "找不到「是否參加集體報名」欄位。" };
    }
    if (groupCodeIndex === -1 || groupNameIndex === -1) {
        return { error: "找不到報考群(類)欄位。" };
    }
    if (choiceCodeStartIndex === -1 && choiceNameStartIndex === -1) {
        return { error: "找不到志願代碼或志願名稱相關欄位。" };
    }

    const codeStep =
        choiceCodeStartIndex !== -1
            ? resolveChoiceStep(headers, choiceCodeStartIndex, [
                  "志願2代碼",
                  "志願2校系代碼",
              ])
            : 1;
    const nameStep =
        choiceNameStartIndex !== -1
            ? resolveChoiceStep(headers, choiceNameStartIndex, [
                  "志願2校系名稱",
              ])
            : 1;

    const groupedCounter = {};
    let joinedRows = 0;

    for (let rowIndex = 1; rowIndex < studentData.length; rowIndex++) {
        const row = studentData[rowIndex];
        if (String(row[isJoinedIndex] || "").trim() !== "是") {
            continue;
        }

        joinedRows++;
        const groupCode = String(row[groupCodeIndex] || "").trim();
        const groupName = String(row[groupNameIndex] || "").trim();
        const effectiveGroup =
            groupCode && groupName
                ? `${groupCode}${groupName}`
                : groupName || groupCode || "其他未分類";

        if (!groupedCounter[effectiveGroup]) {
            groupedCounter[effectiveGroup] = {};
        }

        for (let i = 0; i < limitOfChoices; i++) {
            const codeValue =
                choiceCodeStartIndex !== -1
                    ? String(
                          row[choiceCodeStartIndex + i * codeStep] || "",
                      ).trim()
                    : "";
            const nameValue =
                choiceNameStartIndex !== -1
                    ? String(
                          row[choiceNameStartIndex + i * nameStep] || "",
                      ).trim()
                    : "";

            if (!codeValue && !nameValue) {
                continue;
            }

            const counterKey = codeValue || `name:${nameValue}`;
            if (!groupedCounter[effectiveGroup][counterKey]) {
                groupedCounter[effectiveGroup][counterKey] = {
                    choiceCode: codeValue,
                    choiceName: nameValue,
                    choiceLabel: buildChoiceLabel(codeValue, nameValue),
                    count: 0,
                };
            }
            groupedCounter[effectiveGroup][counterKey].count += 1;
        }
    }

    const groups = {};
    for (const groupName in groupedCounter) {
        groups[groupName] = Object.values(groupedCounter[groupName]).sort(
            (a, b) => b.count - a.count,
        );
    }

    const generatedAt = new Date().toISOString();
    const snapshot = {
        version: getStatisticsVersion(generatedAt),
        generatedAt,
        groups,
        groupNames: Object.keys(groups).sort(),
        joinedRows,
    };

    setCacheData(STATS_CACHE_KEYS.snapshot, snapshot, STATS_CACHE_TTL.snapshot);
    return snapshot;
}

/**
 * @description 取得統計摘要（首屏優先載入）
 * @returns {Object}
 */
function getStatisticsSummaryData() {
    try {
        const cached = getCacheData(STATS_CACHE_KEYS.summary);
        if (cached) {
            return cached;
        }

        const snapshot = getStatisticsSnapshot();
        if (snapshot.error) {
            return snapshot;
        }

        const groups = snapshot.groupNames.map((groupName) => {
            const items = snapshot.groups[groupName] || [];
            const totalCount = items.reduce((sum, item) => sum + item.count, 0);
            return {
                groupName,
                totalCount,
                totalChoices: items.length,
                topChoices: items.slice(
                    0,
                    STATS_PERFORMANCE_BUDGET.defaultTopN,
                ),
            };
        });

        const result = {
            version: snapshot.version,
            generatedAt: snapshot.generatedAt,
            performanceBudget: STATS_PERFORMANCE_BUDGET,
            totalGroups: groups.length,
            totalParticipants: snapshot.joinedRows,
            groups,
        };

        const payloadBytes = Utilities.newBlob(
            JSON.stringify(result),
            "application/json",
        ).getBytes().length;
        if (payloadBytes > STATS_PERFORMANCE_BUDGET.maxPayloadBytes) {
            Logger.log(
                "(getStatisticsSummaryData)摘要 payload 過大：%d bytes",
                payloadBytes,
            );
        }

        setCacheData(STATS_CACHE_KEYS.summary, result, STATS_CACHE_TTL.summary);
        return result;
    } catch (err) {
        Logger.log("getStatisticsSummaryData 發生錯誤: %s", err.message);
        return { error: "取得統計摘要時發生錯誤：" + err.message };
    }
}

/**
 * @description 取得單一群類統計明細（分頁）
 * @param {string} groupName 群類名稱
 * @param {number} [page=1] 頁碼
 * @param {number} [pageSize=10] 每頁筆數
 * @returns {Object}
 */
function getStatisticsGroupDetail(groupName, page = 1, pageSize = 10) {
    try {
        const safeGroupName = String(groupName || "").trim();
        if (!safeGroupName) {
            return { error: "請提供群類名稱。" };
        }

        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
        const cacheKey = getStatisticsGroupDetailCacheKey(
            safeGroupName,
            safePage,
            safePageSize,
        );
        const cached = getCacheData(cacheKey);
        if (cached) {
            return cached;
        }

        const snapshot = getStatisticsSnapshot();
        if (snapshot.error) {
            return snapshot;
        }

        const groupItems = snapshot.groups[safeGroupName];
        if (!groupItems) {
            return { error: `找不到群類「${safeGroupName}」的統計資料。` };
        }

        const start = (safePage - 1) * safePageSize;
        const end = start + safePageSize;
        const pageItems = groupItems.slice(start, end);

        const result = {
            version: snapshot.version,
            generatedAt: snapshot.generatedAt,
            groupName: safeGroupName,
            page: safePage,
            pageSize: safePageSize,
            totalItems: groupItems.length,
            hasMore: end < groupItems.length,
            items: pageItems,
        };

        const payloadBytes = Utilities.newBlob(
            JSON.stringify(result),
            "application/json",
        ).getBytes().length;
        if (payloadBytes > STATS_PERFORMANCE_BUDGET.maxPayloadBytes) {
            Logger.log(
                "(getStatisticsGroupDetail)明細 payload 過大：%d bytes (%s)",
                payloadBytes,
                safeGroupName,
            );
        }

        setCacheData(cacheKey, result, STATS_CACHE_TTL.groupDetail);
        return result;
    } catch (err) {
        Logger.log("getStatisticsGroupDetail 發生錯誤: %s", err.message);
        return { error: "取得群類明細時發生錯誤：" + err.message };
    }
}

/**
 * @description 取得統計效能預算設定
 * @returns {Object}
 */
function getStatisticsPerformanceConfig() {
    return {
        version: "stats-budget-v1",
        generatedAt: new Date().toISOString(),
        budget: STATS_PERFORMANCE_BUDGET,
    };
}

/**
 * @description 取得原始統計資料供前端使用（使用 snapshot TTL 快取）
 * @returns {Object} 依類群分類的志願統計資料或包含錯誤訊息的物件
 */
function getRawStatisticsData() {
    try {
        const cachedData = getCacheData(CACHE_KEYS.STATISTICS_RAW_DATA);
        if (cachedData) {
            return cachedData;
        }

        const snapshot = getStatisticsSnapshot();
        if (snapshot.error) {
            return snapshot;
        }

        const result = {};
        snapshot.groupNames.forEach((groupName) => {
            result[groupName] = (snapshot.groups[groupName] || []).map(
                (item) => ({
                    name: item.choiceLabel,
                    count: item.count,
                    choiceCode: item.choiceCode,
                    choiceName: item.choiceName,
                    choiceLabel: item.choiceLabel,
                }),
            );
        });

        setCacheData(
            CACHE_KEYS.STATISTICS_RAW_DATA,
            result,
            STATS_CACHE_TTL.snapshot,
        );
        return result;
    } catch (err) {
        Logger.log("getRawStatisticsData 發生錯誤: %s", err.message);
        return { error: "產生統計資料時發生未預期的錯誤：" + err.message };
    }
}

/**
 * @description 取得「考生志願列表」中「報考群(類)名稱」的所有唯一值（使用 summary TTL 快取）
 * @returns {Object} 包含唯一群類名稱陣列或錯誤訊息的物件
 */
function getUniqueGroupNames() {
    try {
        const cachedData = getCacheData(CACHE_KEYS.STATISTICS_GROUP_NAMES);
        if (cachedData) {
            return cachedData;
        }

        const summary = getStatisticsSummaryData();
        if (summary.error) {
            return summary;
        }

        const result = {
            version: summary.version,
            generatedAt: summary.generatedAt,
            groupNames: (summary.groups || []).map((group) => group.groupName),
        };

        setCacheData(
            CACHE_KEYS.STATISTICS_GROUP_NAMES,
            result,
            STATS_CACHE_TTL.summary,
        );

        return result;
    } catch (err) {
        Logger.log("getUniqueGroupNames 發生錯誤: %s", err.message);
        return { error: "取得唯一群類名稱時發生未預期的錯誤：" + err.message };
    }
}
