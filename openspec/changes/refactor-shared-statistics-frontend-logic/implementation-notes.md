## PR 描述建議（可直接貼上）

### 變更摘要
- 抽出學生端與老師端統計共用邏輯至 `statisticsShared.html`
- `index.html` / `teacherView.html` 改為載入共用模組並呼叫 `initProgressiveStatisticsTab()`
- 移除舊統計 tab 重複監聽與重複函式，降低維護成本與回歸風險

### 回退步驟
1. 將 `index.html` 與 `teacherView.html` 中 `statisticsShared.html` include 與 `initProgressiveStatisticsTab()` 呼叫移除。
2. 回復雙檔內嵌統計腳本版本（可直接回到前一個穩定 commit）。
3. 驗證以下 4 個場景：
   - 首次開啟統計頁可載入摘要
   - 群類切換可正確載入明細
   - 展開更多可持續分頁
   - 錯誤提示可正常顯示

### 已知限制
- `statisticsTemplate.html` 仍為舊流程（全量載入），尚未納入本次共用模組。