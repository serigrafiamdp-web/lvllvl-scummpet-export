(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'){console.error('[RICO TEST102 RUNTIME CHAR ANIM] ToPRGAdv missing');return;}

var MAP_DATA_BASE=0x4000;
var COLOR_DATA_BASE=0x7000;
var MAX_MAP_HEIGHT=255;

function clamp(v,a,b,d){v=parseInt(v,10);return isNaN(v)?d:Math.max(a,Math.min(b,v));}
function hex2(v){return ('0'+((v||0)&255).toString(16)).slice(-2);}
function colorIndex(v,d){v=parseInt(v,10);return isNaN(v)||v<0?d:(v&15);}
function frameCount(editor){try{return editor.graphic.getFrameCount();}catch(e){return editor.graphic.frames?editor.graphic.frames.length:0;}}
function gridSize(editor){var g=editor&&editor.graphic,w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e){}return{width:w|0,height:h|0};}
function getCfg(editor,n){
  try{
    if(window.RICO_TEST79_MAP_SCROLL&&window.RICO_TEST79_MAP_SCROLL.getConfig)return window.RICO_TEST79_MAP_SCROLL.getConfig(editor.graphic,n);
    if(window.RICO_TEST75_MAP_SCROLL&&window.RICO_TEST75_MAP_SCROLL.getConfig)return window.RICO_TEST75_MAP_SCROLL.getConfig(editor.graphic,n);
    if(window.RICO_TEST37_MAP_SCROLL&&window.RICO_TEST37_MAP_SCROLL.getConfig)return window.RICO_TEST37_MAP_SCROLL.getConfig(editor.graphic,n);
  }catch(e){}
  var f=editor.graphic.frames&&editor.graphic.frames[n];return(f&&f.ricoMapScrollV1)||{type:'',ticksPerStep:6,pixelsPerStep:1};
}
function getWindowCfg(editor,n){
  try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getConfig)return window.RICO_TEST75_WINDOW_DIMENSION.getConfig(editor.graphic,n);}catch(e){}
  return{x:0,y:0,width:40,height:25};
}
function getScrollAreaCfg(editor,n){
  try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea)return window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea(editor.graphic,n);}catch(e){}
  var s=gridSize(editor);return{x:0,y:0,width:s.width,height:s.height};
}
function getTileSet(editor){
  try{var l=editor.layers.getSelectedLayerObject();if(l&&l.getType&&l.getType()==='grid'&&l.getTileSet)return l.getTileSet();return editor.tileSetManager.getCurrentTileSet();}catch(e){return null;}
}
function getBank2(ts){try{var r=ts.getDocRecord&&ts.getDocRecord(),d=r&&r.data&&r.data.ricoCharsetBank2;if(d&&d.tileData&&d.tileData.length>=256)return d.tileData;}catch(e){}return null;}
function pixels(tile){return tile&&tile.data&&tile.data.length?tile.data[0]:null;}
function charsetBytes(data,fallback){
  var o=new Uint8Array(2048);
  for(var c=0;c<256;c++){
    var p=pixels(data&&data[c])||pixels(fallback&&fallback[c]);if(!p)continue;
    for(var y=0;y<8;y++){var b=0;for(var x=0;x<8;x++)if(p[y*8+x])b|=1<<(7-x);o[c*8+y]=b;}
  }
  return o;
}
function mapData(layer,frame,w,h){
  var out=new Uint8Array(w*h),p=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var t=0;try{var c=layer.getCell({x:x,y:y,frame:frame});t=parseInt(c&&c.t,10);if(isNaN(t)||t<0||t>255)t=0;}catch(e){t=0;}out[p++]=t&255;
  }
  return out;
}
function mapColorData(layer,frame,w,h){
  var out=new Uint8Array(w*h),p=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var fc=14;try{var c=layer.getCell({x:x,y:y,frame:frame});fc=colorIndex(c&&c.fc,14);}catch(e){fc=14;}out[p++]=fc&15;
  }
  return out;
}
function dominantColor(layer,frame,w,h){
  var hist=[];for(var i=0;i<16;i++)hist[i]=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++)try{var c=layer.getCell({x:x,y:y,frame:frame}),fc=colorIndex(c&&c.fc,14);hist[fc]++;}catch(e){}
  var best=14,n=-1;for(var j=0;j<16;j++)if(hist[j]>n){n=hist[j];best=j;}return best;
}
function bytesLine(a){var s=[];for(var i=0;i<a.length;i++)s.push('$'+hex2(a[i]));return '!byte '+s.join(',');}
function emitBytes(out,a){for(var i=0;i<a.length;i+=16)out.push(bytesLine(Array.prototype.slice.call(a,i,i+16)));}

