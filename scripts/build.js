const fs = require("fs")
const yaml = require("js-yaml")
const path = require("path")
const wcag = require("wcag-contrast")

const ROOT_DIR = path.resolve(__dirname, "..")

// ==================== 路径配置 ====================
const PATHS = {
  primitives: path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"),
  semanticsDir: path.join(ROOT_DIR, "src", "core", "semantics"),
  workbench: path.join(ROOT_DIR, "src", "workbench.yaml"),
  semantic: path.join(ROOT_DIR, "src", "semantic.yaml"),
  langDir: path.join(ROOT_DIR, "src", "languages"),
  specialDir: path.join(ROOT_DIR, "src", "special"),
  outputDir: path.join(ROOT_DIR, "themes"),
  docsDir: path.join(ROOT_DIR, "docs"),
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

/**
 * 十六进制颜色标准化
 */
function normalizeHex(color, tokenName) {
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

/**
 * 递归解析令牌引用 {token-name}
 */
function resolveTokens(obj, tokenMap, depth = 0, path = []) {
  const MAX_DEPTH = 20
  if (depth > MAX_DEPTH) {
    throw new Error(`[ENGINEERING_FATAL] 令牌循环引用检测: ${path.join(" → ")}`)
  }

  if (typeof obj === "string") {
    const resolveOne = (str) => {
      return str.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
        const value = tokenMap[key]
        if (value === undefined) {
          console.warn(`⚠️ 警告: 令牌 "${key}" 未定义，保留原样`)
          return match
        }
        return resolveOne(value)
      })
    }
    return resolveOne(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveTokens(item, tokenMap, depth + 1, path))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = resolveTokens(v, tokenMap, depth + 1, [...path, k])
    }
    return result
  }
  return obj
}

/**
 * 标准化所有颜色值
 */
function normalizeColors(obj, tokenName) {
  if (typeof obj === "string") {
    return normalizeHex(obj, tokenName)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeColors(item, tokenName))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = normalizeColors(v, `${tokenName}.${k}`)
    }
    return result
  }
  return obj
}

