# 更新日志

[🇬🇧 English](./CHANGELOG_EN.md) | 中文

## [2.8.0] - 2026-09-12

### 🩹 可见性故障修复（对比度实测）

- **输入校验提示不可读**：`inputValidation.error/info/warningForeground` 三个前景键此前缺失，回退 VS Code 默认值后压在彩色提示底上仅 **1.10–2.00:1（深色）/ 1.87–3.24:1（浅色）**；现统一用 `${surfaceGround}`（与 `statusBarItem.errorForeground` 同一惯例）→ 深色 6.45 / 4.85 / 10.69:1，浅色 6.19 / 8.35 / 4.81:1。
- **浅色状态栏 prominent 项白压白**：`statusBarItem.prominentForeground` / `prominentHoverForeground` 缺失导致 **1.00:1（完全不可见）**；现为 `${text}` → 深色 13.76 / 11.04:1，浅色 17.85 / 16.30:1。
- 顺带显式定义 `statusBarItem.hoverForeground`、`terminalCursor.background`（消除非月庭回退）。

### 🧭 界面键覆盖补全（对齐 VS Code 1.130 默认主题键集）

- 新增 **111** 个界面键：编辑器当前行/范围/悬停/非活跃选区高亮、缩进参考线、概览标尺、Diff 行底色、未聚焦标签页（9）、列表焦点描边与拖放、Markdown/hover 文档面（链接/行内 code/引用块）、Git 暂存态、小地图滑块、菜单/菜单栏/工具栏、面包屑、通知中心、欢迎页、评论控件、笔记本、复选框、按钮边框、状态栏焦点环，以及**现代 AI 面板**（Agents 20 键、现代活动栏、`surface.*` 统一表面、chat 工作动效边框）。
- 未覆盖键由 **173 → 37**（剩余为按计划延期的扩展视图批次：charts / gauge / peekView / settings / quickInputList），全部登记在 `docs/COVERAGE.md`。

### 🔬 校验强化（防复发）

- **回退可读性校验**：主题只定义"配对的一半"时，用 VS Code 默认主题的真实回退值算对比度，低于阈值**构建失败**——本轮两个可见性故障正是这样漏网的。
- **深浅区分度一致性校验**：语法角色在深/浅两模式的"同色结构"必须一致，差异须登记豁免。
- **对比度角色扩展**：新增 `highlight`/`cyan`/`purple`/`git*`/`bracket1-6`，`gitIgnored`/`codeDim` 登记豁免；UI 配对表由 6 条扩到 16 条。
- 新增 **`docs/COVERAGE.md`**（构建自动生成：界面键覆盖 / 逐语言语法叶子 scope 覆盖 / 角色区分度）与 `test/theme-coverage.test.js` 常驻断言。

### 🎨 深浅一致性调整

- **浅色 `highlight` 与 `function` 拆色**：二者原同为 `#0369a1`，导致浅色下类型/转义/占位符/一层方法调用与函数名同色；`highlight` 改为 `{blue-600}`（`--ui-highlight: #2563eb`）。
- **浅色 `gitAdded`**：`#059669`（3.61:1）→ `{green-800}` `#047857`（5.25:1，与 `success` 同档，深色亦然）；`--ui-git-added` 随之变化。

### 🌐 语法覆盖补齐

- **Markdown**：setext 风格标题（`===`/`---`）、行内 `` `code` ``；**Java**：继承基类；**C#**：变量声明族（字段/局部/参数/事件/预处理符号）与 goto 标签；**C/C++**：作用域解析的构造/析构/运算符重载变体、预定义宏全族、变参省略号 `...`。
- 语法叶子 scope 未覆盖率 **26 → 0**（4 个 Python 正则内部 scope 与 3 个语法占位/兜底 scope 登记豁免并写明理由）。

> 跨仓库同步：`--ui-highlight`、`--ui-git-added`（浅色）已变化，按 `docs/TOKEN_CONVENTIONS.md` §7 同步 moongate-vue 的 `src/styles/tokens/colors.css` 与数值表。

### 🧪 自动化测试补齐（141 → 181 条）