// TEST102: use James' native LVLLVL animation model.
// Entry format follows exportC64.js exactly:
// ticks, counter, charOffsetLo, charOffsetHi, type, frameCount, currentFrame, dataPtrLo, dataPtrHi.
// Types: 0 left, 1 right, 2 up, 3 down, 4 blink, 5 frames.
function copyPixels102(src){
  if(!src)return [];
  return src.slice?src.slice(0):Array.prototype.slice.call(src);
}
function pixelsToBytes102(p){
  var o=[];
  if(!p)return o;
  for(var y=0;y<8;y++){
    var b=0;
    for(var x=0;x<8;x++)if(p[y*8+x])b|=1<<(7-x);
    o.push(b&255);
  }
  return o;
}
function wrappedShift102(base,width,height,sx,sy){
  var out=new Array(width*height);
  for(var y=0;y<height;y++)for(var x=0;x<width;x++){
    var xx=(x+sx)%width,yy=(y+sy)%height;
    if(xx<0)xx+=width;if(yy<0)yy+=height;
    out[x+y*width]=base[xx+yy*width]||0;
  }
  return out;
}
function clippedShift102(base,width,height,sx,sy){
  var out=new Array(width*height);
  for(var i=0;i<out.length;i++)out[i]=0;
  for(var y=0;y<height;y++)for(var x=0;x<width;x++){
    var xx=x+sx,yy=y+sy;
    if(xx>=0&&xx<width&&yy>=0&&yy<height)out[x+y*width]=base[xx+yy*width]||0;
  }
  return out;
}
function pingDisplacement102(phase,size){
  if(size<=1)return 0;
  var cycle=size*2-2;
  phase=((phase%cycle)+cycle)%cycle;
  return phase<size?phase:cycle-phase;
}
function frameCountFor102(tile,type,width,height){
  switch(type){
    case 'left':case 'right':return width;
    case 'up':case 'down':return height;
    case 'pingpong-left':case 'pingpong-right':return Math.max(1,width*2-2);
    case 'pingpong-up':case 'pingpong-down':return Math.max(1,height*2-2);
    case 'blink':return 2;
    case 'frames':return Math.max(1,parseInt(tile&&tile.props&&tile.props.frameCount,10)||((tile&&tile.data&&tile.data.length)||1));
  }
  return 0;
}
function renderIndividual102(tile,type,frame){
  if(!tile||!tile.data||!tile.data.length)return [];
  var base=tile.data[0]||[],w=8,h=8;
  switch(type){
    case 'left':return wrappedShift102(base,w,h,frame,0);
    case 'right':return wrappedShift102(base,w,h,-frame,0);
    case 'up':return wrappedShift102(base,w,h,0,frame);
    case 'down':return wrappedShift102(base,w,h,0,-frame);
    case 'pingpong-left':return clippedShift102(base,w,h,pingDisplacement102(frame,w),0);
    case 'pingpong-right':return clippedShift102(base,w,h,-pingDisplacement102(frame,w),0);
    case 'pingpong-up':return clippedShift102(base,w,h,0,pingDisplacement102(frame,h));
    case 'pingpong-down':return clippedShift102(base,w,h,0,-pingDisplacement102(frame,h));
    case 'blink':{
      var o=copyPixels102(base);
      if(frame&1)for(var i=0;i<o.length;i++)o[i]=o[i]?0:1;
      return o;
    }
    case 'frames':{
      var f=Math.max(0,Math.min(frame,tile.data.length-1));
      return copyPixels102(tile.data[f]||base);
    }
  }
  return copyPixels102(base);
}
function getGroupStore102(ts){
  try{
    var r=ts&&ts.getDocRecord&&ts.getDocRecord();
    var store=r&&r.data&&r.data.ricoGroupAnimationsV1;
    if(store&&store.version===1)return store;
  }catch(e){}
  return null;
}
function groupFrameCount102(bankData,g){
  var w=Math.max(1,(g.widthTiles||1)*8),h=Math.max(1,(g.heightTiles||1)*8);
  switch(g.type){
    case 'left':case 'right':return w;
    case 'up':case 'down':return h;
    case 'pingpong-left':case 'pingpong-right':return Math.max(1,w*2-2);
    case 'pingpong-up':case 'pingpong-down':return Math.max(1,h*2-2);
    case 'blink':return 2;
    case 'frames':{
      var m=1,cells=g.cells||[];
      for(var i=0;i<cells.length;i++){
        var t=bankData&&bankData[cells[i].tile];
        if(t&&t.data&&t.data.length>m)m=t.data.length;
      }
      return m;
    }
  }
  return 1;
}
function buildGroupComposite102(bankData,g,frameForTileData){
  var w=(g.widthTiles||1)*8,h=(g.heightTiles||1)*8,out=new Array(w*h);
  for(var i=0;i<out.length;i++)out[i]=0;
  var cells=g.cells||[];
  for(var c=0;c<cells.length;c++){
    var cell=cells[c],tile=bankData&&bankData[cell.tile];
    if(!tile||!tile.data||!tile.data.length)continue;
    var fi=frameForTileData||0;
    if(fi>=tile.data.length)fi=tile.data.length-1;
    if(fi<0)fi=0;
    var p=tile.data[fi]||tile.data[0]||[];
    for(var y=0;y<8;y++)for(var x=0;x<8;x++){
      var dx=cell.x*8+x,dy=cell.y*8+y;
      if(dx>=0&&dx<w&&dy>=0&&dy<h)out[dx+dy*w]=p[x+y*8]||0;
    }
  }
  return out;
}
function renderGroup102(bankData,g,frame){
  var w=(g.widthTiles||1)*8,h=(g.heightTiles||1)*8;
  if(g.type==='frames')return buildGroupComposite102(bankData,g,frame);
  var base=buildGroupComposite102(bankData,g,0);
  switch(g.type){
    case 'left':return wrappedShift102(base,w,h,frame,0);
    case 'right':return wrappedShift102(base,w,h,-frame,0);
    case 'up':return wrappedShift102(base,w,h,0,frame);
    case 'down':return wrappedShift102(base,w,h,0,-frame);
    case 'pingpong-left':return clippedShift102(base,w,h,pingDisplacement102(frame,w),0);
    case 'pingpong-right':return clippedShift102(base,w,h,-pingDisplacement102(frame,w),0);
    case 'pingpong-up':return clippedShift102(base,w,h,0,pingDisplacement102(frame,h));
    case 'pingpong-down':return clippedShift102(base,w,h,0,-pingDisplacement102(frame,h));
    case 'blink':
      if(frame&1)for(var i=0;i<base.length;i++)base[i]=base[i]?0:1;
      return base;
  }
  return base;
}
function tilePixelsFromComposite102(composite,g,cell){
  var w=(g.widthTiles||1)*8,o=new Array(64);
  for(var y=0;y<8;y++)for(var x=0;x<8;x++){
    var sx=cell.x*8+x,sy=cell.y*8+y;
    o[x+y*8]=composite[sx+sy*w]||0;
  }
  return o;
}

