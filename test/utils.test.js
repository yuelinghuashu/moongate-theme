import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeHex, getThemeInfo } from "../scripts/lib/utils.js"

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

// getThemeInfo 测试
test("getThemeInfo: 返回主题名称与显示名", () => {
  const info = getThemeInfo()
  assert.equal(info.name, "moongate-theme")
  assert.equal(info.displayName, "Moongate Theme")
})