## Context

提交端點屬於高價值目標（會改資料、寄通知信）。現況缺少 token 與 nonce 驗證，且可被重放。需導入請求完整性控制且避免影響既有使用者體驗。

## Goals / Non-Goals

**Goals:**
- 以低侵入方式導入 CSRF + nonce。
- 阻斷跨站偽造與重放請求。
- 保持合法使用者提交流程穩定。

**Non-Goals:**
- 不處理角色授權（由 RBAC 提案處理）。
- 不一次重構所有 API，只先覆蓋高風險提交端點。

## Decisions

- Decision 1: 採同步 token（表單載入時下發，提交時驗證）。
- Decision 2: nonce 一次性消耗，並設定短時效。
- Decision 3: 對高風險端點加入來源檢查與節流。

## Risks / Trade-offs

- [token 失效導致使用者提交失敗] → 前端提示重新整理並重取 token。
- [來源檢查誤傷合法流量] → 先採觀察模式與白名單策略。
- [nonce 儲存壓力] → 使用短 TTL 並限制併發 token 數。
