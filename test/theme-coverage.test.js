/**
 * 主题覆盖与一致性测试
 *
 * 把这一轮的审计固化为常驻断言：
 *   1. 回退可读性：不允许"配对只定义了一半"且回退色不可读（本轮 P0 的真实故障类型）
 *   2. 深浅区分度一致：同一组语法角色在深/浅两模式的同色结构必须一致
 *   3. 覆盖率：界面键未覆盖项必须属于已登记的延期批次；语法叶子 scope 未覆盖项必须为 0
 */
import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { safeLoadYaml } from "../scripts/lib/utils.js"
import { buildDefaultSyntaxMap } from "../scripts/lib/scope-validator.js"
import {
  loadVscodeThemeDefaults,
  loadKnownColorIds,
  findUnknownColorKeys,
  pairCounterpart,
  findFallbackReadabilityRisks,
  findDistinctnessParityIssues,
  groupRolesByColor,
  collectLeafScopeNames,
  findUncoveredLeafScopes,
  LEAF_SCOPE_EXEMPTIONS,
  DEFERRED_UI_KEY_PREFIXES,
} from "../scripts/lib/theme-coverage.js"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

before(() => {
  execFileSync("node", ["scripts/build.js"], { cwd: ROOT_DIR, stdio: "pipe" })
})