- **死键检查**：新增「VS Code 已知色键」数据表（安装包 + 官方文档，`pnpm run sync:color-ids` 刷新）与构建期核对 —— 上线即抓到并删除 **12 个死键**（`chat.editorBackground`、`chat.suggestedRequest*`、`editorPlaceholder.foreground`、`editorStickyScroll.foreground`、`inlineChat.regionHighlight`、`modernActivityBar.foreground`、`portsIconRunningForeground`、`terminalCommandGuide.{background,border,activeForeground}`、`textBlockQuote.foreground`）。
- **跨仓库契约快照**：`docs/token-names.snapshot.json` + `pnpm run check:contract` —— 角色名"只增不删、不改名、CSS/SCSS/TS 三端一致"，防止无意改动弄坏 moongate-vue 的 `check-tokens.ts`。
- **产出物一致性**：`pnpm run check:artifacts`（重建后 `git diff` 产物）；构建内置 prettier 格式化生成的 markdown，`docs/DESIGN_SYSTEM.md` 的格式漂移与内容陈旧（`highlight`/`gitAdded` 旧值）一并修正。
- **构建失败路径与幂等性**：`scripts/lib/config.js` 支持 `MOONGATE_ROOT`，测试在临时副本里注入坏数据断言 7 条失败分支（架构违规/裸色值/未定义角色/半配对不可读/区分度不一致/键位不一致/对比度不足）＋ 连续两次构建字节一致。
- **语义键可达性**：对照已装扩展声明的类型/修饰符（含 superType 层级）检查 `semantic.yaml`，4 个为其它服务器预留的键登记理由。
- **样式字段合法性**：`fontStyle` 取值、`semanticTokenColors` 键模式与未知字段、`tokenColors` scope 名形状。
- **发布元数据与打包**：`docs/COVERAGE.md` 内容与数字断言、`verify-scopes` CLI 退出码、版本号 ⟷ CHANGELOG 标题、`contributes.*` 文件存在性、`vsce ls` 打包清单（含语法文件、不含源码/依赖）。
- **可移植性与健壮性**：docstring 语法测试按 `VSCODE_EXTENSIONS_DIR` / 平台路径解析，缺 VS Code 时 **skip 而非失败**；新增对抗性输入用例（未闭合 docstring、10 万字符长行、深嵌套类型、CRLF、引号转义），并借此**收紧注入语法**：纯 `*`/`` ` ``长串不再被误判为粗体/斜体/行内字面量。

## [2.7.1] - 2026-09-06

### 🎨 语义层文本层级重构（浅色）

- **灰阶体系规范化**：色板重排为严格单调的 15 档灰阶（`gray-525 → gray-350`、`gray-550 → gray-450`、新增 `gray-550 #55647c`），编号与亮度严格同向；删除与实引用不符的 8 个未使用原始色（`blue-900/green-700/yellow-500/red-500` 等），修正陈旧注释，构建不再告警。
- **浅色角色去塌陷**：原 `comment/textMuted/textDim/variableDim/operator` 五个角色共用一个 `#475569` 的问题已修复——`comment` 独立为 `#55647c`（5.7:1）、`operator` 与 `punctuation` 同级 `#64748b`、`textMuted` 独立为 `#64748b`（4.55:1，兼顾 property/namespace 等代码角色）、`textInactive` 单独下沉 `#7a8c9e`（2.45:1 → 3.31:1，达标）。
- **浅色终端 ANSI 16 色可读化**：`ansiWhite`/`ansiBrightWhite` 由近白/纯白改为墨色中灰（≥4.5:1），全部 bright 变体改用可读的亮变体（≥3:1）；黑族（Black/BrightBlack）对比度豁免并注释化。
- 深色**语法与文本颜色**基本不变（`operator` 微调 ΔE<1）；UI 交互实底背景的加深见下条。
- **深色交互对比度修复**：新增语义角色 `primarySolid`（dark=`#2563eb`/light=`#1e40af`）与 `selectionForeground`（dark=白/light=正文墨色）；按钮/菜单/徽章/输入激活/活动栏徽章/扩展按钮等承载小号白字的实底背景、列表/建议/标签选中行前景切到新角色——dark 白字对比度由 3.68:1 → 5.17:1，选中行前景 4.19:1 → 5.17:1；light 观感不变。

### 🛠️ 工程化校验强化

- **跨规则 scope 冲突检测**：`verify-scopes.js` 新增检测（同一 scope 对应不同 settings 即报错）；修复 `go.yaml` 中 `keyword.channel.go` 同时挂在两套规则的问题；scope 校验新增「组合名语法原子」匹配，修复 CSS `support.type.property-name.css` 误报。
- **分层引用强制化**：组件/规则层直接引用原始值、语义层误用 `${var}` 或引用非原始值 → 构建失败并给出修复提示（原仅警告）。
- **消费者层禁裸 hex**：workbench 遗留的 `editorUnnecessaryCode.opacity: #00000022` 转正为语义角色 `codeDim`（`{black}22`）；新增"消费者层直写裸色值即构建失败"校验。
- **WCAG 阈值矩阵扩展**：新增 `textInactive` ≥3:1、终端 ANSI 全色校验（白族 ≥4.5:1）、dark/light 语义层键位一致性校验；**UI 交互配对矩阵**（白字 on 实底强调/选中行前景 on 选中背景 ≥4.5:1，含 alpha 合成）；CSS 变量名集保持稳定（本版仅新增 `primarySolid`/`selectionForeground`/`codeDim` 3 个角色）。
- 生成器 `toCssKey` 收敛为单一实现；`docs/TOKEN_CONVENTIONS.md` 记录命名、别名登记与豁免清单。

### 🤝 生态同步

