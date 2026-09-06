import fs from "node:fs"
import path from "node:path"
import wcag from "wcag-contrast"
import { PATHS } from "./config.js"

/**
 * 生成颜色 CSS 变量文件
 */
export function generateColorCss(lightColors, darkColors) {
  let css = `/* ===== Moongate 颜色令牌 - 自动生成 ===== */\n`
  css += `/* 来源: VS Code 主题构建脚本 */\n`
  css += `/* 请勿手动修改，修改请编辑 primitives/ 和 semantics/ 目录 */\n\n`

  css += `/* 浅色模式 */\n:root,\n.light {\n`
  Object.entries(lightColors).forEach(([key, val]) => {
    const cssKey = toCssKey(key)
    css += `  --ui-${cssKey}: ${val};\n`
  })
  css += `}\n\n`

  css += `/* 深色模式 */\n.dark {\n`
  Object.entries(darkColors).forEach(([key, val]) => {
    const cssKey = toCssKey(key)
    css += `  --ui-${cssKey}: ${val};\n`
  })
  css += `}\n`

  const cssPath = path.join(PATHS.outputDir, "moongate-colors.css")
  fs.writeFileSync(cssPath, css)
  console.log(`✅ 颜色令牌已生成: ${cssPath}`)
}

/**
 * 生成布局 CSS 变量文件
 */
export function generateLayoutCss(layoutTokens) {
  let css = `/* ===== Moongate 布局令牌 - 自动生成 ===== */\n`
  css += `/* 包含：间距、圆角、阴影、排版、响应式断点、Z-Index */\n`
  css += `/* 请勿手动修改，修改请编辑 src/core/layout.yaml */\n\n`

  css += `:root {\n`

  function flattenObject(obj, prefix = "") {
    Object.entries(obj).forEach(([key, val]) => {
      const fullKey = prefix ? `${prefix}-${key}` : key
      if (val && typeof val === "object" && !Array.isArray(val)) {
        flattenObject(val, fullKey)
      } else {
        let formattedVal = val
        if (typeof formattedVal === "string") {
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
 * 生成设计系统文档
 */
export function generateDesignSystemDoc(primitives, lightColors, darkColors) {
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
    '\n> **核心原则**：所有颜色必须经过"原始值 → 语义层 → 组件层"的传递链条，任何跨层直接引用都是**架构污染**。\n',
  )

  md.push("## 🎨 原始色值\n")

  // 动态从原始值中提取色系分组
  const colorGroups = {}
  const specialKeys = ["white", "black"]
  for (const key of Object.keys(primitives)) {
    const group = key.split("-")[0]
    if (specialKeys.includes(key)) {
      if (!colorGroups.special) colorGroups.special = []
      colorGroups.special.push(key)
    } else {
      if (!colorGroups[group]) colorGroups[group] = []
      colorGroups[group].push(key)
    }
  }

  for (const [group, keys] of Object.entries(colorGroups)) {
    if (keys.length === 0) continue
    const groupLabel = group === "special" ? "纯色" : `${group.charAt(0).toUpperCase() + group.slice(1)} 色系`
    md.push(`### ${groupLabel}\n`)
    md.push("| 令牌 | 色值 | 预览 |")
    md.push("|------|------|------|")
    for (const key of keys) {
      if (!primitives[key]) continue
      const val = primitives[key]
      if (!val.startsWith("#")) continue
      const preview = `![](https://placehold.co/20x20/${val.slice(1)}/${val.slice(1)}?text=+)`
      md.push(`| \`--moongate-${key}\` | \`${val}\` | ${preview} |`)
    }
    md.push("")
  }

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

  const contrast = (color1, color2) => {
    if (!color1 || !color2) return null
    try {
      return wcag.hex(color1, color2).toFixed(2)
    } catch {
      return null
    }
  }

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

/**
 * 将驼峰键转换为 SCSS 变量名（如 surfaceGround → surface-ground）
 */
function toCssKey(key) {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase()
}

/**
 * 生成 SCSS 令牌文件（Sass 变量 + Maps）
 */
export function generateScssTokens(lightColors, darkColors, layoutTokens = {}) {
  let scss = `// ===== Moongate SCSS 令牌 - 自动生成 =====\n`
  scss += `// 来源: VS Code 主题构建脚本\n`
  scss += `// 请勿手动修改，修改请编辑 primitives/ 和 semantics/ 目录\n\n`

  // 布局令牌（间距）——优先使用传入的 layoutTokens
  const layoutSpacing = layoutTokens?.spacing || {}

  scss += `// 布局令牌\n`
  scss += `$ui-spacing: (\n`
  for (const [key, val] of Object.entries(layoutSpacing)) {
    scss += `  ${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${typeof val === "string" && !val.startsWith("#") ? `"${val}"` : val};\n`
  }
  scss += `);\n\n`

  // 深色模式颜色
  scss += `// 深色模式颜色\n`
  scss += `$ui-colors-dark: (\n`
  for (const [key, val] of Object.entries(darkColors)) {
    scss += `  ${toCssKey(key)}: ${val};\n`
  }
  scss += `);\n\n`

  // 浅色模式颜色
  scss += `// 浅色模式颜色\n`
  scss += `$ui-colors-light: (\n`
  for (const [key, val] of Object.entries(lightColors)) {
    scss += `  ${toCssKey(key)}: ${val};\n`
  }
  scss += `);\n\n`

  // 便捷变量（直接可用的语义色，深色）
  scss += `// 深色模式便捷变量\n`
  for (const [key, val] of Object.entries(darkColors)) {
    scss += `$ui-${toCssKey(key)}: ${val};\n`
  }

  const scssPath = path.join(PATHS.outputDir, "_tokens.scss")
  fs.writeFileSync(scssPath, scss)
  console.log(`✅ SCSS 令牌已生成: ${scssPath}`)
}

/**
 * 生成 TypeScript 令牌文件（结构化导出）
 */
export function generateTsTokens(lightColors, darkColors) {
  let ts = `// ===== Moongate TS 令牌 - 自动生成 =====\n`
  ts += `// 来源: VS Code 主题构建脚本\n`
  ts += `// 请勿手动修改，修改请编辑 primitives/ 和 semantics/ 目录\n\n`

  ts += `export interface MoongateTokens {\n`
  ts += `  dark: Record<string, string>;\n`
  ts += `  light: Record<string, string>;\n`
  ts += `}\n\n`

  ts += `export const tokens: MoongateTokens = {\n`
  ts += `  dark: {\n`
  for (const [key, val] of Object.entries(darkColors)) {
    ts += `    "${key}": "${val}",\n`
  }
  ts += `  },\n`
  ts += `  light: {\n`
  for (const [key, val] of Object.entries(lightColors)) {
    ts += `    "${key}": "${val}",\n`
  }
  ts += `  },\n`
  ts += `}\n\n`

  ts += `export default tokens\n`

  const tsPath = path.join(PATHS.outputDir, "tokens.ts")
  fs.writeFileSync(tsPath, ts)
  console.log(`✅ TS 令牌已生成: ${tsPath}`)
}
