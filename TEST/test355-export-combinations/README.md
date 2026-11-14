# TEST355 — Recover exporter combinations (experimental)

**Branch:** `gh-pages` · **Isolated URL:** https://serigrafiamdp-web.github.io/lvllvl-scummpet-export/TEST/test355-export-combinations/

**User issue:** `RICO TEST246: para exportar el grupo sin Map Scroll, todavía falta integrar la transición entre varios frames.`

## Confirmed code cause
`TEST/test247-group-scroll-fast/js/RICO_GROUP_STANDALONE_TEST247.js` had `if(frames.length!==1) throw ...`, a blanket refusal regardless of whether the frames were identical. In a multi-frame Group-only project, the older export chain selected TEST246 and emitted that message.

## New implementation
`js/RICO_GROUP_MULTIFRAME_TEST355.js` wraps only projects with *Group Animate and no Map Scroll*, preserving all other exporters unchanged. It delegates single-frame, no-group and mixed Map Scroll projects to the old chain.

1. **Multiple identical visible frames:** share existing Group engine and unchanged map. This removes the unnecessary blanket frame-count rejection. Since no visual properties change, no duplicate frame data or reinitialization is required; Group animation runs continuously.
2. **Multiple different visible frames:** extend Group engine with frame index and 16-bit per-frame raster timing. Stage the next 40×25 character screen in the unused VIC screen buffer ($0400/$0800), update colors in the main loop, switch screen on raster IRQ, and preserve the Group charset scheduler. Retain the current BANK1/2 font flip in Ping Pong alongside the selected screen.
3. **Preserve memory layout:** character banks $3000/$3800, first frame screen/color resources $4000/$4400, extra frame resources (2 KB each) within $4800–$9FFF, Group runtime/data at $A000/$A800. **Don't place lower-address data after $A000:** LVLLVL's assembler reports the last segment end and can silently truncate the Group runtime from the PRG (caught and fixed during development).
4. Preserve all source JSON pixels/frames. No automatic mutations, no auto-disabling character animations, no substitute static PRG, no changes to frozen MASTER or root.

## Synthetic verification — not VICE PASS
All 12 scenarios below used real TEST168/186/243/244/245/246/247 and the actual LVLLVL native `Assembler` extracted from `js/main.js`, with representative 256-glyph maps and groups.

| Group direction | Pixels/tick | Visible frames | Font bank | Assembler |
|---|---:|---|---|---|
| Left | 1 | 4 different | 1 | OK |
| Right | 8 | 4 different | 1 | OK |
| Up | 4 | 4 different | 1 | OK |
| Down | 2 | 4 different | 2 | OK |
| Ping Pong Left | 8 | 4 different | 1 | OK |
| Ping Pong Right | 8 | 4 different | 2 | OK |
| Ping Pong Up | 4 | 4 different | 1 | OK |
| Ping Pong Down | 8 | 4 identical | 1 | OK |
| Ondas Left | 4 | 4 different | 1 | OK |
| Ondas Up | 8 | 4 different | 1 | OK |
| Left | 4 | 4 identical | 2 | OK |
| Right | 2 | 4 identical | 1 | OK |

For varying-screen cases, assembled PRG includes the Group code at $A000 and new frame data at $4800–$9FFF. JavaScript syntax and assembler success passed. **No VICE/emulator playthrough has occurred, and timing/flicker/fine colors are not certified.** The existing Group-only engine normalizes `ondas-*` to its older Ping Pong runtime; this does **not** establish original progressive Ondas semantics.

## Other restrictions audited; not removed blindly
| Combination | Current finding | Next technical integration |
|---|---|---|
| Group-only + several identical frames | Old TEST246 blanket block was unnecessary | **Restored in TEST355** |
| Group-only + several different frames | Missing frame transition engine | **ASM generator implemented in TEST355; VICE PASS pending** |
| Group + Map Scroll + multiple frames | Different engine chain, not tested by this patch | Shared Map+Group+Frame scheduler |
| Two or more Group animations | TEST247 `readGroup` takes exactly one group | Multiple independent group schedulers; prevent overlapping destination writes |
| Group + per-glyph individual animation | Potential simultaneous writes to same glyph | Compositor / conflict resolution, preserve both settings |
| Group + frame switch between BANK1 and BANK2 | Current same-bank font runtime cannot represent bank changes | Integrate per-frame $D018 bank switching and group writes |
| Group + SID | SID and Group schedulers not yet integrated for this path | RAM/timing/IRQ composition, not a silent no-music fallback |
| ECM + Group + multiframe | VIC ECM allows 64 physical glyphs and four backgrounds | Shared ECM repack and palette registers, not disabling ECM silently |
| Bitmap Multicolor + Group | Bitmap engine does not operate on the same character pixels | Separate bitmap compositing route |
| More differing frames than available 2 KB frame banks | Actual memory exhaustion without compression | Delta frame encoding or address-space allocator |
| Map Scroll limits inherited from TEST186 (96 columns) | Replaced by later horizontal TEST326+327 for some modes | Use current engine routes, not revert to TEST186 |
| Window/Scroll Area mismatch | TEST354 narrow source diagonal case | Test-specific recovery; no global enlargement of JSON |

This audit distinguishes *arbitrary one-frame guards* from *genuinely absent composition* and real VIC-II/memory limits. No underlying feature should be dropped to make a download succeed.

## How to test
1. Open isolated TEST355, hard refresh Ctrl+F5.
2. Load a project with Group Animate, **no Map Scroll**, two or more frames, 40×25 source window, no SID.
3. Export PRG. Inspect `window.RICO_TEST355_GROUP_MULTIFRAME.state`: `ASSEMBLED` and route `SHARED FRAMES` or `DOUBLE SCREEN`.
4. In VICE PAL, verify each frame, independent Group animation, color integrity, pingpong bank flips and repeated loop. Report actual failure image/VICE details.
5. Then test a former single-frame PASS project and the CALACA TEST354 diagonal case to detect regressions. TEST355 must delegate these routes unchanged.

**Do not promote to root or MASTER until user PASS on hardware/emulator.**
