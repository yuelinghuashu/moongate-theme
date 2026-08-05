import fs from "node:fs"
import path from "node:path"
import { PATHS } from "./lib/config.js"
import { ensureFileExists, safeLoadYaml, normalizeHex, getThemeInfo } from "./lib/utils.js"
import { resolveTokens, normalizeColors, replaceVariables } from "./lib/tokens.js"
import { detectUnusedPrimitives, validateThemeStructure, checkContrast } from "./lib/validators.js"
import { mergeTokenColors, optimizeSemanticTokenColors } from "./lib/optimizers.js"
import { generateColorCss, generateLayoutCss, generateDesignSystemDoc } from "./lib/generators.js"

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

  const primitiveKeys = Object.keys(primitives)

  // 检测重复色值
  const valueToKeys = {}
  for (const [key, val] of Object.entries(primitives)) {
    if (!valueToKeys[val]) valueToKeys[val] = []
    valueToKeys[val].push(key)
  }
  for (const [val, keys] of Object.entries(valueToKeys)) {
    if (keys.length > 1) {
      console.warn(`⚠️ 检测到重复色值: ${val} → ${keys.join(", ")}`)
    }
  }

  console.log("  加载布局令牌...")
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

  console.log("  📚 加载语言规则...")
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

  // 加载所有语义层数据（用于未使用令牌检测）
  const allSemantics = []
  semanticFiles.forEach((file) => {
    const semantics = safeLoadYaml(
      path.join(PATHS.semanticsDir, file),
      `语义层 ${file}`,
    )
    if (semantics) allSemantics.push(semantics)
  })
  detectUnusedPrimitives(primitives, allSemantics)

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

    console.log(`   📝 处理 ${themeType} 模式...`)
    let tokenColors = replaceVariables(
      tokenColorsRaw,
      normalized,
      `tokenColors`,
    )

    // 合并 token 规则
    tokenColors = mergeTokenColors(tokenColors)

    // 精简 semanticTokenColors
    const optimizedSemantic = optimizeSemanticTokenColors(semanticColors)

    const type = themeType.includes("light") ? "light" : "dark"
    const displaySuffix = themeType === "dark" ? "Dark" : "Light"

    const theme = {
      name: `${themeInfo.displayName} ${displaySuffix}`,
      type: type,
      colors: uiColors,
      tokenColors: tokenColors,
      semanticTokenColors: optimizedSemantic,
    }

    if (!fs.existsSync(PATHS.outputDir)) {
      fs.mkdirSync(PATHS.outputDir, { recursive: true })
    }

    fs.writeFileSync(outputFile, JSON.stringify(theme, null, 2))
    console.log(`   ✅ 构建完成: ${outputFile}`)

    // 结构验证
    validateThemeStructure(theme, outputFile)

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