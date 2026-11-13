/* TEST354 — four-direction diagonal multiframe + Scroll Area narrower than Window.
 * Standalone opt-in wrapper. Reuses TEST196 native C64 builder (generic safe
 * renderer), not the accelerated constant-direction TEST221 path. Other projects
 * are delegated unchanged. No project content is modified.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST196_DIAGONAL)return;
var old=ToPRGAdv.prototype.createPRG,base=window.RICO_TEST196_DIAGONAL;
var DIR={'diag-up-left':[0,0],'diag-up-right':[1,0],
         'diag-down-right':[1,1],'diag-down-left':[0,1]};
var state={version:354,last:'READY',lastError:null,lastPlan:null};
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function byteRows(tiles){
 var result=new Uint8Array(2048);
 for(var i=0;i<256;i++){
  var pix=tiles&&tiles[i]&&tiles[i].data&&tiles[i].data[0];
  if(!pix||pix.length!==64)throw Error('TEST354: glyph '+i+' missing 8x8 pixels');
  for(var y=0;y<8;y++)for(var x=0;x<8;x++)if(pix[y*8+x])result[i*8+y]|=(128>>x);
 }
 return result;
}
function modeOK(layer){
 var m=layer&&layer.getScreenMode&&layer.getScreenMode();
 return m==='textmode'||m==='standard'||m==='text';
}
function dims(f){
 return {w:f.ricoWindowDimensionV1||{x:0,y:0,width:40,height:25},
         a:f.ricoScrollAreaV1||null,
         c:f.ricoMapScrollV1||{}};
}
function sameCell(a,b){
 if(!a||!b)return false;
 return Number(a.t||0)===Number(b.t||0)&&
        Number(a.fc||0)===Number(b.fc||0)&&
        Number(a.bc===undefined?-1:a.bc)===Number(b.bc===undefined?-1:b.bc)&&
        Number(a.fh||0)===Number(b.fh||0)&&
        Number(a.fv||0)===Number(b.fv||0)&&
        Number(a.rz||0)===Number(b.rz||0);
}
function scan(self,args){
 var ed=self&&self.editor,g=ed&&ed.graphic,fs=g&&g.frames||[];
 var layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
 if(!g||!layer||!modeOK(layer)||fs.length!==4)return null;
 if(g.getGridWidth()!==40||g.getGridHeight()<25)return null;
 var first=dims(fs[0]),a=first.a,w=first.w,c=first.c;
 if(!a||w.x!==0||w.y!==0||w.width!==40||w.height!==25)return null;
 if(!Number.isInteger(a.x)||!Number.isInteger(a.y)||!Number.isInteger(a.width)||!Number.isInteger(a.height)||
    a.width<1||a.width>=40||a.height<1||a.height>25||a.x<0||a.y<0||
    a.x+a.width>g.getGridWidth()||a.y+a.height>g.getGridHeight())return null;
 if(!DIR[c.type]||c.ticksPerStep<1||c.ticksPerStep>255||
    c.pixelsPerStep<1||c.pixelsPerStep>8)return null;
 var direction=[],durations=[],bank=Number(fs[0].charsetBank||1);
 for(var i=0;i<fs.length;i++){
  var d=dims(fs[i]),ff=fs[i],duration=Number(ff.duration);
  if(!DIR[d.c.type]||d.a.x!==a.x||d.a.y!==a.y||
     d.a.width!==a.width||d.a.height!==a.height||
     d.w.x!==w.x||d.w.y!==w.y||d.w.width!==w.width||d.w.height!==w.height||
     Number(d.c.ticksPerStep)!==Number(c.ticksPerStep)||
     Number(d.c.pixelsPerStep)!==Number(c.pixelsPerStep)||
     (d.c.diagonalEdgeMask!==false)!==(c.diagonalEdgeMask!==false)||
     Number(ff.charsetBank||1)!==bank||
     !Number.isInteger(duration)||duration<1||duration>65535)return null;
  direction.push(DIR[d.c.type]);durations.push(duration);
 }
 if(bank!==1&&bank!==2)return null;
 var ts=layer.getTileSet&&layer.getTileSet();
 if(!ts||ts.getTileWidth()!==8||ts.getTileHeight()!==8)return null;
 var store=ts.getDocRecord&&ts.getDocRecord(),meta=store&&store.data||{};
 var groups=meta.ricoGroupAnimationsV1||{};
 if((groups.bank1||[]).some(function(x){return x&&x.type;})||
    (groups.bank2||[]).some(function(x){return x&&x.type;}))return null;
 var banks=[ts.tileData,meta.ricoCharsetBank2&&meta.ricoCharsetBank2.tileData];
 if(banks.some(function(b){return b&&b.some(function(t){
  return t&&t.props&&t.props.animated&&t.props.animated!=='none';
 });}))return null;
 var audio=window.RICO_TEST207_ORIGINAL_SID;
 var sid=audio&&audio.getState&&audio.getState();
 if((sid&&sid.enabled)||(args&&(args.sidData||args.music==='sid'||args.music==='yes')))return null;
 // This route shares a single map. Never silently discard different drawings.
 for(var y=0;y<g.getGridHeight();y++)for(var x=0;x<g.getGridWidth();x++){
  var ref=layer.getCell({x:x,y:y,frame:0});
  for(var n=1;n<4;n++)if(!sameCell(ref,layer.getCell({x:x,y:y,frame:n})))return null;
 }
 var map=[],colors=[];
 for(var yy=0;yy<a.height;yy++)for(var xx=0;xx<a.width;xx++){
  var cell=layer.getCell({x:a.x+xx,y:a.y+yy,frame:0})||{};
  map.push(Number(cell.t||0)&255);colors.push(Number(cell.fc||0)&15);
 }
 var b1=byteRows(ts.tileData),
     b2=meta.ricoCharsetBank2&&meta.ricoCharsetBank2.tileData?
       byteRows(meta.ricoCharsetBank2.tileData):b1;
 var cx=((w.x-a.x)%a.width+a.width)%a.width,
     cy=((w.y-a.y)%a.height+a.height)%a.height;
 var plan={
  direction:c.type,dir:{x:-1,y:-1},ticks:Number(c.ticksPerStep),
  pixels:Number(c.pixelsPerStep),areaWidth:a.width,areaHeight:a.height,
  cameraX:cx,cameraY:cy,bank:bank,
  bg:Number(layer.getBackgroundColor(0))&15,
  border:Number(layer.getBorderColor(0))&15,
  map:map,colors:colors,bank1:b1,bank2:b2,group:null,
  edgeMask:c.diagonalEdgeMask!==false,
  uniformColor:colors.every(function(col){return col===colors[0];}),
  solidColor:colors[0]||0,fastRows:false,rowStride:a.width
 };
 return {plan:plan,dirs:direction,durations:durations,config:{width:a.width,height:a.height,x:a.x,y:a.y,cameraX:cx,cameraY:cy}};
}
function uniqueReplace(s,from,to,where){
 if(s.split(from).length!==2)throw Error('TEST354: native ASM anchor changed: '+where);
 return s.replace(from,to);
}
function step354(p){
 var xMax=p.areaWidth-1,yMax=p.areaHeight-1;
 return [
 'plan_step',' lda #$00',' sta boundary',
 ' lda camera_x',' sta pending_x',' lda camera_y',' sta pending_y',
 ' ldx frame_index354',' lda frame_dx354,x',' beq x_minus354',
 'x_plus354',' lda fine_x',' clc',' adc #'+h(p.pixels),' cmp #$08',' bcc x_ready354',
 ' sec',' sbc #$08',' ldx pending_x',' bne x_dec354',
 ' ldx #'+h(xMax),' stx pending_x',' jmp x_ready354',
 'x_dec354',' dec pending_x',' jmp x_ready354',
 'x_minus354',' lda fine_x',' sec',' sbc #'+h(p.pixels),' bcs x_ready354',
 ' clc',' adc #$08',' inc pending_x',' ldx pending_x',' cpx #'+h(p.areaWidth),
 ' bcc x_ready354',' ldx #$00',' stx pending_x',
 'x_ready354',' sta next_fx',
 ' ldx frame_index354',' lda frame_dy354,x',' beq y_minus354',
 'y_plus354',' lda fine_y',' clc',' adc #'+h(p.pixels),' cmp #$08',' bcc y_ready354',
 ' sec',' sbc #$08',' ldx pending_y',' bne y_dec354',
 ' ldx #'+h(yMax),' stx pending_y',' jmp y_ready354',
 'y_dec354',' dec pending_y',' jmp y_ready354',
 'y_minus354',' lda fine_y',' sec',' sbc #'+h(p.pixels),' bcs y_ready354',
 ' clc',' adc #$08',' inc pending_y',' ldx pending_y',' cpx #'+h(p.areaHeight),
 ' bcc y_ready354',' ldx #$00',' stx pending_y',
 'y_ready354',' sta next_fy',
 ' lda pending_x',' cmp camera_x',' bne queue_frame',
 ' lda pending_y',' cmp camera_y',' bne queue_frame',
 ' lda next_fx',' sta fine_x',' lda next_fy',' sta fine_y',' jsr apply_fine',' rts',
 'queue_frame',' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',' rts'
 ].join('\n');
}
function runtime354(entry){
 var p=entry.plan,ds=entry.dirs,dur=entry.durations;
 return [
 'frame_clock354',
 ' lda prep_request',' beq frame_idle354',' clc',' rts',
 'frame_idle354',' lda main_busy',' beq frame_count354',' clc',' rts',
 'frame_count354',' inc frame_clock_lo354',' bne frame_clock_check354',' inc frame_clock_hi354',
 'frame_clock_check354',' ldx frame_index354',' lda frame_clock_hi354',
 ' cmp frame_dur_hi354,x',' beq frame_high_ok354',' clc',' rts',
 'frame_high_ok354',' lda frame_clock_lo354',
 ' cmp frame_dur_lo354,x',' beq frame_expired354',' clc',' rts',
 'frame_expired354',' lda #$00',' sta frame_clock_lo354',' sta frame_clock_hi354',
 ' inx',' cpx #$04',' bcc frame_index_ok354',' ldx #$00',
 'frame_index_ok354',' stx frame_index354',
 // Reset source phase exactly as the editor resets it on frame change.
 ' lda #'+h(p.cameraX),' sta camera_x',' sta pending_x',
 ' lda #'+h(p.cameraY),' sta camera_y',' sta pending_y',
 ' lda frame_dx354,x',' bne reset_x_plus354',
 ' lda #$07',' jmp reset_x_store354',
 'reset_x_plus354',' lda #$00',
 'reset_x_store354',' sta fine_x',' sta next_fx',
 ' lda frame_dy354,x',' bne reset_y_plus354',
 ' lda #$07',' jmp reset_y_store354',
 'reset_y_plus354',' lda #$00',
 'reset_y_store354',' sta fine_y',' sta next_fy',
 ' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',
 ' sec',' rts',
 'frame_index354','!byte $00',
 'frame_clock_lo354','!byte $00',
 'frame_clock_hi354','!byte $00',
 'frame_dx354','!byte '+ds.map(function(d){return h(d[0]);}).join(','),
 'frame_dy354','!byte '+ds.map(function(d){return h(d[1]);}).join(','),
 'frame_dur_lo354','!byte '+dur.map(function(d){return h(d);}).join(','),
 'frame_dur_hi354','!byte '+dur.map(function(d){return h(d>>8);}).join(',')
 ].join('\n')+'\n';
}
function build354(entry){
 var source=base.build(entry.plan);
 var a=source.indexOf('\nplan_step\n'),
     b=source.indexOf('\nrender_to_dst\n',a+1);
 if(a<0||b<0||b<=a)throw Error('TEST354: diagonal plan_step/render_to_dst anchors changed');
 source=source.slice(0,a)+'\n'+step354(entry.plan)+source.slice(b);
 source=uniqueReplace(source,'\nirq_tick\n',
   '\nirq_tick\n jsr frame_clock354\n bcs irq_group\n lda prep_request\n bne irq_group\n','IRQ dispatch');
 source=uniqueReplace(source,'*=$3000\ncharset_bank1',
   runtime354(entry)+'*=$3000\ncharset_bank1','native charset');
 return source;
}
function assemble(self,asm){
 var a=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
 if(!a||!a.assemble)throw Error('TEST354: LVLLVL assembler unavailable');
 var r=a.assemble(asm,0x0801);
 if(!r||!r.success)throw Error('TEST354 ASM: '+((r&&r.errors)||[]).map(function(x){return x.message||String(x);}).join(' | '));
 var mem=a.getMemory(),out=new Uint8Array(2+r.end-r.start);
 out[0]=r.start&255;out[1]=(r.start>>8)&255;
 for(var i=r.start;i<r.end;i++)out[i-r.start+2]=mem[i]&255;
 return out;
}
ToPRGAdv.prototype.createPRG=function(args){
 var data;
 try{data=scan(this,args||{});}catch(err){data=null;console.warn('[TEST354 eligibility]',err);}
 if(!data)return old.apply(this,arguments);
 state.last='BUILDING';state.lastError=null;
 try{
  var asm=build354(data),prg=assemble(this,asm);
  this.prg=prg;state.last='ASSEMBLED';state.lastPlan={
   frames:4,area:data.config,cycles:data.durations,
   directions:data.dirs,prgBytes:prg.length};
  if(args&&args.download===false)return prg;
  var name=(args&&args.filename)||'CALACA_DIAGONAL_TEST354.prg';
  if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw Error('download() unavailable');
  window.download(prg,name,'application/prg');
  return prg;
 }catch(e){
  state.last='ERROR';state.lastError=String(e&&e.message||e);
  console.error('[TEST354 diagonal multiframe]',e);
  if(typeof window.alert==='function')window.alert('TEST354: '+state.lastError);
  return false;
 }
};
window.RICO_TEST354_DIAGONAL_FRAMES={
 state:state,scan:scan,build:build354,version:354
};
console.log('[TEST354] Isolated CALACA 4-frame diagonal native exporter: narrow source loops, all four directions.');
})();