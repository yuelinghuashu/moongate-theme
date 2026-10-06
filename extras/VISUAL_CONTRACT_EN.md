[🇨🇳 中文版](./VISUAL_CONTRACT.md) | English

---

# 🌙 Moongate Visual Contract v2.0

Moongate ships a dark "Night Sky" and a light "Dawn" theme that share one semantic color mapping; every color value is designed for a monitor running **sRGB at Gamma 2.2**. Wrong monitor settings (wide gamut, dynamic contrast, excessive sharpness) will make the rendered result deviate from the design — this guide lists the hardware settings to verify.

---

## ⚙️ I. Core Calibration: Precise Moonlight, Day or Night

Before you begin, please **reset your monitor to factory defaults** and turn off all "dynamic contrast", "vivid mode", "game mode", and similar gimmicks. This is the prerequisite for calibration.

| Step                     | Action                                                                                                                                                                                                           | Goal                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **1. Set Gamma**         | Choose `Gamma 2.2` (Windows/macOS standard)                                                                                                                                                                      | Ensure smooth grayscale transitions, mid‑tones are neither too dark nor too bright                   |
| **2. Adjust Brightness** | **Dark mode**: make the 2% gray patch just visible; **Light mode**: use the white saturation test to make the brightest gray patches (e.g., 250–255) distinguishable, with the brightest patch (255) not glaring | Dark: preserve shadow details; Light: prevent blown‑out highlights, ensure clear highlight gradation |
| **3. Adjust Contrast**   | Keep the 100% white patch clear but not glaring                                                                                                                                                                  | Prevent clipped highlights and avoid "ghosting" on character edges                                   |
| **4. Color Temperature** | Recommend `6500K` or `Warm` mode                                                                                                                                                                                 | Neutralize blue light, soften vision – especially at night                                           |

