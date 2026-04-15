## Context

現況存在權限判斷分散與參數信任問題，導致呼叫路徑可被繞過。此提案需定義「所有敏感資料存取都先過 RBAC guard」的一致架構。

## Goals / Non-Goals

**Goals:**
- 將角色授權決策集中在伺服器。
- 消除前端傳入身分物件造成的越權風險。
- 提供一致的拒絕事件紀錄格式。

**Non-Goals:**
- 不處理 CSRF 與重放（另由 `add-csrf-replay-protection` 負責）。
- 不調整統計效能策略。

## Decisions

- Decision 1: 建立共用 `authorize(role, resource)` 檢查流程。
  - Rationale: 避免各函式各自判斷造成漏洞。
  - Alternative: 分散在函式內自行判斷（風險高且難審查）。

- Decision 2: 敏感函式內忽略前端傳入 user context。
  - Rationale: 前端資料不可作為安全邊界。

- Decision 3: 拒絕回應使用固定錯誤碼與最小訊息。
  - Rationale: 減少資訊外洩並提升監控一致性。

## Risks / Trade-offs

- [既有流程依賴前端 user 物件] → 增加相容層與回歸測試。
- [角色資料品質不佳導致誤拒] → 加入角色資料檢核與告警。
- [老師跨班需求不清] → 明確定義授權模型與班級映射規則。
