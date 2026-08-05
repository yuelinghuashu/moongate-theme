#!/usr/bin/env node
/**
 * Better Comments 配置自动生成器
 *
 * 从 src/core/semantics/dark.yaml 语义层读取最终色值，
 * 自动生成 extras/better-comments.json。
 *
 * 消除"双源重复"风险：语义层颜色变化后，运行构建即可自动同步。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")

// ==================== 路径配置 ====================
const PRIMITIVES_PATH = path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml")
const DARK_SEMANTICS_PATH = path.join(ROOT_DIR, "src", "core", "semantics", "dark.yaml")
const OUTPUT_PATH = path.join(ROOT_DIR, "extras", "better-comments.json")

// Better Comments 需要的语义变量 → tag 映射
const TAG_MAP = [
  { tag: "TODO", semanticKey: "warning", bold: true },
  { tag: "FIXME", semanticKey: "error", bold: true, italic: true },
  { tag: "NOTE", semanticKey: "highlight", italic: true },
  { tag: "HACK", semanticKey: "purple", bold: true },
  { tag: "BUG", semanticKey: "error", bold: true, underline: true },
  { tag: "XXX", semanticKey: "warning", bold: true },
]

/**
 * 递归解析令牌引用 {token-name}
 */
function resolveTokens(obj, tokenMap, depth = 0) {
  const MAX_DEPTH = 20
  if (depth > MAX_DEPTH) {
    throw new Error(`令牌循环引用检测: ${JSON.stringify(obj)}`)
  }

  if (typeof obj === "string") {
    const resolveOne = (str) => {
      return str.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
        const value = tokenMap[key]
        if (value === undefined) {
          console.warn(`⚠️ 令牌 "${key}" 未定义，保留原样`)
          return match
        }
        return resolveOne(value)
      })
    }
    return resolveOne(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveTokens(item, tokenMap, depth + 1))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = resolveTokens(v, tokenMap, depth + 1)
    }
    return result
  }
  return obj
}

/**
 * 从语义层解析指定语义变量的最终色值
 */
function resolveSemanticColor(semantics, primitives, key) {
  const value = semantics[key]
  if (value === undefined) {
    throw new Error(`语义变量 "${key}" 未在 dark.yaml 中定义`)
  }
  const resolved = resolveTokens(value, primitives)
  if (typeof resolved !== "string" || !resolved.startsWith("#")) {
    throw new Error(`语义变量 "${key}" 解析结果不是色值: "${resolved}"`)
  }
  return resolved
}

function main() {
  console.log("🚀 生成 Better Comments 配置...\n")

  try {
    // 1. 加载原始值与深色语义层
    const primitives = yaml.load(fs.readFileSync(PRIMITIVES_PATH, "utf8"))
    const darkSemantics = yaml.load(fs.readFileSync(DARK_SEMANTICS_PATH, "utf8"))

    if (!primitives || !darkSemantics) {
      throw new Error("YAML 解析失败")
    }

    // 2. 解析每个 tag 的最终色值
    const tags = TAG_MAP.map(({ tag, semanticKey, ...style }) => {
      const color = resolveSemanticColor(darkSemantics, primitives, semanticKey)
      return {
        tag,
        color,
        ...style,
      }
    })

    // 3. 写入输出文件
    const output = { "better-comments.tags": tags }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n")

    console.log("   ✅ 已生成: extras/better-comments.json")
    console.log("   映射关系（深色语义层 → Better Comments）:")
    tags.forEach((t) => {
      console.log(`     ${t.tag.padEnd(6)} → ${t.color}`)
    })
  } catch (err) {
    console.error(`❌ 生成失败:`, err.message)
    process.exit(1)
  }

  console.log("\n🎉 Better Comments 配置生成完毕！")
}

main()