# 三入口統計一致性驗收矩陣（階段 C）

## 場景 x 頁面

| 場景                 | index.html                 | teacherView.html           | statisticsTemplate.html  | 結果                             |
| -------------------- | -------------------------- | -------------------------- | ------------------------ | -------------------------------- |
| 進入統計頁顯示載入中 | 使用 loadingMessageStats   | 使用 loadingMessageStats   | 使用 loadingMessage      | 一致（皆有 loading 狀態）        |
| 篩選群類             | groupFilterStats           | groupFilterStats           | groupFilter              | 一致（皆為下拉篩選）             |
| 無資料顯示           | 顯示空資料文字             | 顯示空資料文字             | 顯示空資料文字           | 一致                             |
| 錯誤處理             | alert-warning/alert-danger | alert-warning/alert-danger | alert-danger             | 一致（語氣一致，嚴重度略有差異） |
| 展開更多             | `展開更多（下一頁）`       | `展開更多（下一頁）`       | 不適用（全量顯示）       | 已註記合理差異                   |
| 狀態模型             | loading/empty/error/data   | loading/empty/error/data   | loading/empty/error/data | 一致（本次補齊）                 |

## 一致性規則摘要
- 載入中：顯示 spinner 與等待文案。
- 空資料：顯示中性空資料訊息。
- 錯誤：顯示可恢復提示與聯絡管理員建議。
- 篩選：變更條件後立即重新渲染結果。

## 驗收紀錄
- 日期：____
- 測試者：____
- 測試環境：____
- 備註：`statisticsTemplate.html` 未採分頁展開更多，屬產品策略差異。
