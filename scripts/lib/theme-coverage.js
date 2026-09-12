/**
 * 主题覆盖与一致性审计（构建期）
 *
 * 三层能力：
 *   1. 回退可读性：主题只定义了「配对的一半」（如 inputValidation.errorBackground 有、
 *      errorForeground 没有）时，另一半会回退到 VS Code 默认主题的值 —— 这里用默认主题的
 *      实际回退值算对比度，低于阈值即构建失败。
 *   2. 深浅区分度一致：同一组语法角色在深/浅两模式的「同色归组」结构必须一致，
 *      差异必须登记（防「浅色 function 与 highlight 塌陷成同色」这类静默退化）。
 *   3. 覆盖率报告：工作台键覆盖（主题 / 回退）+ 逐语言语法叶子 scope 覆盖 + 角色区分度分组，
 *      产出 docs/COVERAGE.md。
 *
 * 依赖 VS Code 安装目录（默认主题数据）时可降级：找不到只提示、不报错，
 * 与 scripts/lib/scope-validator.js 的做法一致。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import wcag from "wcag-contrast"

const DEFAULT_VSCODE_EXT = process.env.VSCODE_EXTENSIONS_DIR
  ? path.join(process.env.VSCODE_EXTENSIONS_DIR, "extensions")
  : "/usr/share/code/resources/app/extensions"

const DEFAULT_THEME_FILES = {
  dark: "2026-dark.json",
  light: "2026-light.json",
}

/** 参与「深浅区分度一致」检查的语法角色（顺序仅用于报告输出） */
export const DISTINCTNESS_ROLES = [
  "text", "textDim", "textMuted", "textInactive",
  "comment", "primary", "success", "warning", "error",
  "highlight", "cyan", "purple", "function", "operator",
  "variable", "variableDim", "punctuation",
]

/**
 * 已登记的「深浅区分度差异」（按角色对登记，已在 docs/TOKEN_CONVENTIONS.md §4 说明）
 *
 * 只有确实"两模式的同色关系不同"且属有意设计的角色对才登记；登记后该对被跳过。
 */
export const DISTINCTNESS_EXEMPTIONS = [
  {
    pair: ["operator", "punctuation"],
    reason: "§4：深色 operator 与 punctuation 分属两档；浅色二者与 textMuted 同档",
  },
  {
    pair: ["textMuted", "punctuation"],
    reason: "§4：深色 textMuted 与 punctuation 不同档；浅色同档（浅色三档归一）",
  },
  {
    pair: ["textInactive", "punctuation"],
    reason: "§4/2.7.1：深色同档；浅色 textInactive 单独下沉（可读性调整）",
  },
]

/** 回退可读性豁免（键 → 理由）：仅对"确属装饰、不承载正文"的键放开 */
export const FALLBACK_READABILITY_EXEMPTIONS = {
  "editorCursor.background": "光标块上的字符由 terminalCursor/选区语义覆盖，非正文配对",
}

// ==================== VS Code 默认主题数据 ====================

/**
 * 读取 VS Code 默认主题链（含 include）的全部颜色键与值
 * @param {"dark"|"light"} themeType
 * @returns {{ colors: Record<string,string>, source: string }|null}
 */
export function loadVscodeThemeDefaults(themeType, vscodeExt = DEFAULT_VSCODE_EXT) {
  const file = DEFAULT_THEME_FILES[themeType]
  if (!file) return null
  const baseDir = path.join(vscodeExt, "theme-defaults", "themes")
  const colors = {}
  const seen = new Set()
  let current = file
  let source = null
  while (current && !seen.has(current)) {
    seen.add(current)
    const full = path.join(baseDir, current)
    if (!fs.existsSync(full)) return null
    source = source ?? full
    const parsed = JSON.parse(fs.readFileSync(full, "utf8"))
    Object.assign(colors, parsed.colors || {})
    current = parsed.include ? parsed.include.replace("./", "") : null
  }
  return Object.keys(colors).length ? { colors, source } : null
}

// ==================== 1. 回退可读性 ====================

/**
 * 由键名推导「配对键」：foreground ↔ background
 * @returns {string|null}
 */
