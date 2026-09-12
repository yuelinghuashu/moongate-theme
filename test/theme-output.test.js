import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { safeLoadYaml } from "../scripts/lib/utils.js"
import { detectUnusedPrimitives, assertSemanticKeyParity } from "../scripts/lib/validators.js"
import { resolveSemanticStyle } from "./helpers.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")

// 先构建（保证产物最新）
before(() => {
  execFileSync("node", ["scripts/build.js"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
  })
})

// 加载主题产物
const darkTheme = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-dark.json"), "utf8"),
)
const lightTheme = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-light.json"), "utf8"),
)

// ==================== 顶层结构 ====================
for (const [name, theme] of [
  ["dark", darkTheme],
  ["light", lightTheme],
]) {
  test(`theme(${name}): 包含全部 5 个顶层 key`, () => {
    const requiredKeys = ["name", "type", "colors", "tokenColors", "semanticTokenColors"]
    for (const key of requiredKeys) {
      assert.ok(key in theme, `缺少顶层 key "${key}"`)
    }
  })

  test(`theme(${name}): colors 包含关键 UI key`, () => {
    const requiredColors = [
      "editor.background",
      "editor.foreground",
      "sideBar.background",
      "sideBar.foreground",
      "statusBar.background",
      "titleBar.activeBackground",
      "activityBar.background",
      "panel.background",
      "terminal.background",
      "input.background",
      "button.background",
      "button.foreground",
      "list.hoverBackground",
      "tab.activeBackground",
      "editorLineNumber.foreground",
      "editorCursor.foreground",
    ]
    for (const key of requiredColors) {
      assert.ok(
        theme.colors[key] !== undefined,
        `缺少关键 UI color "${key}"`,
      )
    }
  })

  test(`theme(${name}): 包含全部 16 个 terminal.ansi 色`, () => {
    const ansiKeys = [
      "terminal.ansiBlack",
      "terminal.ansiRed",
      "terminal.ansiGreen",
      "terminal.ansiYellow",
      "terminal.ansiBlue",
      "terminal.ansiMagenta",
      "terminal.ansiCyan",
      "terminal.ansiWhite",
      "terminal.ansiBrightBlack",
      "terminal.ansiBrightRed",
      "terminal.ansiBrightGreen",
      "terminal.ansiBrightYellow",
      "terminal.ansiBrightBlue",
      "terminal.ansiBrightMagenta",
      "terminal.ansiBrightCyan",
      "terminal.ansiBrightWhite",
    ]
    for (const key of ansiKeys) {
      assert.ok(theme.colors[key] !== undefined, `缺少 terminal 色 "${key}"`)
    }
  })

  test(`theme(${name}): 所有 colors 值均为合法颜色格式`, () => {
    const colorRegex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
    for (const [key, value] of Object.entries(theme.colors)) {
      assert.match(
        value,
        colorRegex,
        `colors.${key} 不是合法颜色格式: "${value}"`,
      )
    }
  })

  test(`theme(${name}): 无未解析的变量/令牌引用`, () => {
    const jsonStr = JSON.stringify(theme)
    assert.doesNotMatch(jsonStr, /\$\{/, `存在未解析的变量引用`)
    assert.doesNotMatch(jsonStr, /(?<!\$)\{[a-zA-Z0-9_-]+\}/, `存在未解析的令牌引用`)
  })

  test(`theme(${name}): tokenColors 都有 scope 和 settings`, () => {
    for (const [i, rule] of theme.tokenColors.entries()) {
      assert.ok(rule.scope, `tokenColors[${i}] 缺少 scope`)
      assert.ok(rule.settings, `tokenColors[${i}] 缺少 settings`)
    }
  })

  test(`theme(${name}): semanticTokenColors 值均为合法格式`, () => {
    for (const [key, value] of Object.entries(theme.semanticTokenColors)) {
      if (typeof value === "string") {
        assert.match(value, /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, `semanticTokenColors.${key} 不是合法颜色: "${value}"`)
      } else if (value && typeof value === "object") {
        assert.ok(value.foreground === undefined || /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.foreground), `semanticTokenColors.${key}.foreground 不是合法颜色: "${value.foreground}"`)
      }
    }
  })

  // ==================== 样式字段合法性（VS Code schema） ====================
  const FONT_STYLE_PATTERN = /^(\s*(italic|bold|underline|strikethrough))*\s*$/
  const SEMANTIC_KEY_PATTERN = /^(\w+[-\w+]*|\*)(\.\w+[-\w+]*)*(:\w+[-\w+]*)?$/
  const SEMANTIC_STYLE_KEYS = new Set([
    "foreground", "background", "fontStyle", "bold", "italic", "underline", "strikethrough",
  ])

  test(`theme(${name}): tokenColors 的 fontStyle 均为 VS Code 允许的取值`, () => {
    for (const rule of theme.tokenColors) {
      const fontStyle = rule.settings?.fontStyle
      if (fontStyle === undefined) continue
      assert.match(
        String(fontStyle),
        FONT_STYLE_PATTERN,
        `规则「${rule.name || rule.scope}」的 fontStyle="${fontStyle}" 不合法（会被 VS Code 静默忽略）`,
      )
    }
  })

  test(`theme(${name}): semanticTokenColors 键符合 VS Code 模式且无未知字段`, () => {
    for (const [key, value] of Object.entries(theme.semanticTokenColors)) {
      assert.match(key, SEMANTIC_KEY_PATTERN, `语义键 "${key}" 不符合 VS Code 的选择器模式`)
      if (value && typeof value === "object") {
        for (const field of Object.keys(value)) {
          assert.ok(
            SEMANTIC_STYLE_KEYS.has(field),
            `语义键 "${key}" 含未知字段 "${field}"（会被 VS Code 静默忽略）`,
          )
        }
      }
    }
  })

  test(`theme(${name}): tokenColors 的 scope 名形状合法`, () => {
    const SCOPE_TOKEN = /^[A-Za-z0-9_*$@][A-Za-z0-9_*$@.\-]*$/
    for (const rule of theme.tokenColors) {
      const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
      for (const scope of scopes) {
        for (const atom of String(scope).split(/\s+/)) {
          assert.ok(SCOPE_TOKEN.test(atom), `scope "${scope}" 含非法片段 "${atom}"`)
        }
      }
    }
  })

  // ==================== Python 高亮回归 ====================
  // 相同 settings 的规则会被 mergeTokenColors 合并，因此统一用 scope 反查规则，
  // 断言对"是否已合并"保持稳健。
  const ruleWithScope = (scope) =>
    theme.tokenColors.find((rule) =>
      (Array.isArray(rule.scope) ? rule.scope : [rule.scope]).includes(scope),
    )

  test(`theme(${name}): Python 转义字符有专属色（不同于字符串正文）`, () => {
    const pythonEscape = ruleWithScope("constant.character.escape.python")
    const genericEscape = ruleWithScope("constant.character.escape")
    const stringRule = ruleWithScope("string.quoted.single")

    assert.ok(genericEscape, "缺少通用 constant.character.escape 规则")
    assert.ok(pythonEscape, "缺少 constant.character.escape.python 规则")
    assert.ok(stringRule, "缺少 string.quoted.single 规则")

    assert.equal(
      pythonEscape.settings.foreground,
      genericEscape.settings.foreground,
      "Python 转义色应与通用转义规则一致（${highlight}）",
    )
    assert.notEqual(
      pythonEscape.settings.foreground,
      stringRule.settings.foreground,
      "Python 转义色不应与字符串正文同色（否则等于没有高亮）",
    )
  })

  test(`theme(${name}): True/False/None 的最终语义色 = constant.language 的 TextMate 色`, () => {
    const languageRule = ruleWithScope("constant.language")
    assert.ok(languageRule, "缺少 constant.language 规则")

    // 只断言"键存在"是不够的（曾出错）：必须断言**最终生效样式**，
    // 即按 VS Code 打分（层级 100-idx + 100×修饰符数）复算后胜出的颜色。
    for (const modifiers of [[], ["readonly"], ["builtin"], ["readonly", "builtin"]]) {
      const style = resolveSemanticStyle(theme.semanticTokenColors, {
        type: "builtinConstant",
        hierarchy: ["builtinConstant", "constant"],
        modifiers,
      })
      assert.equal(
        style.foreground,
        languageRule.settings.foreground,
        `builtinConstant 修饰符=${JSON.stringify(modifiers)} 的最终前景应为月光黄（constant.language）`,
      )
    }
  })

  test(`theme(${name}): self/cls 的最终语义样式 = python.yaml 的 self/cls 规则`, () => {
    const selfRule = ruleWithScope("variable.language.special.self.python")
    assert.ok(selfRule, "缺少 variable.language.special.self.python 规则")

    for (const type of ["selfParameter", "clsParameter"]) {
      const style = resolveSemanticStyle(theme.semanticTokenColors, {
        type,
        hierarchy: [type, "parameter"],
        modifiers: [],
      })
      assert.equal(style.foreground, selfRule.settings.foreground, `${type} 最终前景应与 self/cls 规则一致`)
      assert.equal(style.italic, true, `${type} 最终应为斜体（与 self/cls 规则一致）`)
    }
  })
}

