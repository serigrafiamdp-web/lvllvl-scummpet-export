# RICO TEST08 — REMIX TILESET MENU

Base:

`main` after the validated Choose Tile Set bug fix.

## New menu entry

Inside the top `Tiles` menu:

1. `Choose A Tile Set...`
2. `Rico's Remix a Tileset...`
3. `Load / Import Tile Set...`

The new entry has its own permanent ID:

`rico-tileset-remix`

## TEST08 ONLY

For this first test, the RICO entry deliberately opens the exact same original
`Choose A Tile Set` dialog.

No dialog internals are changed yet.

No tile-set processing is changed yet.

No ECM behaviour is changed.

The separate ID is the future branch point for RICO Remix functionality.

## PASS

- New option appears immediately below `Choose A Tile Set...`.
- Clicking it opens the same chooser.
- Original `Choose A Tile Set...` still works.
