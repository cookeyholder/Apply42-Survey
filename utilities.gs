// 新增安全性和效能常數
const MAX_SEARCH_RESULTS = 100;
const MAX_FILE_SIZE_MB = 50;
const VALID_CSV_EXTENSIONS = [".csv"];
const CSV_MIME_TYPE = "text/csv";

/**
 * @description 驗證搜尋關鍵字的安全性
 * @param {string} keyword - 搜尋關鍵字
 * @returns {boolean} 是否為安全的關鍵字
 */
function isValidSearchKeyword(keyword) {
  if (!keyword || typeof keyword !== "string") {
    return false;
  }

  // 檢查長度和內容
  return keyword.length > 0 && keyword.length <= 100 && !/[<>"]/.test(keyword); // 防止 XSS
}

/**
 * @description 驗證列號和數值的有效性
 * @param {number} row - 列號
 * @param {Array} values - 要更新的值
 * @returns {boolean} 是否有效
 */
function validateRowUpdate(row, values) {
  // 檢查列號
  if (!Number.isInteger(row) || row < 1 || row > MAX_SHEET_ROWS) {
    Logger.log("(validateRowUpdate)無效的列號：%s", row);
    return false;
  }

  // 檢查數值陣列
  if (!Array.isArray(values) || values.length === 0) {
    Logger.log("(validateRowUpdate)無效的數值陣列");
    return false;
  }

  // 檢查數值內容
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      typeof value === "string" &&
      value.length > 1000
    ) {
      Logger.log("(validateRowUpdate)數值過長，可能有安全風險");
      return false;
    }
  }

  return true;
}

/**
 * @description 在指定範圍以文字搜尋取得列號（改進版）
 * @param {Range|Sheet} targetRange - 搜尋範圍或工作表
 * @param {string} keyword - 關鍵字
 * @returns {number} 找到的列號，未找到回傳 0
 */
function findValueRow(keyword, targetRange) {
  try {
    Logger.log("(findValueRow)關鍵字：%s", keyword);
    // 驗證輸入參數
    if (!isValidSearchKeyword(keyword)) {
      Logger.log("(findValueRow)無效的搜尋關鍵字：%s", keyword);
      return 0;
    }

    if (!targetRange) {
      Logger.log("(findValueRow)搜尋範圍不存在");
      return 0;
    }

    // 取得工作表物件
    let sheet;
    if (typeof targetRange.getSheet === "function") {
      sheet = targetRange.getSheet();
    } else if (typeof targetRange.getName === "function") {
      sheet = targetRange;
      targetRange = sheet.getDataRange();
    } else {
      Logger.log("(findValueRow)無效的搜尋範圍類型");
      return 0;
    }

    // 檢查工作表大小
    const numRows = targetRange.getNumRows();
    if (numRows > MAX_SHEET_ROWS) {
      Logger.log("(findValueRow)工作表過大，無法搜尋：%d 列", numRows);
      return 0;
    }

    // 執行搜尋
    const foundCell = targetRange
      .createTextFinder(keyword)
      .matchEntireCell(true)
      .matchCase(false)
      .findNext();

    if (foundCell) {
      const rowNumber = foundCell.getRow();
      Logger.log(
        "(findValueRow)在 %s 工作表的第 %d 列找到關鍵字: %s",
        sheet.getName(),
        rowNumber,
        keyword
      );
      return rowNumber;
    } else {
      Logger.log(
        "(findValueRow)在 %s 工作表中，沒有找到關鍵字：%s",
        sheet.getName(),
        keyword
      );
      return 0;
    }
  } catch (error) {
    Logger.log("(findValueRow)發生錯誤：%s", error.message);
    return 0;
  }
}

/**
 * @description 更新考生志願列表指定列的志願資料（安全版本）
 * @param {number} row - 列號
 * @param {Array} values - 二維陣列志願資料
 */
function updateSpecificRow(row, values) {
  try {
    if (!studentChoiceSheet) {
      throw new Error("(updateSpecificRow)考生志願列表工作表不存在");
    }

    // 確保 values 是二維陣列
    if (!Array.isArray(values[0])) {
      values = [values];
    }

    // 驗證輸入
    if (!validateRowUpdate(row, values[0])) {
      throw new Error("(updateSpecificRow)輸入驗證失敗");
    }

    // 取得標頭並驗證
    const headerRange = studentChoiceSheet.getRange(
      1,
      1,
      1,
      studentChoiceSheet.getLastColumn()
    );
    const headers = headerRange.getValues()[0];
    const startColumnIndex = headers.indexOf("是否參加集體報名");

    if (startColumnIndex === -1) {
      throw new Error('(updateSpecificRow)找不到" 是否參加集體報名"欄位');
    }

    const startColumn = startColumnIndex + 1;
    const numColumns = Math.min(values[0].length, limitOfChoices + 1);

    // 檢查範圍有效性
    if (startColumn + numColumns - 1 > studentChoiceSheet.getLastColumn()) {
      throw new Error("(updateSpecificRow)更新範圍超出工作表邊界");
    }

    // 清理數值 - 防止注入攻擊
    const cleanedValues = values.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const str = cell.toString();
          // 移除可能的危險字符
          return str.replace(/[<>="']/g, "").substring(0, 100);
        })
        .slice(0, numColumns)
    );

    const range = studentChoiceSheet.getRange(row, startColumn, 1, numColumns);
    range.setValues(cleanedValues);

    Logger.log(
      "(updateSpecificRow)成功更新考生志願列表的第 %d 列，更新 %d 個欄位",
      row,
      numColumns
    );
    return true;
  } catch (error) {
    Logger.log("(updateSpecificRow)發生錯誤：%s", error.message);
    throw error;
  }
}

