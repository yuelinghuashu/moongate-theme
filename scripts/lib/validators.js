import wcag from "wcag-contrast"

/**
 * 主题结构验证失败时抛出错误（由调用方决定如何处理）
 */
export class ThemeValidationError extends Error {
  constructor(message, outputFile) {
    super(outputFile ? `${message} (${outputFile})` : message)
    this.name = "ThemeValidationError"
    this.outputFile = outputFile
  }
}

/**
 * 检测未使用的原始令牌（未被任何语义层引用的 primitives）
 */
export function detectUnusedPrimitives(primitives, semanticsList) {
  // 收集所有语义层中引用的原始值
  const referencedKeys = new Set()
  const collectRefs = (obj) => {
    if (typeof obj === "string") {
      const refs = obj.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g) || []
      refs.forEach((ref) => referencedKeys.add(ref.slice(1, -1)))
    } else if (Array.isArray(obj)) {
      obj.forEach(collectRefs)
    } else if (obj && typeof obj === "object") {
      Object.values(obj).forEach(collectRefs)
    }
  }
  semanticsList.forEach(collectRefs)

  // 找出未被引用的原始值
  const unused = []
  for (const [key, val] of Object.entries(primitives)) {
    if (!referencedKeys.has(key)) {
      unused.push({ key, val })
    }
  }

  if (unused.length > 0) {
    console.warn("\n⚠️  以下原始令牌未被任何语义层引用（可考虑删除或补充语义引用）:")
    unused.forEach(({ key, val }) => {
      console.warn(`   ⚠️  ${key}: "${val}"`)
    })
  } else {
    console.log("   ✅ 所有原始令牌均被语义层引用")
  }

  return unused
}

/**
 * 验证生成的主题 JSON 结构完整性
 */
export function validateThemeStructure(theme, outputFile) {
  const errors = []
  const requiredKeys = ["name", "type", "colors", "tokenColors", "semanticTokenColors"]

  // 1. 必须包含所有顶层 key
  for (const key of requiredKeys) {
    if (!(key in theme)) {
      errors.push(`缺少必需 key: "${key}"`)
    }
  }

  // 2. colors 必须是非空对象
  if (theme.colors && typeof theme.colors === "object") {
    if (Object.keys(theme.colors).length === 0) {
      errors.push('"colors" 不能为空对象')
    }
    // 3. 所有 colors 值必须是合法颜色格式
    for (const [k, v] of Object.entries(theme.colors)) {
      if (typeof v !== "string" || !/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) {
        errors.push(`"colors.${k}" 不是合法颜色: "${v}"`)
      }
    }
  }

  // 4. tokenColors 必须是数组
  if (theme.tokenColors !== undefined && !Array.isArray(theme.tokenColors)) {
    errors.push('"tokenColors" 必须是数组')
  }

  // 5. semanticTokenColors 必须是对象
  if (theme.semanticTokenColors !== undefined && typeof theme.semanticTokenColors !== "object") {
    errors.push('"semanticTokenColors" 必须是对象')
  }

  // 6. 检查是否有未解析的 ${var} 或 {token} 残留
  const jsonStr = JSON.stringify(theme)
  const unresolvedVars = jsonStr.match(/\$\{([a-zA-Z0-9_-]+)\}/g)
  if (unresolvedVars) {
    errors.push(`存在未解析的变量引用: ${[...new Set(unresolvedVars)].join(", ")}`)
  }
  const unresolvedTokens = jsonStr.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g)
  if (unresolvedTokens) {
    errors.push(`存在未解析的令牌引用: ${[...new Set(unresolvedTokens)].join(", ")}`)
  }

  if (errors.length > 0) {
    const message = `❌ 结构验证失败:\n${errors.map((err) => `   ❌ ${err}`).join("\n")}`
    throw new ThemeValidationError(message, outputFile)
  }
  console.log(`   ✅ 结构验证通过: ${outputFile}`)
}

/**
 * WCAG 对比度校验
 */
export function checkContrast(color1, color2, role, themeType) {
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
      throw new Error(
        `❌ 对比度不足: ${themeType} · ${role} (${color1}) vs 背景 (${color2}) = ${ratio.toFixed(2)}:1\n` +
        `   WCAG 要求 ≥${minRatio}:1，当前值低于标准`,
      )
    }
  } else {
    console.log(`✅ ${themeType} · ${role}: ${ratio.toFixed(2)}:1`)
  }
}
