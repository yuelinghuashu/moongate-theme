const fs = require("fs")
const yaml = require("js-yaml")
const path = require("path")
const wcag = require("wcag-contrast")

const ROOT_DIR = path.resolve(__dirname, "..")

// ==================== 路径配置 ====================
const PATHS = {
  primitives: path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"),
  semanticsDir: path.join(ROOT_DIR, "src", "core", "semantics"),
  layout: path.join(ROOT_DIR, "src", "core", "layout.yaml"), // 新增
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
 * 检测是否直接引用了原始值（如 {blue-500}）
 * 该函数用于组件层/语义层的原始值引用提醒，目前主要作为架构辅助。
 */
function detectPrimitiveReference(value, context) {
  if (typeof value === "string" && /\{([a-zA-Z0-9_-]+)\}/.test(value)) {
    const match = value.match(/\{([a-zA-Z0-9_-]+)\}/)[1]
    const primitivePrefixes = [
      "blue-",
      "green-",
      "yellow-",
      "red-",
      "cyan-",
      "purple-",
      "gray-",
    ]
    if (primitivePrefixes.some((prefix) => match.startsWith(prefix))) {
      console.warn(
        `[架构提醒] ${context} 中直接引用了原始值 "${match}"，建议通过语义层引用。`,
      )
    }
  }
}

/**
 * 替换变量 ${var} 为最终色值
 */
function replaceVariables(obj, colors, context = "") {
  if (typeof obj === "string") {
    // 可选：检测直接引用原始值（仅当 context 提供且为组件层时）
    if (context) detectPrimitiveReference(obj, context)

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
    return obj.map((item) => replaceVariables(item, colors, context))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = replaceVariables(v, colors, context)
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
    minRatio = 4.0
  }
  if (role === "textMuted") {
    minRatio = 3.0
  }

  if (ratio < minRatio) {
    if (role === "textMuted") {
      console.warn(
        `⚠️ 对比度略低: ${themeType} · ${role} (${color1}) vs 背景 (${color2}) = ${ratio.toFixed(2)}:1`,
      )
      console.warn(`   建议保持 ≥3.0:1，当前满足最低要求。`)
    } else {
      console.error(
        `❌ 对比度不足: ${themeType} · ${role} (${color1}) vs 背景 (${color2}) = ${ratio.toFixed(2)}:1`,
      )
      console.error(`   WCAG 要求 ≥${minRatio}:1，当前值低于标准`)
      process.exit(1)
    }
  } else {
    console.log(`✅ ${themeType} · ${role}: ${ratio.toFixed(2)}:1`)
  }
}

/**
 * 生成颜色 CSS 变量文件（包含深浅模式）
 */
function generateColorCss(lightColors, darkColors) {
  let css = `/* ===== Moongate 颜色令牌 - 自动生成 ===== */\n`
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

  const cssPath = path.join(PATHS.outputDir, "moongate-colors.css")
  fs.writeFileSync(cssPath, css)
  console.log(`✅ 颜色令牌已生成: ${cssPath}`)
}

/**
 * 生成布局/排版/响应式 CSS 变量文件（支持嵌套对象）
 */
function generateLayoutCss(layoutTokens) {
  let css = `/* ===== Moongate 布局令牌 - 自动生成 ===== */\n`
  css += `/* 包含：间距、圆角、阴影、排版、响应式断点、Z-Index */\n`
  css += `/* 请勿手动修改，修改请编辑 src/core/layout.yaml */\n\n`

  css += `:root {\n`

  // 处理嵌套对象，将嵌套键平铺为 --ui-{parent}-{child}
  function flattenObject(obj, prefix = "") {
    Object.entries(obj).forEach(([key, val]) => {
      const fullKey = prefix ? `${prefix}-${key}` : key
      if (val && typeof val === "object" && !Array.isArray(val)) {
        flattenObject(val, fullKey)
      } else {
        // 处理字体值中的引号转义
        let formattedVal = val
        if (typeof formattedVal === "string") {
          // 移除最外层引号，保留内部必要引号
          if (
            (formattedVal.startsWith("'") && formattedVal.endsWith("'")) ||
            (formattedVal.startsWith('"') && formattedVal.endsWith('"'))
          ) {
            formattedVal = formattedVal.slice(1, -1)
          }
        }
        css += `  --ui-${fullKey}: ${formattedVal};\n`
      }
    })
  }

  flattenObject(layoutTokens)

  css += `}\n`

  const cssPath = path.join(PATHS.outputDir, "moongate-layout.css")
  fs.writeFileSync(cssPath, css)
  console.log(`✅ 布局令牌已生成: ${cssPath}`)
}

/**
 * 生成设计系统文档（增强版）
 * 包含变量选择协议、原始色值、海拔系统、语义层对比度
 */
function generateDesignSystemDoc(primitives, lightColors, darkColors) {
  const md = []

  md.push("# Moongate 设计系统\n")
  md.push("## 🧭 Moongate 变量选择协议\n")
  md.push("为了确保设计系统的长期可维护性和语义一致性，请遵循以下决策路径：\n")
  md.push("| 场景 | 查找位置 | 禁止行为 |")
  md.push("|------|----------|----------|")
  md.push(
    "| **我需要定义新的基础色值**（如 `blue-600`） | `primitives/colors.yaml` | ❌ 不要在语义层或组件层直接写色值 |",
  )
  md.push(
    "| **我需要给某个语义角色赋值**（如 `primary` 应该是什么颜色） | `semantics/*.yaml`（引用原始值） | ❌ 不要在组件层直接引用原始值 |",
  )
  md.push(
    "| **我要为 UI 组件设置样式**（如 `sideBar.background`） | 引用语义层变量（如 `${surfaceRaised}`） | ❌ 不要直接使用 `${blue-500}` 或硬编码色值 |",
  )
  md.push(
    "| **语义层缺少我需要的角色** | 在语义层新增一个逻辑角色（如 `actionHover`），再在组件中引用它 | ❌ 禁止在组件层发明新变量 |",
  )
  md.push(
    "\n> **核心原则**：所有颜色必须经过“原始值 → 语义层 → 组件层”的传递链条，任何跨层直接引用都是**架构污染**。\n",
  )

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
    ensureFileExists(PATHS.layout, "布局令牌")
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

  console.log("📦 加载布局令牌...")
  const layoutTokens = safeLoadYaml(PATHS.layout, "layout.yaml")
  if (layoutTokens) {
    generateLayoutCss(layoutTokens)
  } else {
    console.error("❌ layout.yaml 加载失败，构建终止")
    process.exit(1)
  }

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

    const uiColors = replaceVariables(workbenchRaw, normalized, `workbench`)
    const semanticColors = replaceVariables(semanticRaw, normalized, `semantic`)
    const tokenColors = replaceVariables(
      tokenColorsRaw,
      normalized,
      `tokenColors`,
    )

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
    generateColorCss(lightSemantics, darkSemantics)
    generateDesignSystemDoc(primitives, lightSemantics, darkSemantics)
  }

  console.log("\n🎉 所有主题构建完毕！")
}

main()
