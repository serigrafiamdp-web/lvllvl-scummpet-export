# TEST358 — Native right docking for Edit Tile, resizable floating panels

**Experiment, not browser PASS.** TEST358 derives from TEST357 B2, itself built on **TEST356 C64 PALETTE PASS**. It does not change root, MASTER, memory layout, PRG export, bank data or the color-index fix.

Live: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test358-native-right-dock/

## Why this route?
Original LVLLVL uses native `UI.SplitPanel` sections with draggable dividers and visibility toggles. Right sidebar tree:
`textModeEditor.east -> eastInfoPanel -> textModeEastPanel (north Layers, center eastTilesSplitPanel [center Tiles; south Blocks], south Colours)`.
Left Edit Tile normally resides in `gridSplitPanel.west`.

Instead of overlaying the right sidebar with a floating window, TEST358 inserts a nested **native UI.SplitPanel** inside the existing right Tiles container `eastTilesPanel` when Edit Tile is docked. It temporarily moves the *same* live Tiles view into the top native slot and the *same* Tile Editor into the bottom native slot.

- Draggable **native horizontal divider** between Tiles and Edit Tile controls their respective heights.
- **Colours, Layers and Blocks** remain managed by their existing native splitters, including visibility.
- Left editor column is hidden while Edit Tile is docked right, reclaiming canvas space.
- Closing Edit Tile returns it to its native home and collapses the temporary right split.
- Dragging/detaching Edit Tile opens a **resizable floating panel** with a visible bottom-right resize grip.
- Dragging a floating Edit Tile to the right edge, or clicking **Dock ↘**, places it in the right-hand section (not back in its left home).
- Tiles retains its **single 512-character scrolling index** (BANK 1: 0–255, BANK 2: 256–511) and its B1 / slider / B2 navigation. The original scrollbar and the previous 16-column order are maintained; BANK 2 is virtualized by existing TEST17, not duplicated in data.
- When floating or docked, original event handlers, tile editor bank controls, Group Animate UI and per-tile animations are preserved because the actual DOM nodes are reparented, not copied.

## Browser test (required)
1. Open live TEST358, force refresh with Ctrl+F5.
2. Open Tile Editor from any tile. Click ↗ (undock) and drag the **bottom-right corner** to resize smaller and larger; tile canvas and tools should remain usable.
3. Drag the floating editor by its title toward the **right edge** and release; Edit Tile must dock inside the right sidebar, **beneath Tiles**, and release the blank left editor column.
4. Drag the horizontal native splitter separating Tiles and Edit Tile, both directions. Do not obscure the bottom tools or Colours.
5. In Tiles, use B1/B2 and mouse wheel/scrollbar to inspect the continuous 512 glyphs. Active-bank safety (inactive bank cannot be chosen) remains inherited from TEST17.
6. Click the Edit Tile header ↗ to float it again. Close the editor via its original X. Open again to verify restoration and event handlers.
7. Repeat the TEST356 Colodore/Pepto/VICE 16-index test and edit characters in bank 1 and 2; ensure updated thumbnails and PRG export are unaffected.

## Boundaries and caveats
- This is a real runtime UI.SplitPanel inside the existing right Tiles section, not a rewrite of root layout. It does *not* yet support arbitrary tab reordering, saved layouts or docking into every possible slot.
- Neither VICE nor a full interactive browser runtime was executed before publication; JS syntax check and GitHub file checks passed. Browser PASS is still required.
- Do not promote until user verifies dock/resize and character edits in each bank.

## Backups
- TEST357 remains available unchanged.
- TEST356 PALETTE PASS remains unchanged.

## C3 — Right Dock fix (2026-11-14)

Reported: floating Edit Tile returned to the **left** when pressing Dock, while the previous black left area no longer remained. Verified root cause: the previous `prepareRightDock` tried `document.getElementById('eastTilesPanel')`, but LVLLVL `UI.create('UI.Panel',{id:'eastTilesPanel'})` registers `eastTilesPanel` as a *UI alias* and renders a DOM node using an auto-generated `uiNNN` ID. The destination lookup therefore returned null after the old code had already redocked Tile Editor to the left.

C3 resolves the actual live DOM element through `UI('eastTilesPanel').id`; creates the right native SplitPanel with sized top/south panel elements; validates the target before any move; and performs direct **floating -> right** reparenting without the intermediate left transition. The existing left `gridSplitPanel.west` stays hidden while docked right, retaining the user's already-working black-patch fix. Added `window.RICO_TEST358_DOCK.state.lastError` for diagnostics. The JS query string is bumped to `358-c3-right-atomic`.

**C3 source and syntax were verified in GitHub; browser behavior remains unconfirmed until user tests.**
