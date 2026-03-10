const fs = require("fs")
const yaml = require("js-yaml")
const path = require("path")

const ROOT_DIR = path.resolve(__dirname, "..")

// ==================== 路径配置 ====================
const PATHS = {
  workbench: path.join(ROOT_DIR, "src", "workbench.yaml"),
  semantic: path.join(ROOT_DIR, "src", "semantic.yaml"),
  langDir: path.join(ROOT_DIR, "src", "languages"),
  specialDir: path.join(ROOT_DIR, "src", "special"),
  coreDir: path.join(ROOT_DIR, "src", "core"),
  outputDir: path.join(ROOT_DIR, "themes"),
}

// ==================== 辅助函数 ====================

/**
 * 确保文件存在，否则抛出错误
 */
function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ 未找到 ${description} 文件: ${filePath}`)
  }
}

/**
 * 安全加载 YAML 文件，失败时返回 null 并打印错误
 */
function safeLoadYaml(filePath, description) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8"))
  } catch (err) {
    console.error(`❌ 解析 ${description} 失败 (${filePath}):`, err.message)
    return null
  }
}

/**
 * 增强版变量替换函数
 * 支持变量名包含连字符，智能处理透明度
 */
function replaceVariables(obj, colors) {
  if (typeof obj === "string") {
    // 正则匹配 ${变量名} 后可选两位十六进制透明度
    return obj.replace(
      /\$\{([a-zA-Z0-9_-]+)\}([0-9a-fA-F]{2})?/g,
      (match, key, alpha) => {
        const value = colors[key]
        if (value === undefined) {
          console.warn(`⚠️ 警告: 变量 "${key}" 未定义，保留原样`)
          return match
        }

        // 处理透明度
        if (alpha) {
          // 如果变量本身已经是 8 位色值（含透明度）
          if (/^#[0-9a-fA-F]{8}$/.test(value)) {
            console.warn(
              `⚠️ 警告: 变量 "${key}" 值 ${value} 已包含透明度，忽略后缀 "${alpha}"`,
            )
            return value
          }
          // 如果变量是 6 位标准色值，拼接透明度
          if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return value + alpha
          }
          // 其他情况（非标准格式）发出警告并原样返回
          console.warn(
            `⚠️ 警告: 变量 "${key}" 值 ${value} 格式异常，无法处理透明度`,
          )
          return value
        }

        // 无透明度后缀，直接返回值
        return value
      },
    )
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceVariables(item, colors))
  }

  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = replaceVariables(v, colors)
    }
    return result
  }

  return obj
}

/**
 * 从 package.json 读取主题基本信息
 */
function getThemeInfo() {
  const pkgPath = path.join(ROOT_DIR, "package.json")
  if (!fs.existsSync(pkgPath)) {
    return { name: "your-theme", displayName: "Your Theme" }
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    // 使用 displayName 若存在，否则使用 name（去掉可能的 @scope/ 前缀）
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

// ==================== 主流程 ====================
function main() {
  console.log("🚀 开始构建主题...\n")

  // 1. 检查必需文件
  try {
    ensureFileExists(PATHS.workbench, "workbench")
    ensureFileExists(PATHS.semantic, "semantic")
    ensureFileExists(PATHS.coreDir, "core 目录")
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // 2. 加载公共规则
  console.log("📦 加载公共规则...")
  const workbenchRaw = safeLoadYaml(PATHS.workbench, "workbench.yaml")
  const semanticRaw = safeLoadYaml(PATHS.semantic, "semantic.yaml")
  if (!workbenchRaw || !semanticRaw) {
    process.exit(1)
  }

  // 3. 收集语言规则（自动扫描 languages 目录，可按需排序）
  console.log("📚 加载语言规则...")
  let tokenColorsRaw = []
  if (fs.existsSync(PATHS.langDir)) {
    // 获取所有 yaml 文件并按文件名排序（也可自定义顺序）
    const langFiles = fs
      .readdirSync(PATHS.langDir)
      .filter((f) => f.endsWith(".yaml"))
      .sort() // 按字母顺序排序，确保一致性

    langFiles.forEach((file) => {
      const filePath = path.join(PATHS.langDir, file)
      const langRules = safeLoadYaml(filePath, `语言规则 ${file}`)
      if (langRules?.tokenColors) {
        tokenColorsRaw = tokenColorsRaw.concat(langRules.tokenColors)
        console.log(`   ✅ 已加载: ${file}`)
      }
    })
  } else {
    console.warn("⚠️  languages 目录不存在，跳过语言规则加载")
  }

  // 4. 加载特殊规则（如 better-comments 等）
  console.log("✨ 加载特殊规则...")
  if (fs.existsSync(PATHS.specialDir)) {
    const specialFiles = fs
      .readdirSync(PATHS.specialDir)
      .filter((f) => f.endsWith(".yaml"))

    specialFiles.forEach((file) => {
      const filePath = path.join(PATHS.specialDir, file)
      const specialRules = safeLoadYaml(filePath, `特殊规则 ${file}`)
      if (specialRules?.tokenColors) {
        tokenColorsRaw = tokenColorsRaw.concat(specialRules.tokenColors)
        console.log(`   ✅ 已加载: ${file}`)
      }
    })
  } else {
    console.log("ℹ️  special 目录不存在，跳过特殊规则")
  }

  // 5. 获取颜色变量文件
  console.log("\n🎨 扫描颜色变量文件...")
  const colorFiles = fs
    .readdirSync(PATHS.coreDir)
    .filter((f) => f.startsWith("colors-") && f.endsWith(".yaml"))

  if (colorFiles.length === 0) {
    console.error("❌ core 目录下没有找到 colors-*.yaml 文件")
    process.exit(1)
  }

  // 6. 读取主题信息
  const themeInfo = getThemeInfo()
  let baseName = themeInfo.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase() // 净化文件名
  console.log("原始 baseName:", baseName) // 添加这行
  // 移除末尾的 "-theme" 后缀（如果存在），使文件名不包含 "theme"
  baseName = baseName.replace(/-theme$/, "")
  console.log("处理后 baseName:", baseName) // 添加这行

  // 7. 为每个颜色文件构建主题
  console.log(`\n🔨 开始构建主题 (基础名称: ${baseName})...\n`)
  colorFiles.forEach((colorFile) => {
    const match = colorFile.match(/^colors-(.+)\.yaml$/)
    if (!match) return
    const themeType = match[1] // "dark" 或 "light"
    const outputFile = path.join(
      PATHS.outputDir,
      `${baseName}-${themeType}.json`,
    )

    // 加载颜色变量
    const colorsPath = path.join(PATHS.coreDir, colorFile)
    const colors = safeLoadYaml(colorsPath, `颜色变量 ${colorFile}`)
    if (!colors) {
      console.error(`   ❌ 跳过 ${colorFile}`)
      return
    }

    // 替换变量
    const uiColors = replaceVariables(workbenchRaw, colors)
    const semanticColors = replaceVariables(semanticRaw, colors)
    const tokenColors = replaceVariables(tokenColorsRaw, colors)

    // 构建主题对象
    const theme = {
      name: `${themeInfo.displayName} ${themeType === "dark" ? "Dark" : "Light"}`,
      type: themeType,
      colors: uiColors,
      tokenColors: tokenColors,
      semanticTokenColors: semanticColors,
    }

    // 确保输出目录存在
    if (!fs.existsSync(PATHS.outputDir)) {
      fs.mkdirSync(PATHS.outputDir, { recursive: true })
    }

    fs.writeFileSync(outputFile, JSON.stringify(theme, null, 2))
    console.log(`   ✅ 构建完成: ${outputFile}`)
  })

  console.log("\n🎉 所有主题构建完毕！")
}

// 执行主函数
main()
