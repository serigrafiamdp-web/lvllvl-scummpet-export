/* TEST277 — MC -> HiRes vertical-line repair, all glyphs, not color dependent.
 * Original TEST276 only converted FC>=8 glyphs and rejected whole tilesets
 * when one animation existed, explaining no visible change on some maps.
 * TEST277 builds a frozen independent 256-glyph HiRes atlas, repairs EVERY
 * 2-bit pixel pair (01/10/11 -> 11) and optionally fills narrow MC-pixel
 * interior 00 gaps between occupied pairs. Original charset untouched.
 * UI control appears at TOP of Tiles panel, not hidden by its scrollbar.
 */
(function(){
'use strict';
var TAG='[RICO TEST277]';
var layerState=(typeof WeakMap!=='undefined')?new WeakMap():null;
if(!layerState||typeof TextModeEditor==='undefined'||!TextModeEditor.prototype){
  console.warn(TAG,'Required runtime unavailable; patch disabled');
  return;
}
function editor(){try{return window.g_app&&window.g_app.textModeEditor}catch(e){return null}}
function getLayer(ed){
  return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
}
function sourceGlyphBytes(src){
  if(!src||src.getTileWidth()!==8||src.getTileHeight()!==8)return null;
  var data=src.tileData;
  if(!data||data.length<256)return null;
  var raw=new Uint8Array(2048);
  for(var c=0;c<256;c++){
    var tile=data[c];
    if(!tile||!tile.data||!tile.data.length||tile.data[0].length!==64)return null;
    // Snapshot frame0 of animated glyphs; original animation stays intact.
    for(var y=0;y<8;y++){
      var b=0;
      for(var x=0;x<8;x++){
        if(tile.data[0][y*8+x])b|=128>>x;
      }
      raw[c*8+y]=b;
    }
  }
  return raw;
}
function allGlyphCodes(){
  var flags=new Uint8Array(256);
  flags.fill(1);
  return flags;
}
function expandPairRow(byte){
  var out=0;
  for(var i=0;i<4;i++){
    var shift=6-i*2;
    var pair=(byte>>shift)&3;
    if(pair!==0)out|=(3<<shift);
  }
  return out;
}
function convertRaw(raw,flags,closeGaps){
  var dest=raw.slice(),touched=0,pixels=0,filledColumns=0;
  for(var c=0;c<256;c++){
    if(!flags[c])continue;
    touched++;
    for(var y=0;y<8;y++){
      var k=c*8+y, old=raw[k],next=expandPairRow(old);
      // Optional: fill a wholly empty MC-pixel column between two solid
      // nonzero MC-pixel columns. Only internal gaps are eligible.
      if(closeGaps){
        for(var p=1;p<=2;p++){
          var sh=(3-p)*2;
          if(((next>>sh)&3)===0 && ((next>>(sh+2))&3)===3 &&
             ((next>>(sh-2))&3)===3){ next|=(3<<sh);filledColumns++; }
        }
      }
      // Count genuinely new pixels. The source remains byte-identical.
      var bits=next & (~old)&255;
      while(bits){pixels++;bits&=bits-1;}
      dest[k]=next;
    }
  }
  return {bytes:dest,convertedCharacters:touched,filledPixels:pixels,closedInteriorColumns:filledColumns};
}
function setStatus(message,isError){
  var e=document.getElementById('rico277Status');
  if(e){e.textContent=message;e.style.color=isError?'#ffaba2':'#acd8b6';}
  console[isError?'warn':'log'](TAG,message);
}
function afterSwitch(ed){
  try{
    if(ed&&ed.sideTilePalette&&typeof ed.sideTilePalette.selectTilePaletteMapType==='function')
      ed.sideTilePalette.selectTilePaletteMapType('custom');
    var d=ed&&ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay;
    if(d&&typeof d.draw==='function')d.draw({redrawTiles:true});
    if(ed&&ed.graphic){ed.graphic.invalidateAllCells();ed.graphic.redraw({allCells:true});}
  }catch(e){console.warn(TAG,'index refresh',e);}
}
function fill(){
  var ed=editor(),layer=getLayer(ed);
  if(!ed||!layer||layer.getType()!=='grid'||!ed.tileSetManager){
    setStatus('Seleccioná una capa de caracteres.',true);return false;
  }
  var state=layerState.get(layer);
  if(state){setStatus('Ya está aplicada la conversión. Usá Restaurar MC.',true);return false;}
  var src=layer.getTileSet(),srcId=layer.getTileSetId();
  var raw=sourceGlyphBytes(src);
  if(!raw){setStatus('Se requiere un tileset estático de 256 caracteres de 8×8.',true);return false;}
  // All 256 glyphs are transformed. Foreground colors are irrelevant:
  // Standard/HiRes can display cells whose original MC FC was below 8.
  var flags=allGlyphCodes();
  var conversion=convertRaw(raw,flags,true),manager=ed.tileSetManager;
  if(conversion.filledPixels===0){
    setStatus('No hay columnas verticales para rellenar en este charset.',true);
    return false;
  }
  var newId,newSet;
  try{
    newId=manager.createTileSet({name:(src.label||'C64 Charset')+' - HiRes Filled',width:8,height:8});
    newSet=manager.getTileSet(newId);
    if(!newSet||typeof newSet.readBinaryData!=='function')throw Error('No se pudo crear el tileset');
    // Snapshot all Bank1 glyphs as a separate persistent HiRes tileset.
    newSet.readBinaryData({tileData:Array.from(conversion.bytes),characterWidth:8,characterHeight:8,tileCount:256});
    // Preserve original per-glyph colors only. The new converted glyphs are
    // deliberately static snapshots, never stale animated source frames.
    for(var i=0;i<256;i++){
      if(src.tileData[i]&&src.tileData[i].props&&newSet.tileData[i]){
        newSet.tileData[i].props.fc=src.tileData[i].props.fc;
        newSet.tileData[i].props.bc=src.tileData[i].props.bc;
        newSet.tileData[i].props.animated=false;
      }
    }
    // Bank2, when present, is separately stored in the source tile-set
    // record. Copy (not alias) and convert its static glyphs too. Existing
    // original bank2 remains byte-for-byte unchanged in source record.
    var record=src.getDocRecord&&src.getDocRecord();
    var stored=record&&record.data&&record.data.ricoCharsetBank2;
    if(stored&&stored.version===1&&stored.tileData&&stored.tileData.length>=256){
      var clone=JSON.parse(JSON.stringify(stored));
      for(var t=0;t<256;t++){
        if(!flags[t])continue;
        var px=clone.tileData[t]&&clone.tileData[t].data&&clone.tileData[t].data[0];
        if(!px||px.length!==64)continue;
        for(var row=0;row<8;row++){
          var orig=0;for(var xx=0;xx<8;xx++)if(px[row*8+xx])orig|=128>>xx;
          var next=expandPairRow(orig);
          for(var p=1;p<=2;p++){
            var sh=(3-p)*2;
            if(((next>>sh)&3)===0&&((next>>(sh+2))&3)===3&&((next>>(sh-2))&3)===3)next|=3<<sh;
          }
          for(var xx=0;xx<8;xx++)px[row*8+xx]=(next>>(7-xx))&1;
        }
      }
      var d=newSet.getDocRecord&&newSet.getDocRecord();
      if(d&&d.data)d.data.ricoCharsetBank2=clone;
    }
    layerState.set(layer,{sourceId:srcId,convertedId:newId,sourceMode:layer.getScreenMode()});
    layer.setTileSet(newId);
    // Use the editor setter: updates the actual screen mode AND the UI.
    ed.setScreenMode('textmode');
    // RICO TEST19 renders from currentTileData, not merely tileData.
    // Rebind the active charset bank after assigning a new set.
    if(typeof window.RICO_applyActiveCharsetBank==='function')
      window.RICO_applyActiveCharsetBank(true);
    afterSwitch(ed);
    window.RICO_TEST277_LAST={count:conversion.convertedCharacters,
      filled:conversion.filledPixels,closedColumns:conversion.closedInteriorColumns,
      sourceId:srcId,convertedId:newId};
    setStatus('Reparación aplicada: '+conversion.convertedCharacters+
       ' glifos, '+conversion.filledPixels+' píxeles rellenados y '+
       conversion.closedInteriorColumns+' huecos internos cerrados. Original intacto.',false);
    return true;
  }catch(err){
    layerState.delete(layer);
    try{if(layer.getTileSetId()!==srcId)layer.setTileSet(srcId);}catch(e){}
    setStatus('Error en conversión: '+(err.message||err),true);
    return false;
  }
}
function restore(){
  var ed=editor(),layer=getLayer(ed),state=layer&&layerState.get(layer);
  if(!ed||!layer||!state){setStatus('No hay conversión activa para restaurar.',true);return false;}
  try{
    layer.setTileSet(state.sourceId);
    if(typeof window.RICO_applyActiveCharsetBank==='function')
      window.RICO_applyActiveCharsetBank(true);
    // Restore MC intentionally even if the user invoked Fill after manually
    // switching the same original tileset to Standard/HiRes first.
    ed.setScreenMode('c64multicolor');
    layerState.delete(layer);
    afterSwitch(ed);
    setStatus('Restaurado el charset Multicolor original.',false);
    return true;
  }catch(e){
    setStatus('No se pudo restaurar: '+(e.message||e),true);
    return false;
  }
}
function mount(){
  if(document.getElementById('rico277Actions'))return true;
  var root=document.getElementById('sidecharPalette');
  var holder=document.getElementById('sidetilePaletteHolder');
  if(!root||!holder)return false;
  // Unlike TEST276, these actions live ABOVE the scrollable index, not in
  // the offscreen sorting footer. Reserve 29px above the tile grid.
  var wrap=document.createElement('div');wrap.id='rico277Actions';
  wrap.style.cssText='position:absolute;top:43px;left:3px;right:3px;height:28px;'+
    'display:flex;align-items:center;gap:6px;background:#202329;'+
    'z-index:80;padding:0 5px;box-sizing:border-box;border-bottom:1px solid #444;';
  function btn(label,fn){
    var b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='font:11px sans-serif;color:#eaf2fc;background:#31597b;'+
      'border:1px solid #6588a6;padding:3px 7px;border-radius:3px;cursor:pointer;flex-shrink:0;';
    b.addEventListener('click',fn);return b;
  }
  wrap.appendChild(btn('Rellenar líneas → HiRes',fill));
  wrap.appendChild(btn('Restaurar MC',restore));
  var info=document.createElement('span');info.id='rico277Status';
  info.style.cssText='font:10px sans-serif;color:#b5d5c2;white-space:nowrap;'+
    'text-overflow:ellipsis;overflow:hidden;';
  wrap.appendChild(info);
  root.appendChild(wrap);
  holder.style.setProperty('top','73px','important');
  return true;
}
if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',mount);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
// A C64 import may initialize the side toolbar after its initial UI ready.
if(typeof ImportC64Formats!=='undefined'&&ImportC64Formats.prototype){
  var original=ImportC64Formats.prototype.importPrg;
  ImportC64Formats.prototype.importPrg=function(){
    var result=original.apply(this,arguments);
    if(result===true)mount();
    return result;
  };
}
window.RICO_TEST277_CONVERT={
  convert:fill,restore:restore,expandPairRow:expandPairRow,
  convertRaw:convertRaw,allGlyphCodes:allGlyphCodes
};
console.log(TAG,'all 256 glyphs: MC pair-fill + vertical interior gap closure; original preserved.');
})();