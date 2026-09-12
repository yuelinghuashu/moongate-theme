import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { PATHS } from "./lib/config.js"
import { ensureFileExists, safeLoadYaml, normalizeHex, detectDuplicateColors, getThemeInfo } from "./lib/utils.js"
import { resolveTokens, normalizeColors, replaceVariables, assertNoDirectPrimitiveRefs, assertSemanticReferencesPrimitivesOnly, assertNoRawHexColors } from "./lib/tokens.js"
import { detectUnusedPrimitives, validateThemeStructure, checkContrast, checkAnsiContrast, assertSemanticKeyParity, checkUIPairs } from "./lib/validators.js"
import { mergeTokenColors, optimizeSemanticTokenColors } from "./lib/optimizers.js"
import { generateColorCss, generateLayoutCss, generateDesignSystemDoc, generateScssTokens, generateTsTokens } from "./lib/generators.js"
import {
  loadVscodeThemeDefaults,
  checkFallbackReadability,
  assertRoleDistinctnessParity,
  collectLeafScopeNames,
  findUncoveredLeafScopes,
  buildCoverageReport,
  checkColorKeyValidity,
} from "./lib/theme-coverage.js"
import { buildDefaultSyntaxMap } from "./lib/scope-validator.js"

const require = createRequire(import.meta.url)

/**
 * 用 prettier 格式化生成的 markdown（保证 build 产物与提交格式一致，便于 check-artifacts 比对）
 *
 * prettier 未安装时仅提示、不阻断构建。
 */
function formatGeneratedDocs(files) {
  let prettierBin
  try {
    prettierBin = require.resolve("prettier/bin/prettier.cjs")
  } catch {
    console.warn("   ⚠️ 未安装 prettier，跳过生成文档的格式化（docs 可能与提交格式不一致）")
    return
  }
  const targets = files.filter((file) => fs.existsSync(file))
  if (!targets.length) return
  try {
    execFileSync(process.execPath, [prettierBin, "--write", ...targets], { stdio: "ignore" })
    console.log(`   🎨 已格式化生成文档: ${targets.map((f) => path.relative(PATHS.outputDir, f)).join(", ")}`)
  } catch (err) {
    console.warn(`   ⚠️ prettier 格式化失败（${err.message}）`)
  }
}

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

  // 架构分层强校验：语义层只引用原始值；组件/规则层禁止直接引用原始值
  assertSemanticReferencesPrimitivesOnly(semantics, primitiveKeys)
  assertNoDirectPrimitiveRefs(workbenchRaw, "workbench", primitiveKeys)
  assertNoDirectPrimitiveRefs(semanticRaw, "semantic", primitiveKeys)
  assertNoDirectPrimitiveRefs(tokenColorsRaw, "tokenColors", primitiveKeys)

  // 分层硬化：消费者层禁止直写裸 hex 色值
  assertNoRawHexColors(workbenchRaw, "workbench")
  assertNoRawHexColors(semanticRaw, "semantic")
  assertNoRawHexColors(tokenColorsRaw, "tokenColors")

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
    "text", "textDim", "textInactive", "textMuted", "comment",
    "primary", "success", "warning", "error",
    "function", "variable", "variableDim", "punctuation", "operator",
    // 2026-09 扩展：语法强调色、Git 装饰、括号高亮、压暗遮罩（后者登记豁免）
    "highlight", "cyan", "purple",
    "gitAdded", "gitModified", "gitDeleted", "gitUntracked", "gitIgnored",
    "bracket1", "bracket2", "bracket3", "bracket4", "bracket5", "bracket6",
    "codeDim",
  ]
  for (const role of contrastRoles) {
    if (normalized.bg && normalized[role]) {
      checkContrast(normalized[role], normalized.bg, role, themeType)
    }
  }

  // ANSI 终端色对比度验证（黑族豁免）
  checkAnsiContrast(normalized, themeType)

  // UI 交互前景/背景配对对比度（按钮/菜单/徽章/选中行等）
  checkUIPairs(normalized, themeType)

  // 回退可读性：只定义了配对的一半时，另一半回退 VS Code 默认色是否可读
  checkFallbackReadability(uiColors, themeType)

  // 界面键名有效性：VS Code 不认识的键定义后不会生效（错字/废弃键）
  checkColorKeyValidity(uiColors)

  return { normalized, uiColors, tokenColors }
}

// ==================== 主流程 ====================

/**
 * 生成 docs/COVERAGE.md：界面键覆盖 + 语法叶子 scope 覆盖 + 角色区分度
 */
