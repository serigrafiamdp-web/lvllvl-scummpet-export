# TEST369 — Avoid repeated native workspace resize on startup

**Issue:** User sees brief flashing in the central drawing workspace after app startup, then stabilizes. It might predate the C64 palette fixes. Do not attribute it to palette changes without evidence.

**Static root cause candidate:** the existing TEST80 UI layout module calls \`root.resizeThePanel({panel:'south',size:54})\` on every \`layoutBottom80()\` invocation. It invokes \`layoutBottom80()\` from a document-wide \`MutationObserver\`, a \`ResizeObserver\`, a 700ms \`setInterval\` and initial load. In the original \`UI.SplitPanel.resizeThePanel\`, the south resize calls the native \`resize()\`, which reaches the central workspace \`center.resize()\` even if the height has not changed. The combination can create avoidable transient canvas resizes/draws during startup.

**Minimal change:** TEST369 copies the original TEST80 script and skips only duplicate native \`resizeThePanel('south')\` calls once the same connected DOM south pane is already fitted at 54px. Its first native resize after DOM attachment and subsequent actual size changes still proceed. All other TEST80 features, timers, observers, menu, palette, Bank 1/2, Dock TEST358/359, frame UI, and render/export scripts are untouched. The working gh-pages index loads this copy in the original TEST80 script position; original remains on disk for single-line rollback.

**Acceptance:** Open usual URL, restart/reload several times, observe initial workspace flashing; confirm 54px Frames bar, sidebar 50/50 docking, viewport dimensions, drag handles, bank preview, and manual resize unchanged. Regression of palette TEST364/365/366 and SpotySID TEST368. User PASS pending.

**Caveat:** This addresses a documented redundant resize path, but no in-browser trace proving it is the sole cause has yet been captured.
