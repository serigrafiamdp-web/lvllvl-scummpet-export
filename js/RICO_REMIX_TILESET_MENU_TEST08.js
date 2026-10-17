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

    if(menu.getItem && menu.getItem('rico-tileset-remix')) {
      return true;
    }

    var target = menu.getItem ? menu.getItem('charactersets-preset') : null;
    if(!target) return false;

    var item = menu.addItem({
      label: "Rico's Remix a Tileset...",
      id: 'rico-tileset-remix'
    });

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

    UI.on('ready', function() {
      if(installRemixMenu(editor)) return;

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
      this.textModeEditor.tileSetManager.showChoosePreset({});
      return;
    }

    return originalMenuClick.call(this, menuItem);
  };

  window.RICO_TEST08_REMIX_TILESET_MENU = true;
  console.log('[RICO TEST08] Remix Tile Set menu hook loaded.');
})();