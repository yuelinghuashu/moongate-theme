import fs from "node:fs"
/**
 * 测试辅助函数
 */

/**
 * 静默捕获 console 输出，执行函数后恢复
 * @param {Function} fn 要执行的函数
 * @returns {{ stdout: string[], stderr: string[] }}
 */
export function captureConsole(fn) {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const stdout = []
  const stderr = []

  console.log = (...args) => stdout.push(args.join(" "))
  console.warn = (...args) => stderr.push(args.join(" "))
  console.error = (...args) => stderr.push(args.join(" "))

  try {
    fn()
  } finally {
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
  }

  return { stdout, stderr }
}

/**
 * 断言函数抛出匹配指定模式的错误
 * @param {Function} fn 要执行的函数
 * @param {RegExp|string} pattern 错误消息匹配模式
 */
export function assertThrows(fn, pattern) {
  let threw = null
  try {
    fn()
  } catch (err) {
    threw = err
  }
  if (!threw) {
    throw new Error(`预期函数抛出错误，但没有抛出`)
  }
  if (pattern instanceof RegExp) {
    if (!pattern.test(threw.message)) {
      throw new Error(`错误消息 "${threw.message}" 不匹配模式 ${pattern}`)
    }
  } else if (typeof pattern === "string") {
    if (!threw.message.includes(pattern)) {
      throw new Error(`错误消息 "${threw.message}" 不包含 "${pattern}"`)
    }
  }
  return threw
}

/**
 * 解析 semanticTokenColors 的键（镜像 VS Code 的 TokenSelector 解析）
 *
 * 形式为 `<type>.<modifier>...[:language]`：
 *   "constant.builtin" → { type: "constant", modifiers: ["builtin"] }
 *   "*.deprecated"     → { type: "*", modifiers: ["deprecated"] }
 *   "class.decorator"  → { type: "class", modifiers: ["decorator"] }
 *
 * @param {string} key semanticTokenColors 的键
 * @returns {{type: string, modifiers: string[], language: string|undefined}}
 */
export function parseSemanticSelector(key) {
  const colon = key.indexOf(":")
  const head = colon === -1 ? key : key.slice(0, colon)
  const language = colon === -1 ? undefined : key.slice(colon + 1)
  const [type, ...modifiers] = head.split(".")
  return { type, modifiers, language }
}

/**
 * 展开单条语义样式声明（镜像 VS Code TokenStyle.fromSettings）
 *
 * - 字符串形式 = 仅前景色。
 * - 对象形式的 `fontStyle`（如 "italic"、"bold italic"）存在时，按关键字扫描，
 *   并**同时写入 bold/underline/strikethrough/italic 四个布尔值**（未命中的为 false，
 *   会以同样的分数参与覆盖，这一点与 VS Code 行为一致）。
 *
 * @param {string|object} value semanticTokenColors 的值
 * @returns {object} 参与打分的字段集合
 */
function normalizeStyleDeclaration(value) {
  const decl = typeof value === "string" ? { foreground: value } : value || {}
  const fields = { foreground: decl.foreground }
  if (decl.fontStyle !== undefined) {
    const fontStyle = String(decl.fontStyle)
    fields.bold = /bold/.test(fontStyle)
    fields.italic = /italic/.test(fontStyle)
    fields.underline = /underline/.test(fontStyle)
    fields.strikethrough = /strikethrough/.test(fontStyle)
  } else {
    fields.bold = decl.bold
    fields.italic = decl.italic
    fields.underline = decl.underline
    fields.strikethrough = decl.strikethrough
  }
  return fields
}

/** 参与打分的样式字段 */
const STYLE_FIELDS = ["foreground", "bold", "italic", "underline", "strikethrough"]

/**
 * 复算 VS Code 语义高亮的「最终生效样式」（而非"某个键是否存在"）
 *
 * 镜像 ColorThemeData.getTokenStyle 的判定顺序与打分：
 *   1. score = (100 − 选择器类型在父类型层级中的下标) + 100 × 选择器修饰符个数；
 *      字面量 "*" 类型不参与类型打分；选择器含 token 没有的修饰符 → 该规则不匹配；
 *      类型不在层级中 → 不匹配。
 *   2. 逐字段取「最高分」；同分时后出现的规则胜出（镜像 `best <= score`）。
 *   3. 没有任何主题规则命中的字段不出现在结果里 —— 此时 VS Code 回退到 TextMate 色。
 *
 * 例：Pylance 的 True/False/None 是 builtinConstant（父类型 constant）+ readonly、builtin
 * 修饰符，故 constant.builtin(99+100=199) > builtinConstant(100) > constant(99)。
 *
 * @param {object} semanticTokenColors 主题的 semanticTokenColors
 * @param {{type: string, modifiers?: string[], hierarchy?: string[], language?: string}} token 待判定的 token
 * @returns {object} 生效样式（仅含被主题规则显式设置的字段）
 */
