/**
 * 跨仓库令牌契约（防"删名 / 改名"）
 *
 * `docs/TOKEN_CONVENTIONS.md` §3 约定：语义角色名**只增不删、不改名** ——
 * `--ui-*` 变量名集合是跨仓库契约（moongate-vue 的 `check-tokens.ts` 依赖）。
 * 本模块把这条约定变成快照 + 三端一致性检查：
 *
 *   - CSS   `--ui-<kebab>`（`themes/moongate-colors.css`）
 *   - SCSS  `$ui-<kebab>`（`themes/_tokens.scss`）
 *   - TS    `"<role>"`     （`themes/tokens.ts`）
 *
 * 快照文件：`docs/token-names.snapshot.json`（`pnpm run check:contract --update` 刷新）。
 */
import fs from "node:fs"
import path from "node:path"

/** 驼峰 → kebab（与 generators.js 的 toCssKey 同一实现） */
export function toCssKey(key) {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase()
}

/** kebab → 驼峰（用于把 CSS/SCSS 名映射回角色名） */
export function fromCssKey(key) {
  return key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

/** 解析 CSS 里的 `--ui-<kebab>: <value>;`（按模式分块） */
export function extractCssTokens(cssText) {
  const blocks = { light: {}, dark: {} }
  const parts = cssText.split(/\/\*\s*(浅色|深色)模式\s*\*\//)
  for (let i = 1; i < parts.length; i += 2) {
    const mode = parts[i] === "浅色" ? "light" : "dark"
    for (const m of parts[i + 1].matchAll(/--ui-([a-z0-9-]+):\s*([^;]+);/g)) {
      blocks[mode][fromCssKey(m[1])] = m[2].trim()
    }
  }
  return blocks
}

/** 解析 SCSS 里的 `$ui-<kebab>: <value>;`（便捷变量区，取深色） */
export function extractScssTokens(scssText) {
  const out = {}
  for (const m of scssText.matchAll(/^\$ui-([a-z0-9-]+):\s*([^;]+);/gm)) {
    out[fromCssKey(m[1])] = m[2].trim()
  }
  return out
}

/** 解析 TS 里的 `"<role>": "<value>",`（分 dark / light 块） */
export function extractTsTokens(tsText) {
  const blocks = { light: {}, dark: {} }
  const darkStart = tsText.indexOf("dark: {")
  const lightStart = tsText.indexOf("light: {")
  const parse = (text) => {
    const out = {}
    for (const m of text.matchAll(/^\s*"([A-Za-z0-9_]+)":\s*"([^"]+)",/gm)) out[m[1]] = m[2]
    return out
  }
  if (darkStart >= 0) blocks.dark = parse(tsText.slice(darkStart, lightStart > darkStart ? lightStart : undefined))
  if (lightStart >= 0) blocks.light = parse(tsText.slice(lightStart))
  return blocks
}

/** 读取三端产物并汇总 */
export function readArtifacts(outputDir) {
  const read = (file) => fs.readFileSync(path.join(outputDir, file), "utf8")
  return {
    css: extractCssTokens(read("moongate-colors.css")),
    scss: extractScssTokens(read("_tokens.scss")),
    ts: extractTsTokens(read("tokens.ts")),
  }
}

/**
 * 三端名字一致性：同一个角色必须同时出现在 CSS / SCSS / TS，且值相同
 * @returns {string[]} 问题描述（空数组表示一致）
 */
export function compareArtifactNames(artifacts) {
  const issues = []
  const modes = ["light", "dark"]
  for (const mode of modes) {
    const css = artifacts.css[mode] || {}
    const ts = artifacts.ts[mode] || {}
    const cssRoles = new Set(Object.keys(css))
    const tsRoles = new Set(Object.keys(ts))
    for (const role of cssRoles) if (!tsRoles.has(role)) issues.push(`${mode}: TS 缺少角色 ${role}`)
    for (const role of tsRoles) if (!cssRoles.has(role)) issues.push(`${mode}: CSS 缺少角色 ${role}`)
    for (const role of cssRoles) {
      if (ts[role] && ts[role].toLowerCase() !== css[role].toLowerCase()) {
        issues.push(`${mode}: ${role} 值不一致（CSS ${css[role]} vs TS ${ts[role]}）`)
      }
    }
  }
  // SCSS 便捷变量区只有深色值
  const scssRoles = new Set(Object.keys(artifacts.scss))
  for (const role of Object.keys(artifacts.css.dark || {})) {
    if (!scssRoles.has(role)) issues.push(`SCSS 缺少角色 ${role}`)
  }
  return issues
}

/** 由产物生成契约快照（角色 → 三端名字） */
export function buildSnapshot(artifacts) {
  const roles = new Set([
    ...Object.keys(artifacts.css.light || {}),
    ...Object.keys(artifacts.css.dark || {}),
    ...Object.keys(artifacts.scss),
    ...Object.keys(artifacts.ts.light || {}),
    ...Object.keys(artifacts.ts.dark || {}),
  ])
  const snapshot = {}
  for (const role of [...roles].sort()) {
    snapshot[role] = { css: `--ui-${toCssKey(role)}`, scss: `$ui-${toCssKey(role)}`, ts: role }
  }
  return snapshot
}

export function loadSnapshot(file) {
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

export function writeSnapshot(file, snapshot) {
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + "\n")
}

/**
 * 对比快照与当前产物：删除/改名（红）与新增（需更新快照）
 * @returns {{removed: string[], added: string[], changed: Array<{role:string, field:string, from:string, to:string}>}}
 */
export function diffContract(snapshot, artifacts) {
  const current = buildSnapshot(artifacts)
  const prevRoles = new Set(Object.keys(snapshot || {}))
  const nextRoles = new Set(Object.keys(current))
  const removed = [...prevRoles].filter((r) => !nextRoles.has(r)).sort()
  const added = [...nextRoles].filter((r) => !prevRoles.has(r)).sort()
  const changed = []
  for (const role of [...prevRoles].filter((r) => nextRoles.has(r))) {
    for (const field of ["css", "scss", "ts"]) {
      if (snapshot[role][field] !== current[role][field]) {
        changed.push({ role, field, from: snapshot[role][field], to: current[role][field] })
      }
    }
  }
  return { removed, added, changed, current }
}
