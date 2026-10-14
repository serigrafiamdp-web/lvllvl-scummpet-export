# RICO CHANGELOG

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
