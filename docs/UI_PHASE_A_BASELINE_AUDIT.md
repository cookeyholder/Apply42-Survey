# 階段 A 基準樣式差異盤點

## 範圍
- index.html（學生頁）
- teacherView.html（老師頁）
- statisticsTemplate.html（統計模板）

## 卡片樣式盤點（對應任務 1.1）
| 項目 | index.html | teacherView.html | statisticsTemplate.html | 結果 |
|---|---|---|---|---|
| 圓角 | `12px` | `12px` | `12px` | 一致 |
| 基礎陰影 | `0 4px 6px rgba(0,0,0,0.05)` | `0 4px 6px rgba(0,0,0,0.05)` | `0 4px 6px rgba(0,0,0,0.05)` | 一致 |
| hover 陰影 | `0 12px 24px rgba(0,0,0,0.1)` | `0 12px 24px rgba(0,0,0,0.1)` | `0 8px 15px rgba(0,0,0,0.08)` | 已保留統計頁較輕量（內容密度高） |
| 頂部強調線 | 有（漸層） | 有（本次補齊） | 有（本次補齊） | 一致 |

## 按鈕樣式盤點（對應任務 1.3）
| 項目 | index.html | teacherView.html | statisticsTemplate.html | 結果 |
|---|---|---|---|---|
| 主要按鈕圓角 | `8px` | `8px` | 主要無送出按鈕 | 一致/不適用 |
| 主要按鈕 hover | 上移 + 陰影 | 上移 + 陰影 | 不適用 | 一致/不適用 |
| 停用態表現 | 由 JS 控制 disabled + 文案 | 由現有流程控制 | 不適用 | 一致策略 |

## 表單樣式盤點（對應任務 1.5）
| 項目 | index.html | teacherView.html | statisticsTemplate.html | 結果 |
|---|---|---|---|---|
| 輸入框/下拉圓角 | `8px` | `8px` | `8px` | 一致 |
| focus ring | 藍色柔和光暈 | 藍色柔和光暈 | 藍色柔和光暈 | 一致 |
| 錯誤樣式 | 新增 `is-invalid` + `invalid-feedback` | 目前無同型態表單驗證流程 | 篩選器僅提示錯誤區塊 | 合理差異 |

## 狀態區塊語氣盤點（對應任務 1.7）
- 載入中：三頁皆以中性語氣提示「正在載入」。
- 錯誤：統一為「請稍後再試或聯絡系統管理員」語氣。
- 已截止：學生頁與老師頁皆有明確紅色警示與不可操作狀態。
- 空資料：統計頁維持「目前尚無符合條件資料」語氣。

## 倒數區盤點（對應任務 1.8）
- 學生頁為文字化倒數區塊樣式。
- 老師頁本次改為同一組 `countdown-container/countdown-item` 樣式。
- 已截止狀態改為同級警示風格（alert warning + danger 文字）。

## 驗證回饋規則（對應任務 1.9, 1.10, 1.11）
- 欄位層：對重複志願與超上限欄位加入 `is-invalid` 與 `invalid-feedback`。
- 頁首摘要層：於志願表單上方顯示錯誤摘要清單（去重後訊息）。
- 送出按鈕層：
  - 無志願時：停用，文案「請至少選擇一個志願」
  - 有錯誤時：停用，文案「請先修正志願錯誤」
  - 可送出時：啟用，文案「確定送出報名意願和志願選擇」

## 回退步驟（對應任務 1.15）
1. 還原 `index.html` 驗證邏輯到前版（移除 `validateDepartmentChoices` 相關區塊）。
2. 還原 `teacherView.html` 倒數樣式函式到文字版顯示。
3. 還原 `statisticsTemplate.html` 的卡片頂部強調線與錯誤 alert class 設定。
4. 重新檢查：
   - 學生頁可提交流程
   - 老師頁倒數計時顯示
   - 統計頁錯誤提示
