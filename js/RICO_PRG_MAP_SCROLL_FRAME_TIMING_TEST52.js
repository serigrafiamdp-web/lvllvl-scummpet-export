(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'){console.error('[RICO TEST52] ToPRGAdv missing');return;}

var MAX_FRAMES=32;
var TYPE_CODE={'':0,'up':1,'down':2,'left':3,'right':4};

function clamp(v,a,b,d){v=parseInt(v,10);return isNaN(v)?d:Math.max(a,Math.min(b,v));}
function colorIndex(v,d){v=parseInt(v,10);return isNaN(v)||v<0?d:(v&15);}
function frameCount(editor){try{return editor.graphic.getFrameCount();}catch(e){return editor.graphic.frames?editor.graphic.frames.length:0;}}
function getCfg(editor,n){
  try{
    if(window.RICO_TEST37_MAP_SCROLL&&window.RICO_TEST37_MAP_SCROLL.getConfig){
      return window.RICO_TEST37_MAP_SCROLL.getConfig(editor.graphic,n);
    }
    var f=editor.graphic.frames&&editor.graphic.frames[n];
    return (f&&f.ricoMapScrollV1)||{type:'',ticksPerStep:6,pixelsPerStep:1};
  }catch(e){return {type:'',ticksPerStep:6,pixelsPerStep:1};}
}
function getTileSet(editor){
  try{
    var l=editor.layers.getSelectedLayerObject();
    if(l&&l.getType&&l.getType()==='grid'&&l.getTileSet)return l.getTileSet();
    return editor.tileSetManager.getCurrentTileSet();
  }catch(e){return null;}
}
function getBank2(ts){
  try{
    var r=ts.getDocRecord&&ts.getDocRecord();
    var d=r&&r.data&&r.data.ricoCharsetBank2;
    if(d&&d.tileData&&d.tileData.length>=256)return d.tileData;
  }catch(e){}
  return null;
}
function pixels(tile){return tile&&tile.data&&tile.data.length?tile.data[0]:null;}
function charsetBytes(data,fallback){
  var o=new Uint8Array(2048);
  for(var c=0;c<256;c++){
    var p=pixels(data&&data[c])||pixels(fallback&&fallback[c]);
    if(!p)continue;
    for(var y=0;y<8;y++){
      var b=0;
      for(var x=0;x<8;x++)if(p[y*8+x])b|=1<<(7-x);
      o[c*8+y]=b;
    }
  }
  return o;
}
function dominantColor(layer,frame){
  var h=[];for(var i=0;i<16;i++)h[i]=0;
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
    try{var c=layer.getCell({x:x,y:y,frame:frame}),fc=colorIndex(c&&c.fc,14);h[fc]++;}catch(e){}
  }
  var best=14,n=-1;for(var j=0;j<16;j++)if(h[j]>n){n=h[j];best=j;}
  return best;
}
function bytesLine(a){var s=[];for(var i=0;i<a.length;i++)s.push('$'+('0'+(a[i]&255).toString(16)).slice(-2));return '!byte '+s.join(',');}
function emitBytes(out,a){for(var i=0;i<a.length;i+=16)out.push(bytesLine(Array.prototype.slice.call(a,i,i+16)));}
function emitNumericTable(out,label,a){out.push(label);for(var i=0;i<a.length;i+=16)out.push(bytesLine(a.slice(i,i+16)));}
function screenData(layer,frame){
  var out=new Uint8Array(1000),p=0;
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
    var t=0;
    try{var c=layer.getCell({x:x,y:y,frame:frame});t=parseInt(c&&c.t,10);if(isNaN(t)||t<0||t>255)t=0;}catch(e){t=0;}
    out[p++]=t&255;
  }
  return out;
}
function collect(self,args){
  var ed=self.editor,fc=frameCount(ed),layer=ed.layers.getSelectedLayerObject(),ts=getTileSet(ed),frames=[],hasScroll=false;
  var b2=getBank2(ts),bank1=charsetBytes(ts.tileData,ts.tileData),bank2=b2?charsetBytes(b2,ts.tileData):bank1;
  for(var i=0;i<fc;i++){
    var c=getCfg(ed,i),type=(c&&c.type)||'';
    if(typeof TYPE_CODE[type]==='undefined')throw new Error('TEST52 todavía no exporta '+type+'.');
    if(type)hasScroll=true;
    var duration=12;try{duration=ed.graphic.getFrameDuration(i);}catch(e){var f=ed.graphic.frames&&ed.graphic.frames[i];duration=f&&f.duration;}
    duration=clamp(duration,1,255,12);
    var bg=0,br=0;try{bg=colorIndex(layer.getBackgroundColor(i),0);}catch(e){}
    try{br=colorIndex(layer.getBorderColor(i),bg);}catch(e){br=bg;}
    var bank=1;try{bank=parseInt(ed.graphic.frames[i].charsetBank,10)===2?2:1;}catch(e){}
    frames.push({
      type:type,typeCode:TYPE_CODE[type],duration:duration,
      ticks:clamp(c&&c.ticksPerStep,1,255,6),pixels:clamp(c&&c.pixelsPerStep,1,8,1),
      bg:bg,border:br,fg:dominantColor(layer,i),bank:bank,screen:screenData(layer,i)
    });
  }
  return {editor:ed,layer:layer,tileSet:ts,frames:frames,bank1:bank1,bank2:bank2,hasScroll:hasScroll};
}
function supports(self,args){
  var ed=self.editor;if(!ed)return false;
  var fc=frameCount(ed);if(fc<2)return false; // TEST51 remains the validated single-frame path.
  if(fc>MAX_FRAMES)return false;
  var l=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;
  if(!l||!l.getType||l.getType()!=='grid')return false;
  var ts=getTileSet(ed);if(!ts||ts.getTileWidth()!=8||ts.getTileHeight()!=8)return false;
  var w=args&&args.gridWidth?parseInt(args.gridWidth,10):40,h=args&&args.gridHeight?parseInt(args.gridHeight,10):25;
  if(w!==40||h!==25)return false;
  var any=false;
  for(var i=0;i<fc;i++){var c=getCfg(ed,i),t=(c&&c.type)||'';if(t)any=true;if(typeof TYPE_CODE[t]==='undefined')return false;}
  return any;
}
function buildSource(d){
  var f=d.frames,out=[];
  var durations=[],types=[],ticks=[],px=[],bgs=[],borders=[],fgs=[],banks=[],ptrlo=[],ptrhi=[];
  for(var i=0;i<f.length;i++){
    durations.push(f[i].duration);types.push(f[i].typeCode);ticks.push(f[i].ticks);px.push(f[i].pixels);
    bgs.push(f[i].bg);borders.push(f[i].border);fgs.push(f[i].fg);banks.push(f[i].bank===2?0x0e:0x0c);
    var a=0x4000+i*1000;ptrlo.push(a&255);ptrhi.push((a>>8)&255);
  }
  out.push('; RICO TEST52 - standalone multi-frame MAP SCROLL runtime');
  out.push('; 40x25 map in RAM, clean 38x24 VIC-II viewport, per-frame duration/type/speed.');
  out.push('*=$0801');
  out.push('!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00 ; 10 SYS8192');
  out.push('*=$2000');
  out.push('current_frame=$02');
  out.push('frame_remaining=$03');
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
  out.push('tmp_byte=$0e');
  out.push('front_hi=$0f');
  out.push('back_hi=$10');
  out.push('charset_bits=$11');
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
  out.push(' lda #$00');
  out.push(' sta current_frame');
  out.push(' jsr load_frame');
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
  out.push(' jmp main_loop');
  out.push('');
  out.push('irq');
  out.push(' pha');
  out.push(' txa');
  out.push(' pha');
  out.push(' tya');
  out.push(' pha');
  out.push(' lda #$01');
  out.push(' sta $d019');
  out.push(' jsr frame_tick');
  out.push(' pla');
  out.push(' tay');
  out.push(' pla');
  out.push(' tax');
  out.push(' pla');
  out.push(' rti');
  out.push('');
  out.push('frame_tick');
  out.push(' dec frame_remaining');
  out.push(' bne frame_tick_scroll');
  out.push(' jsr next_frame');
  out.push(' rts');
  out.push('frame_tick_scroll');
  out.push(' lda scroll_type');
  out.push(' beq frame_tick_done');
  out.push(' dec step_counter');
  out.push(' bne frame_tick_done');
  out.push(' lda ticks_per_step');
  out.push(' sta step_counter');
  out.push(' lda pixels_per_step');
  out.push(' sta pixel_count');
  out.push('frame_pixel_loop');
  out.push(' jsr step_dispatch');
  out.push(' dec pixel_count');
  out.push(' bne frame_pixel_loop');
  out.push('frame_tick_done');
  out.push(' rts');
  out.push('');
  out.push('next_frame');
  out.push(' inc current_frame');
  out.push(' lda current_frame');
  out.push(' cmp #$'+('0'+f.length.toString(16)).slice(-2));
  out.push(' bcc next_frame_load');
  out.push(' lda #$00');
  out.push(' sta current_frame');
  out.push('next_frame_load');
  out.push(' jsr load_frame');
  out.push(' rts');
  out.push('');
  out.push('load_frame');
  out.push(' ldx current_frame');
  out.push(' lda duration_table,x');
  out.push(' sta frame_remaining');
  out.push(' lda type_table,x');
  out.push(' sta scroll_type');
  out.push(' lda ticks_table,x');
  out.push(' sta ticks_per_step');
  out.push(' sta step_counter');
  out.push(' lda pixels_table,x');
  out.push(' sta pixels_per_step');
  out.push(' lda bank_table,x');
  out.push(' sta charset_bits');
  out.push(' lda frame_ptr_lo,x');
  out.push(' sta src_lo');
  out.push(' lda frame_ptr_hi,x');
  out.push(' sta src_hi');
  out.push(' jsr copy_frame_to_screens');
  out.push(' lda #$04');
  out.push(' sta front_hi');
  out.push(' lda #$08');
  out.push(' sta back_hi');
  out.push(' ldx current_frame');
  out.push(' lda bg_table,x');
  out.push(' sta $d021');
  out.push(' lda border_table,x');
  out.push(' sta $d020');
  out.push(' lda fg_table,x');
  out.push(' jsr fill_color_ram');
  out.push(' jsr update_d018');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' beq load_start_seven');
  out.push(' cmp #$03');
  out.push(' beq load_start_seven');
  out.push(' lda #$00');
  out.push(' sta fine_pos');
  out.push(' jmp load_apply_regs');
  out.push('load_start_seven');
  out.push(' lda #$07');
  out.push(' sta fine_pos');
  out.push('load_apply_regs');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('');
  out.push('copy_frame_to_screens');
  out.push(' ldy #$00');
  out.push('copy_frame_p0');
  out.push(' lda (src_lo),y');
  out.push(' sta $0400,y');
  out.push(' sta $0800,y');
  out.push(' iny');
  out.push(' bne copy_frame_p0');
  out.push(' inc src_hi');
  out.push(' ldy #$00');
  out.push('copy_frame_p1');
  out.push(' lda (src_lo),y');
  out.push(' sta $0500,y');
  out.push(' sta $0900,y');
  out.push(' iny');
  out.push(' bne copy_frame_p1');
  out.push(' inc src_hi');
  out.push(' ldy #$00');
  out.push('copy_frame_p2');
  out.push(' lda (src_lo),y');
  out.push(' sta $0600,y');
  out.push(' sta $0a00,y');
  out.push(' iny');
  out.push(' bne copy_frame_p2');
  out.push(' inc src_hi');
  out.push(' ldy #$00');
  out.push('copy_frame_p3');
  out.push(' lda (src_lo),y');
  out.push(' sta $0700,y');
  out.push(' sta $0b00,y');
  out.push(' iny');
  out.push(' cpy #$e8');
  out.push(' bne copy_frame_p3');
  out.push(' rts');
  out.push('');
  out.push('fill_color_ram');
  out.push(' ldx #$00');
  out.push('fill_color_loop');
  out.push(' sta $d800,x');
  out.push(' sta $d900,x');
  out.push(' sta $da00,x');
  out.push(' sta $db00,x');
  out.push(' inx');
  out.push(' bne fill_color_loop');
  out.push(' rts');
  out.push('');
  out.push('update_d018');
  out.push(' lda front_hi');
  out.push(' cmp #$04');
  out.push(' bne d018_screen_0800');
  out.push(' lda #$10');
  out.push(' jmp d018_add_charset');
  out.push('d018_screen_0800');
  out.push(' lda #$20');
  out.push('d018_add_charset');
  out.push(' ora charset_bits');
  out.push(' sta $d018');
  out.push(' rts');
  out.push('');
  out.push('apply_scroll_regs');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' beq apply_vertical');
  out.push(' cmp #$02');
  out.push(' beq apply_vertical');
  out.push(' cmp #$03');
  out.push(' beq apply_horizontal');
  out.push(' cmp #$04');
  out.push(' beq apply_horizontal');
  out.push(' lda #$10');
  out.push(' sta $d011');
  out.push(' lda #$00');
  out.push(' sta $d016');
  out.push(' rts');
  out.push('apply_vertical');
  out.push(' lda fine_pos');
  out.push(' and #$07');
  out.push(' ora #$10');
  out.push(' sta $d011');
  out.push(' lda #$00');
  out.push(' sta $d016');
  out.push(' rts');
  out.push('apply_horizontal');
  out.push(' lda #$10');
  out.push(' sta $d011');
  out.push(' lda fine_pos');
  out.push(' and #$07');
  out.push(' sta $d016');
  out.push(' rts');
  out.push('');
  out.push('step_dispatch');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' bne step_not_up');
  out.push(' jmp step_up');
  out.push('step_not_up');
  out.push(' cmp #$02');
  out.push(' bne step_not_down');
  out.push(' jmp step_down');
  out.push('step_not_down');
  out.push(' cmp #$03');
  out.push(' bne step_not_left');
  out.push(' jmp step_left');
  out.push('step_not_left');
  out.push(' cmp #$04');
  out.push(' bne step_dispatch_done');
  out.push(' jmp step_right');
  out.push('step_dispatch_done');
  out.push(' rts');
  out.push('');
  out.push('step_up');
  out.push(' lda fine_pos');
  out.push(' beq step_up_boundary');
  out.push(' dec fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_up_boundary');
  out.push(' jsr prepare_up');
  out.push(' jsr swap_screens');
  out.push(' lda #$07');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_down');
  out.push(' lda fine_pos');
  out.push(' cmp #$07');
  out.push(' beq step_down_boundary');
  out.push(' inc fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_down_boundary');
  out.push(' jsr prepare_down');
  out.push(' jsr swap_screens');
  out.push(' lda #$00');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_left');
  out.push(' lda fine_pos');
  out.push(' beq step_left_boundary');
  out.push(' dec fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_left_boundary');
  out.push(' jsr prepare_left');
  out.push(' jsr swap_screens');
  out.push(' lda #$07');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_right');
  out.push(' lda fine_pos');
  out.push(' cmp #$07');
  out.push(' beq step_right_boundary');
  out.push(' inc fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('step_right_boundary');
  out.push(' jsr prepare_right');
  out.push(' jsr swap_screens');
  out.push(' lda #$00');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' rts');
  out.push('');
  out.push('swap_screens');
  out.push(' lda front_hi');
  out.push(' pha');
  out.push(' lda back_hi');
  out.push(' sta front_hi');
  out.push(' pla');
  out.push(' sta back_hi');
  out.push(' jsr update_d018');
  out.push(' rts');
  out.push('');
  out.push('set_src_front');
  out.push(' lda #$00');
  out.push(' sta src_lo');
  out.push(' lda front_hi');
  out.push(' sta src_hi');
  out.push(' rts');
  out.push('set_dst_back');
  out.push(' lda #$00');
  out.push(' sta dst_lo');
  out.push(' lda back_hi');
  out.push(' sta dst_hi');
  out.push(' rts');
  out.push('add40_src');
  out.push(' clc');
  out.push(' lda src_lo');
  out.push(' adc #$28');
  out.push(' sta src_lo');
  out.push(' lda src_hi');
  out.push(' adc #$00');
  out.push(' sta src_hi');
  out.push(' rts');
  out.push('add40_dst');
  out.push(' clc');
  out.push(' lda dst_lo');
  out.push(' adc #$28');
  out.push(' sta dst_lo');
  out.push(' lda dst_hi');
  out.push(' adc #$00');
  out.push(' sta dst_hi');
  out.push(' rts');
  out.push('inc_src');
  out.push(' inc src_lo');
  out.push(' bne inc_src_done');
  out.push(' inc src_hi');
  out.push('inc_src_done');
  out.push(' rts');
  out.push('dec_src');
  out.push(' lda src_lo');
  out.push(' bne dec_src_low');
  out.push(' dec src_hi');
  out.push('dec_src_low');
  out.push(' dec src_lo');
  out.push(' rts');
  out.push('inc_dst');
  out.push(' inc dst_lo');
  out.push(' bne inc_dst_done');
  out.push(' inc dst_hi');
  out.push('inc_dst_done');
  out.push(' rts');
  out.push('dec_dst');
  out.push(' lda dst_lo');
  out.push(' bne dec_dst_low');
  out.push(' dec dst_hi');
  out.push('dec_dst_low');
  out.push(' dec dst_lo');
  out.push(' rts');
  out.push('copy40');
  out.push(' ldy #$00');
  out.push('copy40_loop');
  out.push(' lda (src_lo),y');
  out.push(' sta (dst_lo),y');
  out.push(' iny');
  out.push(' cpy #$28');
  out.push(' bne copy40_loop');
  out.push(' rts');
  out.push('copy39');
  out.push(' ldy #$00');
  out.push('copy39_loop');
  out.push(' lda (src_lo),y');
  out.push(' sta (dst_lo),y');
  out.push(' iny');
  out.push(' cpy #$27');
  out.push(' bne copy39_loop');
  out.push(' rts');
  out.push('');
  out.push('prepare_up');
  out.push(' jsr set_src_front');
  out.push(' jsr add40_src');
  out.push(' jsr set_dst_back');
  out.push(' ldx #$18');
  out.push('prepare_up_rows');
  out.push(' jsr copy40');
  out.push(' jsr add40_src');
  out.push(' jsr add40_dst');
  out.push(' dex');
  out.push(' bne prepare_up_rows');
  out.push(' jsr set_src_front');
  out.push(' jsr copy40');
  out.push(' rts');
  out.push('');
  out.push('prepare_down');
  out.push(' lda #$c0');
  out.push(' sta src_lo');
  out.push(' lda front_hi');
  out.push(' clc');
  out.push(' adc #$03');
  out.push(' sta src_hi');
  out.push(' jsr set_dst_back');
  out.push(' jsr copy40');
  out.push(' jsr set_src_front');
  out.push(' jsr set_dst_back');
  out.push(' jsr add40_dst');
  out.push(' ldx #$18');
  out.push('prepare_down_rows');
  out.push(' jsr copy40');
  out.push(' jsr add40_src');
  out.push(' jsr add40_dst');
  out.push(' dex');
  out.push(' bne prepare_down_rows');
  out.push(' rts');
  out.push('');
  out.push('prepare_left');
  out.push(' jsr set_src_front');
  out.push(' jsr set_dst_back');
  out.push(' ldx #$19');
  out.push('prepare_left_rows');
  out.push(' ldy #$00');
  out.push(' lda (src_lo),y');
  out.push(' sta tmp_byte');
  out.push(' jsr inc_src');
  out.push(' jsr copy39');
  out.push(' jsr dec_src');
  out.push(' ldy #$27');
  out.push(' lda tmp_byte');
  out.push(' sta (dst_lo),y');
  out.push(' jsr add40_src');
  out.push(' jsr add40_dst');
  out.push(' dex');
  out.push(' bne prepare_left_rows');
  out.push(' rts');
  out.push('');
  out.push('prepare_right');
  out.push(' jsr set_src_front');
  out.push(' jsr set_dst_back');
  out.push(' ldx #$19');
  out.push('prepare_right_rows');
  out.push(' ldy #$27');
  out.push(' lda (src_lo),y');
  out.push(' sta tmp_byte');
  out.push(' jsr inc_dst');
  out.push(' jsr copy39');
  out.push(' jsr dec_dst');
  out.push(' ldy #$00');
  out.push(' lda tmp_byte');
  out.push(' sta (dst_lo),y');
  out.push(' jsr add40_src');
  out.push(' jsr add40_dst');
  out.push(' dex');
  out.push(' bne prepare_right_rows');
  out.push(' rts');
  out.push('');
  emitNumericTable(out,'duration_table',durations);
  emitNumericTable(out,'type_table',types);
  emitNumericTable(out,'ticks_table',ticks);
  emitNumericTable(out,'pixels_table',px);
  emitNumericTable(out,'bg_table',bgs);
  emitNumericTable(out,'border_table',borders);
  emitNumericTable(out,'fg_table',fgs);
  emitNumericTable(out,'bank_table',banks);
  emitNumericTable(out,'frame_ptr_lo',ptrlo);
  emitNumericTable(out,'frame_ptr_hi',ptrhi);
  out.push('');
  out.push('*=$3000');
  out.push('charset_bank1');emitBytes(out,d.bank1);
  out.push('*=$3800');
  out.push('charset_bank2');emitBytes(out,d.bank2);
  out.push('*=$4000');
  for(var fi=0;fi<f.length;fi++){
    out.push('frame_screen_'+fi);emitBytes(out,f[fi].screen);
  }
  return out.join('\n');
}
function assemblePRG(self,source){
  var assembler=g_app&&g_app.assembler;if(!assembler)throw new Error('Assembler de LVLLVL no disponible.');
  var result=assembler.assemble(source,0x0801);
  if(!result||!result.success){
    var msgs=[];if(result&&result.errors)for(var i=0;i<result.errors.length;i++)msgs.push(result.errors[i].message||String(result.errors[i]));
    throw new Error('Error ensamblando runtime TEST52'+(msgs.length?': '+msgs.join(' | '):'.'));
  }
  var mem=assembler.getMemory(),start=result.start,end=result.end;
  var prg=new Uint8Array(2+(end-start));prg[0]=start&255;prg[1]=(start>>8)&255;
  for(var a=start,p=2;a<end;a++,p++)prg[p]=mem[a]&255;
  self.prg=prg;return prg;
}
var prev=ToPRGAdv.prototype.createPRG;
ToPRGAdv.prototype.createPRG=function(args){
  args=args||{};
  if(!supports(this,args))return prev.apply(this,arguments);
  try{
    var d=collect(this,args),source=buildSource(d),bytes=assemblePRG(this,source);
    var fn=args.filename||'rico-map-scroll-frames.prg';if(!/\.prg$/i.test(fn))fn+='.prg';
    console.log('[RICO TEST52] Multi-frame MAP SCROLL exported: '+d.frames.map(function(f,i){return 'F'+(i+1)+' '+(f.type||'No')+' '+f.duration+'t';}).join(' | '));
    if(args.download===false)return bytes;
    if(typeof window.download==='function'){window.download(bytes,fn,'application/prg');return bytes;}
    throw new Error('download() missing');
  }catch(e){
    console.error('[RICO TEST52]',e);
    alert('RICO TEST52: '+e.message);
    return false;
  }
};
window.RICO_TEST52_PRG_MAP_SCROLL={buildSource:buildSource,maxFrames:MAX_FRAMES};
console.log('[RICO TEST52] Frame Duration -> next MAP SCROLL frame runtime installed (38x24, Up/Down/Left/Right, max '+MAX_FRAMES+' frames).');
})();
