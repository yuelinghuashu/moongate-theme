# 更新日志 | Changelog

## [2.1.0] - 2026-03-14

### ✨ 海拔系统：让界面拥有物理深度

- **引入海拔变量**：新增 `surfaceGround`、`surfaceRaised`、`surfaceFloating`、`surfaceTooltip` 四层海拔阶梯，为 UI 赋予清晰的物理层次。
- **深色模式**：侧边栏、活动栏等次级区域（`surfaceRaised`）比编辑器背景（`surfaceGround`）亮约 5%，形成微微隆起的“面板感”；弹窗、菜单等浮层（`surfaceFloating`）再提升 5%，并带有半透明主色边框（`borderFloating`），边界更清晰。
- **浅色模式**：基于重力补偿原则，次级区域比编辑器背景暗约 3%，浮层再暗 3%，在保持通透感的同时，通过明度差异实现“纸张层叠”的优雅分离。
- **全 UI 适配**：对侧边栏、活动栏、状态栏、输入框、下拉菜单、通知中心、快速输入等 20+ 个区域进行了海拔映射，视觉层次全面提升。

### ✨ Elevation System: Giving the Interface Physical Depth

- **Introduced elevation variables**: Added `surfaceGround`, `surfaceRaised`, `surfaceFloating`, and `surfaceTooltip` – a four‑layer elevation ladder that gives the UI a clear physical hierarchy.
- **Dark mode**: Secondary areas like the sidebar and activity bar (`surfaceRaised`) are now about 5% brighter than the editor background (`surfaceGround`), creating a subtle “raised panel” feel. Floating elements such as menus and notifications (`surfaceFloating`) are another 5% brighter and feature a semi‑transparent primary‑color border (`borderFloating`) for sharper boundaries.
- **Light mode**: Following the gravity‑compensation principle, secondary areas are about 3% darker than the editor background, and floating layers another 3% darker. This achieves an elegant “paper stack” separation without sacrificing translucency.
- **Full UI coverage**: Mapped elevations to 20+ areas including the sidebar, activity bar, status bar, input fields, dropdowns, notifications, and quick pick – elevating the entire visual hierarchy.

---


## [2.0.0] - 2026-03-11

### 🌗 昼夜双子：工程化重构与浅色主题发布

- **Moongate Light 晨曦模式**：基于“重力补偿”原则，为浅色背景深度优化。冷调基底 `#f9fafb`，语义色明度精准映射，与深色版保持 1:1 视觉权重。
- **模块化工程架构**：从单体 JSON 升级为 YAML 模块化系统，变量集中管理，支持多主题一键构建。
- **构建脚本引入**：通过 Node.js 脚本（`scripts/build.js`）自动合并 YAML 源文件、替换颜色变量，生成最终主题 JSON，彻底告别手动维护的混乱。

### 🌗 The Gemini Release: Engineering Overhaul & Light Theme

- **Moongate Light (Dawn Mode)**: Deeply optimized for light backgrounds using the “gravity compensation” principle. Cool‑toned base `#f9fafb`, semantic colors precisely lightness‑mapped, maintaining 1:1 visual weight with the dark version.
- **Modular architecture**: Upgraded from a monolithic JSON to a YAML‑based modular system, with centralized variables and one‑click multi‑theme generation.
- **Build script introduced**: A Node.js script (`scripts/build.js`) now automatically merges YAML sources, replaces color variables, and produces the final theme JSON—eliminating manual maintenance chaos.

---

### ✨ 颜色系统重构

- **1:1 变量映射**：深/浅色版使用完全相同的变量名，`workbench.yaml` 等规则文件无需修改，切换主题时自动适配。
- **语义一致性**：所有语法角色（关键字、字符串、函数等）在两套主题中颜色角色完全对齐，切换主题无需重新学习。
- **变量替换安全网**：构建脚本支持智能处理透明度后缀，自动检测变量是否已含透明度，避免生成非法色值。

### ✨ Color System Refactor

- **1:1 variable mapping**: Dark and light versions share identical variable names; rule files like `workbench.yaml` remain unchanged, automatically adapting when switching themes.
- **Semantic consistency**: Every syntactic role (keywords, strings, functions, etc.) maintains the same color role across both themes—no relearning needed.
- **Variable replacement safety net**: The build script intelligently handles transparency suffixes, automatically detecting if a variable already contains alpha, preventing invalid color values.

