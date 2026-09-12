/**
 * 语义高亮 × TextMate 一致性（防复发）
 *
 * 背景：VS Code 的语义高亮**总是覆盖** TextMate 颜色，而语义选择器的打分是
 *   score = (100 − 类型在父类型层级中的下标) + 100 × 选择器修饰符个数（语言限定 +10）
 * 修饰符权重远大于层级惩罚，因此「父类型 + 修饰符」键会反超精确类型键——
 * 真实事故：Pylance 的 True/False/None 是 builtinConstant + readonly、builtin，
 * 主题的 constant.builtin(199) 压过 builtinConstant(100) 变成白色。
 *
 * 本测试把「已声明的探针」当作契约：VS Code 内建 33 条 + 已装 Pylance 声明的 17 条。
 * 对每条探针，语义层的**最终生效色**必须等于 TextMate 层的最终生效色；
 * 若确实需要偏离（本主题的刻意设计），必须登记进 DEVIATIONS 并写明理由——
 * 且该条目一旦不再偏离，测试会失败以强制复核（避免 allow-list 腐坏）。
 */
import { test, before } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveSemanticStyle, resolveTextmateStyle, loadSemanticRegistry, findUnreachableSemanticKeys, SEMANTIC_KEY_ALLOWLIST } from "./helpers.js"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

before(() => {
  execFileSync("node", ["scripts/build.js"], { cwd: ROOT_DIR, stdio: "pipe" })
})

const themes = {
  dark: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-dark.json"), "utf8")),
  light: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "themes", "moongate-theme-light.json"), "utf8")),
}

/** 自定义语义类型的父类型链（Pylance 的 semanticTokenTypes.superType 声明） */
const HIERARCHY = {
  selfParameter: ["selfParameter", "parameter"],
  clsParameter: ["clsParameter", "parameter"],
  magicFunction: ["magicFunction", "function"],
  builtinConstant: ["builtinConstant", "constant"],
  module: ["module", "namespace"],
  intrinsic: ["intrinsic", "operator"],
}

/** 通配选择器（`*.<modifier>`）需要按具体类型逐个核算 */
const WILDCARD_TYPES = [
  "variable", "function", "method", "class", "type", "property",
  "parameter", "namespace", "enumMember", "string", "comment", "number", "keyword",
]

const ALL_TYPES = "*"

/**
 * 探针表：selector（semanticTokenColors 键形式）→ 该选择器对应 token 的 TextMate scope
 * - 前 22 条为 VS Code 内建（ColorThemeData.getTokenStylingDefaultRules）
 * - 后 17 条为 Pylance 声明（package.json 的 semanticTokenScopes）
 */
const PROBES = [
  // ===== VS Code 内建：类型 =====
  { key: "comment", scopes: ["comment"] },
  { key: "string", scopes: ["string"] },
  { key: "keyword", scopes: ["keyword.control"] },
  { key: "number", scopes: ["constant.numeric"] },
  { key: "regexp", scopes: ["constant.regexp"] },
  { key: "operator", scopes: ["keyword.operator"] },
  { key: "namespace", scopes: ["entity.name.namespace"] },
  { key: "type", scopes: ["entity.name.type", "support.type"] },
  { key: "struct", scopes: ["entity.name.type.struct"] },
  { key: "class", scopes: ["entity.name.type.class", "support.class"] },
  { key: "interface", scopes: ["entity.name.type.interface"] },
  { key: "enum", scopes: ["entity.name.type.enum"] },
  { key: "typeParameter", scopes: ["entity.name.type.parameter"] },
  { key: "function", scopes: ["entity.name.function", "support.function"] },
  { key: "method", scopes: ["entity.name.function.member", "support.function"] },
  { key: "macro", scopes: ["entity.name.function.preprocessor"] },
  { key: "variable", scopes: ["variable.other.readwrite", "entity.name.variable"] },
  { key: "parameter", scopes: ["variable.parameter"] },
  { key: "property", scopes: ["variable.other.property"] },
  { key: "enumMember", scopes: ["variable.other.enummember"] },
  { key: "event", scopes: ["variable.other.event"] },
  { key: "decorator", scopes: ["entity.name.decorator", "entity.name.function"] },
  // ===== VS Code 内建：修饰符限定 =====
  { key: "variable.readonly", scopes: ["variable.other.constant"] },
  { key: "property.readonly", scopes: ["variable.other.constant.property"] },
  { key: "type.defaultLibrary", scopes: ["support.type"] },
  { key: "class.defaultLibrary", scopes: ["support.class"] },
  { key: "interface.defaultLibrary", scopes: ["support.class"] },
  { key: "variable.defaultLibrary", scopes: ["support.variable", "support.other.variable"] },
  { key: "variable.defaultLibrary.readonly", scopes: ["support.constant"] },
  { key: "property.defaultLibrary", scopes: ["support.variable.property"] },
  { key: "property.defaultLibrary.readonly", scopes: ["support.constant.property"] },
  { key: "function.defaultLibrary", scopes: ["support.function"] },
  { key: "member.defaultLibrary", scopes: ["support.function"] },
  // ===== Pylance（Python） =====
  { key: "selfParameter", scopes: ["variable.parameter.function.language.special.self.python"] },
  { key: "clsParameter", scopes: ["variable.parameter.function.language.special.cls.python"] },
  { key: "parameter.keywordArgument", scopes: ["variable.parameter.function-call.python"] },
  { key: "magicFunction", scopes: ["support.function.magic.python"] },
  { key: "string.escapeCharacter", scopes: ["constant.character.escape.python"] },
  { key: "*.invalid", scopes: ["invalid.illegal"], types: WILDCARD_TYPES },
  { key: "*.typeHintComment", scopes: ["comment.typehint.type.notation.python"], types: WILDCARD_TYPES },
  { key: "*.overridden", scopes: ["support.function.magic.python"], types: WILDCARD_TYPES },
  { key: "function.decorator", scopes: ["meta.function.decorator.python"] },
  { key: "class.decorator", scopes: ["meta.function.decorator.python"] },
  { key: "builtinConstant", scopes: ["constant.language.python"] },
  { key: "parameter.defaultLibrary", scopes: ["variable.parameter"] },
]

