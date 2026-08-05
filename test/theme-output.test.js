import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

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