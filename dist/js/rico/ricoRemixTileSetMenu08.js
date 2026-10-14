(function() {
  'use strict';

  if(typeof Editor === 'undefined' || typeof UI === 'undefined') {
    console.error('[RICO TEST08] Editor/UI not found.');
    return;
  }

  var originalBuildInterface = Editor.prototype.buildInterface;
  var originalMenuClick = Editor.prototype.menuClick;

  function installRemixMenu(editor) {
    if(!editor || !editor.tileSetMenu) return false;

    var menu = editor.tileSetMenu;

    // Already installed.
    if(menu.getItem && menu.getItem('rico-tileset-remix')) {
      return true;
    }

    var target = menu.getItem ? menu.getItem('charactersets-preset') : null;
    if(!target) return false;

    var item = menu.addItem({
      label: "Rico's Remix a Tileset...",
      id: 'rico-tileset-remix'
    });

    // addItem appends by default. Reorder the internal list so our item is
    // immediately after the original Choose A Tile Set entry.
    var items = menu.getItems ? menu.getItems() : menu.menuItems;
    if(items) {
      var newIndex = items.indexOf(item);
      var targetIndex = items.indexOf(target);

      if(newIndex >= 0 && targetIndex >= 0 && newIndex !== targetIndex + 1) {
        items.splice(newIndex, 1);
        targetIndex = items.indexOf(target);
        items.splice(targetIndex + 1, 0, item);
      }
    }

    // UI is already live at this point, so also move the real DOM element.
    var targetEl = document.getElementById(target.id);
    var itemEl = document.getElementById(item.id);

    if(targetEl && itemEl && targetEl.parentNode === itemEl.parentNode) {
      targetEl.parentNode.insertBefore(itemEl, targetEl.nextSibling);
    }

    console.log('[RICO TEST08] Remix Tile Set menu installed.');
    return true;
  }

  Editor.prototype.buildInterface = function() {
    var editor = this;
    var result = originalBuildInterface.apply(this, arguments);

    // Original LVLLVL builds menus inside its UI ready callback.
    // Register after it so the Tiles menu already exists.
    UI.on('ready', function() {
      if(installRemixMenu(editor)) return;

      // Small fallback if another ready callback completes a moment later.
      var tries = 0;
      var timer = setInterval(function() {
        tries++;
        if(installRemixMenu(editor) || tries >= 20) {
          clearInterval(timer);
        }
      }, 50);
    });

    return result;
  };

  Editor.prototype.menuClick = function(menuItem) {
    if(menuItem === 'rico-tileset-remix') {
      // TEST08: intentionally duplicate the original chooser behaviour.
      // Future RICO Remix work branches only from this ID.
      this.textModeEditor.tileSetManager.showChoosePreset({});
      return;
    }

    return originalMenuClick.call(this, menuItem);
  };

  window.RICO_TEST08_REMIX_TILESET_MENU = true;
  console.log('[RICO TEST08] Remix Tile Set menu hook loaded.');
})();