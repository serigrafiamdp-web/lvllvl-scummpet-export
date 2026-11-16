/* TEST367 — SpotySID direct link beside HELP in the LVLLVL top menu.
 * UI-only extension; does not alter Editor, PRG exports, or SpotySID.
 */
(function () {
  'use strict';
  var DESTINATION = 'https://serigrafiamdp-web.github.io/RICOS-MOD-JAMES-SIDPLAYER-ONLINE/';
  var LINK_ID = 'rico-spotysid-menu-link';
  var state = { version: 367, url: DESTINATION, attached: false };

  function attach() {
    var existing = document.getElementById(LINK_ID);
    if (existing) {
      state.attached = true;
      return true;
    }
    var bar = document.getElementById('menubar');
    if (!bar) return false;
    var items = bar.querySelectorAll('.ui-menubar-item');
    var help = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-textid') === 'Help' ||
          items[i].textContent.trim() === 'Help') {
        help = items[i];
        break;
      }
    }
    if (!help) return false;

    // A real anchor opens a new tab from the user's direct click; unlike
    // an empty dropdown menu, it never intercepts LVLLVL's Help callbacks.
    var link = document.createElement('a');
    link.id = LINK_ID;
    link.className = help.className;
    link.setAttribute('data-textid', 'SpotySID');
    link.textContent = 'SpotySID';
    link.href = DESTINATION;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Open SpotySID in a new tab';
    link.style.textDecoration = 'none';
    link.style.cursor = 'pointer';
    help.insertAdjacentElement('afterend', link);
    state.attached = true;
    return true;
  }

  if (!attach()) {
    // LVLLVL constructs its top menu during UI.ready. Observe only until
    // HELP is present; then disconnect (no polling or permanent observer).
    var observer = new MutationObserver(function () {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (typeof window !== 'undefined') window.RICO_TEST367_SPOTYSID = state;
})();