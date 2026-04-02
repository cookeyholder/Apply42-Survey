## ADDED Requirements

### Requirement: 統計功能 SHALL 定義並遵守效能預算
系統 SHALL 建立統計頁效能預算，至少包含首屏可見時間、單次資料 payload 上限與渲染節點控制門檻。

#### Scenario: 首次載入統計頁
- **WHEN** 使用者首次進入統計頁
- **THEN** 系統 MUST 在預算門檻內顯示摘要內容並可互動

#### Scenario: 明細資料超出預算
- **WHEN** 群類明細資料體積超過單次 payload 門檻
- **THEN** 系統 MUST 啟用分段回傳或限制筆數策略

### Requirement: 快取策略 SHALL 分層配置
系統 SHALL 針對摘要資料、群類明細與校系映射使用分層快取設定，並定義失效與重建規則。

#### Scenario: 摘要快取過期
- **WHEN** 摘要快取到期且有新請求
- **THEN** 系統 MUST 先重建摘要快取並維持可用回應

#### Scenario: 校系映射更新
- **WHEN** 校系映射來源資料變更
- **THEN** 系統 MUST 依規則失效對應快取並重新建立映射
