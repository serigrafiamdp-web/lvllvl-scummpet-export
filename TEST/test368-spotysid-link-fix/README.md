# TEST368 — SpotySID beside HELP (actual menubar id)

**Cause of failed TEST367:** \`UI.create('UI.MenuBar', { id: 'menubar' })\` assigns a numeric DOM id to the component; \`menubar\` is only the logical alias in \`UI.ids\`. Therefore \`document.getElementById('menubar')\` in TEST367 always returned null, so the link was never inserted.

**Change:** Resolve the actual component with \`UI.get('menubar')\`, obtain the Help item from \`bar.menus\` and the rendered element under \`bar.getElement()\`; insert a styled native anchor after Help. The destination is \`https://serigrafiamdp-web.github.io/RICOS-MOD-JAMES-SIDPLAYER-ONLINE/\` with \`target="_blank"\` and \`rel="noopener noreferrer"\`. Existing Help functionality is untouched. Hook the UI-ready event and a temporary observer only if needed. The old TEST367 script is no longer loaded by the published root.

**QA:** Verify TEST368 (SpotySID visible after HELP; opens new tab, LVLLVL project retained) and regression of TEST366 C64 chooser. User browser PASS pending.
