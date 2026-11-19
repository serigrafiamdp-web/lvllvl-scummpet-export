# TEST379 — Group Animate directions with C64 Map Scroll

November 19, 2026. Code-generation checks passed; VICE PAL PASS pending.

Recovered PRG generation for Group Animate Left, Right, Down, Ping Pong
(all four directions), and Ondas (all four, using the same Ping Pong-compatible
engine as the existing standalone Group exporter). Ordinary Scroll Up and
its established 2x8 optimized PRG path remain byte-identical to TEST376.

The actual TEST247 group parser and TEST186 6502 worker are reused, rather
than replacing character animations with static frames. The raster IRQ schedules
group ticks; character data updates run independently in the main loop,
before the next expensive map/Color RAM preparation.

The Map Scroll and frame code is left intact. The existing group pointer
aliases at $35-$38 conflict with the map engine's color state, so TEST379
relocates those four zero-page pointers to $4A-$4D.

Source-code checks: 12 group direction modes and 2-frame horizontal Map
Scroll (Left/Right); group tick and background step plus frame_tick present;
zero-page pointers relocated. Legacy UP generated source verified exactly
equal to TEST376. TEST378 diagonal multiframe remains untouched.

Known scope: multiple independently timed groups still require multiple
schedulers; frame data cannot overlap $A000, and this must be checked for
RAM occupancy. Ondas preserves the previous Ping Pong compatibility semantics.

Run the actual live project in VICE PAL to confirm characters move correctly,
frames continue, map scrolling stays smooth, and colors are intact.
Do not claim a VICE PASS solely from ASM-source generation.

Rollback: restore TEST376 script reference in gh-pages/index.html.
