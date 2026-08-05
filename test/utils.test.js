import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeHex, detectDuplicateColors, getThemeInfo } from "../scripts/lib/utils.js"
import { captureConsole, assertThrows } from "./helpers.js"

// normalizeHex 测试
test("normalizeHex: 展开 3 位缩写为 6 位", () => {
  assert.equal(normalizeHex("#abc", "test"), "#aabbcc")
})

test("normalizeHex: 展开 4 位缩写为 8 位", () => {
  assert.equal(normalizeHex("#abcd", "test"), "#aabbccdd")
})

test("normalizeHex: 标准化大写为小写", () => {
  assert.equal(normalizeHex("#AABBCC", "test"), "#aabbcc")
})

test("normalizeHex: 保留已合法的 8 位颜色", () => {
  assert.equal(normalizeHex("#aabbccdd", "test"), "#aabbccdd")
})

test("normalizeHex: 非十六进制值返回原样（仅警告不阻止）", () => {
  assert.equal(normalizeHex("rgba(0,0,0,0.5)", "test"), "rgba(0,0,0,0.5)")
})

test("normalizeHex: 空值返回 undefined 原样", () => {
  assert.equal(normalizeHex(undefined, "test"), undefined)
})

test("normalizeHex: 非法十六进制格式抛出错误", () => {
  assertThrows(() => normalizeHex("#zzzzzz", "test"), /不符合工业规范/)
})

test("normalizeHex: 5 位十六进制抛出错误", () => {
  assertThrows(() => normalizeHex("#12345", "test"), /不符合工业规范/)
})

// detectDuplicateColors 测试
test("detectDuplicateColors: 检测到重复色值", () => {
  const { stderr } = captureConsole(() => {
    const result = detectDuplicateColors({
      "blue-500": "#3b82f6",
      "blue-600": "#3b82f6",
      "gray-100": "#f1f5f9",
    })
    assert.equal(result.length, 1)
    assert.deepEqual(result[0], { value: "#3b82f6", keys: ["blue-500", "blue-600"] })
  })
  assert.ok(stderr.some((line) => line.includes("检测到重复色值")))
})

test("detectDuplicateColors: 无重复时返回空数组", () => {
  const { stderr } = captureConsole(() => {
    const result = detectDuplicateColors({
      "blue-500": "#3b82f6",
      "gray-100": "#f1f5f9",
    })
    assert.equal(result.length, 0)
  })
  assert.equal(stderr.length, 0)
})

// getThemeInfo 测试
test("getThemeInfo: 返回主题名称与显示名", () => {
  const info = getThemeInfo()
  assert.equal(info.name, "moongate-theme")
  assert.equal(info.displayName, "Moongate Theme")
})
