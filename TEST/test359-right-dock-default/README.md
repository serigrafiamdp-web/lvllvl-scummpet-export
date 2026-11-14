# TEST359 — Default right dock workspace; full glyph index and Tile Editor

**Experiment pending browser PASS.** New isolated build on TEST358 C3 (right-side native SplitPanel **visually PASS**) and TEST356 (C64 palette indices PASS). Branch: `gh-pages`. No changes to MASTER, root, JSON import, 512-character virtual bank data, PRG exporter or VIC code.

Live: https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test359-right-dock-default/

## Desired startup (user reference screenshot 2026-11-14)
Open with the **right sidebar** divided into two panels: **Tiles above, Edit Tile below**. The old Edit Tile left column stays hidden to maximize workspace; no black placeholder.

- Automatically dock the actual live Edit Tile DOM into the existing native right-side `UI.SplitPanel` after the document/tile set becomes available. Do not briefly reveal the left drawer.
- Initial **Tiles** palette at **100%** scale, `Columns of 16`. Both virtual C64 banks (0–255 and 256–511) remain in one continuous vertical index; native scrollbar and B1/slider/B2 controls still work.
- Set right-hand split at roughly **56% Tiles / 44% Edit Tile**, adapting to screen height. The goal is to display all 512 character thumbnails if the viewport fits while keeping glyph editor usable. Smaller windows scroll instead of cropping data.
- Native Edit Tile canvas is capped to **222 px**, or less on short windows; its own original options and animation controls remain scrollable in the lower pane.
- Double-click on any character keeps/reopens the **existing right-docked Edit Tile**; never opens the old left Edit Tile.
- Closing only the **Tiles** index (its original X) collapses its own native center section and lets Edit Tile use that space. Existing native menu can reopen Tiles via the overridden visibility getter/setter. Does **not** close Edit Tile or the right sidebar.
- Closing **Edit Tile** hides its own right section; a double-click reopens it docked right. Other independent panels (Colours, Layers, Blocks) remain under native LVLLVL visibility controls.
- Floating, resizing and docking right continue to use TEST358. Manual floating should not be overridden after startup completes.

## Browser checks
1. Hard refresh TEST359: Tiles and Edit Tile should appear on the right **automatically**; left map area should expand with no black left strip.
2. Inspect index at 100%: top and bottom bank glyphs reachable, no missing thumbnails. B1/B2 and mouse-wheel scroll work; only active bank selectable.
3. See complete 8x8 glyph in the lower Edit Tile. The controls beneath it are reachable using the panel's own scroll, and divider resizes both panes.
4. Double-click a character (ideally test BANK1 and BANK2): Edit Tile stays on the **right** and displays the correct glyph.
5. Click the original **Tiles X**: only Tiles closes; Edit Tile remains on the right. Reopen Tiles using its View menu toggle, if available. Verify double-click glyph editing after reopening.
6. Close Edit Tile with its own X, then double-click another character and confirm right dock again. Check floating ↗ and Dock ↘ both still work.
7. Switch Colodore → VICE → Pepto and verify 16 color index preservation as in TEST356; confirm Groups/Frames/SID/PRG behavior unchanged for regression.

## Native UI implementation
TEST359 is an additive script loaded after TEST358 C3. It uses existing `window.RICO_TEST358_DOCK`, `UI.SplitPanel`, `TileEditor` and `TextModeEditor` APIs. It does not duplicate character grids or canvases and does not modify serialized data. Original right-side sidebar and menus still control their native panels.

**Verification:** script syntax and GitHub `gh-pages` contents checked. **No live browser interaction/VICE performance test recorded yet.** Do not merge to root or MASTER without user PASS.