- 重新生成 `themes/*` 并同步 `moongate-vue`：`src/styles/tokens/colors.css` 覆盖更新、组件 fallback 字面量（`--ui-text-inactive`）同步、`design-tokens.md` 数值表更新；`moongate-vue` 的 `check-tokens.ts` 与完整构建通过，`dist/style.css` 已重建。
- 宣传措辞统一：README / 徽章由「DTCG 标准」改为「DTCG-inspired / DTCG 风格」（自研 YAML 令牌体系，非完整 DTCG `$type/$value` 格式）。

---

## [2.7.0] - 2026-08-19

### 🚀 新增 3 种语言支持

- **C/C++**（`cpp.yaml`）：预处理指令（`#include`/`#define`）、指针与引用操作符、模板类型、类/结构体/枚举声明、构造函数/析构函数、namespace、`this` 指针、作用域解析 `::`、`const` 修饰、lambda 捕获、格式化占位符、转义字符。37 个 scope 全部通过 VS Code 内置语法验证。
- **Java**（`java.yaml`）：注解 `@Override` 等、泛型 `<T>`、类/枚举/record 声明、`this` 关键字、包名与导入、基本类型、继承/实现/密封修饰、Javadoc 注释、转义字符。23 个 scope 全部验证通过。
- **C#**（`csharp.yaml`）：特性 `[Serializable]`、泛型、类/结构体/枚举/记录/委托声明、`this` 关键字、命名空间、预处理指令、LINQ 查询关键字、委托/事件、字符串插值、discard 变量。45 个 scope 全部验证通过。

### 🎨 WCAG 对比度全面修复

- **语义层 4 个角色不达标已修复**：浅色 `punctuation`（2.45:1 → 4.55:1）、`primary`（3.92:1 → 8.35:1）、`success`（3.61:1 → 5.25:1），深色 `operator`（2.36:1 → 5.32:1）。新增 `blue-950`、`green-800`、`gray-450` 原始色值。
- **tokenColors 层全面审计**：逐一检查 24 种语法高亮颜色在编辑器背景上的对比度，修复 HTML Doctype 使用 `${border}` 导致的几乎不可见问题（深色 1.49:1 → 5.16:1，浅色 1.42:1 → 7.25:1），改用 `${textMuted}`。
- **构建时 WCAG 校验扩展**：`checkContrast` 从 3 个角色扩展至 13 个（覆盖所有前景色角色 vs 背景），确保新增对比度问题不会回归。

### 🐛 构建脚本修复

- **修复 `replaceVariables` 递归丢失 `primitiveKeys`**：嵌套结构中的架构污染检测现在所有层级正确生效。
- **消除 `buildSingleTheme` 重复文件读取**：预加载的语义数据直接传入构建函数，布局令牌仅加载一次供 CSS/SCSS 生成复用。

### 🛠️ 代码质量优化

- 合并 `normalizeHex` 重复分支、移除 `resolveTokens` 冗余深度检查、`getThemeInfo` 复用 `ROOT_DIR`。
- `scopeMatches` 通配符正则新增缓存，减少重复编译。

---

<details>
<summary>## [2.6.0] - 2026-08-05</summary>

### 🚀 新增 3 种语言支持

- **Shell/Bash**（`shell.yaml`）：控制关键字、内建命令、命令调用、变量赋值、位置参数与特殊变量、命令替换（`$(...)` / 反引号）、here-doc / here-string、数组与关联数组、数值运算、`case` / `while` / `select` / `trap` 等。
- **Dockerfile**（`dockerfile.yaml`）：`FROM`/`AS` 指令、全部控制指令（`COPY`/`ADD`/`ARG`/`CMD`/`ENTRYPOINT`/`ENV`/`EXPOSE` 等）、JSON 数组语法、转义字符、注释与 TODO 标记。
- **SQL**（`sql.yaml`）：DML / DDL 关键字、聚合函数、操作符、存储修饰符、数字、文本变量、字符串与注释。

### 🎨 语言 scope 全面修复（8 个语言文件）

