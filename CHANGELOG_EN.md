# Changelog

[🇨🇳 中文版](./CHANGELOG.md) | English

## [2.7.1] - 2026-09-06

### 🎨 Semantic Text Hierarchy Refactor (Light)

- **Normalized gray ramp**: re-ordered into a strictly monotonic 15-step scale (`gray-525 → gray-350`, `gray-550 → gray-450`, new `gray-550 #55647c`) — step numbers now always track brightness; removed 8 dead primitives (`blue-900/green-700/yellow-500/red-500` etc.) and fixed stale comments; builds are warning-free.
- **Light role de-collapse**: the previous collapse where `comment/textMuted/textDim/variableDim/operator` all equaled `#475569` is fixed — `comment` → `#55647c` (5.7:1), `operator` & `punctuation` share `#64748b`, `textMuted` → `#64748b` (4.55:1, keeps property/namespace code roles readable), `textInactive` → `#7a8c9e` (2.45:1 → 3.31:1, now compliant).
- **Readable light terminal ANSI**: `ansiWhite`/`ansiBrightWhite` moved from near-white to ink grays (≥4.5:1); all bright variants now use readable lighter variants (≥3:1); black-family contrast exemption documented.
- Dark syntax & text colors are effectively unchanged (operator shifts < ΔE1); deeper interactive solid backgrounds are covered in the next bullet.
- **Dark interactive contrast fix**: new semantic roles `primarySolid` (dark `#2563eb` / light `#1e40af`) and `selectionForeground` (dark white / light ink); small-white-text solid backgrounds (buttons/menus/badges/input options/activity bar badge/extensions) and list/suggest/tab selection foregrounds now use them — dark white-on-solid 3.68:1 → 5.17:1, selection foreground 4.19:1 → 5.17:1; light unchanged.

### 🛠️ Engineering Checks

- **Cross-rule scope conflict detection** in `verify-scopes.js` (same scope with different settings → error); fixed `keyword.channel.go` living in two Go rules; validator now matches scope atoms inside combined grammar names (fixes the CSS `support.type.property-name.css` false positive).
- **Layer-reference enforcement**: direct primitive refs in component/rule layers, `${var}` or non-primitive refs inside the semantic layer → build fails with guidance.
- **No raw hex in consumer layers**: leftover `editorUnnecessaryCode.opacity: #00000022` moved to semantic role `codeDim` (`{black}22`); literal hex colors in consumer layers now fail the build.
- **Extended WCAG matrix**: `textInactive` ≥3:1, full ANSI terminal check (white ≥4.5:1), dark/light semantic key parity, and a **UI interactive pair matrix** (white-on-solid & selection-foreground-on-selected-bg ≥4.5:1, alpha-composited); generated CSS variable names stay stable (this release only adds the `primarySolid` / `selectionForeground` / `codeDim` roles).
- Single `toCssKey` in generators; new `docs/TOKEN_CONVENTIONS.md` (naming, alias registry, exemptions).

### 🤝 Ecosystem Sync

- Regenerated `themes/*` and synced `moongate-vue`: `src/styles/tokens/colors.css` updated, component fallbacks (`--ui-text-inactive`) aligned, `design-tokens.md` table refreshed; `check-tokens.ts` and full build pass, `dist/style.css` rebuilt.
- Wording unified: README/badges now say "DTCG-inspired" instead of "DTCG standard" (custom YAML token pipeline, not full DTCG `$type/$value`).

---

## [2.7.0] - 2026-08-19

### 🚀 3 New Languages Added

- **C/C++** (`cpp.yaml`): Preprocessor directives (`#include`/`#define`), pointer & reference operators, template types, class/struct/enum declarations, constructor/destructor, namespace, `this` pointer, scope resolution `::`, `const` modifier, lambda captures, format specifiers, escape characters. 37 scopes all verified against VS Code built-in grammars.
- **Java** (`java.yaml`): Annotations (`@Override` etc.), generics `<T>`, class/enum/record declarations, `this` keyword, packages & imports, primitive types, inheritance/sealed modifiers, Javadoc comments, escape characters. 23 scopes all verified.
- **C#** (`csharp.yaml`): Attributes (`[Serializable]`), generics, class/struct/enum/record/delegate declarations, `this` keyword, namespaces, preprocessor directives, LINQ query keywords, delegates/events, string interpolation, discard variables. 45 scopes all verified.

