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

| 模式       | 色值                 | 角色组                                                    | 理由                                                                     |
| ---------- | -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| dark       | `#7a8c9e` (gray-450) | `operator`、`textMuted`                                   | 二者同为最弱可读文本档，≥4.5:1，便于 property/namespace 代码角色保持可读 |
| dark       | `#94a3b8` (gray-400) | `punctuation`、`textInactive`、`bracket6`、`gitUntracked` | 弱化语法符号与弱 UI 文本共用档位                                         |
| light      | `#64748b` (gray-500) | `punctuation`、`operator`、`textMuted`                    | 运算符与标点同级；textMuted 兼顾代码角色可读性（≥4.5:1）                 |
| light      | `#1e40af` (blue-950) | `primary`、`primarySolid`                                 | 实底强调与主色同值（白字 ≥4.5:1）                                        |
| dark       | `#2563eb` (blue-600) | `primarySolid`、`selectedBg`、`buttonHoverBg`             | 实底强调/选中背景共用深蓝，白字 ≥5:1                                     |
| light      | `#0f172a` (gray-900) | `text`、`selectionForeground`                             | 浅色选中行为浅灰底，前景保持正文墨色                                     |
| dark       | `#ffffff`            | `white`、`selectionForeground`                            | 深色选中/实底为蓝底，前景用白                                            |
| light/dark | `#00000022`          | `codeDim`                                                 | 无用代码压暗遮罩（唯一"文字遮罩"语义角色）                               |
| light/dark | ANSI 黑族            | `ansiBlack`、`ansiBrightBlack`                            | 终端底色族天然低对比，**豁免** WCAG 阈值                                 |

修改色板时：若想给某角色独立颜色，请优先新增/调整灰阶档位并在本表登记，
而不是删除共享档（会触发 `unused primitives` 或破坏别名约定文档）。

## 5. 对比度楼层（构建期强校验）

背景取各自模式 `bg`（terminal ANSI 对 terminal.background 校验）：

| 角色                                                                                                                             | 阈值                               |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 正文/语法角色：text / variable / variableDim / textDim / punctuation / operator / function / primary / success / warning / error | ≥4.5:1                             |
| comment（专用注释色）                                                                                                            | ≥4.0:1（实测深浅 5.7–8.5:1）       |
| textMuted（占位/弱化文本；property/namespace 亦消费）                                                                            | ≥3:1（当前深浅均 ≥4.5:1）          |
| textInactive（非活跃 UI 文本）                                                                                                   | ≥3:1（浅色 3.31:1；深色 6.96:1）   |
| ANSI 非黑族                                                                                                                      | ≥3:1                               |
| ansiWhite / ansiBrightWhite                                                                                                      | ≥4.5:1                             |
| UI 配对（白字 on `primarySolid`、`selectionForeground` on `selectedBg`）                                                         | ≥4.5:1                             |
| UI 配对（装饰白字 on `primary`，头像/标记非正文）                                                                                | ≥3:1（dark 实测 3.68:1，登记例外） |

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

> 参考：博客（moongate-api）仅消费内容与文档，不经手令牌文件；
> 其渲染依赖 moongate-vue 发布产物（`dist/style.css`）。

## 8. 发布前检查单

**moongate-theme（本仓库）**

1. `pnpm run build` 零告警（结构/对比度/ANSI/UI 配对/parity/unused 全绿）。
2. `pnpm run test` 与 `pnpm run test:scopes` 通过。
3. `package.json` 版本号与 CHANGELOG（中/英）标题一致；README 亮点同步。
4. `pnpm run package` 产出对应 `.vsix`（如 `moongate-theme-2.7.1.vsix`）。

**moongate-vue（组件库）** 5. 按 §7 同步 `src/styles/tokens/colors.css`（必要时 layout.css），`check-tokens.ts` 通过。6. 更新 `docs/guide/design-tokens.md` 数值表；`pnpm run build` 重建 dist。7. 发布新版前：确认 CHANGELOG、版本号；发布后博客/站点再升级依赖。

**博客（moongate）本地测试** 8. 本地联调用 `pnpm-workspace.yaml` 的 `overrides: { moongate-vue: link:../moongate-vue }`。9. **提交 / Docker 构建前必须删除该 override**（容器内无兄弟目录）并 `pnpm install` 还原 registry 依赖。10. moongate-vue 源码改动后需先 `pnpm run build` 再刷新博客（消费 dist）。
