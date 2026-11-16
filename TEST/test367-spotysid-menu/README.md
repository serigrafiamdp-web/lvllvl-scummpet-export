# TEST367 — SpotySID shortcut beside HELP

**Scope:** one external shortcut in LVLLVL's top menu (UI only). Requested target:
https://serigrafiamdp-web.github.io/RICOS-MOD-JAMES-SIDPLAYER-ONLINE/

The script inserts a native anchor immediately after the existing **Help** top-level menu element. It copies Help's menu classes for consistent appearance, opens in a separate browser tab (target=_blank, rel=noopener noreferrer), and leaves the LVLLVL editor tab and the active project untouched.

It does not add a dropdown or alter the Help menu. If the menu is not created yet when the script executes, a temporary MutationObserver waits for it and disconnects after the link is inserted. It is idempotent and affects no other UI.

**Acceptance checks:** 
1. Open the normal LVLLVL GitHub Pages URL.
2. Verify **SpotySID** appears directly next to **HELP**, matching the menu's style.
3. Click SpotySID. The supplied SpotySID URL should open in **another browser tab**.
4. Return to LVLLVL. The project and HELP menu should be unchanged.
5. Regression: C64 palette Colodore/Pepto/VICE chooser, dock and export unchanged.

Published on the existing gh-pages root. User PASS: pending.
