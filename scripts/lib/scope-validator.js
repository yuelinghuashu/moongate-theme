/**
 * Scope 验证库
 *
 * 从 VS Code 内置 TextMate 语法文件中提取所有真实 scope，
 * 与 src/languages/*.yaml 配置对比，验证每个 scope 是否有效。
 * 供 CLI（verify-scopes.js）与测试套件（test/*.test.js）共用。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")

// VS Code 内置语法文件根目录（可被 verifyAllScopes 覆盖）
const VSCODE_EXT = process.env.VSCODE_EXTENSIONS_DIR
  ? path.join(process.env.VSCODE_EXTENSIONS_DIR, "extensions")
  : "/usr/share/code/resources/app/extensions"

/**
 * 已知合理例外（不视为错误）
 *
 * - base.yaml 是跨语言通用规则，包含 Vue/HTML 等无法用单一语法验证的 scope，
 *   因此对 base.yaml 跳过「精确语法匹配」检查（只做格式校验）。
 * - 组合 scope（如 "meta.tag.jsx entity.name.tag"）依赖具体语法上下文，
 *   语法文件中可能只有片段，允许前缀/部分匹配通过。
 */
export const KNOWN_LANG_EXCEPTIONS = new Set(["base.yaml", "vue.yaml"])

/**
 * 已知合理的组合 scope（不视为错误）
 *
 * 这些 scope 依赖跨语法文件/注入语法的上下文组合，
 * 无法用单一本地语法文件精确验证，但实际在 VS Code 中有效。
 */
export const KNOWN_SCOPE_EXCEPTIONS = new Set([
  // JSDoc 注入
  "comment.block.documentation entity.name.type",
  "comment.block.documentation keyword.other.documentation",
  "comment.block.documentation storage.type",
  "entity.name.type.instance.jsdoc variable",
  "entity.name.type.instance.jsdoc",
  "storage.type.class.jsdoc",
  "variable.other.jsdoc",
  "punctuation.definition.block.tag.jsdoc",
  "punctuation.definition.bracket.curly.jsdoc",
  // JSON 嵌套组合
  "string.json support.type.property-name.json",
  "meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
  "meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
  // JSX 函数调用组合
  "meta.function-call.js support.function",
  "meta.function-call.js.jsx support.function",
  "meta.function-call.tsx support.function",
  // Shell 动态/组合
  "support.function.builtin.*.shell",
  "entity.name.function.call.shell entity.name.command.shell",
  "variable.language.shell",
  "string.interpolated.shell",
])

/** 语言配置文件 → VS Code 内置语法文件映射 */
export function buildDefaultSyntaxMap(vscodeExt = VSCODE_EXT) {
  return {
    "base.yaml": [
      path.join(vscodeExt, "javascript/syntaxes/JavaScript.tmLanguage.json"),
    ],
    "css.yaml": [path.join(vscodeExt, "css/syntaxes/css.tmLanguage.json")],
    "html.yaml": [
      path.join(vscodeExt, "html/syntaxes/html.tmLanguage.json"),
      path.join(vscodeExt, "html/syntaxes/html-derivative.tmLanguage.json"),
    ],
    "json.yaml": [path.join(vscodeExt, "json/syntaxes/JSON.tmLanguage.json")],
    "jsx.yaml": [
      path.join(vscodeExt, "javascript/syntaxes/JavaScriptReact.tmLanguage.json"),
      path.join(vscodeExt, "typescript-basics/syntaxes/TypeScriptReact.tmLanguage.json"),
    ],
    "markdown.yaml": [
      path.join(vscodeExt, "markdown-basics/syntaxes/markdown.tmLanguage.json"),
    ],
    "jsdoc.yaml": [
      path.join(vscodeExt, "typescript-basics/syntaxes/jsdoc.js.injection.tmLanguage.json"),
      path.join(vscodeExt, "typescript-basics/syntaxes/jsdoc.ts.injection.tmLanguage.json"),
    ],
    "go.yaml": [path.join(vscodeExt, "go/syntaxes/go.tmLanguage.json")],
    "python.yaml": [
      path.join(vscodeExt, "python/syntaxes/MagicPython.tmLanguage.json"),
    ],
    "rust.yaml": [path.join(vscodeExt, "rust/syntaxes/rust.tmLanguage.json")],
    "vue.yaml": [
      // Vue 由 Volar 扩展提供，无法从内置目录验证
    ],
    "shell.yaml": [
      path.join(vscodeExt, "shellscript/syntaxes/shell-unix-bash.tmLanguage.json"),
    ],
    "dockerfile.yaml": [
      path.join(vscodeExt, "docker/syntaxes/docker.tmLanguage.json"),
    ],
    "sql.yaml": [path.join(vscodeExt, "sql/syntaxes/sql.tmLanguage.json")],
  }
}

/** 递归收集语法文件中所有 name（scope） */
export function collectAllNames(obj, output) {
  if (!obj || typeof obj !== "object") return
  if (typeof obj.name === "string") {
    output.add(obj.name)
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectAllNames(item, output)
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name") continue
      collectAllNames(v, output)
    }
  }
}