> **💡 Tip**:
>
> - **Dark mode calibration**: In a completely dark room, start from 10% brightness and increase gradually until the **2% gray patch** on the [Black level test page](http://www.lagom.nl/lcd-test/black.php) is just barely visible.
> - **Light mode calibration**: Under normal daytime lighting, open the [White saturation test page](http://www.lagom.nl/lcd-test/white_saturation.php). Adjust brightness so that the brightest patches on the far right (e.g., 253, 254, 255) are clearly distinguishable, and the 255 pure white patch is not glaring, with sharp edges.

---

## 🛡️ II. "Deadly Traps" for Specific Monitors (Universal for Both Modes)

Different panels have vastly different physical characteristics. Here are pitfalls to avoid with common high‑end monitors, regardless of whether you use dark or light mode.

### 🚫 Trap 1: Black Stabilizer / Shadow Control

**Symptom**: In dark mode, background `#0f172a` turns grey; in light mode, dark characters (e.g., comments `#64748b`) fade or disappear.  
**Cause**: Forcibly brightening or crushing shadows destroys contrast hierarchy.  
**Solution**: In the monitor OSD, set **Black Stabilizer to 50** (the standard value) or turn off shadow control.

### 🎨 Trap 2: Color Gamut & Color Mode (Most Critical)

**Symptom**: Colors appear oversaturated — greens become harsher, reds shift toward orange, cool tones turn warm, and overall colors deviate from the design intent.  
**Cause**: The monitor is operating in a wide‑gamut mode (DCI‑P3 / Adobe RGB), but **all Moongate colors are designed for the sRGB color space**. A wide‑gamut monitor maps sRGB values into a larger color space, stretching the saturation of every color. For example, the design value `#34d399` (green‑400) will render as a more vivid green on a P3 display, deviating from the intended appearance.  
**Solution**:

1. **Best**: Select **sRGB mode** in your monitor's OSD (most reliable).
2. **Alternative**: If no sRGB mode is available, force sRGB at the OS level — disable HDR on Windows; macOS typically handles this automatically via ColorSync.
3. **Fallback**: Choose "User Defined" and set saturation to 50.

> **Why is sRGB so important?** Moongate's WCAG contrast validation uses the sRGB linearization formula; in wide‑gamut mode the rendered RGB values deviate from the specified ones, so the premise of that validation no longer holds.

### 🔪 Trap 3: Sharpness

**Symptom**: Character edges show "ghosting" or "halos", especially in light mode where dark text may appear fuzzy.  
**Cause**: Excessive sharpness causing overshoot.  
**Solution**: Lower **Sharpness to 50‑60** to restore natural edges.

---

## 🖥️ III. Panel Technology & Color Accuracy

Different panel technologies have vastly different color reproduction capabilities. Here is a reference for common panel types:

| Panel Type | Color Accuracy (Delta E) | Color Gamut                   | Dark Performance           | Impact on Moongate                                                             |
| ---------- | ------------------------ | ----------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| **IPS**    | Medium–High (1–3)        | Usually sRGB, some wide‑gamut | Medium, blacks appear grey | Dark mode background may lack depth                                            |
| **VA**     | Medium (2–4)             | Usually sRGB                  | Excellent, deep blacks     | Best dark mode layering                                                        |
| **TN**     | Low (4–8)                | sRGB only                     | Poor, shadow details lost  | Light mode acceptable; dark mode shadows may crush                             |
| **OLED**   | High (1–2)               | Wide‑gamut (P3)               | Perfect pure black         | **Must switch to sRGB mode** — colors will be severely oversaturated otherwise |

> **About Delta E**: Delta E measures color accuracy — lower is better. Delta E < 2 is professional grade (imperceptible to the human eye), 2–4 is good, and > 5 means visible color deviation. If your monitor has a factory Delta E > 5, Moongate's colors may significantly deviate from the design intent on your screen — in that case, calibrating the monitor or choosing a more accurate display is the fundamental solution.

---

## 📊 IV. Moongate Brightness Calibration Method (Mode‑Specific)

You need a professional online test tool. Recommended sites:

- [Lagom LCD test](http://www.lagom.nl/lcd-test/black.php) (black level / white saturation)
- [Eizo monitor test](https://www.eizo.be/monitor-test/) (black/white level)

### Dark Mode Calibration (Night Environment)

1. Open the [Black level test page](http://www.lagom.nl/lcd-test/black.php) in a **completely dark room**.
2. Let your eyes adapt for 2‑3 minutes.
3. Adjust the monitor's brightness until the **2% gray patch** (the second patch) is just barely visible – it should be very faint, but definitely present.
4. If the 1% patch is completely invisible, that is normal due to the physical limits of the panel (especially IPS). **Use the 2% patch as your target.**

### Light Mode Calibration (Daytime Environment)

1. Open the [White saturation test page](http://www.lagom.nl/lcd-test/white_saturation.php) under typical office lighting.
2. Observe the brightest patches on the far right (usually labeled 250, 251, 252, 253, 254, 255).
3. Adjust brightness (and fine‑tune contrast if needed) so that these patches are clearly distinguishable—**the 255 pure white patch should appear pure white, but not glaring, with a sharp boundary between 254 and 255**.
4. If multiple bright patches blend into a single white mass, brightness or contrast is too high; if the brightest patch looks dull gray, brightness is too low.

---

## 🌗 V. Ambient Brightness Recommendations (Mode‑Specific Reference)

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
>
> - The brightness ranges above are **empirical reference values** based on typical monitors (with a brightness range of 250–350 nits), not absolute standards.
> - **There is no universal correlation between a monitor's OSD brightness percentage and its actual brightness (nits).** Always rely on your actual visual perception of the test page.
> - The ultimate goal of calibration is: under the corresponding ambient lighting, the bright patches from 250 to 255 should be clearly distinguishable, and the 255 patch should not be glaring. **The numbers are for reference only; your eyes' comfort is the only true standard.**

---

## 🤝 VI. Feedback

If you have followed the calibration above and still find some elements too bright or too dark, feel free to share your experience. If your monitor has "dynamic contrast", "vivid mode", "Black Stabilizer > 50" or similar enabled, turn them off first and compare again.

---

## 📌 Appendix: Hardware Limits

If, after calibration, the 2% gray patch remains invisible in dark mode, or the 250–255 bright patches are still hard to distinguish in light mode, that is usually your monitor's physical limit — prioritize eye comfort.

[⬆ Back to top](#)
