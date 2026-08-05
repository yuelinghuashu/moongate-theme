import path from "node:path"
import { fileURLToPath } from "node:url"

// 当前文件位于 scripts/lib/ 下，因此项目根目录是 ../../..
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = path.resolve(__dirname, "..", "..")

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