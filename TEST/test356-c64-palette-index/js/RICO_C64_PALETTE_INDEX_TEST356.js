/* TEST356 (isolated): C64 palette variants are RGB display choices, not index conversions.
 * Original LVLLVL ColorPalette.setColors() matches old to new by closest RGB and
 * calls replaceColor() on every layer, changing the C64 indices in the artwork.
 * This script only intercepts selecting the three built-in 16-color C64 presets.
 * All non-C64 presets use LVLLVL's original paths, unchanged.
 */
(function(){
  'use strict';
  if (typeof ColorPaletteManager === 'undefined' ||
      typeof ColorPaletteChoosePreset === 'undefined') {
    console.warn('[TEST356] Palette classes not available, patch not installed.');
    return;
  }
  var PRESETS = {c64_colodore:true,c64_pepto:true,c64_vice:true};
  var state = {version:356,last:'READY',lastPreset:null,lastError:null,
               skippedRemaps:0,colorCount:0,source:null};
  var previousManager = ColorPaletteManager.prototype.choosePreset;
  var previousChooser = ColorPaletteChoosePreset.prototype.choosePreset;

  function isC64(preset) {
    return Object.prototype.hasOwnProperty.call(PRESETS, preset);
  }
  function onError(preset, error) {
    state.last='ERROR';
    state.lastPreset=preset;
    state.lastError=String(error && error.message || error);
    console.error('[TEST356] Palette load:', error);
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert('TEST356: ' + state.lastError);
    }
  }
  function preserveIndices(palette, data, columns, rows, preset, source) {
    if (!palette || typeof palette.setColors !== 'function')
      throw Error('No current color palette to update');
    if (!data || !Array.isArray(data.colors) || data.colors.length !== 16 ||
        columns * rows !== 16)
      throw Error('C64 ' + preset + ': expected exactly 16 palette entries; got ' +
                  (data && data.colors && data.colors.length));

    // Keep the original swatch/meta/cache/redraw work in setColors().
    // Suppress ONLY nearest-RGB cell-index conversion for this C64 preset load.
    var layers = palette.editor && palette.editor.layers;
    var restore = [];
    var skipped = 0;
    try {
      if (layers && typeof layers.getLayerCount === 'function') {
        for (var i=0, total=layers.getLayerCount();i<total;i++) {
          var layer=layers.getLayerObjectFromIndex(i);
          if (!layer || typeof layer.replaceColor !== 'function') continue;
          (function(target, prior){
            var owned=Object.prototype.hasOwnProperty.call(target,'replaceColor');
            restore.push(function(){
              if (owned) target.replaceColor=prior;
              else delete target.replaceColor;
            });
            target.replaceColor=function(){ skipped++; };
          })(layer,layer.replaceColor);
        }
      }
      palette.setColors(data.colors,columns,rows);
    } finally {
      for (var j=restore.length-1;j>=0;j--) restore[j]();
    }
    if (typeof palette.setIsC64Palette === 'function')
      palette.setIsC64Palette(true);
    state.last='INDEX PRESERVED';
    state.lastPreset=preset;
    state.lastError=null;
    state.source=source;
    state.colorCount=data.colors.length;
    state.skippedRemaps=skipped;
  }
  function loadImage(preset, done) {
    var img=new Image();
    img.onload=function(){
      try { done(img); }
      catch (e) {onError(preset,e);}
    };
    img.onerror=function(){onError(preset,Error('Unable to load palettes/'+preset+'.png'));};
    img.src='palettes/'+preset+'.png';
  }

  // Internal preset path (new project, setToPreset, internal palette tools).
  ColorPaletteManager.prototype.choosePreset=function(preset,options){
    if (!isC64(preset)) return previousManager.apply(this,arguments);
    var manager=this;
    loadImage(preset,function(img){
      var payload=manager.colorPaletteFromPaletteImg(img,options);
      var across=Math.floor(img.naturalWidth/8),down=Math.floor(img.naturalHeight/8);
      var palette=options && options.colorPalette || manager.getCurrentColorPalette();
      preserveIndices(palette,payload,across,down,preset,'manager');
      palette.setSortOrderMethod('default');
      if (options && typeof options.callback === 'function') options.callback();
    });
  };

  // UI menu path. The original UI selector bypasses the manager's choosePreset().
  ColorPaletteChoosePreset.prototype.choosePreset=function(preset,callback){
    if (!isC64(preset) || !this.setColorPalette)
      return previousChooser.apply(this,arguments);
    this.previewColorPaletteId=preset;
    this.previewColorPaletteDescription=this.getColorPaletteDescription(preset);
    var chooser=this, manager=this.editor.colorPaletteManager;
    loadImage(preset,function(img){
      var payload=manager.colorPaletteFromPaletteImg(img,{
        brightness:chooser.brightness,
        saturation:chooser.saturation,
        contrast:chooser.contrast
      });
      var across=Math.floor(img.naturalWidth/8),down=Math.floor(img.naturalHeight/8);
      var palette=manager.getCurrentColorPalette();
      preserveIndices(palette,payload,across,down,preset,'UI');
      var map=[],index=0;
      for (var y=0;y<down;y++) {
        var row=[];
        for (var x=0;x<across;x++) {
          if (index < payload.colors.length) row.push(index++);
        }
        map.push(row);
      }
      palette.setColorPaletteMap('Default Layout',map);
      manager.colorPaletteUpdated();
      palette.setSortOrderMethod('default');
      if (typeof callback === 'function') callback();
      if (typeof g_app !== 'undefined' && g_app &&
          typeof g_app.getMode === 'function' && g_app.getMode()==='color palette' &&
          g_app.colorPaletteEditor) g_app.colorPaletteEditor.draw();
    });
  };
  if (typeof window !== 'undefined') window.RICO_TEST356_PALETTE={state:state};
  console.log('[TEST356] C64 palette variants preserve indices 0-15. Original .c reader/export paths untouched.');
})();