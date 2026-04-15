## MODIFIED Requirements

### Requirement: 前端動態內容輸出必須防止注入
系統在顯示設定值、錯誤訊息與動態文字時 SHALL 採用安全輸出策略，避免未轉義內容直接注入 HTML；後端產生的 HTML 通知內容 SHALL 採用 escape-then-allowlist 策略而非黑名單正規表達式進行過濾。

#### Scenario: 設定值輸出到導覽列與頁尾
- **WHEN** 前端載入學校名稱與系統名稱等設定值
- **THEN** 系統必須以安全方式輸出文字，且不得執行任何嵌入腳本

#### Scenario: 錯誤訊息顯示
- **WHEN** 後端回傳錯誤訊息給前端
- **THEN** 前端必須以 `textContent` 設定（而非 `innerHTML` 插值）呈現錯誤文字內容，確保任何含 HTML 字元的錯誤訊息均被瀏覽器視為純文字

#### Scenario: 通知欄位 HTML 過濾
- **WHEN** 系統需要對管理員輸入的通知內容進行 HTML 清理
- **THEN** 系統必須先轉義所有 HTML 特殊字元（`&`, `<`, `>`, `"`, `'`），再選擇性還原安全白名單 tag（`<br>`、`<b>`/`</b>`、`<strong>`/`</strong>`、`<em>`/`</em>`、`<i>`/`</i>`），不得使用黑名單正規表達式進行過濾

### Requirement: 伺服端請求處理必須具備穩定回傳與作用域隔離
系統在處理 `doGet` 與 `doPost` 時 SHALL 避免隱含全域狀態，對未知角色或異常路徑提供明確回應，且錯誤回應中 SHALL NOT 揭露內部實作細節（如 stack trace）給前端使用者。

#### Scenario: doPost 建立提交紀錄
- **WHEN** 學生送出志願資料並建立日誌紀錄
- **THEN** 紀錄物件必須使用區域作用域宣告，且不影響其他請求上下文

#### Scenario: doGet 遇到未知使用者角色
- **WHEN** 使用者資料存在但角色不屬於已知角色集合
- **THEN** 系統必須回傳可辨識的錯誤頁面，而非空回應

#### Scenario: doGet 發生未預期錯誤
- **WHEN** `doGet` 在處理過程中拋出任何未捕獲例外
- **THEN** 前端僅顯示通用錯誤訊息（不含 stack trace、檔案路徑或內部變數值），完整錯誤詳情僅記錄於 `Logger.log`

---

## ADDED Requirements

### Requirement: 統計快照端點必須具備角色授權控制
系統的統計快照資料存取函式 SHALL 在返回任何資料前驗證呼叫者角色，且 SHALL NOT 允許學生角色透過 RPC 直接取得完整統計快照。

#### Scenario: 老師角色存取統計快照
- **WHEN** 老師角色呼叫 `getStatisticsSnapshot()`
- **THEN** 系統正常執行並回傳統計快照資料

#### Scenario: 學生角色嘗試存取統計快照
- **WHEN** 學生角色透過 `google.script.run.getStatisticsSnapshot()` 呼叫統計快照函式
- **THEN** 系統必須拋出授權例外，前端收到失敗回調，不得回傳任何統計資料

#### Scenario: 統計快照的角色保護與其他統計函式一致
- **WHEN** `getStatisticsSnapshot()`、`getStatisticsSummaryData()` 與 `getStatisticsGroupDetail()` 接受相同角色的請求
- **THEN** 三個函式的角色驗證邏輯必須使用相同的 role allowlist 和相同的 `getAuthorizedUserContext()` 呼叫模式

### Requirement: 結果通知郵件必須具備基本去重保護
系統在寄送結果通知郵件時 SHALL 避免在短時間窗口內對相同收件人寄出內容相同的郵件，以防止速率限制窗口內的重複觸發。

#### Scenario: 首次寄送通知郵件
- **WHEN** 系統首次為某收件人寄送含特定志願清單的結果通知
- **THEN** 系統必須寄出郵件，並在 CacheService 記錄該寄送的內容 hash（TTL 10 分鐘）

#### Scenario: 10 分鐘內重複觸發相同內容的寄信
- **WHEN** 相同收件人與相同志願清單在 10 分鐘內再次觸發寄信流程
- **THEN** 系統必須偵測到去重快取命中，跳過寄信並直接回傳，不重複呼叫郵件 API

#### Scenario: 10 分鐘後的相同內容寄信
- **WHEN** 去重快取 TTL 到期後觸發相同內容的寄信
- **THEN** 系統視為新請求並正常寄出（此為預期行為，不視為重複）
