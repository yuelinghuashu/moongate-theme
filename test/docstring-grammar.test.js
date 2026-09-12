/**
 * Python docstring 注入语法：真实分词测试
 *
 * 背景：VS Code 的 MagicPython（以及 Pylance 自带的 PylancePython 语法）只给整个 docstring
 * 一个 scope（string.quoted.docstring.*.python），内部零 token，主题无从配色；TS 的
 * JSDoc 效果来自 typescript-basics 的注入语法。本仓库因此自带
 * syntaxes/python-docstring.injection.tmLanguage.json，本文件用 vscode-textmate 真机分词
 * （与 VS Code 的 textmate worker 同样通过 Registry 的 getInjections 注入）验证它确实生效。
 */
import { test, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import textmate from "vscode-textmate"
import oniguruma from "vscode-oniguruma"
import { safeLoadYaml } from "../scripts/lib/utils.js"

const { Registry, parseRawGrammar } = textmate
const { loadWASM, OnigScanner, OnigString } = oniguruma

const require = createRequire(import.meta.url)
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const INJECTION_SCOPE = "documentation.injection.python"
const INJECTION_FILE = path.join(ROOT_DIR, "syntaxes", "python-docstring.injection.tmLanguage.json")
/**
 * 解析本机 VS Code 内置 Python 语法路径（可移植）
 *
 * 顺序：环境变量 VSCODE_EXTENSIONS_DIR → 常见安装路径（Linux/macOS/Windows）。
 * 找不到时依赖宿主语法的用例会 skip，而不是整套失败。
 */
export function resolveMagicPython(candidates = magicPythonCandidates()) {
  return candidates.find((file) => file && fs.existsSync(file)) || null
}

function magicPythonCandidates() {
  const candidates = []
  if (process.env.VSCODE_EXTENSIONS_DIR) {
    candidates.push(path.join(process.env.VSCODE_EXTENSIONS_DIR, "extensions", "python", "syntaxes", "MagicPython.tmLanguage.json"))
    candidates.push(path.join(process.env.VSCODE_EXTENSIONS_DIR, "python", "syntaxes", "MagicPython.tmLanguage.json"))
  }
  candidates.push(
    "/usr/share/code/resources/app/extensions/python/syntaxes/MagicPython.tmLanguage.json",
    "/usr/lib/code/extensions/python/syntaxes/MagicPython.tmLanguage.json",
    "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/python/syntaxes/MagicPython.tmLanguage.json",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Programs",
      "Microsoft VS Code",
      "resources",
      "app",
      "extensions",
      "python",
      "syntaxes",
      "MagicPython.tmLanguage.json",
    ),
  )
  return candidates
}

const MAGIC_PYTHON = resolveMagicPython()
/** 依赖本机 VS Code 语法的用例在缺失时跳过（结构与反例用例不依赖它） */
const HOST_GRAMMAR_SKIP = MAGIC_PYTHON
  ? false
  : "未找到 VS Code 内置 MagicPython 语法（设置 VSCODE_EXTENSIONS_DIR 或安装 VS Code）"
/** 依赖宿主语法的用例包装器 */
const hostTest = (title, fn) => test(title, { skip: HOST_GRAMMAR_SKIP }, fn)

const DOCSTRING_SCOPES = [
  "string.quoted.docstring.multi.python",
  "string.quoted.docstring.raw.multi.python",
  "string.quoted.docstring.single.python",
  "string.quoted.docstring.raw.single.python",
]

/** 本语法声明的 scope 家族（测试与主题规则共用） */
const DOCSTRING_FAMILY = /(documentation\.docstring\.python|markup\.(inline\.raw|bold|italic)\.docstring\.python)$/

let grammar = null

