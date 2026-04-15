## Why

目前多個伺服器函式存在「信任前端傳入身分資訊」風險，可能導致越權讀取或操作。需要將授權決策完全收斂到伺服器端，建立一致的 RBAC 防線。

## What Changes

- 建立伺服器端 RBAC guard，統一檢查學生、老師、管理角色。
- 所有敏感函式改為伺服器端重建身分，不信任前端傳入 `user/teacher` 物件。
- 建立角色對應的資源存取規則（例如老師僅可查授權班級）。
- 將未授權存取回應標準化，並輸出可稽核的拒絕事件。

## Delivery Workflow Constraints

- 本子提案必須使用獨立開發分支。
- 開發完成後，必須執行 `$code-review-and-quality` 與 `$security-and-hardening`。
- 實作完成後必須 open PR，並執行 `$review-pr-3x`，確認審查意見修正完成後再 `$squash-pr`。
- 本提案為序列中的第一個子提案；後續子提案需以其已併入 `main` 的成果為基礎。
- 本子提案開發採高頻提交策略，避免大型難審查 commit。
- 本子提案採 TDD 流程，先建立失敗測試再實作修補。

## Capabilities

### New Capabilities
- `server-side-access-control`: 伺服器端集中授權與角色保護能力。

### Modified Capabilities
- 無

## Impact

- Affected code: `main.gs`, `retrieveData.gs`, `teacher.gs`, 任何 `google.script.run` 對應後端函式
- Affected systems: 身分驗證、授權、資料讀取流程
- Dependencies: 無（P0 優先）