- **新增 `verify-scopes.js` 验证工具**：自动解析 VS Code 内置 TextMate 语法，比对语言配置中的每个 scope，杜绝"规则写了对不上"的问题。
- **JSX/TSX**：修正 `.jsx` 实际使用 `.js.jsx` 后缀（如 `support.class.component.js.jsx`）、`.tsx` 使用 `*.tsx` 后缀的关键问题；修复 React Hooks / Fragment / 实体字符 scope。
- **Python**：修正 `meta.decorator.python` → `meta.function.decorator.python`，补充 `self`/`cls` 特殊变量、f-string 与格式化占位符规则。
- **Rust**：修正 21 处不存在的 scope（lifetime → `entity.name.type.lifetime.rust`、`support.macro.rust` → `entity.name.function.macro.rust`、`support.self.rust` → `variable.language.self.rust` 等），补充 struct/enum/trait 类型声明、基础类型与 Option/Result 规则。
- **CSS**：修正 `source.css variable` → `variable.css`、`meta.function.css variable` → `meta.function.variable.css`，补充类/ID 选择器、颜色值、数字、内置函数（calc/url/gradient）规则。
- **Go**：全面重写，移除 20 个不存在的 scope（`entity.name.package.go`、`storage.type.pointer.go`、`constant.language.nil.go` 等），改用验证过的 `keyword.struct.go` / `keyword.interface.go` / `entity.name.type.*` / `variable.parameter.go` 等。
- **Markdown**：修正标题 scope（`heading.1.markdown` ~ `heading.6.markdown`）、围栏代码块（`markup.fenced_code.block.markdown`）、语言标识（`fenced_code.block.language.markdown`），新增引用/删除线/链接规则。
- **HTML**：修正 doctype（`meta.tag.metadata.doctype.html`）、移除不存在的 scope，新增标签标点、内联标签规则。

### 📦 跨平台令牌产物

- **新增 `_tokens.scss`**：Sass 颜色 Maps（`$ui-colors-dark` / `$ui-colors-light`）、间距 Map、深色便捷变量。
- **新增 `tokens.ts`**：TypeScript 类型化导出（`MoongateTokens` 接口 + `tokens` 对象）。
- 两套产物均由 `build.js` 自动生成，与 `moongate-colors.css` / `DESIGN_SYSTEM.md` 同步输出。

### 🛠️ 构建脚本工程化优化

- **修复架构检测失效**：`replaceVariables` 现在正确传递 `primitiveKeys`，「语义层直接引用原始值」的架构污染警告重新生效。
- **消除代码重复**：`generate-better-comments.js` 复用 `scripts/lib/tokens.js` 的 `resolveTokens`，移除冗余实现，统一循环引用检测逻辑。
- **拆分 `build.js` 主流程**：196 行的 `main()` 拆分为 10 个单一职责函数（文件加载、规则扫描、主题构建、验证等），便于测试与维护。
- **错误处理统一**：构建验证从 `process.exit` 改为抛错（新增 `ThemeValidationError`），由主流程统一捕获处理，库函数可在非 CLI 场景复用。
- **token 合并稳定性**：`mergeTokenColors` 对 settings 键排序，避免相同规则因键序不同（如 `{foreground, fontStyle}` vs `{fontStyle, foreground}`）被重复合并。
- **重复色值检测提取**：`detectDuplicateColors` 从构建脚本内联逻辑提取为独立工具函数，可复用可测试。

### 🧪 测试覆盖大幅提升

- **测试总数 54 → 72**：新增 generators（CSS/设计系统文档/SCSS/TS 令牌）、Better Comments 生成器测试。
- **新增 `test/helpers.js`**：统一捕获 console 输出、断言抛错行为的测试辅助函数，消除测试中的 monkey-patch 冗余。
- **Better Comments 开箱即用**：主题内置 `src/special/better-comments.yaml` 的 6 个特殊注释 scope 规则（TODO、FIXME、NOTE、HACK、BUG、XXX），安装 Moongate 后 Better Comments 插件自动使用官方配色，零配置；`extras/better-comments.json` 独立预设由构建脚本自动生成（`pnpm run gen:better-comments`），供不安装主题的用户单独参考，并新增测试验证其与深色语义层一一对应。
- **工具函数边界补充**：`normalizeHex` 非法格式抛错、`detectDuplicateColors` 重复/无重复场景等。

</details>

---

<details>
<summary>⚛️ v2.5.0 - 2026-08-05 · React JSX/TSX 与 149 个现代 UI 适配</summary>

### ⚛️ 新增 React JSX/TSX 专属规则

- **新增 `jsx.yaml` 语言配置**：为 React 自定义组件、Attributes/Props、内嵌表达式、Hooks、Fragment 提供专属着色，补齐"声称支持 React"的规则缺口。
- **自定义组件与原生 HTML 区分**：自定义组件（大写开头）使用月光黄加粗（`#fbbf24` bold），原生 HTML 标签保持红色，组件结构与原生标签一目了然，呼应 v1.2.0 的既有设计语言。
- **React Hooks 语义化**：`useState`、`useEffect` 等 Hooks 使用紫色斜体（`#c084fc` italic），与装饰器/宏的语义色一致，一眼识别 React 特有 API。
- **内嵌表达式与 Vue 对称**：JSX/TSX 的 `{}` 内嵌表达式与父标签符号使用发光蓝（`#7dd3fc`），与 Vue 插值规则视觉对称。
- **一个文件覆盖两语言**：由于 VS Code 的 TS/JS 语法中 `.jsx` 与 `.tsx` 共享 `*.jsx` scope 后缀，单个 `jsx.yaml` 同时生效于 JSX 与 TSX。

### 🧩 现代 VS Code UI 适配补全

