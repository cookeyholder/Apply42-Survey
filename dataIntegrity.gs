function findUniqueValueRows(keyword, targetRange) {
    if (!keyword || !targetRange) return [];
    try {
        let range = targetRange;
        if (typeof targetRange.getDataRange === "function") {
            range = targetRange.getDataRange();
        }
        const cells = range
            .createTextFinder(String(keyword))
            .matchEntireCell(true)
            .matchCase(false)
            .findAll();
        return Array.isArray(cells) ? cells.map((cell) => cell.getRow()) : [];
    } catch (error) {
        Logger.log("(findUniqueValueRows)失敗：%s", error.message);
        return [];
    }
}

function assertSingleStudentRowByEmail(email) {
    const rows = findUniqueValueRows(email, studentChoiceSheet);
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

function getAllowedDepartmentCodeSet(user) {
    const optionData = getOptionData(user);
    const codeSet = new Set();
    (optionData.departmentOptions || []).forEach((option) => {
        const text = String(option || "").trim();
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