before(async () => {
  const onigLib = loadWASM(fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm")).buffer).then(() => ({
    createOnigScanner: (patterns) => new OnigScanner(patterns),
    createOnigString: (s) => new OnigString(s),
  }))

  if (!MAGIC_PYTHON) return // 结构性用例照常跑；分词用例已标记 skip

  const grammarFiles = {
    "source.python": MAGIC_PYTHON,
    [INJECTION_SCOPE]: INJECTION_FILE,
  }

  const registry = new Registry({
    onigLib,
    loadGrammar: async (scopeName) => {
      const file = grammarFiles[scopeName]
      if (!file || !fs.existsSync(file)) return null
      return parseRawGrammar(fs.readFileSync(file, "utf8"), file)
    },
    // 与 VS Code 的 textmate worker 一致：把注入语法挂到宿主 scope 上
    getInjections: (scopeName) => (scopeName === "source.python" ? [INJECTION_SCOPE] : []),
  })

  grammar = await registry.loadGrammar("source.python")
  assert.ok(grammar, `MagicPython 未能加载：${MAGIC_PYTHON}`)
})

/** 逐行分词，返回 [{ line, tokens: [{ text, scopes }] }] */
function tokenize(code) {
  const lines = code.split("\n")
  let state = null
  return lines.map((line) => {
    const result = grammar.tokenizeLine(line, state)
    state = result.ruleStack
    return {
      line,
      tokens: result.tokens.map((t) => ({ text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes })),
    }
  })
}

/** 取某行中断言用的 token：text 含 needle 且 scope 栈含 withScope（若有） */
function tokenAt(code, needle, { line = null, withScope = null } = {}) {
  const rows = tokenize(code)
  for (const row of rows) {
    if (line !== null && row.line !== line) continue
    for (const t of row.tokens) {
      if (!t.text.includes(needle)) continue
      if (withScope && !t.scopes.some((s) => s === withScope)) continue
      return { ...t, line: row.line }
    }
  }
  return null
}

const hasScope = (code, needle, scope) => {
  const t = tokenAt(code, needle, { withScope: scope })
  return Boolean(t && t.scopes.includes(scope))
}

// ==================== 前置事实：宿主语法给 docstring 的 scope ====================

hostTest("前置：MagicPython 只给整个 docstring 一个 scope（这正是需要注入语法的原因）", () => {
  const code = ['def f(x):', '    """Docstring."""'].join("\n")
  const t = tokenAt(code, "Docstring")
  assert.ok(t, "未找到 docstring 内容 token")
  assert.ok(
    t.scopes.includes("string.quoted.docstring.multi.python"),
    `docstring 应带 string.quoted.docstring.multi.python，实际：${t.scopes.join(" ")}`,
  )
})

// ==================== Sphinx field list ====================

const SPHINX = [
  "def load(path, encoding):",
  '    """Load records.',
  "",
  "    :param path: source file path",
  "    :type path: list[dict[str, int]]",
  "    :raises ValueError: when malformed",
  "    :returns: parsed records",
  '    """',
].join("\n")

hostTest("Sphinx：:param / :type / :raises / :returns 全部识别", () => {
  assert.ok(hasScope(SPHINX, "param", "keyword.other.documentation.docstring.python"), ":param 字段名未识别")
  assert.ok(hasScope(SPHINX, "path", "variable.parameter.documentation.docstring.python"), ":param 的参数名未识别")
  assert.ok(hasScope(SPHINX, "list[dict[str, int]]", "entity.name.type.documentation.docstring.python"), ":type 的类型未识别")
  assert.ok(hasScope(SPHINX, "raises", "keyword.other.documentation.docstring.python"), ":raises 字段名未识别")
  assert.ok(hasScope(SPHINX, "ValueError", "entity.name.type.documentation.docstring.python"), ":raises 的异常类型未识别")
  assert.ok(hasScope(SPHINX, "returns", "keyword.other.documentation.docstring.python"), ":returns 字段名未识别")
})

// ==================== Google / NumPy 段落 ====================

const GOOGLE_NUMPY = [
  "def g(name, count):",
  '    """Summary line.',
  "",
  "    Args:",
  "        name (str): the name",
  "        count (int): how many",
  "",
  "    Returns:",
  "        bool: whether it worked",
  "",
  "    Parameters",
  "    ----------",
  "    value : int",
  '    """',
].join("\n")