function generateCoverageReport({ mergedTokenColors, uiColorsByMode, darkSemantics, lightSemantics }) {
  console.log("\n📊 生成覆盖率报告...")
  const mode = uiColorsByMode.dark ? "dark" : "light"
  const themeColors = uiColorsByMode[mode] || {}
  // 键位基线取深/浅默认主题的并集（两个模式共用同一份 workbench.yaml 键集）
  const darkDefaults = loadVscodeThemeDefaults("dark")
  const lightDefaults = loadVscodeThemeDefaults("light")
  const defaults = darkDefaults && lightDefaults
    ? { colors: { ...lightDefaults.colors, ...darkDefaults.colors }, source: darkDefaults.source }
    : darkDefaults || lightDefaults

  const syntaxMap = buildDefaultSyntaxMap()
  const leafScopesByLang = {}
  const uncoveredByLang = {}
  const syntaxWarnings = []
  for (const [file, grammarPaths] of Object.entries(syntaxMap)) {
    if (!grammarPaths.length) continue
    const lang = file.replace(/\.yaml$/, "")
    const leaves = new Set()
    for (const grammarPath of grammarPaths) {
      if (!fs.existsSync(grammarPath)) continue
      for (const name of collectLeafScopeNames(grammarPath)) leaves.add(name)
    }
    if (!leaves.size) {
      syntaxWarnings.push(lang)
      continue
    }
    leafScopesByLang[lang] = [...leaves].sort()
    uncoveredByLang[lang] = findUncoveredLeafScopes(mergedTokenColors, leaves).uncovered
  }

  const report = buildCoverageReport({
    themeColors,
    defaultColors: defaults?.colors ?? null,
    tokenColors: mergedTokenColors,
    leafScopesByLang,
    uncoveredByLang,
    darkColors: darkSemantics,
    lightColors: lightSemantics,
    syntaxWarnings,
  })
  const outFile = path.join(PATHS.docsDir, "COVERAGE.md")
  if (!fs.existsSync(PATHS.docsDir)) fs.mkdirSync(PATHS.docsDir, { recursive: true })
  fs.writeFileSync(outFile, report)
  formatGeneratedDocs([outFile])
  const uncoveredTotal = Object.values(uncoveredByLang).reduce((n, list) => n + list.length, 0)
  const missingKeys = defaults ? Object.keys(defaults.colors).filter((k) => themeColors[k] === undefined).length : 0
  console.log(
    `   ✅ 覆盖率报告: ${outFile}（未覆盖界面键 ${missingKeys} · 未覆盖语法叶子 scope ${uncoveredTotal}）`,
  )
}

function main() {
  console.log("🚀 开始构建主题 (DTCG 标准 + 工业级质检)...\n")

  try {
    // 1. 检查必要文件，并确保输出目录存在（MOONGATE_ROOT 指向临时目录时也要能构建）
    ensureSourceFiles()
    for (const dir of [PATHS.outputDir, PATHS.docsDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    }

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
    const uiColorsByMode = {}
    let mergedTokenColors = []
    console.log(`\n🔨 开始构建主题...\n`)
    for (const semanticFile of semanticFiles) {
      const built = buildSingleTheme({
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
      if (built) {
        const mode = path.basename(semanticFile, ".yaml")
        semanticsByName[mode] = built.normalized
        uiColorsByMode[mode] = built.uiColors
        mergedTokenColors = built.tokenColors
      }
    }

    // 8. 语义层键位一致性 + 生成 CSS 变量、跨平台令牌和设计系统文档
    const lightSemantics = semanticsByName.light
    const darkSemantics = semanticsByName.dark
    if (lightSemantics && darkSemantics) {
      assertSemanticKeyParity(darkSemantics, lightSemantics)
      assertRoleDistinctnessParity(darkSemantics, lightSemantics)
      generateColorCss(lightSemantics, darkSemantics)
      generateScssTokens(lightSemantics, darkSemantics, layoutTokens)
      generateTsTokens(lightSemantics, darkSemantics)
      generateDesignSystemDoc(primitives, lightSemantics, darkSemantics)
      formatGeneratedDocs([path.join(PATHS.docsDir, "DESIGN_SYSTEM.md")])
    }

    // 9. 覆盖率报告（界面键 / 语法叶子 scope / 角色区分度）
    generateCoverageReport({ mergedTokenColors, uiColorsByMode, darkSemantics, lightSemantics })

    console.log("\n🎉 所有主题构建完毕！")
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

main()