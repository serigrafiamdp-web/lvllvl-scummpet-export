/* TEST383 — isolated, self-contained C64 40x25 cardinal Map Scroll.
 * Targets ONLY one-frame, unanimated standard text Up/Down with full-size
 * Window + Scroll Area. Does not replace any Group, SID, ECM, multi-frame,
 * bitmap, large-map or horizontal exporter.
 * No frame-duration clock and no dependency on TEST77's color patch queue.
 * PAL raster polling controls steps, 40x25 character/color rows wrap in RAM.
 * Execution in VICE requires user confirmation. */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined')return;
var previous=ToPRGAdv.prototype.createPRG;
var state={version:383,last:'READY',lastRoute:null,lastError:null};
function num(x,d){x=Number(x);return Number.isFinite(x)?x:d;}
function byte(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function word(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function putData(out,label,bytes){out.push(label);for(var i=0;i<bytes.length;i+=16)out.push('!byte '+Array.from(bytes.slice(i,i+16)).map(byte).join(','));}
function rect(r){return r&&r.x===0&&r.y===0&&r.width===40&&r.height===25;}
function isAnim(ts){
 var rec=ts.getDocRecord&&ts.getDocRecord(),store=rec&&rec.data||{};
 var cfg=store.ricoGroupAnimationsV1||{};
 if([1,2].some(function(n){return (cfg['bank'+n]||[]).some(function(g){return g&&g.type;});}))return true;
 var b2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
 return [ts.tileData,b2].some(function(bank){return bank&&bank.some(function(t){
  var a=t&&t.props&&t.props.animated;return a&&a!=='none';
 });});
}
function sidActive(args){
 if(args&&(args.sidData||args.music==='sid'||args.music==='yes'))return true;
 var s=window.RICO_TEST207_ORIGINAL_SID;
 return !!(s&&s.getState&&s.getState()&&s.getState().enabled);
}
function candidate(self,args){
 var ed=self&&self.editor,gr=ed&&ed.graphic,fs=gr&&gr.frames;
 if(!fs||fs.length!==1||!ed.layers)return false;
 var cfg=fs[0].ricoMapScrollV1||{};
 if(cfg.type!=='up'&&cfg.type!=='down')return false;
 var layer=ed.layers.getSelectedLayerObject();
 if(!layer||layer.getType&&layer.getType()!=='grid')return false;
 var m=layer.getScreenMode&&layer.getScreenMode();
 if(m!=='textmode'&&m!=='text'&&m!=='standard')return false;
 var ts=layer.getTileSet&&layer.getTileSet();
 if(!ts||ts.getTileWidth()!==8||ts.getTileHeight()!==8||isAnim(ts)||sidActive(args))return false;
 if(gr.getGridWidth()!==40||gr.getGridHeight()!==25)return false;
 var wc=window.RICO_TEST75_WINDOW_DIMENSION;
 var win=wc&&wc.getConfig?wc.getConfig(gr,0):fs[0].ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};
 var area=wc&&wc.getScrollArea?wc.getScrollArea(gr,0):fs[0].ricoScrollAreaV1||{x:0,y:0,width:40,height:25};
 if(!rect(win)||!rect(area))return false;
 if(args&&((args.gridWidth&&num(args.gridWidth,40)!==40)||(args.gridHeight&&num(args.gridHeight,25)!==25)))return false;
 return true;
}
function getCharset(tiles,fallback){
 var a=new Uint8Array(2048);
 for(var i=0;i<256;i++){
  var t=tiles&&tiles[i]||fallback&&fallback[i],p=t&&t.data&&t.data[0];
  if(!p)continue;
  for(var y=0;y<8;y++){var b=0;for(var x=0;x<8;x++)if(p[y*8+x])b|=(128>>x);a[8*i+y]=b;}
 }
 return a;
}
function collect(self){
 var ed=self.editor,layer=ed.layers.getSelectedLayerObject(),ts=layer.getTileSet(),fr=ed.graphic.frames[0];
 var config=fr.ricoMapScrollV1,dir=config.type;
 var ticks=num(config.ticksPerStep,6),pixels=num(config.pixelsPerStep,1);
 if(!Number.isInteger(ticks)||ticks<1||ticks>255||!Number.isInteger(pixels)||pixels<1||pixels>8)
  throw Error('Ticks/Step must be 1..255 and Pixels/Step 1..8');
 var map=new Uint8Array(1024),colors=new Uint8Array(1024);
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var c=layer.getCell({x:x,y:y,frame:0})||{},i=y*40+x;
  map[i]=(num(c.t,0)&255);colors[i]=(num(c.fc,14)&15);
 }
 var bank1=getCharset(ts.tileData),store=ts.getDocRecord&&ts.getDocRecord();
 var b2=store&&store.data&&store.data.ricoCharsetBank2&&store.data.ricoCharsetBank2.tileData;
 var bank2=b2?getCharset(b2,ts.tileData):bank1;
 var allSame=colors.slice(0,1000).every(function(v){return v===colors[0];});
 var bg=num(layer.getBackgroundColor(0),0)&15,br=num(layer.getBorderColor(0),0)&15;
 return {dir:dir,ticks:ticks,pixels:pixels,bank:num(fr.charsetBank,1)===2?2:1,map:map,colors:colors,
  bank1:bank1,bank2:bank2,uniform:allSame,bg:bg,border:br};
}
function shift(out,src,dst,dir,tag){
 // Move the first 24 rows: 960 bytes, then restore the wrapped 40-byte row.
 // UP copies low-to-high; DOWN copies high-to-low to avoid self-overwrite.
 out.push(' ldx #$00',tag+'_backup');
 for(var i=0;i<2;i++){
  var base=i===0?src:(src===0x0400?0xd800:src+0x100);
  // Only the correct single plane is used; loop unrolled below separately.
 }
 var tmp=src===0x0400?0x0c00:0x0d00;
 var first=dir==='up'?src:src+0x3c0;
 out.push(' lda '+word(first)+',x',' sta '+word(tmp)+',x',
   ' inx',' cpx #$28',' bne '+tag+'_backup');
 if(dir==='up'){
  for(var block=0;block<3;block++){
   out.push(' ldx #$00',tag+'_page'+block,
    ' lda '+word(src+40+256*block)+',x',
    ' sta '+word(src+256*block)+',x',
    ' inx',' bne '+tag+'_page'+block);
  }
  out.push(' ldx #$00',tag+'_last',
   ' lda '+word(src+0x328)+',x',' sta '+word(src+0x300)+',x',
   ' inx',' cpx #$c0',' bne '+tag+'_last');
 }else{
  out.push(' ldx #$bf',tag+'_last',
    ' lda '+word(src+0x300)+',x',' sta '+word(src+0x328)+',x',
    ' dex',' cpx #$ff',' bne '+tag+'_last');
  for(var block=2;block>=0;block--){
   out.push(' ldx #$ff',tag+'_page'+block,
    ' lda '+word(src+256*block)+',x',
    ' sta '+word(src+40+256*block)+',x',
    ' dex',' cpx #$ff',' bne '+tag+'_page'+block);
  }
 }
 out.push(' ldx #$00',tag+'_restore');
 var last=dir==='up'?src+0x3c0:src;
 out.push(' lda '+word(tmp)+',x',' sta '+word(last)+',x',
   ' inx',' cpx #$28',' bne '+tag+'_restore',' rts');
}
function build(d){
 var out=[
 '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
 '*=$2000',
 'start383',' sei',' lda #$35',' sta $01',
 ' lda $dd00',' ora #$03',' sta $dd00',
 ' lda #$7f',' sta $dc0d',' sta $dd0d',
 ' lda #$00',' sta $d01a',' sta $d015',
 ' lda #'+byte(d.bg),' sta $d021',
 ' lda #'+byte(d.border),' sta $d020',
 ' lda #$08',' sta $d016',
 ' lda #'+byte(d.bank===2?0x1e:0x1c),' sta $d018',
 ' lda #'+byte(d.dir==='up'?0x1f:0x18),' sta $d011',
 ' ldx #$00',
 'init383',
 ' lda $4000,x',' sta $0400,x',
 ' lda $4100,x',' sta $0500,x',
 ' lda $4200,x',' sta $0600,x',
 ' lda $4300,x',' sta $0700,x',
 ' lda $4400,x',' sta $d800,x',
 ' lda $4500,x',' sta $d900,x',
 ' lda $4600,x',' sta $da00,x',
 ' lda $4700,x',' sta $db00,x',
 ' inx',' bne init383',
 'main383',
 ' lda $d012',' cmp #$fa',' bne main383',
 'leave383',' lda $d012',' cmp #$fa',' beq leave383',
 ' dec clock383',' bne main383',
 ' lda #'+byte(d.ticks),' sta clock383',
 ' lda #'+byte(d.pixels),' sta remain383',
 'pixels383',' jsr pixel383',' dec remain383',' bne pixels383',
 ' jmp main383',
 'pixel383',
 ' lda phase383',
 ];
 if(d.dir==='up'){
  out.push(' beq coarse383',' dec phase383',' jmp apply383',
    'coarse383',' jsr shift_chars383');
  if(!d.uniform)out.push(' jsr shift_colors383');
  out.push(' lda #$07',' sta phase383',' jmp apply383');
 }else{
  out.push(' cmp #$07',' beq coarse383',' inc phase383',' jmp apply383',
    'coarse383',' jsr shift_chars383');
  if(!d.uniform)out.push(' jsr shift_colors383');
  out.push(' lda #$00',' sta phase383',' jmp apply383');
 }
 out.push('apply383',' lda phase383',' ora #$18',' sta $d011',' rts',
  'clock383','!byte '+byte(d.ticks),
  'remain383','!byte $00',
  'phase383','!byte '+byte(d.dir==='up'?7:0),
  'shift_chars383');
 shift(out,0x0400,0x0400,d.dir,'chars383');
 if(!d.uniform){out.push('shift_colors383');shift(out,0xd800,0xd800,d.dir,'colors383');}
 out.push('end383','*=$3000');putData(out,'charset383_bank1',d.bank1);
 out.push('*=$3800');putData(out,'charset383_bank2',d.bank2);
 out.push('*=$4000');putData(out,'screen383',d.map);
 out.push('*=$4400');putData(out,'colors383',d.colors);
 return out.join('\n')+'\n';
}
function assemble(source){
 var a=window.g_app&&window.g_app.assembler;if(!a)throw Error('LVLLVL assembler unavailable');
 var r=a.assemble(source,0x0801);
 if(!r||!r.success)throw Error('TEST383 6502 assembly: '+(r&&r.errors||[]).map(function(e){return e.message||String(e);}).join(' | '));
 if(a.labels&&a.labels.end383&&a.labels.end383.value>=0x3000)throw Error('Runtime overflows charset bank 1');
 var mem=a.getMemory(),bytes=new Uint8Array(2+r.end-r.start);
 bytes[0]=r.start&255;bytes[1]=(r.start>>8)&255;
 for(var i=r.start;i<r.end;i++)bytes[i-r.start+2]=mem[i]&255;
 return bytes;
}
// When a project mixes vertical and diagonal frames, optionally export only
// the selected vertical frame for a non-destructive diagnostic. Never imply
// that the complete multi-frame export has been repaired.
function selectedVerticalProxy(self,args,index){
 var ed=self.editor,graphic=ed.graphic,layer=ed.layers.getSelectedLayerObject();
 var vGraphic=Object.create(graphic);vGraphic.frames=[graphic.frames[index]];
 vGraphic.frameCount=1;vGraphic.currentFrame=0;
 vGraphic.getCurrentFrame=function(){return 0;};
 vGraphic.getFrameCount=function(){return 1;};
 var vLayer=Object.create(layer);
 vLayer.getCell=function(p){return layer.getCell.call(layer,Object.assign({},p,{frame:index}));};
 if(typeof layer.getBackgroundColor==='function')vLayer.getBackgroundColor=function(){return layer.getBackgroundColor.call(layer,index);};
 if(typeof layer.getBorderColor==='function')vLayer.getBorderColor=function(){return layer.getBorderColor.call(layer,index);};
 var layers=Object.create(ed.layers);layers.getSelectedLayerObject=function(){return vLayer;};
 var vEditor=Object.create(ed);vEditor.graphic=vGraphic;vEditor.layers=layers;
 var original=self.editor;self.editor=vEditor;
 try{
  if(!candidate(self,args))throw Error('La frame seleccionada no cumple los requisitos para el motor vertical básico (40x25 Text, sin animaciones).');
  var d=collect(self),prg=assemble(build(d));self.prg=prg;
  state.last='ASSEMBLED_SINGLE_SELECTED_FRAME';
  state.lastRoute='TEST383 SOLO frame '+(index+1)+' '+d.dir+' '+d.pixels+'px/'+d.ticks+'t';
  if(args.download===false)return prg;
  var filename='rico-test383-frame-'+(index+1)+'-scroll-'+d.dir+'.prg';
  if(typeof window.download!=='function')throw Error('download() unavailable');
  window.download(prg,filename,'application/prg');
  return prg;
 }catch(e){
  state.last='ERROR';state.lastError=String(e.message||e);
  console.error('[RICO TEST383 single selected frame]',e);
  alert('TEST383: '+state.lastError);return false;
 }finally{self.editor=original;}
}
ToPRGAdv.prototype.createPRG=function(args){
 args=args||{};
 var ed=this&&this.editor,fs=ed&&ed.graphic&&ed.graphic.frames||[];
 // Never silently turn a vertical/diagonal mixed-frame project into a static PRG.
 if(fs.length>1){
  var types=fs.map(function(f){return f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type||'';});
  if(types.some(function(t){return t==='up'||t==='down';})&&types.some(function(t){return /^diag-/.test(t);}) ){
   state.last='UNSUPPORTED_MIXED_FRAMES';
   state.lastRoute=types.join(' + ');
   var selected=ed.graphic.getCurrentFrame?ed.graphic.getCurrentFrame():(ed.graphic.currentFrame||0);
   var direction=types[selected]||'';
   if((direction==='up'||direction==='down')&&
      typeof window.confirm==='function'&&
      window.confirm('TEST383: esta animación tiene frames verticales y diagonales. La mezcla aún no está soportada. ¿Exportar SOLO la frame vertical seleccionada ('+(selected+1)+') para comprobar Map Scroll, sin modificar tu proyecto?'))
     return selectedVerticalProxy(this,args,selected);
   alert('TEST383: el proyecto mezcla Map Scroll vertical y diagonal. Seleccioná la frame vertical y exportá para probarla individualmente, sin modificar las otras frames.');
   return false;
  }
 }
 if(!candidate(this,args))return previous.apply(this,arguments);
 try{
  state.last='BUILDING';state.lastError=null;
  var data=collect(this),source=build(data),prg=assemble(source);
  this.prg=prg;
  state.last='ASSEMBLED';state.lastRoute='TEST383 40x25 '+data.dir+' standalone, '+data.pixels+'px/'+data.ticks+'tick, '+(data.uniform?'uniform':'per-cell')+' colors';
  console.log('[RICO TEST383]',state.lastRoute);
  if(args.download===false)return prg;
  var name=args.filename||('rico-test383-map-'+data.dir+'.prg');
  if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw Error('Download function unavailable');
  window.download(prg,name,'application/prg');
  return prg;
 }catch(e){
  state.last='ERROR';state.lastError=String(e&&e.message||e);
  console.error('[RICO TEST383] Export failed',e);
  if(typeof alert==='function')alert('RICO TEST383 export error: '+state.lastError);
  return false;
 }
};
window.RICO_TEST383_MAP_SCROLL={state:state,build:build,collect:collect,candidate:candidate};
console.log('[RICO TEST383] 40x25 standalone vertical player loaded after main exporters');
})();