- **新增 149 个现代 UI key**（覆盖全部 348 个 UI colors 的 43%）：涵盖 Sticky Scroll 全系变体（编辑器/面板/侧边栏/终端/输出视图/Peek）、AI Chat / Inline Chat 及 Copilot 与会话指示器、Command Center、Terminal Command Guide、Ghost Text / Unicode 高亮、Comments / Ports、Symbol Icons、Lightbulb（含 AI）、多光标、Unnecessary Code、状态栏错误/警告/离线态、标签选中态、Radio/Checkbox/Banner 等。
- **全部通过语义层变量引用**：Sticky Scroll 隆起层、AI 聊天浮层、符号图标按类型映射主题语义色（函数发光蓝、类月光黄、字符串月灵花绿、泛型青色等），与既有设计语言完全统一。
- **修复默认回退色突兀问题**：此前这些区域在 Moongate 下回退到 VS Code 默认配色（如默认蓝），现在与月影灰基调融为一体。
- **engines 升级**：最低 VS Code 版本要求从 `^1.109.0` 提升至 `^1.130.0`，确保 Chat/Copilot、Sticky Scroll 变体等新 key 正常工作。
- **engines upgraded**: Minimum VS Code version raised from `^1.109.0` to `^1.130.0` to ensure new keys (Chat/Copilot, Sticky Scroll variants, etc.) work properly.

</details>

---

<details>
<summary>🧹 v2.4.0 - 2026-07-04 · 语言精简、Rust 与 TS 一致性</summary>

### 🧹 语言配置全面精简

- **大幅精简各语言配置文件**：移除与 `base.yaml` 重复的通用规则，每个语言文件只保留其独有的语法规则，大幅降低维护成本。
  - Python：9 → 4 条（精简 56%）
  - CSS：8 → 4 条（精简 50%）
  - HTML：6 → 5 条（精简 17%）
  - Go：21 → 18 条（精简 14%）
- **核心原则**：`base.yaml` 已有的通用规则（关键字、字符串、注释、操作符、变量等），语言文件不再重复定义。
- `javascript.yaml` 和 `typescript.yaml` 保持为空，完全继承 `base.yaml` 的通用规则。

### 🦀 新增 Rust 语言支持

- **新增 Rust 专属语言规则**：创建 `rust.yaml` 配置文件，覆盖泛型参数、生命周期、属性、宏、Self 关键字等 Rust 特有语法元素。
- **Rust 函数样式处理**：由于 Rust TextMate 语法中函数定义与调用的 scope 相同（均为 `entity.name.function.rust`），无法区分两者，统一将所有 Rust 函数（定义与调用）设为加粗，与 Go 的处理方式保持一致，接受该语法的先天限制。
- **类型系统着色**：泛型参数、生命周期使用青色点缀，属性使用紫色斜体，与主题整体配色风格统一。

### 🎯 TypeScript 内置对象视觉一致性

- **修复 `JSON` 对象意外加粗问题**：移除 `base.yaml` 中 `variable.other.constant` 的加粗样式，使 `JSON`、`console`、`Math` 等所有 TypeScript 内置对象视觉风格统一，不再出现个别对象单独加粗的不一致现象。
- **移除 `*.defaultLibrary` 加粗规则**：语义高亮层面不再强制为所有内置库符号添加加粗样式，与 Go、Python 的内置函数处理方式保持一致，实现跨语言视觉统一。

### 📦 构建脚本优化

- **新增 Token 合并功能**：构建脚本自动合并相同 `settings`（颜色 + 样式）的 token 规则，大幅精简生成的 JSON 主题文件。
  - `tokenColors` 规则数从约 89 条精简至约 34 条，减少 **62%**
  - 主题 JSON 文件整体体积减小约 **16%**
  - 构建时自动输出合并统计：`📦 token 合并: 89 → 34 条规则`

</details>

---

<details>
<summary>🧩 v2.3.0 - 2026-06-24 · Go 深度适配与 Python 修复</summary>

### 🧩 Go 语言语法高亮深度适配

- **新增专属语言规则**：为 Go 语言创建独立的 `go.yaml` 配置文件，覆盖包名、方法接收者、标签、空白标识符、错误变量等 Go 特有语法元素，使代码语义更清晰。
- **函数定义与调用视觉分离**：函数定义采用发光蓝加粗，与关键字形成清晰的视觉层级；所有函数调用（含标准库 `fmt.Sprintf`、内置函数 `len` 等）保持发光蓝但不加粗，实现“定义醒目、调用轻量”的阅读体验。由于 Go TextMate 语法无法区分自定义调用与标准库调用，两者统一不加粗，牺牲标准库的加粗效果以换取定义与调用的清晰区分。
- **类型系统精细着色**：结构体、接口、类型别名、指针、切片、Map 分别赋予不同颜色，一望即知元素类型。
- **错误处理醒目提示**：错误变量（如 `ErrInvalidInput`）采用红色斜体，在代码中快速定位异常路径。
- **并发原语高亮**：通道操作（`<-`）和 `select`、`go` 等并发关键字得到正确着色，提升并发代码的可读性。
- **格式化占位符着色**：`fmt.Printf` 等函数中的 `%d`、`%s` 占位符使用发光蓝高亮，与字符串模板内嵌表达式风格统一。

