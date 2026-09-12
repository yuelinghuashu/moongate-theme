# Moongate 令牌约定（Token Conventions）

> 说明：本项目使用 **DTCG 风格（DTCG-inspired）** 的三层令牌体系
> （原始值 primitives → 语义层 semantics → 组件层 components），
> 但**不是**完整 DTCG 格式（无 `$type/$value/$description`、非标准别名语法）。
> 对外宣传与 README 均按 "DTCG-inspired" 表述。

## 1. 分层与引用语法

| 层          | 文件                                                          | 引用方式           | 约束                                                       |
| ----------- | ------------------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| 原始值      | `src/core/primitives/colors.yaml`                             | 定义处即值         | 色值只允许 6 位/8 位 hex                                   |
| 语义层      | `src/core/semantics/dark.yaml` / `light.yaml`                 | `{primitive}`      | 只允许引用原始值；禁止 `${var}`；dark/light 键集合必须一致 |
| 组件/规则层 | `workbench.yaml`、`semantic.yaml`、`languages/*`、`special/*` | `${semantic-role}` | 禁止直接引用 `{primitive}`                                 |

**强制化**：`scripts/build.js` 在构建期调用
`assertNoDirectPrimitiveRefs` / `assertSemanticReferencesPrimitivesOnly`，
违规直接构建失败（带修复提示）。不要绕过。

## 2. 透明度后缀约定

颜色值允许在引用后追加两位十六进制透明度，解析为 8 位 hex（`#RRGGBBAA`）：

```yaml
bgHover: "{blue-500}20" # → #3b82f620
overlayScrim: "{black}80" # → #00000080
```

- 语义层与组件层均可使用该后缀（语义层在 `{}` 后、组件层在 `}` 后）。
- 最终产物必须是 6 位或 8 位 hex，构建期强校验。

## 3. 命名规范

- 色相-明度命名：`{hue}-{step}`，**step 数字越大颜色越暗**（对灰阶严格单调）。
- 灰阶中间档：`350 / 450 / 550` 为扩展档，仅在语义角色层级需要时新增；
  新增档位必须同时满足两模式的层级序与对比度楼层（见 §5）。
- 语义角色：camelCase（如 `surfaceGround`、`ansiBrightBlack`）；
  导出为 CSS 时经单一 `toCssKey` 转 kebab（`--ui-surface-ground`）。
- 布局令牌沿用 `layout.yaml` 现状，勿混入新 case 风格。
- **语义角色名不删除、不改名**：`--ui-*` 变量名集合是跨仓库契约
  （moongate-vue 的 `check-tokens.ts` 依赖），只允许新增。

## 4. 有意别名登记表（勿当 bug "修复"）

同一角色在深/浅两模式可映射不同档位；不同角色可有意共享同一色值。
以下为**当前有意别名**：

| 模式       | 色值                  | 角色组                                                    | 理由                                                                       |
| ---------- | --------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| dark       | `#7a8c9e` (gray-450)  | `operator`、`textMuted`                                   | 二者同为最弱可读文本档，≥4.5:1，便于 property/namespace 代码角色保持可读   |
| dark       | `#94a3b8` (gray-400)  | `punctuation`、`textInactive`、`bracket6`、`gitUntracked` | 弱化语法符号与弱 UI 文本共用档位                                           |
| light      | `#64748b` (gray-500)  | `punctuation`、`operator`、`textMuted`                    | 运算符与标点同级；textMuted 兼顾代码角色可读性（≥4.5:1）                   |
| light      | `#1e40af` (blue-950)  | `primary`、`primarySolid`                                 | 实底强调与主色同值（白字 ≥4.5:1）                                          |
| dark       | `#2563eb` (blue-600)  | `primarySolid`、`selectedBg`、`buttonHoverBg`             | 实底强调/选中背景共用深蓝，白字 ≥5:1                                       |
| light      | `#0f172a` (gray-900)  | `text`、`selectionForeground`                             | 浅色选中行为浅灰底，前景保持正文墨色                                       |
| dark       | `#ffffff`             | `white`、`selectionForeground`                            | 深色选中/实底为蓝底，前景用白                                              |
| light/dark | `#00000022`           | `codeDim`                                                 | 无用代码压暗遮罩（唯一"文字遮罩"语义角色）                                 |
| light/dark | ANSI 黑族             | `ansiBlack`、`ansiBrightBlack`                            | 终端底色族天然低对比，**豁免** WCAG 阈值                                   |
| light      | `#2563eb` (blue-600)  | `highlight`、`ansiBrightBlue`                             | 浅色 highlight 与 function 拆色后的新档（原二者同为 blue-800，区分度塌陷） |
| light/dark | `#047857` / `#34d399` | `success`、`gitAdded`                                     | 新增/成功同族同档；浅色原 green-600 仅 3.61:1，不满足正文阈值              |
| light/dark | `#0f172a` / `#f9fafb` | `surfaceGround`（作前景用于彩色实底）                     | 彩色实底（校验/状态栏错误项/终端光标块）上的文字统一用它                   |

