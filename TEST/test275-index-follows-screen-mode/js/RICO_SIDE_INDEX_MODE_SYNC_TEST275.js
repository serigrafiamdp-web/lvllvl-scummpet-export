/* TEST275 — Side index follows SCREEN HiRes/Standard <-> C64 Multicolor.
 * This is a presentation/ordering fix ONLY. After importing C64 frames,
 * LVLLVL's LayerGrid._setMode()->tileSetManager.updateSortMethods() resets
 * palette ordering to Columns of 16. Re-apply native Custom only AFTER the
 * native interface mode change, then rebuild the side index tile cache.
 *
 * Never modify atlas bytes, charset banks, frame cells or VIC/export code.
 * TEST274 owns "all MC" thumbnails while layer is C64MC, and native LVLLVL
 * draws thumbnails as HiRes in TEXTMODE / C64STANDARD.
 */
(function(){
  'use strict';
  var TAG='[RICO TEST275]';
  if(typeof TextModeEditor==='undefined'||!TextModeEditor.prototype||
      typeof TextModeEditor.prototype.setInterfaceScreenMode!=='function') {
    console.warn(TAG,'TextModeEditor unavailable; no changes made.');
    return;
  }
  var proto=TextModeEditor.prototype;
  if(proto.__rico275IndexModeSync)return;

  var nativeSet=proto.setInterfaceScreenMode;
  function getMode(ed,requested){
    try{
      var layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
      if(layer&&typeof layer.getScreenMode==='function'){
        var value=layer.getScreenMode();
        if(value)return value;
      }
    }catch(e){}
    return requested;
  }
  function compatible(mode){
    return mode==='c64multicolor'||mode==='textmode'||mode==='c64standard';
  }
  function redraw(ed,mode,restoreCustom){
    var pal=ed&&ed.sideTilePalette,disp=pal&&pal.tilePaletteDisplay;
    if(!disp||disp.canvasElementId!=='sidecharPaletteCanvas')return false;

    // Only a session that used C64 Import should be put automatically in
    // Custom; otherwise respect the user's chosen sorting method.
    if(restoreCustom && typeof pal.selectTilePaletteMapType==='function') {
      pal.selectTilePaletteMapType('custom'); // both index palettes & selectors
    }
    if(typeof disp.draw==='function'){
      // draw({redrawTiles:true}) rebuilds tilePaletteImageData, unlike draw().
      // TEST274 checks actual layer mode and only forces MC if appropriate.
      disp.draw({redrawTiles:true,screenMode:mode});
      return true;
    }
    return false;
  }

  proto.setInterfaceScreenMode=function(requested){
    var result=nativeSet.apply(this,arguments);
    var mode=getMode(this,requested);
    if(!compatible(mode))return result;
    var last=this.__rico275LastIndexMode;
    this.__rico275LastIndexMode=mode;
    // Test257 already rebuilds after screen changes, but loses Custom
    // when updateSortMethods() rebuilds and selects the default columns.
    // Use native post-transition layout selection once per ACTUAL mode
    // change; this also handles direct LayerGrid.setMode/_setMode.
    if(last!==mode || (this.__rico272CapturedC64 && 
         this.sideTilePalette && this.sideTilePalette.tilePaletteDisplay &&
         this.sideTilePalette.tilePaletteDisplay.charPaletteMapType!=='custom')){
      try{
        redraw(this,mode,!!this.__rico272CapturedC64);
        console.log(TAG,'side index refreshed',mode,
                    this.__rico272CapturedC64?'Custom':'current layout');
      }catch(e){console.warn(TAG,'index update failed',e);}
    }
    return result;
  };

  proto.__rico275IndexModeSync=true;
  window.RICO_TEST275_INDEX_MODE_SYNC={
    version:'TEST275',
    refresh:function(ed){
      ed=ed||(window.g_app&&window.g_app.textModeEditor);
      return redraw(ed,getMode(ed,'textmode'),!!(ed&&ed.__rico272CapturedC64));
    }
  };
  console.log(TAG,'installed: mode change redraw + preserve Custom after C64 Import');
})();