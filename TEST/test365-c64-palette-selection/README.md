# TEST365 — Remember C64 palette preview choice

**Status: isolated test, waiting for user PASS.** Production root and MASTER branches are untouched.

## User-reported behavior
TEST364 PASS: New Project now accepts Pepto. In the System Palettes chooser, the user selects **VICE** as the Commodore 64 option; on closing and reopening, **Colodore** appears selected again.

## Root cause
The original LVLLVL \`ColorPaletteChoosePreset.showSystemColorPalettes()\` calls \`colorPaletteDialogSelect('c64_colodore')\` every time the dialog is rebuilt. That method regenerates its option radio group with the **first option checked**, sets \`selectedPaletteId\` to Colodore, and loads Colodore preview. This is independent of C64 PNG decoding.

## Fix
A narrow wrapper around \`ColorPaletteChoosePreset.colorPaletteDialogSelect\` remembers the displayed C64 radio option before the original routine resets it and restores the radio and preview image after the routine runs. Only **c64_colodore, c64_pepto, c64_vice** are affected; no changes to the other presets, palette storage, screen indices, export, dock, or master. Original option order remains Colodore / Pepto / VICE; TEST364 PNG reader and TEST356 index-preservation remain active.

## Reproduction and PASS steps
1. Open the test URL: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test365-c64-palette-selection/
2. Open **New Project**, select **Commodore 64 -> VICE** and click **OK**.
3. Reopen **Choose A Colour Palette**. VICE should still be selected, and the visible colors should be VICE (not Colodore).
4. Repeat with **Pepto**, then **Colodore**. Switch briefly to other system palette entries and back to Commodore 64: the last C64 option should remain selected.
5. Verify TEST364 (new project succeeds, no alert), and switching C64 variants still keeps artwork indices fixed.
6. Optional console: \`window.RICO_TEST365_PALETTE\` shows the last restored C64 option.

**Note:** browser/runtime PASS is pending. Selection memory is in the open editor session; no new persistent storage is introduced.