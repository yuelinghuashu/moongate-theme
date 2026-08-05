# 🌙 Moongate Theme

> 从博客到编辑器，让代码栖息在月光里

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/yuelinghuashu/moongate-theme" alt="Version">
  <img src="https://img.shields.io/badge/vscode-marketplace-brightgreen" alt="Marketplace">
  <img src="https://img.shields.io/badge/languages-15-brightgreen" alt="Languages">
  <img src="https://img.shields.io/badge/WCAG-AA%20%26%20AAA-blue" alt="WCAG">
  <img src="https://img.shields.io/badge/Dark%20%26%20Light-both-8A2BE2" alt="Dark & Light">
  <img src="https://img.shields.io/badge/Semantic%20Highlighting-on-purple" alt="Semantic Highlighting">
  <img src="https://img.shields.io/badge/tests-85%20passing-brightgreen" alt="Tests">
</p>

中文 | [🇬🇧 English](./README_EN.md)

---

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

## ✨ v2.6.0 亮点

- **🚀 新增 3 种语言支持**：Shell/Bash、Dockerfile、SQL——统一遵循"base 通用规则 + 语言独有规则"架构
- **🎨 语言 scope 全面修复**：JSX/TSX、Python、Rust、CSS、Go、Markdown、HTML 共 8 个文件重写，逐一对照 VS Code 内置 TextMate 语法验证，消除所有不生效的 scope
- **📦 跨平台令牌产物**：自动生成 `_tokens.scss`（Sass）和 `tokens.ts`（TypeScript），兑现"一键导出多平台"承诺
- **🔍 新增 `verify-scopes.js`**：自动比对语言配置与 VS Code 内置语法，防止 scope 错误回归

[📜 查看完整更新日志](./CHANGELOG.md)

## 📐 设计系统

Moongate 基于 DTCG 设计令牌标准构建，提供完整的颜色、布局、排版、断点、z-index 令牌。  
👉 [查看完整设计系统文档](./docs/DESIGN_SYSTEM.md)  
👉 [阅读《Moongate 视觉契约》（显示器校准指南）](./extras/VISUAL_CONTRACT.md)  
👉 [使用颜色令牌驱动博客或 UI 组件库](./themes/moongate-colors.css)  
👉 [使用布局令牌（间距、排版、断点等）](./themes/moongate-layout.css)  
👉 [使用 SCSS 令牌（Sass 项目）](./themes/_tokens.scss)  
👉 [使用 TypeScript 令牌（前端项目）](./themes/tokens.ts)

## 🏗️ 工程化构建

Moongate 不是手写 JSON，而是由 **DTCG 令牌 + YAML 语义层** 驱动的工业级构建流程：

```
┌─────────────────────────────────────────────────────┐
│                     源文件（src/）                   │
│  primitives/colors.yaml   语义层（dark/light）       │
│  workbench.yaml   languages/*.yaml   semantic.yaml   │
└─────────────────────────┬───────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────┐
│              scripts/build.js 自动化构建             │
│  ✔ 令牌解析 + 变量替换                                │
│  ✔ token 合并（相同规则精简）                        │
│  ✔ WCAG 对比度校验（自动质检）                       │
│  ✔ 结构完整性验证                                    │
└─────────────────────────┬───────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────┐
│                  生成产物（themes/）                 │
│  JSON 主题（dark/light）  CSS 变量   SCSS  TS 令牌    │
│  设计系统文档（DESIGN_SYSTEM.md）                    │
└─────────────────────────────────────────────────────┘
```

### 质量保障

| 工具 | 作用 |
|------|------|
| `node scripts/build.js` | 一键构建全部产物 |
| `node scripts/verify-scopes.js` | 自动比对语言 scope 与 VS Code 内置语法 |
| `pnpm test` | 85 个自动化测试（令牌/生成器/验证器/scope） |

### 本地开发

```bash
pnpm install
pnpm run build      # 构建主题全部产物
pnpm test           # 运行全部自动化测试
pnpm run dev        # 监听源文件变化自动重新构建
```

> 🌙 **为什么不手写 JSON？** 因为手写的主题只能改变色值，改不了「视觉体系」；而令牌驱动的主题，改变一个语义变量（如 `primary`），全主题联动更新，永不脱节。

## ⚙️ 推荐配置

### 语义高亮

安装 Moongate 后，语义高亮**自动开启**，无需任何手动配置。如遇问题，可检查：

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### Better Comments

安装 Moongate 后，Better Comments 插件的特殊注释（TODO、FIXME、NOTE、HACK、BUG、XXX）**自动使用 Moongate 官方配色**，无需任何手动配置。

> 💡 独立配色预设文件 `extras/better-comments.json` 由构建脚本自动生成（`pnpm run gen:better-comments`），供不安装主题、单独使用配色预设的用户参考。

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
