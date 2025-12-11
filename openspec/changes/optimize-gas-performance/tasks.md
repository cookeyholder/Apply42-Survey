## 1. 基礎建設

- [x] 1.1 在 `retrieveData.gs` 新增 `getAllPageData(user)` 函式，批次取得學生頁面資料（不含統計）
- [x] 1.2 在 `retrieveData.gs` 新增 `getAllTeacherPageData(user)` 函式

## 2. 後端整合

- [x] 2.1 修改 `main.gs` 的 `renderStudentPage()` 呼叫 `getAllPageData()`
- [x] 2.2 將資料以 `JSON.stringify()` 序列化為 `template.pageData`
- [x] 2.3 同樣方式處理 `renderTeacherPage()`

## 3. 前端調整

- [x] 3.1 修改 `index.html`：新增 `const pageData = JSON.parse('<?= pageData ?>');`
- [x] 3.2 將所有 scriptlet 變數改為 JavaScript 變數引用
- [x] 3.3 同樣方式處理 `teacherView.html`
- [x] 3.4 同樣方式處理 `statisticsTemplate.html`（使用快取後的後端函式）

## 4. 統計資料優化

- [x] 4.1 為 `getRawStatisticsData()` 和 `getUniqueGroupNames()` 新增 20 分鐘快取
- [x] 4.2 統計頁籤維持延遲載入（切換時才載入），使用快取後的函式
- [x] 4.3 錯誤處理改為靜默失敗

## 5. 驗證

- [ ] 5.1 手動測試：學生帳號志願填報功能
- [ ] 5.2 手動測試：統計頁籤資料顯示
- [ ] 5.3 手動測試：老師帳號班級查詢
- [ ] 5.4 效能測量：記錄載入時間改善幅度