// Export exactly the animation semantics used by TEST25 + TEST34.
// Every runtime animation becomes James-compatible type 5 (precomputed frames).
function collectRuntimeAnimations102(ts,bank){
  var bankData=bank===2?(getBank2(ts)||ts.tileData):ts.tileData;
  var byChar={},groupChars={};
  if(!bankData)return [];

  var store=getGroupStore102(ts);
  var groups=store?(bank===2?(store.bank2||[]):(store.bank1||[])):[];
  for(var gi=0;gi<groups.length;gi++){
    var g=groups[gi],cells=g.cells||[],count=groupFrameCount102(bankData,g);
    var ticks=clamp(g.ticksPerFrame,1,255,6);
    var seq={};
    for(var ci=0;ci<cells.length;ci++){
      groupChars[cells[ci].tile]=true;
      seq[cells[ci].tile]=[];
    }
    for(var f=0;f<count;f++){
      var comp=renderGroup102(bankData,g,f);
      for(var cc=0;cc<cells.length;cc++){
        var cell=cells[cc],pb=pixelsToBytes102(tilePixelsFromComposite102(comp,g,cell));
        seq[cell.tile]=seq[cell.tile]||[];
        for(var bi=0;bi<pb.length;bi++)seq[cell.tile].push(pb[bi]);
      }
    }
    for(var chs in seq)if(Object.prototype.hasOwnProperty.call(seq,chs)){
      var ch=parseInt(chs,10);
      byChar[ch]={character:ch,type:'group-'+g.type,typeCode:5,ticks:ticks,frameCount:count,frames:seq[chs]};
    }
  }

  var countTiles=Math.min(256,bankData.length);
  for(var ch=0;ch<countTiles;ch++){
    if(groupChars[ch])continue;
    var tile=bankData[ch];
    if(!tile||!tile.data||!tile.data.length)continue;
    var props=tile.props||{};
    var type=props.animated;
    if(type===false||type===''||type==='none'||typeof type==='undefined')continue;
    var fc=frameCountFor102(tile,type,8,8);
    if(fc<1)continue;
    var ticks=clamp(props.ticksPerFrame,1,255,6),frames=[];
    for(var f=0;f<fc;f++){
      var pb=pixelsToBytes102(renderIndividual102(tile,type,f));
      for(var b=0;b<pb.length;b++)frames.push(pb[b]);
    }
    byChar[ch]={character:ch,type:type,typeCode:5,ticks:ticks,frameCount:fc,frames:frames};
  }

  var out=[];
  for(var k in byChar)if(Object.prototype.hasOwnProperty.call(byChar,k))out.push(byChar[k]);
  out.sort(function(a,b){return a.character-b.character;});
  return out;
}
function buildRuntimeAnimationBlob102(items,tableBase){
  var tableLength=items.length*9+1;
  var dataBase=(tableBase+tableLength+15)&0xfff0;
  var table=[],data=[];
  for(var i=0;i<items.length;i++){
    var a=items[i],off=(a.character*8)&0xffff,ptr=dataBase+data.length;
    table.push(a.ticks&255,a.ticks&255,off&255,(off>>8)&255,5,
               a.frameCount&255,0,ptr&255,(ptr>>8)&255);
    for(var j=0;j<a.frames.length;j++)data.push(a.frames[j]&255);
  }
  table.push(0);
  return{tableBase:tableBase,dataBase:dataBase,table:table,data:data,end:dataBase+data.length};
}

function isLargeCandidate(self){
  var ed=self&&self.editor;if(!ed)return false;var s=gridSize(ed);
  return s.width===40&&s.height>25;
}
function collect(self){
  var ed=self.editor,s=gridSize(ed),fc=frameCount(ed);
  if(s.width!==40)throw new Error('TEST84 grande vertical requiere Screen de 40 columnas.');
  if(s.height<=25||s.height>MAX_MAP_HEIGHT)throw new Error('TEST84 acepta Screen de 40x26 hasta 40x255.');
  if(fc!==1)throw new Error('TEST84 grande vertical prueba primero una sola Frame.');
  var layer=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;
  if(!layer||!layer.getType||layer.getType()!=='grid')throw new Error('Selecciona una capa Grid.');
  var ts=getTileSet(ed);if(!ts||ts.getTileWidth()!=8||ts.getTileHeight()!=8)throw new Error('TEST84 requiere charset 8x8.');
  var cfg=getCfg(ed,0),type=(cfg&&cfg.type)||'';
  if(type!=='up'&&type!=='down')throw new Error('TEST84 mapa grande inicial soporta MAP SCROLL Up o Down.');
  var win=getWindowCfg(ed,0),area=getScrollAreaCfg(ed,0);
  win={x:clamp(win.x,0,s.width-1,0),y:clamp(win.y,0,s.height-1,0),width:clamp(win.width,1,s.width,40),height:clamp(win.height,1,s.height,25)};
  area={x:clamp(area.x,0,s.width-1,0),y:clamp(area.y,0,s.height-1,0),width:clamp(area.width,1,s.width,40),height:clamp(area.height,1,s.height,25)};
  if(win.x!==0||win.width!==40||(win.height!==24&&win.height!==25))throw new Error("Para TEST84 usa Window X=0, ancho 40 y alto 24 o 25.");
  if(area.x!==0||area.width!==40||area.height<25)throw new Error('Para TEST84 usa Scroll Area X=0, ancho 40 y alto de al menos 25 filas (por ejemplo 40x50).');
  if(area.y+area.height>s.height)throw new Error('Scroll Area sale fuera del Screen.');
  if(win.y<area.y||win.y>=area.y+area.height)throw new Error('El inicio de Window debe caer dentro del Scroll Area.');
  var initialRow=win.y-area.y;
  var duration=12;try{duration=ed.graphic.getFrameDuration(0);}catch(e){var fr=ed.graphic.frames&&ed.graphic.frames[0];duration=fr&&fr.duration;}duration=clamp(duration,1,1024,12);
  var bg=0,border=0;try{bg=colorIndex(layer.getBackgroundColor(0),0);}catch(e){}try{border=colorIndex(layer.getBorderColor(0),bg);}catch(e){border=bg;}
  var bank=1;try{bank=parseInt(ed.graphic.frames[0].charsetBank,10)===2?2:1;}catch(e){}
  var b2=getBank2(ts),bank1=charsetBytes(ts.tileData,ts.tileData),bank2=b2?charsetBytes(b2,ts.tileData):bank1;
  var data=mapData(layer,0,s.width,s.height),colors=mapColorData(layer,0,s.width,s.height);
  var jamesAnimations=collectRuntimeAnimations102(ts,bank);
  if(MAP_DATA_BASE+data.length>=COLOR_DATA_BASE)throw new Error('Mapa demasiado grande: invade el banco de color de TEST84.');
  if(COLOR_DATA_BASE+colors.length>=0xd000)throw new Error('Mapa de colores demasiado grande para el banco RAM seguro de TEST84.');
  return{editor:ed,width:s.width,height:s.height,type:type,typeCode:type==='up'?1:2,ticks:clamp(cfg&&cfg.ticksPerStep,1,255,6),pixels:clamp(cfg&&cfg.pixelsPerStep,1,8,1),duration:duration,bg:bg,border:border,bank:bank,window:win,area:area,initialRow:initialRow,bank1:bank1,bank2:bank2,map:data,colors:colors,jamesAnimations:jamesAnimations};
}


function blankCharTable(d){
  var cs=d.bank===2?d.bank2:d.bank1,out=new Uint8Array(256);
  for(var c=0;c<256;c++){
    var blank=1;
    for(var y=0;y<8;y++)if(cs[c*8+y]){blank=0;break;}
    out[c]=blank;
  }
  return out;
}
function dominantVisibleColor(d,blank){
  var h=[];for(var i=0;i<16;i++)h[i]=0;
  for(var p=0;p<d.map.length;p++)if(!blank[d.map[p]&255])h[d.colors[p]&15]++;
  var best=14,n=-1;for(var c=0;c<16;c++)if(h[c]>n){n=h[c];best=c;}
  return best;
}
function sparseColorRows(d,blank){
  var rows=[],total=0,max=0;
  for(var cam=0;cam<d.area.height;cam++){
    var a=[];
    for(var sy=0;sy<25;sy++){
      var srcRow=d.area.y+((cam+sy)%d.area.height);
      for(var x=0;x<40;x++){
        var idx=srcRow*40+x,ch=d.map[idx]&255;
        if(blank[ch])continue;
        var addr=0xd800+sy*40+x;
        a.push(addr&255,(addr>>8)&255,d.colors[idx]&15);
      }
    }
    if(a.length/3>255)throw new Error('TEST86 sparse color supera 255 caracteres visibles; usa una escena menos densa para esta prueba.');
    rows.push(a);total+=a.length;max=Math.max(max,a.length/3);
  }
  return{rows:rows,totalBytes:total,maxUpdates:max};
}