### 🎨 WCAG Contrast Full Audit & Fixes

- **4 semantic roles below standard now fixed** — Light: `punctuation` (2.45:1 → 4.55:1), `primary` (3.92:1 → 8.35:1), `success` (3.61:1 → 5.25:1); Dark: `operator` (2.36:1 → 5.32:1). Added `blue-950`, `green-800`, `gray-450` primitives.
- **tokenColors layer fully audited** — All 24 syntax highlighting colors checked against editor background. Fixed HTML Doctype using `${border}` (nearly invisible: dark 1.49:1 → 5.16:1, light 1.42:1 → 7.25:1), switched to `${textMuted}`.
- **Build-time WCAG validation expanded**: `checkContrast` now covers 13 foreground roles (up from 3), preventing contrast regressions.

### 🐛 Build Script Fixes

- **Fixed `replaceVariables` losing `primitiveKeys` in recursion**: Architecture-pollution detection now works correctly at all nesting levels.
- **Eliminated redundant file reads in build pipeline**: Pre-loaded semantics passed directly to `buildSingleTheme`; layout tokens loaded once for CSS/SCSS generation.

### 🛠️ Code Quality

- Merged duplicate `normalizeHex` branches, removed redundant depth check in `resolveTokens`, `getThemeInfo` reuses `ROOT_DIR`.
- `scopeMatches` wildcard regex caching added to reduce redundant compilation.

---

<details>
<summary>## [2.6.0] - 2026-08-05</summary>

### 🚀 3 New Languages Added

- **Shell/Bash** (`shell.yaml`): Control keywords, built-in commands, command calls, variable assignment, positional/special variables, command substitution (`$(...)` / backticks), here-doc / here-string, arrays & associative arrays, arithmetic, `case` / `while` / `select` / `trap`, and more.
- **Dockerfile** (`dockerfile.yaml`): `FROM`/`AS` instructions, control instructions (`COPY`/`ADD`/`ARG`/`CMD`/`ENTRYPOINT`/`ENV`/`EXPOSE` etc.), JSON array syntax, escape characters, comments & TODO markers.
- **SQL** (`sql.yaml`): DML / DDL keywords, aggregation functions, operators, storage modifiers, numbers, text variables, strings & comments.

### 🎨 Comprehensive Scope Fixes (8 Language Files)

- **New `verify-scopes.js` tool**: Automatically parses VS Code built-in TextMate grammars and cross-checks every scope in language configs — eliminating "rules don't match" issues.
- **JSX/TSX**: Fixed the critical `.js.jsx` suffix for `.jsx` files (e.g., `support.class.component.js.jsx`) vs `*.tsx` suffix; fixed React Hooks / Fragment / entity character scopes.
- **Python**: Fixed `meta.decorator.python` → `meta.function.decorator.python`; added `self`/`cls` special variables, f-string & format placeholder rules.
- **Rust**: Fixed 21 non-existent scopes (lifetime → `entity.name.type.lifetime.rust`, `support.macro.rust` → `entity.name.function.macro.rust`, `support.self.rust` → `variable.language.self.rust`, etc.); added struct/enum/trait declarations, primitive types, Option/Result rules.
- **CSS**: Fixed `source.css variable` → `variable.css`, `meta.function.css variable` → `meta.function.variable.css`; added class/ID selectors, color values, numbers, built-in functions (calc/url/gradient) rules.
- **Go**: Completely rewritten — removed 20 non-existent scopes (`entity.name.package.go`, `storage.type.pointer.go`, `constant.language.nil.go`, etc.), replaced with verified `keyword.struct.go` / `keyword.interface.go` / `entity.name.type.*` / `variable.parameter.go`.
- **Markdown**: Fixed heading scopes (`heading.1.markdown`–`heading.6.markdown`), fenced code blocks (`markup.fenced_code.block.markdown`), language identifiers (`fenced_code.block.language.markdown`); added quote/strikethrough/link rules.
- **HTML**: Fixed doctype (`meta.tag.metadata.doctype.html`), removed non-existent scopes, added tag punctuation & inline tag rules.

