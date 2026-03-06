# 更新日志 | Changelog

## [1.5.0] - 2026-03-06

### ✨ 新语法支持
- **Python 嵌套 f-string**：多层嵌套下变量、字符串、表达式着色准确

### ✨ 语义增强
- **Inlay Hints 视觉优化**：内嵌提示使用月影灰（`#64748b`）退后，不干扰主逻辑
- **诊断信息边框**：错误、警告、信息添加半透明边框，夜间更柔和

### 🔧 优化
- 微调了部分颜色的亮度阶梯

## [1.5.0] - 2026-03-06

### ✨ New Syntax Support
- **Python nested f-strings**: Accurate coloring of variables, strings, and expressions in multi‑level nested f‑strings

### ✨ Semantic Enhancements
- **Inlay Hints visual refinement**: Inlay hints now recede with moon shadow gray (`#64748b`), keeping them from interfering with the main logic
- **Diagnostic borders**: Errors, warnings, and information now have translucent borders, making them gentler at night

### 🔧 Optimizations
- Fine‑tuned the brightness ladder for some colors

## [1.4.0] - 2026-03-05

### ✨ 白天可读性优化：让月光穿透环境光
- **注释提亮**：`#94a3b8` → `#a5b4cb`，强光下依然清晰，夜间依然退后
- **操作符提亮**：`#64748b` → `#8596a5`，逻辑骨架不再“消失”
- **变量微调**：`#cbd5e1` → `#d4dcee`，主体文字更扎实
- **函数优化**：`#7dd3fc` → `#87cefa`，温润的荧光蓝，日夜兼顾
- **冒号/点操作符统一提亮**：从 `#64748b` 提升至 `#8596a5`，细小符号不再丢失
- **状态栏前景提亮**：`#94a3b8` → `#cbd5e1`，信息易读，仍保持沉降
- **选中文本添加边框**：`editor.selectionHighlightBorder: #3b82f680`，操作更精准
- **属性颜色统一**：成员属性与语义高亮一致为 `#94a3b8`，消除不一致
- **异步函数颜色同步**：统一为 `#87cefa`，保留加粗斜体，语义不变

### ✨ 搜索结果高亮分层
- **当前选中匹配项**：主蓝半透明背景 + 边框，一眼定位
- **其他匹配项**：更淡的背景，层次分明

### ✨ 视觉契约：Moongate 的硬件适配哲学
Moongate Dark 不是为了“亮”而设计的，它是为了“对比度”设计的。在物理亮度极低的环境下，对比度就是你眼睛的最后一道防线。本次更新我们同步发布了 **《Moongate 视觉契约》**，帮助你校准显示器，让月光在你的屏幕上准确还原。你可以在 `extras/` 目录中找到这份指南，或直接阅读 README。

### 🔧 修复与优化
- 修复了部分场景下属性颜色不一致的问题
- 优化了 Python 装饰器的显示效果
- 微调了 JSDoc 标签的亮度，与主语义色对齐

---

## [1.4.0] - 2026-03-05

### ✨ Daylight Readability Optimization: Let Moonlight Pierce the Ambient Light
- **Comments brightened**: `#94a3b8` → `#a5b4cb` — clear in bright light, still receding at night
- **Operators brightened**: `#64748b` → `#8596a5` — logical skeleton never disappears
- **Variables fine‑tuned**: `#cbd5e1` → `#d4dcee` — body text more solid
- **Functions refined**: `#7dd3fc` → `#87cefa` — a warm, glowing blue, balanced day and night
- **Colon/dot operators unified**: from `#64748b` to `#8596a5` — tiny symbols no longer lost
- **Status bar foreground brightened**: `#94a3b8` → `#cbd5e1` — information readable, still settled
- **Selection border added**: `editor.selectionHighlightBorder: #3b82f680` — more precise interaction
- **Property color unified**: member properties now `#94a3b8` (matching semantic highlighting), eliminating inconsistency
- **Async function color synchronized**: now `#87cefa`, keeping bold italic for semantic distinction

### ✨ Search Result Layering
- **Current match**: primary blue translucent background + border — instantly locatable
- **Other matches**: lighter background — clear hierarchy

### ✨ The Visual Contract: Moongate’s Hardware Adaptation Philosophy
Moongate Dark is not designed for “brightness”; it is designed for **contrast**. In extremely low physical brightness, contrast is the last line of defense for your eyes. With this release, we are also introducing the **“Moongate Visual Contract”** — a guide to help you calibrate your monitor so that the moonlight renders accurately on your screen. You can find it in the `extras/` directory or read it directly in the README.

