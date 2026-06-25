[中文](#Chinese) | [English](#English)

<span id="Chinese">中文</span>

# 🌙 Moongate 视觉契约 v2.0

### ——让昼夜月光同样精准地映照在你的屏幕上

Moongate 2.0 首次带来了完整的**昼夜双主题**：深色“晴夜”与浅色“晨曦”。它们共享同一套色彩语义，但针对不同环境光进行了**重力补偿**——深色版注重暗部细节的层次，浅色版则优化明亮环境下的可读性与舒适度。

然而，无论主题设计得多么精密，最终呈现的效果依然取决于你的显示器是否**忠实地还原了这些设计**。错误的硬件设置会让深邃的夜空变成发灰的塑料，让柔和的晨曦变得刺眼夺目。

这份指南不是一份教条，而是一份**视觉契约**。我们共同校准物理参数，才能让 Moongate 的月光真正照进你的屏幕。

---

## ⚙️ 一、核心校准：让昼夜月光同样精准

在开始之前，请确保显示器**恢复出厂设置**，并关闭所有“动态对比度”、“生动模式”、“游戏模式”等味精功能。这是校准的前提。

| 步骤              | 操作                                                                                                                                              | 目标                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **1. 设置 Gamma** | 选择 `Gamma 2.2`（Windows/macOS 标准）                                                                                                            | 确保灰阶过渡平滑，中间调不偏暗或偏亮                   |
| **2. 调整亮度**   | **深色模式**：让 2% 灰度块刚刚可见；**浅色模式**：使用白饱和检测（White saturation）让最亮的几个灰度块（如 250-255）可区分，且最亮块（255）不刺眼 | 深色：保留暗部细节；浅色：防止高光过曝，确保亮部层次晰 |
| **3. 调整对比度** | 让 100% 白色块清晰但不刺眼                                                                                                                        | 防止亮部过曝，避免字符边缘产生“重影”                   |
| **4. 色温**       | 推荐 `6500K` 或 `暖色` 模式                                                                                                                       | 中和蓝光，柔化视觉，尤其适合夜间                       |

> **💡 小提示**：
>
> - **深色模式校准**：在完全黑暗的房间中，从 10% 亮度开始逐步增加，直到 [Black level 测试页](http://www.lagom.nl/lcd-test/black.php) 上 2% 灰块刚能被分辨。
> - **浅色模式校准**：在白天正常环境光下，打开 [White saturation 测试页](http://www.lagom.nl/lcd-test/white_saturation.php)，调节亮度使最右侧的亮块（如 253、254、255）可清晰区分，且 255 纯白块不刺眼、边缘无模糊。

---

## 🛡️ 二、针对特定显示器的“致命陷阱”（双模式通用）

不同面板的物理特性差异巨大，以下是针对常见高端显示器的避坑指南，无论深色还是浅色模式均适用。

### 🚫 陷阱 1：黑色稳定器 / 阴影控制 (Black Stabilizer / Shadow Control)

**症状**：深色模式下背景 `#0f172a` 发灰；浅色模式下暗色字符（如注释 `#64748b`）变淡甚至消失。  
**原因**：强行提亮或压缩暗部，破坏对比度层次。  
**对策**：进入显示器 OSD 菜单，将 **Black Stabilizer 锁定为 50**（标准值），或关闭阴影控制功能。

### 🎨 陷阱 2：颜色模式 / 饱和度

**症状**：色彩偏离设计，冷色调泛暖，或高亮色刺眼。  
**原因**：开启了“生动模式”、“高色域模式”或饱和度设置过高。  
**对策**：优先选择 **sRGB 模式**；若无，选择 **“用户自定义”并将饱和度调至 50**。

### 🔪 陷阱 3：锐利度 (Sharpness)

**症状**：字符边缘出现“重影”或“晕染”，尤其在浅色模式下深色文字显得发虚。  
**原因**：锐利度过高导致过冲效应。  
**对策**：将 **Sharpness 下调至 50-60**，还原字符的自然边缘。

---

## 📊 三、Moongate 亮度校准方法（分模式指导）

你需要使用专业的在线测试工具。推荐访问：

- [Lagom LCD 测试页](http://www.lagom.nl/lcd-test/black.php)（黑阶/白阶）
- [Eizo 显示器测试](https://www.eizo.be/monitor-test/)（黑白阶）

### 深色模式校准（夜间环境）

1. 在**完全黑暗的房间**中打开 [Black level 测试页](http://www.lagom.nl/lcd-test/black.php)。
2. 让眼睛适应 2-3 分钟。
3. 调节显示器亮度，直到 **2% 灰块**（第二个方块）刚刚能被肉眼分辨——它应该非常暗，但确实存在。
4. 如果 1% 灰块完全不可见，这是显示器物理极限的正常现象（尤其是 IPS 面板），**以 2% 为准即可**。

### 浅色模式校准（白天环境）

1. 在典型工作照明下打开 [White saturation 测试页](http://www.lagom.nl/lcd-test/white_saturation.php)。
2. 观察最右侧的几个亮块（通常标记为 250、251、252、253、254、255）。
3. 调节亮度（必要时微调对比度），使这些亮块能够被清晰区分——**255 纯白块应看起来是纯白，但不过度眩目，且与 254 块的边界分明**。
4. 如果多个亮块完全融合为一片纯白，说明亮度过高或对比度过高；如果最亮块显得灰暗，说明亮度过低。

---

## 🌗 四、环境亮度推荐（分模式参考）

以下亮度范围基于典型显示器经验值，**真正校准请以测试块的可见性为准**，不必拘泥于具体百分比。

### 深色模式（暗环境优化）

| 环境           | 参考亮度范围 | 校准目标      |
| -------------- | ------------ | ------------- |
| 白天（室内光） | 20-30%       | 5% 灰块可见   |
| 夜间（开灯）   | 15-20%       | 3% 灰块可见   |
| 夜间（全黑）   | 10-15%       | 2% 灰块刚可见 |

### 浅色模式（亮环境优化）

| 环境                   | 参考亮度范围 | 校准目标                   |
| ---------------------- | ------------ | -------------------------- |
| 白天（阳光直射）       | 50-70%       | 255 块清晰，250-255 可区分 |
| 白天（室内均匀光）     | 30-50%       | 255 块舒适，亮部层次分明   |
| 夜间（开灯，浅色模式） | 20-30%       | 255 块不刺眼               |

> **📝 注意**：
> 
> - 以上亮度范围是基于典型显示器（亮度范围 250-350 尼特）的**经验参考值**，并非绝对标准。
> 
> - **不同显示器的 OSD 亮度百分比与实际亮度（尼特）没有统一对应关系**，请务必以测试页面的实际观感为准。
> - 校准的最终目标是：在对应环境下，让 250-255 的亮块层次分明，且 255 块不刺眼。**数值仅供参考，眼睛的感受才是唯一标准。**

---

## 🤝 五、我们的视觉契约（v2.0 昼夜宣言）

Moongate 的设计逻辑从未改变：**让辅助信息处于“感知存在但不夺目”的临界点，让核心逻辑通过亮度阶梯自然浮现。**  
v2.0 更进一步：**无论环境光如何变化，通过深色与浅色两套精确补偿的主题，我们承诺为你提供始终如一的清晰与舒适。**

如果你遵循以上校准，依然觉得某些元素过亮或过暗，欢迎反馈你的校准体验。你的使用感受将帮助我们持续优化 Moongate，让它在更多屏幕上呈现更精准的月光与晨曦。

但如果你的显示器开启了“动态对比度”、“生动模式”、“黑色稳定器 > 50”等味精功能，请先尝试关闭。**Moongate 的昼夜月光，都需要一面干净的镜子才能准确映照。**

---

## 📌 附：关于硬件极限的说明

如果你经过校准后，深色模式下 2% 灰块依然不可见，或浅色模式下 250-255 亮块仍然难以区分——这通常是显示器的物理极限。此时，请以你眼睛的舒适为准。Moongate 的核心设计仍然会为你提供优秀的编码体验，校准的终点不是理论完美，而是找到你最舒服的平衡点。

[⬆ Back to top](#)

---

<span id="English">English</span>

# 🌙 Moongate Visual Contract v2.0

### ——Let Day and Night Moonlight Both Render Faithfully on Your Screen

Moongate 2.0 introduces a complete **dual‑theme system** for the first time: dark “Night Sky” and light “Dawn”. They share the same semantic color mapping, but have undergone **gravity compensation** for different ambient lighting—the dark mode focuses on preserving shadow details, while the light mode optimizes readability and comfort in bright environments.

Yet, no matter how precisely a theme is designed, the final result still depends on whether your monitor **faithfully reproduces these designs**. Incorrect hardware settings can turn the deep night sky into dull grey plastic, or make the gentle dawn glare harsh.

This guide is not a dogma; it is a **visual contract**. By aligning our physical parameters together, we can let Moongate’s moonlight truly shine on your screen.

---

## ⚙️ I. Core Calibration: Precise Moonlight, Day or Night

Before you begin, please **reset your monitor to factory defaults** and turn off all “dynamic contrast”, “vivid mode”, “game mode”, and similar gimmicks. This is the prerequisite for calibration.

| Step                     | Action                                                                                                                                                                                                           | Goal                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **1. Set Gamma**         | Choose `Gamma 2.2` (Windows/macOS standard)                                                                                                                                                                      | Ensure smooth grayscale transitions, mid‑tones are neither too dark nor too bright                   |
| **2. Adjust Brightness** | **Dark mode**: make the 2% gray patch just visible; **Light mode**: use the white saturation test to make the brightest gray patches (e.g., 250–255) distinguishable, with the brightest patch (255) not glaring | Dark: preserve shadow details; Light: prevent blown‑out highlights, ensure clear highlight gradation |
| **3. Adjust Contrast**   | Keep the 100% white patch clear but not glaring                                                                                                                                                                  | Prevent clipped highlights and avoid “ghosting” on character edges                                   |
| **4. Color Temperature** | Recommend `6500K` or `Warm` mode                                                                                                                                                                                 | Neutralize blue light, soften vision – especially at night                                           |

> **💡 Tip**:
>
> - **Dark mode calibration**: In a completely dark room, start from 10% brightness and increase gradually until the **2% gray patch** on the [Black level test page](http://www.lagom.nl/lcd-test/black.php) is just barely visible.
> - **Light mode calibration**: Under normal daytime lighting, open the [White saturation test page](http://www.lagom.nl/lcd-test/white_saturation.php). Adjust brightness so that the brightest patches on the far right (e.g., 253, 254, 255) are clearly distinguishable, and the 255 pure white patch is not glaring, with sharp edges.

---

## 🛡️ II. “Deadly Traps” for Specific Monitors (Universal for Both Modes)

Different panels have vastly different physical characteristics. Here are pitfalls to avoid with common high‑end monitors, regardless of whether you use dark or light mode.

### 🚫 Trap 1: Black Stabilizer / Shadow Control

**Symptom**: In dark mode, background `#0f172a` turns grey; in light mode, dark characters (e.g., comments `#64748b`) fade or disappear.  
**Cause**: Forcibly brightening or crushing shadows destroys contrast hierarchy.  
**Solution**: In the monitor OSD, set **Black Stabilizer to 50** (the standard value) or turn off shadow control.

### 🎨 Trap 2: Color Mode / Saturation

**Symptom**: Colors deviate from design – cool tones shift warm, or bright colors become glaring.  
**Cause**: Enabling “vivid mode”, “wide gamut mode”, or setting saturation too high.  
**Solution**: Prefer **sRGB mode**; if unavailable, choose **“User Defined” and set saturation to 50**.

### 🔪 Trap 3: Sharpness

**Symptom**: Character edges show “ghosting” or “halos”, especially in light mode where dark text may appear fuzzy.  
**Cause**: Excessive sharpness causing overshoot.  
**Solution**: Lower **Sharpness to 50‑60** to restore natural edges.

---

## 📊 III. Moongate Brightness Calibration Method (Mode‑Specific)

You need a professional online test tool. Recommended sites:

- [Lagom LCD test](http://www.lagom.nl/lcd-test/black.php) (black level / white saturation)
- [Eizo monitor test](https://www.eizo.be/monitor-test/) (black/white level)

### Dark Mode Calibration (Night Environment)

1. Open the [Black level test page](http://www.lagom.nl/lcd-test/black.php) in a **completely dark room**.
2. Let your eyes adapt for 2‑3 minutes.
3. Adjust the monitor’s brightness until the **2% gray patch** (the second patch) is just barely visible – it should be very faint, but definitely present.
4. If the 1% patch is completely invisible, that is normal due to the physical limits of the panel (especially IPS). **Use the 2% patch as your target.**

### Light Mode Calibration (Daytime Environment)

1. Open the [White saturation test page](http://www.lagom.nl/lcd-test/white_saturation.php) under typical office lighting.
2. Observe the brightest patches on the far right (usually labeled 250, 251, 252, 253, 254, 255).
3. Adjust brightness (and fine‑tune contrast if needed) so that these patches are clearly distinguishable—**the 255 pure white patch should appear pure white, but not glaring, with a sharp boundary between 254 and 255**.
4. If multiple bright patches blend into a single white mass, brightness or contrast is too high; if the brightest patch looks dull gray, brightness is too low.

---

## 🌗 IV. Ambient Brightness Recommendations (Mode‑Specific Reference)

The ranges below are based on typical monitors. **Always calibrate using the visibility of test patches**; do not rigidly follow these percentages.

### Dark Mode (Optimized for Dim Environments)

| Environment            | Reference Brightness Range | Calibration Target         |
| ---------------------- | -------------------------- | -------------------------- |
| Day (indoor light)     | 20-30%                     | 5% gray patch visible      |
| Night (lights on)      | 15-20%                     | 3% gray patch visible      |
| Night (total darkness) | 10-15%                     | 2% gray patch just visible |

### Light Mode (Optimized for Bright Environments)

| Environment                   | Reference Brightness Range | Calibration Target                                 |
| ----------------------------- | -------------------------- | -------------------------------------------------- |
| Day (direct sun)              | 50-70%                     | 255 patch clear, 250–255 distinguishable           |
| Day (indoor uniform light)    | 30-50%                     | 255 patch comfortable, highlight gradation visible |
| Night (lights on, light mode) | 20-30%                     | 255 patch not glaring                              |

> **📝 Note**:
> - The brightness ranges above are **empirical reference values** based on typical monitors (with a brightness range of 250–350 nits), not absolute standards.
> - **There is no universal correlation between a monitor's OSD brightness percentage and its actual brightness (nits).** Always rely on your actual visual perception of the test page.
> - The ultimate goal of calibration is: under the corresponding ambient lighting, the bright patches from 250 to 255 should be clearly distinguishable, and the 255 patch should not be glaring. **The numbers are for reference only; your eyes' comfort is the only true standard.**

---

## 🤝 V. Our Visual Contract (v2.0 Day‑Night Manifesto)

Moongate’s design philosophy has never changed: **To keep auxiliary information at the threshold of “perceptible but not eye‑catching” on your retina, and to let the core logic emerge naturally through a stepped brightness hierarchy.**  
v2.0 goes further: **No matter how the ambient light shifts, through two precisely compensated themes – dark and light – we pledge to deliver consistent clarity and comfort.**

If you have followed the calibration above and still find some elements too bright or too dark, you are welcome to share your calibration experience. Your feedback will help us continuously improve Moongate and deliver a more precise moonlight and dawn on more screens.

However, if your monitor has “dynamic contrast”, “vivid mode”, “Black Stabilizer > 50”, or similar gimmicks enabled, please try turning them off first. **Moongate’s day and night moonlight both need a clean mirror to reflect accurately.**

---

## 📌 Appendix: A Note on Hardware Limits

If, after calibration, the 2% gray patch remains invisible in dark mode, or the 250–255 bright patches are still difficult to distinguish in light mode – this is often your monitor’s physical limit. In such cases, prioritize your eye comfort. Moongate’s core design will still provide an excellent coding experience; the end of calibration is not theoretical perfection, but the discovery of the balance point that is most comfortable for your eyes.

[⬆ Back to top](#)

---

_探索不息，编码不止 | Explore endlessly, code without ceasing_
