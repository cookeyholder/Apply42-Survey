## 1. 前端 UI

- [x] 1.1 新增 `buildSchoolDepartmentMap()` 函式，建立學校->科系對照表
- [x] 1.2 修改 `insertDepartmentSelectionFields()` 建立雙選單結構
- [x] 1.3 新增 `handleSchoolChange()` 處理學校選擇變更
- [x] 1.4 修改 CSS 確保雙選單響應式佈局（已使用 Bootstrap row/col-md-6）

## 2. 邏輯適配

- [x] 2.1 `checkDuplicateChoices()` - 無需修改，仍使用 .departmentChoices
- [x] 2.2 `checkIfOverLimit()` - 無需修改，仍使用 .departmentChoices
- [x] 2.3 `updateRegistrationFee()` - 無需修改，仍使用 .departmentChoices

## 3. 資料回顯

- [x] 3.1 修改初始化邏輯，根據已選科系設定學校和科系選單

## 4. 驗證

- [ ] 4.1 測試：選擇學校後科系選單正確更新
- [ ] 4.2 測試：志願重複檢查正常運作
- [ ] 4.3 測試：學校志願數限制正常運作
- [ ] 4.4 測試：已選志願正確回顯