const themes = {
  dark: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-dark.json"), "utf8")),
  light: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-light.json"), "utf8")),
}
const semantics = {
  dark: safeLoadYaml(path.join(ROOT_DIR, "src", "core", "semantics", "dark.yaml")),
  light: safeLoadYaml(path.join(ROOT_DIR, "src", "core", "semantics", "light.yaml")),
}
const primitives = safeLoadYaml(path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"))

/** 把语义角色解析为最终色值（供区分度比较使用） */
function resolveRoles(mode) {
  const out = {}
  for (const [role, value] of Object.entries(semantics[mode])) {
    const m = /^\{([A-Za-z0-9_-]+)\}([0-9a-fA-F]{0,2})$/.exec(String(value))
    out[role] = m && primitives[m[1]] ? primitives[m[1]] + m[2] : String(value)
  }
  return out
}
const resolved = { dark: resolveRoles("dark"), light: resolveRoles("light") }

// ==================== 1. 回退可读性 ====================

test("回退可读性：主题定义的界面键不存在'半配对 + 回退不可读'", () => {
  for (const mode of ["dark", "light"]) {
    const defaults = loadVscodeThemeDefaults(mode)
    if (!defaults) {
      console.log(`⚠️ 未找到 VS Code 默认主题（${mode}），跳过`)
      continue
    }
    const risks = findFallbackReadabilityRisks(themes[mode].colors, defaults.colors)
    assert.deepEqual(
      risks.map((r) => `${r.key} (回退 ${r.fallback} on ${r.defined}=${r.definedColor} = ${r.ratio.toFixed(2)}:1)`),
      [],
      `${mode} 模式存在配对只定义一半且回退色不可读的键`,
    )
  }
})

test("回退可读性：校验器能捕获本轮 P0 故障（合成用例）", () => {
  // 复现：只定义 errorBackground，未定义 errorForeground → 回退 VS Code 默认浅灰，1.50:1
  const themeColors = { "inputValidation.errorBackground": "#f87171" }
  const defaultColors = { "inputValidation.errorBackground": "#ff0000", "inputValidation.errorForeground": "#bfbfbf" }
  const risks = findFallbackReadabilityRisks(themeColors, defaultColors)
  assert.equal(risks.length, 1, "应当捕获一个半配对风险")
  assert.equal(risks[0].key, "inputValidation.errorForeground")
  assert.ok(risks[0].ratio < 4.5)

  // 已定义两半时不再报（交给 checkUIPairs 判对比度）
  assert.equal(
    findFallbackReadabilityRisks(
      { "inputValidation.errorBackground": "#f87171", "inputValidation.errorForeground": "#0f172a" },
      defaultColors,
    ).length,
    0,
  )
})

test("pairCounterpart：前景/背景与 Foreground/Background 两种命名都能配对", () => {
  assert.equal(pairCounterpart("inputValidation.errorBackground"), "inputValidation.errorForeground")
  assert.equal(pairCounterpart("inputValidation.errorForeground"), "inputValidation.errorBackground")
  assert.equal(pairCounterpart("statusBarItem.prominentForeground"), "statusBarItem.prominentBackground")
  assert.equal(pairCounterpart("editor.background"), "editor.foreground")
  assert.equal(pairCounterpart("gitDecoration.addedResourceForeground"), "gitDecoration.addedResourceBackground")
})

// ==================== 2. 深浅区分度一致 ====================

test("深浅区分度：语法角色同色结构与登记表相符", () => {
  const issues = findDistinctnessParityIssues(resolved.dark, resolved.light)
  assert.deepEqual(
    issues.map((i) => `${i.pair.join("/")} 深色${i.dark ? "同色" : "不同色"} 浅色${i.light ? "同色" : "不同色"}`),
    [],
    "深浅两模式的角色区分度结构不一致（要么拆色，要么登记 DISTINCTNESS_EXEMPTIONS）",
  )
})

test("深浅区分度：浅色 highlight 与 function 不得同色（本轮修复的塌陷）", () => {
  assert.notEqual(
    resolved.light.highlight.toUpperCase(),
    resolved.light.function.toUpperCase(),
    "浅色下 highlight 与 function 塌陷为同色，会让类型/转义与函数名难以区分",
  )
})

test("深浅区分度：同级界面文字不在同一模式内塌陷（前景不得等于自身背景）", () => {
  for (const mode of ["dark", "light"]) {
    const groups = [...groupRolesByColor(resolved[mode]).entries()]
    for (const [, roles] of groups) {
      assert.ok(
        !(roles.includes("text") && roles.includes("bg")),
        `${mode}: text 与 bg 同色（正文将不可见）`,
      )
    }
  }
})

// ==================== 3. 覆盖率 ====================

test("覆盖率：未覆盖的界面键必须属于已登记的延期批次", () => {
  const darkDefaults = loadVscodeThemeDefaults("dark")
  const lightDefaults = loadVscodeThemeDefaults("light")
  if (!darkDefaults || !lightDefaults) {
    console.log("⚠️ 未找到 VS Code 默认主题，跳过界面键覆盖检查")
    return
  }
  const allKeys = new Set([...Object.keys(darkDefaults.colors), ...Object.keys(lightDefaults.colors)])
  const themeKeys = new Set(Object.keys(themes.dark.colors))
  const missing = [...allKeys].filter((k) => !themeKeys.has(k))
  const unexpected = missing.filter((k) => !DEFERRED_UI_KEY_PREFIXES.some((p) => k.startsWith(p)))
  assert.deepEqual(
    unexpected,
    [],
    `存在未覆盖且未登记延期的界面键（${unexpected.length} 个）：${unexpected.slice(0, 10).join(", ")}`,
  )
  // 顺带约束：延期批次本身也应保持收敛（补完后请从列表移除）
  assert.ok(missing.length <= 60, `延期键数量异常膨胀：${missing.length} 个`)
})

test("覆盖率：所有语言的语法叶子 scope 均已覆盖或登记豁免", () => {
  const tokenColors = themes.dark.tokenColors
  const syntaxMap = buildDefaultSyntaxMap()
  const details = []
  let checkedLangs = 0
  for (const [file, grammarPaths] of Object.entries(syntaxMap)) {
    if (!grammarPaths.length) continue
    const leaves = new Set()
    for (const grammarPath of grammarPaths) {
      if (!fs.existsSync(grammarPath)) continue
      for (const name of collectLeafScopeNames(grammarPath)) leaves.add(name)
    }
    if (!leaves.size) continue
    checkedLangs++
    const { uncovered } = findUncoveredLeafScopes(tokenColors, leaves)
    if (uncovered.length) details.push(`${file}: ${uncovered.join(", ")}`)
  }
  assert.ok(checkedLangs >= 10, `实际检查的语言过少（${checkedLangs}）`)
  assert.deepEqual(details, [], "存在未覆盖的语法叶子 scope（应补规则或登记 LEAF_SCOPE_EXEMPTIONS）")
})

test("界面键有效性：不存在 VS Code 不认识的键（错字 / 死键）", () => {
  const known = loadKnownColorIds()
  assert.ok(known, "缺少 scripts/lib/data/vscode-color-ids.json —— 请跑 `pnpm run sync:color-ids` 生成")
  const unknown = findUnknownColorKeys(Object.keys(themes.dark.colors), known)
  assert.deepEqual(
    unknown,
    [],
    `以下键 VS Code 不认识，定义后不会生效（错字或已废弃，请删除）：${unknown.join(", ")}`,
  )
})

test("界面键有效性：数据表本身可用且规模合理", () => {
  const known = loadKnownColorIds()
  assert.ok(known.size > 500, `已知色键数据表过小（${known.size}），疑似生成异常`)
  for (const core of ["editor.background", "terminal.ansiRed", "statusBarItem.errorBackground", "chat.requestBackground"]) {
    assert.ok(known.has(core), `数据表缺少常见键 ${core}`)
  }
})

test("覆盖率：豁免登记表都有理由说明", () => {
  for (const [scope, reason] of Object.entries(LEAF_SCOPE_EXEMPTIONS)) {
    assert.ok(reason && reason.length >= 6, `豁免 ${scope} 缺少理由说明`)
  }
})
