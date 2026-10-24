/* TEST276 — non-destructive MultiColor -> HiRes solid-pair conversion.
 * New charset copy / selected layer only, original charset always retained.
 * Convert pairs 00->00, 01/10/11->11 for glyphs used as Multicolor.
 * No edits to original glyph bytes, map indices, per-cell FC, frames, SID,
 * C64 Import, PRG export or MASTER.
 */
(function(){
'use strict';
var TAG='[RICO TEST276]';
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
  if(!src||src.getTileWidth()!==8||src.getTileHeight()!==8||src.getTileCount()>256)return null;
  var data=src.tileData;
  if(!data||data.length<256)return null;
  var raw=new Uint8Array(2048);
  for(var c=0;c<256;c++){
    var tile=data[c];
    if(!tile||!tile.data||!tile.data.length||tile.data[0].length!==64)return null;
    if(tile.props&&tile.props.animated && tile.props.animated!==false)return null;
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
function usedMulticolorCodes(layer){
  // Do not damage glyphs already rendered as HiRes in mixed C64 projects.
  // Scan ALL frames sharing this tileset (not only the current frame).
  var flags=new Uint8Array(256),frames=layer&&layer.frames||[];
  for(var f=0;f<frames.length;f++){
    var rows=frames[f]&&frames[f].data||[];
    for(var y=0;y<rows.length;y++){
      var row=rows[y]||[];
      for(var x=0;x<row.length;x++){
        var cell=row[x];if(!cell)continue;
        if(Number.isInteger(cell.t)&&cell.t>=0&&cell.t<256 &&
           Number.isInteger(cell.fc)&&cell.fc>=8&&cell.fc<16)flags[cell.t]=1;
      }
    }
  }
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
function convertRaw(raw,flags){
  var dest=raw.slice(),touched=0,pixels=0;
  for(var c=0;c<256;c++){
    if(!flags[c])continue;
    touched++;
    for(var y=0;y<8;y++){
      var k=c*8+y, old=raw[k],next=expandPairRow(old);
      // Count newly-filled pixels for diagnostics; never alter originals.
      var bits=next & (~old)&255;
      while(bits){pixels++;bits&=bits-1;}
      dest[k]=next;
    }
  }
  return {bytes:dest,convertedCharacters:touched,filledPixels:pixels};
}
function setStatus(message,isError){
  var e=document.getElementById('rico276Status');
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
  var flags=usedMulticolorCodes(layer),count=flags.reduce(function(a,b){return a+b},0);
  if(!count){
    setStatus('No se encontraron caracteres usados como Multicolor (FC 8–15).',true);
    return false;
  }
  var conversion=convertRaw(raw,flags),manager=ed.tileSetManager;
  var newId,newSet;
  try{
    newId=manager.createTileSet({name:(src.label||'C64 Charset')+' - HiRes Filled',width:8,height:8});
    newSet=manager.getTileSet(newId);
    if(!newSet||typeof newSet.readBinaryData!=='function')throw Error('No se pudo crear el tileset');
    // Clone static Bank1 as an independent persistent charset document.
    newSet.readBinaryData({tileData:Array.from(conversion.bytes),characterWidth:8,characterHeight:8,tileCount:256});
    // Preserve per-glyph metadata except animation (we refused animation).
    for(var i=0;i<256;i++){
      if(src.tileData[i]&&src.tileData[i].props&&newSet.tileData[i])
        newSet.tileData[i].props=JSON.parse(JSON.stringify(src.tileData[i].props));
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
    afterSwitch(ed);
    window.RICO_TEST276_LAST={count:conversion.convertedCharacters,
      filled:conversion.filledPixels,sourceId:srcId,convertedId:newId};
    setStatus('HiRes reparado: '+conversion.convertedCharacters+
       ' glifos, '+conversion.filledPixels+' píxeles completados. Original intacto.',false);
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
  if(document.getElementById('rico276Actions'))return true;
  var anchor=document.getElementById('sidecharPaletteSortOrder');
  if(!anchor||!anchor.parentNode)return false;
  var wrap=document.createElement('span');wrap.id='rico276Actions';
  wrap.style.cssText='display:inline-flex;align-items:center;gap:5px;margin-left:6px;vertical-align:middle;flex-wrap:wrap;';
  function btn(title,fn){var b=document.createElement('button');b.textContent=title;b.type='button';b.style.cssText='font:11px sans-serif;color:#e8e8e8;background:#38516a;border:1px solid #71869a;padding:3px 6px;border-radius:3px;cursor:pointer;';b.addEventListener('click',fn);return b;}
  wrap.appendChild(btn('MC → HiRes Fill',fill));
  wrap.appendChild(btn('Restaurar MC',restore));
  var info=document.createElement('span');info.id='rico276Status';
  info.style.cssText='font:10px sans-serif;max-width:260px;';
  wrap.appendChild(info);
  anchor.parentNode.insertBefore(wrap,anchor.nextSibling);
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
window.RICO_TEST276_CONVERT={
  convert:fill,restore:restore,expandPairRow:expandPairRow,
  convertRaw:convertRaw,usedMulticolorCodes:usedMulticolorCodes
};
console.log(TAG,'independent HiRes-filled charset / original preserved.');
})();