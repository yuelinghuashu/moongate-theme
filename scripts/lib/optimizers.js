/**
 * 合并相同 settings 的 token 规则
 * 大幅精简 tokenColors 数组
 */
export function mergeTokenColors(tokenColors) {
  if (!Array.isArray(tokenColors) || tokenColors.length === 0) {
    return tokenColors
  }

  const merged = new Map()

  const stableKey = (obj) => {
    // 递归生成稳定 key：按键名排序，避免相同 settings 因键序不同被当作不同规则
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return JSON.stringify(
        Object.keys(obj)
          .sort()
          .reduce((acc, k) => {
            acc[k] = stableKey(obj[k])
            return acc
          }, {}),
      )
    }
    if (Array.isArray(obj)) {
      return JSON.stringify(obj.map((item) => stableKey(item)))
    }
    return JSON.stringify(obj)
  }

  for (const item of tokenColors) {
    // 跳过没有 settings 或 scope 的项
    if (!item.settings || !item.scope) {
      continue
    }

    // 生成 settings 的稳定键（键排序，避免 {foreground,fontStyle} 与 {fontStyle,foreground} 被视为不同）
    const settingsKey = stableKey(item.settings)

    if (!merged.has(settingsKey)) {
      merged.set(settingsKey, {
        settings: item.settings,
        scopes: new Set(),
        names: [],
      })
    }

    const entry = merged.get(settingsKey)
    // 收集所有 scope
    if (Array.isArray(item.scope)) {
      item.scope.forEach((s) => entry.scopes.add(s))
    } else if (typeof item.scope === "string") {
      entry.scopes.add(item.scope)
    }
    // 保留一个代表性的 name
    if (item.name && entry.names.length === 0) {
      entry.names.push(item.name)
    }
  }

  // 转换回数组
  const result = []
  for (const [, entry] of merged) {
    const scopes = Array.from(entry.scopes).sort()
    const name = entry.names.length > 0 ? entry.names.join(", ") : undefined
    const rule = {
      scope: scopes,
      settings: entry.settings,
    }
    if (name) {
      rule.name = name
    }
    result.push(rule)
  }

  // 按 scope 数量降序排序（更具体的规则在前）
  result.sort((a, b) => b.scope.length - a.scope.length)

  console.log(
    `   📦 token 合并: ${tokenColors.length} → ${result.length} 条规则`,
  )
  return result
}

/**
 * 精简 semanticTokenColors（删除冗余 foreground）
 *
 * VS Code 语义角色支持父级继承：`function.declaration` 会自动继承
 * `function` 的样式，除非被显式覆盖。因此当复合键（如
 * `function.declaration`）的 foreground 与父级角色（如 `function`）
 * 完全相同时，可以安全删除冗余的 foreground，由 VS Code 自动继承。
 */
export function optimizeSemanticTokenColors(semanticColors) {
  if (!semanticColors || typeof semanticColors !== "object") {
    return semanticColors
  }

  const result = {}
  const simpleColorKeys = new Set()

  // 第一遍：收集简单键值对（字符串形式的语义角色）
  for (const [key, value] of Object.entries(semanticColors)) {
    if (typeof value === "string") {
      simpleColorKeys.add(key)
      result[key] = value
    }
  }

  // 第二遍：处理复合键（如 function.declaration）
  let removedCount = 0
  for (const [key, value] of Object.entries(semanticColors)) {
    if (value && typeof value === "object") {
      const baseKey = key.split(".")[0]
      const baseIsSimple = simpleColorKeys.has(baseKey)

      if (
        baseIsSimple &&
        value.foreground &&
        value.foreground === result[baseKey]
      ) {
        // foreground 与父级相同，删除冗余的 foreground
        const { foreground, ...rest } = value
        result[key] = rest
        removedCount++
      } else {
        result[key] = value
      }
    }
  }

  if (removedCount > 0) {
    console.log(`   📦 semanticTokenColors 精简: 移除 ${removedCount} 个冗余 foreground`)
  }
  return result
}