function buildSource(d){
  var out=[],areaBase=MAP_DATA_BASE+d.area.y*40,areaLo=areaBase&255,areaHi=(areaBase>>8)&255;
  var blank=blankCharTable(d),fallbackColor=dominantVisibleColor(d,blank),sparse=sparseColorRows(d,blank);
  var sparseBase=(COLOR_DATA_BASE+d.colors.length+255)&0xff00;
  var sparseStoredBytes=0;for(var sb=0;sb<sparse.rows.length;sb++)sparseStoredBytes+=sparse.rows[sb].length?sparse.rows[sb].length:1;
  if(sparseBase+(sparse.rows.length*3)+sparseStoredBytes>=0xd000)throw new Error('TEST86: las tablas sparse de color no caben antes de $D000.');
  var sparseEnd=sparseBase+(sparse.rows.length*3)+sparseStoredBytes;
  var animTableBase=(sparseEnd+15)&0xfff0;
  var jamesAnim=buildRuntimeAnimationBlob102(d.jamesAnimations||[],animTableBase);
  if(jamesAnim.end>=0xd000)throw new Error('TEST102: la tabla/datos de animacion nativa no caben antes de $D000.');
  var hasJamesAnim=(d.jamesAnimations&&d.jamesAnimations.length>0);
  var colorAreaBase=COLOR_DATA_BASE+d.area.y*40,colorAreaLo=colorAreaBase&255,colorAreaHi=(colorAreaBase>>8)&255;
  var durationLo=d.duration&255,durationHi=(d.duration>>8)&255;
  var d011base=d.window.height<=24?0x10:0x18;
  var charsetBits=d.bank===2?0x0e:0x0c;
  out.push('; RICO TEST102 - TEST89 LARGE MAP + JAMES NATIVE CHARACTER ANIMATION');
  out.push('; Screen '+d.width+'x'+d.height+' source map; VIC viewport 40x'+d.window.height+'; Scroll Area 40x'+d.area.height+'.');
  out.push('; Source map stays at $4000+. Per-cell colors stay at $7000+. VIC buffers remain at $0400/$0800.');
  out.push('*=$0801');
  out.push('!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00 ; 10 SYS8192');
  out.push('*=$2000');
  out.push('frame_remaining=$02');
  out.push('frame_remaining_hi=$03');
  out.push('step_counter=$04');
  out.push('ticks_per_step=$05');
  out.push('pixels_per_step=$06');
  out.push('scroll_type=$07');
  out.push('fine_pos=$08');
  out.push('pixel_count=$09');
  out.push('src_lo=$0a');
  out.push('src_hi=$0b');
  out.push('dst_lo=$0c');
  out.push('dst_hi=$0d');
  out.push('front_hi=$0e');
  out.push('back_hi=$0f');
  out.push('charset_bits=$10');
  out.push('camera_row=$11');
  out.push('source_row=$12');
  out.push('prep_request=$13');
  out.push('prep_ready=$14');
  out.push('prep_target_fine=$15');
  out.push('deferred_pixels=$16');
  out.push('main_busy=$17');
  out.push('color_tbl_lo=$18');
  out.push('color_tbl_hi=$19');
  out.push('color_updates=$1a');
  out.push('anim_tbl_lo=$1b');
  out.push('anim_tbl_hi=$1c');
  out.push('anim_target_lo=$1d');
  out.push('anim_target_hi=$1e');
  out.push('anim_data_lo=$1f');
  out.push('anim_data_hi=$20');
  out.push('anim_tmp=$21');
  out.push('anim_off_hi=$22');
  out.push('');
  out.push('start');
  out.push(' sei');
  out.push(' lda #$35');
  out.push(' sta $01');
  out.push(' lda $dd00');
  out.push(' ora #$03');
  out.push(' sta $dd00');
  out.push(' lda #$7f');
  out.push(' sta $dc0d');
  out.push(' sta $dd0d');
  out.push(' lda $dc0d');
  out.push(' lda $dd0d');
  out.push(' lda #$04');
  out.push(' sta front_hi');
  out.push(' lda #$08');
  out.push(' sta back_hi');
  out.push(' lda #$'+hex2(charsetBits));
  out.push(' sta charset_bits');
  out.push(' lda #$'+hex2(d.initialRow));
  out.push(' sta camera_row');
  out.push(' lda #$'+hex2(d.typeCode));
  out.push(' sta scroll_type');
  out.push(' lda #$'+hex2(d.ticks));
  out.push(' sta ticks_per_step');
  out.push(' sta step_counter');
  out.push(' lda #$'+hex2(d.pixels));
  out.push(' sta pixels_per_step');
  out.push(' lda #$'+hex2(durationLo));
  out.push(' sta frame_remaining');
  out.push(' lda #$'+hex2(durationHi));
  out.push(' sta frame_remaining_hi');
  out.push(' lda #$00');
  out.push(' sta prep_request');
  out.push(' sta prep_ready');
  out.push(' sta deferred_pixels');
  out.push(' sta main_busy');
  out.push(' jsr render_front');
  out.push(' jsr render_back');
  out.push(' jsr init_sparse_colors');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' bne start_no_fast8_prime');
  out.push(' lda #$01');
  out.push(' sta prep_request');
  out.push('start_no_fast8_prime');
  out.push(' lda #$'+hex2(d.bg));
  out.push(' sta $d021');
  out.push(' lda #$'+hex2(d.border));
  out.push(' sta $d020');
  if(d.type==='up')out.push(' lda #$07');else out.push(' lda #$00');
  out.push(' sta fine_pos');
  out.push(' jsr update_d018');
  out.push(' jsr apply_scroll_regs');
  out.push(' lda #$01');
  out.push(' sta $d01a');
  out.push(' lda #$fa');
  out.push(' sta $d012');
  out.push(' lda #<irq');
  out.push(' sta $fffe');
  out.push(' lda #>irq');
  out.push(' sta $ffff');
  out.push(' cli');
  out.push('main_loop');
  out.push(' lda prep_request');
  out.push(' beq main_loop');
  out.push(' lda prep_ready');
  out.push(' bne main_loop');
  out.push(' lda #$01');
  out.push(' sta main_busy');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' bne main_prepare_shift');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' bne main_prepare_fast8_down');
  out.push(' jsr camera_next');
  out.push(' jmp main_prepare_shift');
  out.push('main_prepare_fast8_down');
  out.push(' jsr camera_prev');
  out.push('main_prepare_shift');
  out.push(' jsr prepare_back_shift');
  out.push(' lda #$00');
  out.push(' sta main_busy');
  out.push(' lda #$01');
  out.push(' sta prep_ready');
  out.push(' jmp main_loop');
  out.push('');
  out.push('irq');
  out.push(' pha');out.push(' txa');out.push(' pha');out.push(' tya');out.push(' pha');
  out.push(' lda #$01');out.push(' sta $d019');
  if(hasJamesAnim)out.push(' jsr animate_chars');
  out.push(' lda main_busy');out.push(' bne irq_done_tick');out.push(' jsr frame_tick');
  out.push('irq_done_tick');
  out.push(' pla');out.push(' tay');out.push(' pla');out.push(' tax');out.push(' pla');out.push(' rti');
  out.push('');
  out.push('frame_tick');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' beq frame_tick_fast8');
  out.push(' lda prep_request');
  out.push(' beq frame_tick_timer');
  out.push(' lda prep_ready');
  out.push(' beq frame_tick_done');
  out.push(' jsr commit_prepared');
  out.push(' rts');
  out.push('frame_tick_fast8');
  out.push(' lda prep_ready');
  out.push(' beq frame_tick_done');
  out.push(' dec step_counter');
  out.push(' bne frame_tick_done');
  out.push(' lda ticks_per_step');
  out.push(' sta step_counter');
  out.push(' jsr commit_fast8');
  out.push(' rts');
  out.push('frame_tick_timer');
  out.push(' lda frame_remaining');
  out.push(' bne frame_tick_dec_low');
  out.push(' lda frame_remaining_hi');
  out.push(' beq frame_tick_reload');
  out.push(' dec frame_remaining_hi');
  out.push('frame_tick_dec_low');
  out.push(' dec frame_remaining');
  out.push(' lda frame_remaining');
  out.push(' ora frame_remaining_hi');
  out.push(' bne frame_tick_scroll');
  out.push('frame_tick_reload');
  out.push(' lda #$'+hex2(durationLo));out.push(' sta frame_remaining');
  out.push(' lda #$'+hex2(durationHi));out.push(' sta frame_remaining_hi');
  out.push('frame_tick_scroll');
  out.push(' dec step_counter');
  out.push(' bne frame_tick_done');
  out.push(' lda ticks_per_step');out.push(' sta step_counter');
  out.push(' lda pixels_per_step');out.push(' sta pixel_count');
  out.push('frame_pixel_loop');
  out.push(' jsr step_dispatch');
  out.push(' dec pixel_count');
  out.push(' lda prep_request');
  out.push(' beq frame_pixel_continue');
  out.push(' lda pixel_count');out.push(' sta deferred_pixels');
  out.push(' rts');
  out.push('frame_pixel_continue');
  out.push(' lda pixel_count');out.push(' bne frame_pixel_loop');
  out.push('frame_tick_done');out.push(' rts');
  out.push('');
  if(hasJamesAnim){
    out.push('; ---- James LVLLVL native character animation player ----');
    out.push('animate_chars');
    out.push(' lda #$'+hex2(jamesAnim.tableBase&255));out.push(' sta anim_tbl_lo');
    out.push(' lda #$'+hex2((jamesAnim.tableBase>>8)&255));out.push(' sta anim_tbl_hi');
    out.push('anim_char_start');
    out.push(' ldy #$00');out.push(' lda (anim_tbl_lo),y');out.push(' beq animate_chars_done');
    out.push(' ldy #$01');out.push(' lda (anim_tbl_lo),y');out.push(' sec');out.push(' sbc #$01');out.push(' sta (anim_tbl_lo),y');out.push(' bne next_anim_char');
    out.push(' ldy #$00');out.push(' lda (anim_tbl_lo),y');out.push(' iny');out.push(' sta (anim_tbl_lo),y');
    out.push(' ldy #$02');out.push(' lda (anim_tbl_lo),y');out.push(' clc');out.push(' adc #$'+hex2((d.bank===2?0x3800:0x3000)&255));out.push(' sta anim_target_lo');
    out.push(' iny');out.push(' lda (anim_tbl_lo),y');out.push(' adc #$'+hex2(((d.bank===2?0x3800:0x3000)>>8)&255));out.push(' sta anim_target_hi');
    out.push(' iny');out.push(' lda (anim_tbl_lo),y');
    out.push(' cmp #$00');out.push(' beq anim_type_left');
    out.push(' cmp #$01');out.push(' beq anim_type_right');
    out.push(' cmp #$02');out.push(' beq anim_type_up');
    out.push(' cmp #$03');out.push(' beq anim_type_down');
    out.push(' cmp #$04');out.push(' beq anim_type_blink');
    out.push(' cmp #$05');out.push(' beq anim_type_frames');
    out.push(' jmp next_anim_char');
    out.push('anim_type_left');out.push(' jsr scroll_char_left');out.push(' jmp next_anim_char');
    out.push('anim_type_right');out.push(' jsr scroll_char_right');out.push(' jmp next_anim_char');
    out.push('anim_type_up');out.push(' jsr scroll_char_up');out.push(' jmp next_anim_char');
    out.push('anim_type_down');out.push(' jsr scroll_char_down');out.push(' jmp next_anim_char');
    out.push('anim_type_blink');out.push(' jsr blink_char');out.push(' jmp next_anim_char');
    out.push('anim_type_frames');out.push(' jsr frame_char');
    out.push('next_anim_char');
    out.push(' clc');out.push(' lda anim_tbl_lo');out.push(' adc #$09');out.push(' sta anim_tbl_lo');out.push(' lda anim_tbl_hi');out.push(' adc #$00');out.push(' sta anim_tbl_hi');out.push(' jmp anim_char_start');
    out.push('animate_chars_done');out.push(' rts');
    out.push('');
    out.push('blink_char');out.push(' ldy #$00');out.push('blink_char_loop');out.push(' lda (anim_target_lo),y');out.push(' eor #$ff');out.push(' sta (anim_target_lo),y');out.push(' iny');out.push(' cpy #$08');out.push(' bne blink_char_loop');out.push(' rts');
    out.push('');
    out.push('scroll_char_left');out.push(' ldy #$00');out.push('scroll_char_left_loop');out.push(' lda (anim_target_lo),y');out.push(' asl');out.push(' lda (anim_target_lo),y');out.push(' rol');out.push(' sta (anim_target_lo),y');out.push(' iny');out.push(' cpy #$08');out.push(' bne scroll_char_left_loop');out.push(' rts');
    out.push('scroll_char_right');out.push(' ldy #$00');out.push('scroll_char_right_loop');out.push(' lda (anim_target_lo),y');out.push(' lsr');out.push(' lda (anim_target_lo),y');out.push(' ror');out.push(' sta (anim_target_lo),y');out.push(' iny');out.push(' cpy #$08');out.push(' bne scroll_char_right_loop');out.push(' rts');
    out.push('');
    out.push('scroll_char_up');out.push(' ldy #$00');out.push(' lda (anim_target_lo),y');out.push(' sta anim_tmp');out.push(' iny');
    out.push('scroll_char_up_loop');out.push(' lda (anim_target_lo),y');out.push(' dey');out.push(' sta (anim_target_lo),y');out.push(' iny');out.push(' iny');out.push(' cpy #$08');out.push(' bne scroll_char_up_loop');out.push(' dey');out.push(' lda anim_tmp');out.push(' sta (anim_target_lo),y');out.push(' rts');
    out.push('scroll_char_down');out.push(' ldy #$07');out.push(' lda (anim_target_lo),y');out.push(' sta anim_tmp');out.push(' dey');
    out.push('scroll_char_down_loop');out.push(' lda (anim_target_lo),y');out.push(' iny');out.push(' sta (anim_target_lo),y');out.push(' dey');out.push(' dey');out.push(' bmi scroll_char_down_finish');out.push(' jmp scroll_char_down_loop');
    out.push('scroll_char_down_finish');out.push(' ldy #$00');out.push(' lda anim_tmp');out.push(' sta (anim_target_lo),y');out.push(' rts');
    out.push('');
    out.push('frame_char');
    out.push(' ldy #$06');out.push(' lda (anim_tbl_lo),y');out.push(' clc');out.push(' adc #$01');out.push(' sta anim_tmp');
    out.push(' ldy #$05');out.push(' cmp (anim_tbl_lo),y');out.push(' bcc frame_char_index_ok');out.push(' lda #$00');out.push(' sta anim_tmp');
    out.push('frame_char_index_ok');out.push(' ldy #$06');out.push(' lda anim_tmp');out.push(' sta (anim_tbl_lo),y');
    out.push(' lda #$00');out.push(' sta anim_off_hi');out.push(' lda anim_tmp');out.push(' asl');out.push(' rol anim_off_hi');out.push(' asl');out.push(' rol anim_off_hi');out.push(' asl');out.push(' rol anim_off_hi');out.push(' sta anim_tmp');
    out.push(' ldy #$07');out.push(' lda (anim_tbl_lo),y');out.push(' clc');out.push(' adc anim_tmp');out.push(' sta anim_data_lo');out.push(' iny');out.push(' lda (anim_tbl_lo),y');out.push(' adc anim_off_hi');out.push(' sta anim_data_hi');
    out.push(' ldy #$00');out.push('frame_char_copy');out.push(' lda (anim_data_lo),y');out.push(' sta (anim_target_lo),y');out.push(' iny');out.push(' cpy #$08');out.push(' bne frame_char_copy');out.push(' rts');
    out.push('; ---- end James native character animation player ----');
    out.push('');
  }
  out.push('step_dispatch');
  out.push(' lda scroll_type');out.push(' cmp #$01');out.push(' beq step_up');out.push(' jmp step_down');
  out.push('step_up');
  out.push(' lda fine_pos');out.push(' beq step_done');out.push(' dec fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' bne step_done');out.push(' jsr camera_next');out.push(' lda #$01');out.push(' ldx #$07');out.push(' jsr request_prepare');
  out.push('step_done');out.push(' rts');
  out.push('step_down');
  out.push(' lda fine_pos');out.push(' cmp #$07');out.push(' beq step_down_done');out.push(' inc fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' cmp #$07');out.push(' bne step_down_done');out.push(' jsr camera_prev');out.push(' lda #$01');out.push(' ldx #$00');out.push(' jsr request_prepare');
  out.push('step_down_done');out.push(' rts');
  out.push('');
  out.push('request_prepare');
  out.push(' stx prep_target_fine');out.push(' lda #$01');out.push(' sta prep_request');out.push(' lda #$00');out.push(' sta prep_ready');out.push(' rts');
  out.push('');
  out.push('commit_prepared');
  out.push(' jsr apply_sparse_colors');
  out.push(' jsr swap_screens');
  out.push(' lda prep_target_fine');out.push(' sta fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda #$00');out.push(' sta prep_request');out.push(' sta prep_ready');
  out.push(' lda deferred_pixels');out.push(' beq commit_done');out.push(' sta pixel_count');out.push(' lda #$00');out.push(' sta deferred_pixels');
  out.push('commit_deferred_loop');out.push(' jsr step_dispatch');out.push(' dec pixel_count');out.push(' lda prep_request');out.push(' bne commit_done');out.push(' lda pixel_count');out.push(' bne commit_deferred_loop');
  out.push('commit_done');out.push(' rts');
  out.push('');
  out.push('commit_fast8');
  out.push(' jsr apply_sparse_colors');
  out.push(' jsr swap_screens');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' bne commit_fast8_down');
  out.push(' lda #$07');
  out.push(' jmp commit_fast8_fine');
  out.push('commit_fast8_down');
  out.push(' lda #$00');
  out.push('commit_fast8_fine');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' lda #$00');
  out.push(' sta prep_ready');
  out.push(' lda #$01');
  out.push(' sta prep_request');
  out.push(' rts');
  out.push('');
  out.push('camera_next');
  out.push(' inc camera_row');out.push(' lda camera_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc camera_next_done');out.push(' lda #$00');out.push(' sta camera_row');out.push('camera_next_done');out.push(' rts');
  out.push('camera_prev');
  out.push(' lda camera_row');out.push(' bne camera_prev_dec');out.push(' lda #$'+hex2(d.area.height-1));out.push(' sta camera_row');out.push(' rts');out.push('camera_prev_dec');out.push(' dec camera_row');out.push(' rts');
  out.push('');
  out.push('prepare_back_shift');
  out.push(' lda scroll_type');out.push(' cmp #$01');out.push(' beq prepare_fast_up');out.push(' jmp prepare_fast_down');
  out.push('prepare_fast_up');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' beq fast_up_04');
  out.push(' jsr copy960_up_08_to_04');out.push(' jmp fast_up_newrow');
  out.push('fast_up_04');out.push(' jsr copy960_up_04_to_08');
  out.push('fast_up_newrow');
  out.push(' jsr set_src_camera');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$18');
  out.push('fast_up_seek');out.push(' jsr advance_map_src');out.push(' dex');out.push(' bne fast_up_seek');
  out.push(' jsr set_dst_back');out.push(' ldx #$18');out.push('fast_up_dst_seek');out.push(' jsr add40_dst');out.push(' dex');out.push(' bne fast_up_dst_seek');out.push(' jsr copy40');out.push(' rts');
  out.push('prepare_fast_down');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' beq fast_down_04');
  out.push(' jsr copy960_down_08_to_04');out.push(' jmp fast_down_newrow');
  out.push('fast_down_04');out.push(' jsr copy960_down_04_to_08');
  out.push('fast_down_newrow');out.push(' jsr set_src_camera');out.push(' jsr set_dst_back');out.push(' jsr copy40');out.push(' rts');
  out.push('copy960_up_04_to_08');out.push(' ldy #$00');out.push('cu408_loop');
  out.push(' lda $0428,y');out.push(' sta $0800,y');out.push(' lda $0528,y');out.push(' sta $0900,y');out.push(' lda $0628,y');out.push(' sta $0a00,y');out.push(' iny');out.push(' bne cu408_loop');
  out.push(' ldy #$00');out.push('cu408_tail');out.push(' lda $0728,y');out.push(' sta $0b00,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cu408_tail');out.push(' rts');
  out.push('copy960_up_08_to_04');out.push(' ldy #$00');out.push('cu804_loop');
  out.push(' lda $0828,y');out.push(' sta $0400,y');out.push(' lda $0928,y');out.push(' sta $0500,y');out.push(' lda $0a28,y');out.push(' sta $0600,y');out.push(' iny');out.push(' bne cu804_loop');
  out.push(' ldy #$00');out.push('cu804_tail');out.push(' lda $0b28,y');out.push(' sta $0700,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cu804_tail');out.push(' rts');
  out.push('copy960_down_04_to_08');out.push(' ldy #$00');out.push('cd408_loop');
  out.push(' lda $0400,y');out.push(' sta $0828,y');out.push(' lda $0500,y');out.push(' sta $0928,y');out.push(' lda $0600,y');out.push(' sta $0a28,y');out.push(' iny');out.push(' bne cd408_loop');
  out.push(' ldy #$00');out.push('cd408_tail');out.push(' lda $0700,y');out.push(' sta $0b28,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cd408_tail');out.push(' rts');
  out.push('copy960_down_08_to_04');out.push(' ldy #$00');out.push('cd804_loop');
  out.push(' lda $0800,y');out.push(' sta $0428,y');out.push(' lda $0900,y');out.push(' sta $0528,y');out.push(' lda $0a00,y');out.push(' sta $0628,y');out.push(' iny');out.push(' bne cd804_loop');
  out.push(' ldy #$00');out.push('cd804_tail');out.push(' lda $0b00,y');out.push(' sta $0728,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cd804_tail');out.push(' rts');
  out.push('');
  out.push('set_src_front');out.push(' lda #$00');out.push(' sta src_lo');out.push(' lda front_hi');out.push(' sta src_hi');out.push(' rts');
  out.push('set_dst_back');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda back_hi');out.push(' sta dst_hi');out.push(' rts');
  out.push('copy40');out.push(' ldy #$00');out.push('copy40_loop');out.push(' lda (src_lo),y');out.push(' sta (dst_lo),y');out.push(' iny');out.push(' cpy #$28');out.push(' bne copy40_loop');out.push(' rts');
  out.push('advance_map_src');out.push(' inc source_row');out.push(' lda source_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc advance_map_src_next');out.push(' lda #$00');out.push(' sta source_row');out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');out.push(' rts');out.push('advance_map_src_next');out.push(' jmp add40_src');
  out.push('');
  out.push('render_front');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda front_hi');out.push(' sta dst_hi');out.push(' jmp render_to_dst');
  out.push('render_back');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda back_hi');out.push(' sta dst_hi');out.push(' jmp render_to_dst');
  out.push('');
  out.push('set_src_camera');
  out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');
  out.push(' ldx camera_row');out.push(' beq set_src_camera_done');
  out.push('set_src_camera_loop');out.push(' jsr add40_src');out.push(' dex');out.push(' bne set_src_camera_loop');
  out.push('set_src_camera_done');out.push(' rts');
  out.push('');
  out.push('set_color_src_camera');
  out.push(' lda #$'+hex2(colorAreaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(colorAreaHi));out.push(' sta src_hi');
  out.push(' ldx camera_row');out.push(' beq set_color_src_camera_done');
  out.push('set_color_src_camera_loop');out.push(' jsr add40_src');out.push(' dex');out.push(' bne set_color_src_camera_loop');
  out.push('set_color_src_camera_done');out.push(' rts');
  out.push('');
  out.push('init_sparse_colors');
  out.push(' lda #$'+hex2(fallbackColor));out.push(' ldx #$00');
  out.push('init_sparse_color_loop');out.push(' sta $d800,x');out.push(' sta $d900,x');out.push(' sta $da00,x');out.push(' sta $db00,x');out.push(' inx');out.push(' bne init_sparse_color_loop');
  out.push(' jmp apply_sparse_colors');
  out.push('');
  out.push('apply_sparse_colors');
  out.push(' ldx camera_row');out.push(' lda color_update_count,x');out.push(' sta color_updates');out.push(' beq sparse_color_done');
  out.push(' lda color_update_ptr_lo,x');out.push(' sta color_tbl_lo');out.push(' lda color_update_ptr_hi,x');out.push(' sta color_tbl_hi');
  out.push('sparse_color_loop');out.push(' ldy #$00');out.push(' lda (color_tbl_lo),y');out.push(' sta sparse_color_store+1');out.push(' iny');out.push(' lda (color_tbl_lo),y');out.push(' sta sparse_color_store+2');out.push(' iny');out.push(' lda (color_tbl_lo),y');
  out.push('sparse_color_store');out.push(' sta $d800');
  out.push(' clc');out.push(' lda color_tbl_lo');out.push(' adc #$03');out.push(' sta color_tbl_lo');out.push(' lda color_tbl_hi');out.push(' adc #$00');out.push(' sta color_tbl_hi');
  out.push(' dec color_updates');out.push(' bne sparse_color_loop');
  out.push('sparse_color_done');out.push(' rts');
  out.push('');
  out.push('render_to_dst');
  out.push(' jsr set_src_camera');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$19');
  out.push('render_row_loop');out.push(' ldy #$00');
  out.push('render_col_loop');out.push(' lda (src_lo),y');out.push(' sta (dst_lo),y');out.push(' iny');out.push(' cpy #$28');out.push(' bne render_col_loop');
  out.push(' jsr add40_dst');out.push(' inc source_row');out.push(' lda source_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc render_source_next');
  out.push(' lda #$00');out.push(' sta source_row');out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');out.push(' jmp render_row_advance_done');
  out.push('render_source_next');out.push(' jsr add40_src');
  out.push('render_row_advance_done');out.push(' dex');out.push(' bne render_row_loop');out.push(' rts');
  out.push('');
  out.push('add40_src');out.push(' clc');out.push(' lda src_lo');out.push(' adc #$28');out.push(' sta src_lo');out.push(' lda src_hi');out.push(' adc #$00');out.push(' sta src_hi');out.push(' rts');
  out.push('add40_dst');out.push(' clc');out.push(' lda dst_lo');out.push(' adc #$28');out.push(' sta dst_lo');out.push(' lda dst_hi');out.push(' adc #$00');out.push(' sta dst_hi');out.push(' rts');
  out.push('');
  out.push('swap_screens');
  out.push(' lda front_hi');out.push(' pha');out.push(' lda back_hi');out.push(' sta front_hi');out.push(' pla');out.push(' sta back_hi');out.push(' jsr update_d018');out.push(' rts');
  out.push('update_d018');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' bne d018_screen_0800');out.push(' lda #$10');out.push(' jmp d018_charset');out.push('d018_screen_0800');out.push(' lda #$20');out.push('d018_charset');out.push(' ora charset_bits');out.push(' sta $d018');out.push(' rts');
  out.push('apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' and #$07');out.push(' ora #$'+hex2(d011base));out.push(' sta $d011');out.push(' lda #$08');out.push(' sta $d016');out.push(' rts');
  out.push('*=$3000');out.push('charset_bank1');emitBytes(out,d.bank1);
  out.push('*=$3800');out.push('charset_bank2');emitBytes(out,d.bank2);
  out.push('*=$4000');out.push('large_map_data');emitBytes(out,d.map);
  out.push('*=$7000');out.push('large_color_data');emitBytes(out,d.colors);
  out.push('*=$'+('0000'+sparseBase.toString(16)).slice(-4));
  out.push('color_update_count');
  var counts=[];for(var ci=0;ci<sparse.rows.length;ci++)counts.push((sparse.rows[ci].length/3)&255);emitBytes(out,counts);
  // LVLLVL's in-browser assembler does not reliably resolve <label / >label
  // expressions inside !byte tables. Build the sparse-row pointer table numerically.
  var rowDataBase=sparseBase+(sparse.rows.length*3),rowAddr=rowDataBase,lo=[],hi=[],rowSizes=[];
  for(var pi=0;pi<sparse.rows.length;pi++){
    lo.push(rowAddr&255);hi.push((rowAddr>>8)&255);
    var rowSize=sparse.rows[pi].length?sparse.rows[pi].length:1;
    rowSizes.push(rowSize);rowAddr+=rowSize;
  }
  out.push('color_update_ptr_lo');emitBytes(out,lo);
  out.push('color_update_ptr_hi');emitBytes(out,hi);
  for(var ri=0;ri<sparse.rows.length;ri++){
    if(sparse.rows[ri].length)emitBytes(out,sparse.rows[ri]);else out.push('!byte $00');
  }
  out.push('*=$'+('0000'+jamesAnim.tableBase.toString(16)).slice(-4));
  out.push('animated_chars_table');emitBytes(out,jamesAnim.table);
  if(jamesAnim.data.length){out.push('*=$'+('0000'+jamesAnim.dataBase.toString(16)).slice(-4));out.push('animated_chars_data');emitBytes(out,jamesAnim.data);}
  return out.join('\n');
}

