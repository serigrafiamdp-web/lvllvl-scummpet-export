(function(){
'use strict';
// TEST177: Geometry-only analysis. Never moves/crops artwork or changes PRG routines.
function size(g){return{width:Math.max(1,g.getGridWidth()|0),height:Math.max(1,g.getGridHeight()|0)};}
function error(msg){return{ok:false,error:msg};}
function pixelsExist(tile){
  if(!tile||!tile.data||!tile.data.length)return false;
  var a=tile.data[0];if(!a||!a.length)return false;
  for(var i=0;i<a.length;i++)if(a[i])return true;
  return false;
}
function getTileSet(e,l){
  try{if(l.getTileSet){var tiles=l.getTileSet();if(tiles)return tiles;}}catch(_){}
  try{return e.tileSetManager.getCurrentTileSet();}catch(_){return null;}
}
function switchEnabled(store){
  var gr=store&&store.ricoGroupAnimationsV1||{};
  for(var k of ['bank1','bank2']){
    var groups=gr[k]||[];
    for(var i=0;i<groups.length;i++)if(groups[i]&&groups[i].type==='switch-bank')return true;
  }
  return false;
}
function scan(editor,frame,mode){
  try{
    var e=editor&&editor.textModeEditor||editor;
    var g=e&&e.graphic;
    if(!g)return error('No hay un Screen activo.');
    var layer=e.layers&&e.layers.getSelectedLayerObject&&e.layers.getSelectedLayerObject();
    if(!layer||!layer.getCell||layer.getType&&layer.getType()!=='grid')return error('Selecciona una capa Grid antes de usar Auto Fit.');
    var sz=size(g),ts=getTileSet(e,layer);
    if(!ts||!ts.tileData)return error('No se encontró el tileset de la capa.');
    var doc=ts.getDocRecord&&ts.getDocRecord(),store=doc&&doc.data||{};
    var tile1=ts.tileData,tile2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
    var isSwitch=switchEnabled(store),activeBank=1;
    try{activeBank=parseInt(g.frames[frame].charsetBank,10)===2?2:1;}catch(_){}
    var bankData=[];
    if(isSwitch){bankData.push(tile1);if(tile2&&tile2.length)bankData.push(tile2);}
    else if(activeBank===2&&tile2&&tile2.length)bankData.push(tile2);
    else bankData.push(tile1);
    var occupancy={},minX=sz.width,minY=sz.height,maxX=-1,maxY=-1,count=0;
    var noTile=e.tileSetManager&&e.tileSetManager.noTile;
    for(var y=0;y<sz.height;y++)for(var x=0;x<sz.width;x++){
      var cell=layer.getCell({x:x,y:y,frame:frame});
      if(!cell||cell===false)continue;
      var t=parseInt(cell.t,10);
      if(!isFinite(t)||t<0||(typeof noTile!=='undefined'&&t===noTile))continue;
      if(typeof occupancy[t]==='undefined'){
        occupancy[t]=false;
        for(var b=0;b<bankData.length;b++){
          var data=bankData[b];
          if(data&&pixelsExist(data[t])){occupancy[t]=true;break;}
        }
      }
      if(!occupancy[t])continue;
      count++;
      if(x<minX)minX=x;if(y<minY)minY=y;
      if(x>maxX)maxX=x;if(y>maxY)maxY=y;
    }
    if(!count)return error('No se detectó arte visible en este frame. La geometría no cambió.');
    var rect={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
    // Window is a C64 viewport, not the Scroll Area containing the whole picture.
    if(mode==='window'&&(rect.width>40||rect.height>25)){
      return error('El arte ocupa '+rect.width+'×'+rect.height+'. La Window C64 admite hasta 40×25; utiliza Auto Fit en Scroll Area para abarcarlo sin recortar.');
    }
    var warn='';
    var mapCfg=g.frames&&g.frames[frame]&&g.frames[frame].ricoMapScrollV1||{};
    if(sz.width===40&&sz.height>25&&(mapCfg.type==='up'||mapCfg.type==='down')){
      if(mode==='window'&&(rect.x!==0||rect.width!==40||(rect.height!==24&&rect.height!==25)))
        warn='Aviso: el exportador vertical actual necesita Window X0, ancho 40 y alto 24/25. El ajuste sigue siendo editable.';
      if(mode==='scroll'&&(rect.x!==0||rect.width!==40||rect.height<25))
        warn='Aviso: el exportador vertical actual necesita Scroll Area X0 y ancho 40, con 25 o más filas. El ajuste sigue siendo editable.';
    }
    return{ok:true,rect:rect,count:count,bank:isSwitch?'both':activeBank,warning:warn};
  }catch(ex){return error('No se pudo leer el arte: '+(ex&&ex.message||ex));}
}
window.RICO_TEST177_ART_FIT={scan:scan,version:177,nonDestructive:true};
console.log('[RICO TEST177] Auto Fit Art bound detector loaded (no editor mutation)');
})();
