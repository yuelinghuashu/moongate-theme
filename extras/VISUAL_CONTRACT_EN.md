[🇨🇳 中文版](./VISUAL_CONTRACT.md) | English

---

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
>
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