### 📦 Cross-Platform Token Artifacts

- **New `_tokens.scss`**: Sass color Maps (`$ui-colors-dark` / `$ui-colors-light`), spacing Map, dark-mode convenience variables.
- **New `tokens.ts`**: Typed TypeScript exports (`MoongateTokens` interface + `tokens` object).
- Both generated automatically by `build.js`, synced with `moongate-colors.css` / `DESIGN_SYSTEM.md`.

### 🛠️ Build Script Engineering Improvements

- **Fixed architecture detection**: `replaceVariables` now correctly passes `primitiveKeys`, re-enabling the architecture-pollution warning for direct primitive references in semantic layers.
- **Removed code duplication**: `generate-better-comments.js` now reuses `resolveTokens` from `scripts/lib/tokens.js`, unifying circular-reference detection logic.
- **Refactored `build.js`**: Split the 196-line `main()` into 10 single-responsibility functions (file loading, rule scanning, theme building, validation, etc.) for easier testing and maintenance.
- **Unified error handling**: Validation now throws errors (new `ThemeValidationError` class) instead of calling `process.exit` directly, making library functions reusable in non-CLI contexts.
- **Token merge stability**: `mergeTokenColors` now sorts settings keys, preventing duplicate rules from key-order differences (e.g., `{foreground, fontStyle}` vs `{fontStyle, foreground}`).
- **Extracted duplicate color detection**: `detectDuplicateColors` is now a standalone reusable, testable utility.

### 🧪 Significantly Better Test Coverage

- **Tests increased from 54 → 72**: Added generators (CSS/design system docs/SCSS/TS tokens) and Better Comments generator tests.
- **New `test/helpers.js`**: Shared utilities for capturing console output and asserting error behavior, eliminating monkey-patch redundancy in tests.
- **Better Comments works out of the box**: The theme includes 6 special-comment scope rules from `src/special/better-comments.yaml` (TODO, FIXME, NOTE, HACK, BUG, XXX) — Better Comments automatically uses Moongate's official colors after installation, zero configuration required. The standalone `extras/better-comments.json` preset is auto-generated via `pnpm run gen:better-comments` for users who want the colors without installing the theme; new tests verify a 1:1 match with dark semantics.
- **Utility boundary coverage**: `normalizeHex` invalid-format errors, `detectDuplicateColors` duplicate/clean scenarios, etc.

</details>

---

<details>
<summary>⚛️ v2.5.0 - 2026-08-05 · React JSX/TSX & 149 Modern UI Keys</summary>

### ⚛️ React JSX/TSX Rules Added

- **New `jsx.yaml` language config**: Dedicated theming for React custom components, attributes/props, embedded expressions, hooks, and fragments — filling the gap for "React support" claimed in the README.
- **Custom components vs native HTML**: Custom components (capitalized) use moon yellow bold (`#fbbf24` bold), while native HTML tags remain red — component structure instantly recognizable, honoring the v1.2.0 design language.
- **React Hooks semantically styled**: `useState`, `useEffect`, etc. use purple italic (`#c084fc` italic) — consistent with decorators/macros, instantly identifying React-specific APIs.
- **Embedded expressions symmetric with Vue**: `{}` embedded expressions and fragment tags in JSX/TSX use glowing blue (`#7dd3fc`), visually symmetric with Vue interpolation rules.
- **One file covers both**: Since VS Code's TS/JS grammar shares the `*.jsx` scope suffix between `.jsx` and `.tsx`, a single `jsx.yaml` covers both JSX and TSX.

