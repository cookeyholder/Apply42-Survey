# UI Token 使用指引

## 來源
- 單一來源：uiTokens.html
- 引用頁面：index.html、teacherView.html、statisticsTemplate.html

## Token 清單（階段 B）

### 色彩
- `--bs-primary`
- `--bs-secondary`
- `--bs-success`
- `--bs-danger`
- `--bs-warning`
- `--bs-info`
- `--bs-light`
- `--bs-dark`

### 字級與字體
- `--bs-body-font-family`
- `--bs-body-color`
- `--bs-body-bg`

### 間距
- `--space-control-y`
- `--space-control-x`

### 圓角
- `--surface-radius-md`
- `--surface-radius-sm`

### 陰影
- `--surface-shadow-base`
- `--surface-shadow-hover`

### 動效/焦點
- `--focus-ring-primary`

## 命名規範（2.2）
- 語意命名：以用途命名，不以顏色值命名。
- 前綴規範：
  - Bootstrap 相容 token 使用 `--bs-*`
  - 客製元件 token 使用 `--surface-*`、`--space-*`
- 禁止事項：
  - 禁止 `--blue-1`、`--my-color` 這類無語意命名
  - 禁止在頁面內重複定義與 `uiTokens.html` 同名 token

## 覆寫層級（2.3）
1. 全域：uiTokens.html
2. 頁面：僅在必要時覆寫，且需加註理由
3. 元件：只調整元件級差異，不覆蓋全域核心 token

衝突處理規則：
- 覆寫前先檢查是否可用既有 token 組合達成。
- 若確需覆寫，優先新增語意 token，避免硬編碼色值。

## 使用範例（2.9）

### 範例 1：卡片
```css
.card {
  border-radius: var(--surface-radius-md);
  box-shadow: var(--surface-shadow-base);
}
```

### 範例 2：表單 focus
```css
.form-select:focus,
.form-control:focus {
  box-shadow: var(--focus-ring-primary);
}
```

### 範例 3：頁面底色
```css
body {
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
}
```

## 禁用範例（2.9）

### 禁用 1：硬編碼重複色值
```css
.btn-primary {
  background: #5D9CEC;
}
```

### 禁用 2：頁面內覆寫同名全域 token
```css
:root {
  --bs-primary: #123456;
}
```
