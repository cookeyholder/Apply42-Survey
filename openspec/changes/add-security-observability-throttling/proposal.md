## Why

即使完成核心防護，若缺少可觀測性與節流機制，仍難及早發現攻擊或阻止濫用。需補齊安全稽核、告警與流量保護能力。

## What Changes

- 建立安全事件日誌標準（actor/action/resource/result/reason）。
- 移除或遮罩敏感日誌內容，降低資料外洩風險。
- 對敏感端點建立速率限制與異常偵測規則。
- 建立最小告警集合與維運處置流程。

## Delivery Workflow Constraints

- 本子提案必須使用獨立開發分支。
- 開發完成後，必須執行 `$code-review-and-quality` 與 `$security-and-hardening`。
- 實作完成後必須 open PR，並執行 `$review-pr-3x`，確認審查意見修正完成後再 `$squash-pr`。
- 需在 `add-data-integrity-cache-safety` 已併入 `main` 後，從最新 `main` 分支開發。
- 本子提案開發採高頻提交策略，避免大型難審查 commit。
- 本子提案採 TDD 流程，先建立失敗測試再實作修補。

## Capabilities

### New Capabilities
- `security-observability-and-throttling`: 安全可觀測性、告警與節流防護能力。

### Modified Capabilities
- 無

## Impact

- Affected code: `main.gs`, `cache.gs`, 日誌與監控整合點
- Affected systems: 安全事件追蹤、告警、流量防護
- Dependencies: 建議在 RBAC/CSRF 之後導入
