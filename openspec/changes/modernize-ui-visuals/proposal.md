## Why

目前專案雖已完成統計邏輯共用化，但學生頁、老師頁與統計對話框在互動節奏與視覺一致性仍有落差。需要在同一個提案中，依序完成「低風險快速一致化 → 設計系統骨架 → 體驗優先重整」，讓可用性與維護性同步提升。

## What Changes

- 將 UI/UX 改善整合為單一 change，分三個實作階段執行：
	- 階段 A（快速一致化）：統一卡片、按鈕、表單、alert、表格基準樣式與狀態文案，並將阻斷式 alert 改為現代驗證回饋。
	- 階段 B（設計系統骨架）：建立共用 design tokens 與樣式片段，移除三頁重複 token 定義。
	- 階段 C（體驗優先重整）：對齊三個統計入口的互動節奏與狀態處理，降低心智切換成本。
- 明確定義 A→B→C 的實作順序與驗收條件，避免一次大改造成回歸。
- 在志願重複與超上限場景中，改用「欄位內錯誤提示 + 頁首摘要提示 + 送出按鈕狀態化」取代 alert，確保手機與桌機皆可用。

## Capabilities

### New Capabilities
- `visual-style-system`: 提供跨頁一致的視覺 token 與元件樣式基準。
- `statistics-experience-consistency`: 提供三個統計入口一致的互動流程與狀態呈現。

### Modified Capabilities
- 無。

## Impact

- Affected code:
	- `index.html`
	- `teacherView.html`
	- `statisticsTemplate.html`
	- `statisticsShared.html`
	- `README.md`
  - `utilities.gs`（若需補充驗證訊息組裝策略）
- Affected systems:
	- Bootstrap 樣式覆寫策略
	- HtmlService 模板片段注入
	- 統計頁資料載入與狀態顯示流程
- 風險控制：
	- 先做階段 A 的低風險收斂，再進入階段 B/C
	- 每階段皆保留回退步驟與驗收清單
