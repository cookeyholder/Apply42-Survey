# Change: 優化 GAS 專案執行效能

## Why

目前 GAS 專案在載入頁面時會多次讀取 Google Sheets 資料，且使用 scriptlet 模板語法傳遞資料給前端，導致：
1. 頁面初始載入時間較長
2. 後端重複查詢相同資料  
3. 統計資料需要額外的 `google.script.run` 呼叫載入

## What Changes

- **批次資料讀取**：將 `getConfigs()`、`getOptionData()`、`getLimitOfSchools()` 等函式的試算表讀取操作整合，減少 `SpreadsheetApp` 呼叫次數
- **JSON 資料傳遞**：將後端資料以 `JSON.stringify()` 序列化後，透過單一變數傳遞給 HTML template，取代多個 scriptlet 變數
- **預載統計資料**：將統計資料整合到初始頁面載入，减少 `google.script.run` 的非同步請求
- **優化快取策略**：擴展現有的 `cache.gs` 機制，預先載入常用資料並延長快取時效

## Impact

- **Affected specs**: 無現有 specs（首次建立效能相關規範）
- **Affected code**:
  - `main.gs`: `renderStudentPage()`, `renderTeacherPage()`
  - `retrieveData.gs`: `getConfigs()`, `getOptionData()`, `getLimitOfSchools()`
  - `cache.gs`: 新增預載機制
  - `index.html`, `teacherView.html`: 修改資料接收方式
