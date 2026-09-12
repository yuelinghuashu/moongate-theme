/**
 * 发布元数据与报告测试（T8 / T9）
 *
 * 覆盖"生成物 → 发布链路"的断点：
 *   · docs/COVERAGE.md 的内容与数字（生成器坏了要能发现）
 *   · verify-scopes CLI 的退出码与输出
 *   · package.json 版本号 ⟷ CHANGELOG 标题
 *   · contributes.themes / contributes.grammars 指向的文件真实存在且是合法 JSON
 *   · `vsce ls` 打包清单（新增目录忘了改 .vscodeignore 会被拦住）
 */
import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildDefaultSyntaxMap } from "../scripts/lib/scope-validator.js"
import { loadVscodeThemeDefaults, collectLeafScopeNames, findUncoveredLeafScopes } from "../scripts/lib/theme-coverage.js"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

before(() => {
  execFileSync("node", ["scripts/build.js"], { cwd: ROOT_DIR, stdio: "pipe" })
})

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"))

// ==================== T8：报告 / CLI / 元数据 ====================

test("报告：docs/COVERAGE.md 含三段结构", () => {
  const report = fs.readFileSync(path.join(ROOT_DIR, "docs", "COVERAGE.md"), "utf8")
  for (const heading of ["## 一、界面键覆盖", "## 二、语法叶子 scope 覆盖", "## 三、语法角色区分度"]) {
    assert.ok(report.includes(heading), `COVERAGE.md 缺少章节「${heading}」`)
  }
})

test("报告：COVERAGE.md 的数字与实际计算结果一致", () => {
  const report = fs.readFileSync(path.join(ROOT_DIR, "docs", "COVERAGE.md"), "utf8")
  const theme = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-dark.json"), "utf8"))
  const dark = loadVscodeThemeDefaults("dark")
  const light = loadVscodeThemeDefaults("light")
  if (!dark || !light) {
    console.log("⚠️ 未找到 VS Code 默认主题，跳过数字比对")
    return
  }
  const allKeys = new Set([...Object.keys(dark.colors), ...Object.keys(light.colors)])
  const missing = [...allKeys].filter((k) => theme.colors[k] === undefined)
  const declared = /未覆盖（回退到 VS Code 默认色）：\*\*(\d+)\*\*/.exec(report)
  assert.ok(declared, "COVERAGE.md 未包含未覆盖键数量")
  assert.equal(Number(declared[1]), missing.length, "COVERAGE.md 的未覆盖键数量与实际不符")

  const tokenColors = theme.tokenColors
  let uncoveredLeaf = 0
  for (const grammarPaths of Object.values(buildDefaultSyntaxMap())) {
    const leaves = new Set()
    for (const grammarPath of grammarPaths) {
      if (!fs.existsSync(grammarPath)) continue
      for (const name of collectLeafScopeNames(grammarPath)) leaves.add(name)
    }
    if (!leaves.size) continue
    uncoveredLeaf += findUncoveredLeafScopes(tokenColors, leaves).uncovered.length
  }
  assert.equal(uncoveredLeaf, 0, `仍有 ${uncoveredLeaf} 个语法叶子 scope 未覆盖，请补规则或登记豁免`)
})

test("CLI：verify-scopes 正常退出并输出统计", () => {
  const output = execFileSync(process.execPath, ["scripts/verify-scopes.js"], { cwd: ROOT_DIR, encoding: "utf8" })
  assert.match(output, /统计: 检查 \d+ 个 scope/)
  assert.match(output, /跨规则 scope 冲突/)
  assert.doesNotMatch(output, /❌/)
})

test("元数据：版本号出现在中英 CHANGELOG 标题中", () => {
  const version = pkg.version
  for (const file of ["CHANGELOG.md", "CHANGELOG_EN.md"]) {
    const text = fs.readFileSync(path.join(ROOT_DIR, file), "utf8")
    assert.ok(
      new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m").test(text),
      `${file} 缺少与 package.json 版本一致的标题 ## [${version}]`,
    )
  }
})

test("元数据：contributes 指向的主题与语法文件都存在且合法", () => {
  const themes = pkg.contributes?.themes ?? []
  assert.ok(themes.length >= 2, "至少应有 dark / light 两套主题")
  for (const theme of themes) {
    const file = path.join(ROOT_DIR, theme.path)
    assert.ok(fs.existsSync(file), `主题文件不存在：${theme.path}`)
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.ok(parsed.colors && parsed.tokenColors, `${theme.path} 结构不完整`)
  }
  for (const grammar of pkg.contributes?.grammars ?? []) {
    const file = path.join(ROOT_DIR, grammar.path)
    assert.ok(fs.existsSync(file), `语法文件不存在：${grammar.path}`)
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.equal(parsed.scopeName, grammar.scopeName, `${grammar.path} 的 scopeName 与 package.json 不一致`)
    assert.ok(parsed.injectionSelector, `${grammar.path} 是注入语法，必须声明 injectionSelector`)
  }
})

// ==================== T9：打包清单 ====================

test("打包：vsce ls 清单包含主题与语法、且不含源码与开发依赖", () => {
  const vsceBin = path.join(ROOT_DIR, "node_modules", "@vscode", "vsce", "vsce")
  assert.ok(fs.existsSync(vsceBin), "缺少 vsce（devDependency）")
  let listing
  try {
    listing = execFileSync(process.execPath, [vsceBin, "ls"], { cwd: ROOT_DIR, encoding: "utf8", timeout: 120000 })
  } catch (err) {
    assert.fail(`vsce ls 执行失败：${err.message}`)
  }
  const files = listing.split("\n").map((line) => line.trim()).filter(Boolean)

  const mustInclude = [
    "themes/moongate-theme-dark.json",
    "themes/moongate-theme-light.json",
    // 跨平台令牌按 .vscodeignore 有意随包（CSS 归属下游组件库，不进 VSIX）
    "themes/_tokens.scss",
    "themes/tokens.ts",
    "syntaxes/python-docstring.injection.tmLanguage.json",
    "README.md",
    "CHANGELOG.md",
    "package.json",
  ]
  for (const file of mustInclude) {
    assert.ok(files.includes(file), `打包内容缺少 ${file}`)
  }
  const mustExclude = [
    /(^|\/)src\//,
    /(^|\/)test\//,
    /(^|\/)node_modules\//,
    /(^|\/)scripts\//,
    /themes\/moongate-colors\.css$/, // 按 .vscodeignore 有意排除（供下游组件库使用）
    /images\/.*-(dark|light)\.png$/,
    /pnpm-lock\.yaml$/,
    /(^|\/)docs\//,
  ]
  for (const pattern of mustExclude) {
    assert.ok(!files.some((file) => pattern.test(file)), `打包内容不应包含匹配 ${pattern} 的文件`)
  }
})
