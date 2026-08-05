import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

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

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  } else if (hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }

  if (!/^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(hex)) {
    console.error(
      `❌ 致命错误: 令牌 "${tokenName}" 的色值 "${color}" 不符合工业规范。`,
    )
    console.error(`   要求: 6 位 (#RRGGBB) 或 8 位 (#RRGGBBAA) 十六进制`)
    process.exit(1)
  }

  return `#${hex.toLowerCase()}`
}

/** 从 package.json 读取主题名称信息 */
export function getThemeInfo() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const pkgPath = path.resolve(__dirname, "..", "..", "package.json")
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