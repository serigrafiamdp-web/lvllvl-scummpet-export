# LVLLVL / SCUMM PET C64 — Experimental Export Branch

This repository is an experimental, non-commercial working copy based on the original **LVLLVL** project by **jaammees**.

Original project:
https://github.com/jaammees/lvllvl

## Credits

All original LVLLVL code, design and functionality remain credited to its original author and contributors.

This branch exists only to experiment with a project-specific export path for **SCUMM PET C64**.

We do not claim authorship of the original LVLLVL code, and no license is added to or implied for upstream code by this branch.

## Branch policy

- `main` = imported LVLLVL baseline/reference.
- `scumm-pet-c64` = experimental SCUMM PET C64 export work.
- No pull request to upstream is intended.
- No commercial distribution is intended.
- Upstream behavior should remain untouched unless a change is specifically required by the exporter.

## Goal

Add an export option for SCUMM PET C64 while keeping the editor workflow intact.

Target workflow:

```text
LVLLVL EDITOR
     |
     v
Export -> SCUMM PET C64
     |
     +--> charset.bin
     +--> framepack.bin
     +--> resource.json
     +--> report.json
     +--> FORMAT.txt
     |
     v
SCUMM PET C64 ENGINE
```

The current web normalizer remains the reference implementation until the integrated exporter produces equivalent output.
