## Why

目前資料寫入與快取存在完整性風險，包括非唯一列命中、非法志願代碼寫入、快取鍵碰撞導致跨帳號混淆。需要提升資料一致性與快取身份安全。

## What Changes

- 對提交寫入增加唯一列命中斷言（命中數必須等於 1）。
- 志願代碼改為伺服器端 allowlist 驗證（依群類與規則）。
- 快取 key 改為穩定不可碰撞的雜湊策略。
- 增加一致性失敗與碰撞事件監控。

## Delivery Workflow Constraints

- 本子提案必須使用獨立開發分支。
- 開發完成後，必須執行 `$code-review-and-quality` 與 `$security-and-hardening`。
- 實作完成後必須 open PR，並執行 `$review-pr-3x`，確認審查意見修正完成後再 `$squash-pr`。
- 需在 `add-csrf-replay-protection` 已併入 `main` 後，從最新 `main` 分支開發。
- 本子提案開發採高頻提交策略，避免大型難審查 commit。
- 本子提案採 TDD 流程，先建立失敗測試再實作修補。

## Capabilities

### New Capabilities
- `submission-data-integrity-and-cache-safety`: 提交資料一致性與快取身份安全能力。

### Modified Capabilities
- 無

## Impact

- Affected code: `utilities.gs`, `retrieveData.gs`, `cache.gs`, `main.gs`
- Affected systems: 寫入流程、快取命名策略、資料驗證
- Dependencies: 建議在 RBAC/CSRF 之後實作
