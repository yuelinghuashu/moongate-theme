import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  collectAllNames,
  loadConfigScopes,
  scopeMatches,
  verifyAllScopes,
  formatVerificationResult,
} from "../scripts/lib/scope-validator.js"

// ==================== collectAllNames 测试 ====================
test("collectAllNames: 收集所有 name 字段为 scope", () => {
  const output = new Set()
  collectAllNames(
    {
      name: "meta.block",
      patterns: [{ name: "comment.line" }, { include: "#x" }],
      repository: { y: { name: "string.quoted" } },
    },
    output,
  )
  assert.deepEqual(
    Array.from(output).sort(),
    ["comment.line", "meta.block", "string.quoted"].sort(),
  )
})

// ==================== loadConfigScopes 测试 ====================
test("loadConfigScopes: 从 YAML 提取 tokenColors 的 scope", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "moongate-test-"))
  const yamlPath = path.join(tmpDir, "test.yaml")
  fs.writeFileSync(
    yamlPath,
    `tokenColors:
  - scope: ["comment"]
    settings: {}
  - scope: "keyword"
    settings: {}
`,
  )
  const scopes = loadConfigScopes(yamlPath)
  assert.deepEqual(Array.from(scopes).sort(), ["comment", "keyword"].sort())
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ==================== scopeMatches 测试 ====================
test("scopeMatches: 精确匹配", () => {
  assert.equal(scopeMatches("comment", new Set(["comment"])), true)
})

test("scopeMatches: 前缀匹配（配置是语法的前缀）", () => {
  const scopes = new Set(["comment.line.double-slash.ts"])
  assert.equal(scopeMatches("comment", scopes), true)
})

test("scopeMatches: 语法前缀匹配（语法是配置的前缀）", () => {
  const scopes = new Set(["string"])
  assert.equal(scopeMatches("string.quoted.double.tsx", scopes), true)
})

test("scopeMatches: 组合 scope 作为某语法首段", () => {
  const scopes = new Set(["string.interpolated.python string.quoted.single.python"])
  assert.equal(scopeMatches("string.interpolated", scopes), true)
})

test("scopeMatches: 组合 scope 拆分全匹配", () => {
  const scopes = new Set(["meta.tag", "entity.name.tag"])
  assert.equal(scopeMatches("meta.tag entity.name.tag", scopes), true)
})

test("scopeMatches: 不匹配返回 false", () => {
  const scopes = new Set(["comment.line"])
  assert.equal(scopeMatches("string.quoted", scopes), false)
})

test("scopeMatches: 通配符匹配", () => {
  const scopes = new Set(["keyword.control.case.shell", "keyword.control.loop.shell"])
  assert.equal(scopeMatches("keyword.control.*.shell", scopes), true)
})

test("scopeMatches: 通配符不匹配", () => {
  const scopes = new Set(["keyword.control.case.ts"])
  assert.equal(scopeMatches("keyword.control.*.shell", scopes), false)
})

// ==================== verifyAllScopes 测试 ====================
test("verifyAllScopes: 找不到语法文件时标记 syntaxFound=false", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "moongate-test-"))
  const langDir = path.join(tmpDir, "languages")
  fs.mkdirSync(langDir, { recursive: true })
  fs.writeFileSync(
    path.join(langDir, "foo.yaml"),
    `tokenColors:\n  - scope: ["comment"]\n    settings: {}\n`,
  )

  const result = verifyAllScopes({
    langDir,
    syntaxMap: { "foo.yaml": [path.join(tmpDir, "nonexistent.json")] },
  })

  assert.equal(result.perFile.length, 1)
  assert.equal(result.perFile[0].syntaxFound, false)
  assert.equal(result.totalRules, 0)
  assert.equal(result.totalIssues, 0)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test("verifyAllScopes: 语法文件存在但 scope 不匹配时标记缺失", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "moongate-test-"))
  const langDir = path.join(tmpDir, "languages")
  fs.mkdirSync(langDir, { recursive: true })
  fs.writeFileSync(
    path.join(langDir, "foo.yaml"),
    `tokenColors:\n  - scope: ["invalid.scope"]\n    settings: {}\n`,
  )

  // 创建语法文件，只包含 "comment" scope
  const syntaxPath = path.join(tmpDir, "grammar.json")
  fs.writeFileSync(
    syntaxPath,
    JSON.stringify({ name: "comment", patterns: [] }),
  )

  const result = verifyAllScopes({
    langDir,
    syntaxMap: { "foo.yaml": [syntaxPath] },
  })

  assert.equal(result.perFile[0].syntaxFound, true)
  assert.equal(result.totalRules, 1)
  assert.equal(result.totalIssues, 1)
  assert.deepEqual(result.perFile[0].missing, ["invalid.scope"])
  assert.equal(result.isValid, false)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ==================== formatVerificationResult 测试 ====================
test("formatVerificationResult: 格式化输出含统计", () => {
  const result = {
    totalRules: 3,
    totalIssues: 1,
    perFile: [
      { file: "a.yaml", total: 2, missing: [], syntaxFound: true },
      { file: "b.yaml", total: 1, missing: ["bad.scope"], syntaxFound: true },
      { file: "c.yaml", total: 0, missing: [], syntaxFound: false },
    ],
  }
  const out = formatVerificationResult(result)
  assert.match(out, /a\.yaml: ✅ 所有 2 个 scope 均匹配/)
  assert.match(out, /b\.yaml: ❌ 1\/1 个 scope 不匹配/)
  assert.match(out, /bad\.scope/)
  assert.match(out, /c\.yaml: ⚠️ 未找到内置语法文件/)
  assert.match(out, /📊 统计: 检查 3 个 scope，发现 1 个不匹配/)
})