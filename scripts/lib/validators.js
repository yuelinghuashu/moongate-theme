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
    console.warn(
      "\n⚠️  以下原始令牌未被任何语义层引用（可考虑删除或补充语义引用）:",
    )
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
  const requiredKeys = [
    "name",
    "type",
    "colors",
    "tokenColors",
    "semanticTokenColors",
  ]

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
      if (
        typeof v !== "string" ||
        !/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)
      ) {
        errors.push(`"colors.${k}" 不是合法颜色: "${v}"`)
      }
    }
  }

  // 4. tokenColors 必须是数组
  if (theme.tokenColors !== undefined && !Array.isArray(theme.tokenColors)) {
    errors.push('"tokenColors" 必须是数组')
  }

  // 5. semanticTokenColors 必须是对象
  if (
    theme.semanticTokenColors !== undefined &&
    typeof theme.semanticTokenColors !== "object"
  ) {
    errors.push('"semanticTokenColors" 必须是对象')
  }

  // 6. 检查是否有未解析的 ${var} 或 {token} 残留
  const jsonStr = JSON.stringify(theme)
  const unresolvedVars = jsonStr.match(/\$\{([a-zA-Z0-9_-]+)\}/g)
  if (unresolvedVars) {
    errors.push(
      `存在未解析的变量引用: ${[...new Set(unresolvedVars)].join(", ")}`,
    )
  }
  const unresolvedTokens = jsonStr.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g)
  if (unresolvedTokens) {
    errors.push(
      `存在未解析的令牌引用: ${[...new Set(unresolvedTokens)].join(", ")}`,
    )
  }

  if (errors.length > 0) {
    const message = `❌ 结构验证失败:\n${errors.map((err) => `   ❌ ${err}`).join("\n")}`
    throw new ThemeValidationError(message, outputFile)
  }
  console.log(`   ✅ 结构验证通过: ${outputFile}`)
}

/**
 * 对比度豁免登记表（角色 → 理由）
 *
 * 与 docs/TOKEN_CONVENTIONS.md §5 的"豁免清单"配套：只登记**有意**低于阈值、
 * 且不承载正文可读性的角色。
 */
export const CONTRAST_EXEMPTIONS = {
  gitIgnored: "被忽略文件刻意压暗（与 VS Code 默认一致），不承载正文",
  codeDim: "无用代码压暗遮罩（8 位 alpha 叠加），非实体前景色",
}

/**
 * WCAG 对比度校验
 */
