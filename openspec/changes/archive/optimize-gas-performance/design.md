## Context

本專案為 Google Apps Script Web 應用程式，使用 Google Sheets 作為資料庫。目前的效能瓶頸包括：

1. **重複的試算表讀取**：每次頁面請求時，`getUserData()`、`getConfigs()`、`getOptionData()` 等函式各自獨立讀取試算表資料
2. **Scriptlet 模板解析**：使用 `<?= ?>` 語法在伺服端多次存取變數，增加 `evaluate()` 時間
3. **分離的統計資料載入**：統計頁籤透過 `google.script.run` 於頁面載入後二次請求

## Goals / Non-Goals

### Goals
- 減少 `SpreadsheetApp.getRange().getValues()` 呼叫次數至少 50%
- 將頁面初始載入時間減少至少 30%
- 保持現有功能不變，確保向後相容

### Non-Goals
- 不改變 UI 外觀或使用者體驗流程
- 不引入新的前端框架
- 不更改資料儲存結構（試算表欄位）

## Decisions

### Decision 1: 批次資料讀取

**What**: 建立 `getAllPageData()` 函式，在單一函式呼叫中取得所有需要的資料

**Why**: 減少 `SpreadsheetApp` 呼叫次數，避免重複讀取相同工作表

**Alternatives considered**:
- ❌ 使用 Sheets API (v4)：需要額外授權設定，增加複雜度
- ✅ 批次讀取 + 記憶體快取：簡單有效，符合 GAS 慣例

### Decision 2: JSON 資料傳遞

**What**: 將所有模板資料整合為單一 JSON 物件，以 `JSON.stringify()` 傳遞

**Why**: 
- 減少 scriptlet 變數數量
- 前端可用 `JSON.parse()` 一次取得所有資料
- 避免 scriptlet 多次序列化開銷

**Implementation**:
```javascript
// Backend
template.pageData = JSON.stringify({
  user: user,
  configs: configs,
  notifications: notifications,
  limitOfSchools: limitOfSchools,
  optionData: optionData
});

// Frontend
const pageData = JSON.parse('<?= pageData ?>');
```

### Decision 3: 預載統計資料

**What**: 在學生頁面初始載入時，一併取得統計資料

**Why**: 減少 `google.script.run` 非同步呼叫，改善切換至統計頁籤的體驗

**Trade-offs**:
- ⬆️ 初始載入資料量增加
- ⬇️ 減少額外網路請求，總體感知速度更快

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| JSON 資料過大 | 頁面載入變慢 | 僅傳遞必要欄位，壓縮資料結構 |
| 快取資料過期 | 顯示舊資料 | 保持現有快取失效機制，必要時手動清除 |
| 程式碼相容性 | 現有功能中斷 | 漸進式重構，保留舊函式直到完全遷移 |

## Migration Plan

1. **Phase 1**: 建立 `getAllPageData()` 批次讀取函式
2. **Phase 2**: 修改 `renderStudentPage()` 使用 JSON 傳遞
3. **Phase 3**: 前端改用 `JSON.parse()` 接收資料
4. **Phase 4**: 整合統計資料預載
5. **Phase 5**: 移除舊的個別資料取得呼叫

**Rollback**: 保留舊函式，若發現問題可快速還原

## Open Questions (已確認)

1. ~~是否需要為老師頁面 (`teacherView.html`) 同步進行優化？~~ → **是，一併優化**
2. ~~統計資料是否需要在背景預先計算並快取？~~ → **是，快取 20 分鐘**
3. 統計資料預載時機 → **初始載入時不預載，切換頁籤時才載入**
4. 錯誤處理策略 → **靜默失敗，點擊頁籤時再嘗試載入**
5. `statisticsTemplate.html` 處理 → **一併優化**
