import fs from "node:fs"
import path from "node:path"
import yaml from "js-yaml"
import { ROOT_DIR } from "./config.js"

/** 确保文件存在，不存在则抛出错误 */
export function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ 未找到 ${description} 文件: ${filePath}`)
  }
}

/** 安全加载 YAML，失败时返回 null */
export function safeLoadYaml(filePath, description) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8"))
  } catch (err) {
    console.error(`❌ 解析 ${description} 失败 (${filePath}):`, err.message)
    return null
  }
}

/** 十六进制颜色标准化 */
export function normalizeHex(color, tokenName) {
  if (typeof color !== "string" || !color.startsWith("#")) {
    if (color && !color.startsWith("#")) {
      console.warn(`⚠️ 跳过非十六进制色值: ${tokenName} = ${color}`)
    }
    return color
  }

  let hex = color.replace("#", "")

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }

  if (!/^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(hex)) {
    throw new Error(
      `❌ 致命错误: 令牌 "${tokenName}" 的色值 "${color}" 不符合工业规范。\n` +
      `   要求: 6 位 (#RRGGBB) 或 8 位 (#RRGGBBAA) 十六进制`,
    )
  }

  return `#${hex.toLowerCase()}`
}

/**
 * 检测重复色值
 * @param {Record<string, string>} primitives 原始色值映射
 * @returns {Array<{ value: string, keys: string[] }>} 重复的色值列表
 */
export function detectDuplicateColors(primitives) {
  const valueToKeys = {}
  for (const [key, val] of Object.entries(primitives)) {
    if (!valueToKeys[val]) valueToKeys[val] = []
    valueToKeys[val].push(key)
  }

  const duplicates = []
  for (const [val, keys] of Object.entries(valueToKeys)) {
    if (keys.length > 1) {
      console.warn(`⚠️ 检测到重复色值: ${val} → ${keys.join(", ")}`)
      duplicates.push({ value: val, keys })
    }
  }
  return duplicates
}

/** 从 package.json 读取主题名称信息 */
export function getThemeInfo() {
  const pkgPath = path.join(ROOT_DIR, "package.json")
  if (!fs.existsSync(pkgPath)) {
    return { name: "your-theme", displayName: "Your Theme" }
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    let displayName = pkg.displayName || pkg.name || "Your Theme"
    if (displayName.startsWith("@") && displayName.includes("/")) {
      displayName = displayName.split("/")[1]
    }
    return {
      name: pkg.name || "your-theme",
      displayName,
    }
  } catch {
    return { name: "your-theme", displayName: "Your Theme" }
  }
}