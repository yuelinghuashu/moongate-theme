import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..")

test("generate-better-comments.js: 成功生成 JSON 配置", () => {
  // 执行脚本
  execFileSync("node", ["scripts/generate-better-comments.js"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
  })

  // 验证输出文件存在且格式正确
  const outputPath = path.join(ROOT_DIR, "extras", "better-comments.json")
  assert.ok(fs.existsSync(outputPath), "better-comments.json 应被生成")

  const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8"))
  assert.ok(parsed["better-comments.tags"], "应包含 better-comments.tags 键")

  const tags = parsed["better-comments.tags"]
  assert.ok(Array.isArray(tags), "tags 应为数组")

  // 验证 6 个标准 tag 都存在
  const tagNames = tags.map((t) => t.tag)
  for (const expected of ["TODO", "FIXME", "NOTE", "HACK", "BUG", "XXX"]) {
    assert.ok(tagNames.includes(expected), `应包含 ${expected} tag`)
  }

  // 验证每个 tag 都有合法颜色
  for (const tag of tags) {
    assert.match(tag.color, /^#[0-9a-fA-F]{6}$/, `${tag.tag} 的颜色为合法 hex`)
  }
})

test("generate-better-comments.js: tag 与语义层颜色一致", () => {
  // 执行脚本
  execFileSync("node", ["scripts/generate-better-comments.js"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
  })

  const outputPath = path.join(ROOT_DIR, "extras", "better-comments.json")
  const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8"))
  const tags = parsed["better-comments.tags"]

  const tagMap = {
    TODO: "warning",
    FIXME: "error",
    NOTE: "highlight",
    HACK: "purple",
    BUG: "error",
    XXX: "warning",
  }

  // 从深色语义层读取对应变量（通过解析脚本本身验证映射）
  const darkSemantics = yaml.load(
    fs.readFileSync(path.join(ROOT_DIR, "src", "core", "semantics", "dark.yaml"), "utf8"),
  )
  const primitives = yaml.load(
    fs.readFileSync(path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"), "utf8"),
  )

  // 解析 `{token}` 引用得到最终色值
  const resolveColor = (value) => {
    if (typeof value !== "string") return value
    return value.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
      if (key in primitives) return resolveColor(primitives[key])
      return match
    })
  }

  for (const tag of tags) {
    const semanticKey = tagMap[tag.tag]
    assert.ok(semanticKey, `${tag.tag} 有对应的语义键`)
    const semanticValue = darkSemantics[semanticKey]
    assert.ok(semanticValue, `语义键 ${semanticKey} 存在于 dark.yaml`)
    const expectedColor = resolveColor(semanticValue)
    assert.equal(tag.color, expectedColor, `${tag.tag} 的颜色应与 ${semanticKey} 一致`)
  }
})