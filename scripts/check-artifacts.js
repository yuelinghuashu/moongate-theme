#!/usr/bin/env node
/**
 * 产出物一致性检查：重新构建后，`themes/` 与生成的 docs 必须与提交内容完全一致
 *
 * 用途：提交/发布前确认「忘了重建产物」不会溜进去。
 * 用法: node scripts/check-artifacts.js
 */
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TARGETS = ["themes", "docs/DESIGN_SYSTEM.md", "docs/COVERAGE.md", "docs/token-names.snapshot.json"]

console.log("🔨 重新构建…")
execFileSync(process.execPath, [path.join(ROOT_DIR, "scripts", "build.js")], { cwd: ROOT_DIR, stdio: "pipe" })

let diff = ""
try {
  diff = execFileSync("git", ["diff", "--name-only", "--", ...TARGETS], { cwd: ROOT_DIR, encoding: "utf8" }).trim()
} catch {
  console.log("⚠️ 不是 git 仓库（或缺少 git），跳过产出物一致性检查")
  process.exit(0)
}

if (diff) {
  console.error("❌ 构建产物与提交内容不一致（跑完 build 后忘记提交？）：")
  for (const file of diff.split("\n")) console.error(`   · ${file}`)
  console.error("   请在本地构建后提交产物（`node scripts/build.js` 已内置 prettier 格式化）。")
  process.exit(1)
}
console.log("✅ 产出物一致：themes/ 与生成文档均已提交且与构建结果相同")
