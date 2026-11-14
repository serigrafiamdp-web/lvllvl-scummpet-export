# TEST357 — Floating / dockable panels + BANK 1 / BANK 2 scroller

Experimental and **isolated** version built on verified TEST356. No modification to root, MASTER, PRG exporters, bank data, imported art or existing palettes.

## Purpose
LOBO reported that the character panel takes up the right-hand space and can cover lower controls. The side character panel is UI-managed by LVLLVL's fixed east SplitPanel.

## New interface
- **Tile Editor** (left), **Tiles**, **Colours** and **Layers** panels can be undocked (↗ on the header) and dragged anywhere on screen.
- Drag a floating panel's header near the **rightmost 96 pixels** of the browser window to re-dock it; use the 'Dock ↘' button as an alternative.
- Dragging a docked title away also detaches that panel.
- Floating windows are resizable by the lower-right corner. Original DOM nodes/canvas are reused — not duplicated — so character selections, thumbnails and editing callbacks remain the existing ones.
- Tiles title adds **B1 — draggable slider — B2**. B1 jumps to character indices 0–255; B2 jumps down to 256–511. The slider scrolls the continuous 512-tile native palette. Current frame's charset BANK selection still determines which characters are editable. Inactive bank still dims as before.
- The native tile scroll bar and Columns of 16 order are preserved. No extra indices or duplicate panels are created.

## Technical contract
Only CSS and existing editor panel DOM placement are changed. The native LVLLVL SplitPanel remains the source of docked positioning. On docking, the same DOM node returns to its exact native parent; saved inline styles are restored. No file/PRG export code is changed. Each floating panel is contained in a viewport-fixed resizable host.

## Browser verification (not yet PASS)
1. Open https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test357-dockable-panels/ and refresh Ctrl+F5.
2. Open project with two different 256-glyph banks. Click ↗ on **Tiles**, move it, resize it and click glyphs.
3. Move floating window to browser right edge and release: it should dock back into its native sidebar slot. Try the Dock ↘ button.
4. Open **Tile Editor** (left), use its ↗ button, move and resize the same editor with its character animation controls still functional. Closing it must restore the native left panel.
5. Drag the B1/slider/B2 handle. BANK1 and BANK2 must be visible in one scrolling index. Verify active-bank editing still works, and inactive bank is not selected by mistake.
6. Repeat detach/dock with Colours, Layers. Ensure the bottom Frames toolbar does not overlap.
7. Retest TEST356 palette switch (Colodore / VICE / Pepto), side tile thumbnails after editing and PRG export regression.

**Fix B2 (2026-11-14):** the previous version targeted only the right-side Tiles index. It did not handle the left Tile Editor the tester identified. We now attach the same draggable control to the original `#tileEditor` DOM, preserve animation controls and patch close/visibility to return it safely. Switched the Tiles target to its real `#sidecharPalette` content, and changed the index script query to bypass browser caching.

**Known: unverified in browser.** The initial design retains the native sidebar footprint when a panel is floating, because shrinking the native SplitPanel before verifying callbacks could destroy controls. We can compact the reserved dock area after user confirms moving/docking works. This test does not add persistence on reload.

Report browser PASS/FAIL with screenshot; do not promote to root/MASTER until user acceptance.

**B2 scope:** Docking returns every window to its native position (Tile Editor to the left). A movable Tile Editor that also docks into a *new right tab* is a separate UI integration, not yet implemented. Do not mistake a working float for full right-side docking.
