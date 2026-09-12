#!/usr/bin/env node
/**
 * 跨仓库令牌契约检查（角色名只增不删、不改名；三端产物一致）
 *
 * 用法:
 *   node scripts/check-contract.js            校验（有删除/改名或三端不一致 → 退出码 1）
 *   node scripts/check-contract.js --update   刷新快照 docs/token-names.snapshot.json（新增角色时使用）
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PATHS } from "./lib/config.js"
import { readArtifacts, compareArtifactNames, diffContract, loadSnapshot, writeSnapshot } from "./lib/contract.js"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SNAPSHOT = path.join(ROOT_DIR, "docs", "token-names.snapshot.json")

const artifacts = readArtifacts(PATHS.outputDir)
const nameIssues = compareArtifactNames(artifacts)
const snapshot = loadSnapshot(SNAPSHOT)
const { removed, added, changed, current } = diffContract(snapshot, artifacts)

if (process.argv.includes("--update")) {
  writeSnapshot(SNAPSHOT, current)
  console.log(`✅ 契约快照已更新: ${path.relative(ROOT_DIR, SNAPSHOT)}（${Object.keys(current).length} 个角色）`)
  process.exit(0)
}

let failed = false
if (nameIssues.length) {
  failed = true
  console.error("❌ 三端令牌不一致（CSS / SCSS / TS）：")
  for (const issue of nameIssues) console.error(`   · ${issue}`)
}
if (removed.length) {
  failed = true
  console.error(`❌ 有 ${removed.length} 个角色被删除/改名（跨仓库契约禁止）：${removed.join(", ")}`)
  console.error("   若确实要改名，请同步 moongate-vue 的 check-tokens.ts 与 colors.css 后再更新快照。")
}
if (changed.length) {
  failed = true
  console.error("❌ 角色名映射变了：")
  for (const c of changed) console.error(`   · ${c.role}.${c.field}: ${c.from} → ${c.to}`)
}
if (added.length) {
  failed = true
  console.error(`❌ 有 ${added.length} 个新增角色未登记进快照：${added.join(", ")}`)
  console.error("   请确认这些名字稳定后运行 `pnpm run check:contract --update`。")
}

if (failed) process.exit(1)
console.log(`✅ 契约检查通过：${Object.keys(current).length} 个角色，三端名字与值一致，无删除/改名`)