export function resolveSemanticStyle(
  semanticTokenColors,
  { type, modifiers = [], hierarchy, language = "python" },
) {
  const chain = hierarchy ?? [type]
  const best = Object.fromEntries(STYLE_FIELDS.map((field) => [field, -1]))
  const style = {}

  for (const [key, value] of Object.entries(semanticTokenColors || {})) {
    const selector = parseSemanticSelector(key)
    if (selector.language && selector.language !== language) continue
    if (selector.modifiers.some((m) => !modifiers.includes(m))) continue

    let score = selector.modifiers.length * 100
    if (selector.type !== "*") {
      const index = chain.indexOf(selector.type)
      if (index === -1) continue
      score += 100 - index
    }
    if (selector.language) score += 10 // 语言限定键的额外权重（VS Code 为 +10）

    const decl = normalizeStyleDeclaration(value)
    for (const field of STYLE_FIELDS) {
      if (decl[field] === undefined) continue
      if (best[field] <= score) {
        best[field] = score
        style[field] = decl[field]
      }
    }
  }

  return style
}

/**
 * 复算 TextMate tokenColors 对某个 scope 栈的「最终生效样式」
 *
 * 镜像 VS Code（vscode-textmate）的规则优先级：
 *   1. 从**最内层** scope 往外层找，先命中者胜（内层 scope 优先）；
 *   2. 同一层内，规则 scope 名是 token scope 名的「分隔段前缀」时命中，
 *      **匹配段数最多（最深节点）者胜**；同深度时后出现的规则胜出；
 *   3. 组合 scope（如 "meta.function-call entity.name.function"）要求其父 scope
 *      按顺序出现在更外层，父链不完整则不命中。
 *   4. 无任何规则命中返回 {} —— VS Code 此时回退到编辑器默认前景色。
 *
 * 说明：这是对 vscode-textmate 主题树求值的等价近似（本仓库的 scope 组合写法有限，
 * 已覆盖 base/languages 实际用到的形态）。
 *
 * @param {Array<{scope: string|string[], settings: object}>} tokenColors
 * @param {string[]} scopeStack 由外到内的 scope 栈（如 ["source.python", "string.quoted.double.python"]）
 * @returns {object} 生效样式
 */
export function resolveTextmateStyle(tokenColors, scopeStack) {
  const rules = []
  for (const [index, rule] of (tokenColors || []).entries()) {
    if (!rule?.settings) continue
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    for (const scope of scopes) {
      const parts = String(scope).split(/\s+/)
      rules.push({ index, name: parts[parts.length - 1].split("."), parents: parts.slice(0, -1), settings: rule.settings })
    }
  }

  const parentsPresent = (parents, outerScopes) => {
    let cursor = 0
    for (const parent of parents) {
      const segments = parent.split(".")
      let found = false
      while (cursor < outerScopes.length) {
        const candidate = outerScopes[cursor].split(".")
        cursor += 1
        if (candidate.length >= segments.length && segments.every((s, i) => candidate[i] === s)) {
          found = true
          break
        }
      }
      if (!found) return false
    }
    return true
  }

  for (let i = scopeStack.length - 1; i >= 0; i--) {
    const segments = scopeStack[i].split(".")
    const candidates = []
    for (const rule of rules) {
      if (rule.name.length > segments.length) continue
      if (!rule.name.every((s, k) => segments[k] === s)) continue
      if (rule.parents.length && !parentsPresent(rule.parents, scopeStack.slice(0, i))) continue
      candidates.push(rule)
    }
    if (candidates.length) {
      candidates.sort((a, b) => a.name.length - b.name.length || a.parents.length - b.parents.length || a.index - b.index)
      return candidates[candidates.length - 1].settings
    }
  }

  return {}
}

/**
 * 断言函数不抛出错误（静默执行）
 * @param {Function} fn 要执行的函数
 */
