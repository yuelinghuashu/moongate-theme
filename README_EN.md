[![Version](https://img.shields.io/github/package-json/v/yuelinghuashu/moongate-theme)]()
[![Marketplace](https://img.shields.io/badge/vscode-marketplace-brightgreen)]()

[🇨🇳 中文版](./README.md) | English

---

# 🌙 Moongate Theme

> From blog to editor, let your code rest in moonlight

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

- **Primary**: Cool lunar blue (dark `#3b82f6` / light `#0284c7`)
- **Background**: Night sky `#0f172a` / moon white `#f9fafb`
- **Elevation**: Four lightness steps (`surfaceGround` → `surfaceRaised` → `surfaceFloating` → `surfaceTooltip`)
- **Design tokens**: DTCG‑based, auto‑generates CSS variables for cross‑platform reuse

## 🧠 Core Optimizations

| Optimization                     | How Moongate Fixes It                                           |
| -------------------------------- | --------------------------------------------------------------- |
| **Day‑Night Consistency**        | Same hue, different lightness – seamless switching              |
| **Function Def/Call Separation** | Definitions bold, calls not – unified across Go, Python, JS, TS |
| **JSON Nesting Depth**           | Blue → Cyan → Purple gradient – levels at a glance              |
| **UI Physical Depth**            | Elevation system – natural "paper stack" effect                 |
| **Design System Unity**          | DTCG tokens – one color language across all products            |

## ✨ v2.5.0 Highlights

- **⚛️ React JSX/TSX rules added**: New `jsx.yaml` — custom components in moon yellow bold, React Hooks in purple italic, embedded expressions in glowing blue, visually symmetric with Vue rules
- **🧩 Modern VS Code UI coverage**: 149 modern UI keys added — Sticky Scroll, AI Chat / Inline Chat, Command Center, Terminal Command Guide, Ghost Text / Unicode highlighting, Comments / Ports, and Symbol Icons — all referencing semantic variables

[📜 View full changelog](./CHANGELOG_EN.md)

## 📐 Design System

Moongate is built on the DTCG design token standard, providing complete color, layout, typography, breakpoint, and z-index tokens.
👉 [View full documentation](./docs/DESIGN_SYSTEM.md)
👉 [Read the Moongate Visual Contract (monitor calibration guide)](./extras/VISUAL_CONTRACT_EN.md)

## ⚙️ Recommended Setup

### Semantic Highlighting

After installing Moongate, semantic highlighting is **automatically enabled** – no manual setup required. If you encounter issues, verify:

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### Better Comments

Merge `extras/better-comments.json` into `better-comments.tags` in your VS Code settings.

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
