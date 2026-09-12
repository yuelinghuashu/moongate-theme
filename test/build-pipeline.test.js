/**
 * 构建流水线测试（T6 失败路径 + T7 幂等/确定性）
 *
 * 手法：把 `src/`、`syntaxes/`、`package.json` 复制到临时目录，用 `MOONGATE_ROOT=<tmp>`
 * 让构建把那棵树当成项目根 —— 于是可以自由注入坏数据、断言"构建失败并给出正确提示"，
 * 而不触碰本仓库（`scripts/` 与 `node_modules/` 仍用本仓库的）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BUILD_SCRIPT = path.join(ROOT_DIR, "scripts", "build.js")

let tempRoot = null
let baseline = null

/** 复制出可构建的最小项目树 */
function makeTempRoot(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `moongate-${label}-`))
  fs.cpSync(path.join(ROOT_DIR, "src"), path.join(dir, "src"), { recursive: true })
  fs.cpSync(path.join(ROOT_DIR, "syntaxes"), path.join(dir, "syntaxes"), { recursive: true })
  fs.copyFileSync(path.join(ROOT_DIR, "package.json"), path.join(dir, "package.json"))
  return dir
}

/** 在指定根目录跑构建，返回 { ok, output } */
function runBuild(root) {
  try {
    const stdout = execFileSync(process.execPath, [BUILD_SCRIPT], {
      cwd: ROOT_DIR,
      env: { ...process.env, MOONGATE_ROOT: root },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { ok: true, output: stdout }
  } catch (err) {
    return { ok: false, output: `${err.stdout || ""}${err.stderr || ""}` }
  }
}

/** 用变异函数构造一个坏项目并断言构建失败且命中预期提示 */
function expectBuildFailure(label, { file, mutate }, expectedPattern) {
  const root = makeTempRoot(label)
  try {
    if (file) {
      const target = path.join(root, file)
      fs.writeFileSync(target, mutate(fs.readFileSync(target, "utf8")))
    } else {
      mutate(root)
    }
    const { ok, output } = runBuild(root)
    assert.equal(ok, false, `${label}: 期望构建失败，但它成功了`)
    assert.match(output, expectedPattern, `${label}: 失败提示不符合预期：\n${output.slice(-600)}`)
    return output
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const workbench = "src/workbench.yaml"
const semanticLight = "src/core/semantics/light.yaml"

before(() => {
  // 控制组：干净副本必须能构建成功（同时为幂等测试准备基线）
  tempRoot = makeTempRoot("baseline")
  const { ok, output } = runBuild(tempRoot)
  assert.equal(ok, true, `干净副本构建失败（测试环境问题）：\n${output.slice(-800)}`)
  baseline = tempRoot
})

after(() => {
  for (const dir of [tempRoot]) if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

test("构建流水线：干净副本可构建，且产出文件集合固定", () => {
  const themesDir = path.join(baseline, "themes")
  assert.deepEqual(
    fs.readdirSync(themesDir).sort(),
    [
      "_tokens.scss",
      "moongate-colors.css",
      "moongate-layout.css",
      "moongate-theme-dark.json",
      "moongate-theme-light.json",
      "tokens.ts",
    ],
  )
  assert.deepEqual(fs.readdirSync(path.join(baseline, "docs")).sort(), ["COVERAGE.md", "DESIGN_SYSTEM.md"])
})

// ==================== T6：失败路径（接线层） ====================

test("构建失败路径：组件层直接引用原始值 → 架构违规", () => {
  expectBuildFailure(
    "primitive-ref",
    { file: workbench, mutate: (text) => text.replace('editor.background: "${surfaceGround}"', 'editor.background: "{blue-500}"') },
    /架构违规|原始值/,
  )
})

test("构建失败路径：组件层直写裸 hex → 架构违规", () => {
  expectBuildFailure(
    "raw-hex",
    { file: workbench, mutate: (text) => text.replace('editor.foreground: "${text}"', 'editor.foreground: "#e2e8f0"') },
    /裸色值|架构违规/,
  )
})

test("构建失败路径：引用未定义的语义角色 → 结构校验失败", () => {
  expectBuildFailure(
    "undefined-role",
    { file: workbench, mutate: (text) => text.replace('editor.foreground: "${text}"', 'editor.foreground: "${notARole}"') },
    /未解析|notARole/,
  )
})

test("构建失败路径：配对只定义一半且回退不可读 → 构建失败", () => {
  expectBuildFailure(
    "half-pair",
    { file: workbench, mutate: (text) => text.replace(/^inputValidation\.errorForeground:.*\n/m, "") },
    /配对只定义了一半|回退色不可读/,
  )
})

test("构建失败路径：浅色 highlight 与 function 同色 → 深浅区分度不一致", () => {
  expectBuildFailure(
    "distinctness",
    { file: semanticLight, mutate: (text) => text.replace(/^highlight:.*$/m, 'highlight: "{blue-800}"') },
    /深浅两模式的角色区分度结构不一致/,
  )
})

test("构建失败路径：dark/light 语义键位不一致 → 键位校验失败", () => {
  expectBuildFailure(
    "parity",
    { file: semanticLight, mutate: (text) => text.replace(/^cyan:.*\n/m, "") },
    /键位不一致|cyan/,
  )
})

test("构建失败路径：背景与正文对比度不足 → 对比度校验失败", () => {
  expectBuildFailure(
    "contrast",
    { file: semanticLight, mutate: (text) => text.replace(/^bg:.*$/m, 'bg: "{gray-900}"') },
    /对比度不足/,
  )
})

// ==================== T7：幂等与确定性 ====================

test("构建幂等：连续两次构建产出字节一致", () => {
  const hashAll = (root) => {
    const files = [
      "themes/moongate-theme-dark.json",
      "themes/moongate-theme-light.json",
      "themes/moongate-colors.css",
      "themes/_tokens.scss",
      "themes/tokens.ts",
      "docs/COVERAGE.md",
      "docs/DESIGN_SYSTEM.md",
    ]
    return files.map((file) => {
      const content = fs.readFileSync(path.join(root, file))
      return `${file}:${createHash("sha256").update(content).digest("hex")}`
    })
  }
  const first = hashAll(baseline)
  const { ok } = runBuild(baseline)
  assert.equal(ok, true, "第二次构建失败")
  assert.deepEqual(hashAll(baseline), first, "两次构建的产物不一致（存在非确定性）")
})
