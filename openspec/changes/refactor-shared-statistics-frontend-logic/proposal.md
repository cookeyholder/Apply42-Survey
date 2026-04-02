## Why

目前學生端與老師端的統計前端邏輯在 `index.html` 與 `teacherView.html` 重複度高，任何修正都需要雙處同步，已經在 PR #8 過程中造成回歸與維護風險。現在需要以可回退、可驗證的方式抽出共用邏輯，降低重複與未來改動成本。

## What Changes

- 建立統計前端共用模組檔案（例如 `statisticsShared.html`），集中管理統計頁的狀態、事件綁定與渲染函式。
- 將學生端與老師端原本重複的統計腳本替換為共用初始化呼叫，保留兩端既有 UI 與資料流程行為。
- 明確定義共用模組的初始化契約（初始化時機、必要 DOM 節點、錯誤處理責任）。
- 增加防回歸檢核：避免腳本被插入錯誤區塊（如 `<style>`）、避免舊監聽器重複綁定、避免 tab 切換時重複載入。
- 文件補充：說明共用模組邊界、可擴充方式與回退策略。

## Capabilities

### New Capabilities
- `statistics-shared-frontend-module`: 提供學生端與老師端可共用、可初始化、可安全注入的統計前端模組能力。

### Modified Capabilities
- 無。

## Impact

- Affected code:
  - `index.html`
  - `teacherView.html`
  - `statisticsShared.html`（新建）
  - `README.md`（補充說明）
- Affected systems:
  - Google Apps Script `HtmlService` 模板載入與腳本注入順序
  - 統計頁籤事件生命週期（Bootstrap tab shown）
- 風險控制：
  - 以最小差異逐步替換，保留現有後端 API（`getStatisticsSummaryData` / `getStatisticsGroupDetail`）不變
  - 提供回退步驟，若共用模組載入失敗可快速回復雙檔內嵌版本