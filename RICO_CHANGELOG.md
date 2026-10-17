# RICO CHANGELOG

## 2026-10-17 — MASTER LVL-RICO / TEST120 PASS

### PASS

- Animated Chars preview works without general editor flicker.
- Character ticks no longer repaint Current Tile, palettes or the complete Graphic/GridView.
- Only map cells using glyph IDs that actually changed are redrawn.
- Native C64 animation is preserved in VICE with BANK 1 at `$3800` and BANK 2 at `$3000`.
- TEST120 ZIP is the validation authority.
- `main/dist/` is promoted from the exact TEST120 PASS payload.
- GitHub Pages deployment now follows an exact ZIP -> full payload replacement workflow.

### MASTER

- `MASTER_LVL-RICO_17_OCTUBRE_2026.zip`
- SHA256: `7b98cb59532394b99410a9d26c5b90259b04ec21666f0c7ec6006479c96f709d`
- Pages exact-payload commit: `725930f44f3beb84ffee8fe07c771e438ee0546a`

## 2026-10-14 — ECM editor milestone

### PASS

- TEXTMODE -> ECM live repack preserves used characters.
- Empty-frame projects can manually choose the 64 ECM glyphs before conversion.
- ECM -> ECM can reopen the selector to replace unused glyphs.
- Source tileset is preserved for later reselection.
- Native LVLLVL-style `Edit Tile Palette` layout validated.
- Standard and custom loaded tilesets are used as the source shown on the left.

### Reference

Original James LVLLVL baseline:

`b528e4c1d38faeadb0e24eb619705e4f0b8ab899`

### Deferred

- Google Drive OAuth / origin configuration.


## 2026-10-14 — BUG FIX: Choose Tile Set

Classification: bug fix of RICO regression, not a new feature.

### PASS

- `Tiles -> Choose Tile Set` preview changes correctly when selecting presets.
- `OK` applies the chosen tile set.
- Fix is isolated in the RICO compatibility layer and does not modify James' original chooser source.
