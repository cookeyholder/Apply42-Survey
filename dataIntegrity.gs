function findUniqueValueRows(keyword, targetSheet, headerName = "") {
    if (!keyword || !targetSheet) return [];
    try {
        let range = targetSheet;
        if (typeof targetSheet.getDataRange === "function") {
            if (headerName) {
                const targetCol = getHeaderIndex(targetSheet, headerName);
                const lastRow = targetSheet.getLastRow();
                if (targetCol < 1 || lastRow < 2) return [];
                range = targetSheet.getRange(2, targetCol, lastRow - 1, 1);
            } else {
                range = targetSheet.getDataRange();
            }
        }
        const cells = range
            .createTextFinder(String(keyword))
            .matchEntireCell(true)
            .matchCase(false)
            .findAll();
        if (!Array.isArray(cells)) return [];
        const rowSet = new Set(cells.map((cell) => Number(cell.getRow())));
        return Array.from(rowSet).sort((a, b) => a - b);
    } catch (error) {
        Logger.log("(findUniqueValueRows)失敗：%s", error.message);
        return [];
    }
}

function assertSingleStudentRowByEmail(email) {
    const rows = findUniqueValueRows(email, studentChoiceSheet, "信箱");
    if (rows.length !== 1) {
        logSecurityEvent("data_integrity_row_mismatch", {
            userEmail: email,
            count: rows.length,
            rows,
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "資料一致性檢查失敗，請聯絡管理員",
        );
    }
    return rows[0];
}

function detectDuplicateEmails(sheet) {
    if (!sheet) return [];
    try {
        const lastRow = sheet.getLastRow();
        if (lastRow < 2) return [];
        const emailCol = getHeaderIndex(sheet, "信箱");
        if (emailCol < 1) return [];
        const values = sheet.getRange(2, emailCol, lastRow - 1, 1).getValues();
        const map = new Map();
        values.forEach((row, idx) => {
            const email = String(row[0] || "").trim().toLowerCase();
            if (!email) return;
            if (!map.has(email)) map.set(email, []);
            map.get(email).push(idx + 2);
        });
        return Array.from(map.entries())
            .filter((entry) => entry[1].length > 1)
            .map((entry) => ({ email: entry[0], rows: entry[1] }));
    } catch (error) {
        Logger.log("(detectDuplicateEmails)失敗：%s", error.message);
        return [];
    }
}

function getAllowedDepartmentCodeSet(user, sessionEmail = "") {
    const userEmail = String(user?.["信箱"] || "").trim().toLowerCase();
    const normalizedSession = String(sessionEmail || "").trim().toLowerCase();
    if (normalizedSession && userEmail && userEmail !== normalizedSession) {
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "使用者身分驗證失敗",
        );
    }
    const groupCode = String(user?.["報考群(類)代碼"] || "").padStart(2, "0");
    const groupName = String(user?.["報考群(類)名稱"] || "").trim();
    if (!groupCode || !groupName || !choicesSheet) {
        return new Set();
    }
    const headerRow = choicesSheet
        .getRange(1, 1, 1, choicesSheet.getLastColumn())
        .getValues()[0];
    const targetColumn = `${groupCode}${groupName}`;
    const groupIndex = headerRow.indexOf(targetColumn);
    if (groupIndex < 0) {
        return new Set();
    }
    const choiceRows = Math.max(choicesSheet.getLastRow() - 1, 0);
    if (choiceRows === 0) {
        return new Set();
    }
    const choiceValues = choicesSheet
        .getRange(2, groupIndex + 1, choiceRows, 1)
        .getValues();
    const codeSet = new Set();
    choiceValues.forEach((row) => {
        const text = String(row[0] || "").trim();
        const match = text.match(/^(\d{6})/);
        if (match) {
            codeSet.add(match[1]);
        }
    });
    return codeSet;
}

function validateDepartmentChoicesAllowlist(departmentChoices, allowedCodes) {
    const illegalCodes = [];
    departmentChoices.forEach((choice) => {
        const code = String(choice || "").trim();
        if (!code) return;
        if (!allowedCodes.has(code)) {
            illegalCodes.push(code);
        }
    });

    if (illegalCodes.length > 0) {
        logSecurityEvent("illegal_department_code", {
            illegalCodes,
        });
        throw createAuthorizationError(
            AUTH_ERROR_CODES.FORBIDDEN,
            "提交包含未授權志願代碼，請重新整理頁面後再試",
        );
    }
}
