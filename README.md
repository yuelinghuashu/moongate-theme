[![Version](https://img.shields.io/github/package-json/v/yuelinghuashu/moongate-theme)]()
[![Marketplace](https://img.shields.io/badge/vscode-marketplace-brightgreen)]()

中文 | [🇬🇧 English](./README_EN.md)

---

# 🌙 Moongate Theme

> 从博客到编辑器，让代码栖息在月光里

Moongate 是一个从个人博客 [moongate.top](https://moongate.top) 衍生而来的 VS Code 主题，将博客的视觉语言带到代码编辑器中。

## 📸 预览

| 语言       | 深色                                                                                                       | 浅色                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| JavaScript | ![JS 深色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/javascript-dark.png) | ![JS 浅色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/javascript-light.png) |
| Python     | ![Python 深色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/python-dark.png) | ![Python 浅色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/python-light.png) |
| Go         | ![Go 深色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/go-dark.png)         | ![Go 浅色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/go-light.png)         |
| Vue        | ![Vue 深色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/vue-dark.png)       | ![Vue 浅色](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/vue-light.png)       |

## ✨ 设计理念

- **月光般的柔和**：长时间 coding 不刺眼
- **清晰的边界**：分明的视觉层次
- **昼夜皆宜**：深色/浅色双主题，切换无感
- **物理海拔**：侧边栏隆起，弹窗浮现，编辑器沉静
- **工程校准**：所有色值通过 WCAG 对比度校验

## 🎨 配色系统

- **主色**：冷调月蓝（深色 `#3b82f6` / 浅色 `#0284c7`）
- **背景**：深空 `#0f172a` / 冷月白 `#f9fafb`
- **海拔层级**：四层明度阶梯（`surfaceGround` → `surfaceRaised` → `surfaceFloating` → `surfaceTooltip`）
- **设计令牌**：基于 DTCG 标准，自动生成 CSS 变量供跨平台复用

## 🧠 核心优化

| 优化项                | Moongate 的解法                                        |
| --------------------- | ------------------------------------------------------ |
| **昼夜语义一致性**    | 同一色系不同明度，视觉重量对等，切换无感               |
| **函数定义/调用分离** | 定义加粗，调用不加粗，全语言统一（Go、Python、JS、TS） |
| **JSON 嵌套层级**     | 蓝 → 青 → 紫 阶梯，层次一目了然                        |
| **UI 物理深度**       | 海拔系统：不同 UI 区域分配明度阶梯，实现"纸张层叠"     |
| **设计系统统一**      | DTCG 令牌自动生成 CSS 变量，一套颜色贯穿所有产品       |

## ✨ v2.5.0 亮点

- **⚛️ React JSX/TSX 专属规则**：新增 `jsx.yaml`——自定义组件使用月光黄加粗，React Hooks 紫色斜体，内嵌表达式发光蓝，与 Vue 规则视觉对称
- **🧩 现代 VS Code UI 适配**：补全 Sticky Scroll、AI Chat / Inline Chat、Command Center、Terminal Command Guide、Ghost Text / Unicode 高亮、Comments / Ports、Symbol Icons 等 149 个现代 UI key，全部遵循语义层引用

[📜 查看完整更新日志](./CHANGELOG.md)

## 📐 设计系统

Moongate 基于 DTCG 设计令牌标准构建，提供完整的颜色、布局、排版、断点、z-index 令牌。  
👉 [查看完整设计系统文档](./docs/DESIGN_SYSTEM.md)  
👉 [阅读《Moongate 视觉契约》（显示器校准指南）](./extras/VISUAL_CONTRACT.md)  
👉 [使用颜色令牌驱动博客或 UI 组件库](./themes/moongate-colors.css)  
👉 [使用布局令牌（间距、排版、断点等）](./themes/moongate-layout.css)

## ⚙️ 推荐配置

### 语义高亮

安装 Moongate 后，语义高亮**自动开启**，无需任何手动配置。如遇问题，可检查：

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### Better Comments

使用 Better Comments 插件时，可应用 Moongate 官方配色预设：

1. 打开 VS Code 设置（JSON 格式）
2. 将 `extras/better-comments.json` 合并到 `better-comments.tags` 字段

## ☕ 支持这个主题

如果 Moongate Theme 让你的编码时光更舒适，欢迎请我喝杯咖啡 —— 这会让我更有动力持续优化配色、支持更多语言。

<details>
<summary>👈 点击展开赞助方式</summary>

<img src="./assets/ali-pay.jpg" width="200" height="280" alt="支付宝收款码" />
<img src="./assets/wechat-pay.jpg" width="200" height="280" alt="微信收款码" />

> 赞助费用将用于主题维护、新语言适配与配色优化。感谢每一份心意 ❤️

</details>

---

[⬆ 返回顶部](#)
