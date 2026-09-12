# 主题覆盖报告（构建自动生成）

> 由 `scripts/lib/theme-coverage.js` 在 `node scripts/build.js` 时生成，请勿手工编辑。
> 数据来源：VS Code 默认主题（`theme-defaults/themes/2026-*.json` 及 include 链）与各内置语法文件。

## 一、界面键覆盖

- 主题定义：**475** 键
- VS Code 默认主题：**357** 键
- 未覆盖（回退到 VS Code 默认色）：**37** 键
- 主题独有（默认主题未定义，由本主题自行决定）：**155** 键

### 未覆盖键（按前缀）

| 前缀                       | 数量 | 键                                                                                                                     |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `charts`                   | 8    | `blue` `foreground` `green` `lines` `orange` `purple` `red` `yellow`                                                   |
| `gauge`                    | 7    | `background` `border` `errorBackground` `errorForeground` `foreground` `warningBackground` `warningForeground`         |
| `peekViewResult`           | 6    | `background` `fileForeground` `lineForeground` `matchHighlightBackground` `selectionBackground` `selectionForeground`  |
| `settings`                 | 6    | `dropdownBackground` `dropdownBorder` `headerForeground` `modifiedItemIndicator` `numberInputBorder` `textInputBorder` |
| `quickInputList`           | 5    | `focusBackground` `focusForeground` `focusHighlightForeground` `focusIconForeground` `hoverBackground`                 |
| `peekViewEditor`           | 1    | `matchHighlightBackground`                                                                                             |
| `peekViewTitleDescription` | 1    | `foreground`                                                                                                           |
| `peekViewTitleLabel`       | 1    | `foreground`                                                                                                           |
| `quickInput`               | 1    | `border`                                                                                                               |
| `searchEditor`             | 1    | `textInputBorder`                                                                                                      |

## 二、语法叶子 scope 覆盖

统计口径：只取各语法中挂在 `match` 规则上的 scope（真正的 token 叶子），排除 `meta.*` 容器、
`source.*` 根与语法自身名称；被主题规则以「分段前缀」覆盖即视为已覆盖。

| 语言             | 叶子 scope | 未覆盖 | 未覆盖清单 |
| ---------------- | ---------- | ------ | ---------- |
| base             | 94         | 0      | —          |
| cpp              | 146        | 0      | —          |
| csharp           | 58         | 0      | —          |
| css              | 55         | 0      | —          |
| dockerfile       | 1          | 0      | —          |
| go               | 61         | 0      | —          |
| html             | 20         | 0      | —          |
| java             | 47         | 0      | —          |
| json             | 8          | 0      | —          |
| jsx              | 176        | 0      | —          |
| markdown         | 24         | 0      | —          |
| python           | 67         | 0      | —          |
| python-docstring | 4          | 0      | —          |
| rust             | 54         | 0      | —          |
| shell            | 44         | 0      | —          |
| sql              | 28         | 0      | —          |

> 未能读取语法的语言：jsdoc

## 三、语法角色区分度（深 / 浅）

同一模式下同色的角色为一组；两模式的**分组结构必须一致**（差异需登记在 `DISTINCTNESS_EXEMPTIONS`）。

| 模式 | 同色组                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 深色 | text=variable (#e2e8f0)；textDim=variableDim (#cbd5e1)；textMuted=operator (#7a8c9e)；textInactive=punctuation (#94a3b8) |
| 浅色 | text=variable (#0f172a)；textDim=variableDim (#475569)；textMuted=operator=punctuation (#64748b)                         |
