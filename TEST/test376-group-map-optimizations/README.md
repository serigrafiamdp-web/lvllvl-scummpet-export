# TEST376 — Fast Color RAM with active Group Animate + Map Scroll

19 November 2026. **VICE PASS pending**.

TEST375 removed the obsolete no-scroll and no-native Group rule. This test
also allows multiple compatible UP groups: same bank, height and tick clock.
Each original group's own columns remain independent; incompatible groups
are never discarded and require separate schedulers.

One-frame Right, Window/Scroll Area x=3 y=0 33x25, 8 px/tick, 1 tick
now performs the one-pass color scan even when Group is active.
The Color RAM IRQ write budget is 64..112 with animated groups, 144 without
groups and remains 40 in unrelated export cases. Pixels and speed unchanged.

Synthetic 6502 source tests: simultaneous right-scroll and group IRQ code;
multiple compatible groups merge safely; native anim not rejected; older
1px fast case unchanged; incompatible group clocks report a precise error.

JSON does not serialize Group Animate setup: test with the live editor session
that has the user's groups and verify actual PRG in VICE PAL.
All older exporter versions and rollback options remain available.
