# LVLLVL SCUMMPET EXPORT — RICO MOD

Custom LVLLVL fork used by the SCUMM-PET-C64 workflow.

## Upstream reference

Original project:

`jaammees/lvllvl`

Reference commit:

`b528e4c1d38faeadb0e24eb619705e4f0b8ab899`

That upstream state is our clean baseline. RICO changes are kept as separate modules
under `src/js/rico/` and `dist/js/rico/` whenever possible so we can always compare
behaviour against James' original editor.

## Current RICO milestone

**14/10/2026 — ECM editor features PASS**

Validated features:

- live TEXTMODE -> C64 ECM repack preserving used glyphs;
- manual choice of the 64 physical ECM glyphs when frames are still empty;
- ECM -> ECM reselection, allowing unused glyphs to be swapped later;
- native-style `Edit Tile Palette` UI:
  loaded tileset on the left, 64 ECM glyphs on the right.
- **Choose Tile Set reliable loader**: preset preview and `OK` application restored.

Full documentation:

`FEATURES_RICO.md`

## Build / deployment

GitHub Pages deploys `dist/`.

For that reason every promoted RICO feature is present in both:

- `src/js/rico/`
- `dist/js/rico/`

and is explicitly loaded by both `src/index.html` and `dist/index.html`.

## Development rule

- `main` = validated RICO state.
- New behaviour is tested incrementally.
- Upstream James remains the reference if a RICO change breaks something.
- Google Drive/OAuth work is postponed and is not part of the current PASS milestone.
