import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  generateColorCss,
  generateLayoutCss,
  generateDesignSystemDoc,
  generateScssTokens,
  generateTsTokens,
} from "../scripts/lib/generators.js"
import { captureConsole } from "./helpers.js"

// ==================== 测试用临时目录 setup/teardown ====================
let tempDir
let realWrite
let writes

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "moongate-test-"))
  // 拦截 fs.writeFileSync 只捕获内容，不实际写入文件
  writes = []
  realWrite = fs.writeFileSync
  fs.writeFileSync = (filePath, content, ...args) => {
    writes.push({ filePath, content })
  }
})

afterEach(() => {
  fs.writeFileSync = realWrite
  fs.rmSync(tempDir, { recursive: true, force: true })
})

// ==================== generateColorCss 测试 ====================
test("generateColorCss: 生成包含 light/dark 块的 CSS", () => {
  const lightColors = { surfaceGround: "#f9fafb", text: "#0f172a" }
  const darkColors = { surfaceGround: "#0f172a", text: "#e2e8f0" }

  captureConsole(() => generateColorCss(lightColors, darkColors))

  const cssEntry = writes.find((w) =>
    w.filePath.includes("moongate-colors.css"),
  )
  assert.ok(cssEntry, "应调用 writeFileSync 写 CSS 文件")

  const content = cssEntry.content
  // 验证包含 :root/.light 和 .dark 块
  assert.match(content, /:root,\n\.light \{/)
  assert.match(content, /\.dark \{/)
  // 验证浅色模式包含 lightColors
  assert.match(content, /--ui-surface-ground: #f9fafb;/)
  assert.match(content, /--ui-text: #0f172a;/)
  // 验证深色模式包含 darkColors
  assert.match(content, /--ui-surface-ground: #0f172a;/)
  assert.match(content, /--ui-text: #e2e8f0;/)
})

// ==================== generateLayoutCss 测试 ====================
test("generateLayoutCss: 生成扁平化的布局 CSS 变量", () => {
  captureConsole(() => {
    generateLayoutCss({
      spacing: { xs: "4px", md: "16px" },
      radius: { sm: "4px" },
    })
  })

  const cssEntry = writes.find((w) =>
    w.filePath.includes("moongate-layout.css"),
  )
  assert.ok(cssEntry, "应调用 writeFileSync 写布局 CSS 文件")
  const content = cssEntry.content

  // 验证扁平化 key
  assert.match(content, /--ui-spacing-xs: 4px;/)
  assert.match(content, /--ui-spacing-md: 16px;/)
  assert.match(content, /--ui-radius-sm: 4px;/)
})

test("generateLayoutCss: 剥离整体被单引号包裹的值", () => {
  captureConsole(() => {
    generateLayoutCss({ font: { family: "'Inter'" } })
  })

  const cssEntry = writes.find((w) =>
    w.filePath.includes("moongate-layout.css"),
  )
  const content = cssEntry.content
  assert.match(content, /--ui-font-family: Inter;/)
})

test("generateLayoutCss: 剥离整体被双引号包裹的值", () => {
  captureConsole(() => {
    generateLayoutCss({ font: { family: '"Inter"' } })
  })

  const cssEntry = writes.find((w) =>
    w.filePath.includes("moongate-layout.css"),
  )
  const content = cssEntry.content
  assert.match(content, /--ui-font-family: Inter;/)
})

test("generateLayoutCss: 保留多字体名称的内部引号", () => {
  captureConsole(() => {
    generateLayoutCss({ font: { family: "'JetBrains Mono', monospace" } })
  })

  const cssEntry = writes.find((w) =>
    w.filePath.includes("moongate-layout.css"),
  )
  const content = cssEntry.content
  assert.match(content, /--ui-font-family: 'JetBrains Mono', monospace;/)
})

// ==================== generateScssTokens 测试 ====================
test("generateScssTokens: 生成 SCSS 变量与 Maps", () => {
  const lightColors = { bg: "#f9fafb", text: "#0f172a" }
  const darkColors = { bg: "#0f172a", text: "#e2e8f0" }
  const layoutTokens = { spacing: { xs: "4px", md: "12px" } }

  captureConsole(() => generateScssTokens(lightColors, darkColors, layoutTokens))

  const scssEntry = writes.find((w) => w.filePath.includes("_tokens.scss"))
  assert.ok(scssEntry, "应调用 writeFileSync 写 SCSS 文件")

  const content = scssEntry.content
  // 验证深色模式 Map
  assert.match(content, /\$ui-colors-dark: \(/)
  assert.match(content, /bg: #0f172a;/)
  assert.match(content, /text: #e2e8f0;/)
  // 验证浅色模式 Map
  assert.match(content, /\$ui-colors-light: \(/)
  assert.match(content, /bg: #f9fafb;/)
  assert.match(content, /text: #0f172a;/)
  // 验证便捷变量
  assert.match(content, /\$ui-bg: #0f172a;/)
  assert.match(content, /\$ui-text: #e2e8f0;/)
  // 验证间距
  assert.match(content, /\$ui-spacing: \(/)
  assert.match(content, /xs: "4px";/)
  assert.match(content, /md: "12px";/)
})

// ==================== generateTsTokens 测试 ====================
test("generateTsTokens: 生成 TypeScript 令牌文件", () => {
  const lightColors = { bg: "#f9fafb", text: "#0f172a" }
  const darkColors = { bg: "#0f172a", text: "#e2e8f0" }

  captureConsole(() => generateTsTokens(lightColors, darkColors))

  const tsEntry = writes.find((w) => w.filePath.includes("tokens.ts"))
  assert.ok(tsEntry, "应调用 writeFileSync 写 TS 文件")

  const content = tsEntry.content
  // 验证 interface 定义
  assert.match(content, /export interface MoongateTokens/)
  assert.match(content, /dark: Record<string, string>;/)
  assert.match(content, /light: Record<string, string>;/)
  // 验证暗色模式数据
  assert.match(content, /"bg": "#0f172a"/)
  assert.match(content, /"text": "#e2e8f0"/)
  // 验证亮色模式数据
  assert.match(content, /"bg": "#f9fafb"/)
  assert.match(content, /"text": "#0f172a"/)
  // 验证默认导出
  assert.match(content, /export default tokens/)
})

// ==================== generateDesignSystemDoc 测试 ====================
test("generateDesignSystemDoc: 生成设计系统文档", () => {
  const primitives = { "blue-500": "#3b82f6", white: "#ffffff" }
  const lightColors = { bg: "#f9fafb", text: "#0f172a" }
  const darkColors = { bg: "#0f172a", text: "#e2e8f0" }

  captureConsole(() =>
    generateDesignSystemDoc(primitives, lightColors, darkColors),
  )

  const mdEntry = writes.find((w) => w.filePath.includes("DESIGN_SYSTEM.md"))
  assert.ok(mdEntry, "应调用 writeFileSync 写设计系统文档")
  const content = mdEntry.content

  // 验证主要章节存在
  assert.match(content, /# Moongate 设计系统/)
  assert.match(content, /## 🎨 原始色值/)
  assert.match(content, /## 🏔️ 海拔系统/)
  assert.match(content, /## 🌙 浅色模式语义层/)
  assert.match(content, /## 🌑 深色模式语义层/)
  // 验证原始色值包含 blue-500 和 white
  assert.match(content, /blue-500/)
  assert.match(content, /white/)
})
