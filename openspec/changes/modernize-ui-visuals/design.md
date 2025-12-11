# 視覺風格與互動設計

## 色彩計畫 (Color Palette)
目標：現代、柔和、清新、無紫色。

建議配色：
- **主色 (Primary)**: 天空藍 / 柔和藍 (`#5D9CEC` 或 `#4A90E2`) 或 薄荷綠 (延續目前的 `#4ECDC4` 但更柔和)。
- **背景 (Background)**: 極淡灰 (`#F5F7FA`) 或 純白搭配柔和背景紋理。
- **強調色 (Accent)**: 珊瑚紅 (`#FF6B6B`) 保留作為警告或重點，但降低飽和度或減少使用面積。
- **文字 (Text)**: 深灰 (`#434A54`) 取代純黑，減少視覺疲勞。

## 陰影與層次 (Shadows & Depth)
取代 Bootstrap 預設陰影，使用更細緻的柔光陰影：
- **卡片預設**: `0 2px 4px rgba(0,0,0,0.05)`
- **卡片懸停 (Hover)**: `0 8px 16px rgba(0,0,0,0.1)`，配合 `transform: translateY(-2px)` 產生浮起效果。

## 互動設計 (Micro-interactions)
1. **按鈕**:
   - Hover: 背景色加深/變亮，輕微放大或上浮。
   - Active: 按下時內凹或縮小。
2. **輸入框 (Input)**:
   - Focus: 柔和的主色外框暈影 (`box-shadow`)，而非預設的銳利藍框。
   - Transition: 所有狀態變化加入 `transition: all 0.3s ease`。

## 技術實作
- 保持單一檔案 `index.html` 結構。
- 在 `<head>` 中擴充 `<style>` 區塊。
- 覆寫 Bootstrap 5 的 CSS 變數（如 `:root { --bs-primary: ...; }`）以最快速度套用全站風格。
