/* TEST368 — SpotySID link visible beside Help.
 * TEST367 looked for document.getElementById('menubar'), but LVLLVL UI.create
 * generates a numeric DOM id and registers 'menubar' only as UI's component
 * alias. Resolve the actual menubar component and actual Help menu item.
 * The existing Help dropdown and editor/export behavior are unchanged.
 */
(function () {
  'use strict';
  var URL = 'https://serigrafiamdp-web.github.io/RICOS-MOD-JAMES-SIDPLAYER-ONLINE/';
  var LINK_ID = 'rico-spotysid-menu-link';
  var state = { version: 368, status: 'WAITING FOR HELP MENU', attached: false, barId: null };
  var observer = null;

  function attach() {
    if (typeof UI === 'undefined' || typeof UI.get !== 'function') return false;
    var bar = UI.get('menubar');
    if (!bar || !bar.getElement) return false;
    var element = bar.getElement();
    if (!element) return false;
    state.barId = bar.id;

    var duplicate = document.getElementById(LINK_ID) ||
      element.querySelector('#' + LINK_ID);
    if (duplicate) {
      state.attached = true;
      state.status = 'ATTACHED';
      return true;
    }

    var helpMenu = null;
    for (var i = 0; i < bar.menus.length; i++) {
      if (bar.menus[i].label === 'Help') {
        helpMenu = bar.menus[i];
        break;
      }
    }
    if (!helpMenu) return false;

    // addMenu() sets menuBarItemId to a UI-generated numeric id.  Use this
    // instead of the nonexistent document id "menubar" from TEST367.
    var items = element.querySelectorAll('.ui-menubar-item');
    var help = null;
    for (var j = 0; j < items.length; j++) {
      if (items[j].id === String(helpMenu.menuBarItemId) ||
          items[j].textContent.trim() === 'Help') {
        help = items[j];
        break;
      }
    }
    if (!help || !help.parentNode) return false;

    var link = document.createElement('a');
    link.id = LINK_ID;
    link.className = help.className; // same mode visibility and styling as HELP
    link.setAttribute('data-textid', 'SpotySID');
    link.textContent = 'SpotySID';
    link.href = URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Open SpotySID in a new tab';
    link.style.textDecoration = 'none';
    link.style.cursor = 'pointer';
    link.style.display = help.style.display || 'inline-block';
    help.parentNode.insertBefore(link, help.nextSibling);

    state.attached = true;
    state.status = 'ATTACHED';
    if (observer) observer.disconnect();
    return true;
  }

  if (!attach()) {
    if (typeof UI !== 'undefined' && typeof UI.on === 'function') {
      UI.on('ready', attach);
    }
    observer = new MutationObserver(function () {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (typeof window !== 'undefined') window.RICO_TEST368_SPOTYSID = state;
})();