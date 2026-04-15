## 1. 規劃與對齊

- [x] 1.1 定義父提案與 4 個子提案的責任邊界
- [x] 1.2 建立跨提案依賴順序（P0 優先）
- [x] 1.3 定義共同驗收門檻與回歸測試原則

## 2. 執行治理

- [x] 2.1 建立子提案進度追蹤欄位（狀態、阻塞、風險）
- [x] 2.2 每個子提案完成時更新父提案追蹤狀態
- [x] 2.3 全部子提案完成後執行整體安全回歸檢查

## 3. 分支與 PR 流程治理

- [x] 3.1 為每個子提案建立獨立開發分支並記錄分支名稱
- [x] 3.2 子提案完成後執行 `$code-review-and-quality` 與 `$security-and-hardening`
- [x] 3.3 子提案完成後依序執行 open PR、`$review-pr-3x`、`$squash-pr`
- [x] 3.4 確認前一子提案已併入 `main` 後，才啟動下一子提案分支

## 4. 開發節奏與品質策略治理

- [x] 4.1 建立高頻提交策略規範（小批次、可回滾、每 commit 可驗證）
- [x] 4.2 建立 TDD 規範（先紅燈測試、再實作、再重構）
- [x] 4.3 子提案驗收時檢查 commit 粒度與 TDD 證據（測試演進紀錄）

## 5. 子提案實作順序與驗收清單（依序執行）

- [x] 5.1 實作 `add-server-side-rbac-guards`（Step 1, P0）
- [x] 5.2 驗收 `add-server-side-rbac-guards`
  - [x] 未授權角色不得存取/寫入受保護資源
  - [x] 合法授權流程回歸測試全綠
  - [x] 覆蓋「授權成功/授權失敗/越權存取」測試案例

- [x] 5.3 實作 `add-csrf-replay-protection`（Step 2, P0，需在 5.2 完成後）
- [x] 5.4 驗收 `add-csrf-replay-protection`
  - [x] 缺 token/無效 token/過期 token 一律拒絕
  - [x] 重放（nonce 重複）請求一律拒絕
  - [x] 覆蓋「合法提交/CSRF 攻擊/重放攻擊」測試案例

- [x] 5.5 實作 `add-data-integrity-cache-safety`（Step 3, P1，需在 5.4 完成後）
- [x] 5.6 驗收 `add-data-integrity-cache-safety`
  - [x] A 使用者資料不得寫入 B 使用者上下文
  - [x] 快取鍵隔離可防止跨使用者資料命中
  - [x] 覆蓋「同帳號合法更新/跨帳號污染阻擋/快取隔離」測試案例

- [x] 5.7 實作 `add-security-observability-throttling`（Step 4, P1，需在 5.6 完成後）
- [x] 5.8 驗收 `add-security-observability-throttling`
  - [x] 異常高頻請求可被節流或封鎖
  - [x] 安全事件可追蹤來源、身分、時間序列
  - [x] 覆蓋「正常流量不誤殺/異常流量被限制/告警觸發」測試案例
