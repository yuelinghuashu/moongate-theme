import { test } from "node:test"
import assert from "node:assert/strict"
import {
  detectUnusedPrimitives,
  validateThemeStructure,
  checkContrast,
  checkAnsiContrast,
  assertSemanticKeyParity,
  checkUIPairs,
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

// ==================== textInactive / ANSI / 键位 parity ====================
test("checkContrast: textInactive 阈值 3.0（低于即抛错）", () => {
  // #94a3b8 vs #f9fafb ≈ 2.45:1，应抛错
  assertThrows(
    () => captureConsole(() => checkContrast("#94a3b8", "#f9fafb", "textInactive", "light")),
    /对比度不足.*textInactive/,
  )
  // #7a8c9e vs #f9fafb ≈ 3.3:1，应通过
  assertNoThrow(() => {
    captureConsole(() => checkContrast("#7a8c9e", "#f9fafb", "textInactive", "light"))
  })
})

test("checkAnsiContrast: 低于阈值抛错、黑族豁免", () => {
  // ansiWhite 近白（1.05:1）应抛错
  assertThrows(
    () =>
      captureConsole(() =>
        checkAnsiContrast(
          { ansiWhite: "#ffffff", bg: "#f9fafb" },
          "light",
        ),
      ),
    /ANSI 对比度不足.*ansiWhite/,
  )
  // 黑族不参与校验
  assertNoThrow(() => {
    captureConsole(() =>
      checkAnsiContrast(
        { ansiBlack: "#1e293b", ansiBrightBlack: "#2d3748", bg: "#0f172a" },
        "dark",
      ),
    )
  })
  // 合法值通过
  assertNoThrow(() => {
    captureConsole(() =>
      checkAnsiContrast(
        { ansiBrightGreen: "#059669", ansiBrightWhite: "#64748b", bg: "#f9fafb" },
        "light",
      ),
    )
  })
})

test("assertSemanticKeyParity: 键集合不一致抛错", () => {
  assertThrows(
    () => assertSemanticKeyParity({ a: "#111" }, { a: "#222", b: "#333" }),
    /键位不一致.*light/s,
  )
  assertNoThrow(() => {
    captureConsole(() => assertSemanticKeyParity({ a: "#111", b: "#222" }, { a: "#333", b: "#444" }))
  })
})

// ==================== UI 交互配对对比度 ====================
test("checkUIPairs: 低于阈值的白字 on 实底强调抛错", () => {
  // #3b82f6 上白字 ≈3.68:1，低于 primarySolid 配对的 4.5
  assertThrows(
    () =>
      captureConsole(() =>
        checkUIPairs(
          { white: "#ffffff", primarySolid: "#3b82f6" },
          "dark",
        ),
      ),
    /UI 配对对比度不足.*primarySolid/s,
  )
  // 合格组合通过
  assertNoThrow(() => {
    captureConsole(() =>
      checkUIPairs(
        { white: "#ffffff", primarySolid: "#2563eb", primary: "#3b82f6" },
        "dark",
      ),
    )
  })
})

test("checkUIPairs: alpha 前景按合成后对比度判定（不足即抛错）", () => {
  // 半透明白 #ffffff80 合成到 #2563eb 上 ≈2.7:1，应低于 4.5 抛错
  assertThrows(
    () =>
      captureConsole(() =>
        checkUIPairs(
          { white: "#ffffff", primarySolid: "#2563eb", selectionForeground: "#ffffff80", selectedBg: "#2563eb" },
          "dark",
        ),
      ),
    /UI 配对对比度不足.*selectionForeground/s,
  )
})