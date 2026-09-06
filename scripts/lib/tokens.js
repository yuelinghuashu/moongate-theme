import { normalizeHex } from "./utils.js"

/**
 * 递归解析令牌引用 {token-name}
 */
export function resolveTokens(obj, tokenMap, depth = 0, path = []) {
  const MAX_DEPTH = 20

  if (typeof obj === "string") {
    const resolveOne = (str, currentDepth, currentPath) => {
      if (currentDepth > MAX_DEPTH) {
        throw new Error(
          `[ENGINEERING_FATAL] 令牌循环引用检测: ${currentPath.join(" → ")}`,
        )
      }
      return str.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
        const value = tokenMap[key]
        if (value === undefined) {
          console.warn(`⚠️ 警告: 令牌 "${key}" 未定义，保留原样`)
          return match
        }
        return resolveOne(value, currentDepth + 1, [...currentPath, key])
      })
    }
    return resolveOne(obj, depth, path)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveTokens(item, tokenMap, depth + 1, path))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = resolveTokens(v, tokenMap, depth + 1, [...path, k])
    }
    return result
  }
  return obj
}

/**
 * 标准化所有颜色值
 */
export function normalizeColors(obj, tokenName) {
  if (typeof obj === "string") {
    return normalizeHex(obj, tokenName)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeColors(item, tokenName))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = normalizeColors(v, `${tokenName}.${k}`)
    }
    return result
  }
  return obj
}

/**
 * 检测是否直接引用了原始值（如 {blue-500}）
 */
export function detectPrimitiveReference(value, context, primitiveKeys) {
  if (typeof value === "string") {
    // 仅检测 {token} 形式的原始值引用（花括号前无 $ 前缀）
    // 使用负向后顾排除 ${var} 变量引用 —— 后者是合法的语义层引用
    const tokenRefs = value.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g) || []
    for (const ref of tokenRefs) {
      const match = ref.slice(1, -1)
      if (primitiveKeys.includes(match)) {
        console.warn(
          `[架构提醒] ${context} 中直接引用了原始值 "${match}"，建议通过语义层引用。`,
        )
      }
    }
  }
}

/**
 * 分层引用强校验（架构污染 → 构建失败）
 *
 * 组件/语义规则层（workbench / semantic / tokenColors）只允许引用语义层变量
 * （${semantic-role}），禁止直接引用原始值（{primitive}）。语义层文件内部
 * 才允许用 {primitive}。
 *
 * @param {object|array} obj 待扫描的对象
 * @param {string} context 描述性上下文（用于报错信息）
 * @param {string[]} primitiveKeys 原始值键集合
 * @returns {void} 发现直接原始值引用时抛错
 */
export function assertNoDirectPrimitiveRefs(obj, context, primitiveKeys) {
  const visit = (value, path) => {
    if (typeof value === "string") {
      const refs = value.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g) || []
      for (const ref of refs) {
        const name = ref.slice(1, -1)
        if (primitiveKeys.includes(name)) {
          throw new Error(
            `[架构违规] ${context}${path ? ` (${path})` : ""} 直接引用了原始值 "{${name}}"。\n` +
            `   颜色必须经过 "原始值 → 语义层 → 组件层" 链条；请改为引用语义层变量（\${role}）。`,
          )
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${path}[${i}]`))
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        visit(v, path ? `${path}.${k}` : k)
      }
    }
  }
  visit(obj, "")
}

/**
 * 语义层文件只允许引用原始值（{primitive}），禁止 ${var} 与引用非 primitive 键
 * @param {object} semantics 语义层原始对象
 * @param {string[]} primitiveKeys 原始值键集合
 */
export function assertSemanticReferencesPrimitivesOnly(semantics, primitiveKeys) {
  const visit = (value, path) => {
    if (typeof value === "string") {
      const varRefs = value.match(/\$\{([a-zA-Z0-9_-]+)\}/g) || []
      if (varRefs.length) {
        throw new Error(
          `[架构违规] 语义层 (${path || "?"}) 使用了 \${...} 引用 ${varRefs.join(", ")}。\n` +
          `   语义层只能引用原始值 {primitive}，组件层才能引用 \${semantic-role}。`,
        )
      }
      const tokenRefs = value.match(/(?<!\$)\{([a-zA-Z0-9_-]+)\}/g) || []
      for (const ref of tokenRefs) {
        const name = ref.slice(1, -1)
        if (!primitiveKeys.includes(name)) {
          throw new Error(
            `[架构违规] 语义层 (${path || "?"}) 引用了非原始值 "{${name}}"。\n` +
            `   语义层只能引用原始值；跨语义角色引用请先在 primitives 中定义。`,
          )
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${path}[${i}]`))
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        visit(v, path ? `${path}.${k}` : k)
      }
    }
  }
  visit(semantics, "")
}

/**
 * 替换变量 ${var} 为最终色值
 */
export function replaceVariables(obj, colors, context = "", primitiveKeys = []) {
  if (typeof obj === "string") {
    if (context) detectPrimitiveReference(obj, context, primitiveKeys)

    return obj.replace(
      /\$\{([a-zA-Z0-9_-]+)\}([0-9a-fA-F]{2})?/g,
      (match, key, alpha) => {
        const value = colors[key]
        if (value === undefined) {
          console.warn(`⚠️ 警告: 变量 "${key}" 未定义，保留原样`)
          return match
        }
        if (alpha) {
          if (/^rgba?\(/.test(value)) {
            console.warn(
              `⚠️ 警告: 变量 "${key}" 值 ${value} 已是 rgba 格式，忽略后缀`,
            )
            return value
          }
          if (/^#[0-9a-fA-F]{8}$/.test(value)) {
            console.warn(
              `⚠️ 警告: 变量 "${key}" 值 ${value} 已包含透明度，忽略后缀 "${alpha}"`,
            )
            return value
          }
          if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return value + alpha
          }
          console.warn(
            `⚠️ 警告: 变量 "${key}" 值 ${value} 格式异常，无法处理透明度`,
          )
          return value
        }
        return value
      },
    )
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceVariables(item, colors, context, primitiveKeys))
  }
  if (obj && typeof obj === "object") {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = replaceVariables(v, colors, context, primitiveKeys)
    }
    return result
  }
  return obj
}
/**
 * 消费者/规则层禁止直写裸 hex 色值（#RRGGBB / #RRGGBBAA 等）
 *
 * 所有颜色必须走 "原始值 → 语义层 → 组件层" 链条；组件层只能引用
 * ${semantic-role}。需要透明度时在语义层用 "{primitive}AA" 后缀表达。
 */
export function assertNoRawHexColors(obj, context) {
  const visit = (value, path) => {
    if (typeof value === "string") {
      if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
        throw new Error(
          `[架构违规] ${context}${path ? ` (${path})` : ""} 直写了裸色值 "${value}"。\n` +
            `   请改走 "原始值 → 语义层 → 组件层" 链条（需要透明度用语义层 {primitive}AA 后缀）。`,
        )
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${path}[${i}]`))
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        visit(v, path ? `${path}.${k}` : k)
      }
    }
  }
  visit(obj, "")
}
