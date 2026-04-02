# Implementation Notes

## 欄位與資料契約盤點

- 來源工作表：`考生志願列表`
- 必要欄位：`是否參加集體報名`、`報考群(類)代碼`、`報考群(類)名稱`
- 志願欄位：
  - 代碼：`志願1代碼` 或 `志願1校系代碼`（向下推導）
  - 名稱：`志願1校系名稱`（向下推導）
- 語意化輸出欄位：`choiceCode`、`choiceName`、`choiceLabel`

## 完成功能

- 新增後端摘要 API：`getStatisticsSummaryData`
- 新增後端群類分頁 API：`getStatisticsGroupDetail(groupName, page, pageSize)`
- 新增版本與時間欄位：`version`、`generatedAt`
- 新增效能預算 API：`getStatisticsPerformanceConfig`
- 學生端/老師端統計頁改為：
  - 首屏先載摘要
  - 切群類再載單群類明細
  - Top N 長條圖 + 明細表
  - `展開更多（下一頁）`

## 效能預算基準

- 首屏可見時間目標：1500ms
- 單次 payload 建議上限：120000 bytes
- 渲染節點控制門檻：300
- 預設 Top N：10

## 功能驗證案例（4.1）

1. 首次切到統計頁時，先出現摘要卡。
2. 未選群類時顯示各群類摘要，不載全量明細。
3. 選擇特定群類後，僅載該群類明細。
4. 顯示項目包含 `校系代碼 + 校系名稱`。
5. 摘要與明細顯示相同 `version`。

## 效能驗證案例（4.2）

1. 摘要回應 payload 大小未超過 120000 bytes。
2. 群類分頁回應 payload 大小未超過 120000 bytes。
3. 超標時 Logger 會輸出警示訊息。
4. 明細多頁時頁面可互動，無整頁凍結。

## 漸進上線與觀測（4.3）

1. 先於測試資料環境驗證摘要/明細 API。
2. 觀測指標：
   - 首屏載入耗時
   - 明細載入耗時
   - 錯誤率（API error）
   - payload 超標次數（Logger）
3. 確認穩定後再作為預設統計流程。

## 回滾方案（4.4）

1. 前端回切為舊流程：呼叫 `getRawStatisticsData` + 清單渲染。
2. 後端保留既有 `getRawStatisticsData` 與 `getUniqueGroupNames`，可直接切回。
3. 先清除快取，再重新整理頁面驗證回滾結果。
