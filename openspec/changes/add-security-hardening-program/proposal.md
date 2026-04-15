## Why

目前專案已完成威脅盤點，但修補工作橫跨授權、請求完整性、資料一致性、可觀測性與效能保護，若以單一提案執行會造成範圍過大、驗收困難與風險集中。需要一個父提案統一管理分拆後的小提案、里程碑與驗收門檻。

## What Changes

- 建立安全修補父提案，定義分階段交付策略與治理規則。
- 將安全修補拆分為 4 個可獨立實作與驗收的子提案：
  - `add-server-side-rbac-guards`
  - `add-csrf-replay-protection`
  - `add-data-integrity-cache-safety`
  - `add-security-observability-throttling`
- 定義跨提案的共同完成條件：
  - P0 議題需優先完成
  - 每個子提案需有明確驗收與回歸測試
  - 全部子提案完成後才視為安全強化階段完成

## Delivery Governance Rules

- 每個子提案都必須使用獨立開發分支。
- 每個子提案開發完成後，必須執行 `$code-review-and-quality` 與 `$security-and-hardening` 審查。
- 每個子提案實作完成後，必須先 open PR，再執行 `$review-pr-3x`，確認審查意見全數處理完畢後，再執行 `$squash-pr`。
- 子提案採序列式整合：前一個子提案 PR 併入 `main` 後，下一個子提案才可由包含前一成果的最新 `main` 分支開發。
- 每個子提案開發採用高頻提交策略：以小批次、可驗證、可回溯的 commit 持續提交。
- 每個子提案開發採用 TDD：先寫失敗測試，再實作最小可行修補，最後重構並保持測試綠燈。

## Capabilities

### New Capabilities
- `security-hardening-program-governance`: 安全修補計畫治理能力，定義子提案切分、執行順序、里程碑與完成標準。

### Modified Capabilities
- 無

## Impact

- Affected code: `openspec/changes/*`（提案文件與任務分解）
- Affected systems: 專案交付流程、風險管理與驗收流程
- Dependencies: 依賴 4 個子提案的執行成果
