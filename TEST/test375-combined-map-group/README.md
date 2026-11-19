# TEST375 — Map Scroll + Group Animate
19 November 2026. Publication pending VICE PASS.

Removed two outdated blanket restrictions in readGroup155:
- A single Group Animate could run only with one frame and no Map Scroll.
- Group Animate could not coexist with native character animation.

The compiler already emits group155_tick and frame_tick in the same 6502 runtime.
The original Group data, map speed, colors, frames and banks are left unchanged.
All other code in TEST374 is unchanged, including the previous performance patch.

Remaining genuine limitations: multiple independent group clocks and some group directions still need separate C64 runtime implementation; no group is silently removed.

Verify Group + Map in VICE. The uploaded JSON contains the Map Scroll but does not serialize the user's Group Animate settings.