hostTest("Google/NumPy：段落头、参数行、类型与下划线识别", () => {
  assert.ok(hasScope(GOOGLE_NUMPY, "Args", "keyword.other.documentation.docstring.python"), "Args: 段落头未识别")
  assert.ok(hasScope(GOOGLE_NUMPY, "Returns", "keyword.other.documentation.docstring.python"), "Returns: 段落头未识别")
  assert.ok(hasScope(GOOGLE_NUMPY, "Parameters", "keyword.other.documentation.docstring.python"), "NumPy 段落头未识别")
  assert.ok(
    hasScope(GOOGLE_NUMPY, "-----", "punctuation.definition.section.documentation.docstring.python"),
    "NumPy 下划线未识别",
  )
  assert.ok(hasScope(GOOGLE_NUMPY, "str", "entity.name.type.documentation.docstring.python"), "Google 参数行类型未识别")
  assert.ok(
    hasScope(GOOGLE_NUMPY, "count", "variable.parameter.documentation.docstring.python"),
    "Google 参数名未识别",
  )
})

// ==================== 内联 reST / 指令 ====================

const INLINE = [
  "def h():",
  '    """Use ``codecs`` and **bold** and *emph* here.',
  "",
  "    See :class:`codecs.CodecInfo`.",
  "",
  "    .. note::",
  "        Keep it short.",
  '    """',
].join("\n")

hostTest("内联 reST：字面量 / 粗体 / 斜体 / 角色 / 指令识别", () => {
  assert.ok(hasScope(INLINE, "``codecs``", "markup.inline.raw.docstring.python"), "``字面量`` 未识别")
  assert.ok(hasScope(INLINE, "**bold**", "markup.bold.docstring.python"), "**粗体** 未识别")
  assert.ok(hasScope(INLINE, "*emph*", "markup.italic.docstring.python"), "*斜体* 未识别")
  assert.ok(hasScope(INLINE, ":class:", "keyword.other.role.documentation.docstring.python"), "交叉引用角色未识别")
  assert.ok(hasScope(INLINE, "codecs.CodecInfo", "markup.inline.raw.docstring.python"), "角色目标未识别")
  assert.ok(hasScope(INLINE, "note", "keyword.other.directive.documentation.docstring.python"), "Sphinx 指令未识别")
  assert.ok(
    hasScope(INLINE, "..", "punctuation.definition.directive.documentation.docstring.python"),
    "Sphinx 指令的 .. 未识别",
  )
})

// ==================== raw docstring 与反例 ====================

hostTest("raw docstring（r\"\"\"…\"\"\"）同样被注入", () => {
  const code = [
    "def r():",
    '    r"""Raw docstring.',
    "",
    "    Use ``bytes`` here.",
    "    :param x: value",
    '    """',
  ].join("\n")
  assert.ok(hasScope(code, "param", "keyword.other.documentation.docstring.python"), "raw docstring 未注入")
  assert.ok(hasScope(code, "bytes", "markup.inline.raw.docstring.python"), "raw docstring 的内联字面量未注入")
  assert.ok(hasScope(code, "x", "variable.parameter.documentation.docstring.python"), "raw docstring 的参数名未识别")
})

hostTest("反例：普通字符串不注入（不得把普通字符串内容当成文档标记）", () => {
  const code = ['x = "Args: not a docstring"', 'y = ":param z: nope"', 'z = "see **bold**"'].join("\n")
  for (const row of tokenize(code)) {
    for (const t of row.tokens) {
      assert.ok(
        !t.scopes.some((s) => DOCSTRING_FAMILY.test(s)),
        `普通字符串被误注入：${row.line} → ${t.text}（${t.scopes.join(" ")}）`,
      )
    }
  }
})

hostTest("反例：函数末行的普通字符串（非 docstring）不注入", () => {
  const code = ["def f():", '    s = "Parameters"', "    return s"].join("\n")
  for (const row of tokenize(code)) {
    for (const t of row.tokens) {
      assert.ok(!t.scopes.some((s) => DOCSTRING_FAMILY.test(s)), `非 docstring 字符串被误注入：${row.line}`)
    }
  }
})

// ==================== 结构一致性 ====================

test("语法结构：injectionSelector 覆盖 4 个 docstring scope", () => {
  const raw = JSON.parse(fs.readFileSync(INJECTION_FILE, "utf8"))
  assert.equal(raw.scopeName, INJECTION_SCOPE)
  for (const scope of DOCSTRING_SCOPES) {
    assert.ok(
      raw.injectionSelector.includes(`L:${scope}`),
      `injectionSelector 缺少 L:${scope}（否则该形态的 docstring 不会被注入）`,
    )
  }
})