### 🧩 Modern VS Code UI Coverage

- **Added 149 modern UI keys** (~43% of all 348 UI colors): Covering Sticky Scroll variants (editor/panel/sidebar/terminal/output/peek), AI Chat / Inline Chat plus Copilot & agent session indicators, Command Center, Terminal Command Guide, Ghost Text / Unicode highlighting, Comments / Ports, Symbol Icons, Lightbulb (incl. AI), multi-cursor, unnecessary code, status bar error/warning/offline states, tab selected states, Radio/Checkbox/Banner, and more.
- **All referencing semantic variables**: Sticky Scroll uses the raised layer, AI chat floats, and symbol icons map to theme semantic colors by type (functions glowing blue, classes moon yellow, strings moonflower green, generics cyan, etc.) — fully unified with the existing design language.
- **Fixed jarring default fallback colors**: Previously these areas fell back to VS Code defaults (e.g., default blue) under Moongate; they now blend seamlessly with the moon-shadow-gray foundation.
- **engines upgraded**: Minimum VS Code version raised from `^1.109.0` to `^1.130.0` to ensure new keys (Chat/Copilot, Sticky Scroll variants, etc.) work properly.

</details>

---

<details>
<summary>🧹 v2.4.0 - 2026-07-04 · Language Refinement, Rust & TS Consistency</summary>

### 🧹 Language Configuration Refinement

- **Comprehensive deduplication of language configs**: Removed rules that duplicate `base.yaml` across all language files. Each language file now only contains syntax rules unique to that language, significantly reducing maintenance overhead.
  - Python: 9 → 4 rules (56% reduction)
  - CSS: 8 → 4 rules (50% reduction)
  - HTML: 6 → 5 rules (17% reduction)
  - Go: 21 → 18 rules (14% reduction)
- **Core principle**: Common rules already in `base.yaml` (keywords, strings, comments, operators, variables, etc.) are no longer duplicated in language files.
- `javascript.yaml` and `typescript.yaml` remain empty, fully inheriting from `base.yaml`.

### 🦀 New Rust Language Support

- **Added dedicated Rust language rules**: Created `rust.yaml` configuration covering Rust‑specific syntax elements — generic parameters, lifetimes, attributes, macros, the `Self` keyword, and more.
- **Rust function styling**: Rust's TextMate grammar uses the same scope (`entity.name.function.rust`) for both function definitions and calls, making them indistinguishable. All Rust functions (both definitions and calls) are now **unified as bold** — consistent with Go's approach, accepting the inherent limitation of the grammar.
- **Type system coloring**: Generic parameters and lifetimes use cyan accents; attributes use purple italic, maintaining harmony with the theme's overall palette.

### 🎯 TypeScript Built‑in Object Visual Consistency

- **Fixed unexpected `JSON` bolding**: Removed the bold style from `variable.other.constant` in `base.yaml`, ensuring all TypeScript built‑in objects (`JSON`, `console`, `Math`, etc.) share a consistent visual style — no more isolated bolding.
- **Removed `*.defaultLibrary` bolding**: Semantic highlighting no longer forces bold on all default library symbols, aligning with Go and Python's handling of built‑in functions for consistent cross‑language behavior.

### 📦 Build Script Optimizations

- **Token merging enhancement**: The build script now automatically merges token rules with identical `settings` (color + style), significantly reducing the size of generated JSON theme files.
  - `tokenColors` rules reduced from ~89 to ~34 — a **62% decrease**
  - Theme JSON file size reduced by approximately **16%**
  - Build output now shows merge statistics: `📦 token merged: 89 → 34 rules`

</details>

---

<details>
<summary>🧩 v2.3.0 - 2026-06-24 · Go Deep Dive & Python Fix</summary>

### 🧩 Go Language Syntax Highlighting Deep Dive

