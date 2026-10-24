/* TEST272 — rebuild the dual-bank side-index bitmap after C64 import.
 * TEST271 writes the glyph data but never invalidates the side palette's
 * cached tilePaletteImageData. TEST257 did this for mode changes only.
 * Keep TEST17/19 bank mapping and all charset/graphics untouched.
 */
(function(){
'use strict';
if(typeof ImportC64Formats==='undefined'||typeof Frames==='undefined')return;
var previousImport=ImportC64Formats.prototype.importPrg;
var previousGoto=Frames.prototype.gotoFrame;
function getEditor(instance){
  return (instance&&instance.editor) ||
    (window.g_app&&window.g_app.textModeEditor) || null;
}
function redrawIndex(editor){
  try{
    var pal=editor&&editor.sideTilePalette&&editor.sideTilePalette.tilePaletteDisplay;
    if(!pal||pal.canvasElementId!=='sidecharPaletteCanvas')return false;
    if(typeof pal.draw!=='function')return false;
    // Rebuild pixel atlas; ordinary draw() reuses the old cached image.
    pal.draw({redrawTiles:true,screenMode:'c64multicolor'});
    return true;
  }catch(e){console.warn('[TEST272] Index refresh:',e);return false;}
}
ImportC64Formats.prototype.importPrg=function(){
  var result=previousImport.apply(this,arguments);
  if(result===true){
    var editor=getEditor(this);
    if(editor)editor.__rico272CapturedC64=true;
    redrawIndex(editor);
    window.RICO_TEST272_LAST_REFRESH={
      frame:editor&&editor.graphic&&editor.graphic.getCurrentFrame(),
      indexRedraw:true
    };
  }
  return result;
};
Frames.prototype.gotoFrame=function(){
  var result=previousGoto.apply(this,arguments);
  if(this.editor&&this.editor.__rico272CapturedC64)redrawIndex(this.editor);
  return result;
};
window.RICO_TEST272_INDEX_REFRESH={version:'TEST272',refresh:redrawIndex};
console.log('[TEST272] C64 import and captured-frame navigation rebuild side-index pixel cache.');
})();