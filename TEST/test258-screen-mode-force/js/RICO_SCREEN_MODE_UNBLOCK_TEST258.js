/* RICO TEST258 — SCREEN mode must ALWAYS switch on request.
 * TEST01 legacy ECM REPACK rejected used glyph count >64 and aborted
 * setMode() before the editor UI or index could refresh.
 * This experiment uses native LVLLVL LayerGrid._setMode() for direct
 * C64 Multicolor / C64 ECM changes, without lossless repacking.
 * ECM naturally aliases 256 screen codes to its 64 physical glyphs;
 * keep original tiles and project data intact rather than corrupting them.
 * TEST257 owns full dual-bank palette render after interface refresh.
 * Do not modify ONDAS, TileSet, Bank1/2 metadata or PRG export.
 */
(function(){
'use strict';
var TAG='[RICO TEST258 SCREEN]';
function modeName(request){
  return request&&typeof request==='object'&&typeof request.mode==='string'
    ? request.mode : request;
}
function install(){
  if(typeof LayerGrid==='undefined'||!LayerGrid.prototype||
     typeof LayerGrid.prototype.setMode!=='function')return false;
  var proto=LayerGrid.prototype;
  if(proto.__rico258Unblocked)return true;
  var previousSetMode=proto.setMode;
  proto.setMode=function(request,callback){
    var mode=modeName(request);
    var multicolor=mode==='c64multicolor';
    var ecm=mode==='c64ecm';
    if(!multicolor&&!ecm)return previousSetMode.apply(this,arguments);
    if(!this.doc||typeof this._setMode!=='function')return previousSetMode.apply(this,arguments);
    // Keep LVLLVL's vector transition (tileset format conversion).
    if(this.doc.screenMode==='vector'||this.mode==='vector')
      return previousSetMode.apply(this,arguments);
    // Explicit user choice takes precedence over TEST01 lossless repack.
    // This also skips automatic ECM glyph-picker popups (TEST04/05/06).
    // No transformation/deletion of tileData or stored BANK2 occurs.
    if(this.doc.screenMode!==mode||this.mode!==mode){
      this._setMode(mode);
      console.log(TAG,'switched to',mode,'without glyph repacking or blocking');
    }
    if(typeof callback==='function')callback(true);
  };
  proto.__rico258Unblocked=true;
  window.RICO_TEST258_MODE_UNBLOCKED=true;
  console.log(TAG,'installed — C64 MULTICOLOR / ECM direct native mode switching');
  return true;
}
if(!install()){
  if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',install);
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',install);
}
window.RICO_TEST258_SCREEN_MODE={install:install};
})();