export function pairCounterpart(key) {
  if (key.endsWith(".foreground")) return key.replace(/\.foreground$/, ".background")
  if (key.endsWith(".background")) return key.replace(/\.background$/, ".foreground")
  if (/Foreground$/.test(key)) return key.replace(/Foreground$/, "Background")
  if (/Background$/.test(key)) return key.replace(/Background$/, "Foreground")
  return null
}

const isForegroundKey = (key) => /(\.foreground|Foreground)$/.test(key)

/** 8 位 hex 前景合成到背景（6 位直接返回）；与 validators.js 的 compositeColor 同款 */
function composite(fg, bg) {
  fg = fg.replace("#", "")
  if (fg.length === 6) return "#" + fg
  const alpha = parseInt(fg.slice(6, 8), 16) / 255
  const mix = (i) =>
    Math.round(parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(1 + i, 3 + i), 16) * (1 - alpha))
      .toString(16)
      .padStart(2, "0")
  return `#${mix(0)}${mix(2)}${mix(4)}`
}

/**
 * 找出「只定义了配对的一半」且回退值不可读的键
 *
 * 只检查「缺失的一侧是前景键」的情形 —— 这正是真实踩过的坑
 * （inputValidation.*Foreground、浅色 statusBarItem.prominentForeground）。
 *
 * @param {Record<string,string>} themeColors 主题最终 UI 颜色（hex）
 * @param {Record<string,string>} defaultColors VS Code 默认主题颜色
 * @param {{min?:number}} [options]
 * @returns {Array<{key:string, defined:string, definedColor:string, fallback:string, ratio:number}>}
 */
export function findFallbackReadabilityRisks(themeColors, defaultColors, { min = 4.5 } = {}) {
  const risks = []
  for (const [defined, definedColor] of Object.entries(themeColors)) {
    const missing = pairCounterpart(defined)
    if (!missing || !isForegroundKey(missing)) continue // 只关心"缺前景"
    if (themeColors[missing] !== undefined) continue // 两半都在，交给 checkUIPairs
    const fallback = defaultColors?.[missing]
    if (!fallback || !/^#[0-9a-fA-F]{6}/.test(fallback)) continue
    if (FALLBACK_READABILITY_EXEMPTIONS[missing]) continue
    const ratio = wcag.hex(composite(fallback, definedColor), definedColor)
    if (ratio < min) {
      risks.push({ key: missing, defined, definedColor, fallback, ratio })
    }
  }
  return risks.sort((a, b) => a.ratio - b.ratio)
}

/** 构建期：回退可读性校验（不合格抛错） */
export function checkFallbackReadability(themeColors, themeType, vscodeExt) {
  const defaults = loadVscodeThemeDefaults(themeType, vscodeExt)
  if (!defaults) {
    console.log(`   ⚠️ 未找到 VS Code 默认主题（${themeType}），跳过回退可读性校验`)
    return null
  }
  const risks = findFallbackReadabilityRisks(themeColors, defaults.colors)
  if (risks.length) {
    const lines = risks
      .map(
        (r) =>
          `   ${r.key} 缺省 → 回退默认 ${r.fallback}，压在 ${r.defined}=${r.definedColor} 上仅 ${r.ratio.toFixed(2)}:1`,
      )
      .join("\n")
    throw new Error(
      `❌ 配对只定义了一半，回退色不可读（${themeType}，要求 ≥4.5:1）：\n${lines}\n` +
        `   请显式定义上述前景键（本主题惯例：彩色实底用 \${surfaceGround}，隆起/白底用 \${text}）。`,
    )
  }
  console.log(`✅ ${themeType} · 回退可读性：无"半配对"风险（对照 VS Code ${path.basename(defaults.source)}）`)
  return defaults
}

// ==================== 2. 深浅区分度一致 ====================

/** 按最终色值归组：{ color: [role...] } */
export function groupRolesByColor(colors, roles = DISTINCTNESS_ROLES) {
  const groups = new Map()
  for (const role of roles) {
    const value = colors[role]
    if (!value) continue
    const key = value.toUpperCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(role)
  }
  return groups
}

/**
 * 比较深浅两模式的区分度结构
 *
 * 对任意角色对 (a,b)：「deep 同色」必须等价于「light 同色」；
 * 差异组需登记进 DISTINCTNESS_EXEMPTIONS（含任一角色即视为已登记）。
 *
 * @returns {Array<{pair:[string,string], dark:boolean, light:boolean}>}
 */
export function findDistinctnessParityIssues(darkColors, lightColors, { roles = DISTINCTNESS_ROLES, exemptions = DISTINCTNESS_EXEMPTIONS } = {}) {
  const exempted = new Set(exemptions.map((e) => [...e.pair].sort().join("|")))
  const issues = []
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const [a, b] = [roles[i], roles[j]]
      if (!darkColors[a] || !darkColors[b] || !lightColors[a] || !lightColors[b]) continue
      if (exempted.has([a, b].sort().join("|"))) continue
      const sameDark = darkColors[a].toUpperCase() === darkColors[b].toUpperCase()
      const sameLight = lightColors[a].toUpperCase() === lightColors[b].toUpperCase()
      if (sameDark !== sameLight) issues.push({ pair: [a, b], dark: sameDark, light: sameLight })
    }
  }
  return issues
}

