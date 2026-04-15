## 1. 高優先修補：伺服端授權與資訊外洩（P0）

- [ ] 1.1 開啟 `statistics.gs`，在 `getStatisticsSnapshot()` 函式第一行加入 `getAuthorizedUserContext(["老師", "管理"], "statistics.snapshot.read")`（與 `getStatisticsSummaryData()` 呼叫模式一致）
- [ ] 1.2 搜尋所有呼叫 `getStatisticsSnapshot` 的程式碼路徑（含 HTML 檔案），確認每個呼叫端均在老師/管理角色情境下，不存在學生角色合法呼叫路徑
- [ ] 1.3 開啟 `main.gs`，找到 `doGet` catch 區塊中的 `<details>` 標籤段落，移除整個 `<details>...</details>` 揭露 `err.stack` 的 HTML 區塊，確保只保留通用錯誤訊息給前端
- [ ] 1.4 確認 `main.gs` 的 `doGet` 錯誤路徑有呼叫 `Logger.log(err)` 或等效記錄確保 stack trace 保留在後端日誌

## 2. 中優先修補：前端 XSS 防護（P1-A）

- [ ] 2.1 開啟 `teacherView.html`，找到 L463 附近將 `${error.message}` 插入 `innerHTML` 的程式碼，重構為：先取得（或建立）DOM 元素，再用 `errorElement.textContent = error.message` 設定文字
- [ ] 2.2 開啟 `teacherView.html`，找到 L554 附近的第二處 `${error.message}` 插入 `innerHTML`，同上方式改為 `textContent` 設定
- [ ] 2.3 開啟 `index.html`，找到 L682 附近的 `${pageDataError.message}` 插入 `innerHTML`，改為 `textContent` 設定

## 3. 中優先修補：後端 HTML 清理策略（P1-B）

- [ ] 3.1 開啟 `retrieveData.gs`，找到 `sanitizeHtml()` 函式（L743-760），移除現有所有黑名單 regex 邏輯
- [ ] 3.2 實作 escape-then-allowlist 邏輯：先用字元替換轉義 `&`→`&amp;`、`<`→`&lt;`、`>`→`&gt;`、`"`→`&quot;`、`'`→`&#39;`
- [ ] 3.3 接續 3.2，用正規表達式還原白名單 tag：`&lt;br&gt;`→`<br>`、`&lt;b&gt;`/`&lt;/b&gt;`→`<b>`/`</b>`、`&lt;strong&gt;`/`&lt;/strong&gt;`→`<strong>`/`</strong>`、`&lt;em&gt;`/`&lt;/em&gt;`→`<em>`/`</em>`、`&lt;i&gt;`/`&lt;/i&gt;`→`<i>`/`</i>`
- [ ] 3.4 以現有通知範本的內容範例測試新版 `sanitizeHtml()`，確認一般換行與粗體格式保留正確，不含任何 `<script>` 或事件屬性可通過

## 4. 中優先修補：郵件去重（P2）

- [ ] 4.1 開啟 `mail.gs`，在 `sendResultNotificationEmail()` 函式頂端計算去重 hash：`const dedupKey = 'mail_dedup_' + sha256Hex(recipientEmail + JSON.stringify([...choices].sort()))`
- [ ] 4.2 在計算 hash 後，查詢 CacheService：`if (CacheService.getScriptCache().get(dedupKey)) return;`，命中時直接回傳不寄信
- [ ] 4.3 在成功呼叫寄信 API 後，寫入去重快取：`CacheService.getScriptCache().put(dedupKey, '1', 600)`（TTL 600 秒）
- [ ] 4.4 確認 `sha256Hex()` 工具函式已在 `utilities.gs` 定義且可在 `mail.gs` 中使用（GAS 全域範疇，通常不需 import）

## 5. 驗證與整合確認

- [ ] 5.1 以老師角色測試統計頁面（`getStatisticsSnapshot`、`getStatisticsSummaryData`、`getStatisticsGroupDetail` 均可正常使用）
- [ ] 5.2 確認無法以學生角色帳號呼叫 `google.script.run.getStatisticsSnapshot()`（應收到失敗回調）
- [ ] 5.3 在 `doGet` 模擬拋出例外，確認前端顯示通用錯誤訊息且瀏覽器開發工具中不可見 stack trace
- [ ] 5.4 在瀏覽器主控台確認三處 error.message 顯示路徑（teacherView 2 處、index.html 1 處）不執行 HTML（可用 `<img src=x>` 作為測試訊息）
- [ ] 5.5 確認 `sanitizeHtml()` 輸出通知內容格式正確（換行、粗體保留）且 `<script>alert(1)</script>` 被完整轉義
- [ ] 5.6 確認郵件去重在 10 分鐘內不重複寄出（可用 Logger.log 驗證快取命中日誌）
