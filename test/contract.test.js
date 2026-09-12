/**
 * 跨仓库令牌契约测试（T2）+ 产出物一致性脚本接线（T3）
 *
 * 契约：`TOKEN_CONVENTIONS.md` §3 —— 语义角色名只增不删、不改名（`--ui-*` 是跨仓库契约，
 * moongate-vue 的 `check-tokens.ts` 依赖）。这里把约定变成快照 + 三端一致性断言。
 */
import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { safeLoadYaml } from "../scripts/lib/utils.js"
import {
  readArtifacts,
  compareArtifactNames,
  buildSnapshot,
  diffContract,
  loadSnapshot,
} from "../scripts/lib/contract.js"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SNAPSHOT = path.join(ROOT_DIR, "docs", "token-names.snapshot.json")

before(() => {
  execFileSync("node", ["scripts/build.js"], { cwd: ROOT_DIR, stdio: "pipe" })
})

const artifacts = readArtifacts(path.join(ROOT_DIR, "themes"))

// ==================== 三端一致性 ====================

test("契约：CSS / SCSS / TS 三端角色名与值一致", () => {
  const issues = compareArtifactNames(artifacts)
  assert.deepEqual(issues, [], "三端令牌产物不一致")
})

test("契约：三端名字遵循既定命名规则", () => {
  for (const [role, value] of Object.entries(buildSnapshot(artifacts))) {
    assert.match(value.css, /^--ui-[a-z0-9-]+$/, `${role} 的 CSS 名不合法`)
    assert.match(value.scss, /^\$ui-[a-z0-9-]+$/, `${role} 的 SCSS 名不合法`)
    assert.equal(value.ts, role)
  }
})

test("契约：CSS 与 TS 的值等于主题语义层解析结果", () => {
  const primitives = safeLoadYaml(path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"))
  const resolveRole = (mode) => {
    const semantics = safeLoadYaml(path.join(ROOT_DIR, "src", "core", "semantics", `${mode}.yaml`))
    const out = {}
    for (const [role, value] of Object.entries(semantics)) {
      const m = /^\{([A-Za-z0-9_-]+)\}([0-9a-fA-F]{0,2})$/.exec(String(value))
      out[role] = m && primitives[m[1]] ? primitives[m[1]] + m[2] : String(value)
    }
    return out
  }
  for (const mode of ["light", "dark"]) {
    const expected = resolveRole(mode)
    for (const [role, value] of Object.entries(artifacts.css[mode])) {
      if (!(role in expected)) continue // 非语义角色（如布局令牌）不在本断言范围
      assert.equal(
        value.toLowerCase(),
        expected[role].toLowerCase(),
        `${mode}: ${role} 在 CSS 中为 ${value}，但语义层解析为 ${expected[role]}`,
      )
    }
  }
})

// ==================== 快照（只增不删/不改名） ====================

test("契约：快照存在且没有删除/改名（跨仓库契约）", () => {
  const snapshot = loadSnapshot(SNAPSHOT)
  assert.ok(snapshot, `缺少契约快照 ${path.relative(ROOT_DIR, SNAPSHOT)} —— 运行 \`pnpm run check:contract --update\``)
  const { removed, changed, added } = diffContract(snapshot, artifacts)
  assert.deepEqual(removed, [], `角色被删除/改名：${removed.join(", ")}（跨仓库契约禁止，需同步 moongate-vue 后再更新快照）`)
  assert.deepEqual(
    changed.map((c) => `${c.role}.${c.field}: ${c.from} → ${c.to}`),
    [],
    "角色名映射发生变化",
  )
  assert.deepEqual(added, [], `新增角色未登记快照：${added.join(", ")} —— 确认名字稳定后运行 \`pnpm run check:contract --update\``)
})

test("契约：快照覆盖三端且与产物同源", () => {
  const snapshot = loadSnapshot(SNAPSHOT)
  const current = buildSnapshot(artifacts)
  assert.deepEqual(Object.keys(snapshot).sort(), Object.keys(current).sort())
  for (const [role, entry] of Object.entries(snapshot)) {
    assert.deepEqual(entry, current[role], `${role} 的三端名字与产物不符`)
  }
})

// ==================== 产出物一致性（T3） ====================

test("产出物：生成文档保持 prettier 格式（防格式漂移脏工作区）", () => {
  const targets = [path.join(ROOT_DIR, "docs", "DESIGN_SYSTEM.md"), path.join(ROOT_DIR, "docs", "COVERAGE.md")]
  const prettierBin = path.join(ROOT_DIR, "node_modules", "prettier", "bin", "prettier.cjs")
  assert.ok(fs.existsSync(prettierBin), "缺少 prettier（devDependency），无法校验生成文档格式")
  execFileSync(process.execPath, [prettierBin, "--check", ...targets], { cwd: ROOT_DIR, stdio: "pipe" })
})

test("产出物：一致性脚本已接线（check:artifacts / check:contract）", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"))
  for (const name of ["check:artifacts", "check:contract", "sync:color-ids"]) {
    assert.ok(pkg.scripts?.[name], `package.json 缺少 scripts.${name}`)
  }
  for (const file of ["scripts/check-artifacts.js", "scripts/check-contract.js", "scripts/sync-color-ids.js"]) {
    assert.ok(fs.existsSync(path.join(ROOT_DIR, file)), `缺少 ${file}`)
  }
})