修改色板时：若想给某角色独立颜色，请优先新增/调整灰阶档位并在本表登记，
而不是删除共享档（会触发 `unused primitives` 或破坏别名约定文档）。

## 5. 对比度楼层（构建期强校验）

背景取各自模式 `bg`（terminal ANSI 对 terminal.background 校验）：

| 角色                                                                                                                             | 阈值                                                         |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 正文/语法角色：text / variable / variableDim / textDim / punctuation / operator / function / primary / success / warning / error | ≥4.5:1                                                       |
| comment（专用注释色）                                                                                                            | ≥4.0:1（实测深浅 5.7–8.5:1）                                 |
| textMuted（占位/弱化文本；property/namespace 亦消费）                                                                            | ≥3:1（当前深浅均 ≥4.5:1）                                    |
| textInactive（非活跃 UI 文本）                                                                                                   | ≥3:1（浅色 3.31:1；深色 6.96:1）                             |
| ANSI 非黑族                                                                                                                      | ≥3:1                                                         |
| ansiWhite / ansiBrightWhite                                                                                                      | ≥4.5:1                                                       |
| UI 配对（白字 on `primarySolid`、`selectionForeground` on `selectedBg`）                                                         | ≥4.5:1                                                       |
| UI 配对（装饰白字 on `primary`，头像/标记非正文）                                                                                | ≥3:1（dark 实测 3.68:1，登记例外）                           |
| 彩色实底文字：`surfaceGround` on `error` / `primary` / `warning`（输入校验、状态栏错误项、终端光标块）                           | ≥4.5:1（dark 6.45 / 4.85 / 10.69；light 6.19 / 8.35 / 4.81） |
| 状态栏 prominent 项：`text` on `surfaceRaised` / `hoverBg`                                                                       | ≥4.5:1（dark 13.76 / 11.04；light 17.85 / 16.30）            |
| 括号高亮 `bracket1`–`bracket6`                                                                                                   | ≥3:1（装饰性大字重，与 VS Code 默认括号色同档）              |
| `gitIgnored`、`codeDim`                                                                                                          | **豁免**（登记于 `validators.js` 的 `CONTRAST_EXEMPTIONS`）  |

alpha 前景（8 位 hex）先合成到背景再计算；配对表见 `scripts/lib/validators.js` 的
`UI_CONTRAST_PAIRS`。改动色值时请以构建日志为准
（`checkContrast` / `checkAnsiContrast` / `checkUIPairs`），不要只凭肉眼。

## 6. 语义层孤儿/预留角色

以下角色当前未被 workbench/semantic/tokenColors 引用，仅导出到
`themes/*.css / _tokens.scss / tokens.ts` 供组件库消费，**禁止删除**：

`bg / bgActive / bgElevated / borderDim / borderHover / borderSubtle /
fillSubtle / fillMedium / overlayScrim`

