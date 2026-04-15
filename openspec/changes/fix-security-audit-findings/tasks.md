## 1. 高優先修補：伺服端授權與資訊外洩（P0）

- [x] 1.1 開啟 `statistics.gs`，在 `getStatisticsSnapshot()` 函式第一行加入 `getAuthorizedUserContext(["老師", "管理"], "statistics.snapshot.read")`（與 `getStatisticsSummaryData()` 呼叫模式一致）
- [x] 1.2 搜尋所有呼叫 `getStatisticsSnapshot` 的程式碼路徑（含 HTML 檔案），確認每個呼叫端均在老師/管理角色情境下，不存在學生角色合法呼叫路徑
- [x] 1.3 開啟 `main.gs`，找到 `doGet` catch 區塊中的 `<details>` 標籤段落，移除整個 `<details>...</details>` 揭露 `err.stack` 的 HTML 區塊，確保只保留通用錯誤訊息給前端
- [x] 1.4 確認 `main.gs` 的 `doGet` 錯誤路徑有呼叫 `Logger.log(err)` 或等效記錄確保 stack trace 保留在後端日誌

## 2. 中優先修補：前端 XSS 防護（P1-A）

- [x] 2.1 開啟 `teacherView.html`，找到 L463 附近將 `${error.message}` 插入 `innerHTML` 的程式碼，重構為：先取得（或建立）DOM 元素，再用 `errorElement.textContent = error.message` 設定文字
- [x] 2.2 開啟 `teacherView.html`，找到 L554 附近的第二處 `${error.message}` 插入 `innerHTML`，同上方式改為 `textContent` 設定
- [x] 2.3 開啟 `index.html`，找到 L682 附近的 `${pageDataError.message}` 插入 `innerHTML`，改為 `textContent` 設定

## 3. 中優先修補：後端 HTML 清理策略（P1-B）

- [x] 3.1 開啟 `retrieveData.gs`，找到 `sanitizeHtml()` 函式（L743-760），移除現有所有黑名單 regex 邏輯
- [x] 3.2 實作 escape-then-allowlist 邏輯：先用字元替換轉義 `&`→`&amp;`、`<`→`&lt;`、`>`→`&gt;`、`"`→`&quot;`、`'`→`&#39;`
- [x] 3.3 接續 3.2，用正規表達式還原白名單 tag：`&lt;br&gt;`→`<br>`、`&lt;b&gt;`/`&lt;/b&gt;`→`<b>`/`</b>`、`&lt;strong&gt;`/`&lt;/strong&gt;`→`<strong>`/`</strong>`、`&lt;em&gt;`/`&lt;/em&gt;`→`<em>`/`</em>`、`&lt;i&gt;`/`&lt;/i&gt;`→`<i>`/`</i>`
- [x] 3.4 以現有通知範本的內容範例測試新版 `sanitizeHtml()`，確認一般換行與粗體格式保留正確，不含任何 `<script>` 或事件屬性可通過

## 4. 中優先修補：郵件去重（P2）

- [x] 4.1 開啟 `mail.gs`，在 `sendResultNotificationEmail()` 函式頂端計算去重 hash：`const dedupKey = 'mail_dedup_' + sha256Hex(recipientEmail + JSON.stringify([...choices].sort()))`
- [x] 4.2 在計算 hash 後，查詢 CacheService：`if (CacheService.getScriptCache().get(dedupKey)) return;`，命中時直接回傳不寄信
- [x] 4.3 在成功呼叫寄信 API 後，寫入去重快取：`CacheService.getScriptCache().put(dedupKey, '1', 600)`（TTL 600 秒）
- [x] 4.4 確認 `sha256Hex()` 工具函式已在 `utilities.gs` 定義且可在 `mail.gs` 中使用（GAS 全域範雇，通常不需 import）

## 5. 驗證與整合確認

- [ ] 5.1 以老師角色驗證統計頁面可正常載入與互動
	- 以老師帳號登入試算表，從功能表開啟「各志願選填人數統計」。
	- 確認統計 modal 可正常開啟，且摘要、群類下拉選單與明細區塊皆有內容。
	- 切換任一群類，確認 `getStatisticsSnapshot`、`getStatisticsSummaryData`、`getStatisticsGroupDetail` 都能正常回應且畫面無錯誤。
	- 驗收標準：頁面無授權錯誤、無空白畫面、摘要與明細可正常顯示。

- [ ] 5.2 驗證學生無法直接呼叫完整統計快照
	- 以學生帳號登入 Web App，開啟統計相關頁面。
	- 在瀏覽器開發工具主控台或頁面上下文中直接觸發 `google.script.run.getStatisticsSnapshot()`。
	- 確認失敗回調會被觸發，且不會回傳完整統計快照資料。
	- 驗收標準：學生無法取得完整快照，畫面只顯示失敗回調或權限錯誤訊息。

- [ ] 5.3 驗證 `doGet` 錯誤路徑只顯示通用訊息
	- 暫時讓 `doGet` 在 `try` 區塊中拋出例外並部署。
	- 直接開啟 Web App URL，確認前端只顯示通用錯誤訊息。
	- 打開瀏覽器開發工具，確認畫面與主控台都不會出現可直接曝光的 stack trace。
	- 驗收標準：對外只顯示通用錯誤訊息，無內部堆疊資訊外洩。

- [ ] 5.4 驗證三處 `error.message` 顯示路徑不會執行 HTML
	- 分別在 `index.html` 與 `teacherView.html` 的三個錯誤顯示路徑注入測試字串，例如 `<img src=x onerror=alert(1)>`。
	- 重新觸發錯誤流程，確認畫面只把字串當文字顯示。
	- 確認不會出現圖片載入、`alert()` 彈出或 DOM 被插入 HTML 的情況。
	- 驗收標準：三處輸出皆以純文字呈現，不執行任何 HTML 或事件處理器。

- [ ] 5.5 驗證 `sanitizeHtml()` 保留格式並完整轉義危險內容
	- 在後端「參數設定」的說明欄位放入一段測試內容，包含換行、粗體、`<span id=endTimeBox>`、`<a href="https://...">` 與 `<script>alert(1)</script>`。
	- 重新載入前端通知區塊，確認換行與粗體仍保留，連結可正常渲染。
	- 確認 `<script>` 內容會被完整轉義，不會執行，也不會破壞通知結構。
	- 驗收標準：格式保留、危險 HTML 轉義、`<a>` 與 `<span>` 的安全屬性可正常顯示。

- [ ] 5.6 驗證郵件去重在 10 分鐘內不會重複寄送
	- 以相同收件人與相同志願資料連續觸發兩次寄信流程。
	- 第一次確認可正常寄出，第二次確認不會再次寄送。
	- 檢查 Logger.log 是否出現郵件去重命中的紀錄，並確認信箱只收到一封。
	- 若要驗證 TTL，到期後再觸發一次，確認 10 分鐘後會重新允許寄送。
	- 驗收標準：TTL 內不重複寄信，TTL 到期後可正常再次寄出。