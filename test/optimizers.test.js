import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mergeTokenColors,
  optimizeSemanticTokenColors,
} from "../scripts/lib/optimizers.js"

// ==================== mergeTokenColors 测试 ====================
test("mergeTokenColors: 相同 settings 合并为一条规则", () => {
  const input = [
    {
      name: "Comment 1",
      scope: ["comment"],
      settings: { foreground: "#aabbcc" },
    },
    {
      name: "Comment 2",
      scope: ["comment.line", "comment.block"],
      settings: { foreground: "#aabbcc" },
    },
  ]
  const result = mergeTokenColors(input)
  assert.equal(result.length, 1)
  assert.deepEqual(result[0].scope.sort(), ["comment", "comment.block", "comment.line"])
  assert.deepEqual(result[0].settings, { foreground: "#aabbcc" })
})

test("mergeTokenColors: 不同 settings 不合并", () => {
  const input = [
    {
      name: "Rule A",
      scope: ["keyword"],
      settings: { foreground: "#111111" },
    },
    {
      name: "Rule B",
      scope: ["string"],
      settings: { foreground: "#222222" },
    },
  ]
  const result = mergeTokenColors(input)
  assert.equal(result.length, 2)
})

test("mergeTokenColors: 空数组返回原样", () => {
  assert.deepEqual(mergeTokenColors([]), [])
  assert.equal(mergeTokenColors(undefined), undefined)
})

test("mergeTokenColors: 跳过无 settings 或 scope 的项", () => {
  const input = [
    { name: "No settings", scope: ["comment"] },
    { name: "No scope", settings: { foreground: "#fff" } },
    {
      name: "Valid",
      scope: ["keyword"],
      settings: { foreground: "#333333" },
    },
  ]
  const result = mergeTokenColors(input)
  assert.equal(result.length, 1)
  assert.deepEqual(result[0].scope, ["keyword"])
})

test("mergeTokenColors: 按 scope 数量降序排序", () => {
  const input = [
    {
      name: "Few",
      scope: ["a"],
      settings: { foreground: "#111111" },
    },
    {
      name: "Many",
      scope: ["a", "b", "c"],
      settings: { foreground: "#222222" },
    },
  ]
  const result = mergeTokenColors(input)
  assert.equal(result[0].scope.length, 3)
  assert.equal(result[1].scope.length, 1)
})

// ==================== optimizeSemanticTokenColors 测试 ====================
test("optimizeSemanticTokenColors: 删除与父级相同的冗余 foreground", () => {
  const input = {
    function: "#87cefa",
    "function.declaration": {
      foreground: "#87cefa",
      fontStyle: "bold",
    },
    "function.async": {
      foreground: "#87cefa",
      fontStyle: "italic",
    },
  }
  const result = optimizeSemanticTokenColors(input)
  // 与父级相同的 foreground 被删除，保留 fontStyle
  assert.deepEqual(result["function.declaration"], { fontStyle: "bold" })
  assert.deepEqual(result["function.async"], { fontStyle: "italic" })
})

test("optimizeSemanticTokenColors: 不同于父级的 foreground 保留", () => {
  const input = {
    function: "#87cefa",
    "function.declaration": {
      foreground: "#ff0000",
      fontStyle: "bold",
    },
  }
  const result = optimizeSemanticTokenColors(input)
  assert.deepEqual(result["function.declaration"], {
    foreground: "#ff0000",
    fontStyle: "bold",
  })
})

test("optimizeSemanticTokenColors: 父级不存在时完整保留", () => {
  const input = {
    "method.declaration": {
      foreground: "#ff0000",
    },
  }
  const result = optimizeSemanticTokenColors(input)
  assert.deepEqual(result["method.declaration"], { foreground: "#ff0000" })
})

test("optimizeSemanticTokenColors: 空对象返回原样", () => {
  assert.deepEqual(optimizeSemanticTokenColors({}), {})
  assert.equal(optimizeSemanticTokenColors(undefined), undefined)
})