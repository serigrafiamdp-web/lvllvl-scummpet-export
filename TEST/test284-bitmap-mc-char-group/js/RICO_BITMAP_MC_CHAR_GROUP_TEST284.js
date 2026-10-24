/* TEST284 — BITMAP MC: normal Export PRG + INDIVIDUAL / GROUP animations.
 * No full-document frame animation. Separate experimental adapter.
 * Keeps TEST282 static fallback; uses TEST283 sparse VIC bitmap 6502 runtime.
 */
(function(){
'use strict';
var TAG='[RICO TEST284]',ATLAS=0x3800,LIMIT=0x5C00;
if(!window.RICO_TEST282_BITMAP||!window.RICO_TEST283_BITMAP||!window.RICO_TEST279_BITMAP)return;
var metrics={last:null,error:null,attempts:0};
function edNow(){return window.g_app&&window.g_app.textModeEditor;}
function layerOf(ed){try{return ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function isBitmap(ed){
 var l=layerOf(ed);return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&l.getScreenMode()==='c64multicolor');
}
function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
function lcm(a,b){return a/gcd(a,b)*b;}
function ticks(v){v=Number(v);return Number.isInteger(v)&&v>0?Math.min(v,1024):6;}
function pixels(src){
 if(!src||src.length<64)throw new Error('Bitmap de tile incompleto (8×8)');
 return Array.prototype.slice.call(src,0,64).map(function(v){return v?1:0;});
}
function bytes8(arr){
 var out=new Uint8Array(8);
 for(var y=0;y<8;y++){
  var b=0;
  for(var q=0;q<4;q++){
   var k=y*8+q*2;b|=((arr[k]?2:0)|(arr[k+1]?1:0))<<(6-q*2);
  }
  out[y]=b;
 }return out;
}
function shift(base,w,h,dx,dy,clip){
 var out=new Array(w*h);
 for(var y=0;y<h;y++)for(var x=0;x<w;x++){
  var sx=x+dx,sy=y+dy;
  if(clip&&(sx<0||sy<0||sx>=w||sy>=h)){out[y*w+x]=0;continue;}
  sx=((sx%w)+w)%w;sy=((sy%h)+h)%h;
  out[y*w+x]=base[sy*w+sx]||0;
 }return out;
}
function invert(base){return base.map(function(v){return v?0:1;});}
function ping(p,size){if(size<=1)return 0;var period=size*2-2,n=p%period;return n<size?n:period-n;}
function frameCount(type,tile){
 if(type==='blink')return 2;
 if(type==='frames')return Math.max(1,Math.min(tile.data.length,Number(tile.props.frameCount)||tile.data.length));
 if(/^(left|right|up|down)$/.test(type))return 8;
 throw new Error('Animación individual no admitida: '+type);
}
function individualPixels(entry,type,phase){
 var base=pixels(entry.data[0]);
 if(type==='frames')return pixels(entry.data[Math.min(phase,entry.data.length-1)]||entry.data[0]);
 if(type==='blink')return phase%2?invert(base):base;
 var dx=type==='left'?phase:type==='right'?-phase:0,
     dy=type==='up'?phase:type==='down'?-phase:0;
 return shift(base,8,8,dx,dy,false);
}
function groupCount(group,entries){
 var w=group.widthTiles*8,h=group.heightTiles*8,type=group.type;
 if(type==='blink')return 2;
 if(type==='frames'){
  var count=1;
  for(var i=0;i<group.cells.length;i++){
   var entry=entries[group.cells[i].tile];
   if(entry&&entry.data)count=Math.max(count,entry.data.length);
  }return count;
 }
 if(/^(left|right|pingpong-left|pingpong-right)$/.test(type))return type.indexOf('pingpong')===0?Math.max(1,2*w-2):w;
 if(/^(up|down|pingpong-up|pingpong-down)$/.test(type))return type.indexOf('pingpong')===0?Math.max(1,2*h-2):h;
 throw new Error('Group Animate '+type+' todavía no exportable en Bitmap MC.');
}
function makeGroupBase(g,entries,frameNum){
 var w=g.widthTiles*8,h=g.heightTiles*8,base=new Array(w*h).fill(0);
 for(var k=0;k<g.cells.length;k++){
  var cell=g.cells[k],tile=entries[cell.tile];
  if(!tile||!tile.data||!tile.data.length)continue;
  var pix=pixels(tile.data[Math.min(frameNum,tile.data.length-1)]||tile.data[0]);
  for(var y=0;y<8;y++)for(var x=0;x<8;x++){
   var xx=cell.x*8+x,yy=cell.y*8+y;
   if(xx>=0&&yy>=0&&xx<w&&yy<h)base[yy*w+xx]=pix[y*8+x];
  }
 }return base;
}
function groupPixels(g,entries,phase,allowEmpty){
 var w=g.widthTiles*8,h=g.heightTiles*8,type=g.type,
     base=makeGroupBase(g,entries,type==='frames'?phase:0),image=base;
 if(type==='blink'){if(phase%2)image=invert(base);}
 else if(type!=='frames'){
  var disp=type.indexOf('pingpong')===0?ping(phase,/left|right/.test(type)?w:h):phase;
  var dx=/left/.test(type)?disp:/right/.test(type)?-disp:0,
      dy=/up/.test(type)?disp:/down/.test(type)?-disp:0;
  image=shift(base,w,h,dx,dy,type.indexOf('pingpong')===0);
 }
 var result={};
 for(var k=0;k<g.cells.length;k++){
  var cell=g.cells[k],entry=entries[cell.tile];
  if(!entry||!entry.data||!entry.data[0])continue;
  // The original group preview excludes empty glyphs by default.
  if(!allowEmpty){
   var nonempty=false,raw=entry.data[0];
   for(var j=0;j<raw.length;j++){if(raw[j]){nonempty=true;break;}}
   if(!nonempty)continue;
  }
  var pix=new Array(64);
  for(var y=0;y<8;y++)for(var x=0;x<8;x++){
   var sx=cell.x*8+x,sy=cell.y*8+y;
   pix[y*8+x]=(sx>=0&&sy>=0&&sx<w&&sy<h)?image[sy*w+sx]:0;
  }
  result[cell.tile]=pix;
 }return result;
}
function snapshot(){
 var ed=edNow(),l=layerOf(ed);
 if(!isBitmap(ed))throw new Error('Elegí SCREEN → Bitmap Multicolor.');
 var ts=l.getTileSet&&l.getTileSet();
 if(!ts||ts.getTileWidth()!==8||ts.getTileHeight()!==8)
  throw new Error('TEST284 requiere tiles de 8x8.');
 // Exactly ONE map frame (currently selected); no document-frame animation.
 var fn=Number.isInteger(l.currentFrame)?l.currentFrame:0,
     frame=l.frames[fn];
 if(!frame||!frame.data)throw new Error('Frame visible no disponible.');
 var docFrame=ed.graphic&&ed.graphic.frames&&ed.graphic.frames[fn];
 var bank=docFrame&&Number(docFrame.charsetBank)===2?2:1;
 var rec=ts.getDocRecord&&ts.getDocRecord();
 var store=rec&&rec.data||{};
 var bank2=store.ricoCharsetBank2;
 if(bank===2&&(!bank2||!bank2.tileData))
  throw new Error('La frame selecciona Bank 2, pero falta su información.');
 var entries=bank===2?bank2.tileData:ts.tileData;
 if(!entries)throw new Error('No se encontró tileset '+bank);
 var groupStore=store.ricoGroupAnimationsV1||{},groups=groupStore['bank'+bank]||[];
 var w=l.getGridWidth(),h=l.getGridHeight(),colorIndex=window.RICO_TEST279_BITMAP.seed(frame,l);
 var ids=new Uint8Array(1000),inks=new Uint16Array(1000),used={};
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var cell=y<h&&x<w&&frame.data[y]&&frame.data[y][x]||null,
      id=cell&&Number.isInteger(cell.t)?cell.t:0;
  if(id<0||id>255)throw new Error('Índice de tile fuera de 0..255: '+id);
  if(!entries[id]||!entries[id].data||!entries[id].data[0])throw new Error('Tile '+id+' no existe en Bank '+bank);
  var z=y*40+x;ids[z]=id;
  inks[z]=cell?(colorIndex[y*w+x]||0)&4095:0;
  used[id]=true;
 }
 var activeGroups=[],covered={},animationCount=0,period=1;
 for(var k=0;k<groups.length;k++){
  var g=groups[k];
  if(!g||!g.type||g.type==='mixed')continue;
  var touches=(g.cells||[]).some(function(c){return used[c.tile];});
  if(!touches)continue;
  if(g.type==='switch-bank')
   throw new Error('Group Switch Bank aún no es compatible con Bitmap; exportá un solo banco.');
  if(!g.widthTiles||!g.heightTiles||!g.cells||g.cells.length<2)
   throw new Error('Group Animate '+k+' sin geometría completa.');
  var count=groupCount(g,entries),speed=ticks(g.ticksPerFrame);
  var explicit=Number(g.pixelsPerTick);
  var ppt=/^(?:pingpong-)?(?:left|right|up|down)$/.test(g.type)
   ?(Number.isInteger(explicit)&&explicit>=1&&explicit<=8?explicit:
       /^(left|right)$/.test(g.type)?4:
       /^(up|down)$/.test(g.type)?((g.widthTiles===2&&g.heightTiles===8&&speed===1)?1:2):1):1;
  if(!Number.isInteger(ppt)||ppt<1||ppt>8)throw new Error('Pixels/Tick inválido en group '+k);
  var steps=count/gcd(count,ppt),cycle=steps*speed;
  period=lcm(period,cycle);
  if(period>4096)throw new Error('Ciclo de grupos supera 4096 ticks; prueba Bitmap limitada.');
  activeGroups.push({group:g,count:count,speed:speed,pixels:ppt});
  for(var i=0;i<g.cells.length;i++){
   var id=g.cells[i].tile;
   if(covered[id])throw new Error('El tile '+id+' está en dos grupos simultáneos.');
   covered[id]=true;
  }
  animationCount++;
 }
 var individual=[];
 for(var key in used){
  var id=Number(key),tile=entries[id],props=tile.props||{},type=props.animated;
  if(!type||type==='none'||covered[id])continue;
  var count=frameCount(type,tile),speed=ticks(props.ticksPerFrame);
  period=lcm(period,count*speed);
  if(period>4096)throw new Error('Ciclo de animación individual supera 4096 ticks; reducí Ticks/Frame.');
  individual.push({id:id,tile:tile,type:type,count:count,speed:speed});
  animationCount++;
 }
 var stage=window.RICO_TEST283_BITMAP;
 if(!animationCount)return null; // Normal Export PRG falls back to static bitmap.
 var boundaries=[0],lastSig=null;
 function signature(t){
  var bits=[];
  for(var i=0;i<individual.length;i++)bits.push(Math.floor(t/individual[i].speed)%individual[i].count);
  for(var i=0;i<activeGroups.length;i++)bits.push((Math.floor(t/activeGroups[i].speed)*activeGroups[i].pixels)%activeGroups[i].count);
  return bits.join(':');
 }
 lastSig=signature(0);
 for(var t=1;t<period;t++){
  var sig=signature(t);
  if(sig!==lastSig){boundaries.push(t);lastSig=sig;}
  if(boundaries.length>255)throw new Error('Más de 255 pasos de animación por ciclo. TEST284 requiere tiempos menos densos.');
 }
 var atlas=[],hash={},states=[],allowEmpty=groupStore.animateEmptyCharacters===true;
 function ptr(pix){
  var bytes=bytes8(pix),key=Array.prototype.join.call(bytes,',');
  if(hash[key]!==undefined)return hash[key];
  var address=ATLAS+atlas.length;
  if(address+8>LIMIT)throw new Error('No cabe el atlas en memoria Bitmap.');
  for(var k=0;k<8;k++)atlas.push(bytes[k]);
  hash[key]=address;return address;
 }
 var bg=l.getBackgroundColor(fn)&15;
 for(var step=0;step<boundaries.length;step++){
  var time=boundaries[step],images={},pointers=new Uint16Array(1000);
  for(var id in used)images[id]=pixels(entries[id].data[0]);
  for(var i=0;i<individual.length;i++){
   var item=individual[i],phase=Math.floor(time/item.speed)%item.count;
   images[item.id]=individualPixels(item.tile,item.type,phase);
  }
  for(var i=0;i<activeGroups.length;i++){
   var item=activeGroups[i],phase=Math.floor(time/item.speed)*item.pixels%item.count,
     changed=groupPixels(item.group,entries,phase,allowEmpty);
   for(var id in changed)images[id]=changed[id];
  }
  var localPointers={};
  for(var id in used)localPointers[id]=ptr(images[id]);
  for(var cell=0;cell<1000;cell++)pointers[cell]=localPointers[ids[cell]];
  var next=step+1<boundaries.length?boundaries[step+1]:period;
  states.push({at:time,bg:bg,pointers:pointers,inks:inks,duration:next-time});
 }
 var initial=states[0],bitmap=new Uint8Array(8000),screen=new Uint8Array(1000),colors=new Uint8Array(1000);
 for(var c=0;c<1000;c++){
  var src=initial.pointers[c]-ATLAS;
  for(var r=0;r<8;r++)bitmap[c*8+r]=atlas[src+r];
  var v=inks[c];screen[c]=((v&15)<<4)|((v>>4)&15);
  colors[c]=(v>>8)&15;
 }
 var streams=[],addresses=[],end=ATLAS+atlas.length,maxDirty=0,dirtyTotal=0;
 for(var i=0;i<states.length;i++){
  var target=states[i],old=states[(i+states.length-1)%states.length],list=[],dirty=0;
  for(var cell=0;cell<1000;cell++){
   if(target.pointers[cell]===old.pointers[cell]&&target.inks[cell]===old.inks[cell])continue;
   var p=target.pointers[cell],v=target.inks[cell];
   list.push(cell&255,(cell>>8)&255,p&255,p>>8,screenColor(v),(v>>8)&15);
   dirty++;
  }
  var header=[target.duration&255,target.duration>>8,target.bg,dirty&255,dirty>>8];
  var record=new Uint8Array(header.concat(list));
  addresses.push(end);end+=record.length;streams.push(record);
  dirtyTotal+=dirty;maxDirty=Math.max(maxDirty,dirty);
 }
 if(end>LIMIT)throw new Error('Animación requiere '+(end-ATLAS)+' bytes. RAM disponible para atlas y cambios '+(LIMIT-ATLAS)+' bytes.');
 return {bitmap:bitmap,screen:screen,colors:colors,atlas:new Uint8Array(atlas),
  streams:streams,pointers:addresses,states:states,stepCount:states.length,frameCount:1,
  tileCount:Object.keys(used).length,variantCount:atlas.length/8,
  totalTicks:period,durations:[period],bg:bg,sourceMap:w+'×'+h,
  maxDirty:maxDirty,totalDirty:dirtyTotal,end:end,
  animatedTiles:individual.length,animatedGroups:activeGroups.length,bank:bank};
}
function screenColor(v){return ((v&15)<<4)|((v>>4)&15);}
function deliver(bytes,name){
 if(typeof window.download==='function')return window.download(bytes,name,'application/prg');
 var obj=new Blob([bytes],{type:'application/octet-stream'}),url=URL.createObjectURL(obj),
  a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function exportNormal(options){
 metrics.attempts++;
 try{
  if(!isBitmap(edNow()))return false;
  var model=snapshot();
  if(!model){
    var still=window.RICO_TEST282_BITMAP.encode(edNow()),
        staticPRG=window.RICO_TEST282_BITMAP.buildPRG(still);
    var report={status:'STATIC GENERATED — VERIFY IN VICE',bytes:staticPRG.length,mode:'bitmap',animations:0};
    metrics.last=report;metrics.error=null;window.RICO_TEST284_LAST_EXPORT=report;
    if(options&&options.download===false)return {bytes:staticPRG,model:null,info:report};
    deliver(staticPRG,'RICO_BITMAP_MC_STATIC.prg');
    return staticPRG;
  }
  var bytes=window.RICO_TEST283_BITMAP.build(model);
  var info={status:'GENERATED — VERIFY IN VICE',bytes:bytes.length,bank:model.bank,
   tiles:model.tileCount,individual:model.animatedTiles,groups:model.animatedGroups,
   steps:model.stepCount,ticks:model.totalTicks,maxDirty:model.maxDirty,
   totalDirty:model.totalDirty,variants:model.variantCount};
  metrics.last=info;metrics.error=null;window.RICO_TEST284_LAST_EXPORT=info;
  if(options&&options.download===false)return {bytes:bytes,model:model,info:info};
  deliver(bytes,'RICO_BITMAP_MC_ANIM.prg');
  console.log(TAG,info);
  return bytes;
 }catch(e){
  metrics.error=String(e&&e.message||e);console.error(TAG,e);
  if(!(options&&options.silent)&&typeof window.alert==='function')
   window.alert('Exportar PRG · Bitmap Multicolor: '+metrics.error);
  return false;
 }
}
// Export PRG uses the normal menu entry. Do not invent an alternative panel.
if(typeof Editor!=='undefined'&&Editor.prototype){
 var orig=Editor.prototype.menuClick;
 Editor.prototype.menuClick=function(id){
  if(id==='export-prg'&&isBitmap(this.textModeEditor))return exportNormal();
  return orig.apply(this,arguments);
 };
}
// Hide additive debug/export panels WITHOUT removing the real BG/C1/C2/C3 ink
// brush: the 4 little swatches are necessary to pick 2-bit ink codes.
function cleanUI(){
 if(!document.getElementById('rico284Styles')){
  var style=document.createElement('style');style.id='rico284Styles';
  style.textContent=
    '#rico279Panel,#rico282Holder,#rico283Holder{display:none!important;}'+
    '#rico280InkBar>div:first-child,#rico280InkBar>button,'+
    '#rico281ActiveBrush{display:none!important;}'+
    '#rico280InkBar{margin:2px 4px!important;padding:4px 6px!important;border:0!important;background:transparent!important;}';
  document.head.appendChild(style);
 }
 var holder=document.getElementById('sidetilePaletteHolder');
 if(holder&&holder.style&&holder.style.getPropertyValue('top')==='98px')holder.style.setProperty('top','43px','important');
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanUI);
else cleanUI();
if(window.UI&&UI.on)UI.on('ready',cleanUI);
if(typeof TextModeEditor!=='undefined'){
 var oldSet=TextModeEditor.prototype.setScreenMode;
 TextModeEditor.prototype.setScreenMode=function(){
  var r=oldSet.apply(this,arguments);setTimeout(cleanUI,0);return r;
 };
}
window.RICO_TEST284_BITMAP={version:'TEST284',snapshot:snapshot,exportPRG:exportNormal,
 ui:cleanUI,metrics:metrics,shift:shift,groupPixels:groupPixels,individualPixels:individualPixels};
console.log(TAG,'normal PRG export installed; individual/group animations only');
})();