test("结构一致性：python-docstring.yaml 的每个 scope 都能在语法文件中找到", () => {
  const yamlPath = path.join(ROOT_DIR, "src", "languages", "python-docstring.yaml")
  const data = safeLoadYaml(yamlPath, "python-docstring.yaml")
  const raw = fs.readFileSync(INJECTION_FILE, "utf8")
  const declared = new Set()
  for (const rule of data.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    for (const s of scopes) declared.add(s)
  }
  assert.ok(declared.size > 0, "python-docstring.yaml 未声明任何 scope")
  for (const scope of declared) {
    assert.ok(raw.includes(`"${scope}"`), `主题规则引用的 scope 在注入语法中不存在：${scope}`)
  }
})

// ==================== T10：可移植性 ====================

test("可移植性：语法路径找不到候选时返回 null（用例据此 skip 而非失败）", () => {
  assert.equal(resolveMagicPython(["/nonexistent/MagicPython.tmLanguage.json"]), null)
  assert.ok(resolveMagicPython([INJECTION_FILE]), "应当能解析出已存在的语法文件")
})

// ==================== T11：健壮性（对抗性输入不挂、不超时、不误染） ====================

/** 分词整个片段，断言在宽松预算内完成（防灾难性回溯） */
function tokenizeAll(code, budgetMs = 5000) {
  const started = Date.now()
  const rows = tokenize(code)
  const elapsed = Date.now() - started
  assert.ok(elapsed < budgetMs, `分词耗时 ${elapsed}ms 超出预算 ${budgetMs}ms（疑似灾难性回溯）`)
  return rows.reduce((n, row) => n + row.tokens.length, 0)
}

hostTest("健壮性：未闭合 docstring 不抛错、不挂", () => {
  const code = ["def f():", '    """never closed', "    :param x: value", "    :type x: int"].join("\n")
  assert.ok(tokenizeAll(code) > 0)
})

hostTest("健壮性：单行超长 docstring（10 万字符）在预算内完成", () => {
  const body = "word ".repeat(20000)
  const code = ["def f():", `    """${body}`, "    :param x: value", '    """'].join("\n")
  assert.ok(tokenizeAll(code, 8000) > 0)
})

hostTest("健壮性：大量标记（字段 / 角色 / 强调）不触发回溯爆炸", () => {
  const line = ":param a: **bold** and ``lit`` and :class:`Foo` " + "*emph* ".repeat(200)
  const code = ["def f():", '    """Doc.', ...Array.from({ length: 200 }, () => `    ${line}`), '    """'].join("\n")
  assert.ok(tokenizeAll(code, 8000) > 0)
})

hostTest("健壮性：深层嵌套类型仍被识别", () => {
  const deep = "list[dict[str, list[tuple[int, str]]]]"
  const code = ["def f():", '    """Doc.', `    :type x: ${deep}`, '    """'].join("\n")
  assert.ok(hasScope(code, deep, "entity.name.type.documentation.docstring.python"))
})

hostTest("健壮性：CRLF 行尾下字段仍被识别", () => {
  const code = ["def f():", '    """Doc.', "    :param x: value", '    """'].join("\r\n")
  assert.ok(hasScope(code, "param", "keyword.other.documentation.docstring.python"))
})

hostTest("健壮性：docstring 内含三引号转义与反斜杠不抛错", () => {
  const quoted = "\\" + '\\"\\"'
  const code = ["def f():", `    '''Doc with ${quoted} inside and \\\\n escape.`, "    :param x: value", "    '''"].join("\n")
  assert.ok(tokenizeAll(code) > 0)
})

hostTest("健壮性：纯符号长串不误判为强调/字面量", () => {
  const code = ["def f():", `    """Doc ${"*".repeat(2000)} and ${"`".repeat(2000)}`, '    """'].join("\n")
  for (const row of tokenize(code)) {
    for (const t of row.tokens) {
      assert.ok(
        !t.scopes.some((s) => /markup\.(bold|italic|inline\.raw)\.docstring\.python$/.test(s)),
        `纯符号串被误判为强调/字面量：${t.text.slice(0, 20)}`,
      )
    }
  }
})
