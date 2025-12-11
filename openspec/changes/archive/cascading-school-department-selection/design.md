# 階層式學校-科系選擇設計

## 目前實作

目前使用單一 `<select>` 搭配 `<optgroup>` 按學校分組：

```html
<select class="departmentChoices">
  <option value="">請選擇</option>
  <optgroup label="國立臺灣科技大學(可報志願數：3)">
    <option value="011001">011001-國立臺灣科技大學_機械工程系</option>
    ...
  </optgroup>
</select>
```

## 提案設計

每個志願改為兩個下拉選單：

```
志願 1
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ 選擇學校 ▼                       │  │ 選擇科系 ▼                       │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

### UI 結構

```html
<div class="mb-3 wish-row">
  <label>志願 1</label>
  <div class="row">
    <div class="col-md-6">
      <select class="schoolSelect" data-wish="1">
        <option value="">選擇學校</option>
        <!-- 學校選項 -->
      </select>
    </div>
    <div class="col-md-6">
      <select class="departmentChoices" name="departmentChoices_1" disabled>
        <option value="">請先選擇學校</option>
      </select>
    </div>
  </div>
</div>
```

### 資料流程

1. **初始化**：解析 `departmentOptions` 建立學校->科系對照表
2. **選學校**：更新對應的科系選單選項
3. **選科系**：執行重複檢查和志願數限制檢查
4. **提交**：只提交 `departmentChoices_N`（與原邏輯相同）

### 資料結構

```javascript
// 從 departmentOptions 建立對照表
const schoolDepartmentMap = {
  "011": {
    name: "國立臺灣科技大學",
    limit: 3,
    departments: [
      { code: "011001", name: "機械工程系" },
      ...
    ]
  },
  ...
};
```

## 變更清單

### [MODIFY] index.html
- 修改 `insertDepartmentSelectionFields()` 建立雙選單結構
- 新增 `buildSchoolDepartmentMap()` 建立對照表
- 新增 `handleSchoolChange()` 處理學校選擇變更
- 修改 `checkDuplicateChoices()` 和 `checkIfOverLimit()` 適應新結構
