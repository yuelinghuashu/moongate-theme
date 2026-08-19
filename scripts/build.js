import fs from "node:fs"
import path from "node:path"
import { PATHS } from "./lib/config.js"
import { ensureFileExists, safeLoadYaml, normalizeHex, detectDuplicateColors, getThemeInfo } from "./lib/utils.js"
import { resolveTokens, normalizeColors, replaceVariables } from "./lib/tokens.js"
import { detectUnusedPrimitives, validateThemeStructure, checkContrast } from "./lib/validators.js"
import { mergeTokenColors, optimizeSemanticTokenColors } from "./lib/optimizers.js"
import { generateColorCss, generateLayoutCss, generateDesignSystemDoc, generateScssTokens, generateTsTokens } from "./lib/generators.js"

// ==================== 文件加载 ====================

/** 确保所有必需源文件存在 */
function ensureSourceFiles() {
  ensureFileExists(PATHS.primitives, "原始值")
  ensureFileExists(PATHS.semanticsDir, "语义目录")
  ensureFileExists(PATHS.layout, "布局令牌")
  ensureFileExists(PATHS.workbench, "workbench")
  ensureFileExists(PATHS.semantic, "semantic")
}

/** 加载并标准化原始色值 */
function loadPrimitives() {
  console.log("📦 加载原始值...")
  const primitivesRaw = safeLoadYaml(PATHS.primitives, "primitives.yaml")
  if (!primitivesRaw) {
    throw new Error("❌ primitives.yaml 加载失败，构建终止")
  }

  const primitives = {}
  for (const [key, val] of Object.entries(primitivesRaw)) {
    primitives[key] = normalizeHex(val, `primitives.${key}`)
  }
  return primitives
}

/** 加载布局令牌并生成 CSS，返回令牌数据供后续使用 */
function loadLayoutTokens() {
  console.log("  加载布局令牌...")
  const layoutTokens = safeLoadYaml(PATHS.layout, "layout.yaml")
  if (!layoutTokens) {
    throw new Error("❌ layout.yaml 加载失败，构建终止")
  }
  generateLayoutCss(layoutTokens)
  return layoutTokens
}

/** 加载公共规则（workbench + semantic） */
function loadCommonRules() {
  console.log("📦 加载公共规则...")
  const workbenchRaw = safeLoadYaml(PATHS.workbench, "workbench.yaml")
  const semanticRaw = safeLoadYaml(PATHS.semantic, "semantic.yaml")
  if (!workbenchRaw || !semanticRaw) {
    throw new Error("❌ workbench.yaml 或 semantic.yaml 加载失败，构建终止")
  }
  return { workbenchRaw, semanticRaw }
}

/** 加载指定目录下的所有 YAML 令牌规则 */
function loadRuleFiles(dirPath, dirLabel) {
  const rules = []
  if (!fs.existsSync(dirPath)) return rules

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const langRules = safeLoadYaml(filePath, `${dirLabel} ${file}`)
    if (langRules?.tokenColors) {
      rules.push(...langRules.tokenColors)
      console.log(`   ✅ 已加载: ${file}`)
    }
  }
  return rules
}

/** 加载语言与特殊规则 */
function loadTokenColors() {
  console.log("  📚 加载语言规则...")
  const langRules = loadRuleFiles(PATHS.langDir, "语言规则")

  console.log("✨ 加载特殊规则...")
  const specialRules = loadRuleFiles(PATHS.specialDir, "特殊规则")

  return [...langRules, ...specialRules]
}

/** 加载语义文件并检测未使用原始值，返回文件名列表和预加载的语义数据 */
function loadSemanticFiles(primitives) {
  console.log("\n🎨 扫描语义文件...")
  const semanticFiles = fs
    .readdirSync(PATHS.semanticsDir)
    .filter((f) => f.endsWith(".yaml"))
  if (semanticFiles.length === 0) {
    throw new Error("❌ semantics 目录下没有找到 .yaml 文件")
  }

  const allSemantics = []
  const semanticsByName = {}
  for (const file of semanticFiles) {
    const semantics = safeLoadYaml(path.join(PATHS.semanticsDir, file), `语义层 ${file}`)
    if (semantics) {
      allSemantics.push(semantics)
      semanticsByName[file] = semantics
    }
  }
  detectUnusedPrimitives(primitives, allSemantics)

  return { semanticFiles, semanticsByName }
}