export function assertNoThrow(fn) {
  try {
    fn()
  } catch (err) {
    throw new Error(`预期函数不抛出错误，但抛出了: ${err.message}`)
  }
}
// ==================== 语义 token 注册表（T4：键可达性） ====================

/** VS Code 标准语义 token 类型（编辑器中始终注册） */
const STANDARD_SEMANTIC_TYPES = [
  "namespace", "class", "enum", "interface", "struct", "typeParameter", "type", "parameter",
  "variable", "property", "enumMember", "decorator", "event", "function", "method", "macro",
  "label", "comment", "string", "keyword", "number", "regexp", "operator", "modifier",
]

/** VS Code 标准语义 token 修饰符 */
const STANDARD_SEMANTIC_MODIFIERS = [
  "declaration", "definition", "readonly", "static", "deprecated", "abstract", "async",
  "modification", "documentation", "defaultLibrary",
]

/**
 * 收集已装扩展声明的语义 token 类型（含 superType 层级）与修饰符
 *
 * 类型层级必须算进去：主题键 `constant` / `constant.builtin` 正是靠
 * `builtinConstant` 的 superType 链命中的（上一轮 True/False/None 修复依赖此机制）。
 *
 * @param {string} [extensionsDir]
 * @returns {{ types: Set<string>, modifiers: Set<string>, hierarchy: Map<string, string[]> }}
 */
export function loadSemanticRegistry(extensionsDir = process.env.VSCODE_EXTENSIONS_DIR || `${process.env.HOME}/.vscode/extensions`) {
  const types = new Set(STANDARD_SEMANTIC_TYPES)
  const modifiers = new Set(STANDARD_SEMANTIC_MODIFIERS)
  const superTypes = new Map()
  if (fs.existsSync(extensionsDir)) {
    for (const entry of fs.readdirSync(extensionsDir)) {
      const manifest = `${extensionsDir}/${entry}/package.json`
      if (!fs.existsSync(manifest)) continue
      let parsed
      try {
        parsed = JSON.parse(fs.readFileSync(manifest, "utf8"))
      } catch {
        continue
      }
      const contributes = parsed.contributes || {}
      for (const type of contributes.semanticTokenTypes || []) {
        if (!type?.id) continue
        types.add(type.id)
        if (type.superType) superTypes.set(type.id, type.superType)
      }
      for (const modifier of contributes.semanticTokenModifiers || []) {
        if (modifier?.id) modifiers.add(modifier.id)
      }
    }
  }
  // 把 superType 链上的名字也算作已知类型（层级里的名字不必单独注册）
  const hierarchy = new Map()
  for (const type of types) {
    const chain = [type]
    let cursor = superTypes.get(type)
    while (cursor && !chain.includes(cursor)) {
      chain.push(cursor)
      cursor = superTypes.get(cursor)
    }
    hierarchy.set(type, chain)
  }
  return { types, modifiers, hierarchy, superTypes }
}

/**
 * 语义键允许清单：为其它（未安装的）语言服务器预留的角色
 * 键格式：`<type>.<modifier>[:language]`
 */
export const SEMANTIC_KEY_ALLOWLIST = {
  "variable.readwrite": "为 Go/Rust 等可能发 readwrite 修饰符的服务器预留（当前技术栈不发）",
  annotation: "为 Java/Kotlin 注解类服务器预留（当前技术栈不发）",
  "variable.array": "clangd 对数组类型变量可能发 array 修饰符",
  "variable.pointer": "clangd 对指针变量发 pointer 修饰符",
}

/**
 * 找出主题里不可能被任何已装服务器命中的语义键
 * @param {object} semanticTokenColors 主题的 semanticTokenColors
 * @param {ReturnType<typeof loadSemanticRegistry>} registry
 * @returns {Array<{key: string, reason: string}>}
 */
export function findUnreachableSemanticKeys(semanticTokenColors, registry) {
  const knownTypes = new Set([...registry.types, ...[...registry.hierarchy.values()].flat()])
  const out = []
  for (const key of Object.keys(semanticTokenColors || {})) {
    const head = key.split(":")[0]
    const [type, ...mods] = head.split(".")
    if (SEMANTIC_KEY_ALLOWLIST[key]) continue
    const badMods = mods.filter((m) => !registry.modifiers.has(m))
    const typeOk = type === "*" || knownTypes.has(type)
    if (!typeOk) out.push({ key, reason: `未知类型 ${type}` })
    else if (badMods.length) out.push({ key, reason: `未知修饰符 ${badMods.join(", ")}` })
  }
  return out
}