- **Dedicated language rules**: Added a standalone `go.yaml` configuration covering Go‑specific syntax elements — package names, method receivers, labels, blank identifiers, error variables, and more — making code semantics clear at a glance.
- **Visual separation of definition and calls**: Function definitions use glowing blue with bold weight, establishing a clear visual hierarchy alongside keywords. All function calls (including standard library `fmt.Sprintf` and built‑ins like `len`) remain glowing blue without bold, delivering a "definitions stand out, calls stay light" reading experience. Since Go's TextMate grammar cannot distinguish custom calls from standard library calls, both are left un‑bolded — sacrificing standard library emphasis in exchange for a clear distinction between definitions and calls.
- **Expressive type system**: Structs, interfaces, type aliases, pointers, slices, and maps each receive distinct colors, enabling instant type identification.
- **Error handling spotlight**: Error variables (e.g., `ErrInvalidInput`) are styled in red italic, making failure paths quickly discoverable.
- **Concurrency primitive highlighting**: Channel operations (`<-`) and keywords like `select` and `go` are correctly colored, improving readability of concurrent code.
- **Format specifier highlighting**: Placeholders like `%d` and `%s` in `fmt.Printf`-style functions are highlighted in glowing blue, consistent with embedded template expressions in strings.

### 🐍 Python Function Call Fix

- **Fixed Python function call recognition**: Python function calls now correctly distinguish definitions from calls — the `meta.function-call.python` scope is now properly matched, and function calls no longer appear bold, consistent with other languages.

### 🔧 Cross‑Language Consistency

- Unified function name styling across all languages: **function definitions are bold, function calls are not** — now consistent across JavaScript, TypeScript, Python, and Go, forming a cohesive visual language system.

### 📦 Engineering Improvements

- **Semantic highlighting auto‑enabled**: Added `configurationDefaults` to `package.json` — semantic highlighting now activates automatically upon theme installation, no manual setup required.
- **Marketplace presentation polish**: Added `galleryBanner` and `badges` configuration for a more professional appearance in the VS Code extension marketplace.

</details>

---

<details>
<summary>🎨 v2.2.0 - 2026-03-27 · DTCG Tokens & Elevation System</summary>

### 🎨 DTCG Design Token Standard: From Theme to Design System

- **Three‑layer architecture**: Primitives, Semantics, and Components – color management is now fully standardized. Primitives use hue‑lightness naming (e.g., `blue-500`, `gray-900`), semantics define roles (e.g., `primary`, `bg`), and components map directly to UI elements.
- **Automated design assets**: The build script now generates `moongate-colors.css` (CSS variables) and `DESIGN_SYSTEM.md` (complete design system documentation) – one source of truth for blogs and UI component libraries.
- **Cross‑platform ready**: All color variables can be exported as CSS, SCSS, or JavaScript modules, laying the foundation for future multi‑platform expansion.

### 🏔️ Elevation System Refinements

- **Light mode “higher = brighter”**: Sidebars (`surfaceRaised`) now use pure white `#ffffff`, while the editor background (`surfaceGround`) remains cool‑white `#f9fafb`, creating a crisp paper‑stack effect. Floating elements (`surfaceFloating`) use `#f1f5f9` with a semi‑transparent primary border for sharper boundaries.
- **Dark mode layering enhanced**: Sidebar brightness increased from `#131c31` to `#1a2538`, popups from `#1e293b` to `#25364a`, making the visual hierarchy more pronounced.
- **Terminal readability fix**: In light mode, `ansiWhite` is now light gray `#e2e8f0` to prevent white text from disappearing against the light background.

### 🛠️ Industrial‑Grade Build Script

- **Color normalization**: Automatically expands 3‑digit/4‑digit Hex, validates illegal color values, and ensures all colors comply with 6‑digit or 8‑digit hex standards.
- **Circular reference detection**: Token nesting exceeding 20 levels triggers a fatal error with the reference chain, preventing infinite loops.
- **Alpha safety net**: Intelligently detects `rgba()`, 8‑digit hex with transparency, and avoids illegal concatenation.
- **WCAG contrast validation**: Automatically checks critical text roles (body, secondary, comment, etc.) against WCAG AA standards – any failure halts the build, guaranteeing legibility under all conditions.

