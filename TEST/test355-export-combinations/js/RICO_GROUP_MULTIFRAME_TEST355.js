/* TEST355 isolated: Group Animate + multiple frames (no Map Scroll).
 * Keeps TEST247 unchanged. Shares identical screens; distinct screens use
 * IRQ-swapped double-buffered character screens and 16-bit frame timing.
 * Never silently discard a frame or an incompatible effect.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST247_STANDALONE)return;
var prior=ToPRGAdv.prototype.createPRG,stand=window.RICO_TEST247_STANDALONE;
var status={version:355,last:'READY',lastError:null,lastPlan:null,route:null};
function hx(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function addr(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function emitBytes(dst,a){for(var i=0;i<a.length;i+=16){dst.push('!byte '+a.slice(i,i+16).map(hx).join(','));}}
function frameRect(fr){return fr&&fr.ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};}
function frameInfo(layer,g,index){
 var f=g.frames[index],r=frameRect(f),w=g.getGridWidth(),h=g.getGridHeight();
 if(r.width!==40||r.height!==25||!Number.isInteger(r.x)||!Number.isInteger(r.y)||
    r.x<0||r.y<0||r.x+40>w||r.y+25>h)throw Error('TEST355: frame '+(index+1)+' Window 40x25 fuera del mapa.');
 var grid=layer.getFrameData&&layer.getFrameData(index);
 var map=[],cols=[],bgs=[];
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var c=layer.getCell({x:r.x+x,y:r.y+y,frame:index});
  if(!c)throw Error('TEST355: celda '+x+','+y+' ausente en frame '+(index+1));
  map.push((Number(c.t)||0)&255);cols.push((Number(c.fc)||0)&15);
  if(c.bc!==undefined&&c.bc!==null&&Number(c.bc)>=0)bgs.push(Number(c.bc)&15);
 }
 if(bgs.length)throw Error('TEST355: frame '+(index+1)+' usa fondos por celda; exportador Text no puede representar ECM sin remapeo.');
 var duration=Number(f.duration);
 if(!Number.isInteger(duration)||duration<1||duration>65535)throw Error('TEST355: duración fuera de rango en frame '+(index+1));
 return{map:map,colors:cols,bg:(Number(grid&&grid.bgColor!==undefined?grid.bgColor:layer.getBackgroundColor(index))||0)&15,
 border:(Number(grid&&grid.borderColor!==undefined?grid.borderColor:layer.getBorderColor(index))||0)&15,
 bank:Number(f.charsetBank)===2?2:1,duration:duration,window:r};
}
function same(a,b){if(a.bank!==b.bank||a.bg!==b.bg||a.border!==b.border)return false;
 for(var i=0;i<1000;i++)if(a.map[i]!==b.map[i]||a.colors[i]!==b.colors[i])return false;return true;}
function singleProxy(self){
 var e=Object.create(self.editor),g=Object.create(e.graphic);
 g.frames=[e.graphic.frames[0]];e.graphic=g;
 return{editor:e};
}
function buildBase(self,dynamic){
 var keys=['RICO_TEST247_SCROLL_REMAP','RICO_TEST246_SCREEN_REMAP','RICO_TEST245_DEMO_SPEED'],old={};
 // Only dynamic frame transitions use this generic standalone generator.
 // Temporarily bypass precomputed static-screen optimizers; fully restore.
 if(dynamic)keys.forEach(function(k){old[k]=window[k];window[k]=null;});
 try{return stand.build(singleProxy(self));}
 finally{if(dynamic)keys.forEach(function(k){window[k]=old[k];});}
}
function ensureText(layer){
 var m=layer.getScreenMode&&layer.getScreenMode();
 if(m!=='textmode'&&m!=='standard'&&m!=='text')
  throw Error('TEST355: modo '+m+' necesita compositor de color independiente, no se exporta como Text.');
}
function collect(self,args){
 var ed=self&&self.editor,gr=ed&&ed.graphic,fs=gr&&gr.frames||[];
 if(!gr||fs.length<2||!stand.isStandalone(self))return null;
 var layer=ed.layers.getSelectedLayerObject(),ts=layer.getTileSet();
 ensureText(layer);
 if(ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw Error('TEST355: charset debe ser 8x8.');
 if(args&&(args.sidData||args.music==='yes'||args.music==='sid'))
  throw Error('TEST355: Group + multiframe + SID requiere scheduler musical compartido; sin música para esta prueba.');
 var sound=window.RICO_TEST207_ORIGINAL_SID&&window.RICO_TEST207_ORIGINAL_SID.getState&&window.RICO_TEST207_ORIGINAL_SID.getState();
 if(sound&&sound.enabled)throw Error('TEST355: el SID sigue activo; desactivalo solo para esta prueba.');
 var list=fs.map(function(f,i){return frameInfo(layer,gr,i);});
 if(list.some(function(f){return f.bank!==list[0].bank}))
  throw Error('TEST355: cambio BANK1/BANK2 entre frames necesita composición con Group, no se omiten bancos.');
 var identical=list.every(function(f){return same(f,list[0]);});
 // At most 11 extra uncompressed 2-KiB frame banks before Group ASM at $A000.
 if(!identical&&0x4800+(list.length-1)*0x800>0xa000)
  throw Error('TEST355: RAM llena para '+list.length+' frames diferentes. Hace falta compresión, no se eliminarán frames.');
 return{frames:list,identical:identical,bank:list[0].bank};
}
function copyCode(count){
 // Zero page $E0-$E7 is reserved by this group-only, no-SID TEST.
 return [
 'frame_stage355',
 ' lda frame_request355',' bne frame_try355',' rts',
 'frame_try355',' lda frame_ready355',' beq frame_go355',' rts',
 'frame_go355',' ldx frame_next355',
 ' lda frame_map_lo355,x',' sta $e0',
 ' lda frame_map_hi355,x',' sta $e1',
 ' lda frame_col_lo355,x',' sta $e2',
 ' lda frame_col_hi355,x',' sta $e3',
 ' lda #$00',' sta $e4',' sta $e6',
 ' lda #$d8',' sta $e7',
 ' lda frame_front355',' beq frame_dest0800_355',
 ' lda #$04',' bne frame_destset355',
 'frame_dest0800_355',' lda #$08',
 'frame_destset355',' sta $e5',
 ' ldx #$04',
 'frame_copy_page355',' ldy #$00',
 'frame_copy_screen355',' lda ($e0),y',' sta ($e4),y',
 ' iny',' bne frame_copy_screen355',
 ' inc $e1',' inc $e5',
 ' dex',' bne frame_copy_page355',
 // Color RAM has no double buffering. Stage it in the main loop before
 // the raster-swapped screen; tiny color transitions may be visible.
 ' ldx #$04','frame_color_page355',' ldy #$00',
 'frame_copy_color355',' lda ($e2),y',' sta ($e6),y',
 ' iny',' bne frame_copy_color355',
 ' inc $e3',' inc $e7',' dex',' bne frame_color_page355',
 ' lda #$01',' sta frame_ready355',' rts',
 'frame_irq355',
 ' lda frame_request355',' bne frame_commit_check355',
 ' inc frame_tick_lo355',' bne frame_tick_check355',
 ' inc frame_tick_hi355',
 'frame_tick_check355',' ldx frame_index355',
 ' lda frame_tick_hi355',' cmp frame_dur_hi355,x',
 ' beq frame_tick_high_ok355',' rts',
 'frame_tick_high_ok355',
 ' lda frame_tick_lo355',' cmp frame_dur_lo355,x',
 ' beq frame_advance355',' rts',
 'frame_advance355',' inx',' cpx #'+hx(count),
 ' bcc frame_index_ok355',' ldx #$00',
 'frame_index_ok355',' stx frame_next355',
 ' lda #$01',' sta frame_request355',' rts',
 'frame_commit_check355',' lda frame_ready355',
 ' bne frame_commit355',' rts',
 'frame_commit355',
 ' lda frame_front355',' eor #$01',' sta frame_front355',
 ' beq frame_screen0400_355',
 ' lda #$20',' bne frame_screen_set355',
 'frame_screen0400_355',' lda #$10',
 'frame_screen_set355',' sta frame_screen_nibble355',
 ' lda $d018',' and #$0f',' ora frame_screen_nibble355',' sta $d018',
 ' ldx frame_next355',' stx frame_index355',
 ' lda frame_bg355,x',' sta $d021',
 ' lda frame_border355,x',' sta $d020',
 ' lda #$00',' sta frame_request355',' sta frame_ready355',
 ' sta frame_tick_lo355',' sta frame_tick_hi355',' rts',
 'frame_index355','!byte $00',
 'frame_next355','!byte $00',
 'frame_request355','!byte $00',
 'frame_ready355','!byte $00',
 'frame_front355','!byte $00',
 'frame_screen_nibble355','!byte $10',
 'frame_tick_lo355','!byte $00',
 'frame_tick_hi355','!byte $00'
 ].join('\n')+'\n';
}
function build(self,plan){
 var source=buildBase(self,!plan.identical),fs=plan.frames;
 if(plan.identical)return source;
 if(!source.includes('main240\n')||!source.includes('irq240\n')||!source.includes('*=$3000\ncharset_bank1'))
  throw Error('TEST355: el motor Group original cambió etiquetas; no se genera PRG truncado.');
 var sep=source.indexOf('*=$3000\ncharset_bank1');
 var core=source.slice(0,sep),tail=source.slice(sep);
 var main='main240\n';
 if(core.split(main).length!==2)throw Error('TEST355: main240 ambiguo');
 core=core.replace(main,main+' jsr frame_stage355\n');
 var irqEnd=' pla\n tay\n pla\n tax\n pla\n rti';
 if(core.split(irqEnd).length!==2)throw Error('TEST355: irq240 ambiguo');
 core=core.replace(irqEnd,' jsr frame_irq355\n'+irqEnd);
 // TEST246 atomic ping-pong font flips must preserve the selected screen.
 var fontSwap=' lda group240_front\n eor #$02\n sta group240_front\n sta $d018';
 if(core.includes(fontSwap)){
  core=core.replace(fontSwap,' lda group240_front\n eor #$02\n sta group240_front\n and #$0f\n ora frame_screen_nibble355\n sta $d018');
 }else if(/group240_swap_request/.test(core))throw Error('TEST355: ancla de Bank flip Group no reconocida.');
 var data=['frame_map_lo355','!byte '+fs.map(function(f,i){return hx(i===0?0x00:(0x4800+(i-1)*0x800)&255);}).join(','),
  'frame_map_hi355','!byte '+fs.map(function(f,i){return hx(i===0?0x40:(0x4800+(i-1)*0x800)>>8);}).join(','),
  'frame_col_lo355','!byte '+fs.map(function(f,i){return hx(i===0?0x00:(0x4c00+(i-1)*0x800)&255);}).join(','),
  'frame_col_hi355','!byte '+fs.map(function(f,i){return hx(i===0?0x44:(0x4c00+(i-1)*0x800)>>8);}).join(','),
  'frame_dur_lo355','!byte '+fs.map(function(f){return hx(f.duration);}).join(','),
  'frame_dur_hi355','!byte '+fs.map(function(f){return hx(f.duration>>8);}).join(','),
  'frame_bg355','!byte '+fs.map(function(f){return hx(f.bg);}).join(','),
  'frame_border355','!byte '+fs.map(function(f){return hx(f.border);}).join(',')
 ];
 var framesData=[];
 for(var n=1;n<fs.length;n++){
  var at=0x4800+(n-1)*0x800,f=fs[n],m=f.map.concat(Array(24).fill(0)),cols=f.colors.concat(Array(24).fill(0));
  framesData.push('*='+addr(at),'frame_map355_'+n);emitBytes(framesData,m);
  framesData.push('*='+addr(at+0x400),'frame_col355_'+n);emitBytes(framesData,cols);
 }
 // Source builder can use further resources at $A000+; frame banks end before.
 return core+copyCode(fs.length)+data.join('\n')+'\n'+tail+'\n'+framesData.join('\n')+'\n';
}
function assemble(asm){
 var a=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
 if(!a||!a.assemble)throw Error('TEST355: ensamblador LVLLVL no disponible');
 var r=a.assemble(asm,0x0801);
 if(!r||!r.success)throw Error('TEST355 ASM: '+(r&&r.errors||[]).map(function(e){return e.message||String(e);}).join(' | '));
 var mem=a.getMemory(),prg=new Uint8Array(2+r.end-r.start);
 prg[0]=r.start&255;prg[1]=(r.start>>8)&255;
 for(var q=r.start;q<r.end;q++)prg[q-r.start+2]=mem[q]&255;
 return prg;
}
ToPRGAdv.prototype.createPRG=function(args){
 var frames=this.editor&&this.editor.graphic&&this.editor.graphic.frames||[];
 if(frames.length<2||!stand.isStandalone(this))return prior.apply(this,arguments);
 try{
  var p=collect(this,args||{});
  if(!p)return prior.apply(this,arguments);
  status.last='BUILDING';status.lastError=null;status.route=p.identical?'SHARED FRAMES':'DOUBLE SCREEN';
  var asm=build(this,p),prg=assemble(asm);
  this.prg=prg;
  status.last='ASSEMBLED';status.lastPlan={frames:p.frames.length,
   route:status.route,byteLength:prg.length,bank:p.bank,
   durations:p.frames.map(function(f){return f.duration;})};
  if(args&&args.download===false)return prg;
  var filename=args&&args.filename||'GROUP_MULTIFRAME_TEST355.prg';
  if(!/\.prg$/i.test(filename))filename+='.prg';
  if(typeof window.download!=='function')throw Error('TEST355: download() no disponible');
  window.download(prg,filename,'application/prg');
  return prg;
 }catch(e){
  status.last='ERROR';status.lastError=String(e&&e.message||e);
  console.error('[TEST355 Group multiframe]',e);
  if(typeof window.alert==='function')window.alert('TEST355: '+status.lastError);
  return false;
 }
};
window.RICO_TEST355_GROUP_MULTIFRAME={state:status,collect:collect,build:build,version:355};
console.log('[TEST355] Group-only multiframe 1..N: unchanged shared frames, changed screens via VIC double buffer.');
})();