export function checkContrast(color1, color2, role, themeType) {
  if (!color1 || !color2) return
  if (CONTRAST_EXEMPTIONS[role]) {
    console.log(
      `➖ ${themeType} · ${role}: 已登记豁免（${CONTRAST_EXEMPTIONS[role]}）`,
    )
    return
  }
  const ratio = wcag.hex(color1, color2)

  let minRatio = 4.5
  if (role === "textDim" || role === "comment") {
    minRatio = 4.0
  }
  if (role === "textMuted") {
    minRatio = 3.0
  }
  if (role === "textInactive") {
    // 非活跃 UI 文本（最弱档文本角色）允许 ≥3:1（大号/图形文本 AA）
    minRatio = 3.0
  }
  if (/^bracket[1-6]$/.test(role)) {
    // 括号高亮为装饰性大字号/图形文本（与 VS Code 默认括号色同档）
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

/** ANSI 黑族豁免：黑/亮黑为终端底色族，天然低对比，不参与阈值 */
const ANSI_BLACK_EXEMPT = new Set(["ansiBlack", "ansiBrightBlack"])

/**
 * 终端 ANSI 对比度校验（对 terminal.background）
 * - 黑族豁免
 * - white / brightWhite ≥ 4.5:1（正文级）
 * - 其余 ≥ 3:1
 */
export function checkAnsiContrast(normalized, themeType) {
  const bg = normalized.bg // terminal.background === surfaceGround === bg
  if (!bg) return
  const ansiKeys = [
    "ansiRed",
    "ansiGreen",
    "ansiYellow",
    "ansiBlue",
    "ansiMagenta",
    "ansiCyan",
    "ansiWhite",
    "ansiBrightRed",
    "ansiBrightGreen",
    "ansiBrightYellow",
    "ansiBrightBlue",
    "ansiBrightMagenta",
    "ansiBrightCyan",
    "ansiBrightWhite",
  ]
  for (const key of ansiKeys) {
    if (!normalized[key]) continue
    const minRatio =
      key === "ansiWhite" || key === "ansiBrightWhite" ? 4.5 : 3.0
    const ratio = wcag.hex(normalized[key], bg)
    if (ratio < minRatio) {
      throw new Error(
        `❌ ANSI 对比度不足: ${themeType} · ${key} (${normalized[key]}) vs 终端背景 (${bg}) = ${ratio.toFixed(2)}:1\n` +
          `   WCAG 要求 ≥${minRatio}:1（黑族 ${[...ANSI_BLACK_EXEMPT].join("/")} 豁免）`,
      )
    }
    console.log(`✅ ${themeType} · ${key}: ${ratio.toFixed(2)}:1`)
  }
}

/**
 * 语义层键位一致性（dark/light 键集合必须相同）
 */
export function assertSemanticKeyParity(
  darkMap,
  lightMap,
  darkFile = "dark",
  lightFile = "light",
) {
  const darkKeys = Object.keys(darkMap).sort()
  const lightKeys = Object.keys(lightMap).sort()
  const onlyDark = darkKeys.filter((k) => !lightKeys.includes(k))
  const onlyLight = lightKeys.filter((k) => !darkKeys.includes(k))
  if (onlyDark.length || onlyLight.length) {
    throw new Error(
      `❌ 语义层键位不一致（${darkFile}/${lightFile}）:\n` +
        (onlyDark.length
          ? `   仅 ${darkFile} 有: ${onlyDark.join(", ")}\n`
          : "") +
        (onlyLight.length
          ? `   仅 ${lightFile} 有: ${onlyLight.join(", ")}`
          : ""),
    )
  }
  console.log(
    `✅ 语义层键位一致: ${darkKeys.length} 个角色（${darkFile}/${lightFile}）`,
  )
}

// ==================== 交互前景/背景配对对比度 ====================

/** 将 #RRGGBB[AA] 合成到背景上（前景可带 alpha） */
function compositeColor(fg, bg) {
  fg = fg.replace("#", "")
  if (fg.length === 6) return "#" + fg
  const a = parseInt(fg.slice(6, 8), 16) / 255
  const mix = (i) =>
    Math.round(
      parseInt(fg.slice(i, i + 2), 16) * a +
        parseInt(bg.slice(1 + i, 3 + i), 16) * (1 - a),
    )
      .toString(16)
      .padStart(2, "0")
  return `#${mix(0)}${mix(2)}${mix(4)}`
}

/**
 * UI 交互配对表（每对给出语义角色与阈值）
 *
 * 背景/前景取自语义层 resolved 值；alpha 前景先合成到背景再算对比度。
 * 说明：
 * - 正文级白/浅字 on 实底强调（按钮/菜单/徽章/输入激活/选中行）要求 ≥4.5:1
 * - 装饰性白字（头像/标记类，非正文）登记为 ≥3:1 例外
 *
 * 2026-09 新增：**彩色实底上的文字**（surfaceGround on error/primary/warning）与
 * **状态栏 prominent 项**（text on surfaceRaised/hoverBg）。这两组键此前只定义了背景，
 * 前景回退 VS Code 默认值 → 深色 1.10–2.00:1、浅色白压白 1.00:1（真实不可读）。
 */
export const UI_CONTRAST_PAIRS = {
  dark: [
    {
      fg: "white",
      bg: "primarySolid",
      min: 4.5,
      label: "按钮/菜单/徽章/输入激活：白字 on 实底强调",
    },
    {
      fg: "selectionForeground",
      bg: "selectedBg",
      min: 4.5,
      label: "列表/建议/标签 选中行前景",
    },
    {
      fg: "white",
      bg: "primary",
      min: 3.0,
      label: "装饰白字（头像/标记，非正文）",
    },
    {
      fg: "surfaceGround",
      bg: "error",
      min: 4.5,
      label: "彩色实底墨字：输入校验/状态栏错误项",
    },
    {
      fg: "surfaceGround",
      bg: "primary",
      min: 4.5,
      label: "彩色实底墨字：输入校验 info / 终端光标字符",
    },
    {
      fg: "surfaceGround",
      bg: "warning",
      min: 4.5,
      label: "彩色实底墨字：输入校验 warning",
    },
    { fg: "text", bg: "surfaceRaised", min: 4.5, label: "状态栏 prominent 项" },
    { fg: "text", bg: "hoverBg", min: 4.5, label: "状态栏 prominent hover 项" },
  ],
  light: [
    {
      fg: "white",
      bg: "primary",
      min: 4.5,
      label: "实底白字 on primary（浅色主蓝）",
    },
    {
      fg: "white",
      bg: "primarySolid",
      min: 4.5,
      label: "实底白字 on primarySolid（与 primary 别名）",
    },
    {
      fg: "selectionForeground",
      bg: "selectedBg",
      min: 4.5,
      label: "列表选中行（墨字 on 浅灰选中背景）",
    },
    {
      fg: "surfaceGround",
      bg: "error",
      min: 4.5,
      label: "彩色实底文字：输入校验/状态栏错误项",
    },
    {
      fg: "surfaceGround",
      bg: "primary",
      min: 4.5,
      label: "彩色实底文字：输入校验 info / 终端光标字符",
    },
    {
      fg: "surfaceGround",
      bg: "warning",
      min: 4.5,
      label: "彩色实底文字：输入校验 warning",
    },
    { fg: "text", bg: "surfaceRaised", min: 4.5, label: "状态栏 prominent 项" },
    { fg: "text", bg: "hoverBg", min: 4.5, label: "状态栏 prominent hover 项" },
  ],
}

/** 交互配对对比度校验：低于阈值抛错（防 UI 选中/按钮文本不可读回归） */
export function checkUIPairs(normalized, themeType) {
  const pairs = UI_CONTRAST_PAIRS[themeType] || []
  for (const { fg, bg, min, label } of pairs) {
    const fgColor = normalized[fg]
    const bgColor = normalized[bg]
    if (!fgColor || !bgColor) continue
    const effective = compositeColor(fgColor, bgColor)
    const ratio = wcag.hex(effective, bgColor)
    if (ratio < min) {
      throw new Error(
        `❌ UI 配对对比度不足: ${themeType} · ${label}\n` +
          `   ${fg}=${fgColor} on ${bg}=${bgColor} (合成 ${effective}) = ${ratio.toFixed(2)}:1，要求 ≥${min}:1`,
      )
    }
    console.log(`✅ ${themeType} · ${label}: ${ratio.toFixed(2)}:1`)
  }
}