（moongate-vue 的 `src/styles/tokens/colors.css` 为这些变量的下游拷贝。）

## 7. 跨仓库同步流程（moongate-vue）

1. `pnpm run build`（moongate-theme）→ 重新生成 `themes/moongate-colors.css` 等。
2. 拷贝 `themes/moongate-colors.css` → `moongate-vue/src/styles/tokens/colors.css`。
   （`moongate-layout.css` 同理，仅布局变更时。）
3. `moongate-vue` 中运行 `node scripts/check-tokens.ts`，按报告修正组件 fallback 字面量。
4. 更新 `moongate-vue/docs/guide/design-tokens.md` 数值表。
5. `pnpm run verify:build` / `pnpm run build` 通过后提交两仓库。

> ⚠️ 改动 `src/core/semantics/*` 的**角色取值**（而非仅新增角色）时同样需要同步：
> 例如浅色 `highlight`（`--ui-highlight`）与 `gitAdded`（`--ui-git-added`）变更会直接改到
> `themes/moongate-colors.css` / `_tokens.scss` / `tokens.ts`，下游必须一并更新。

> 参考：博客（moongate-api）仅消费内容与文档，不经手令牌文件；
> 其渲染依赖 moongate-vue 发布产物（`dist/style.css`）。

## 8. 发布前检查单

**moongate-theme（本仓库）**

1. `pnpm run build` 零告警（结构/对比度/ANSI/UI 配对/parity/unused 全绿）。
2. `pnpm run test` 与 `pnpm run test:scopes` 通过。
3. `package.json` 版本号与 CHANGELOG（中/英）标题一致；README 亮点同步。
4. `pnpm run package` 产出对应 `.vsix`（如 `moongate-theme-2.8.0.vsix`）。

**moongate-vue（组件库）** 5. 按 §7 同步 `src/styles/tokens/colors.css`（必要时 layout.css），`check-tokens.ts` 通过。6. 更新 `docs/guide/design-tokens.md` 数值表；`pnpm run build` 重建 dist。7. 发布新版前：确认 CHANGELOG、版本号；发布后博客/站点再升级依赖。

**博客（moongate）本地测试** 8. 本地联调用 `pnpm-workspace.yaml` 的 `overrides: { moongate-vue: link:../moongate-vue }`。9. **提交 / Docker 构建前必须删除该 override**（容器内无兄弟目录）并 `pnpm install` 还原 registry 依赖。10. moongate-vue 源码改动后需先 `pnpm run build` 再刷新博客（消费 dist）。

## 9. 语义高亮优先级与探针一致性

**语义层总是覆盖 TextMate 层**（`package.json` 默认开启 `editor.semanticHighlighting.enabled`），
因此 `src/semantic.yaml` 的一个键可能悄悄盖掉某个语言文件精心声明的颜色。踩过的两个真实事故：

1. `True`/`False`/`None` 变白：Pylance 的 token 是 `builtinConstant`（父类型 `constant`）
   - 修饰符 `readonly`、`builtin`，主题的 `constant.builtin` 以 199 分压过 `builtinConstant`(100)。
2. `self` 的主蓝斜体失效：`parameter` 规则按父类型命中 `selfParameter`，声明的 TextMate 色永远不生效。

### 9.1 打分公式（VS Code 实现，勿凭直觉）

```
score = (100 − 选择器类型在父类型层级中的下标) + 100 × 选择器修饰符个数 (+10 语言限定)
```

- 修饰符权重（±100）远大于父类型层级惩罚（每层 −1）→ **「父类型 + 修饰符」键会反超精确类型键**。
- 选择器含 token 没有的修饰符、或类型不在层级中 → 该规则不参与。
- 逐字段（foreground/bold/italic/underline/strikethrough）取最高分，**同分时后出现的键胜出**
  → `*.invalid`、`*.deprecated` 这类通配键必须写在类型键**之后**才能生效。