### 🐍 Python 函数调用修复

- **修复 Python 函数调用识别**：修复 Python 函数调用无法区分定义与调用的问题，`meta.function-call.python` 作用域现已正确匹配，函数调用不再加粗，与其他语言行为保持一致。

### 🔧 跨语言一致性

- 统一所有语言的函数名样式：**函数定义加粗，函数调用不加粗**，与 JavaScript、TypeScript、Python、Go 行为保持一致，形成统一的视觉语言体系。

### 📦 工程优化

- **语义高亮自动开启**：`package.json` 新增 `configurationDefaults` 配置，用户安装主题后语义高亮自动生效，无需手动设置。
- **商店页展示优化**：新增 `galleryBanner` 和 `badges` 配置，插件在 VS Code 扩展市场中展示更专业。

</details>

---

<details>
<summary>🎨 v2.2.0 - 2026-03-27 · DTCG 令牌与海拔系统</summary>

### 🎨 DTCG 设计令牌标准：从主题到设计系统

- **三层架构**：引入原始值（Primitives）、语义层（Semantics）、组件层（Components），颜色管理彻底规范化。原始值按色相-明度命名（如 `blue-500`、`gray-900`），语义层定义角色（如 `primary`、`bg`），组件层直接对应 UI 元素。
- **自动生成设计资产**：构建脚本自动生成 `moongate-colors.css`（CSS 变量文件）和 `DESIGN_SYSTEM.md`（完整设计系统文档），供博客、UI 组件库复用，实现设计语言统一。
- **跨平台就绪**：所有颜色变量可一键导出为 CSS、SCSS、JS 模块，为未来多平台扩展奠定基础。

### 🏔️ 海拔系统深度优化

- **浅色模式"越高越亮"**：侧边栏（`surfaceRaised`）采用纯白 `#ffffff`，编辑器背景（`surfaceGround`）保持微冷白 `#f9fafb`，形成纸张层叠的通透感；浮层（`surfaceFloating`）使用 `#f1f5f9`，配合半透明主色边框，边界更清晰。
- **深色模式层次增强**：侧边栏明度从 `#131c31` 提升至 `#1a2538`，弹窗从 `#1e293b` 提升至 `#25364a`，层次对比更明显。
- **终端可读性修复**：浅色模式下 `ansiWhite` 调整为浅灰 `#e2e8f0`，避免白色文字在浅色背景上消失。

### 🛠️ 工业级构建脚本

- **颜色标准化**：自动补全 3 位/4 位 Hex，校验非法色值，确保所有色值符合 6 位或 8 位规范。
- **循环引用检测**：令牌嵌套深度超过 20 层时熔断并输出引用链，防止构建死循环。
- **透明度安全网**：智能识别 `rgba()`、已含透明度的 8 位 Hex，避免非法拼接。
- **WCAG 对比度质检**：自动校验正文、次要文字、注释等关键角色的对比度，低于标准则中断构建，保证主题在任何环境下清晰可读。

### 📄 工程化文档与资产

- **`moongate-colors.css`**：自动生成的 CSS 变量文件，供博客、UI 组件库直接引用，实现深浅模式无缝切换。
- **`DESIGN_SYSTEM.md`**：完整的设计系统文档，包含色板预览、海拔系统说明、语义层对比度数据，可作为团队协作的真理来源。

</details>

---

<details>
<summary>✨ v2.1.0 - 2026-03-14 · 海拔系统</summary>

### ✨ 海拔系统：让界面拥有物理深度

- **引入海拔变量**：新增 `surfaceGround`、`surfaceRaised`、`surfaceFloating`、`surfaceTooltip` 四层海拔阶梯，为 UI 赋予清晰的物理层次。
- **深色模式**：侧边栏、活动栏等次级区域（`surfaceRaised`）比编辑器背景（`surfaceGround`）亮约 5%，形成微微隆起的"面板感"；弹窗、菜单等浮层（`surfaceFloating`）再提升 5%，并带有半透明主色边框（`borderFloating`），边界更清晰。
- **浅色模式**：基于重力补偿原则，次级区域比编辑器背景暗约 3%，浮层再暗 3%，在保持通透感的同时，通过明度差异实现"纸张层叠"的优雅分离。
- **全 UI 适配**：对侧边栏、活动栏、状态栏、输入框、下拉菜单、通知中心、快速输入等 20+ 个区域进行了海拔映射，视觉层次全面提升。

</details>

---

<details>
<summary>🌗 v2.0.0 - 2026-03-11 · 昼夜双子发布</summary>

### 🌗 昼夜双子：工程化重构与浅色主题发布

