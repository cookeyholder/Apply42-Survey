# 實作驗證紀錄

## 批次 1：統計索引修補

### 驗證案例 A（代碼欄位模式）
- 測試資料來源：高雄高工四技二專甄選入學志願調查系統_2026年版.ods
- 工作表：考生志願列表
- 驗證結果：
  - choiceStartHeader = 志願1代碼
  - nextHeader = 志願2代碼
  - computedStep = 1
- 結論：目前資料結構為連續欄位，修正後邏輯可正確以 step=1 讀取志願代碼欄位。

### 驗證案例 B（名稱欄位回退模式）
- 驗證方式：程式碼層級 fallback 路徑檢查
- 條件：當「志願1代碼」與「志願1校系代碼」不存在時，改用「志願1校系名稱」起始欄位
- 結論：修正後可切換到名稱欄位路徑，並沿用相同步長偵測機制。

## 批次 2：前端安全輸出與錯誤渲染

### 驗證案例 C（高風險輸出路徑）
- 檢查方式：靜態搜尋 `index.html`、`teacherView.html`
- 目標關鍵字：`navBrand.innerHTML`、`footerText.innerHTML`、錯誤區塊 `< div class="alert`
- 結論：上述高風險或無效模板字串已移除，改為 DOM API 與 `textContent` 組裝。

## 批次 3：伺服端穩定性

### 驗證案例 D（作用域與回傳路徑）
- 檢查方式：靜態搜尋 `main.gs`
- 驗證點：
  - `record` 已改為區域宣告
  - `renderStudentPage(user, configs, true)` 不再使用賦值副作用
  - `doGet` 已加入未知角色 fallback 回應
- 結論：原先隱含全域狀態與空回應風險已排除。

## 批次 4：效能與快取

### 驗證案例 E（學生資料讀取）
- 檢查方式：靜態搜尋 `retrieveData.gs`
- 驗證點：`getOptionData` 不再使用整表 `getRange(...lastRow, lastColumn)` 讀取；改為「讀標頭 + 信箱欄定位 + 單列讀取」。
- 結論：單次請求的讀取量已下降至必要欄位/列範圍。

### 驗證案例 F（統計快取）
- 檢查方式：靜態搜尋 `statistics.gs`
- 驗證點：`STATISTICS_RAW_DATA` 與 `STATISTICS_GROUP_NAMES` 已恢復 `getCacheData` / `setCacheData(..., 1200)`。
- 結論：統計與群類查詢已恢復 20 分鐘快取策略。