### 📄 Engineering Documentation & Assets

- **`moongate-colors.css`**: Automatically generated CSS variables for blogs and UI component libraries, enabling seamless dark/light mode switching.
- **`DESIGN_SYSTEM.md`**: A complete design system document including color swatches, elevation system explanations, and contrast data – serving as the single source of truth for teams.

</details>

---

<details>
<summary>✨ v2.1.0 - 2026-03-14 · Elevation System</summary>

### ✨ Elevation System: Giving the Interface Physical Depth

- **Introduced elevation variables**: Added `surfaceGround`, `surfaceRaised`, `surfaceFloating`, and `surfaceTooltip` – a four‑layer elevation ladder that gives the UI a clear physical hierarchy.
- **Dark mode**: Secondary areas like the sidebar and activity bar (`surfaceRaised`) are now about 5% brighter than the editor background (`surfaceGround`), creating a subtle “raised panel” feel. Floating elements such as menus and notifications (`surfaceFloating`) are another 5% brighter and feature a semi‑transparent primary‑color border (`borderFloating`) for sharper boundaries.
- **Light mode**: Following the gravity‑compensation principle, secondary areas are about 3% darker than the editor background, and floating layers another 3% darker. This achieves an elegant “paper stack” separation without sacrificing translucency.
- **Full UI coverage**: Mapped elevations to 20+ areas including the sidebar, activity bar, status bar, input fields, dropdowns, notifications, and quick pick – elevating the entire visual hierarchy.

</details>

---

<details>
<summary>🌗 v2.0.0 - 2026-03-11 · The Gemini Release</summary>

### 🌗 The Gemini Release: Engineering Overhaul & Light Theme

- **Moongate Light (Dawn Mode)**: Deeply optimized for light backgrounds using the “gravity compensation” principle. Cool‑toned base `#f9fafb`, semantic colors precisely lightness‑mapped, maintaining 1:1 visual weight with the dark version.
- **Modular architecture**: Upgraded from a monolithic JSON to a YAML‑based modular system, with centralized variables and one‑click multi‑theme generation.
- **Build script introduced**: A Node.js script (`scripts/build.js`) now automatically merges YAML sources, replaces color variables, and produces the final theme JSON—eliminating manual maintenance chaos.

### ✨ Color System Refactor

- **1:1 variable mapping**: Dark and light versions share identical variable names; rule files like `workbench.yaml` remain unchanged, automatically adapting when switching themes.
- **Semantic consistency**: Every syntactic role (keywords, strings, functions, etc.) maintains the same color role across both themes—no relearning needed.
- **Variable replacement safety net**: The build script intelligently handles transparency suffixes, automatically detecting if a variable already contains alpha, preventing invalid color values.

### 🔷 JSON Nesting Color Optimization

- **Blue → Cyan → Purple gradient**: Top‑level keys use primary blue (`primary`), second level uses cyan (`cyan`), third level uses purple (`purple`). Nesting depth is instantly visible, while avoiding red/yellow hues that could cause semantic confusion.
- **Clearer structure**: Complex configuration files can now be navigated quickly by color.

### 🎨 UI Polish

- **Light mode interaction feedback**: Hover backgrounds, selection backgrounds, borders, etc., fine‑tuned for light backgrounds, preserving the “silent awakening” interaction philosophy.
- **Scrollbar opacity**: Optimized scrollbar slider opacity in light mode—visible but not glaring.
- **Terminal ANSI color sync**: The 16‑color terminal palette is now synchronized with the light version, matching editor colors.

### 📦 Engineering Build System