- **Moongate Light 晨曦模式**：基于"重力补偿"原则，为浅色背景深度优化。冷调基底 `#f9fafb`，语义色明度精准映射，与深色版保持 1:1 视觉权重。
- **模块化工程架构**：从单体 JSON 升级为 YAML 模块化系统，变量集中管理，支持多主题一键构建。
- **构建脚本引入**：通过 Node.js 脚本（`scripts/build.js`）自动合并 YAML 源文件、替换颜色变量，生成最终主题 JSON，彻底告别手动维护的混乱。

### ✨ 颜色系统重构

- **1:1 变量映射**：深/浅色版使用完全相同的变量名，`workbench.yaml` 等规则文件无需修改，切换主题时自动适配。
- **语义一致性**：所有语法角色（关键字、字符串、函数等）在两套主题中颜色角色完全对齐，切换主题无需重新学习。
- **变量替换安全网**：构建脚本支持智能处理透明度后缀，自动检测变量是否已含透明度，避免生成非法色值。

### 🔷 JSON 嵌套颜色优化

- **蓝 → 青 → 紫 阶梯**：顶层键使用主蓝 (`primary`)，第二层使用青色 (`cyan`)，第三层使用紫色 (`purple`)，嵌套深度一目了然，且避免使用红/黄色系，不引起语义误读。
- **结构清晰**：复杂的配置文件现在可以凭借颜色快速定位层级。

### 🎨 UI 细节打磨

- **浅色模式交互反馈**：悬停背景、选中背景、边框等元素已针对浅色背景微调，保持"静默唤醒"的交互哲学。
- **滚动条透明度**：浅色模式下滚动条滑块透明度优化，既可见又不刺眼。
- **终端 ANSI 色同步**：16 色终端配色已同步适配浅色版，与编辑器内配色一致。

### 📦 工程化构建系统

- **目录结构标准化**：源码统一存放于 `src/`，按功能分为 `core/`、`languages/`、`special/`、`workbench.yaml`、`semantic.yaml`。
- **语言规则自动扫描**：构建脚本自动加载 `languages/` 和 `special/` 下的所有 YAML 文件，无需手动维护规则列表。
- **输出文件名智能净化**：基于 `package.json` 的 `name` 自动生成主题文件名（如 `moongate-dark.json`、`moongate-light.json`），并移除冗余的 `-theme` 后缀。
- **错误处理增强**：关键文件缺失或 YAML 格式错误时，脚本给出明确提示并安全退出，避免生成不完整的主题。

### 🧠 设计理念文档化

- **《Moongate 视觉契约》**：随主题发布一份详细的视觉契约，阐述冷调基底、重力补偿、语义映射等核心设计原则，并指导用户校准显示器以获得最佳体验（位于 `extras/` 目录）。
- **P1-P5 工程协议**：引入问题复杂度分级体系，将博客文章按难度标记为 P1~P5，未来将逐步应用于文档体系。

</details>

---

<details>
<summary>📜 v1.x - 历史版本</summary>

### [1.5.0] - 2026-03-06

#### ✨ 新语法支持

- **Python 嵌套 f-string**：多层嵌套下变量、字符串、表达式着色准确

#### ✨ 语义增强

- **Inlay Hints 视觉优化**：内嵌提示使用月影灰（`#64748b`）退后，不干扰主逻辑
- **诊断信息边框**：错误、警告、信息添加半透明边框，夜间更柔和

#### 🔧 优化

- 微调了部分颜色的亮度阶梯

### [1.4.0] - 2026-03-05

#### ✨ 白天可读性优化：让月光穿透环境光

- **注释提亮**：`#94a3b8` → `#a5b4cb`，强光下依然清晰，夜间依然退后
- **操作符提亮**：`#64748b` → `#8596a5`，逻辑骨架不再"消失"
- **变量微调**：`#cbd5e1` → `#d4dcee`，主体文字更扎实
- **函数优化**：`#7dd3fc` → `#87cefa`，温润的荧光蓝，日夜兼顾
- **冒号/点操作符统一提亮**：从 `#64748b` 提升至 `#8596a5`，细小符号不再丢失
- **状态栏前景提亮**：`#94a3b8` → `#cbd5e1`，信息易读，仍保持沉降
- **选中文本添加边框**：`editor.selectionHighlightBorder: #3b82f680`，操作更精准
- **属性颜色统一**：成员属性与语义高亮一致为 `#94a3b8`，消除不一致
- **异步函数颜色同步**：统一为 `#87cefa`，保留加粗斜体，语义不变

#### ✨ 搜索结果高亮分层

- **当前选中匹配项**：主蓝半透明背景 + 边框，一眼定位
- **其他匹配项**：更淡的背景，层次分明

#### ✨ 视觉契约：Moongate 的硬件适配哲学