/**
 * 刻意偏离清单（语义层 ≠ TextMate 层）：必须写明理由；
 * 若某条不再偏离，测试失败 → 强制复核后删除该条。
 */
const DEVIATIONS = [
  {
    key: "typeParameter",
    scope: "entity.name.type.parameter",
    reason: "刻意：类型参数与基础类型同族，统一青色（TextMate 侧是黄色）",
  },
  {
    key: "macro",
    scope: "entity.name.function.preprocessor",
    reason: "刻意：宏统一紫色；且当前服务器栈（Pylance/Go/Volar）不发 macro token",
  },
  {
    key: "variable.defaultLibrary.readonly",
    scope: "support.constant",
    reason: "刻意：变量/成员走“常量保持亮度”“只读=${text}”分层，黄色留给 constant.builtin",
  },
  {
    key: "property.defaultLibrary.readonly",
    scope: "support.constant.property",
    reason: "刻意：同上，只读属性=${text}，不复用 support.constant 的黄",
  },
  {
    key: "*.overridden",
    scope: "support.function.magic.python",
    reason: "刻意：主题无“重写”概念，保留类型本色（探针的 magic-function 蓝被忽略）",
  },
]

const deviationFor = (key, scope) => DEVIATIONS.find((d) => d.key === key && d.scope === scope)

for (const [name, theme] of Object.entries(themes)) {
  test(`theme(${name}): 已声明探针的语义层最终色 == TextMate 层最终色`, () => {
    let checked = 0
    const deviationHits = new Map()

    for (const probe of PROBES) {
      const types = probe.types === ALL_TYPES || probe.types === undefined ? [probe.key.split(".")[0]] : probe.types
      for (const type of types) {
        const token = {
          type,
          modifiers: probe.key.split(".").slice(1),
          hierarchy: HIERARCHY[type] ?? [type],
          language: "python",
        }
        const semantic = resolveSemanticStyle(theme.semanticTokenColors, token)
        if (semantic.foreground === undefined) continue

        for (const scope of probe.scopes) {
          const textmate = resolveTextmateStyle(theme.tokenColors, ["source.python", scope])
          if (textmate.foreground === undefined) continue
          checked += 1

          const deviation = deviationFor(probe.key, scope)
          const same = semantic.foreground.toLowerCase() === textmate.foreground.toLowerCase()
          if (deviation) {
            if (same) deviationHits.set(`${probe.key}|${scope}`, false)
            else deviationHits.set(`${probe.key}|${scope}`, true)
          } else {
            assert.equal(
              semantic.foreground.toLowerCase(),
              textmate.foreground.toLowerCase(),
              `${probe.key}（type=${type}）在 ${scope} 上语义层 ${semantic.foreground} 与 TextMate 层 ${textmate.foreground} 不一致；` +
                `要么对齐颜色，要么登记进 DEVIATIONS 并写明理由`,
            )
          }
        }
      }
    }

    // 偏离条目必须仍然偏离（避免 allow-list 腐坏）
    for (const [id, deviates] of deviationHits) {
      assert.ok(deviates, `DEVIATIONS 中的 ${id} 已不再偏离，请复核并移除该条目`)
    }
    // 防止探针表/解析器失效导致"空跑"
    assert.ok(checked >= 30, `实际比对条目过少（${checked}），请检查 PROBES 表与解析器`)
  })
}

