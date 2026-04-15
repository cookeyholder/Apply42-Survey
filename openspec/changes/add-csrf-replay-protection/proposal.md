## Why

現有提交流程缺乏請求完整性保護，存在 CSRF、重放與機器化濫用風險，可能造成資料被覆寫與系統配額耗盡。需要建立請求防偽與防重放機制。

## What Changes

- 增加 CSRF token 驗證機制。
- 增加一次性 nonce 與重放視窗控制。
- 驗證 `Origin/Referer` 與請求來源合理性。
- 對提交端點加入節流策略，降低濫用風險。

## Delivery Workflow Constraints

- 本子提案必須使用獨立開發分支。
- 開發完成後，必須執行 `$code-review-and-quality` 與 `$security-and-hardening`。
- 實作完成後必須 open PR，並執行 `$review-pr-3x`，確認審查意見修正完成後再 `$squash-pr`。
- 需在 `add-server-side-rbac-guards` 已併入 `main` 後，從最新 `main` 分支開發。
- 本子提案開發採高頻提交策略，避免大型難審查 commit。
- 本子提案採 TDD 流程，先建立失敗測試再實作修補。

## Capabilities

### New Capabilities
- `request-integrity-protection`: 請求防偽、防重放與來源驗證能力。

### Modified Capabilities
- 無

## Impact

- Affected code: `main.gs`（`doPost`）、前端提交流程、快取/狀態保存
- Affected systems: 表單提交、郵件觸發、請求安全
- Dependencies: 建議在 `add-server-side-rbac-guards` 後導入
