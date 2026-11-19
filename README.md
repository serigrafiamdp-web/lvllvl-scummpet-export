# LVLLVL RICO — Commodore 64 Graphics, Animation & Export Tools

**Last updated: November 19, 2026** · Based on [James's LVLLVL](https://github.com/jaammees/lvllvl), extended and developed by **RICO**.

**[Launch LVLLVL RICO](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)** · **[Explore the live code (gh-pages)](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/gh-pages)** · **[Full feature and module inventory](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md)**

> **For developers:** GitHub displays this README from `main`, but the live editor and its active export engines are maintained on **`gh-pages`**. The `main` branch retains older code; its README is kept in sync to present the current features. Always use the online editor linked above when testing changes.

## RICO Features — New Tools and Improvements

### 1. Dual Charset, Tilesets & Drawing Tools

- **BANK 1 + BANK 2:** two independent sets of **256 characters at 8×8 pixels each** (512 characters to work with). Edit and preview either bank and select the active bank per frame.
- **Shifted BANK 2:** initialize the second bank with the C64 Shifted character set, then customize it without replacing BANK 1.
- **Rico's Remix Tileset:** replace and mix characters between banks, including **C64, Swedish and Japanese** character sets and their Shifted variants.
- **Remix Double Height:** split an **8×16** character into two C64 8×8 characters. **Remix 16×16:** split a design into four 8×8 characters.
- **Local Tileset Library:** save, import and reuse custom tilesets in the browser.
- **Edit Group Chars:** edit several characters as a single canvas; select, copy and paste multi-character blocks.
- **Improved C64 Palettes:** Colodore, Pepto and VICE, with all **16 color indices** read correctly and palette selection preserved. A C64-only palette selector keeps the interface focused.
- **ECM / EBCM:** tools for character selection and reorganization, multiple background colors, and a repaired Extended-mode export path preserving all four backgrounds.

### 2. Character & Group Animation

- **Individual Animate:** animate characters within each bank, with shifts and effects available according to the active mode.
- **Group Animate:** animate multiple characters as one continuous canvas, with movement, ping-pong variants and visual editing.
- **Speed controls:** tick timing and movements of **1–8 pixels per step** on supported paths.
- **Multiple frames:** frame durations, sequence, colors and character-bank selection, with animated previews inside the editor.
- **Animation + Scroll:** specialized engines aim to combine map movement and character animation without silently replacing animated elements with static images.

### 3. Rico's Map Scroll, Window & Dimensions

- **Eight scrolling directions:** Left, Right, Up, Down and all four diagonals.
- **Ping Pong**, **Move In** and **Move Out** for the movements available in the dialog.
- **Pixels/Step (1–8)** and **Ticks/Step** controls for displacement and speed.
- **Window Dimensions:** define the visible viewport independently of the full map size.
- **Scroll Area:** select the source region to scroll, independently of the Window and the full artwork.
- **Four-sided Dimensions controls:** extend or adjust Left, Right, Top and Bottom without restricting a project to a single C64 screen.
- **Per-frame configurations**, previews and viewport guides for maps larger than the visible area.

### 4. Multicolor, Bitmap & Music

- **C64 Text Multicolor** and **Extended Background Color Mode**, with mode-specific color tools.
- **Multicolor Bitmap (experimental):** drawing, color remapping, live previews and **Rico's Decolorize**.
- **Bitmap optimization:** alternate buffers, tile grouping, lookup tables and specialized speedcode on supported paths.
- **Integrated SID music** in selected PRG engines, with audio/video synchronization options. Not every scroll, group-animation and SID combination has been verified.

### 5. C64 Program Export

- **Export PRG:** specialized paths for text, multicolor, EBCM, horizontal/vertical/diagonal scrolling, banks, frames and some SID-assisted animations.
- **Fine scrolling and Color RAM optimizations:** incremental updates, direction-specific processing and double buffering in compatible engines.
- **Restored EBCM export:** Extended mode is honored again in the reproducible LILCHEB case; BANK switching must not overwrite the four EBCM background colors.
- The original editor's **Export C64 (NEW)** and **Export C64 Assembly** options remain available.
- **Interface → 64tass Export (experimental):** generates a ZIP containing ASM captured from the active PRG path, binary assets and a reference PRG for developers to inspect and rebuild. **This is not yet a universally verified exporter**: one rebuilt animation returned to BASIC, and byte-for-byte equivalence plus execution in 64tass/VICE still require validation.

### 6. Workspace & Interface

- **Right-hand Dock** with adjustable Tile Editor / Tiles panels and a default **50/50** layout.
- Improved previews for banks, character sets, frames, visible regions and tile controls.
- **Optimized startup:** removed the initial workspace flicker observed when loading the editor.
- **SpotySID** button next to HELP, opening the SID player in a new tab.

## Recent Improvements You Can Try

| Improvement | Observed result / What to test |
|---|---|
| **C64 Palettes** | Correct 16-color handling for Colodore/Pepto/VICE and a dedicated C64 selector; confirmed in the editor. |
| **Editor stability** | Startup workspace flicker fixed and confirmed by the user. |
| **EBCM Export** | Restored Extended mode and background colors in LILCHEB; confirmed for that project. |
| **64tass Export** | Available under Interface with its final name; **producing a working rebuilt executable is still in progress**. |
| **Dock & Banks** | Updated panel proportions and dual-bank presentation while retaining existing editing tools. |

## How to Test the Features

| Feature | Suggested steps | Expected behavior |
|---|---|---|
| **Dual BANK & Remix** | Open a C64 project, switch between BANK 1 and BANK 2, and try Remix Tileset with a Shifted, Swedish or Japanese charset. | Edits affect the selected bank; BANK 1 stays intact when editing BANK 2. |
| **Double Height / 16×16** | Use Remix to load a double-height character or 16×16 tile module into the charset. | The result consists of two or four C64 8×8 characters. |
| **Group Animate** | Select several tiles, configure a group animation and preview it. | Group motion, timing and effects remain coherent across the selected characters. |
| **Map Scroll** | Build a map larger than the Window, define the Scroll Area, and change scrolling direction and Pixels/Step. | The map moves within the preview without changing artwork outside the selected region. |
| **Extended / EBCM** | Configure per-cell background colors, choose **Extended** in Export PRG and run the resulting PRG in VICE. | All four background colors are preserved across frames. |
| **Multicolor Bitmap** | Switch to the experimental bitmap mode, paint and test Decolorize. | Editing and previews remain consistent; test the exported PRG separately. |
| **SID + Animation** | Choose a supported export path, build the PRG and run it in VICE. | Music and frames run with the intended timing; document the exact combination used. |
| **64tass Export** | Open **Interface → 64tass Export**, generate a ZIP and try to rebuild it using 64tass. | Compare the result with `reference.prg`; if it returns to BASIC, record the load address and startup behavior. **Do not mark it as passing without execution.** |

**Not every option available in the UI has an equivalent, fully working PRG export path.** When reporting an issue, include the C64 mode, dimensions, Window/Scroll Area, direction, pixel/tick settings, bank, frame count, groups, SID settings and the observed behavior in VICE.

## Work in Progress

- Combine **Map Scroll + Group Animate + Individual Animate + frames + BANK + SID** without losing effects.
- Extend **ECM/EBCM with BANK 2 and additional combinations**, respecting C64 memory layout and VIC-II registers.
- Make **64tass Export** produce reproducible, working PRGs and verify them in VICE.
- Expand the export compatibility matrix without reintroducing arbitrary restrictions or disabling previously supported workflows.

## For Developers: Where Everything Lives

The script order in **[`gh-pages/index.html`](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/index.html)** is essential. The original bundled application is in `js/main.js`; extensions live in `js/RICO_*.js` and `TEST/.../js/`. Many files named TEST are **active production code**, not disposable experiments.

```text
JSON / TileSet / Layer / Frames / BANK 1 + BANK 2
          ↓
Individual Animate / Group Animate / Map Scroll / SID
          ↓
ToPRGAdv.prototype.createPRG(args)  ← export-engine and wrapper chain
          ↓
6502 ASM → integrated assembler → PRG → VICE
```

**Further documentation:**
- [Technical feature inventory, modules and limitations](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md).
- [Map Scroll + Group Animate architecture](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/ARQUITECTURA_ACTUAL_SCROLL_Y_GROUP_2026-11-14.md).
- [Export status and remaining work](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/PROGRESO_2026-11-16.md).
- [Technical index and development notes](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/README.md).
- [Test history and PASS/FAIL records](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/TEST/README.md).
- [Recovery checkpoint before further exporter changes](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/tree/release/test372-pass-2026-11-16).

**Development approach:** test against the same public editor URL, preserve existing paths, and compare generated ASM, PRGs and actual VICE execution. Do not publish private JSON, SID or PRG files without permission. Credit for the original editor belongs to [James and the LVLLVL project](https://github.com/jaammees/lvllvl).

---

**[Launch the online editor](https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/)** · **[Explore features and source code](https://github.com/serigrafiamdp-web/lvllvl-scummpet-export/blob/gh-pages/docs/FEATURES_RICO_2026-11-17.md)**