### 🔧 Fixes & Optimizations
- Fixed property color inconsistencies in some scenarios
- Improved Python decorator display
- Slightly adjusted JSDoc tag brightness to align with primary semantic colors

---

## [1.3.0] - 2026-03-03

### ✨ 语义修饰符深度定制
- 函数、方法、类定义加粗，与调用处形成鲜明对比
- 静态成员（方法/属性）使用斜体，与普通成员区分
- 废弃符号增加删除线，一眼识别过时 API
- 异步函数使用加粗斜体，暗示其异步特性
- 抽象类/方法使用斜体，传达“未实现”语义
- 内置对象加粗，彰显其语言核心地位

### ✨ 括号高亮月语义化
- 为 6 层嵌套括号分配月语义色：发光蓝、月灵花绿、月光黄、月虹紫、主蓝、月影灰
- 未匹配括号使用红月警示
- 匹配括号对保留主蓝半透明背景 + 边框，定位更清晰

### ✨ JSDoc/TSDoc 语义高亮
- 标签（@param、@returns 等）使用主蓝加粗
- 参数名使用月灵花绿斜体
- 类型使用发光蓝
- 大括号等标点使用操作符灰退后

### ✨ Deep Customization of Semantic Modifiers
- Function, method, and class definitions now bold, clearly distinguished from call sites
- Static members (methods/properties) now italic, differentiated from regular members
- Deprecated symbols now have strikethrough, instantly recognizable
- Async functions now bold italic, hinting at their asynchronous nature
- Abstract classes/methods now italic, conveying “unimplemented” semantics
- Built-in objects now bold, emphasizing their core language status

### ✨ Lunar Semantic Bracket Highlighting
- Six levels of nested brackets assigned moon semantic colors: glowing blue, moonflower green, moon yellow, moonbow purple, primary blue, moon shadow gray
- Unmatched brackets now use red moon for warning
- Matching bracket pairs retain primary blue translucent background + border for precise positioning

### ✨ JSDoc/TSDoc Semantic Highlighting
- Tags (@param, @returns, etc.) now primary blue and bold
- Parameter names now moonflower green and italic
- Types now glowing blue
- Braces and punctuation now operator gray, visually receded

---

## [1.2.0] - 2026-03-01

### ✨ 混合语言嵌入深度优化
- **模板字符串内组件高亮**：在 JSX/TSX/Vue 模板字符串中，自定义组件使用月光黄 (`#fbbf24`)，原生 HTML 标签保持红色 (`#f87171`)，组件结构一目了然
- **Markdown 代码块语言标识高亮**：围栏代码块的语言名称（如 ` ```python ` 中的 `python`）使用月虹紫 (`#c084fc`) 斜体标识，元数据显性化

### ✨ 特殊注释可视化标记（与 Better Comments 搭配）
- 为 Better Comments 插件提供官方配色预设（位于 `extras/better-comments.json`）
- **TODO**：月光黄加粗 (`#fbbf24` bold)
- **FIXME**：红月加粗斜体 (`#f87171` bold italic)
- **NOTE**：发光蓝斜体 (`#7dd3fc` italic)
- **HACK**：月虹紫加粗 (`#c084fc` bold)
- **BUG**：红月加粗下划线 (`#f87171` bold underline)
- **XXX**：月光黄加粗 (`#fbbf24` bold)

### ✨ 终端颜色同步
- 终端的 16 种 ANSI 颜色现已映射到 Moongate 的月语义色系
- `console.log` 中的字符串、数字、错误等与编辑器内配色完全统一
- 终端背景与编辑器背景一致 (`#0f172a`)，视觉无割裂感

