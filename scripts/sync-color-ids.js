#!/usr/bin/env node
/**
 * 刷新「已知 VS Code 颜色键」数据表（scripts/lib/data/vscode-color-ids.json）
 *
 * 来源（取并集）：
 *   1. 本机 VS Code 安装包：out/**\/*.js 里的 registerColor("<id>")、扩展 contributes.colors[].id、
 *      自带主题 themes/*.json 的键；
 *   2. VS Code 官方文档 theme-color.md 的键清单（需要网络；--offline 可跳过）。
 *
 * 用法: node scripts/sync-color-ids.js [--offline]
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")
const OUT_FILE = path.join(ROOT_DIR, "scripts", "lib", "data", "vscode-color-ids.json")
const DOCS_URL = "https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md"
const VSCODE_APP = process.env.VSCODE_APP_DIR || "/usr/share/code/resources/app"

const isColorId = (id) => /^[a-zA-Z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*$/.test(id)
const offline = process.argv.includes("--offline")

function fromInstaller(root) {
  const ids = new Set()
  const walk = (dir, cb) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full, cb)
      else cb(full)
    }
  }
  walk(path.join(root, "out"), (file) => {
    if (!file.endsWith(".js")) return
    const text = fs.readFileSync(file, "utf8")
    for (const m of text.matchAll(/\boe\("([a-zA-Z][a-zA-Z0-9_.]*)"/g)) if (m[1].includes(".")) ids.add(m[1])
  })
  for (const base of [path.join(root, "extensions"), path.join(os.homedir(), ".vscode", "extensions")]) {
    for (const dir of fs.existsSync(base) ? fs.readdirSync(base) : []) {
      const manifest = path.join(base, dir, "package.json")
      if (!fs.existsSync(manifest)) continue
      try {
        const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"))
        for (const color of parsed.contributes?.colors ?? []) if (color?.id) ids.add(color.id)
      } catch {
        /* 忽略无法解析的扩展清单 */
      }
      const themesDir = path.join(base, dir, "themes")
      if (!fs.existsSync(themesDir)) continue
      for (const file of fs.readdirSync(themesDir)) {
        if (!file.endsWith(".json")) continue
        try {
          const theme = JSON.parse(fs.readFileSync(path.join(themesDir, file), "utf8"))
          for (const key of Object.keys(theme.colors ?? {})) ids.add(key)
        } catch {
          /* 忽略 */
        }
      }
    }
  }
  return ids
}

async function fromDocs() {
  if (offline) return new Set()
  try {
    const res = await fetch(DOCS_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return new Set([...text.matchAll(/^- `([A-Za-z][A-Za-z0-9_.]*)`:/gm)].map((m) => m[1]))
  } catch (err) {
    console.warn(`⚠️ 拉取官方文档失败（${err.message}），本次仅用本机安装包数据`)
    return new Set()
  }
}

const installer = fromInstaller(VSCODE_APP)
const docs = await fromDocs()
const merged = [...new Set([...installer, ...docs])].filter(isColorId).sort()
fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 0) + "\n")
console.log(`✅ 已知色键数据表已刷新: ${path.relative(ROOT_DIR, OUT_FILE)}`)
console.log(`   本机安装包 ${installer.size} 键 · 官方文档 ${docs.size} 键 → 合并 ${merged.length} 键`)