---

### 🔷 JSON 嵌套颜色优化

- **蓝 → 青 → 紫 阶梯**：顶层键使用主蓝 (`primary`)，第二层使用青色 (`cyan`)，第三层使用紫色 (`purple`)，嵌套深度一目了然，且避免使用红/黄色系，不引起语义误读。
- **结构清晰**：复杂的配置文件现在可以凭借颜色快速定位层级。

### 🔷 JSON Nesting Color Optimization

- **Blue → Cyan → Purple gradient**: Top‑level keys use primary blue (`primary`), second level uses cyan (`cyan`), third level uses purple (`purple`). Nesting depth is instantly visible, while avoiding red/yellow hues that could cause semantic confusion.
- **Clearer structure**: Complex configuration files can now be navigated quickly by color.

---

### 🎨 UI 细节打磨

- **浅色模式交互反馈**：悬停背景、选中背景、边框等元素已针对浅色背景微调，保持“静默唤醒”的交互哲学。
- **滚动条透明度**：浅色模式下滚动条滑块透明度优化，既可见又不刺眼。
- **终端 ANSI 色同步**：16 色终端配色已同步适配浅色版，与编辑器内配色一致。

### 🎨 UI Polish

- **Light mode interaction feedback**: Hover backgrounds, selection backgrounds, borders, etc., fine‑tuned for light backgrounds, preserving the “silent awakening” interaction philosophy.
- **Scrollbar opacity**: Optimized scrollbar slider opacity in light mode—visible but not glaring.
- **Terminal ANSI color sync**: The 16‑color terminal palette is now synchronized with the light version, matching editor colors.

---

### 📦 工程化构建系统

- **目录结构标准化**：源码统一存放于 `src/`，按功能分为 `core/`、`languages/`、`special/`、`workbench.yaml`、`semantic.yaml`。
- **语言规则自动扫描**：构建脚本自动加载 `languages/` 和 `special/` 下的所有 YAML 文件，无需手动维护规则列表。
- **输出文件名智能净化**：基于 `package.json` 的 `name` 自动生成主题文件名（如 `moongate-dark.json`、`moongate-light.json`），并移除冗余的 `-theme` 后缀。
- **错误处理增强**：关键文件缺失或 YAML 格式错误时，脚本给出明确提示并安全退出，避免生成不完整的主题。

### 📦 Engineering Build System

- **Standardized directory structure**: Source code now resides in `src/`, organized into `core/`, `languages/`, `special/`, `workbench.yaml`, and `semantic.yaml`.
- **Automatic language rule scanning**: The build script automatically loads all YAML files from `languages/` and `special/`—no more manual rule list maintenance.
- **Intelligent output filename sanitization**: Theme filenames are generated from the `package.json` `name` (e.g., `moongate-dark.json`, `moongate-light.json`), with redundant `-theme` suffixes stripped.
- **Enhanced error handling**: If critical files are missing or YAML format is invalid, the script provides clear error messages and exits safely, preventing incomplete builds.

---

### 🧠 设计理念文档化

- **《Moongate 视觉契约》**：随主题发布一份详细的视觉契约，阐述冷调基底、重力补偿、语义映射等核心设计原则，并指导用户校准显示器以获得最佳体验（位于 `extras/` 目录）。
- **P1-P5 工程协议**：引入问题复杂度分级体系，将博客文章按难度标记为 P1~P5，未来将逐步应用于文档体系。

### 🧠 Design Philosophy Documented

- **The Moongate Visual Contract**: A detailed visual contract now accompanies the theme, explaining core design principles such as cool‑toned base, gravity compensation, and semantic mapping—plus a monitor calibration guide for optimal experience (located in the `extras/` directory).
- **P1–P5 Engineering Protocol**: A problem‑complexity grading system has been introduced, marking blog posts by difficulty (P1–P5), to be gradually integrated into the documentation ecosystem.

<details>
<summary>查看 1.x 版本 | View 1.x versions</summary>

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

</details>
