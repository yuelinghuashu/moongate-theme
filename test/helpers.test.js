/**
 * test/helpers.js 中「VS Code 语义高亮优先级镜像」的自测
 *
 * 这些断言锁定的是 VS Code 的真实打分规则本身，而不是主题内容：
 *   score = (100 − 类型在父类型层级中的下标) + 100 × 选择器修饰符个数
 * 主题内容的断言见 theme-output.test.js。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { parseSemanticSelector, resolveSemanticStyle, resolveTextmateStyle } from "./helpers.js"

// ==================== 选择器解析 ====================

test("parseSemanticSelector: 类型 / 修饰符 / 语言后缀", () => {
  assert.deepEqual(parseSemanticSelector("constant"), {
    type: "constant",
    modifiers: [],
    language: undefined,
  })
  assert.deepEqual(parseSemanticSelector("constant.builtin"), {
    type: "constant",
    modifiers: ["builtin"],
    language: undefined,
  })
  assert.deepEqual(parseSemanticSelector("*.deprecated"), {
    type: "*",
    modifiers: ["deprecated"],
    language: undefined,
  })
  assert.deepEqual(parseSemanticSelector("variable.readonly:python"), {
    type: "variable",
    modifiers: ["readonly"],
    language: "python",
  })
})

// ==================== 打分与优先级 ====================

test("resolveSemanticStyle: 修饰符权重压过父类型层级（本次回归的核心）", () => {
  // Pylance 的 True/False/None：builtinConstant（父类型 constant）+ readonly、builtin
  const colors = {
    constant: "#e2e8f0",
    "constant.builtin": "#fbbf24",
    builtinConstant: "#fbbf24",
  }
  const style = resolveSemanticStyle(colors, {
    type: "builtinConstant",
    hierarchy: ["builtinConstant", "constant"],
    modifiers: ["readonly", "builtin"],
  })
  // constant.builtin = (100-1) + 100×1 = 199 > builtinConstant = 100 > constant = 99
  assert.equal(style.foreground, "#fbbf24")

  // 反例：若只加 builtinConstant 而不修 constant.builtin，精确类型键会被反超
  const broken = { constant: "#e2e8f0", "constant.builtin": "#e2e8f0", builtinConstant: "#fbbf24" }
  assert.equal(
    resolveSemanticStyle(broken, {
      type: "builtinConstant",
      hierarchy: ["builtinConstant", "constant"],
      modifiers: ["readonly", "builtin"],
    }).foreground,
    "#e2e8f0",
    "缺少 constant.builtin 时需要复算出于白色一致的结果（证明该断言真的在检查优先级）",
  )
})

test("resolveSemanticStyle: 修饰符不匹配的规则不参与", () => {
  // 无 deprecated 修饰符 → 通配键不匹配，只剩 variable
  assert.equal(
    resolveSemanticStyle(
      { "*.deprecated": "#94a3b8", variable: "#e2e8f0" },
      { type: "variable", modifiers: [] },
    ).foreground,
    "#e2e8f0",
  )
  // 带 deprecated 修饰符 → 通配键匹配（通配不加类型分：0+100=100），与 variable(100) 同分，
  // 按"同分后者胜出"由后出现的 *.deprecated 拿下
  assert.equal(
    resolveSemanticStyle(
      { variable: "#e2e8f0", "*.deprecated": "#94a3b8" },
      { type: "variable", modifiers: ["deprecated"] },
    ).foreground,
    "#94a3b8",
  )
})

test("resolveSemanticStyle: 类型不在层级中 → 不匹配", () => {
  const colors = { parameter: "#cbd5e1" }
  assert.deepEqual(
    resolveSemanticStyle(colors, { type: "selfParameter", hierarchy: ["selfParameter"], modifiers: [] }),
    {},
  )
  assert.equal(
    resolveSemanticStyle(colors, {
      type: "selfParameter",
      hierarchy: ["selfParameter", "parameter"],
      modifiers: [],
    }).foreground,
    "#cbd5e1",
  )
})

test("resolveSemanticStyle: 同分时后出现的键胜出；通配类型不加类型分", () => {
  const colors = { "*.readonly": "#111111", variable: "#e2e8f0" }
  // 通配 0+100=100，variable 100+0=100 → 同类不同分项，最终按后者覆盖
  const style = resolveSemanticStyle(colors, { type: "variable", modifiers: ["readonly"] })
  assert.equal(style.foreground, "#e2e8f0", "同分（100）时后出现的 variable 胜出")

  const reversed = { variable: "#e2e8f0", "*.readonly": "#111111" }
  assert.equal(
    resolveSemanticStyle(reversed, { type: "variable", modifiers: ["readonly"] }).foreground,
    "#111111",
    "同分时后出现的通配键胜出",
  )
})

// ==================== 样式声明展开（镜像 TokenStyle.fromSettings） ====================

test("resolveSemanticStyle: 字符串形式 = 仅前景色", () => {
  assert.deepEqual(resolveSemanticStyle({ constant: "#fbbf24" }, { type: "constant" }), {
    foreground: "#fbbf24",
  })
})

test("resolveSemanticStyle: fontStyle 按关键字扫描，并显式写入四个布尔值", () => {
  const style = resolveSemanticStyle(
    { "parameter.readonly": { foreground: "#cbd5e1", fontStyle: "bold italic" } },
    { type: "parameter", modifiers: ["readonly"] },
  )
  assert.deepEqual(style, {
    foreground: "#cbd5e1",
    bold: true,
    italic: true,
    underline: false,
    strikethrough: false,
  })
})

test("resolveSemanticStyle: 无 fontStyle 时使用显式布尔值", () => {
  const style = resolveSemanticStyle(
    { variable: { foreground: "#e2e8f0", italic: true } },
    { type: "variable" },
  )
  assert.deepEqual(style, { foreground: "#e2e8f0", italic: true })
})

// ==================== 语言限定键（type.modifier:language） ====================

test("resolveSemanticStyle: 语言限定键只在该语言生效，且权重 +10", () => {
  // 语言限定键 210 > variable.readonly 200 > variable 100
  const colors = {
    variable: "#e2e8f0",
    "variable.readonly": "#e2e8f0",
    "variable.defaultLibrary:python": "#c084fc",
    "variable.defaultLibrary:go": "#22d3ee",
  }
  const token = { type: "variable", modifiers: ["readonly", "defaultLibrary"], hierarchy: ["variable"] }
  assert.equal(resolveSemanticStyle(colors, { ...token, language: "python" }).foreground, "#c084fc")
  assert.equal(resolveSemanticStyle(colors, { ...token, language: "go" }).foreground, "#22d3ee")
  assert.equal(resolveSemanticStyle(colors, { ...token, language: "rust" }).foreground, "#e2e8f0")
})

// ==================== TextMate 侧解析 ====================

const TM_RULES = [
  { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#a5b4cb", fontStyle: "italic" } },
  { scope: ["string"], settings: { foreground: "#34d399" } },
  { scope: ["string.regexp"], settings: { foreground: "#22d3ee" } },
  { scope: ["constant.language"], settings: { foreground: "#fbbf24" } },
  { scope: ["constant.character.escape"], settings: { foreground: "#7dd3fc" } },
  { scope: ["meta.function-call entity.name.function"], settings: { foreground: "#7dd3fc" } },
  { scope: ["entity.name.function"], settings: { foreground: "#87cefa" } },
]

test("resolveTextmateStyle: 最深 scope 节点胜出（内层 scope 优先）", () => {
  // string.regexp 比 string 深 → 青色
  assert.equal(
    resolveTextmateStyle(TM_RULES, ["source.python", "string.regexp.quoted.single.python"]).foreground,
    "#22d3ee",
  )
  // 转义 scope 命中 constant.character.escape（比 constant.language 更贴近，且不在 string 分支）
  assert.equal(
    resolveTextmateStyle(TM_RULES, ["source.python", "string.quoted.double.python", "constant.character.escape.python"]).foreground,
    "#7dd3fc",
  )
  // 无规则命中 → 回退（空对象）
  assert.deepEqual(resolveTextmateStyle(TM_RULES, ["source.python", "variable.other.readwrite.python"]), {})
})

test("resolveTextmateStyle: 组合 scope 需要父链存在", () => {
  const withCall = resolveTextmateStyle(TM_RULES, ["source.python", "meta.function-call.python", "entity.name.function.python"])
  assert.equal(withCall.foreground, "#7dd3fc", "父 scope 存在时应命中组合规则")
  const withoutCall = resolveTextmateStyle(TM_RULES, ["source.python", "entity.name.function.python"])
  assert.equal(withoutCall.foreground, "#87cefa", "父 scope 不存在时应退回单段规则")
})

test("resolveTextmateStyle: 同深度时后出现的规则胜出", () => {
  const rules = [
    { scope: ["string"], settings: { foreground: "#111111" } },
    { scope: ["string"], settings: { foreground: "#222222" } },
  ]
  assert.equal(resolveTextmateStyle(rules, ["string.quoted.single.python"]).foreground, "#222222")
})
