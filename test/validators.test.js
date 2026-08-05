import { test } from "node:test"
import assert from "node:assert/strict"
import {
  detectUnusedPrimitives,
  validateThemeStructure,
  checkContrast,
  ThemeValidationError,
} from "../scripts/lib/validators.js"
import { captureConsole, assertThrows, assertNoThrow } from "./helpers.js"

// ==================== detectUnusedPrimitives 测试 ====================
test("detectUnusedPrimitives: 检测出未使用的原始值", () => {
  const primitives = {
    "blue-500": "#3b82f6",
    "gray-100": "#f1f5f9",
    "gray-200": "#e2e8f0",
  }
  const semantics = [{ primary: "{blue-500}" }]
  const result = detectUnusedPrimitives(primitives, semantics)
  assert.equal(result.length, 2)
  assert.deepEqual(result.map((r) => r.key).sort(), ["gray-100", "gray-200"])
})

test("detectUnusedPrimitives: 全部被引用时为空数组", () => {
  const primitives = {
    "blue-500": "#3b82f6",
    "gray-100": "#f1f5f9",
  }
  const semantics = [
    { primary: "{blue-500}" },
    { bg: "{gray-100}" },
  ]
  const result = detectUnusedPrimitives(primitives, semantics)
  assert.equal(result.length, 0)
})

// ==================== validateThemeStructure 测试 ====================
test("validateThemeStructure: 合法主题通过", () => {
  const theme = {
    name: "Test Theme",
    type: "dark",
    colors: { "editor.background": "#0f172a" },
    tokenColors: [{ scope: ["comment"], settings: { foreground: "#aabbcc" } }],
    semanticTokenColors: { function: "#87cefa" },
  }
  // 不应抛出错误
  assertNoThrow(() => {
    captureConsole(() => validateThemeStructure(theme, "test-theme.json"))
  })
})

test("validateThemeStructure: 缺失顶层 key 抛出 ThemeValidationError", () => {
  const theme = {
    name: "Test",
    type: "dark",
  }
  const err = assertThrows(
    () => captureConsole(() => validateThemeStructure(theme, "invalid-theme.json")),
    /结构验证失败/,
  )
  assert.ok(err instanceof ThemeValidationError)
})

test("validateThemeStructure: 非法颜色格式抛出 ThemeValidationError", () => {
  const theme = {
    name: "Test",
    type: "dark",
    colors: { "editor.background": "not-a-color" },
    tokenColors: [],
    semanticTokenColors: {},
  }
  const err = assertThrows(
    () => captureConsole(() => validateThemeStructure(theme, "invalid-color.json")),
    /不是合法颜色/,
  )
  assert.ok(err instanceof ThemeValidationError)
})

test("validateThemeStructure: 未解析变量引用抛出 ThemeValidationError", () => {
  const theme = {
    name: "Test",
    type: "dark",
    colors: { "editor.background": "${undefined-var}" },
    tokenColors: [],
    semanticTokenColors: {},
  }
  const err = assertThrows(
    () => captureConsole(() => validateThemeStructure(theme, "unresolved-var.json")),
    /未解析的变量引用/,
  )
  assert.ok(err instanceof ThemeValidationError)
})

// ==================== checkContrast 测试 ====================
test("checkContrast: 高对比度通过", () => {
  // #ffffff vs #000000 = 21:1
  assertNoThrow(() => {
    captureConsole(() => checkContrast("#ffffff", "#000000", "text", "test"))
  })
})

test("checkContrast: 对比度不足抛出错误", () => {
  // #f1f5f9 vs #ffffff ≈ 1.05:1
  assertThrows(
    () => captureConsole(() => checkContrast("#f1f5f9", "#ffffff", "text", "test")),
    /对比度不足/,
  )
})

test("checkContrast: textMuted 使用宽松阈值 3.0", () => {
  // #94a3b8 vs #0f172a ≈ 5.16:1，应通过
  assertNoThrow(() => {
    captureConsole(() => checkContrast("#94a3b8", "#0f172a", "textMuted", "test"))
  })
})