/**
 * 替换变量 ${var} 为最终色值
 */
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
          if (/^rgba?\(/.test(value)) {
            console.warn(
              `⚠️ 警告: 变量 "${key}" 值 ${value} 已是 rgba 格式，忽略后缀`,
            )
            return value
          }
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

/**
 * WCAG 对比度校验（阶梯式标准）
 */
function checkContrast(color1, color2, role, themeType) {
  if (!color1 || !color2) return
  const ratio = wcag.hex(color1, color2)

  let minRatio = 4.5
  if (role === "textDim" || role === "comment") {
    minRatio = 4.0 // 次要文字可略低
  }

  if (ratio < minRatio) {
    console.error(
      `❌ 对比度不足: ${themeType} · ${role} (${color1}) vs 背景 (${color2}) = ${ratio.toFixed(2)}:1`,
    )
    console.error(`   WCAG 要求 ≥${minRatio}:1，当前值低于标准`)
    process.exit(1)
  }
  console.log(`✅ ${themeType} · ${role}: ${ratio.toFixed(2)}:1`)
}

/**
 * 生成 CSS 变量文件
 */
function generateCssVariables(lightColors, darkColors) {
  let css = `/* ===== Moongate 设计令牌 - 自动生成 ===== */\n`
  css += `/* 来源: VS Code 主题构建脚本 */\n`
  css += `/* 请勿手动修改，修改请编辑 primitives/ 和 semantics/ 目录 */\n\n`

  css += `/* 浅色模式 */\n:root,\n.light {\n`
  Object.entries(lightColors).forEach(([key, val]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
    css += `  --ui-${cssKey}: ${val};\n`
  })
  css += `}\n\n`

  css += `/* 深色模式 */\n.dark {\n`
  Object.entries(darkColors).forEach(([key, val]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
    css += `  --ui-${cssKey}: ${val};\n`
  })
  css += `}\n`

  const cssPath = path.join(PATHS.outputDir, "moongate-tokens.css")
  fs.writeFileSync(cssPath, css)
  console.log(`✅ CSS 变量已生成: ${cssPath}`)
}

/**
 * 生成设计系统文档（增强版）
 * - 原始色值按色系分组
 * - 语义层表格增加对比度列（关键角色）
 * - 添加海拔系统说明
 */
function generateDesignSystemDoc(primitives, lightColors, darkColors) {
  const md = []

  md.push("# Moongate 设计系统\n")
  md.push("## 🎨 原始色值\n")

  // 定义色系分组
  const colorGroups = {
    blue: [
      "blue-500",
      "blue-600",
      "blue-700",
      "blue-800",
      "blue-900",
      "blue-glow",
      "blue-glow-dark",
    ],
    green: ["green-400", "green-600", "green-700"],
    yellow: ["yellow-400", "yellow-500", "yellow-600", "yellow-700"],
    red: ["red-400", "red-500", "red-600", "red-700"],
    cyan: ["cyan-400", "cyan-500", "cyan-700"],
    purple: ["purple-400", "purple-500", "purple-700"],
    gray: Object.keys(primitives).filter((k) => k.startsWith("gray-")),
    special: ["white", "black"],
  }

  for (const [group, keys] of Object.entries(colorGroups)) {
    if (keys.length === 0) continue
    md.push(`### ${group.charAt(0).toUpperCase() + group.slice(1)} 色系\n`)
    md.push("| 令牌 | 色值 | 预览 |")
    md.push("|------|------|------|")
    for (const key of keys) {
      if (!primitives[key]) continue
      const val = primitives[key]
      const preview = `![](https://placehold.co/20x20/${val.slice(1)}/${val.slice(1)}?text=+)`
      md.push(`| \`--moongate-${key}\` | \`${val}\` | ${preview} |`)
    }
    md.push("")
  }

  // 海拔系统说明
  md.push("## 🏔️ 海拔系统（Elevation System）\n")
  md.push(
    "海拔系统通过明度差异表达 UI 元素的物理深度，遵循 Material Design 海拔规范。",
  )
  md.push("| 变量 | 浅色模式 | 深色模式 | 说明 |")
  md.push("|------|----------|----------|------|")
  md.push(
    `| \`surfaceGround\` | \`${lightColors.surfaceGround}\` | \`${darkColors.surfaceGround}\` | 地面层（0dp）—— 编辑器背景 |`,
  )
  md.push(
    `| \`surfaceRaised\` | \`${lightColors.surfaceRaised}\` | \`${darkColors.surfaceRaised}\` | 隆起层（2dp）—— 侧边栏、活动栏 |`,
  )
  md.push(
    `| \`surfaceFloating\` | \`${lightColors.surfaceFloating}\` | \`${darkColors.surfaceFloating}\` | 漂浮层（8dp）—— 弹窗、菜单 |`,
  )
  md.push(
    `| \`surfaceTooltip\` | \`${lightColors.surfaceTooltip}\` | \`${darkColors.surfaceTooltip}\` | 提示层（12dp）—— 工具提示 |`,
  )
  md.push(
    `| \`borderFloating\` | \`${lightColors.borderFloating}\` | \`${darkColors.borderFloating}\` | 浮层边框（半透明主色） |\n`,
  )

  // 辅助函数：计算对比度
  const contrast = (color1, color2) => {
    if (!color1 || !color2) return null
    try {
      return wcag.hex(color1, color2).toFixed(2)
    } catch {
      return null
    }
  }

  // 浅色模式语义层
  md.push("## 🌙 浅色模式语义层\n")
  md.push("| 语义变量 | 色值 | 预览 | WCAG 对比度（vs `bg`） |")
  md.push("|----------|------|------|------------------------|")
  const lightBg = lightColors.bg
  const lightImportantKeys = [
    "text",
    "textDim",
    "textMuted",
    "comment",
    "primary",
    "success",
    "warning",
    "error",
  ]
  for (const [key, val] of Object.entries(lightColors)) {
    const preview = `![](https://placehold.co/20x20/${val.slice(1)}/${val.slice(1)}?text=+)`
    let contrastRatio = "-"
    if (lightImportantKeys.includes(key) && lightBg) {
      const ratio = contrast(val, lightBg)
      if (ratio) contrastRatio = `${ratio}:1`
    }
    md.push(`| \`${key}\` | \`${val}\` | ${preview} | ${contrastRatio} |`)
  }

  // 深色模式语义层
  md.push("\n## 🌑 深色模式语义层\n")
  md.push("| 语义变量 | 色值 | 预览 | WCAG 对比度（vs `bg`） |")
  md.push("|----------|------|------|------------------------|")
  const darkBg = darkColors.bg
  for (const [key, val] of Object.entries(darkColors)) {
    const preview = `![](https://placehold.co/20x20/${val.slice(1)}/${val.slice(1)}?text=+)`
    let contrastRatio = "-"
    if (lightImportantKeys.includes(key) && darkBg) {
      const ratio = contrast(val, darkBg)
      if (ratio) contrastRatio = `${ratio}:1`
    }
    md.push(`| \`${key}\` | \`${val}\` | ${preview} | ${contrastRatio} |`)
  }

  // 写入文件
  const mdPath = path.join(PATHS.docsDir, "DESIGN_SYSTEM.md")
  if (!fs.existsSync(PATHS.docsDir)) {
    fs.mkdirSync(PATHS.docsDir, { recursive: true })
  }
  fs.writeFileSync(mdPath, md.join("\n"), "utf8")
  console.log(`✅ 设计系统文档已生成: ${mdPath}`)
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

// ==================== 主流程 ====================
function main() {
  console.log("🚀 开始构建主题 (DTCG 标准 + 工业级质检)...\n")

  try {
    ensureFileExists(PATHS.primitives, "原始值")
    ensureFileExists(PATHS.semanticsDir, "语义目录")
    ensureFileExists(PATHS.workbench, "workbench")
    ensureFileExists(PATHS.semantic, "semantic")
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  console.log("📦 加载原始值...")
  const primitivesRaw = safeLoadYaml(PATHS.primitives, "primitives.yaml")
  if (!primitivesRaw) process.exit(1)

  const primitives = {}
  Object.entries(primitivesRaw).forEach(([key, val]) => {
    primitives[key] = normalizeHex(val, `primitives.${key}`)
  })

  console.log("📦 加载公共规则...")
  const workbenchRaw = safeLoadYaml(PATHS.workbench, "workbench.yaml")
  const semanticRaw = safeLoadYaml(PATHS.semantic, "semantic.yaml")
  if (!workbenchRaw || !semanticRaw) process.exit(1)

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
  }

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
  }

  console.log("\n🎨 扫描语义文件...")
  const semanticFiles = fs
    .readdirSync(PATHS.semanticsDir)
    .filter((f) => f.endsWith(".yaml"))
  if (semanticFiles.length === 0) {
    console.error("❌ semantics 目录下没有找到 .yaml 文件")
    process.exit(1)
  }

  const themeInfo = getThemeInfo()
  let baseName = themeInfo.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()

  let lightSemantics, darkSemantics

  console.log(`\n🔨 开始构建主题...\n`)
  semanticFiles.forEach((semanticFile) => {
    const themeType = path.basename(semanticFile, ".yaml")
    const outputFile = path.join(
      PATHS.outputDir,
      `${baseName}-${themeType}.json`,
    )

    const semanticsPath = path.join(PATHS.semanticsDir, semanticFile)
    const semantics = safeLoadYaml(semanticsPath, `语义层 ${semanticFile}`)
    if (!semantics) {
      console.error(`   ❌ 跳过 ${semanticFile}`)
      return
    }

    const resolved = resolveTokens(semantics, primitives)
    const normalized = normalizeColors(resolved, `semantics.${semanticFile}`)

    if (themeType === "light") lightSemantics = normalized
    if (themeType === "dark") darkSemantics = normalized

    const uiColors = replaceVariables(workbenchRaw, normalized)
    const semanticColors = replaceVariables(semanticRaw, normalized)
    const tokenColors = replaceVariables(tokenColorsRaw, normalized)

    const type = themeType.includes("light") ? "light" : "dark"
    const displaySuffix = themeType === "dark" ? "Dark" : "Light"

    const theme = {
      name: `${themeInfo.displayName} ${displaySuffix}`,
      type: type,
      colors: uiColors,
      tokenColors: tokenColors,
      semanticTokenColors: semanticColors,
    }

    if (!fs.existsSync(PATHS.outputDir)) {
      fs.mkdirSync(PATHS.outputDir, { recursive: true })
    }

    fs.writeFileSync(outputFile, JSON.stringify(theme, null, 2))
    console.log(`   ✅ 构建完成: ${outputFile}`)

    // 对比度校验
    if (normalized.bg && normalized.text) {
      checkContrast(normalized.text, normalized.bg, "text", themeType)
    }
    if (normalized.bg && normalized.textDim) {
      checkContrast(normalized.textDim, normalized.bg, "textDim", themeType)
    }
    if (normalized.bg && normalized.textMuted) {
      checkContrast(normalized.textMuted, normalized.bg, "textMuted", themeType)
    }
  })

  if (lightSemantics && darkSemantics) {
    generateCssVariables(lightSemantics, darkSemantics)
    generateDesignSystemDoc(primitives, lightSemantics, darkSemantics)
  }

  console.log("\n🎉 所有主题构建完毕！")
}

main()