function assemblePRG(self,source){
  var assembler=g_app&&g_app.assembler;if(!assembler)throw new Error('Assembler de LVLLVL no disponible.');
  var result=assembler.assemble(source,0x0801);
  if(!result||!result.success){var msgs=[];if(result&&result.errors)for(var i=0;i<result.errors.length;i++)msgs.push(result.errors[i].message||String(result.errors[i]));throw new Error('Error ensamblando TEST102'+(msgs.length?': '+msgs.join(' | '):'.'));}
  var mem=assembler.getMemory(),start=result.start,end=result.end,prg=new Uint8Array(2+(end-start));prg[0]=start&255;prg[1]=(start>>8)&255;for(var a=start,p=2;a<end;a++,p++)prg[p]=mem[a]&255;self.prg=prg;return prg;
}

var prev=ToPRGAdv.prototype.createPRG;
ToPRGAdv.prototype.createPRG=function(args){
  args=args||{};
  if(!isLargeCandidate(this))return prev.apply(this,arguments);
  try{
    var d=collect(this); alert('TEST102: detectados '+(d.jamesAnimations?d.jamesAnimations.length:0)+' caracteres animados para exportar.'); var source=buildSource(d),bytes=assemblePRG(this,source),fn=args.filename||'rico-large-map-40x'+d.height+'.prg';if(!/\.prg$/i.test(fn))fn+='.prg';
    console.log('[RICO TEST102 RUNTIME CHAR ANIM] LARGE MAP exported: Screen 40x'+d.height+' | Window 40x'+d.window.height+' | Scroll Area 40x'+d.area.height+' | '+d.type+' | '+d.pixels+'px/'+d.ticks+'t | Runtime anim chars='+(d.jamesAnimations?d.jamesAnimations.length:0));
    if(args.download===false)return bytes;if(typeof window.download==='function'){window.download(bytes,fn,'application/prg');return bytes;}throw new Error('download() missing');
  }catch(e){console.error('[RICO TEST102 RUNTIME CHAR ANIM]',e);alert('RICO TEST102: '+e.message);return false;}
};

window.RICO_TEST102_PRG_RUNTIME_CHAR_ANIM={buildSource:buildSource,vertical:true,screenWidth:40,maxMapHeight:MAX_MAP_HEIGHT,windowHeights:[24,25],types:['up','down'],sourceMapSeparateFromVIC:true,colorMapBase:COLOR_DATA_BASE,perCellColors:true,sparseColorCommit:true,blankCellsUseDominantVisibleColor:true,doubleBuffer:true,pipelined8px:true,maxPalSpeed:'8px/frame',nativeCharacterAnimation:'LVLLVL-TEST25-TEST34-runtime-frames-via-James-table'};
console.log('[RICO TEST102 RUNTIME CHAR ANIM] Large vertical map exporter loaded with pipelined 8px/frame PAL max-speed path.');
})();
