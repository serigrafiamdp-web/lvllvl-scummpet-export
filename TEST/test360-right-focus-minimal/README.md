# TEST360 — 256 characters + Tile Editor, right sidebar at 50/50

**Experimental; awaits visual PASS**. Built directly from TEST358 C3 (confirmed working right docking) + one small UI-only script. **No TEST359 code is loaded.** Not merged into root or MASTER. No changes to PRG export, charset storage, map data, color palette indices, animations or JSON.

Live: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test360-right-focus-minimal/?rev=A1

## Exactly what changes
1. Automatically dock original Tile Editor on the **right**, below original Tiles, when editor UI is ready. Left editor strip remains hidden (the C3 black-patch fix is retained).
2. Initialize native `UI.SplitPanel` **50% Tiles / 50% Tile Editor**. After the first layout, the user can still move the divider manually without TEST360 forcing it back.
3. Preserve native **Columns of 16** and the existing 200% palette zoom **when the first 256 tiles actually fit** into the top half. Bank 1 occupies the first 16 lines; BANK 2 (256–511) remains accessible by the existing scrollbar/B1-B2 control. If a short browser viewport physically cannot fit 256 at 200%, use native 100% as a fallback rather than clipping tiles. The test reports its observation in `window.RICO_TEST360.state.bankFit`.
4. Constrain Tile Editor's existing `#tileEditorCanvasHolder` width only **while docked** so the entire currently selected tile is visible in the bottom half. This keeps the original pixel editor callbacks and data.
5. The existing color controls `#tileEditorMultiColors`, `#tileEditorC64Colors` and `#tileEditorSubPaletteColors` are moved to the very bottom of Tile Editor's *existing scrollable region*. They remain accessible via internal scroll and return to their original HTML positions upon undocking. **They are not deleted or disabled.**
6. Double-click on a character reuses Tile Editor and prefers right docking. Floating/resize/dock remains handled by unchanged TEST358 C3.

## Focused browser acceptance
- Refresh: top right Tiles shows the 256 glyphs of the visible bank; bottom right shows the current selected tile **fully**; sections occupy about half each.
- No empty black editor column on the left.
- Scroll the Tiles index to BANK 2 then back to BANK 1, without changing stored charset or active editing bank.
- The colored squares must **not** be visible at the bottom of the default viewport; scroll inside Tile Editor to reveal them. Undock Tile Editor and verify they reappear in the original order.
- Drag the divider or undock/dock; the existing controls must work as before.
- Reload with a project and verify the same layout.
- Run a minimal editing/PRG export regression once visual layout passes.

## Status
Syntax check passed; all new artifacts are in GitHub `gh-pages`. Actual browser layout and the guarantee of 256 characters in a particular viewport remain **unverified until user screenshot**.

Only these 3 files were added inside `TEST/test360-right-focus-minimal/`.
