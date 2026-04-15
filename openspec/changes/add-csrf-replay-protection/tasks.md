## 1. 防護機制設計與實作

- [x] 1.1 實作 CSRF token 產生、下發與驗證流程
- [x] 1.2 實作 nonce 一次性驗證與 TTL 管理
- [x] 1.3 導入提交端點來源檢查（Origin/Referer）

## 2. 提交流程整合

- [x] 2.1 前端提交流程加入 token/nonce 攜帶
- [x] 2.2 後端錯誤碼與使用者提示標準化
- [x] 2.3 加入提交節流策略（帳號/IP/端點）

## 3. 驗證

- [x] 3.1 手動驗證 CSRF、重放、偽造來源請求皆會被拒絕
- [x] 3.2 驗證合法提交成功率與體驗
- [x] 3.3 手動驗證資料未被重放請求覆寫

## 4. 分支與 PR 流程

- [x] 4.1 確認 `add-server-side-rbac-guards` 已併入 `main`
- [x] 4.2 由最新 `main` 建立本子提案專屬開發分支
- [x] 4.3 開發完成後執行 `$code-review-and-quality` 與 `$security-and-hardening`
- [ ] 4.4 開啟 PR 並執行 `$review-pr-3x`，完成所有審查修正後 `$squash-pr`

## 5. 高頻提交與 TDD

- [x] 5.1 以高頻小批次提交方式完成 CSRF/重放防護（每 commit 可驗證）
- [x] 5.2 先撰寫 CSRF/nonce/重放失敗測試，再實作防護邏輯
- [x] 5.3 維持測試紅綠重構循環，並記錄測試案例演進