/**
 * @description 驗證匯出資料的安全性
 * @param {Array} data - 要匯出的資料
 * @returns {boolean} 是否安全
 */
function validateExportData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  // 檢查資料大小
  if (data.length > MAX_SHEET_ROWS) {
    Logger.log("(validateExportData)匯出資料過大：%d 列", data.length);
    return false;
  }

  return true;
}

/**
 * @description 清理匯出資料中的敏感資訊
 * @param {Array} data - 原始資料
 * @returns {Array} 清理後的資料
 */
function sanitizeExportData(data) {
  return data.map((row) =>
    row.map((cell) => {
      if (cell === null || cell === undefined) return "";
      const str = String(cell);
      // 移除可能包含敏感資訊的特殊字符
      return str.replace(/[<>='"\\]/g, "").trim();
    })
  );
}

/**
 * @description 驗證請求參數的安全性
 * @param {Object} configs - 請求參數
 * @returns {boolean} 參數是否安全
 */
function validateRequestParameters(configs) {
  if (!configs || typeof configs !== "object") {
    return false;
  }

  // 檢查參數數量
  if (Object.keys(configs).length > 20) {
    Logger.log("(validateRequestParameters)請求參數過多");
    return false;
  }

  // 檢查每個參數
  for (const [key, value] of Object.entries(configs)) {
    if (typeof key !== "string" || key.length > 100) {
      Logger.log("(validateRequestParameters)無效的參數鍵：%s", key);
      return false;
    }

    if (Array.isArray(value)) {
      if (value.length > 10) {
        Logger.log("(validateRequestParameters)參數陣列過大：%s", key);
        return false;
      }
      for (const item of value) {
        if (typeof item === "string" && item.length > MAX_PARAMETER_LENGTH) {
          Logger.log("(validateRequestParameters)參數值過長：%s", key);
          return false;
        }
      }
    } else if (
      typeof value === "string" &&
      value.length > MAX_PARAMETER_LENGTH
    ) {
      Logger.log("(validateRequestParameters)參數值過長：%s", key);
      return false;
    }
  }

  return true;
}

/**
 * @description 安全的CSV匯出函式
 * @returns {string|null} 下載連結或 null
 */
function exportCsv() {
  try {
    const context = getAuthorizedUserContext(["老師", "管理"], "export.csv");
    assertRateLimit("export.csv", context.sessionEmail, 10);
    logSecurityEvent("export_csv_requested", {
      sessionEmail: context.sessionEmail,
    });

    // 驗證權限和工作表
    if (!forImportSheet) {
      throw new Error("(exportCsv)匯入報名系統工作表不存在");
    }

    const configs = getConfigs();
    if (!configs || !configs["報名學校代碼"]) {
      throw new Error("(exportCsv)無法取得學校代碼參數");
    }

    // 取得資料
    const dataRange = forImportSheet.getDataRange();
    if (dataRange.getNumRows() === 0) {
      throw new Error("(exportCsv)沒有可匯出的資料");
    }

    const [headers, ...rawData] = dataRange.getValues();

    // 驗證資料
    if (!validateExportData(rawData)) {
      throw new Error("(exportCsv)匯出資料驗證失敗");
    }

    // 過濾和清理資料
    const filteredData = rawData.filter((row) =>
      row.some(
        (cell) =>
          cell !== null && cell !== undefined && cell.toString().trim() !== ""
      )
    );

    if (filteredData.length === 0) {
      const ui = SpreadsheetApp.getUi();
      ui.alert("錯誤", "沒有可匯出的資料，請確認資料內容。", ui.ButtonSet.OK);
      return null;
    }

    // 清理資料
    const sanitizedData = sanitizeExportData(filteredData);

    // 建立CSV內容
    const csvRows = [
      headers.map((h) => String(h || "")).join(","),
      ...sanitizedData.map((row) => row.join(",")),
    ];
    const csvContent = csvRows.join("\n");

    // 產生檔名
    const now = new Date();
    const nowString = Utilities.formatDate(
      now,
      "Asia/Taipei",
      "yyyy-MM-dd_HHmm"
    );
    const fileName = `${configs["報名學校代碼"]}StudQuota_${nowString}.csv`;

    // 驗證檔名安全性
    if (!/^[a-zA-Z0-9_-]+\.csv$/.test(fileName)) {
      throw new Error("(exportCsv)檔名包含不安全字符");
    }

    // 取得試算表所在的資料夾
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = spreadsheet.getId();
    const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
    const parentFolder = spreadsheetFile.getParents().hasNext()
      ? spreadsheetFile.getParents().next()
      : DriveApp.getRootFolder();

    // 建立CSV檔案
    const blob = Utilities.newBlob(csvContent, CSV_MIME_TYPE, fileName);
    const file = parentFolder.createFile(blob);

    // 設定檔案權限
    file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getDownloadUrl();
    Logger.log(
      "(exportCsv)CSV 檔案已建立：%s (%d 列資料)",
      fileName,
      sanitizedData.length
    );

    // 顯示成功訊息
    const ui = SpreadsheetApp.getUi();
    const htmlOutput = HtmlService.createHtmlOutput(
      `
            <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 400px;">
                <h3 style="color: #4CAF50; margin-top: 0;">✓ CSV 檔案建立成功！</h3>
                <p><strong>檔案名稱：</strong>${fileName}</p>
                <p><strong>資料筆數：</strong>${sanitizedData.length} 筆</p>
                <div style="margin: 20px 0;">
                    <a href="${fileUrl}" target="_blank" download 
                       style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                              color: white; text-decoration: none; border-radius: 4px;">
                        📥 下載檔案
                    </a>
                </div>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 0;">
                    檔案已儲存在與試算表相同的資料夾中
                </p>
            </div>
        `
    )
      .setWidth(450)
      .setHeight(280);

    ui.showModalDialog(htmlOutput, "CSV 匯出完成");
    return fileUrl;
  } catch (error) {
    Logger.log("(exportCsv)發生錯誤：%s", error.message);
    logSecurityEvent("export_csv_failed", {
      message: error.message,
    });

    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "匯出失敗",
        `無法建立CSV檔案：${error.message}`,
        ui.ButtonSet.OK
      );
    } catch (uiError) {
      Logger.log("(exportCsv)顯示錯誤訊息失敗：%s", uiError.message);
    }

    return null;
  }
}

