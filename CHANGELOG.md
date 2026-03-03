# 更新日志 | Changelog

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