/* TEST283 — C64 Bitmap MC runtime: sparse cell update / frame & tile-frames player.
 * Standalone 6502 VIC bitmap runtime, independent of legacy character scroll players.
 * Default frame durations: graphic.getFrameDuration(); tile animations: 'frames'.
 * TEST282 remains as immutable static fallback. Do not patch its code.
 */
(function(){
'use strict';
var TAG='[RICO TEST283]',ORIGIN=0x0801,ENTRY=0x0810,BASE=0x1000,
  B0=BASE,S0=BASE+8000,C0=BASE+9000,ATLAS=0x3800,LIMIT=0x5C00;
var Z={idx:0xE0,tlo:0xE1,thi:0xE2,clo:0xE3,chi:0xE4,
  streamLo:0xE5,streamHi:0xE6,tileLo:0xE7,tileHi:0xE8,
  bmpLo:0xE9,bmpHi:0xEA,cellLo:0xEB,cellHi:0xEC,
  scrLo:0xED,scrHi:0xEE,colLo:0xEF,colHi:0xF0};
var stats={last:null,error:null,exportCount:0};
if(!window.RICO_TEST282_BITMAP || !window.RICO_TEST279_BITMAP) {
  console.warn(TAG,'requires TEST282 and TEST279');return;
}
function edNow(){return window.g_app&&window.g_app.textModeEditor;}
function layerOf(ed){try{return ed.layers.getSelectedLayerObject();}catch(e){return null;}}
function active(ed){return !!(ed&&window.RICO_TEST282_BITMAP.active());}
function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
function lcm(a,b){return (a/gcd(a,b))*b;}
function pixels8(pixels){
  var a=new Uint8Array(8);
  if(!pixels || pixels.length<64)throw new Error('Patrón 8×8 inexistente.');
  for(var y=0;y<8;y++){
    var b=0;
    for(var q=0;q<4;q++){
      var k=y*8+q*2,code=(pixels[k]?2:0)|(pixels[k+1]?1:0);
      b|=code<<(6-2*q);
    }
    a[y]=b;
  }
  return a;
}
function snapshot(){
  var ed=edNow(),l=layerOf(ed);
  if(!active(ed)||!l)throw new Error('Activá Bitmap Multicolor para exportar TEST283.');
  var ts=l.getTileSet&&l.getTileSet();
  if(!ts||!ts.getData||ts.getTileWidth()!==8||ts.getTileHeight()!==8)
    throw new Error('TEST283 requiere tiles de 8x8.');
  var n=ed.graphic&&ed.graphic.getFrameCount?ed.graphic.getFrameCount():l.frames.length;
  n=Math.min(n,l.frames.length);
  if(n<1||n>255)throw new Error('TEST283 admite de 1 a 255 frames.');
  var dims=[l.getGridWidth(),l.getGridHeight()];
  if(dims[0]<1||dims[1]<1)throw new Error('Mapa sin dimensiones.');
  var tiles=ts.tileData||[],current=ts.getData();
  var ids={},frames=[],duration=[],total=0;
  for(var f=0;f<n;f++){
    var frm=l.frames[f],pal=window.RICO_TEST279_BITMAP.seed(frm,l);
    if(!frm||!frm.data||!pal)throw new Error('Frame '+(f+1)+' sin celdas.');
    var tid=new Uint8Array(1000),ink=new Uint16Array(1000);
    for(var y=0;y<25;y++)for(var x=0;x<40;x++){
      var cell=y<dims[1]&&x<dims[0]&&frm.data[y]?frm.data[y][x]:null;
      var id=cell&&Number.isInteger(cell.t)?cell.t:0;
      if(id<0||id>255||!Number.isInteger(id))
        throw new Error('La frame '+(f+1)+' usa tile '+id+' fuera del rango 0..255.');
      if(!tiles[id]&&!current[id])throw new Error('Tile '+id+' no existe en el tileset.');
      var pos=y*40+x;
      tid[pos]=id;
      if(cell)ink[pos]=(pal[y*dims[0]+x]||0)&4095;
      else ink[pos]=0;
      ids[id]=true;
    }
    var bg=l.getBackgroundColor(f)&15;
    frames.push({tiles:tid,inks:ink,bg:bg});
    var d=ed.graphic&&ed.graphic.getFrameDuration?Number(ed.graphic.getFrameDuration(f)):1;
    if(!Number.isFinite(d)||d<1)d=1;
    d=Math.min(1024,Math.round(d));
    duration.push(d);total+=d;
  }
  var animated={},patterns={},period=total;
  for(var key in ids){
    var k=Number(key),entry=tiles[k],props=entry&&entry.props||{};
    var type=props.animated;
    if(type&&type!==false&&type!=='none'){
      if(type!=='frames')
        throw new Error('TEST283: animación de tile '+k+' tipo '+type+
          ' aún no implementada; usá Frames o desactivala para esta prueba.');
      var variants=entry.data||[];
      var count=Math.min(Number(props.frameCount)||variants.length,variants.length);
      var ticks=Number(props.ticksPerFrame);
      if(!Number.isInteger(ticks)||ticks<1||!Number.isInteger(count)||count<2)
        throw new Error('Animación Frames incompleta en tile '+k+'.');
      var cycle=count*ticks;
      period=lcm(period,cycle);
      if(period>4096)throw new Error('Ciclo combinado de frames/tiles supera 4096 ticks. Reducí duraciones para TEST283.');
      animated[k]={frames:count,ticks:ticks,variants:variants};
    }
    patterns[k]=entry&&entry.data&&entry.data[0]||current[k];
  }
  var boundaries=[0],phaseTime=0;
  for(var t=1;t<period;t++){
    var frameBoundary=false,at=t%total,elapsed=0;
    for(var j=0;j<duration.length;j++){
      elapsed+=duration[j];
      if(at===elapsed%total)frameBoundary=true;
    }
    var animationBoundary=false;
    for(var name in animated){
      if(t%animated[name].ticks===0){animationBoundary=true;break;}
    }
    if(frameBoundary||animationBoundary)boundaries.push(t);
  }
  if(boundaries.length>255)
    throw new Error('TEST283: hay '+boundaries.length+' cambios por ciclo; máximo experimental 255.');
  var bank=[],lookup={},states=[];
  function patternPointer(id,phase){
    var k=id+':'+phase;
    if(lookup[k]!==undefined)return lookup[k];
    var ani=animated[id],pix=ani?ani.variants[phase]:patterns[id];
    var pointer=ATLAS+bank.length;
    if(pointer+8>=LIMIT)throw new Error('Atlas excede memoria disponible.');
    var chunk=pixels8(pix);
    for(var i=0;i<8;i++)bank.push(chunk[i]);
    lookup[k]=pointer;return pointer;
  }
  for(var e=0;e<boundaries.length;e++){
    var time=boundaries[e],clock=time%total,frameIndex=0,acc=0;
    while(frameIndex<duration.length-1 && clock>=acc+duration[frameIndex]){
      acc+=duration[frameIndex];frameIndex++;
    }
    var frame=frames[frameIndex],ptr=new Uint16Array(1000);
    for(var c=0;c<1000;c++){
      var id=frame.tiles[c],ani=animated[id];
      var phase=ani?Math.floor(time/ani.ticks)%ani.frames:0;
      ptr[c]=patternPointer(id,phase);
    }
    var next=e+1<boundaries.length?boundaries[e+1]:period;
    states.push({at:time,docFrame:frameIndex,bg:frame.bg,
      pointers:ptr,inks:frame.inks,duration:next-time});
  }
  // Stage:
  // $1000 8000 raw bitmap frame0; $2F40 screen colors; $3328 Color RAM
  // $3800 atlas (8 bytes/pattern) shared among frames; then sparse streams.
  var initial=states[0],bitmap=new Uint8Array(8000),
      screen=new Uint8Array(1000),colors=new Uint8Array(1000);
  for(var c=0;c<1000;c++){
    var index=(initial.pointers[c]-ATLAS);
    for(var row=0;row<8;row++)bitmap[c*8+row]=bank[index+row];
    var ink=initial.inks[c];screen[c]=((ink&15)<<4)|((ink>>4)&15);
    colors[c]=(ink>>8)&15;
  }
  var atlasData=new Uint8Array(bank),streams=[],maxDirty=0,dirtyTotal=0;
  for(var i=0;i<states.length;i++){
    var to=states[i],prev=states[(i+states.length-1)%states.length];
    var list=[],change=0;
    for(var cell=0;cell<1000;cell++){
      if(to.pointers[cell]===prev.pointers[cell]&&to.inks[cell]===prev.inks[cell])continue;
      var p=to.pointers[cell],ink=to.inks[cell];
      list.push(cell&255,cell>>8,p&255,p>>8,((ink&15)<<4)|((ink>>4)&15),(ink>>8)&15);
      change++;
    }
    // Header: duration uint16, bg uint8, record count uint16.
    var records=[to.duration&255,to.duration>>8,to.bg,change&255,change>>8].concat(list);
    streams.push(new Uint8Array(records));
    if(change>maxDirty)maxDirty=change;
    dirtyTotal+=change;
  }
  var streamAddresses=[],addr=ATLAS+atlasData.length;
  for(var i=0;i<streams.length;i++){
    streamAddresses.push(addr);addr+=streams[i].length;
  }
  if(addr>LIMIT)
    throw new Error('Bitmap frames requieren '+(addr-ATLAS)+' bytes de atlas y cambios; '+
      'espacio máximo '+(LIMIT-ATLAS)+'. Probá menos diferencias o frames.');
  return {bitmap:bitmap,screen:screen,colors:colors,atlas:atlasData,
    streams:streams,pointers:streamAddresses,states:states,stepCount:states.length,
    frameCount:n,tileCount:Object.keys(ids).length,variantCount:bank.length/8,
    totalTicks:period,durations:duration,bg:states[0].bg,sourceMap:dims.join('×'),
    maxDirty:maxDirty,totalDirty:dirtyTotal,end:addr,animatedTiles:Object.keys(animated).length};
}
function assembler(model){
  var a=[],symbols={},patches=[];
  function loc(){return ENTRY+a.length;}
  function b(v){a.push(v&255);}
  function w(v){b(v);b(v>>8);}
  function tag(n){if(symbols[n]!==undefined)throw new Error('Duplicado ASM '+n);symbols[n]=loc();}
  function imm(op,v){b(op);b(v);}
  function zp(op,z){b(op);b(z);}
  function abs(op,addr){b(op);w(addr);}
  function ref(op,name){b(op);patches.push({i:a.length,n:name,t:'abs'});w(0);}
  function branch(op,name){b(op);patches.push({i:a.length,n:name,t:'rel'});b(0);}
  function copy(src,dst,count,key){
    imm(0xA9,src&255);zp(0x85,0xFB);
    imm(0xA9,src>>8);zp(0x85,0xFC);
    imm(0xA9,dst&255);zp(0x85,0xFD);
    imm(0xA9,dst>>8);zp(0x85,0xFE);
    var pages=count>>8,rem=count&255;
    if(pages){imm(0xA2,pages);ref(0x20,'copyPages');}
    if(rem){
      imm(0xA0,0);tag('tail'+key);
      zp(0xB1,0xFB);zp(0x91,0xFD);b(0xC8);imm(0xC0,rem);
      branch(0xD0,'tail'+key);
    }
  }
  // Boot: static reference frame, then sparse player.
  b(0x78);imm(0xA9,0x0B);abs(0x8D,0xD011);
  copy(B0,0x6000,8000,'bmp');
  copy(S0,0x5C00,1000,'scr');
  copy(C0,0xD800,1000,'col');
  abs(0xAD,0xDD02);imm(0x09,3);abs(0x8D,0xDD02);
  abs(0xAD,0xDD00);imm(0x29,0xFC);imm(0x09,2);abs(0x8D,0xDD00);
  imm(0xA9,0);abs(0x8D,0xD015);
  imm(0xA9,0x78);abs(0x8D,0xD018);
  imm(0xA9,model.bg);abs(0x8D,0xD020);abs(0x8D,0xD021);
  imm(0xA9,0x18);abs(0x8D,0xD016);
  imm(0xA9,0x3B);abs(0x8D,0xD011);
  imm(0xA9,0);zp(0x85,Z.idx);
  imm(0xA9,model.states[0].duration&255);zp(0x85,Z.tlo);
  imm(0xA9,model.states[0].duration>>8);zp(0x85,Z.thi);
  // Wait for a complete raster tick. This is a PAL/NTSC frame,
  // NOT a proven worst-case 1-tick update budget.
  tag('tick');
  tag('rasterWait');abs(0xAD,0xD012);imm(0xC9,0xFA);branch(0xD0,'rasterWait');
  tag('rasterLeave');abs(0xAD,0xD012);imm(0xC9,0xFA);branch(0xF0,'rasterLeave');
  zp(0xA5,Z.tlo);branch(0xD0,'decrementLo');
  zp(0xC6,Z.thi);
  tag('decrementLo');zp(0xC6,Z.tlo);
  zp(0xA5,Z.tlo);zp(0x05,Z.thi);
  branch(0xF0,'advance');ref(0x4C,'tick');
  tag('advance');
  zp(0xE6,Z.idx);
  zp(0xA5,Z.idx);imm(0xC9,model.stepCount);
  branch(0xD0,'chooseStep');
  imm(0xA9,0);zp(0x85,Z.idx);
  tag('chooseStep');
  zp(0xA6,Z.idx);
  ref(0xBD,'ptrLow');zp(0x85,Z.streamLo);
  ref(0xBD,'ptrHigh');zp(0x85,Z.streamHi);
  imm(0xA0,0);
  zp(0xB1,Z.streamLo);zp(0x85,Z.tlo);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.thi);
  b(0xC8);zp(0xB1,Z.streamLo);abs(0x8D,0xD021);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.clo);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.chi);
  // pointer += 5
  b(0x18);zp(0xA5,Z.streamLo);imm(0x69,5);zp(0x85,Z.streamLo);
  branch(0x90,'pointerReady');zp(0xE6,Z.streamHi);
  tag('pointerReady');
  zp(0xA5,Z.clo);zp(0x05,Z.chi);branch(0xD0,'recordLoop');
  ref(0x4C,'tick');
  tag('recordLoop');
  imm(0xA0,0);
  zp(0xB1,Z.streamLo);zp(0x85,Z.cellLo);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.cellHi);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.tileLo);
  b(0xC8);zp(0xB1,Z.streamLo);zp(0x85,Z.tileHi);
  // Bitmap destination = $6000 + cellIndex * 8
  zp(0xA5,Z.cellLo);b(0x0A);zp(0x85,Z.bmpLo);
  zp(0xA5,Z.cellHi);b(0x2A);zp(0x85,Z.bmpHi);
  zp(0x06,Z.bmpLo);zp(0x26,Z.bmpHi);
  zp(0x06,Z.bmpLo);zp(0x26,Z.bmpHi);
  zp(0xA5,Z.bmpHi);b(0x18);imm(0x69,0x60);zp(0x85,Z.bmpHi);
  zp(0xA5,Z.cellLo);zp(0x85,Z.scrLo);zp(0x85,Z.colLo);
  zp(0xA5,Z.cellHi);b(0x18);imm(0x69,0x5C);zp(0x85,Z.scrHi);
  zp(0xA5,Z.cellHi);b(0x18);imm(0x69,0xD8);zp(0x85,Z.colHi);
  imm(0xA0,4);zp(0xB1,Z.streamLo);imm(0xA0,0);zp(0x91,Z.scrLo);
  imm(0xA0,5);zp(0xB1,Z.streamLo);imm(0xA0,0);zp(0x91,Z.colLo);
  imm(0xA0,7);tag('copyTile');
  zp(0xB1,Z.tileLo);zp(0x91,Z.bmpLo);
  b(0x88);branch(0x10,'copyTile'); // DEY / BPL
  b(0x18);zp(0xA5,Z.streamLo);imm(0x69,6);zp(0x85,Z.streamLo);
  branch(0x90,'nextRecord');zp(0xE6,Z.streamHi);
  tag('nextRecord');
  zp(0xA5,Z.clo);branch(0xD0,'countLow');zp(0xC6,Z.chi);
  tag('countLow');zp(0xC6,Z.clo);
  zp(0xA5,Z.clo);zp(0x05,Z.chi);branch(0xF0,'finishedStep');
  ref(0x4C,'recordLoop');
  tag('finishedStep');ref(0x4C,'tick');
  tag('copyPages');
  imm(0xA0,0);tag('copyPage');
  zp(0xB1,0xFB);zp(0x91,0xFD);b(0xC8);branch(0xD0,'copyPage');
  zp(0xE6,0xFC);zp(0xE6,0xFE);b(0xCA);branch(0xD0,'copyPage');b(0x60);
  tag('ptrLow');for(var i=0;i<model.pointers.length;i++)b(model.pointers[i]&255);
  tag('ptrHigh');for(var i=0;i<model.pointers.length;i++)b(model.pointers[i]>>8);
  for(var i=0;i<patches.length;i++){
    var p=patches[i],target=symbols[p.n];
    if(target===undefined)throw new Error('Assembler label '+p.n+' missing');
    if(p.t==='abs'){a[p.i]=target&255;a[p.i+1]=(target>>8)&255;}
    else{var diff=target-(ENTRY+p.i+1);if(diff< -128||diff>127)
      throw new Error('Assembler branch range '+p.n+': '+diff);
      a[p.i]=diff&255;}
  }
  if(ENTRY+a.length>=BASE)throw new Error('Runtime ASM se superpone con bitmap payload.');
  return new Uint8Array(a);
}
function build(model){
  var asm=assembler(model);
  var result=new Uint8Array(2+model.end-ORIGIN),offset=function(address){return 2+address-ORIGIN;};
  result[0]=ORIGIN&255;result[1]=ORIGIN>>8;
  result.set([0x0B,0x08,0x0A,0x00,0x9E,0x32,0x30,0x36,0x34,0,0,0],offset(ORIGIN));
  result.set(asm,offset(ENTRY));
  result.set(model.bitmap,offset(B0));result.set(model.screen,offset(S0));
  result.set(model.colors,offset(C0));result.set(model.atlas,offset(ATLAS));
  for(var i=0;i<model.pointers.length;i++)
    result.set(model.streams[i],offset(model.pointers[i]));
  return result;
}
function downloadPRG(bytes,filename){
  if(typeof window.download==='function')return window.download(bytes,filename,'application/prg');
  var obj=new Blob([bytes],{type:'application/octet-stream'}),url=URL.createObjectURL(obj),
    link=document.createElement('a');link.download=filename;link.href=url;
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function status(message){
  var target=document.getElementById('rico283Status');
  if(target)target.textContent=message;
}
function exportPRG(opts){
  try{
    var model=snapshot(),bytes=build(model);
    var summary={status:'GENERATED — PENDING VICE',bytes:bytes.length,
      frames:model.frameCount,steps:model.stepCount,ticksCycle:model.totalTicks,
      usedTiles:model.tileCount,atlasVariants:model.variantCount,
      animatedTiles:model.animatedTiles,maxDirtyPerStep:model.maxDirty,
      sparseCellUpdates:model.totalDirty,load:0x0801,end:model.end};
    stats.last=summary;stats.error=null;
    window.RICO_TEST283_LAST_EXPORT=summary;
    if(opts&&opts.download===false)return {bytes:bytes,summary:summary,model:model};
    downloadPRG(bytes,'RICO_TEST283_BITMAP_MC_FRAMES.prg');
    stats.exportCount++;
    status('PRG '+bytes.length+' bytes · '+model.stepCount+' pasos · máx. '+model.maxDirty+
      ' celdas/cambio'+(model.maxDirty>64?' · posible pérdida de velocidad por carga':''));
    console.log(TAG,summary);
    return bytes;
  }catch(e){
    stats.error=String(e&&e.message||e);console.error(TAG,e);
    status('ERROR: '+stats.error);
    if(!(opts&&opts.silent)&&window.alert)window.alert('TEST283: '+stats.error);
    return false;
  }
}
function mount(){
  var bar=document.getElementById('rico280InkBar');
  if(!bar)return false;
  if(!document.getElementById('rico283Export')){
    var holder=document.createElement('div');holder.id='rico283Holder';
    holder.style.cssText='margin-top:6px;border-top:1px solid #476079;padding-top:6px;';
    var button=document.createElement('button');button.id='rico283Export';button.type='button';
    button.textContent='Exportar Bitmap MC ANIMADO .PRG';
    button.style.cssText='font:bold 11px Arial;background:#425c97;color:white;border:1px solid #87a9dd;cursor:pointer;padding:5px;';
    button.addEventListener('click',function(e){e.preventDefault();exportPRG();});
    holder.appendChild(button);
    var line=document.createElement('div');line.id='rico283Status';
    line.style.cssText='font:10px Arial;margin-top:4px;color:#c5d9fb;';
    line.textContent='TEST283: Frames + tiles animados tipo Frames (sin scroll)';
    holder.appendChild(line);bar.appendChild(holder);
  }
  document.getElementById('rico283Holder').style.display=active(edNow())?'block':'none';
  return true;
}
if(typeof Editor!=='undefined'&&Editor.prototype&&!Editor.prototype.__rico283Menu) {
  var baseMenu=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(id){
    if(id==='export-prg'&&active(this.textModeEditor))return exportPRG();
    return baseMenu.apply(this,arguments);
  };
  Editor.prototype.__rico283Menu=true;
}
if(typeof TextModeEditor!=='undefined'&&TextModeEditor.prototype) {
  var baseSet=TextModeEditor.prototype.setScreenMode;
  TextModeEditor.prototype.setScreenMode=function(){
    var out=baseSet.apply(this,arguments);window.setTimeout(mount,0);return out;
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
if(window.UI&&UI.on)UI.on('ready',mount);
window.RICO_TEST283_BITMAP={
  version:'TEST283',snapshot:snapshot,assembler:assembler,build:build,
  exportPRG:exportPRG,state:stats,mount:mount
};
console.log(TAG,'bitmap sparse-frame / tile-frames 6502 exporter ready');
})();