- **Standardized directory structure**: Source code now resides in `src/`, organized into `core/`, `languages/`, `special/`, `workbench.yaml`, and `semantic.yaml`.
- **Automatic language rule scanning**: The build script automatically loads all YAML files from `languages/` and `special/`—no more manual rule list maintenance.
- **Intelligent output filename sanitization**: Theme filenames are generated from the `package.json` `name` (e.g., `moongate-dark.json`, `moongate-light.json`), with redundant `-theme` suffixes stripped.
- **Enhanced error handling**: If critical files are missing or YAML format is invalid, the script provides clear error messages and exits safely, preventing incomplete builds.

### 🧠 Design Philosophy Documented

- **The Moongate Visual Contract**: A detailed visual contract now accompanies the theme, explaining core design principles such as cool‑toned base, gravity compensation, and semantic mapping—plus a monitor calibration guide for optimal experience (located in the `extras/` directory).
- **P1–P5 Engineering Protocol**: A problem‑complexity grading system has been introduced, marking blog posts by difficulty (P1–P5), to be gradually integrated into the documentation ecosystem.

</details>

---

<details>
<summary>📜 v1.x - Historical Versions</summary>

### [1.5.0] - 2026-03-06

#### ✨ New Syntax Support

- **Python nested f-strings**: Accurate coloring of variables, strings, and expressions in multi‑level nested f‑strings

#### ✨ Semantic Enhancements

- **Inlay Hints visual refinement**: Inlay hints now recede with moon shadow gray (`#64748b`), keeping them from interfering with the main logic
- **Diagnostic borders**: Errors, warnings, and information now have translucent borders, making them gentler at night

#### 🔧 Optimizations

- Fine‑tuned the brightness ladder for some colors

### [1.4.0] - 2026-03-05

#### ✨ Daylight Readability Optimization: Let Moonlight Pierce the Ambient Light

- **Comments brightened**: `#94a3b8` → `#a5b4cb` — clear in bright light, still receding at night
- **Operators brightened**: `#64748b` → `#8596a5` — logical skeleton never disappears
- **Variables fine‑tuned**: `#cbd5e1` → `#d4dcee` — body text more solid
- **Functions refined**: `#7dd3fc` → `#87cefa` — a warm, glowing blue, balanced day and night
- **Colon/dot operators unified**: from `#64748b` to `#8596a5` — tiny symbols no longer lost
- **Status bar foreground brightened**: `#94a3b8` → `#cbd5e1` — information readable, still settled
- **Selection border added**: `editor.selectionHighlightBorder: #3b82f680` — more precise interaction
- **Property color unified**: member properties now `#94a3b8` (matching semantic highlighting), eliminating inconsistency
- **Async function color synchronized**: now `#87cefa`, keeping bold italic for semantic distinction

#### ✨ Search Result Layering

- **Current match**: primary blue translucent background + border — instantly locatable
- **Other matches**: lighter background — clear hierarchy

#### ✨ The Visual Contract: Moongate’s Hardware Adaptation Philosophy

Moongate Dark is not designed for “brightness”; it is designed for **contrast**. In extremely low physical brightness, contrast is the last line of defense for your eyes. With this release, we are also introducing the **“Moongate Visual Contract”** — a guide to help you calibrate your monitor so that the moonlight renders accurately on your screen. You can find it in the `extras/` directory or read it directly in the README.

#### 🔧 Fixes & Optimizations

- Fixed property color inconsistencies in some scenarios
- Improved Python decorator display
- Slightly adjusted JSDoc tag brightness to align with primary semantic colors

### [1.3.0] - 2026-03-03

#### ✨ Deep Customization of Semantic Modifiers

- Function, method, and class definitions now bold, clearly distinguished from call sites
- Static members (methods/properties) now italic, differentiated from regular members
- Deprecated symbols now have strikethrough, instantly recognizable
- Async functions now bold italic, hinting at their asynchronous nature
- Abstract classes/methods now italic, conveying “unimplemented” semantics
- Built-in objects now bold, emphasizing their core language status

#### ✨ Lunar Semantic Bracket Highlighting