/** 构建期：深浅区分度一致性校验 */
export function assertRoleDistinctnessParity(darkColors, lightColors) {
  const issues = findDistinctnessParityIssues(darkColors, lightColors)
  if (issues.length) {
    const lines = issues
      .map((i) => `   ${i.pair.join(" / ")}：深色${i.dark ? "同色" : "不同色"}，浅色${i.light ? "同色" : "不同色"}`)
      .join("\n")
    throw new Error(
      `❌ 深浅两模式的角色区分度结构不一致：\n${lines}\n` +
        `   要么拆开颜色（保持两模式区分度一致），要么登记进 validators 的 DISTINCTNESS_EXEMPTIONS。`,
    )
  }
  console.log("✅ 深浅区分度一致：语法角色同色结构与登记表相符")
}

// ==================== 3. 语法叶子 scope 覆盖 ====================

/** 递归收集「挂在 match 规则上的 scope 名」（叶子 token；容器 begin/end 不算） */
export function collectLeafScopeNames(grammarPath) {
  const names = new Set()
  const walk = (node) => {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (typeof node.match === "string" && typeof node.name === "string") names.add(node.name)
    for (const [key, value] of Object.entries(node)) {
      if (key === "name") continue
      walk(value)
    }
  }
  try {
    walk(JSON.parse(fs.readFileSync(grammarPath, "utf8")))
  } catch {
    return names
  }
  return names
}

const CONTAINER_PREFIX = /^(meta|source|text)\.|^(Magic|Go|Rust|Java|C|C\+\+|C#|JSON|SQL|CSS|HTML|Markdown|Script|Shell|JavaScript|TypeScript|React|Vue)/

/**
 * 语法叶子 scope 豁免登记表（scope → 理由）
 *
 * 只登记「不染色也正确」的 scope：位于已覆盖的父 scope 内（继承父色），
 * 或属语法自身的占位符/兜底 scope。
 */
export const LEAF_SCOPE_EXEMPTIONS = {
  "support.other.escape.special.regexp": "Python 正则串内部 token，继承外层 string.regexp 的青色，无需单独染色",
  "support.other.match.any.regexp": "Python 正则串内部 token，继承外层 string.regexp 的青色，无需单独染色",
  "support.other.match.begin.regexp": "Python 正则串内部 token，继承外层 string.regexp 的青色，无需单独染色",
  "support.other.match.end.regexp": "Python 正则串内部 token，继承外层 string.regexp 的青色，无需单独染色",
  "everything.else.c": "C 语法兜底 scope（未识别文本），刻意不染色",
  "entity.other.attribute.$0.cpp": "C++ 语法动态占位符（$0），非真实 token 名",
  "cast.expr.ts": "TS 转型表达式的容器 scope（容器不承载字符）",
}

/**
 * 延期补全的界面键（按用户选择：扩展视图 / 设置 / 图表 / 窥视 / 快速打开列表批次）
 *
 * 键 → 分组说明；构建报告会单列，覆盖率测试据此放行。
 */
export const DEFERRED_UI_KEY_PREFIXES = ["charts.", "gauge.", "peekView", "settings.", "quickInputList.", "quickInput.", "searchEditor."]

// ==================== 5. 界面键名有效性（防错字 / 死键） ====================

const COLOR_ID_DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "data", "vscode-color-ids.json")