// ==================== 主题构建 ====================

/**
 * 构建单个主题并写入文件
 * @returns {object|null} normalized 语义色值映射（副作用：写文件、验证）
 */
function buildSingleTheme({
  semanticFile,
  semantics,
  primitives,
  workbenchRaw,
  semanticRaw,
  tokenColorsRaw,
  primitiveKeys,
  baseName,
  themeInfo,
}) {
  const themeType = path.basename(semanticFile, ".yaml")
  const outputFile = path.join(PATHS.outputDir, `${baseName}-${themeType}.json`)

  if (!semantics) {
    console.error(`   ❌ 跳过 ${semanticFile}`)
    return null
  }

  const resolved = resolveTokens(semantics, primitives)
  const normalized = normalizeColors(resolved, `semantics.${semanticFile}`)

  console.log(`   📝 处理 ${themeType} 模式...`)

  const uiColors = replaceVariables(workbenchRaw, normalized, "workbench", primitiveKeys)
  const semanticColors = replaceVariables(semanticRaw, normalized, "semantic", primitiveKeys)

  let tokenColors = replaceVariables(tokenColorsRaw, normalized, "tokenColors", primitiveKeys)

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

  // 对比度验证（覆盖所有前景色角色 vs 背景）
  const contrastRoles = [
    "text", "textDim", "textMuted", "comment",
    "primary", "success", "warning", "error",
    "function", "variable", "variableDim", "punctuation", "operator",
  ]
  for (const role of contrastRoles) {
    if (normalized.bg && normalized[role]) {
      checkContrast(normalized[role], normalized.bg, role, themeType)
    }
  }

  return normalized
}

// ==================== 主流程 ====================
function main() {
  console.log("🚀 开始构建主题 (DTCG 标准 + 工业级质检)...\n")

  try {
    // 1. 检查必要文件
    ensureSourceFiles()

    // 2. 加载并标准化原始色值
    const primitives = loadPrimitives()
    const primitiveKeys = Object.keys(primitives)
    detectDuplicateColors(primitives)

    // 3. 生成布局 CSS，返回令牌数据供 SCSS 生成复用
    const layoutTokens = loadLayoutTokens()

    // 4. 加载公共规则（workbench + semantic）
    const { workbenchRaw, semanticRaw } = loadCommonRules()

    // 5. 加载语言与特殊规则
    const tokenColorsRaw = loadTokenColors()

    // 6. 扫描语义文件并检测未使用原始值
    const { semanticFiles, semanticsByName: preloadedSemantics } = loadSemanticFiles(primitives)

    // 7. 构建每个主题
    const themeInfo = getThemeInfo()
    const baseName = themeInfo.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()

    const semanticsByName = {}
    console.log(`\n🔨 开始构建主题...\n`)
    for (const semanticFile of semanticFiles) {
      const normalized = buildSingleTheme({
        semanticFile,
        semantics: preloadedSemantics[semanticFile],
        primitives,
        workbenchRaw,
        semanticRaw,
        tokenColorsRaw,
        primitiveKeys,
        baseName,
        themeInfo,
      })
      if (normalized) {
        semanticsByName[path.basename(semanticFile, ".yaml")] = normalized
      }
    }

    // 8. 生成 CSS 变量、跨平台令牌和设计系统文档
    const lightSemantics = semanticsByName.light
    const darkSemantics = semanticsByName.dark
    if (lightSemantics && darkSemantics) {
      generateColorCss(lightSemantics, darkSemantics)
      generateScssTokens(lightSemantics, darkSemantics, layoutTokens)
      generateTsTokens(lightSemantics, darkSemantics)
      generateDesignSystemDoc(primitives, lightSemantics, darkSemantics)
    }

    console.log("\n🎉 所有主题构建完毕！")
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

main()