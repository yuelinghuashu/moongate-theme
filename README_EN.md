# 🌙 Moongate Theme

> From blog to editor, let your code rest in moonlight

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/yuelinghuashu/moongate-theme" alt="Version">
  <img src="https://img.shields.io/badge/vscode-marketplace-brightgreen" alt="Marketplace">
  <img src="https://img.shields.io/badge/languages-18-brightgreen" alt="Languages">
  <img src="https://img.shields.io/badge/WCAG-AA%20%26%20AAA-blue" alt="WCAG">
  <img src="https://img.shields.io/badge/Dark%20%26%20Light-both-8A2BE2" alt="Dark & Light">
  <img src="https://img.shields.io/badge/Semantic%20Highlighting-on-purple" alt="Semantic Highlighting">
  <img src="https://img.shields.io/badge/tests-83%20passing-brightgreen" alt="Tests">
</p>

[🇨🇳 中文版](./README.md) | English

---

Moongate is a VS Code theme born from [moongate.top](https://moongate.top), bringing the same visual language into your code editor.

## 📸 Preview

| Language   | Dark                                                                                                       | Light                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| JavaScript | ![JS Dark](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/javascript-dark.png) | ![JS Light](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/javascript-light.png) |
| Python     | ![Python Dark](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/python-dark.png) | ![Python Light](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/python-light.png) |
| Go         | ![Go Dark](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/go-dark.png)         | ![Go Light](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/go-light.png)         |
| Vue        | ![Vue Dark](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/vue-dark.png)       | ![Vue Light](https://raw.githubusercontent.com/yuelinghuashu/moongate-theme/main/images/vue-light.png)       |

## ✨ Design Philosophy

- **Soft as moonlight**: Easy on the eyes
- **Clear boundaries**: Distinct visual hierarchy
- **Day & night**: Thoughtfully balanced dark/light themes
- **Physical elevation**: Sidebars lift, popups float, editor recedes
- **Engineering calibration**: All colors pass WCAG contrast validation

## 🎨 Color System

- **Primary**: Cool lunar blue (dark `#3b82f6` / light `#1e40af`)
- **Background**: Night sky `#0f172a` / moon white `#f9fafb`
- **Elevation**: Four lightness steps (`surfaceGround` → `surfaceRaised` → `surfaceFloating` → `surfaceTooltip`)
- **Design tokens**: DTCG-inspired three-layer tokens (primitives → semantics → components), auto‑generates CSS variables for cross‑platform reuse

## 🧠 Core Optimizations

| Optimization                      | How Moongate Fixes It                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Day‑Night Consistency**         | Same hue, different lightness – seamless switching                                                                                                                       |
| **Function Def/Call Separation**  | Definitions bold, calls not – unified across C/C++, Go, Java, C#, Python, Rust, JS, TS                                                                                   |
| **No Unstyled UI Surfaces**       | Key coverage is diffed against VS Code's default themes (357 keys) and quantified in the generated `docs/COVERAGE.md` – no surface silently falls back to default colors |
| **Dark/Light Parity**             | Build-time enforcement that each syntax role keeps the same distinctness structure in both modes (light no longer merges function names with types)                      |
| **Python Docstring Highlighting** | Bundled injection grammar: Sphinx field list (`:param:` / `:type:` / `:raises:`), Google / NumPy sections and inline reST – matching the JSDoc look in TS                |
| **JSON Nesting Depth**            | Blue → Cyan → Purple gradient – levels at a glance                                                                                                                       |
| **UI Physical Depth**             | Elevation system – natural "paper stack" effect                                                                                                                          |
| **Design System Unity**           | DTCG-inspired tokens – one color language across all products                                                                                                            |

## ✨ v2.8.0 Highlights

- **🚨 Visibility fixes** — input-validation text was undefined and fell back to 1.10–3.24:1 (now 4.81–10.69:1); the light status-bar prominent item was white-on-white at 1.00:1 (now 17.85:1)
- **🧭 UI key coverage** — aligned with VS Code's default themes: 100+ new keys (current-line highlight, indent guides, overview ruler, diff line tints, Markdown/hover surfaces, modern AI/Agents surfaces), uncovered keys 173 → 37 (the rest deferred by choice and tracked)
- **🎨 Dark/light parity** — light `highlight` split from `function` (both were `#0369a1`); light `gitAdded` 3.61:1 → 5.25:1
- **📝 Python docstring highlighting** — bundled injection grammar for Sphinx field lists (`:param:` / `:type:` / `:raises:`), Google / NumPy sections and inline reST
- **🔬 Stronger validation & tests** — fallback readability, dark/light distinctness parity, dead-key detection, cross-repo token contract snapshot, artifact consistency; assertions 141 → 181
- **🤝 Ecosystem sync** — CSS/SCSS/TS tokens synced to moongate-vue (light `--ui-highlight` / `--ui-git-added` changed)

[📜 View full changelog](./CHANGELOG_EN.md)

## 📐 Design System

Moongate is built on DTCG-inspired design tokens, providing complete color, layout, typography, breakpoint, and z-index tokens.
👉 [View full documentation](./docs/DESIGN_SYSTEM.md)
👉 [Read the Moongate Visual Contract (monitor calibration guide)](./extras/VISUAL_CONTRACT_EN.md)
👉 [SCSS tokens for Sass projects](./themes/_tokens.scss)
👉 [TypeScript tokens for front-end projects](./themes/tokens.ts)

## 🏗️ Engineering Build

Moongate is not hand-written JSON — it's an industrial-grade build pipeline driven by **DTCG-inspired tokens + YAML semantic layers**:

```text
┌─────────────────────────────────────────────────────┐
│                  Source Files (src/)                 │
│  primitives/colors.yaml   Semantics (dark/light)     │
│  workbench.yaml   languages/*.yaml   semantic.yaml    │
└─────────────────────────┬───────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────┐
│              scripts/build.js Automation             │
│  ✔ Token resolution + variable substitution          │
│  ✔ Token merging (deduplicates identical rules)      │
│  ✔ WCAG contrast validation (built-in QA)            │
│  ✔ Structural integrity checks                       │
└─────────────────────────┬───────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────┐
│              Generated Artifacts (themes/)           │
│  JSON themes (dark/light)  CSS vars  SCSS  TS tokens │
│  Design system docs (DESIGN_SYSTEM.md)               │
└─────────────────────────────────────────────────────┘
```

### Quality Assurance

| Tool                            | Purpose                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `node scripts/build.js`         | One-command build of all artifacts                                                           |
| `node scripts/verify-scopes.js` | Auto-verifies language scopes against VS Code's built-in grammars                            |
| `pnpm test`                     | 181 automated assertions (artifacts / semantic precedence / grammar tokenization / coverage) |
| `pnpm run check:artifacts`      | Rebuilds and verifies committed artifacts are in sync (no forgotten rebuilds)                |
| `pnpm run check:contract`       | Cross-repo token contract: names only ever added, CSS/SCSS/TS in agreement                   |
| `pnpm run sync:color-ids`       | Refreshes the known-VS Code-color-id table (catches typos / dead keys)                       |
| `pnpm test`                     | 83 automated tests (tokens/generators/validators/scopes)                                     |

### Local Development

```bash
pnpm install
pnpm run build      # Build all theme artifacts
pnpm test           # Run all automated tests
pnpm run dev        # Watch source files and rebuild automatically
```

> 🌙 **Why not hand-write JSON?** Because a hand-written theme can only change color values — it can't evolve its _visual system_. With a token-driven theme, changing one semantic variable (e.g., `primary`) propagates across the entire theme, never drifting out of sync.

## ⚙️ Recommended Setup

### Semantic Highlighting

After installing Moongate, semantic highlighting is **automatically enabled** – no manual setup required. If you encounter issues, verify:

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### Better Comments

After installing Moongate, special comments in the Better Comments extension (TODO, FIXME, NOTE, HACK, BUG, XXX) **automatically use Moongate's official colors** — zero configuration required.

## ☕ Support This Theme

If Moongate Theme makes your coding time more enjoyable, consider buying me a coffee — it motivates me to keep refining the color palette, supporting more languages, and maintaining the theme long-term.

<details>
<summary>👈 Click to reveal sponsorship options</summary>

<img src="./assets/ali-pay.jpg" width="200" height="280" alt="Alipay QR Code" />
<img src="./assets/wechat-pay.jpg" width="200" height="280" alt="WeChat QR Code" />

> Sponsorship funds will go toward theme maintenance, new language support, and color optimization. Thank you for your kindness ❤️

</details>

---

[⬆ Back to top](#)