- 对象形式的 `fontStyle` 会展开成四个布尔值（镜像 `TokenStyle.fromSettings`）。
- 主题语义键若命中某 token，VS Code 内建/扩展注册的探针（`semanticTokenScopes` → TextMate scope）
  就**不会再填该字段**——所以「探针不生效」通常意味着主题键抢先填了颜色。

### 9.2 键形与语言限定

- 键形：`<type>.<modifier>...`，通配用 `*`；**语言限定写作 `<type>.<modifier>:<language>`**
  （schema 模式已核实允许），用于只想影响单一语言、又需要压过通用键的场景。
- 新增语言限定键前先确认该修饰符真的会被发出（例如 Pylance 的 legend 里没有 `defaultLibrary`，
  写 `variable.defaultLibrary` 就是死键）。

### 9.3 偏离登记（allow-list）

`test/semantic-precedence.test.js` 把「VS Code 内建 33 条 + Pylance 17 条探针」当作契约：
**语义层最终生效色必须等于 TextMate 层最终生效色**。确需偏离的（当前 5 条：`typeParameter`、
`macro`、`variable.defaultLibrary.readonly`、`property.defaultLibrary.readonly`、`*.overridden`）
必须登记进该文件的 `DEVIATIONS` 并写明理由；条目一旦不再偏离，测试会失败以强制复核。

改动 `src/semantic.yaml`、`src/languages/*.yaml` 后请跑 `pnpm run test`；
判定某处该用什么颜色时，优先用 `Developer: Inspect Editor Tokens and Scopes` 看**最终生效**的
`Color theme: <键>` 与 `semantic token type/modifiers`，而不是猜。

## 10. 注入语法（Python docstring）

主题能上色的前提是「语法层已经切出 scope」。TS 的 JSDoc 效果来自 `typescript-basics` 的
`jsdoc.*.injection.tmLanguage.json`；而 Python 的 docstring 是字符串，VS Code 内置 MagicPython
与 Pylance 自带语法都只给整个 docstring 一个 scope（`string.quoted.docstring.*.python`），内部零 token。
因此本仓库**自带一份注入语法**补齐这一层：

| 文件                                                       | 作用                                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `syntaxes/python-docstring.injection.tmLanguage.json`      | `injectionSelector: L:string.quoted.docstring.*.python`（`L:`＝低于宿主优先级，只加 token 不覆盖宿主）；支持 Sphinx field list / Google / NumPy 段落 / 内联 reST |
| `src/languages/python-docstring.yaml`                      | 上述注入 scope 的配色（与 `jsdoc.yaml` 逐项对应）                                                                                                                |
| `package.json` → `contributes.grammars`                    | `injectTo: ["source.python"]`（声明式，无激活代码）                                                                                                              |
| `scripts/lib/scope-validator.js` → `buildDefaultSyntaxMap` | `python-docstring.yaml` 映射到**本仓库**的语法文件，否则 `pnpm run test:scopes` 会报"scope 不存在"                                                               |

约定：

- 这些 scope 一律以 `.docstring.python` 结尾，便于其它主题复用；
- **docstring 正文基调**写在 `src/languages/python.yaml`（MagicPython 的 docstring scope），
  注入产生的内层 scope 才写在 `python-docstring.yaml`；
- 只染标签/参数/类型/内联标记，**不染正文普通单词**；Google 参数行要求带括号（`name (type):`），
  避免把正文里的 `Word:` 误判成参数；
- `test/docstring-grammar.test.js` 用 `vscode-textmate` + `vscode-oniguruma` **真机分词**验证
  （与 VS Code 的 textmate worker 同样通过 `getInjections` 注入），并含"普通字符串不得被注入"的反例；
  改语法后必须让它通过，且 `python-docstring.yaml` 引用的每个 scope 都要能在语法文件中找到。

## 11. 覆盖与配对校验（构建期强校验）

打磨深/浅主题的长期风险不是"某个颜色不好看"，而是**静默回退与区分度退化**。构建期新增三项校验
（`scripts/lib/theme-coverage.js`），失败即构建终止：

