import { test } from "node:test"
import assert from "node:assert/strict"
import {
  resolveTokens,
  normalizeColors,
  replaceVariables,
  detectPrimitiveReference,
} from "../scripts/lib/tokens.js"
import { captureConsole } from "./helpers.js"

// ==================== resolveTokens 测试 ====================
test("resolveTokens: 解析简单引用", () => {
  const result = resolveTokens("{primary}", { primary: "#3b82f6" })
  assert.equal(result, "#3b82f6")
})

test("resolveTokens: 解析嵌套引用（令牌引用另一令牌）", () => {
  const tokenMap = {
    primary: "{blue-500}",
    "blue-500": "#3b82f6",
  }
  const result = resolveTokens("{primary}", tokenMap)
  assert.equal(result, "#3b82f6")
})

test("resolveTokens: 保留字符串中的多个引用", () => {
  const result = resolveTokens("{primary} {gray-200}", {
    primary: "#3b82f6",
    "gray-200": "#e2e8f0",
  })
  assert.equal(result, "#3b82f6 #e2e8f0")
})

test("resolveTokens: 未定义令牌保留原样（仅警告）", () => {
  const { stderr } = captureConsole(() => {
    const result = resolveTokens("{undefined-token}", { defined: "#fff" })
    assert.equal(result, "{undefined-token}")
  })
  assert.ok(stderr.some((line) => line.includes("未定义")))
})

test("resolveTokens: 数组递归解析", () => {
  const result = resolveTokens(["{primary}", "{secondary}"], {
    primary: "#111",
    secondary: "#222",
  })
  assert.deepEqual(result, ["#111", "#222"])
})

test("resolveTokens: 对象递归解析", () => {
  const result = resolveTokens({ a: "{primary}", b: { c: "{secondary}" } }, {
    primary: "#111",
    secondary: "#222",
  })
  assert.deepEqual(result, { a: "#111", b: { c: "#222" } })
})

test("resolveTokens: 循环引用抛出错误", () => {
  const tokenMap = {
    a: "{b}",
    b: "{a}",
  }
  assert.throws(() => resolveTokens("{a}", tokenMap), /循环引用/)
})

// ==================== normalizeColors 测试 ====================
test("normalizeColors: 递归标准化所有颜色", () => {
  const result = normalizeColors(
    { text: "#ABCDEF", nested: { muted: "#abc" } },
    "test",
  )
  assert.deepEqual(result, {
    text: "#abcdef",
    nested: { muted: "#aabbcc" },
  })
})

test("normalizeColors: 保留非颜色字符串", () => {
  const result = normalizeColors({ role: "italic" }, "test")
  assert.deepEqual(result, { role: "italic" })
})

// ==================== replaceVariables 测试 ====================
test("replaceVariables: 替换 ${var} 为最终色值", () => {
  const result = replaceVariables("${primary}", { primary: "#3b82f6" })
  assert.equal(result, "#3b82f6")
})

test("replaceVariables: 支持透明度后缀", () => {
  const result = replaceVariables("${primary}20", { primary: "#3b82f6" })
  assert.equal(result, "#3b82f620")
})

test("replaceVariables: 未定义变量保留原样", () => {
  const result = replaceVariables("${undefined-var}", { defined: "#fff" })
  assert.equal(result, "${undefined-var}")
})

test("replaceVariables: 已含透明度变量忽略后缀并警告", () => {
  const result = replaceVariables("${primary}20", { primary: "#3b82f620" })
  assert.equal(result, "#3b82f620")
})

// ==================== detectPrimitiveReference 测试 ====================
test("detectPrimitiveReference: 检测直接引用原始值", () => {
  const { stderr } = captureConsole(() => {
    detectPrimitiveReference("{blue-500}", "test-context", ["blue-500"])
  })
  assert.ok(stderr.some((line) => line.includes('直接引用了原始值 "blue-500"')))
})

test("detectPrimitiveReference: ${var} 形式不触发检测", () => {
  const { stderr } = captureConsole(() => {
    detectPrimitiveReference("${primary}", "test-context", ["primary"])
  })
  assert.equal(stderr.length, 0)
})