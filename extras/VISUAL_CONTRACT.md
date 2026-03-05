[中文](#Chinese) | [English](#English)

<span id="Chinese">中文</span>

# 🌙 Moongate Dark 视觉契约

### ——让月光在你的屏幕上准确还原

Moongate Dark 的色彩不是随意的堆砌，而是一套经过精密计算的视觉系统。它基于冷色调基底、亮度阶梯和语义化配色，旨在全天候提供「白天清晰锐利，夜晚温润如水」的编码体验。

但最终呈现在你眼中的效果，不仅取决于主题本身，更取决于你的显示器是否**忠实地还原了这些设计**。错误的硬件设置会让深邃的夜空变成发灰的塑料，让温润的月光变得刺眼如霓虹。

这份指南不是一份教条，而是一份**视觉契约**。我们共同对齐物理参数，才能让 Moongate 的月光真正照进你的屏幕。

---

## ⚙️ 一、核心校准：30 秒找回真实

在开始之前，请确保显示器**恢复出厂设置**，并关闭所有“动态对比度”、“生动模式”、“游戏模式”等味精功能。这是校准的前提。

| 步骤              | 操作                                                        | 目标                                 |
| ----------------- | ----------------------------------------------------------- | ------------------------------------ |
| **1. 设置 Gamma** | 选择 `Gamma 2.2`（Windows/macOS 标准）                      | 确保灰阶过渡平滑，中间调不偏暗或偏亮 |
| **2. 调整亮度**   | 使用下方的 **第三节中的在线测试工具**，让 2% 灰度块刚刚可见 | 找到不丢失暗部细节的最低亮度         |
| **3. 调整对比度** | 让 100% 白色块保持清晰但不刺眼                              | 防止亮部过曝，避免字符边缘产生“重影” |
| **4. 色温**       | 推荐 `6500K` 或 `暖色` 模式                                 | 中和蓝光，柔化视觉，尤其适合夜间     |

> **💡 小提示**：大多数显示器的亮度在 0-100 之间是非线性的，建议夜间从 10% 开始逐步增加，直到视力表上 2% 灰块刚刚能被分辨（具体数值因显示器而异）。

---

## 🛡️ 二、针对特定显示器的“致命陷阱”

不同面板的物理特性差异巨大，以下是针对常见高端显示器的避坑指南。

### 🚫 陷阱 1：黑色稳定器 (Black Stabilizer)

**症状**：背景色 `#0f172a` 看起来像发灰的塑料布，深邃感消失。  
**原因**：很多游戏显示器会强行提亮暗部，破坏深色背景的纯净度。  
**对策**：进入显示器 OSD 菜单，将 **Black Stabilizer 锁定为 50**（标准值）。

- 过高：暗部被提亮，背景发灰，操作符细节被吞噬。
- 过低：可能导致极暗部分（如嵌套键名）彻底消失。

### 🎨 陷阱 2：颜色模式 / 饱和度

**症状**：函数名 `#87cefa` 变得像霓虹灯一样刺眼，冷色调泛出红光或绿光。  
**原因**：Nano IPS 面板的红色/绿色磷光体非常活跃，开启“生动模式”或高饱和度会强制注入暖色，破坏冷调基底。  
**对策**：

- 优先选择 **sRGB 模式**，强制显示器使用标准色域。
- 如果无 sRGB 模式，选择 **“用户自定义”并将饱和度调至 50**，确保不额外加色。

### 🔪 陷阱 3：锐利度 (Sharpness)

**症状**：在夜间低亮度下，加粗的 `console.log` 字符边缘出现肉眼可见的“重影”或“晕染”。  
**原因**：锐利度开得太高，触发了液晶面板的边缘过冲效应。  
**对策**：将 **Sharpness 下调至 50-60**，还原字符的柔和边缘，让月光真正温润起来。

---

## 📊 三、Moongate 亮度校准方法

你需要使用专业的在线测试工具。以下是推荐的方法：

### 方法一：在线测试图（推荐，无需额外工具）

访问以下任何一个专业显示器测试网站：

- [Lagom LCD 测试页](http://www.lagom.nl/lcd-test/black.php)
- [Eizo 显示器测试](https://www.eizo.be/monitor-test/)

在“黑阶”或“Black level”测试页面中，你会看到从 0% 到 5% 的灰度方块。背景为纯黑（0%），方块亮度逐级递增。

### 方法二：系统校色工具

- **Windows**：打开“设置” → “显示” → “高级显示设置” → “显示器1的显示适配器属性” → “颜色管理” → “颜色管理” → “高级” → “校准显示器”
- **macOS**：系统偏好设置 → “显示器” → “颜色” → “校准…”

### 校准方法

1. 在 **完全黑暗的房间** 中打开测试页面。
2. 让眼睛适应 2-3 分钟。
3. 调节显示器亮度，直到 **2% 灰块**（第二个方块）刚刚能被肉眼分辨——它应该非常暗，但确实存在。
4. 如果 1% 灰块完全不可见，这是显示器物理极限的正常现象（尤其是 IPS 面板），**以 2% 为准即可**。

### 为什么不是 1%？

受限于液晶面板的对比度极限（IPS 通常约 1000:1），很多显示器无法清晰显示 1% 灰块。以 2% 为目标，既能保证暗部细节不丢失，又尊重了硬件的实际能力。

### 实战检验

- **白天**：如果你看不清嵌套 JSON 里的冒号（`#8596a5`），说明环境光太强，可适当增加物理亮度或拉窗帘。
- **深夜**：如果你觉得 `console.log` 的白色加粗字符刺眼，说明亮度可能过高，或显示器锐利度太大（建议设为 50-60）。

---

## 🌗 四、环境亮度推荐（仅供参考）

以下亮度范围基于典型显示器（最大亮度 250-350 尼特）的经验值，**真正校准请以视力表的灰块可见性为准**，不必拘泥于具体百分比。

| 环境                         | 参考亮度范围 | 校准目标                      |
| ---------------------------- | ------------ | ----------------------------- |
| 白天（阳光直射，无法拉窗帘） | 30-50%       | 确保操作符 `#8596a5` 清晰可见 |
| 白天（室内均匀光）           | 20-40%       | 以视力表 10% 灰块可见为底线   |
| 夜间（开灯）                 | 15-25%       | 以视力表 5% 灰块刚可见为准    |
| 夜间（全黑）                 | 10-20%       | 以视力表 2% 灰块刚可见为准    |

---

## 🤝 五、我们的视觉契约

Moongate Dark 的设计逻辑是：  
**让辅助信息在你的视网膜上处于“感知存在但不夺目”的临界点，让核心逻辑通过亮度阶梯自然浮现。**

如果你遵循以上校准，依然觉得某些元素过亮或过暗，欢迎反馈你的校准体验。你的使用感受将帮助我们持续优化 Moongate，让它在更多屏幕上呈现更舒适的月光。

但如果你的显示器开启了“动态对比度”、“生动模式”、“黑色稳定器 > 50”等味精功能，请先尝试关闭。**Moongate 的月光，需要一面干净的镜子才能准确映照。**

---

## 📌 附：关于硬件极限的说明

如果你经过校准后，1% 灰块完全不可见，2% 灰块勉强可见——恭喜你，你已经找到了你显示器的物理极限。这不是你的问题，也不是 Moongate 的问题，而是所有液晶面板（尤其是 IPS）的共性。在这样的设置下，Moongate 的核心元素（变量、函数、操作符）依然会清晰呈现，暗部细节（如嵌套键名）也不会丢失。

**校准的终点，不是追求理论上的完美，而是找到让你眼睛最舒服的平衡点。**

[⬆ Back to top](#)

---

<span id="English">English</span>

# 🌙 Moongate Dark Visual Contract

### ——Let the Moonlight Render Faithfully on Your Screen

Moongate Dark’s colors are not a random assortment; they form a meticulously calculated visual system. Based on a cool‑toned foundation, a stepped brightness hierarchy, and semantic color mapping, it is designed to provide a coding experience that is “sharp and clear by day, gentle as water by night.”

Yet the final effect you see depends not only on the theme itself, but also on whether your monitor **faithfully reproduces these designs**. Incorrect hardware settings can turn the deep night sky into a dull grey plastic, and transform the gentle moonlight into glaring neon.

This guide is not a dogma; it is a **visual contract**. By aligning our physical parameters together, we can let Moongate’s moonlight truly shine on your screen.

---

## ⚙️ I. Core Calibration: 30 Seconds to Restore Reality

Before you begin, please **reset your monitor to factory defaults** and turn off all “dynamic contrast”, “vivid mode”, “game mode”, and similar gimmicks. This is the prerequisite for calibration.

| Step                     | Action                                                                                      | Goal                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **1. Set Gamma**         | Choose `Gamma 2.2` (Windows/macOS standard)                                                 | Ensure smooth grayscale transitions, mid‑tones are neither too dark nor too bright |
| **2. Adjust Brightness** | Use the **online test tool in Section III**, make the **2% gray patch just barely visible** | Find the lowest brightness that preserves shadow details                           |
| **3. Adjust Contrast**   | Keep the 100% white patch clear but not glaring                                             | Prevent clipped highlights and avoid “ghosting” on character edges                 |
| **4. Color Temperature** | Recommend `6500K` or `Warm` mode                                                            | Neutralize blue light, soften vision – especially at night                         |

> **💡 Tip**: Most monitor brightness controls are non‑linear. At night, start from 10% and gradually increase until the 2% gray patch on the test chart is just barely discernible (the exact value will vary by monitor).

---

## 🛡️ II. “Deadly Traps” for Specific Monitors

Different panels have vastly different physical characteristics. Here are some pitfalls to avoid with common high‑end monitors.

### 🚫 Trap 1: Black Stabilizer

**Symptom**: Background `#0f172a` looks like dull grey plastic – the depth disappears.  
**Cause**: Many gaming monitors forcibly brighten shadows, ruining the purity of a dark background.  
**Solution**: In the monitor OSD, set **Black Stabilizer to 50** (the standard value).

- Too high: shadows are lifted, background turns grey, operator details get swallowed.
- Too low: extremely dark areas (e.g., nested keys) may vanish completely.

### 🎨 Trap 2: Color Mode / Saturation

**Symptom**: Function names `#87cefa` become neon‑like, cool tones shift toward red or green.  
**Cause**: Nano IPS panels have very active red/green phosphors; enabling “vivid mode” or high saturation forces in warm colors, destroying the cool foundation.  
**Solution**:

- Prefer **sRGB mode**, forcing the monitor to use the standard gamut.
- If no sRGB mode exists, choose **“User Defined” and set saturation to 50** to avoid extra color injection.

### 🔪 Trap 3: Sharpness

**Symptom**: At low night brightness, bold characters like `console.log` show visible “ghosting” or “halos” on their edges.  
**Cause**: Excessive sharpness triggers edge‑overshoot on LCD panels.  
**Solution**: Lower **Sharpness to 50‑60** to restore soft edges and let the moonlight truly become gentle.

---

## 📊 III. Moongate Brightness Calibration Method

You need a professional online test tool. Here are the recommended methods:

### Method 1: Online Test Patterns (Recommended, No Extra Tools)

Visit any of the following professional monitor test sites:

- [Lagom LCD test](http://www.lagom.nl/lcd-test/black.php)
- [Eizo monitor test](https://www.eizo.be/monitor-test/)

On the “Black level” page, you will see gray patches from 0% to 5%. The background is pure black (0%), and the patches increase in brightness step by step.

### Method 2: System Calibration Tools

- **Windows**: Settings → Display → Advanced display → Display adapter properties for Display 1 → Color Management → Color Management → Advanced → Calibrate display
- **macOS**: System Preferences → Displays → Color → Calibrate…

### Calibration Procedure

1. Open the test page in a **completely dark room**.
2. Let your eyes adapt for 2‑3 minutes.
3. Adjust the monitor’s brightness until the **2% gray patch** (the second patch) is just barely visible – it should be very faint, but definitely present.
4. If the 1% patch is completely invisible, that is normal due to the physical limits of the panel (especially IPS). **Use the 2% patch as your target.**

### Why 2% instead of 1%?

Limited by the contrast ratio of LCD panels (IPS typically ~1000:1), many monitors cannot clearly display a 1% gray patch. Aiming for 2% ensures shadow details are not lost while respecting the hardware’s actual capabilities.

### Real‑world Check

- **Daytime**: If you can’t clearly see the colon (`#8596a5`) in nested JSON, ambient light is too strong; either increase physical brightness or draw the curtains.
- **Late night**: If bold white characters like `console.log` feel glaring, brightness may be too high or sharpness too high (recommend setting Sharpness to 50‑60).

---

## 🌗 IV. Ambient Brightness Recommendations (For Reference Only)

The ranges below are based on typical monitors (max brightness 250‑350 nits). **Always calibrate using the visibility of gray patches on a test chart**; do not rigidly follow these percentages.

| Environment                   | Reference Brightness Range | Calibration Target                           |
| ----------------------------- | -------------------------- | -------------------------------------------- |
| Day (direct sun, no curtains) | 30-50%                     | Ensure operator `#8596a5` is clearly visible |
| Day (indoor uniform light)    | 20-40%                     | 10% gray patch just visible                  |
| Night (lights on)             | 15-25%                     | 5% gray patch just visible                   |
| Night (total darkness)        | 10-20%                     | 2% gray patch just visible                   |

---

## 🤝 V. Our Visual Contract

The design logic of Moongate Dark is:  
**To keep auxiliary information at the threshold of “perceptible but not eye‑catching” on your retina, and to let the core logic emerge naturally through a stepped brightness hierarchy.**

If you have followed the calibration above and still find some elements too bright or too dark, you are welcome to share your calibration experience. Your feedback will help us continuously improve Moongate and deliver a more comfortable moonlight on more screens.

However, if your monitor has “dynamic contrast”, “vivid mode”, “Black Stabilizer > 50”, or similar gimmicks enabled, please try turning them off first. **Moongate’s moonlight needs a clean mirror to reflect accurately.**

---

## 📌 Appendix: A Note on Hardware Limits

If, after calibration, the 1% gray patch is completely invisible and the 2% patch is barely visible – congratulations, you have found your monitor’s physical limit. This is neither your fault nor Moongate’s; it is a common trait of all LCD panels (especially IPS). With these settings, Moongate’s core elements (variables, functions, operators) will still be clearly rendered, and shadow details (e.g., nested keys) will not be lost.

**The end of calibration is not the pursuit of theoretical perfection, but the discovery of the balance point that is most comfortable for your eyes.**

[⬆ Back to top](#)

---

探索不息，编码不止 | Explore endlessly, code without ceasing
