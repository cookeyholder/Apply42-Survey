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

## Scope Ownership

| 提案 | 優先級 | 範圍邊界 | 主要風險 |
| --- | --- | --- | --- |
| `add-server-side-rbac-guards` | P0 | Server 端角色驗證、資源存取授權、防止客戶端繞過 | 權限提升、跨帳號資料寫入 |
| `add-csrf-replay-protection` | P0 | CSRF token、一次性 nonce、時效驗證、提交簽章 | 跨站請求偽造、重放攻擊 |
| `add-data-integrity-cache-safety` | P1 | 資料綁定驗證、快取隔離鍵、版本檢查 | A/B 使用者資料污染、舊資料覆寫 |
| `add-security-observability-throttling` | P1 | 稽核日誌、異常偵測、速率限制與告警 | 攻擊不可見、暴力/濫用請求 |

## Dependency And Milestones

| 里程碑 | 前置條件 | 交付內容 | 驗收條件 |
| --- | --- | --- | --- |
| M1 RBAC 上線 | 父提案核准、基線測試可執行 | `add-server-side-rbac-guards` 合併 main | 未授權角色全部阻擋、授權流程回歸綠燈 |
| M2 CSRF/重放防護 | M1 已合併 main | `add-csrf-replay-protection` 合併 main | 缺 token/過期 token/重放請求均拒絕 |
| M3 一致性/快取安全 | M2 已合併 main | `add-data-integrity-cache-safety` 合併 main | 無跨使用者寫入、快取鍵隔離驗證通過 |
| M4 觀測與節流 | M3 已合併 main | `add-security-observability-throttling` 合併 main | 攻擊事件可追蹤、節流規則生效 |
| M5 全域安全回歸 | M1-M4 已完成 | 父提案結案報告 | 安全回歸清單全綠、殘餘風險已註記 |

## Sub-Proposal Tracking Board

| 子提案 | 開發分支 | 狀態 | 阻塞 | 風險 |
| --- | --- | --- | --- | --- |
| `add-server-side-rbac-guards` | `feature/security-rbac-guards` | Not Started | 無 | 高 |
| `add-csrf-replay-protection` | `feature/security-csrf-replay` | Not Started | 依賴 M1 | 高 |
| `add-data-integrity-cache-safety` | `feature/security-data-integrity-cache` | Not Started | 依賴 M2 | 中 |
| `add-security-observability-throttling` | `feature/security-observability-throttling` | Not Started | 依賴 M3 | 中 |

更新規則：
- 任一子提案開發啟動、PR 建立、審查阻塞、併入 main 時，必須同步更新此表格。
- 前一子提案未完成合併，不得將下一子提案狀態改為 In Progress。

## Shared Acceptance And Regression Gates

- 共同驗收門檻：
  - 安全控制必須在 server 端強制，禁止只依賴前端檢查。
  - 每個子提案需附攻擊情境測試（至少 1 個正向、2 個負向）。
  - 每個子提案需提供風險收斂證據（被阻擋請求或日誌證據）。
- 全域回歸原則：
  - 功能回歸：既有提交流程與報表流程不退化。
  - 安全回歸：授權、CSRF、重放、資料隔離、節流均有自動化測試。
  - 併版回歸：每個子提案合併後必跑整包測試，最終再跑一次全域安全回歸。

## High-Frequency Commit Strategy

- 每次 commit 只處理單一可驗證意圖（例如：新增一組失敗測試、補一個 server 驗證點）。
- 每次 commit 前後都要可執行最小測試集，確保可回滾。
- 禁止累積超大批次變更；PR 內 commit 應呈現可追蹤演進脈絡。

## TDD Enforcement

- Red: 先提交會失敗的安全測試，明確重現威脅情境。
- Green: 以最小修補讓測試轉綠，不同時引入非必要重構。
- Refactor: 維持綠燈前提下整理命名、重複邏輯與結構。
- 驗收時必須檢附測試演進證據（失敗測試 commit → 修補 commit → 重構 commit）。

## Capabilities

### New Capabilities
- `security-hardening-program-governance`: 安全修補計畫治理能力，定義子提案切分、執行順序、里程碑與完成標準。

### Modified Capabilities
- 無

## Impact

- Affected code: `openspec/changes/*`（提案文件與任務分解）
- Affected systems: 專案交付流程、風險管理與驗收流程
- Dependencies: 依賴 4 個子提案的執行成果