### ✨ Deep Optimizations for Mixed Language Embedding
- **Component highlighting inside template strings**: In JSX/TSX/Vue templates, custom components now glow in moon yellow (`#fbbf24`), while native HTML tags remain red (`#f87171`). Component structure is instantly recognizable.
- **Markdown code fence language identifiers**: The language name (e.g., `python` in ` ```python `) now appears in moonbow purple (`#c084fc`) and italic — metadata made visible.

### ✨ Special Comment Visualization (Pair with Better Comments)
- Official color presets for the Better Comments extension provided in `extras/better-comments.json`.
- **TODO**: moon yellow bold (`#fbbf24` bold)
- **FIXME**: red moon bold italic (`#f87171` bold italic)
- **NOTE**: glowing blue italic (`#7dd3fc` italic)
- **HACK**: moonbow purple bold (`#c084fc` bold)
- **BUG**: red moon bold underline (`#f87171` bold underline)
- **XXX**: moon yellow bold (`#fbbf24` bold)

### ✨ Terminal Color Sync
- The 16 ANSI terminal colors are now mapped to Moongate's lunar semantic palette.
- Strings, numbers, errors, etc. in `console.log` output match their editor counterparts.
- Terminal background matches the editor background (`#0f172a`), creating a seamless experience.

---

## [1.1.0] - 2026-02-27

### ✨ 优化
- **只读变量斜体**：只读变量（如 const、只读参数）现在使用斜体，与普通变量区分
- **泛型参数青色**：泛型参数使用青色 (`#22d3ee`)，让复杂泛型一目了然
- **Python 装饰器统一**：所有 Python 装饰器（`@property`、`@xxx.setter`、`@classmethod` 等）统一为紫色 (`#c084fc`) 斜体，元数据与普通函数清晰分离

### ✨ Optimizations
- **Read-only variables italic**: Read-only variables (e.g., `const`, readonly parameters) are now italic, distinguishing them from regular variables.
- **Generic parameters cyan**: Generic parameters now use cyan (`#22d3ee`), making complex generics instantly recognizable.
- **Python decorators unified**: All Python decorators (`@property`, `@xxx.setter`, `@classmethod`, etc.) are now purple (`#c084fc`) and italic — metadata clearly separated from regular functions.

---

## [1.0.2] - 2026-02-26

### 📚 文档
- **添加双语 README**：支持中英文切换，方便更多用户
- **更新预览截图**：展示 v1.0.2 优化后的实际效果
- **添加推荐配置说明**：指导用户开启语义高亮

### 📚 Documentation
- **Bilingual README added**: Now supports switching between Chinese and English, accommodating a wider audience.
- **Preview screenshots updated**: Showcasing the actual effects after v1.0.2 optimizations.
- **Recommended configuration instructions added**: Guides users to enable semantic highlighting.

---

## [1.0.1] - 2026-02-25

### ✨ 优化
- 视觉舒适度：调暗局部变量、参数，缓解大面积白色疲劳
- 启用语义高亮，跨语言统一变量表现
- Python 代码变量降权，提升可读性

### ✨ Optimizations
- Visual comfort: Dimmed local variables and parameters to reduce eye fatigue from large areas of white.
- Enabled semantic highlighting, unifying variable presentation across languages.
- Python variable weight reduced for better readability.

---

## [1.0.0] - 2026-02-24

### 🎉 首次发布
- 极简科幻终端风格的深色主题
- 基于月语义的配色系统：主蓝 (`#3b82f6`)、月灵花绿 (`#34d399`)、月光黄 (`#fbbf24`)、红月 (`#f87171`)
- 视觉远近法：操作符退后、函数发光、注释斜体
- 支持语言：JavaScript/TypeScript/React/Vue/HTML/CSS/JSON/Markdown/Python
- 完整 UI 配色：标题栏、状态栏、侧边栏、终端等均已完成适配

### ✨ 特性
- 直角美学：所有 UI 元素均为直角，拒绝圆角
- 静默交互：链接平时融入文本，悬停时亮起
- 编辑器化设计：代码块带窗口标签，行内代码自发光
- 状态栏沉降：与编辑器背景融合，不干扰阅读

### 🧠 设计理念
- 冷调基底 + 暖色点缀
- 每个颜色都有月相隐喻
- 视觉层次分三档：前景/中景/背景

### 🎉 Initial Release
- A minimalist sci-fi terminal-style dark theme.
- Color system based on lunar semantics: primary blue (`#3b82f6`), moonflower green (`#34d399`), moon yellow (`#fbbf24`), red moon (`#f87171`).
- Visual perspective: operators recede, functions glow, comments italic.
- Supported languages: JavaScript/TypeScript/React/Vue/HTML/CSS/JSON/Markdown/Python.
- Full UI theming: title bar, status bar, sidebar, terminal, etc., all adapted.

### ✨ Features
- Right‑angle aesthetics: all UI elements are strictly right‑angled, no rounded corners.
- Silent interaction: links blend into text by default, light up on hover.
- Editor‑inspired design: code blocks with window‑style headers, inline code with subtle glow.
- Status bar sunk: blends with editor background, never distracts.

### 🧠 Design Philosophy
- Cool base with warm accents.
- Every color carries a moon‑phase metaphor.
- Visual hierarchy in three layers: foreground, midground, background.