- Six levels of nested brackets assigned moon semantic colors: glowing blue, moonflower green, moon yellow, moonbow purple, primary blue, moon shadow gray
- Unmatched brackets now use red moon for warning
- Matching bracket pairs retain primary blue translucent background + border for precise positioning

#### ✨ JSDoc/TSDoc Semantic Highlighting

- Tags (@param, @returns, etc.) now primary blue and bold
- Parameter names now moonflower green and italic
- Types now glowing blue
- Braces and punctuation now operator gray, visually receded

### [1.2.0] - 2026-03-01

#### ✨ Deep Optimizations for Mixed Language Embedding

- **Component highlighting inside template strings**: In JSX/TSX/Vue templates, custom components now glow in moon yellow (`#fbbf24`), while native HTML tags remain red (`#f87171`). Component structure is instantly recognizable.
- **Markdown code fence language identifiers**: The language name (e.g., `python` in ` ```python `) now appears in moonbow purple (`#c084fc`) and italic — metadata made visible.

#### ✨ Special Comment Visualization (Pair with Better Comments)

- Official color presets for the Better Comments extension provided in `extras/better-comments.json`.
- **TODO**: moon yellow bold (`#fbbf24` bold)
- **FIXME**: red moon bold italic (`#f87171` bold italic)
- **NOTE**: glowing blue italic (`#7dd3fc` italic)
- **HACK**: moonbow purple bold (`#c084fc` bold)
- **BUG**: red moon bold underline (`#f87171` bold underline)
- **XXX**: moon yellow bold (`#fbbf24` bold)

#### ✨ Terminal Color Sync

- The 16 ANSI terminal colors are now mapped to Moongate's lunar semantic palette.
- Strings, numbers, errors, etc. in `console.log` output match their editor counterparts.
- Terminal background matches the editor background (`#0f172a`), creating a seamless experience.

### [1.1.0] - 2026-02-27

#### ✨ Optimizations

- **Read-only variables italic**: Read-only variables (e.g., `const`, readonly parameters) are now italic, distinguishing them from regular variables.
- **Generic parameters cyan**: Generic parameters now use cyan (`#22d3ee`), making complex generics instantly recognizable.
- **Python decorators unified**: All Python decorators (`@property`, `@xxx.setter`, `@classmethod`, etc.) are now purple (`#c084fc`) and italic — metadata clearly separated from regular functions.

### [1.0.2] - 2026-02-26

#### 📚 Documentation

- **Bilingual README added**: Now supports switching between Chinese and English, accommodating a wider audience.
- **Preview screenshots updated**: Showcasing the actual effects after v1.0.2 optimizations.
- **Recommended configuration instructions added**: Guides users to enable semantic highlighting.

### [1.0.1] - 2026-02-25

#### ✨ Optimizations

- Visual comfort: Dimmed local variables and parameters to reduce eye fatigue from large areas of white.
- Enabled semantic highlighting, unifying variable presentation across languages.
- Python variable weight reduced for better readability.

### [1.0.0] - 2026-02-24

#### 🎉 Initial Release

- A minimalist sci-fi terminal-style dark theme.
- Color system based on lunar semantics: primary blue (`#3b82f6`), moonflower green (`#34d399`), moon yellow (`#fbbf24`), red moon (`#f87171`).
- Visual perspective: operators recede, functions glow, comments italic.
- Supported languages: JavaScript/TypeScript/React/Vue/HTML/CSS/JSON/Markdown/Python.
- Full UI theming: title bar, status bar, sidebar, terminal, etc., all adapted.

#### ✨ Features

- Right‑angle aesthetics: all UI elements are strictly right‑angled, no rounded corners.
- Silent interaction: links blend into text by default, light up on hover.
- Editor‑inspired design: code blocks with window‑style headers, inline code with subtle glow.
- Status bar sunk: blends with editor background, never distracts.

#### 🧠 Design Philosophy

- Cool base with warm accents.
- Every color carries a moon‑phase metaphor.
- Visual hierarchy in three layers: foreground, midground, background.

</details>