Moongate Dark 不是为了"亮"而设计的，它是为了"对比度"设计的。在物理亮度极低的环境下，对比度就是你眼睛的最后一道防线。本次更新我们同步发布了 **《Moongate 视觉契约》**，帮助你校准显示器，让月光在你的屏幕上准确还原。你可以在 `extras/` 目录中找到这份指南，或直接阅读 README。

#### 🔧 修复与优化

- 修复了部分场景下属性颜色不一致的问题
- 优化了 Python 装饰器的显示效果
- 微调了 JSDoc 标签的亮度，与主语义色对齐

### [1.3.0] - 2026-03-03

#### ✨ 语义修饰符深度定制

- 函数、方法、类定义加粗，与调用处形成鲜明对比
- 静态成员（方法/属性）使用斜体，与普通成员区分
- 废弃符号增加删除线，一眼识别过时 API
- 异步函数使用加粗斜体，暗示其异步特性
- 抽象类/方法使用斜体，传达"未实现"语义
- 内置对象加粗，彰显其语言核心地位

#### ✨ 括号高亮月语义化

- 为 6 层嵌套括号分配月语义色：发光蓝、月灵花绿、月光黄、月虹紫、主蓝、月影灰
- 未匹配括号使用红月警示
- 匹配括号对保留主蓝半透明背景 + 边框，定位更精准

#### ✨ JSDoc/TSDoc 语义高亮

- 标签（@param、@returns 等）使用主蓝加粗
- 参数名使用月灵花绿斜体
- 类型使用发光蓝
- 大括号等标点使用操作符灰退后

### [1.2.0] - 2026-03-01

#### ✨ 混合语言嵌入深度优化

- **模板字符串内组件高亮**：在 JSX/TSX/Vue 模板字符串中，自定义组件使用月光黄 (`#fbbf24`)，原生 HTML 标签保持红色 (`#f87171`)，组件结构一目了然
- **Markdown 代码块语言标识高亮**：围栏代码块的语言名称（如 ` ```python ` 中的 `python`）使用月虹紫 (`#c084fc`) 斜体标识，元数据显性化

#### ✨ 特殊注释可视化标记（与 Better Comments 搭配）

- 为 Better Comments 插件提供官方配色预设（位于 `extras/better-comments.json`）
- **TODO**：月光黄加粗 (`#fbbf24` bold)
- **FIXME**：红月加粗斜体 (`#f87171` bold italic)
- **NOTE**：发光蓝斜体 (`#7dd3fc` italic)
- **HACK**：月虹紫加粗 (`#c084fc` bold)
- **BUG**：红月加粗下划线 (`#f87171` bold underline)
- **XXX**：月光黄加粗 (`#fbbf24` bold)

#### ✨ 终端颜色同步

- 终端的 16 种 ANSI 颜色现已映射到 Moongate 的月语义色系
- `console.log` 中的字符串、数字、错误等与编辑器内配色完全统一
- 终端背景与编辑器背景一致 (`#0f172a`)，视觉无割裂感

### [1.1.0] - 2026-02-27

#### ✨ 优化

- **只读变量斜体**：只读变量（如 const、只读参数）现在使用斜体，与普通变量区分
- **泛型参数青色**：泛型参数使用青色 (`#22d3ee`)，让复杂泛型一目了然
- **Python 装饰器统一**：所有 Python 装饰器（`@property`、`@xxx.setter`、`@classmethod` 等）统一为紫色 (`#c084fc`) 斜体，元数据与普通函数清晰分离

### [1.0.2] - 2026-02-26

#### 📚 文档

- **添加双语 README**：支持中英文切换，方便更多用户
- **更新预览截图**：展示 v1.0.2 优化后的实际效果
- **添加推荐配置说明**：指导用户开启语义高亮

### [1.0.1] - 2026-02-25

#### ✨ 优化

- 视觉舒适度：调暗局部变量、参数，缓解大面积白色疲劳
- 启用语义高亮，跨语言统一变量表现
- Python 代码变量降权，提升可读性

### [1.0.0] - 2026-02-24

#### 🎉 首次发布

- 极简科幻终端风格的深色主题
- 基于月语义的配色系统：主蓝 (`#3b82f6`)、月灵花绿 (`#34d399`)、月光黄 (`#fbbf24`)、红月 (`#f87171`)
- 视觉远近法：操作符退后、函数发光、注释斜体
- 支持语言：JavaScript/TypeScript/React/Vue/HTML/CSS/JSON/Markdown/Python
- 完整 UI 配色：标题栏、状态栏、侧边栏、终端等均已完成适配

#### ✨ 特性

- 直角美学：所有 UI 元素均为直角，拒绝圆角
- 静默交互：链接平时融入文本，悬停时亮起
- 编辑器化设计：代码块带窗口标签，行内代码自发光
- 状态栏沉降：与编辑器背景融合，不干扰阅读

#### 🧠 设计理念

- 冷调基底 + 暖色点缀
- 每个颜色都有月相隐喻
- 视觉层次分三档：前景/中景/背景

</details>