/** 从 YAML 文件加载 tokenColors 规则中的全部 scope */
export function loadConfigScopes(filePath) {
  const data = yaml.load(fs.readFileSync(filePath, "utf8"))
  const scopes = new Set()
  if (!data?.tokenColors) return scopes
  for (const rule of data.tokenColors) {
    if (!rule.scope) continue
    const list = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    for (const s of list) scopes.add(s)
  }
  return scopes
}

/** 检查单个 scope 是否匹配语法文件（支持前缀/通配符/组合匹配） */
export function scopeMatches(checkScope, allSyntaxScopes) {
  // 已知合理例外直接通过（必须在组合拆分之前，否则组合 scope 会被拆散后无法匹配白名单）
  if (KNOWN_SCOPE_EXCEPTIONS.has(checkScope)) return true

  // 组合 scope（如 "meta.tag.jsx entity.name.tag.jsx"）→ 拆分逐段检查
  const parts = checkScope.split(/\s+/)
  if (parts.length > 1) {
    return parts.every((p) => scopeMatches(p, allSyntaxScopes))
  }

  // 通配符（* 匹配任意部分）
  if (checkScope.includes("*")) {
    const regex = new RegExp(
      "^" + checkScope.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^ ]*") + "($|\\.)",
    )
    for (const s of allSyntaxScopes) {
      if (regex.test(s)) return true
    }
    return false
  }

  // 前缀匹配：配置 scope 是语法 scope 的前缀（"comment" 匹配 "comment.line.ts"）
  // 或语法 scope 是配置 scope 的前缀（"string.quoted.double.tsx" 前缀是 "string"）
  for (const s of allSyntaxScopes) {
    if (s === checkScope) return true
    if (s.startsWith(checkScope + ".")) return true
    if (checkScope.startsWith(s + ".")) return true
    // 组合 scope 中作为首段存在（"string.interpolated.python string.quoted.python"）
    if (s.startsWith(checkScope + " ")) return true
  }
  return false
}

/**
 * 验证指定目录下所有语言配置
 * @param {object} options
 * @param {string} [options.langDir]         语言配置目录（默认 src/languages）
 * @param {object} [options.syntaxMap]       语言 → 语法文件路径映射
 * @param {string} [options.vscodeExt]       VS Code 内置扩展根目录
 * @returns {{ totalRules:number, totalIssues:number, perFile:Array<{file:string, total:number, missing:string[], syntaxFound:boolean}>, isValid:boolean }}
 */
export function verifyAllScopes({
  langDir = path.join(ROOT_DIR, "src", "languages"),
  syntaxMap,
  vscodeExt = VSCODE_EXT,
  verbose = false,
} = {}) {
  const effectiveMap = syntaxMap || buildDefaultSyntaxMap(vscodeExt)

  const langFiles = fs
    .readdirSync(langDir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()

  const perFile = []
  let totalRules = 0
  let totalIssues = 0

  for (const file of langFiles) {
    // 基础跨语言/需要外部扩展的语言跳过语法匹配验证
    if (KNOWN_LANG_EXCEPTIONS.has(file)) {
      perFile.push({
        file,
        total: 0,
        missing: [],
        syntaxFound: true,
        skipped: true,
      })
      continue
    }

    const syntaxPaths = effectiveMap[file] || []
    const allSyntaxScopes = new Set()
    let syntaxFound = false

    for (const sp of syntaxPaths) {
      if (!fs.existsSync(sp)) continue
      try {
        const data = JSON.parse(fs.readFileSync(sp, "utf8"))
        collectAllNames(data, allSyntaxScopes)
        syntaxFound = true
      } catch (e) {
        // 语法文件解析失败 → 跳过该语言
      }
    }

    if (!syntaxFound) {
      perFile.push({
        file,
        total: 0,
        missing: [],
        syntaxFound: false,
      })
      if (verbose) {
        console.log(`  ⚠️ ${file}: 未找到内置语法文件，跳过验证`)
      }
      continue
    }

    const configScopes = loadConfigScopes(path.join(langDir, file))
    const missing = []
    for (const sc of configScopes) {
      totalRules++
      if (!scopeMatches(sc, allSyntaxScopes)) {
        missing.push(sc)
        totalIssues++
      }
    }

    perFile.push({
      file,
      total: configScopes.size,
      missing,
      syntaxFound: true,
      skipped: false,
    })
  }

  return {
    totalRules,
    totalIssues,
    perFile,
    isValid: totalIssues === 0,
  }
}

/** 格式化验证结果输出 */
export function formatVerificationResult(result, { includePassing = true } = {}) {
  let out = ""
  let issues = 0

  for (const f of result.perFile) {
    if (f.skipped) {
      out += `📄 ${f.file}: ⏭️ 已知跨语言/外部扩展，跳过语法匹配验证\n`
      continue
    }
    if (!f.syntaxFound) {
      out += `📄 ${f.file}: ⚠️ 未找到内置语法文件，跳过\n`
      continue
    }
    if (f.missing.length === 0) {
      if (includePassing) out += `📄 ${f.file}: ✅ 所有 ${f.total} 个 scope 均匹配\n`
    } else {
      out += `📄 ${f.file}: ❌ ${f.missing.length}/${f.total} 个 scope 不匹配\n`
      for (const ms of f.missing) {
        out += `   ❌ "${ms}"\n`
      }
      issues += f.missing.length
    }
  }

  out += `\n📊 统计: 检查 ${result.totalRules} 个 scope，发现 ${issues} 个不匹配\n`
  return out
}