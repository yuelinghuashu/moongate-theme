import path from "node:path"
import { fileURLToPath } from "node:url"

// 当前文件位于 scripts/lib/ 下，因此项目根目录是 ../../..
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 项目根目录
 *
 * 可用环境变量 MOONGATE_ROOT 覆盖 —— 供测试/试运行指向一个临时目录，
 * 从而在不改动本仓库的前提下验证构建的成功/失败路径（见 test/build-pipeline.test.js）。
 */
export const ROOT_DIR = process.env.MOONGATE_ROOT
  ? path.resolve(process.env.MOONGATE_ROOT)
  : path.resolve(__dirname, "..", "..")

export const PATHS = {
  primitives: path.join(ROOT_DIR, "src", "core", "primitives", "colors.yaml"),
  semanticsDir: path.join(ROOT_DIR, "src", "core", "semantics"),
  layout: path.join(ROOT_DIR, "src", "core", "layout.yaml"),
  workbench: path.join(ROOT_DIR, "src", "workbench.yaml"),
  semantic: path.join(ROOT_DIR, "src", "semantic.yaml"),
  langDir: path.join(ROOT_DIR, "src", "languages"),
  specialDir: path.join(ROOT_DIR, "src", "special"),
  outputDir: path.join(ROOT_DIR, "themes"),
  docsDir: path.join(ROOT_DIR, "docs"),
}