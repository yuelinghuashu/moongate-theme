const fs = require("fs")
const yaml = require("js-yaml")
const path = require("path")

// 基于脚本所在目录（scripts）向上定位项目根目录
const ROOT_DIR = path.resolve(__dirname, "..")

// 配置路径
const COLOR_FILE = path.join(ROOT_DIR, "src", "core", "colors.yaml")
const WORKBENCH_FILE = path.join(ROOT_DIR, "src", "workbench.yaml")
const SEMANTIC_FILE = path.join(ROOT_DIR, "src", "semantic.yaml")
const LANG_DIR = path.join(ROOT_DIR, "src", "languages")
const SPECIAL_DIR = path.join(ROOT_DIR, "src", "special")
const OUTPUT_FILE = path.join(ROOT_DIR, "themes", "moongate-dark.json")

// 1. 加载颜色变量
const colors = yaml.load(fs.readFileSync(COLOR_FILE, "utf8"))

// 2. 递归替换颜色变量（支持透明度后缀）
function replaceVariables(obj) {
  if (typeof obj === "string") {
    return obj.replace(/\$\{(\w+)\}([0-9a-fA-F]{2})?/g, (match, key, alpha) => {
      if (colors[key] !== undefined) {
        return colors[key] + (alpha || "")
      }
      console.warn(`警告: 变量 "${key}" 未定义，保留原样`)
      return match
    })
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceVariables)
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = replaceVariables(v)
    }
    return result
  }
  return obj
}

// 3. 加载并替换 UI 颜色
const workbench = yaml.load(fs.readFileSync(WORKBENCH_FILE, "utf8"))
const uiColors = replaceVariables(workbench)

// 4. 加载并替换语义高亮规则
const semantic = yaml.load(fs.readFileSync(SEMANTIC_FILE, "utf8"))
const semanticColors = replaceVariables(semantic)

// 5. 收集语言规则（按指定顺序合并）
const order = [
  "base.yaml",
  "html.yaml",
  "css.yaml",
  "javascript.yaml",
  "typescript.yaml",
  "vue.yaml",
  "json.yaml",
  "markdown.yaml",
  "python.yaml",
  "jsdoc.yaml",
]

let tokenColors = []
order.forEach((file) => {
  const filePath = path.join(LANG_DIR, file)
  if (fs.existsSync(filePath)) {
    try {
      const langRules = yaml.load(fs.readFileSync(filePath, "utf8"))
      // 确保 langRules 存在且是对象，并且有 tokenColors 属性
      if (
        langRules &&
        typeof langRules === "object" &&
        Array.isArray(langRules.tokenColors)
      ) {
        tokenColors = tokenColors.concat(langRules.tokenColors)
      } else {
        console.warn(`警告: 文件 ${file} 缺少 tokenColors 数组，跳过`)
      }
    } catch (err) {
      console.error(`错误: 解析文件 ${file} 失败:`, err.message)
    }
  } else {
    console.warn(`警告: 语言文件 ${file} 不存在，跳过`)
  }
})

// 加载 special 目录下的特殊注释规则（better-comments.yaml）
const specialFile = path.join(SPECIAL_DIR, "better-comments.yaml") // 注意文件名
if (fs.existsSync(specialFile)) {
  try {
    const specialRules = yaml.load(fs.readFileSync(specialFile, "utf8"))
    if (
      specialRules &&
      typeof specialRules === "object" &&
      Array.isArray(specialRules.tokenColors)
    ) {
      tokenColors = tokenColors.concat(specialRules.tokenColors)
      console.log("✅ 已加载特殊注释规则")
    } else {
      console.warn("警告: better-comments.yaml 缺少 tokenColors 数组，跳过")
    }
  } catch (err) {
    console.error("错误: 解析 better-comments.yaml 失败:", err.message)
  }
} else {
  console.warn("警告: 特殊注释文件 better-comments.yaml 不存在，跳过")
}

// 6. 对 tokenColors 进行变量替换
const processedTokenColors = replaceVariables(tokenColors)

// 7. 确保 themes 目录存在
const outputDir = path.dirname(OUTPUT_FILE)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 8. 构建最终主题对象
const newTheme = {
  name: "Moongate Dark",
  type: "dark",
  colors: uiColors,
  tokenColors: processedTokenColors,
  semanticTokenColors: semanticColors,
}

// 9. 输出 JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newTheme, null, 2))
console.log("✅ 主题构建完成！")
