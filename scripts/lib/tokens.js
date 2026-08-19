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