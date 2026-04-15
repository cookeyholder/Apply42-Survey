## Why

2026-04-16 安全審查報告發現 6 個尚未修補的漏洞，其中 2 個為「高」嚴重度、3 個為「中」嚴重度。這些問題部分源自威脅模型（THREAT_MODEL_AND_REMEDIATION_PLAN.md）中 TM-09、TM-11、TM-13 原本標記「已修補」但實作不完整，部分為全新發現。必須在下一次部署前完成修補，否則資訊外洩與 XSS 風險持續存在。

## What Changes

- **移除 `doGet` 錯誤回應中的 `<details>` 堆疊資訊區塊**（TM-09 補完 / N-1）：前台僅顯示通用錯誤訊息，完整 stack trace 僅保留在 `Logger.log`。
- **為 `getStatisticsSnapshot()` 加入角色保護**（TM-11 補完 / N-2）：函式本身加入 `getAuthorizedUserContext(["老師","管理"], "statistics.snapshot.read")` 斷言，防止學生直接 RPC 呼叫取得完整統計快照。
- **重寫 `sanitizeHtml()` 改用 escape-then-allowlist 策略**（TM-13 補完 / N-3）：移除黑名單 regex，改以先 escape 所有 HTML 特殊字元再選擇性還原安全 tag（`<br>`、`<b>`、`<strong>`、`<em>`），堵住 HTML 實體編碼繞過路徑。
- **修補 `teacherView.html` 與 `index.html` 的 `error.message` XSS**（N-5）：將動態插入 `innerHTML` 的 `error.message` 改為 `textContent` 設定，防止含 HTML 字元的錯誤訊息觸發 XSS。
- **為郵件寄送加入基本去重保護**（N-4）：在 `CacheService` 記錄最近寄信的內容 hash（收件人+志願清單），TTL 10 分鐘，相同 hash 不重複寄信。

## Capabilities

### New Capabilities

無新能力新增。

### Modified Capabilities

- `review-findings-remediation`：補完 TM-09（stack trace 外洩）、TM-11（統計快照無保護）、TM-13（sanitizeHtml 黑名單繞過）三項原本認為已修補但實作不完整的安全需求；新增 N-4（郵件去重）、N-5（error.message XSS）兩項新發現需求的規格。

## Impact

- **`main.gs`**：`doGet` 錯誤處理區塊（移除 `<details>` 堆疊揭露）
- **`statistics.gs`**：`getStatisticsSnapshot()` 加入權限前置宣告
- **`retrieveData.gs`**：`sanitizeHtml()` 函式重寫
- **`mail.gs`**：`sendResultNotificationEmail()` 加入 CacheService 去重邏輯
- **`teacherView.html`**：2 處 `${error.message}` 改用 `textContent`
- **`index.html`**：1 處 `${pageDataError.message}` 改用 `textContent`
- 無 API 破壞性變更；所有修改均為防禦性，對使用者功能透明。
