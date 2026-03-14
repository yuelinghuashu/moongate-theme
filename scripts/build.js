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

function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ 未找到 ${description} 文件: ${filePath}`)
  }
}

function safeLoadYaml(filePath, description) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8"))
  } catch (err) {
    console.error(`❌ 解析 ${description} 失败 (${filePath}):`, err.message)
    return null
  }
}

function replaceVariables(obj, colors) {
  if (typeof obj === "string") {
    return obj.replace(
      /\$\{([a-zA-Z0-9_-]+)\}([0-9a-fA-F]{2})?/g,
      (match, key, alpha) => {
        const value = colors[key]
        if (value === undefined) {
          console.warn(`⚠️ 警告: 变量 "${key}" 未定义，保留原样`)
          return match
        }

        if (alpha) {
          if (/^#[0-9a-fA-F]{8}$/.test(value)) {
            console.warn(
              `⚠️ 警告: 变量 "${key}" 值 ${value} 已包含透明度，忽略后缀 "${alpha}"`,
            )
            return value
          }
          if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return value + alpha
          }
          console.warn(
            `⚠️ 警告: 变量 "${key}" 值 ${value} 格式异常，无法处理透明度`,
          )
          return value
        }
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

function getThemeInfo() {
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

// 主题显示名称和 uiTheme 映射
const themeDisplayMap = {
  dark: { suffix: "Dark", uiTheme: "vs-dark" },
  light: { suffix: "Light", uiTheme: "vs" },
  "hc-black": { suffix: "High Contrast (Black)", uiTheme: "hc-black" },
  "hc-light": { suffix: "High Contrast (Light)", uiTheme: "hc-light" },
  // 可根据需要扩展
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

  // 3. 收集语言规则
  console.log("📚 加载语言规则...")
  let tokenColorsRaw = []
  if (fs.existsSync(PATHS.langDir)) {
    const langFiles = fs
      .readdirSync(PATHS.langDir)
      .filter((f) => f.endsWith(".yaml"))
      .sort()
    langFiles.forEach((file) => {
      const filePath = path.join(PATHS.langDir, file)
      const langRules = safeLoadYaml(filePath, `语言规则 ${file}`)
      if (langRules?.tokenColors) {
        tokenColorsRaw = tokenColorsRaw.concat(langRules.tokenColors)
        console.log(`   ✅ 已加载: ${file}`)
      }
    })
  } else {
    console.warn("⚠️ languages 目录不存在，跳过语言规则加载")
  }

  // 4. 加载特殊规则
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
    console.log("ℹ️ special 目录不存在，跳过特殊规则")
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
  let baseName = themeInfo.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()

  // 7. 为每个颜色文件构建主题
  console.log(`\n🔨 开始构建主题 (基础名称: ${baseName})...\n`)
  colorFiles.forEach((colorFile) => {
    const match = colorFile.match(/^colors-(.+)\.yaml$/)
    if (!match) return
    const themeType = match[1] // 如 'dark', 'light', 'hc-black'
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

    // 确定显示名称和 uiTheme
    const display = themeDisplayMap[themeType] || {
      suffix: themeType,
      uiTheme: "vs-dark",
    }
    const themeName = `${themeInfo.displayName} ${display.suffix}`
    // 推断主题类型（用于 theme.type 字段）
    const type = themeType.includes("light") ? "light" : "dark"

    const theme = {
      name: themeName,
      type: type,
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

main()
