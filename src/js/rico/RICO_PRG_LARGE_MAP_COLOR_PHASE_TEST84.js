(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'){console.error('[RICO TEST84 COLOR] ToPRGAdv missing');return;}

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
  if(MAP_DATA_BASE+data.length>=COLOR_DATA_BASE)throw new Error('Mapa demasiado grande: invade el banco de color de TEST84.');
  if(COLOR_DATA_BASE+colors.length>=0xd000)throw new Error('Mapa de colores demasiado grande para el banco RAM seguro de TEST84.');
  return{editor:ed,width:s.width,height:s.height,type:type,typeCode:type==='up'?1:2,ticks:clamp(cfg&&cfg.ticksPerStep,1,255,6),pixels:clamp(cfg&&cfg.pixelsPerStep,1,8,1),duration:duration,bg:bg,border:border,bank:bank,window:win,area:area,initialRow:initialRow,bank1:bank1,bank2:bank2,map:data,colors:colors};
}

function buildSource(d){
  var out=[],areaBase=MAP_DATA_BASE+d.area.y*40,areaLo=areaBase&255,areaHi=(areaBase>>8)&255;
  var colorAreaBase=COLOR_DATA_BASE+d.area.y*40,colorAreaLo=colorAreaBase&255,colorAreaHi=(colorAreaBase>>8)&255;
  var durationLo=d.duration&255,durationHi=(d.duration>>8)&255;
  var d011base=d.window.height<=24?0x10:0x18;
  var charsetBits=d.bank===2?0x0e:0x0c;
  out.push('; RICO TEST84 - LARGE VERTICAL MAP + PER-CELL COLOR SOURCE');
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
  out.push(' jsr render_colors');
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
  out.push(' lda main_busy');out.push(' bne irq_done_tick');out.push(' jsr frame_tick');
  out.push('irq_done_tick');
  out.push(' pla');out.push(' tay');out.push(' pla');out.push(' tax');out.push(' pla');out.push(' rti');
  out.push('');
  out.push('frame_tick');
  out.push(' lda prep_request');
  out.push(' beq frame_tick_timer');
  out.push(' lda prep_ready');
  out.push(' beq frame_tick_done');
  out.push(' jsr commit_prepared');
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
  out.push(' jsr swap_screens');
  out.push(' jsr render_colors');
  out.push(' lda prep_target_fine');out.push(' sta fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda #$00');out.push(' sta prep_request');out.push(' sta prep_ready');
  out.push(' lda deferred_pixels');out.push(' beq commit_done');out.push(' sta pixel_count');out.push(' lda #$00');out.push(' sta deferred_pixels');
  out.push('commit_deferred_loop');out.push(' jsr step_dispatch');out.push(' dec pixel_count');out.push(' lda prep_request');out.push(' bne commit_done');out.push(' lda pixel_count');out.push(' bne commit_deferred_loop');
  out.push('commit_done');out.push(' rts');
  out.push('');
  out.push('camera_next');
  out.push(' inc camera_row');out.push(' lda camera_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc camera_next_done');out.push(' lda #$00');out.push(' sta camera_row');out.push('camera_next_done');out.push(' rts');
  out.push('camera_prev');
  out.push(' lda camera_row');out.push(' bne camera_prev_dec');out.push(' lda #$'+hex2(d.area.height-1));out.push(' sta camera_row');out.push(' rts');out.push('camera_prev_dec');out.push(' dec camera_row');out.push(' rts');
  out.push('');
  out.push('prepare_back_shift');
  out.push(' lda scroll_type');out.push(' cmp #$01');out.push(' beq prepare_back_up');out.push(' jmp prepare_back_down');
  out.push('prepare_back_up');
  out.push(' jsr set_src_front');out.push(' jsr add40_src');out.push(' jsr set_dst_back');out.push(' ldx #$18');
  out.push('prepare_back_up_rows');out.push(' jsr copy40');out.push(' jsr add40_src');out.push(' jsr add40_dst');out.push(' dex');out.push(' bne prepare_back_up_rows');
  out.push(' jsr set_src_camera');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$18');
  out.push('prepare_back_up_seek');out.push(' jsr advance_map_src');out.push(' dex');out.push(' bne prepare_back_up_seek');
  out.push(' jsr copy40');out.push(' rts');
  out.push('prepare_back_down');
  out.push(' jsr set_src_front');out.push(' jsr set_dst_back');out.push(' jsr add40_dst');out.push(' ldx #$18');
  out.push('prepare_back_down_rows');out.push(' jsr copy40');out.push(' jsr add40_src');out.push(' jsr add40_dst');out.push(' dex');out.push(' bne prepare_back_down_rows');
  out.push(' jsr set_src_camera');out.push(' jsr set_dst_back');out.push(' jsr copy40');out.push(' rts');
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
  out.push('render_colors');
  out.push(' jsr set_color_src_camera');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda #$d8');out.push(' sta dst_hi');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$19');
  out.push('color_row_loop');out.push(' ldy #$00');
  out.push('color_col_loop');out.push(' lda (src_lo),y');out.push(' and #$0f');out.push(' sta (dst_lo),y');out.push(' iny');out.push(' cpy #$28');out.push(' bne color_col_loop');
  out.push(' jsr add40_dst');out.push(' inc source_row');out.push(' lda source_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc color_source_next');
  out.push(' lda #$00');out.push(' sta source_row');out.push(' lda #$'+hex2(colorAreaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(colorAreaHi));out.push(' sta src_hi');out.push(' jmp color_row_advance_done');
  out.push('color_source_next');out.push(' jsr add40_src');
  out.push('color_row_advance_done');out.push(' dex');out.push(' bne color_row_loop');out.push(' rts');
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
  return out.join('\n');
}

function assemblePRG(self,source){
  var assembler=g_app&&g_app.assembler;if(!assembler)throw new Error('Assembler de LVLLVL no disponible.');
  var result=assembler.assemble(source,0x0801);
  if(!result||!result.success){var msgs=[];if(result&&result.errors)for(var i=0;i<result.errors.length;i++)msgs.push(result.errors[i].message||String(result.errors[i]));throw new Error('Error ensamblando TEST84'+(msgs.length?': '+msgs.join(' | '):'.'));}
  var mem=assembler.getMemory(),start=result.start,end=result.end,prg=new Uint8Array(2+(end-start));prg[0]=start&255;prg[1]=(start>>8)&255;for(var a=start,p=2;a<end;a++,p++)prg[p]=mem[a]&255;self.prg=prg;return prg;
}

var prev=ToPRGAdv.prototype.createPRG;
ToPRGAdv.prototype.createPRG=function(args){
  args=args||{};
  if(!isLargeCandidate(this))return prev.apply(this,arguments);
  try{
    var d=collect(this),source=buildSource(d),bytes=assemblePRG(this,source),fn=args.filename||'rico-large-map-40x'+d.height+'.prg';if(!/\.prg$/i.test(fn))fn+='.prg';
    console.log('[RICO TEST84 COLOR] LARGE MAP exported: Screen 40x'+d.height+' | Window 40x'+d.window.height+' | Scroll Area 40x'+d.area.height+' | '+d.type+' | '+d.pixels+'px/'+d.ticks+'t');
    if(args.download===false)return bytes;if(typeof window.download==='function'){window.download(bytes,fn,'application/prg');return bytes;}throw new Error('download() missing');
  }catch(e){console.error('[RICO TEST84 COLOR]',e);alert('RICO TEST84: '+e.message);return false;}
};

window.RICO_TEST84_PRG_LARGE_MAP_COLOR={buildSource:buildSource,vertical:true,screenWidth:40,maxMapHeight:MAX_MAP_HEIGHT,windowHeights:[24,25],types:['up','down'],sourceMapSeparateFromVIC:true,colorMapBase:COLOR_DATA_BASE,perCellColors:true,doubleBuffer:true};
console.log('[RICO TEST84 COLOR] Large vertical map exporter loaded with row-phase-safe backbuffer + per-cell colors.');
})();
