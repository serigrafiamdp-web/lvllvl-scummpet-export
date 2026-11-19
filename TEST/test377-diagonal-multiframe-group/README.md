# TEST377 — Diagonal multiframe Map Scroll with Group Animate

**19 November 2026 — code-generation QA passed. VICE playback PASS pending.**

The diagonal multi-frame exporter previously delegated projects with an active Group Animate to older exporters, resulting in animation and scroll but a fixed first frame.

This version preserves native Group Animate from each frame while using the frame342 scheduler: `frame342_tick`, `frame342_stage`, `frame342_load` and `frame342_commit`. The original diagonal group runtime (`group182_irq_tick` and `group182_step`) is also emitted; both systems run independently.

Per-frame source data, colors, durations, diagonal direction, speed and charset bank are preserved. A temporary collection proxy enables 40x25 Window projects with narrower Scroll Area: actual cells are reloaded unchanged after collection. No JSON is edited.

The group kernel inserts comments after the `$A000` origin, so the data-packing anchor now targets the origin rather than the old stub label.

Isolated tests with the actual TEST196 source generator and synthetic editor data passed: 2 diagonal frames + Group, 4 frames + narrow 38x25 source + Group; two distinct frame maps; clock and Group ASM both present; no-group narrow project still follows existing TEST354. Multiple independent group clocks are diagnosed rather than silently omitted.

Test using the live editor with the group's configuration active, and verify the resulting PRG in VICE PAL. Frame index is at zero-page `$29` in this runtime (VICE monitor: `m $29 $29`). It should cycle 0..N-1. Identical artwork in multiple frames can make frame transitions visually indistinguishable; use different drawings or directions when checking.

This path retains the native 40x25 Window requirement. Mixed cardinal+diagonal direction and multiple independent group schedulers still need their own composition route. Do not claim universal compatibility before VICE PASS.

**Rollback:** the previous TEST363 script remains unchanged in the repository; change only the script reference in `gh-pages/index.html`.
