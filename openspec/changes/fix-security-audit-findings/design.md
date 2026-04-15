## Context

Apply42-Survey 是部署在 Google Apps Script（GAS）平台的 Web App，提供高中生填寫大學志願偏好的問卷功能。後端以 `doGet` / `doPost` 進入點接受請求，透過 `getAuthorizedUserContext()` 進行 RBAC 驗證，重要操作以 CSRF nonce + LockService 防護，速率限制使用 CacheService。

2026-04-16 安全審查報告指出共 6 個漏洞：

| ID | 嚴重度 | 位置 | 描述 |
|----|--------|------|------|
| N-1 | 高 | `main.gs` doGet catch | `<details>` 揭露完整 err.stack 給前端 |
| N-2 | 高 | `statistics.gs` `getStatisticsSnapshot()` | 無 RBAC guard，學生可直接 RPC 呼叫 |
| N-3 | 中 | `retrieveData.gs` `sanitizeHtml()` | 黑名單 regex 可被 HTML 實體編碼繞過 |
| N-4 | 中 | `mail.gs` `sendResultNotificationEmail()` | 無去重邏輯，速率窗口內可重複寄信 |
| N-5 | 中 | `teacherView.html` L463/L554、`index.html` L682 | `${error.message}` 直接插入 innerHTML |
| N-6 | 低 | `securityRuntime.gs` L178-190 | Origin mismatch 僅記錄不拒絕 |

本次 change 修補 N-1 ～ N-5（均有明確不安全行為），N-6 列入非目標。

---

## Goals

1. **消除 stack trace 資訊外洩（N-1）**：`doGet` 錯誤路徑移除 `<details>` 堆疊展示，前台只呈現通用訊息，完整 stack trace 保留在 `Logger.log`。
2. **封鎖 `getStatisticsSnapshot` 未授權存取（N-2）**：函式加入 `getAuthorizedUserContext(["老師","管理"])` 前置斷言，學生角色呼叫時拋出授權錯誤。
3. **堵住 `sanitizeHtml` 繞過路徑（N-3）**：改用 escape-then-allowlist 策略，先轉義所有特殊字元，再選擇性還原安全 tag（`<br>`、`<b>`、`<strong>`、`<em>`、`<i>`）。
4. **防止 `error.message` XSS（N-5）**：前端三處（`teacherView.html` 2 處、`index.html` 1 處）改以 `element.textContent` 設定錯誤文字，不再使用 innerHTML template literal。
5. **減少郵件重複寄送（N-4）**：以收件人 + 志願清單計算 SHA-256 hash（透過現有 `sha256Hex()` 工具），10 分鐘 TTL 去重，同一 hash 內不重複觸發。

---

## Non-Goals

- **N-6 強制拒絕 Origin mismatch**：GAS Web App 無法自訂 CORS response，且 `X-Forwarded-For` header 不可信；Origin 驗證目前在 GAS 層已有限，改為硬性拒絕可能誤殺合法請求，本次不處理。
- **TM-03 部署設定強化**：屬 GAS 專案設定層級（Cloud IAP / 存取範圍），不在程式碼修改範圍。
- **`sanitizeHtml` 支援的 tag 集擴充**：僅還原最小安全集，通知欄位若需要其他 tag 應另立變更。
- **郵件去重的持久化**：CacheService TTL 到期後去重記錄消失屬預期行為，不引入 Spreadsheet-based 的永久去重紀錄（Over-engineering）。

---

## Decisions

### D-1：`sanitizeHtml` 改採 escape-then-allowlist

**問題**：黑名單 regex（`/<script>/gi`、`/on\w+=/gi`、`/javascript:/gi`）可被 `oner&#114;or=` 等 HTML 實體編碼形式繞過。

**選項比較**：

| 策略 | 優點 | 缺點 |
|------|------|------|
| 修補黑名單（加更多 pattern） | 改動小 | 難以窮舉所有繞過，維護負擔高 |
| escape-then-allowlist（採用） | 根本消除繞過路徑 | 需定義安全 tag 集 |
| 完全拒絕 HTML（pure text） | 最安全 | 通知欄位目前允許換行/粗體格式 |

**決定**：採 escape-then-allowlist。先用字元替換轉義 `&`, `<`, `>`, `"`, `'`，再用正規表達式還原白名單 tag（`<br>`, `<b>`, `</b>`, `<strong>`, `</strong>`, `<em>`, `</em>`, `<i>`, `</i>`）。

---

### D-2：`getStatisticsSnapshot` RBAC 插入點

**問題**：函式無任何角色驗證，任何 `google.script.run` 呼叫者均可取得完整快照。

**決定**：在函式第一行呼叫 `getAuthorizedUserContext(["老師", "管理"], "statistics.snapshot.read")`。如驗證失敗，`getAuthorizedUserContext` 本身會拋出例外，前端收到失敗回調。此做法與 `getStatisticsSummaryData()` / `getStatisticsGroupDetail()` 的防護模式一致。

---

### D-3：郵件去重的 hash 計算與 TTL 選擇

**問題**：`sendResultNotificationEmail()` 在每次呼叫時直接寄信，速率限制窗口內可寄出多封相同內容。

**決定**：
- hash key = `sha256Hex(recipient + JSON.stringify(sortedChoices))`
- CacheService key 格式：`mail_dedup_${hash}`，TTL = 600 秒（10 分鐘）
- 寄信前查快取：hit → 不寄，直接回傳；miss → 寄信後寫入快取
- 10 分鐘 TTL 選擇理由：與 CSRF token TTL 一致，且在大多數「重複點擊提交」場景（< 60 秒）安全範圍內足夠長。

---

### D-4：前端 error.message XSS 修補策略

**問題**：`${error.message}` 插入 innerHTML 時，若 error.message 含有 HTML 字元（如 `<img src=x onerror=...>`），將執行為 HTML。

**決定**：改用兩步驟：
1. 先建立包裹元素（已在 DOM 中存在）
2. 設定 `errorElement.textContent = error.message`（瀏覽器自動跳脫）

不需引入額外工具函式，每處改動為 1-2 行。

---

## Risks

| 風險 | 可能性 | 影響 | 緩解 |
|------|--------|------|------|
| `sanitizeHtml` 白名單過嚴截斷合法通知格式 | 中 | 低（通知欄由管理員編輯） | 實作後執行一次現有通知範本內容驗證 |
| `getStatisticsSnapshot` 加 RBAC 後某合法呼叫路徑被阻擋 | 低 | 中 | 檢查所有呼叫 `getStatisticsSnapshot` 的程式碼路徑，確認均為老師/管理頁面 |
| 郵件去重 TTL 過短導致重送期間重複寄信 | 低 | 低 | 10 分鐘 TTL 在正常使用場景下足夠 |

---

## Trade-offs

- **N-6 不修**：Origin 驗證強制拒絕會帶來誤殺風險，且 GAS 平台本身不提供可信的 Origin 驗證機制，維持現有記錄行為是合理取捨。
- **郵件去重不做持久化**：CacheService TTL 到期後重複寄信的風險微小（需使用者在 10 分鐘後再次觸發相同送出），引入 Spreadsheet-based 去重記錄複雜度不成比例。
- **`sanitizeHtml` 僅還原最小 tag 集**：通知欄位目前僅需 `<br>`、`<b>`/`<strong>`、`<em>`/`<i>` 等基本格式，白名單保持最小可減少未來誤開 tag 的機率。