/**
 * 读取已知 VS Code 颜色键清单
 *
 * 数据表 = 本机安装包可发现的注册 id（`out/**\/*.js` 里 `registerColor("<id>")`、扩展
 * `contributes.colors[].id`、自带主题键）∪ VS Code 官方文档 `theme-color.md` 的键清单。
 * 用静态数据表而不是"只扫本机"，是为了让检查在**不同 VS Code 版本 / 未装 VS Code 的机器**上同样成立。
 * 刷新：`pnpm run sync:color-ids`。
 */
export function loadKnownColorIds() {
  if (!fs.existsSync(COLOR_ID_DATA)) return null
  const ids = JSON.parse(fs.readFileSync(COLOR_ID_DATA, "utf8"))
  return Array.isArray(ids) && ids.length ? new Set(ids) : null
}

/**
 * 找出主题里 VS Code 不认识的键（错字 / 已废弃 / 凭空添加 —— 定义后不会生效）
 * @param {string[]} themeKeys workbench.yaml 的键
 * @param {Set<string>} knownIds 已知色键清单
 */
export function findUnknownColorKeys(themeKeys, knownIds) {
  if (!knownIds) return []
  return themeKeys.filter((key) => !knownIds.has(key)).sort()
}

/** 构建期：界面键名有效性（只警告不失败，避免数据表滞后卡住构建；测试里是硬断言） */
export function checkColorKeyValidity(themeColors) {
  const known = loadKnownColorIds()
  if (!known) {
    console.log("   ⚠️ 缺少 scripts/lib/data/vscode-color-ids.json，跳过界面键名有效性检查")
    return []
  }
  const keys = Object.keys(themeColors)
  const unknown = findUnknownColorKeys(keys, known)
  if (unknown.length) {
    console.warn(`   ⚠️ 有 ${unknown.length} 个 VS Code 不认识的界面键（定义后不会生效）：`)
    for (const key of unknown) console.warn(`      · ${key}`)
    console.warn("      确认是错字/废弃键请删除；若是新版键，跑 `pnpm run sync:color-ids` 刷新数据表。")
  } else {
    console.log(`✅ 界面键名有效性：${keys.length} 个键均在 VS Code 已知清单中`)
  }
  return unknown
}

/**
 * 找出作用域层级完全未被主题覆盖的叶子 scope
 * @param {Array<{scope:string|string[]}>} tokenColors 合并后的主题规则
 * @param {Iterable<string>} leafScopes 语法叶子 scope（可能含组合名）
 */
export function findUncoveredLeafScopes(tokenColors, leafScopes) {
  const ruleNames = []
  for (const rule of tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    for (const scope of scopes) {
      const segments = String(scope).split(/\s+/).pop().split(".")
      ruleNames.push(segments)
    }
  }
  const covered = (name) => {
    const segments = name.split(".")
    return ruleNames.some((rule) => rule.length <= segments.length && rule.every((s, i) => segments[i] === s))
  }
  const out = new Set()
  const exempted = new Set()
  for (const raw of leafScopes) {
    for (const name of String(raw).split(/\s+/)) {
      if (CONTAINER_PREFIX.test(name)) continue
      if (covered(name)) continue
      if (LEAF_SCOPE_EXEMPTIONS[name]) exempted.add(name)
      else out.add(name)
    }
  }
  return { uncovered: [...out].sort(), exempted: [...exempted].sort() }
}

// ==================== 4. 覆盖率报告（docs/COVERAGE.md） ====================

/**
 * 生成覆盖率与一致性报告（Markdown）
 *
 * @param {object} input
 * @param {Record<string,string>} input.themeColors 主题最终 UI 颜色（hex）
 * @param {Record<string,string>|null} input.defaultColors VS Code 默认主题颜色
 * @param {Array<{scope:string|string[]}>} input.tokenColors 合并后的主题语法规则
 * @param {Record<string,string[]>} input.leafScopesByLang 语言 → 语法叶子 scope 集合
 * @param {Record<string,string[]>} input.uncoveredByLang 语言 → 未覆盖叶子 scope
 * @param {Record<string,string>} input.darkColors 深色语义角色
 * @param {Record<string,string>} input.lightColors 浅色语义角色
 * @param {string[]} input.syntaxWarnings 无法读取语法的语言
 */
