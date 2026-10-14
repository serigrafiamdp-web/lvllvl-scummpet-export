# RICO TEST07 — CHOOSE TILE SET LOADER

Base:

`milestone/rico-ecm-editor-pass-14-oct-2026`

Observed regression:

- Tiles -> Choose Tile Set opens normally.
- Clicking different presets changes the selected row/title.
- The preview image stays on the previous charset.
- Pressing OK also fails to replace the active tileset.

TEST07 changes one subsystem only: charset image loading.

- Preview: one fresh Image object per selection.
- Stale asynchronous preview loads are ignored.
- Cache-busting query added per preview request.
- Apply/OK: one fresh Image request per selected preset.
- Existing TileSet import/update pipeline is retained after the image loads.
- Vector presets continue through original LVLLVL handling.

RICO ECM modules are unchanged.

PASS criteria:

1. Clicking Amiga / Intellivision / VIC 20 visibly changes preview.
2. Clicking OK replaces the active tileset.
3. TEXTMODE -> ECM RICO behaviour remains unchanged.