// ==================== 跨主题一致性 ====================
test("dark/light 主题均存在且类型正确", () => {
  assert.equal(darkTheme.type, "dark")
  assert.equal(lightTheme.type, "light")
})

test("dark/light 主题名称包含 Moongate", () => {
  assert.match(darkTheme.name, /Moongate/)
  assert.match(lightTheme.name, /Moongate/)
})

// ==================== token 合并有效性 ====================
test("tokenColors 合并后无重复 scope 组合", () => {
  const seen = new Set()
  for (const rule of darkTheme.tokenColors) {
    const key = JSON.stringify(rule.scope)
    assert.ok(!seen.has(key), `重复的 scope 组合: ${key}`)
    seen.add(key)
  }
})

// ==================== 真实源数据卫生检查 ====================
test("真实语义层: 无未使用的原始令牌", () => {
  const primitives = safeLoadYaml(path.join(ROOT_DIR, "src/core/primitives/colors.yaml"))
  const semantics = ["dark", "light"].map((m) =>
    safeLoadYaml(path.join(ROOT_DIR, `src/core/semantics/${m}.yaml`)),
  )
  const unused = detectUnusedPrimitives(primitives, semantics)
  assert.equal(unused.length, 0, `存在未使用原始令牌: ${unused.map((u) => u.key).join(", ")}`)
})

test("真实语义层: dark/light 键位一致", () => {
  const dark = safeLoadYaml(path.join(ROOT_DIR, "src/core/semantics/dark.yaml"))
  const light = safeLoadYaml(path.join(ROOT_DIR, "src/core/semantics/light.yaml"))
  const onlyDark = Object.keys(dark).filter((k) => !(k in light))
  const onlyLight = Object.keys(light).filter((k) => !(k in dark))
  assert.deepEqual(onlyDark, [], `仅 dark 含角色: ${onlyDark.join(", ")}`)
  assert.deepEqual(onlyLight, [], `仅 light 含角色: ${onlyLight.join(", ")}`)
})