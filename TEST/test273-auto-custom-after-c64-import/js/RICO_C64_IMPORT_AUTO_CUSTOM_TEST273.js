/* TEST273 — Auto-select Custom index immediately after successful C64 Import.
 * TEST272 / TEST271 stay untouched. No charset, map, frame or emulator writes.
 * Use the native TilePalette.selectTilePaletteMapType('custom') so both
 * palette controls, displayed layouts and dropdowns are synchronized.
 */
(function(){
  'use strict';
  if(typeof ImportC64Formats==='undefined')return;
  if(ImportC64Formats.prototype.__rico273AutoCustom)return;
  var previous=ImportC64Formats.prototype.importPrg;
  ImportC64Formats.prototype.importPrg=function(){
    var ok=previous.apply(this,arguments);
    if(ok!==true)return ok;
    var editor=this.editor;
    var palette=editor&&editor.sideTilePalette;
    if(!palette||typeof palette.selectTilePaletteMapType!=='function'){
      console.warn('[TEST273] Side tile palette unavailable after C64 import.');
      return ok;
    }
    // This native path selects Custom for BOTH palettes and refreshes
    // their tile maps. Do NOT call tileSetUpdated() a second time:
    // that function forces the sort method back to Columns of 16.
    try{
      palette.selectTilePaletteMapType('custom');
      var display=palette.tilePaletteDisplay;
      if(display&&typeof display.draw==='function'){
        display.draw({redrawTiles:true});
      }
      console.log('[TEST273] C64 Import PASS: side index switched to Custom.');
    }catch(err){
      console.warn('[TEST273] Could not switch C64 index to Custom:',err);
    }
    return ok;
  };
  ImportC64Formats.prototype.__rico273AutoCustom=true;
  window.RICO_TEST273_AUTO_CUSTOM=true;
})();