/**
 * @description 安全地取得工作表資料
 * @param {Sheet} sheet - 工作表物件
 * @param {Array} requiredHeaders - 必要的標頭欄位
 * @returns {{headers: Array, data: Array}|null} 工作表資料或 null
 */
function getSheetDataSafely(sheet, requiredHeaders = []) {
  try {
    if (!sheet) {
      Logger.log("(getSheetDataSafely)工作表不存在");
      return null;
    }

    const numRows = sheet.getLastRow();
    const numCols = sheet.getLastColumn();

    // 檢查工作表大小
    if (numRows > MAX_SHEET_ROWS || numCols > 100) {
      Logger.log(
        "(getSheetDataSafely)工作表過大：%d 列 %d 欄",
        numRows,
        numCols
      );
      return null;
    }

    if (numRows === 0 || numCols === 0) {
      Logger.log("(getSheetDataSafely)工作表為空");
      return { headers: [], data: [] };
    }

    // 取得標頭
    const headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];

    // 驗證必要標頭
    if (requiredHeaders.length > 0) {
      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header)
      );
      if (missingHeaders.length > 0) {
        Logger.log(
          "(getSheetDataSafely)工作表缺少必要標頭：%s",
          missingHeaders.join(", ")
        );
        return null;
      }
    }

    // 取得資料（如果有的話）
    let data = [];
    if (numRows > 1) {
      data = sheet.getRange(2, 1, numRows - 1, numCols).getValues();
    }

    Logger.log(
      "(getSheetDataSafely)成功讀取工作表 %s：%d 列資料",
      sheet.getName(),
      data.length
    );
    return { headers, data };
  } catch (error) {
    Logger.log("(getSheetDataSafely)讀取工作表時發生錯誤：%s", error.message);
    return null;
  }
}

/**
 * @description 驗證使用者電子郵件
 * @param {string} email - 電子郵件地址
 * @returns {boolean} 是否為有效的電子郵件
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (
    typeof email === "string" &&
    email.length > 0 &&
    email.length <= 100 &&
    emailRegex.test(email)
  );
}

/**
 * @description 將 email 轉換為安全的快取鍵值
 * @param {string} email - 電子郵件地址
 * @returns {string} 安全的快取鍵值
 */
function getSafeKeyFromEmail(email) {
  if (!email || typeof email !== "string") {
    return "";
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) return "";
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    normalized,
    Utilities.Charset.UTF_8
  );
  const hex = digest
    .map((byte) => (byte < 0 ? byte + 256 : byte))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `u_${hex.slice(0, 24)}`;
}
