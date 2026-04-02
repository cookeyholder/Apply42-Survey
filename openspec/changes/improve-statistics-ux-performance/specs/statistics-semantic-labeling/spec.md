## ADDED Requirements

### Requirement: 統計項目 SHALL 提供語意化校系標籤
系統 SHALL 為每個統計項目提供校系代碼與校系名稱的對應結果，並輸出可直接顯示的語意化標籤。

#### Scenario: 統計明細正常映射
- **WHEN** 系統取得有效的校系對照資料
- **THEN** 每筆統計結果 MUST 同時包含校系代碼、校系名稱與組合顯示文字

#### Scenario: 對照資料缺漏
- **WHEN** 某校系代碼無法對應名稱
- **THEN** 系統 MUST 回傳可辨識的 fallback 標籤並記錄可觀測錯誤資訊

### Requirement: 老師端與學生端 SHALL 使用一致顯示語意
系統 SHALL 在老師端與學生端統計頁使用同一套校系標籤格式，避免同一志願出現不同文字。

#### Scenario: 相同群類在雙端檢視
- **WHEN** 老師端與學生端檢視同一群類同一志願項目
- **THEN** 顯示標籤 MUST 一致，僅允許樣式差異