export function buildCoverageReport({
  themeColors,
  defaultColors,
  tokenColors,
  leafScopesByLang,
  uncoveredByLang,
  darkColors,
  lightColors,
  syntaxWarnings = [],
}) {
  const lines = []
  lines.push("# 主题覆盖报告（构建自动生成）")
  lines.push("")
  lines.push("> 由 `scripts/lib/theme-coverage.js` 在 `node scripts/build.js` 时生成，请勿手工编辑。")
  lines.push("> 数据来源：VS Code 默认主题（`theme-defaults/themes/2026-*.json` 及 include 链）与各内置语法文件。")
  lines.push("")

  // ---------- 一、界面键覆盖 ----------
  const themeKeys = Object.keys(themeColors)
  const defaultKeys = defaultColors ? Object.keys(defaultColors) : []
  const missing = defaultKeys.filter((k) => !themeKeys.includes(k)).sort()
  const extra = themeKeys.filter((k) => !defaultKeys.includes(k)).sort()
  lines.push("## 一、界面键覆盖")
  lines.push("")
  if (!defaultColors) {
    lines.push("⚠️ 未找到本机 VS Code 默认主题，无法比对覆盖情况。")
    lines.push("")
  } else {
    lines.push(`- 主题定义：**${themeKeys.length}** 键`)
    lines.push(`- VS Code 默认主题：**${defaultKeys.length}** 键`)
    lines.push(`- 未覆盖（回退到 VS Code 默认色）：**${missing.length}** 键`)
    lines.push(`- 主题独有（默认主题未定义，由本主题自行决定）：**${extra.length}** 键`)
    lines.push("")
    const byPrefix = {}
    for (const key of missing) {
      const prefix = key.split(".")[0]
      ;(byPrefix[prefix] = byPrefix[prefix] || []).push(key)
    }
    lines.push("### 未覆盖键（按前缀）")
    lines.push("")
    lines.push("| 前缀 | 数量 | 键 |")
    lines.push("| --- | --- | --- |")
    for (const [prefix, keys] of Object.entries(byPrefix).sort((a, b) => b[1].length - a[1].length)) {
      lines.push(`| \`${prefix}\` | ${keys.length} | ${keys.map((k) => `\`${k.slice(prefix.length + 1)}\``).join(" ")} |`)
    }
    lines.push("")
  }

  // ---------- 二、语法叶子 scope 覆盖 ----------
  lines.push("## 二、语法叶子 scope 覆盖")
  lines.push("")
  lines.push("统计口径：只取各语法中挂在 `match` 规则上的 scope（真正的 token 叶子），排除 `meta.*` 容器、")
  lines.push("`source.*` 根与语法自身名称；被主题规则以「分段前缀」覆盖即视为已覆盖。")
  lines.push("")
  lines.push("| 语言 | 叶子 scope | 未覆盖 | 未覆盖清单 |")
  lines.push("| --- | --- | --- | --- |")
  for (const lang of Object.keys(leafScopesByLang).sort()) {
    const total = leafScopesByLang[lang].length
    const uncovered = uncoveredByLang[lang] || []
    lines.push(
      `| ${lang} | ${total} | ${uncovered.length} | ${uncovered.length ? uncovered.map((s) => `\`${s}\``).join(" ") : "—"} |`,
    )
  }
  lines.push("")
  if (syntaxWarnings.length) {
    lines.push(`> 未能读取语法的语言：${syntaxWarnings.join("、")}`)
    lines.push("")
  }

  // ---------- 三、角色区分度 ----------
  lines.push("## 三、语法角色区分度（深 / 浅）")
  lines.push("")
  lines.push("同一模式下同色的角色为一组；两模式的**分组结构必须一致**（差异需登记在 `DISTINCTNESS_EXEMPTIONS`）。")
  lines.push("")
  lines.push("| 模式 | 同色组 |")
  lines.push("| --- | --- |")
  for (const [mode, colors] of [
    ["深色", darkColors],
    ["浅色", lightColors],
  ]) {
    const groups = [...groupRolesByColor(colors).entries()]
      .filter(([, roles]) => roles.length > 1)
      .map(([color, roles]) => `${roles.join("=")} (${color.toLowerCase()})`)
    lines.push(`| ${mode} | ${groups.join("；") || "—"} |`)
  }
  lines.push("")

  return lines.join("\n")
}