test("关键探针：转义 / 内置常量 / self·cls / invalid / typeHintComment", () => {
  for (const theme of [themes.dark, themes.light]) {
    // ① 转义：主题刻意**不写**语义键，避免遮住 VS Code 内建的 string.escapeCharacter 探针，
    //    颜色由 TextMate 规则提供，且必须与字符串正文不同色。
    const escape = resolveTextmateStyle(theme.tokenColors, [
      "source.python",
      "string.quoted.double.python",
      "constant.character.escape.python",
    ])
    const stringBody = resolveTextmateStyle(theme.tokenColors, ["source.python", "string.quoted.double.python"])
    assert.ok(escape.foreground, "缺少 Python 转义字符的 TextMate 规则")
    assert.notEqual(escape.foreground, stringBody.foreground, "转义字符不应与字符串正文同色")
    assert.equal(
      resolveSemanticStyle(theme.semanticTokenColors, {
        type: "string",
        modifiers: ["escapeCharacter"],
        hierarchy: ["string"],
      }).foreground,
      undefined,
      "语义层不应为 string.escapeCharacter 写键（会遮住内建探针，使转义失去专属色）",
    )

    // ② 必须由主题语义键承载（否则会被类型键按父类型覆盖）
    const cases = [
      { type: "builtinConstant", modifiers: ["readonly", "builtin"], hierarchy: HIERARCHY.builtinConstant, scope: "constant.language.python" },
      { type: "selfParameter", modifiers: [], hierarchy: HIERARCHY.selfParameter, scope: "variable.parameter.function.language.special.self.python" },
      { type: "clsParameter", modifiers: [], hierarchy: HIERARCHY.clsParameter, scope: "variable.parameter.function.language.special.cls.python" },
      { type: "variable", modifiers: ["invalid"], hierarchy: ["variable"], scope: "invalid.illegal" },
      { type: "class", modifiers: ["typeHintComment"], hierarchy: ["class"], scope: "comment.typehint.type.notation.python" },
      // 实测 shape：__name__ / __file__ 等 dunder 是 variable + builtin
      { type: "variable", modifiers: ["builtin"], hierarchy: ["variable"], scope: "support.variable.magic.python" },
    ]
    for (const c of cases) {
      const semantic = resolveSemanticStyle(theme.semanticTokenColors, { ...c, language: "python" })
      const textmate = resolveTextmateStyle(theme.tokenColors, ["source.python", c.scope])
      assert.ok(semantic.foreground, `${c.type}(${c.modifiers.join("+") || "无修饰符"}) 未被主题语义键覆盖`)
      assert.equal(
        semantic.foreground.toLowerCase(),
        textmate.foreground.toLowerCase(),
        `${c.type} 语义色应与 ${c.scope} 的 TextMate 色一致`,
      )
    }
  }
})

// ==================== 语义键可达性（T4） ====================

test("语义键可达性：不存在任何已装服务器都发不出的键（死键）", () => {
  const registry = loadSemanticRegistry()
  assert.ok(registry.types.size > 20, `语义注册表异常：仅 ${registry.types.size} 个类型`)
  for (const theme of [themes.dark, themes.light]) {
    const unreachable = findUnreachableSemanticKeys(theme.semanticTokenColors, registry)
    assert.deepEqual(
      unreachable.map((u) => `${u.key}（${u.reason}）`),
      [],
      "存在死键：要么删除，要么登记进 SEMANTIC_KEY_ALLOWLIST 并写明理由",
    )
  }
})

test("语义键可达性：允许清单条目都有理由，且确实不在注册表中", () => {
  const registry = loadSemanticRegistry()
  const knownTypes = new Set([...registry.types, ...[...registry.hierarchy.values()].flat()])
  for (const [key, reason] of Object.entries(SEMANTIC_KEY_ALLOWLIST)) {
    assert.ok(reason && reason.length >= 8, `允许清单 ${key} 缺少理由说明`)
    const [type, ...mods] = key.split(":")[0].split(".")
    const reachable = (type === "*" || knownTypes.has(type)) && mods.every((m) => registry.modifiers.has(m))
    assert.ok(!reachable, `允许清单中的 ${key} 其实已可达，请从清单移除`)
  }
})
