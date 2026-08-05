#!/usr/bin/env node
/**
 * Scope 验证 CLI
 *
 * 验证语言配置文件中的 scope 是否与 VS Code 内置语法匹配。
 *
 * 用法: node scripts/verify-scopes.js
 * 环境变量：
 *   VSCODE_EXTENSIONS_DIR - 自定义 VS Code 扩展根目录（用于非标准安装路径）
 *
 * 有 scope 错误时退出码为 1（供 CI 中断）。
 */
import { verifyAllScopes, formatVerificationResult } from "./lib/scope-validator.js"

const result = verifyAllScopes({ verbose: true })

console.log("🔍 验证语言配置中的 scope...\n")
process.stdout.write(formatVerificationResult(result))

if (!result.isValid) {
  console.error(`\n❌ 发现 ${result.totalIssues} 个 scope 不匹配，验证失败！`)
  process.exit(1)
}