/* TEST286: Procedural bitmap multicolor. No cached animation frames/atlas variants.
 * Tested modes: Individual Left/Right and Group Scroll Left/Right.
 * Retains SCREEN mode, native Export PRG and TEST282 static fallback.
 */
(function(){
'use strict';
if(!window.RICO_TEST282_BITMAP||!window.RICO_TEST279_BITMAP||typeof Editor==='undefined')return;
var LOAD=0x0801,ENTRY=0x0810,BMP=0x1000,SCR=0x2F40,COL=0x3328,
    BASE=0x8000,WORK=0x8800,DATA=0x9000,LIMIT=0xD000;
var Z={ml:0xD0,mh:0xD1,al:0xD2,ah:0xD3,bl:0xD4,bh:0xD5,
  wl:0xD6,wh:0xD7,gx:0xD8,rl:0xD9,rh:0xDA,sx:0xDB,shiftC:0xDC,
  shiftB:0xDD,width:0xDE,remain:0xDF,phase:0xE0,changed:0xE1,
  refl:0xE2,refh:0xE3,cl:0xE4,ch:0xE5,hi:0xE6,lo:0xE7,
  csl:0xE8,csh:0xE9,cdl:0xEA,cdh:0xEB};
var debug={last:null,error:null};
function editor(){return window.g_app&&window.g_app.textModeEditor;}
function layer(e){try{return e.layers.getSelectedLayerObject();}catch(x){return null;}}
function active(e){var l=layer(e);return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&l.getScreenMode()==='c64multicolor');}
function pack(t){
 var out=new Uint8Array(8);if(!t||t.length<64)throw Error('Tile 8×8 incompleto.');
 for(var y=0;y<8;y++)for(var x=0;x<4;x++){
  var k=y*8+x*2;out[y]|=((t[k]?2:0)|(t[k+1]?1:0))<<(6-x*2);
 }return out;
}
function empty(p){if(!p)return true;for(var i=0;i<64;i++)if(p[i])return false;return true;}
function analyze(){
 var e=editor(),l=layer(e);
 if(!active(e))throw Error('Activá SCREEN → Bitmap Multicolor.');
 var ts=l.getTileSet();if(!ts||ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw Error('Solo tiles 8×8.');
 var f=Number.isInteger(l.currentFrame)?l.currentFrame:0,frame=l.frames[f];
 if(!frame||!frame.data)throw Error('Frame visible inexistente.');
 var meta=e.graphic&&e.graphic.frames&&e.graphic.frames[f],bank=meta&&Number(meta.charsetBank)===2?2:1;
 var rec=ts.getDocRecord&&ts.getDocRecord(),stored=rec&&rec.data||{};
 var entries=bank===2?stored.ricoCharsetBank2&&stored.ricoCharsetBank2.tileData:ts.tileData;
 if(!entries)throw Error('No se encontró BANK '+bank);
 var base=new Uint8Array(2048),pix=[];
 for(var id=0;id<256;id++){
  var p=entries[id]&&entries[id].data&&entries[id].data[0];
  pix[id]=p||new Array(64).fill(0);
  if(p)base.set(pack(p),id*8);
 }
 var w=l.getGridWidth(),h=l.getGridHeight(),pal=window.RICO_TEST279_BITMAP.seed(frame,l);
 var ids=new Uint8Array(1000),used={},bm=new Uint8Array(8000),
     screen=new Uint8Array(1000),color=new Uint8Array(1000);
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var cell=y<h&&x<w&&frame.data[y]&&frame.data[y][x]||null;
  var tile=cell&&Number.isInteger(cell.t)?cell.t:0;
  if(tile<0||tile>255)throw Error('Índice de tile inválido: '+tile);
  var at=y*40+x,ink=cell?(pal[y*w+x]||0)&4095:0;
  ids[at]=tile;used[tile]=true;
  bm.set(base.subarray(tile*8,tile*8+8),at*8);
  screen[at]=((ink&15)<<4)|((ink>>4)&15);color[at]=(ink>>8)&15;
 }
 var groups=stored.ricoGroupAnimationsV1||{},selection=groups['bank'+bank]||[];
 var allowEmpty=groups.animateEmptyCharacters===true,animations=[],covered={},animated={};
 function add(a){if(!a.members.length)return;
  if(animations.length>=16)throw Error('TEST286: máximo 16 animadores individuales/grupales.');
  animations.push(a);
 }
 for(var i=0;i<selection.length;i++){
  var g=selection[i];
  if(!g||!g.type||g.type==='mixed')continue;
  if(!(g.cells||[]).some(function(c){return used[c.tile];}))continue;
  if(!/^(left|right)$/.test(g.type))
   throw Error('TEST286: Group Animate '+g.type+' pendiente. Probá Scroll Left o Scroll Right.');
  var gw=g.widthTiles,gh=g.heightTiles;
  if(!Number.isInteger(gw)||gw<1||gw>31||!Number.isInteger(gh)||gh<1||gh>255||
     gw*gh>1024)throw Error('TEST286: grupo demasiado ancho (máx. 31 tiles) o geometría incorrecta.');
  var matrix=new Array(gw*gh).fill(-1),members=[],seen={};
  for(var c of g.cells){
   if(!Number.isInteger(c.tile)||c.tile<0||c.tile>255||c.x<0||c.x>=gw||c.y<0||c.y>=gh)
    throw Error('Grupo con índices de tile o coordenadas inválidos.');
   if(seen[c.tile])throw Error('Tile '+c.tile+' duplicado en Group Animate.');
   seen[c.tile]=true;matrix[c.y*gw+c.x]=c.tile;covered[c.tile]=true;
   if(used[c.tile]&&(allowEmpty||!empty(pix[c.tile]))){
    members.push({tile:c.tile,x:c.x,y:c.y});animated[c.tile]=true;
   }
  }
  var rate=Number(g.pixelsPerTick);
  if(!Number.isInteger(rate)||rate<1||rate>8)rate=4;
  var delay=Number(g.ticksPerFrame);if(!Number.isInteger(delay)||delay<1)delay=6;
  if(delay>255)throw Error('TEST286: Ticks/Frame > 255 aún no soportado.');
  add({type:g.type,width:gw,height:gh,matrix:matrix,members:members,rate:rate,delay:delay});
 }
 for(var key in used){
  var id=Number(key),entry=entries[id],props=entry&&entry.props||{};
  if(covered[id]||!props.animated||props.animated==='none')continue;
  if(!/^(left|right)$/.test(props.animated))
   throw Error('TEST286: animación individual '+props.animated+' pendiente en tile '+id+'. Usá Left/Right.');
  var delay=Number(props.ticksPerFrame);if(!Number.isInteger(delay)||delay<1)delay=6;
  if(delay>255)throw Error('TEST286: Ticks/Frame > 255 todavía no soportado.');
  animated[id]=true;
  add({type:props.animated,width:1,height:1,matrix:[id],
   members:[{tile:id,x:0,y:0}],rate:1,delay:delay});
 }
 var targets=[];for(var i=0;i<1000;i++)if(animated[ids[i]])targets.push({tile:ids[i],cell:i});
 // The DATA bank stores ONE source matrix and member list per active group.
 // No per-tick phase images exist in the PRG.
 var blob=new Uint8Array(LIMIT-DATA),cursor=8;
 function put(arr){
  if(cursor+arr.length>blob.length)throw Error('TEST286: metadatos exceden RAM alta.');
  var p=DATA+cursor;blob.set(arr,cursor);cursor+=arr.length;return p;
 }
 for(var g of animations){
  var mat=[];
  for(var id of g.matrix){
   var src=id<0||(!allowEmpty&&empty(pix[id]))?DATA:BASE+id*8;
   mat.push(src&255,(src>>8)&255);
  }
  g.matrixPtr=put(mat);
 }
 for(var g of animations){
  var rows=[];
  for(var m of g.members){
   var dest=WORK+m.tile*8,row=g.matrixPtr+m.y*g.width*2;
   rows.push(dest&255,(dest>>8)&255,m.x,row&255,(row>>8)&255);
  }
  g.memberPtr=put(rows);g.memberCount=g.members.length;
 }
 var refresh=[];
 for(var t of targets){
  var src=WORK+t.tile*8,dst=0x6000+t.cell*8;
  refresh.push(src&255,(src>>8)&255,dst&255,(dst>>8)&255);
 }
 var refreshPtr=put(refresh);
 return {bitmap:bm,screen:screen,color:color,atlas:base,data:blob.subarray(0,cursor),
  animations:animations,refreshPtr:refreshPtr,refreshCount:targets.length,
  atlasBytes:2048,workingBytes:2048,metadataBytes:cursor,animatedTiles:Object.keys(animated).length,
  groupCount:animations.length,bank:bank,bg:l.getBackgroundColor(f)&15,end:DATA+cursor};
}
function assemble(m){
 var bytes=[],labels={},fix=[];
 function here(){return ENTRY+bytes.length;}function b(v){bytes.push(v&255);}
 function wd(v){b(v);b(v>>8);}function L(n){if(labels[n]!==undefined)throw Error('Etiqueta repetida '+n);labels[n]=here();}
 function I(op,v){b(op);b(v);}function W(op,v){b(op);wd(v);}
 function R(op,n){b(op);fix.push({i:bytes.length,n:n,rel:true});b(0);}
 function J(op,n){b(op);fix.push({i:bytes.length,n:n,rel:false});wd(0);}
 function copy(src,dest,size,name){
  I(0xA9,src);I(0x85,0xFB);I(0xA9,src>>8);I(0x85,0xFC);
  I(0xA9,dest);I(0x85,0xFD);I(0xA9,dest>>8);I(0x85,0xFE);
  if(size>>8){I(0xA2,size>>8);J(0x20,'copyPages');}
  if(size&255){I(0xA0,0);L('tail'+name);I(0xB1,0xFB);I(0x91,0xFD);
   b(0xC8);I(0xC0,size&255);R(0xD0,'tail'+name);}
 }
 b(0x78);I(0xA9,0x36);I(0x85,1);I(0xA9,0x0B);W(0x8D,0xD011);
 copy(BMP,0x6000,8000,'bmp');copy(SCR,0x5C00,1000,'scr');
 copy(COL,0xD800,1000,'col');copy(BASE,WORK,2048,'work');
 W(0xAD,0xDD02);I(0x09,3);W(0x8D,0xDD02);
 W(0xAD,0xDD00);I(0x29,0xFC);I(0x09,2);W(0x8D,0xDD00);
 I(0xA9,0);W(0x8D,0xD015);I(0xA9,0x78);W(0x8D,0xD018);
 I(0xA9,m.bg);W(0x8D,0xD020);W(0x8D,0xD021);
 I(0xA9,0x18);W(0x8D,0xD016);I(0xA9,0x3B);W(0x8D,0xD011);
 for(var i=0;i<m.animations.length;i++){
  I(0xA9,m.animations[i].delay);I(0x85,0xB0+i*2);
  I(0xA9,0);I(0x85,0xB1+i*2);
 }
 L('tick');L('wait');W(0xAD,0xD012);I(0xC9,250);R(0xD0,'wait');
 L('leave');W(0xAD,0xD012);I(0xC9,250);R(0xF0,'leave');
 I(0xA9,0);I(0x85,Z.changed);
 for(var i=0;i<m.animations.length;i++){
  var g=m.animations[i],timer=0xB0+i*2,phase=timer+1;
  I(0xC6,timer);R(0xD0,'skip'+i);
  I(0xA9,g.delay);I(0x85,timer);I(0xA5,phase);
  if(g.type==='left'){
   b(0x18);I(0x69,g.rate);I(0xC9,g.width*8);
   R(0x90,'valid'+i);b(0x38);I(0xE9,g.width*8);
  }else{
   b(0x38);I(0xE9,g.rate);R(0xB0,'valid'+i);
   b(0x18);I(0x69,g.width*8);
  }
  L('valid'+i);I(0x85,phase);I(0x85,Z.phase);
  I(0xA9,g.width);I(0x85,Z.width);
  I(0xA9,g.memberCount);I(0x85,Z.remain);
  I(0xA9,g.memberPtr);I(0x85,Z.ml);I(0xA9,g.memberPtr>>8);I(0x85,Z.mh);
  J(0x20,'render');I(0xA9,1);I(0x85,Z.changed);L('skip'+i);
 }
 I(0xA5,Z.changed);R(0xF0,'noRefresh');J(0x20,'refresh');
 L('noRefresh');J(0x4C,'tick');
 // Source group matrix contains 16-bit pointers to base glyphs.
 // Each 6502 frame calculates source columns and shifts 16-bit A:B rows.
 L('render');I(0xA5,Z.phase);I(0x29,7);I(0x85,Z.shiftB);
 I(0xA5,Z.phase);b(0x4A);b(0x4A);b(0x4A);I(0x85,Z.shiftC);
 L('member');I(0xA0,0);I(0xB1,Z.ml);I(0x85,Z.wl);
 b(0xC8);I(0xB1,Z.ml);I(0x85,Z.wh);
 b(0xC8);I(0xB1,Z.ml);I(0x85,Z.gx);
 b(0xC8);I(0xB1,Z.ml);I(0x85,Z.rl);
 b(0xC8);I(0xB1,Z.ml);I(0x85,Z.rh);
 I(0xA5,Z.gx);b(0x18);I(0x65,Z.shiftC);
 I(0xC5,Z.width);R(0x90,'xOk');b(0x38);I(0xE5,Z.width);
 L('xOk');I(0x85,Z.sx);b(0x0A);b(0xA8);
 I(0xB1,Z.rl);I(0x85,Z.al);b(0xC8);I(0xB1,Z.rl);I(0x85,Z.ah);
 I(0xA5,Z.sx);b(0x18);I(0x69,1);I(0xC5,Z.width);
 R(0x90,'xNext');I(0xA9,0);L('xNext');b(0x0A);b(0xA8);
 I(0xB1,Z.rl);I(0x85,Z.bl);b(0xC8);I(0xB1,Z.rl);I(0x85,Z.bh);
 I(0xA0,7);L('eachRow');
 I(0xB1,Z.al);I(0x85,Z.hi);I(0xB1,Z.bl);I(0x85,Z.lo);
 I(0xA6,Z.shiftB);R(0xF0,'emit');
 L('rotate');I(0x06,Z.lo);I(0x26,Z.hi);b(0xCA);R(0xD0,'rotate');
 L('emit');I(0xA5,Z.hi);I(0x91,Z.wl);b(0x88);R(0x10,'eachRow');
 b(0x18);I(0xA5,Z.ml);I(0x69,5);I(0x85,Z.ml);
 R(0x90,'memberNext');I(0xE6,Z.mh);L('memberNext');
 I(0xC6,Z.remain);R(0xF0,'endRender');J(0x4C,'member');
 L('endRender');b(0x60);
 // A list of occurrences is written only if one or more animators advances.
 L('refresh');I(0xA9,m.refreshPtr);I(0x85,Z.refl);
 I(0xA9,m.refreshPtr>>8);I(0x85,Z.refh);
 I(0xA9,m.refreshCount);I(0x85,Z.cl);
 I(0xA9,m.refreshCount>>8);I(0x85,Z.ch);
 L('refNext');I(0xA5,Z.cl);I(0x05,Z.ch);R(0xF0,'refDone');
 I(0xA0,0);I(0xB1,Z.refl);I(0x85,Z.csl);
 b(0xC8);I(0xB1,Z.refl);I(0x85,Z.csh);
 b(0xC8);I(0xB1,Z.refl);I(0x85,Z.cdl);
 b(0xC8);I(0xB1,Z.refl);I(0x85,Z.cdh);
 I(0xA0,7);L('refByte');I(0xB1,Z.csl);I(0x91,Z.cdl);
 b(0x88);R(0x10,'refByte');
 b(0x18);I(0xA5,Z.refl);I(0x69,4);I(0x85,Z.refl);
 R(0x90,'refPtrOk');I(0xE6,Z.refh);L('refPtrOk');
 I(0xA5,Z.cl);R(0xD0,'refCount');I(0xC6,Z.ch);
 L('refCount');I(0xC6,Z.cl);J(0x4C,'refNext');
 L('refDone');b(0x60);
 L('copyPages');I(0xA0,0);L('copyPage');I(0xB1,0xFB);
 I(0x91,0xFD);b(0xC8);R(0xD0,'copyPage');
 I(0xE6,0xFC);I(0xE6,0xFE);b(0xCA);R(0xD0,'copyPage');b(0x60);
 for(var f of fix){
  var target=labels[f.n];if(target===undefined)throw Error('ASM etiqueta indefinida '+f.n);
  if(!f.rel){bytes[f.i]=target&255;bytes[f.i+1]=(target>>8)&255;}
  else{var diff=target-(ENTRY+f.i+1);if(diff< -128||diff>127)
    throw Error('ASM salto fuera de rango '+f.n+' '+diff);
   bytes[f.i]=diff&255;}
 }
 if(ENTRY+bytes.length>=BMP)throw Error('ASM runtime demasiado grande para la zona $0810–$0FFF.');
 return {bytes:new Uint8Array(bytes),labels:labels};
}
function build(m){
 if(!m.animations.length)throw Error('Usá TEST282 para Bitmap estático.');
 var a=assemble(m),prg=new Uint8Array(2+m.end-LOAD);
 prg[0]=1;prg[1]=8;
 function at(p){return 2+p-LOAD;}
 prg.set([0x0B,0x08,10,0,0x9E,50,48,54,52,0,0,0],at(LOAD));
 prg.set(a.bytes,at(ENTRY));prg.set(m.bitmap,at(BMP));
 prg.set(m.screen,at(SCR));prg.set(m.color,at(COL));
 prg.set(m.atlas,at(BASE));prg.set(m.data,at(DATA));
 return prg;
}
function download(bytes,name){
 if(typeof window.download==='function')return window.download(bytes,name,'application/prg');
 var blob=new Blob([bytes],{type:'application/octet-stream'}),
  url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function exportPRG(opts){
 try{
  if(!active(editor()))return false;
  var m=analyze(),bytes;
  if(!m.animations.length){
   bytes=window.RICO_TEST282_BITMAP.buildPRG(window.RICO_TEST282_BITMAP.encode(editor()));
  }else bytes=build(m);
  debug.error=null;debug.last={status:'GENERATED - VICE PENDING',
   bytes:bytes.length,tilesAtlas:256,atlasBytes:2048,workingBytes:2048,
   metadataBytes:m.metadataBytes,animatedGroups:m.animations.length,
   visibleAnimatedCells:m.refreshCount,bitmapMode:'multicolor procedural horizontal'};
  window.RICO_TEST286_LAST_EXPORT=debug.last;
  if(opts&&opts.download===false)return {bytes:bytes,model:m};
  download(bytes,m.animations.length?'RICO_TEST286_BITMAP_MC_PROCEDURAL.prg':'RICO_BITMAP_MC_STATIC.prg');
  console.log('[RICO TEST286]',debug.last);return bytes;
 }catch(e){
  debug.error=String(e&&e.message||e);console.error('[RICO TEST286]',e);
  if(!(opts&&opts.silent)&&typeof window.alert==='function')
   window.alert('Exportar PRG · Bitmap Multicolor: '+debug.error);
  return false;
 }
}
var previous=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(id){
 if(id==='export-prg'&&active(this.textModeEditor))return exportPRG();
 return previous.apply(this,arguments);
};
window.RICO_TEST286_BITMAP={version:'TEST286',analyze:analyze,assemble:assemble,build:build,exportPRG:exportPRG,debug:debug};
console.log('[RICO TEST286] procedural horizontal bitmap renderer installed, native Export PRG.');
})();