| 校验                           | 拦截的问题                                                                                                                                          | 登记方式                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `checkFallbackReadability`     | 主题只定义"配对的一半"（如 `inputValidation.errorBackground` 有、`...errorForeground` 没有）→ 另一半回退 VS Code 默认色，压在彩色底上仅 1.10–3.24:1 | 显式补键；确属装饰可登记 `FALLBACK_READABILITY_EXEMPTIONS`     |
| `assertRoleDistinctnessParity` | 同一语法角色在深/浅两模式的"同色结构"不一致（如浅色 `function == highlight`）                                                                       | 拆色，或登记 `DISTINCTNESS_EXEMPTIONS`（须写明理由与 §4 出处） |
| `checkContrast` 角色清单       | 语法强调色 / Git 装饰 / 括号高亮未纳入对比度检查                                                                                                    | 角色级阈值表；`gitIgnored`/`codeDim` 属登记豁免                |

**界面键名有效性（T1）**：`scripts/lib/data/vscode-color-ids.json` 是「VS Code 已知色键」数据表
（本机安装包提取 ∪ 官方 `theme-color.md`），每次构建都会把 `workbench.yaml` 的键对它核对 ——
**VS Code 不认识的键定义后不会生效**（错字 / 已废弃 / 凭空添加）。构建只警告不失败，测试里是硬断言；
数据表用 `pnpm run sync:color-ids` 刷新（`--offline` 只用本机安装包）。
> 这条检查上线时就抓到 12 个死键（`chat.editorBackground`、`terminalCommandGuide.border`、
> `modernActivityBar.foreground` 等），已全部删除。

**跨仓库契约（T2）**：`docs/token-names.snapshot.json` 记录每个角色的 CSS/SCSS/TS 三端名字，
`pnpm run check:contract` 断言"只增不删、不改名、三端名字与值一致"；新增角色需显式
`pnpm run check:contract --update` 登记。新增的 `test/contract.test.js` 同时校验三端值与语义层解析结果一致。

**产出物一致性（T3）**：`pnpm run check:artifacts` 会重新构建并 `git diff` `themes/` 与生成文档 ——
防"改了 src 忘了重建/提交产物"。为此构建内置 prettier 格式化生成的 markdown（`docs/DESIGN_SYSTEM.md`、
`docs/COVERAGE.md`），使 docs 也能纳入比对（此前两者格式漂移会导致每次构建都脏工作区）。

**试运行 / 失败路径（T6）**：`scripts/lib/config.js` 支持 `MOONGATE_ROOT` 环境变量指向临时目录，
测试据此在临时副本里注入坏数据、断言"构建失败并给出正确提示"，无需触碰本仓库
（见 `test/build-pipeline.test.js`，覆盖 7 条失败分支 + 幂等性）。

配套产物：

- **`docs/COVERAGE.md`**（构建自动生成）：① 界面键覆盖（未覆盖项按前缀列出，供按图推进）；
  ② 逐语言语法叶子 scope 覆盖（只统计 `match` 规则上的 scope，`meta.*` 容器不计）；
  ③ 角色区分度分组。
- **`test/theme-coverage.test.js`**：断言回退可读性 0 风险、区分度结构一致、未覆盖界面键
  均在 `DEFERRED_UI_KEY_PREFIXES`（延期批次）、未覆盖叶子 scope 为 0；
  并含一条"合成用例"证明校验器确实能捕获半配对故障。
- 语法叶子 scope 的豁免登记在 `LEAF_SCOPE_EXEMPTIONS`（scope → 理由），只允许
  "位于已覆盖父 scope 内、继承父色"或"语法自身占位/兜底"两类。

**新增界面键的检查清单**：跑 `node scripts/build.js` → 看 `docs/COVERAGE.md` 的未覆盖表是否为 0
（或属于已登记延期批次）→ 若新增了配对键，确认前景/背景两侧都补齐 → `node --test "test/*.test.js"`。
