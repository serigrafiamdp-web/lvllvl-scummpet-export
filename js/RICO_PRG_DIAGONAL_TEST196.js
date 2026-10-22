(function(){
'use strict';
// TEST196: an independent diagonal MAP SCROLL experiment.
// The 40x25 back screen is completed before swapping. Slow frames stall, never abort.
// Group Scroll is not prohibited: cardinal groups share the TEST195 scheduler.
if(typeof ToPRGAdv==='undefined'){console.error('[TEST196] ToPRGAdv missing');return;}
var previous=ToPRGAdv.prototype.createPRG;
var DIRECTIONS={
 'diag-up-left':{x:-1,y:-1}, 'diag-up-right':{x:1,y:-1},
 'diag-down-left':{x:-1,y:1},'diag-down-right':{x:1,y:1}
};
function h(v){return '$'+('0'+((v||0)&255).toString(16)).slice(-2);}
function hex4(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function emitBytes(dst,items){for(var i=0;i<items.length;i+=16)dst.push('!byte '+Array.prototype.slice.call(items,i,i+16).map(h).join(','));}
function glyphs(tiles){
 var b=new Uint8Array(2048);
 for(var i=0;i<256;i++){var p=tiles&&tiles[i]&&tiles[i].data&&tiles[i].data[0];if(!p)continue;
  for(var y=0;y<8;y++){var n=0;for(var x=0;x<8;x++)if(p[y*8+x])n|=128>>x;b[i*8+y]=n;}
 }return b;
}
// A group is *optional*. We do not gate diagonal scroll on the existence of
// character animation. A supported cardinal group is scheduled independently.
function groupFromStore(ts,store){
 var gs=store.ricoGroupAnimationsV1||{},all=[];
 for(var bank=1;bank<=2;bank++)(gs['bank'+bank]||[]).forEach(function(g){if(g&&g.type!=='switch-bank')all.push({bank:bank,g:g});});
 if(!all.length)return null;
 var sel=all.filter(function(x){return /^(left|right|up|down)$/.test(x.g.type);})[0];
 if(!sel)return null; // Other animations remain an experimental follow-up, not a Map Scroll export veto.
 var g=sel.g,w=Number(g.widthTiles),hh=Number(g.heightTiles),ticks=Number(g.ticksPerFrame);
 if(!Number.isInteger(w)||!Number.isInteger(hh)||w<1||hh<1||hh>32||w*hh>256||!Number.isInteger(ticks)||ticks<1||ticks>255)return null;
 var src=sel.bank===2?store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData:ts.tileData;
 if(!src||src.length<256)return null;
 var cells=Array.from({length:w},function(){return Array(hh).fill(-1);}),found={};
 for(var i=0;i<(g.cells||[]).length;i++){var c=g.cells[i],x=Number(c.x),y=Number(c.y),t=Number(c.tile);
  if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(t)||x<0||x>=w||y<0||y>=hh||t<0||t>255||found[t]||cells[x][y]!==-1)return null;
  found[t]=true;cells[x][y]=t;
 }
 if(Object.keys(found).length!==w*hh)return null;
 var columns=[],addresses=[],protection=[],safe=gs.animateEmptyCharacters!==true;
 for(var col=0;col<w;col++){var a=[];
  for(var row=0;row<hh;row++){var t=cells[col][row],p=src[t]&&src[t].data&&src[t].data[0];
   if(!p||p.length!==64)return null;
   addresses.push((sel.bank===2?0x3800:0x3000)+t*8);
   protection.push(safe&&!p.some(function(v){return !!v;})?1:0);
   for(var yy=0;yy<8;yy++){var n=0;for(var xx=0;xx<8;xx++)if(p[yy*8+xx])n|=128>>xx;a.push(n);}
  }columns.push(a.concat(a));
 }
 var pixels=Number(g.pixelsPerTick);
 if(!Number.isInteger(pixels)||pixels<1||pixels>8)pixels=/^(up|down)$/.test(g.type)?(w===2&&hh===8&&ticks===1?1:2):4;
 return {bank:sel.bank,w:w,h:hh,ticks:ticks,pixels:pixels,type:g.type,cells:cells,tiles:src,columns:columns,addresses:addresses,protection:protection,codes:found};
}
function collect(self){
 var ed=self.editor,fr=ed&&ed.graphic&&ed.graphic.frames&&ed.graphic.frames[0];
 if(!fr)throw new Error('TEST196: no hay frame para exportar.');
 var cfg=fr.ricoMapScrollV1||{},dir=DIRECTIONS[cfg.type];
 if(!dir)throw new Error('TEST196: dirección diagonal inexistente.');
 var graphic=ed.graphic,width=graphic.getGridWidth(),height=graphic.getGridHeight();
 var w=fr.ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};
 var area=fr.ricoScrollAreaV1||{x:0,y:0,width:width,height:height};
 var n=[w.x,w.y,w.width,w.height,area.x,area.y,area.width,area.height];
 if(!n.every(Number.isInteger)||w.width!==40||w.height!==25||area.width<40||area.height<25||area.width>255||area.height>255||
    area.x<0||area.y<0||area.x+area.width>width||area.y+area.height>height||
    w.x<area.x||w.y<area.y||w.x+40>area.x+area.width||w.y+25>area.y+area.height)
   throw new Error('TEST196: la Window 40x25 debe quedar dentro del Scroll Area real.');
 var ticks=Number(cfg.ticksPerStep),pixels=Number(cfg.pixelsPerStep);
 if(!Number.isInteger(ticks)||ticks<1||ticks>65535||!Number.isInteger(pixels)||pixels<1||pixels>8)
   throw new Error('TEST196: ticks fuera de rango de 16 bits o pixels fuera de 1..8.');
 var layer=ed.layers.getSelectedLayerObject(),ts=layer.getTileSet();
 if(ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw new Error('TEST196: charset C64 debe ser 8x8.');
 var store=ts.getDocRecord().data||{},map=[],colors=[];
 for(var y=0;y<area.height;y++)for(var x=0;x<area.width;x++){
  var cell=layer.getCell({x:area.x+x,y:area.y+y,frame:0})||{};
  map.push((Number(cell.t)||0)&255);colors.push((Number(cell.fc)||0)&15);
 }
 // These are actual C64 address-space constraints, not performance limits.
 if(map.length>=0x3000)throw new Error('El mapa supera los 12 KB disponibles en $4000-$6FFF.');
 if(colors.length>=0x3000)throw new Error('Los colores superan los 12 KB disponibles en $7000-$9FFF.');
 var uniformColor=colors.every(function(c){return c===colors[0];});
 // TEST198: a doubled *row* permits straight 40-byte copies without checking
 // horizontal wrap at each character. Larger maps stay on the old slow path.
 var fastRows=map.length*2<0x3000;
 if(fastRows){
  var fastMap=[],fastColors=[];
  for(var ry=0;ry<area.height;ry++){
   var from=ry*area.width,to=from+area.width;
   var rowMap=map.slice(from,to),rowColors=colors.slice(from,to);
   fastMap.push.apply(fastMap,rowMap.concat(rowMap));
   fastColors.push.apply(fastColors,rowColors.concat(rowColors));
  }
  map=fastMap;colors=fastColors;
 }
 var b1=glyphs(ts.tileData),b2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData?glyphs(store.ricoCharsetBank2.tileData):b1;
 var bg=Number(layer.getBackgroundColor(0))&15,border=Number(layer.getBorderColor(0))&15;
 return{direction:cfg.type,dir:dir,ticks:ticks,pixels:pixels,areaWidth:area.width,areaHeight:area.height,
   cameraX:w.x-area.x,cameraY:w.y-area.y,bank:fr.charsetBank===2?2:1,bg:bg,border:border,
   map:map,colors:colors,bank1:b1,bank2:b2,group:groupFromStore(ts,store),
   edgeMask:cfg.diagonalEdgeMask!==false,uniformColor:uniformColor,solidColor:colors[0]||0,
   fastRows:fastRows,rowStride:fastRows?area.width*2:area.width};
}

function colorSparse203(add){
 // Per page: $1000+p*256 holds changed column indexes; $1400+p*256 colors.
 // $50..$53 = counts mod 256, $54..$57 = full-page (256 changes) flags.
 add('prepare_sparse_colors203');
 for(var p203=0;p203<4;p203++){
   var src203='$'+(0x0c00+p203*256).toString(16),
       dst203='$'+(0xd800+p203*256).toString(16),
       idx203='$'+(0x1000+p203*256).toString(16),
       val203='$'+(0x1400+p203*256).toString(16),
       count203='$'+(0x50+p203).toString(16),
       full203='$'+(0x54+p203).toString(16),
       scan203='color_scan203_'+p203,
       next203='color_next203_'+p203;
   add(' ldx #$00',' ldy #$00',' lda #$00',' sta '+full203,scan203,
       ' lda '+dst203+',x',' and #$0f',' cmp '+src203+',x',
       ' beq '+next203,
       ' lda '+src203+',x',' sta '+val203+',y',
       ' txa',' sta '+idx203+',y',
       ' iny',' bne '+next203,
       ' lda #$01',' sta '+full203,
       next203,' inx',' bne '+scan203,' sty '+count203);
 }
 add(' rts','commit_sparse_colors203');
 for(var page203=0;page203<4;page203++){
   var addr203='$'+(0xd800+page203*256).toString(16),
       pos203='$'+(0x1000+page203*256).toString(16),
       color203='$'+(0x1400+page203*256).toString(16),
       countp203='$'+(0x50+page203).toString(16),
       fullp203='$'+(0x54+page203).toString(16),
       nextp203='color_done203_'+page203,
       loopp203='color_apply203_'+page203;
   add(' lda '+countp203,' ora '+fullp203,' beq '+nextp203,
       ' ldy #$00',loopp203,
       ' lda '+pos203+',y',' tax',' lda '+color203+',y',' sta '+addr203+',x',
       ' iny',' cpy '+countp203,' bne '+loopp203,
       nextp203);
 }
 add(' rts');
}

function build(d){
 var out=[],e=function(){for(var i=0;i<arguments.length;i++)out.push(arguments[i]);};
 e('; TEST196: independent diagonal Map Scroll, 1..8 pixels/step, no speed veto.',
   '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
   '*=$2000',
   'src_lo=$0a','src_hi=$0b','color_src_lo=$0c','color_src_hi=$0d',
   'dst_lo=$0e','dst_hi=$0f','color_dst_lo=$10','color_dst_hi=$11',
   'front_hi=$12','back_hi=$13','camera_x=$14','camera_y=$15',
   'pending_x=$16','pending_y=$17','fine_x=$18','fine_y=$19',
   'next_fx=$1a','next_fy=$1b','src_col=$1c','row_id=$1d',
   'rows_left=$1e','tmp_chr=$1f','tmp_col=$20',
   'prep_request=$21','prep_ready=$22','main_busy=$23','tick_lo=$24','tick_hi=$25',
   'charset_bits=$26','boundary=$27','tmp_x=$28',
   'start',' sei',' lda #$35',' sta $01',
   ' lda #$7f',' sta $dc0d',' sta $dd0d',' lda $dc0d',' lda $dd0d',
   ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
   ' lda #$04',' sta front_hi',' lda #$08',' sta back_hi',
   ' lda #'+h(d.cameraX),' sta camera_x',' sta pending_x',
   ' lda #'+h(d.cameraY),' sta camera_y',' sta pending_y',
   ' lda #$00',' sta prep_request',' sta prep_ready',' sta main_busy',' sta tick_lo',' sta tick_hi',
   ' lda #'+h(d.dir.x===-1?7:0),' sta fine_x',' sta next_fx',
   ' lda #'+h(d.dir.y===-1?7:0),' sta fine_y',' sta next_fy',
   ' lda #'+h(d.bank===2?0x0e:0x0c),' sta charset_bits',
   ' lda #'+h(d.bg),' sta $d021',' lda #'+h(d.border),' sta $d020',
   ' lda camera_x',' sta pending_x',' lda camera_y',' sta pending_y',
   ' lda #$04',' sta dst_hi',' jsr render_to_dst',
   ' lda #$08',' sta dst_hi',' jsr render_to_dst');
 if(!d.uniformColor)e(' jsr commit_colors199');
 e(' jsr update_d018',' jsr apply_fine',
   ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',
   ' lda #<irq',' sta $fffe',' lda #>irq',' sta $ffff',' cli',
   'main_loop',' lda prep_request',' beq main_group',' lda prep_ready',' bne main_group',
   ' lda #$01',' sta main_busy',
   ' lda back_hi',' sta dst_hi',' jsr render_to_dst');
 if(!d.uniformColor)e(' jsr prepare_sparse_colors203');
 e(' lda #$01',' sta prep_ready',
   ' lda #$00',' sta main_busy',' jmp main_loop',
   'main_group',' lda group182_pending',' beq main_loop',' jsr group182_step',' jmp main_loop',
   'irq',' pha',' txa',' pha',' tya',' pha',
   ' lda #$01',' sta $d019',
   ' lda main_busy',' bne irq_group',
   ' lda prep_request',' beq irq_tick',
   ' lda prep_ready',' beq irq_group');
 if(!d.uniformColor)e(' jsr commit_sparse_colors203');
 e(' jsr swap_screens',' lda pending_x',' sta camera_x',' lda pending_y',' sta camera_y',
   ' lda next_fx',' sta fine_x',' lda next_fy',' sta fine_y',
   ' jsr apply_fine',
   ' lda #$00',' sta prep_request',' sta prep_ready',
   ' jmp irq_group',
   'irq_tick',
   ' inc tick_lo',' bne tick_check',' inc tick_hi',
   'tick_check',' lda tick_hi',' cmp #'+h((d.ticks>>8)&255),' bne irq_group',
   ' lda tick_lo',' cmp #'+h(d.ticks&255),' bne irq_group',
   ' lda #$00',' sta tick_lo',' sta tick_hi',
   ' jsr plan_step',
   'irq_group',' jsr group182_irq_tick',
   ' pla',' tay',' pla',' tax',' pla',' rti',
   'swap_screens',' lda front_hi',' pha',' lda back_hi',' sta front_hi',' pla',' sta back_hi',
   ' jsr update_d018',' rts',
   'update_d018',' lda front_hi',' cmp #$04',' bne screen0800',
   ' lda #$10',' jmp d018_charset','screen0800',' lda #$20',
   'd018_charset',' ora charset_bits',' sta $d018',' rts',
   'apply_fine',' lda fine_x',' and #$07',' ora #'+h(d.edgeMask?0:8),' sta $d016',
   ' lda fine_y',' and #$07',' ora #'+h(d.edgeMask?0x10:0x18),' sta $d011',' rts',
   'plan_step',
   ' lda #$00',' sta boundary',
   ' lda camera_x',' sta pending_x',' lda camera_y',' sta pending_y');
 // Direction sign in visual motion: image LEFT means logical camera X increases.
 if(d.dir.x===-1){
   e(' lda fine_x',' sec',' sbc #'+h(d.pixels),' bcs x_fine',
     ' clc',' adc #$08',' inc pending_x',
     ' ldx pending_x',' cpx #'+h(d.areaWidth),' bcc x_fine',
     ' ldx #$00',' stx pending_x',
     'x_fine',' sta next_fx');
 }else{
   e(' lda fine_x',' clc',' adc #'+h(d.pixels),' cmp #$08',' bcc x_fine',
     ' sec',' sbc #$08',
     ' ldx pending_x',' bne x_dec',
     ' ldx #'+h(d.areaWidth-1),' stx pending_x',' jmp x_fine',
     'x_dec',' dec pending_x',
     'x_fine',' sta next_fx');
 }
 if(d.dir.y===-1){
   e(' lda fine_y',' sec',' sbc #'+h(d.pixels),' bcs y_fine',
     ' clc',' adc #$08',' inc pending_y',
     ' ldx pending_y',' cpx #'+h(d.areaHeight),' bcc y_fine',
     ' ldx #$00',' stx pending_y',
     'y_fine',' sta next_fy');
 }else{
   e(' lda fine_y',' clc',' adc #'+h(d.pixels),' cmp #$08',' bcc y_fine',
     ' sec',' sbc #$08',
     ' ldx pending_y',' bne y_dec',
     ' ldx #'+h(d.areaHeight-1),' stx pending_y',' jmp y_fine',
     'y_dec',' dec pending_y',
     'y_fine',' sta next_fy');
 }
 e(' lda pending_x',' cmp camera_x',' bne queue_frame',
   ' lda pending_y',' cmp camera_y',' bne queue_frame',
   ' lda next_fx',' sta fine_x',' lda next_fy',' sta fine_y',' jsr apply_fine',' rts',
   'queue_frame',' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',' rts');
 if(d.fastRows){
   // TEST198 FAST: row source pointer + camera X once per row, then direct
   // (source),Y -> (screen),Y copies. No per-tile wrap test or X/Y exchange.
   e('render_to_dst',' lda #$00',' sta dst_lo');
   if(!d.uniformColor)e(' sta color_dst_lo',' lda #$0c',' sta color_dst_hi');
   e(' lda pending_y',' sta row_id',' lda #$19',' sta rows_left',
     'render_row',' ldx row_id',
     ' lda world_rows_lo,x',' clc',' adc pending_x',' sta src_lo',
     ' lda world_rows_hi,x',' adc #$00',' sta src_hi');
   if(!d.uniformColor)e(
     ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
     ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi');
   e(' ldy #$00','fast_column',
     ' lda (src_lo),y',' sta (dst_lo),y');
   if(!d.uniformColor)e(' lda (color_src_lo),y',' sta (color_dst_lo),y');
   e(' iny',' cpy #$28',' bne fast_column',
     ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
     ' lda dst_hi',' adc #$00',' sta dst_hi');
   if(!d.uniformColor)e(' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
     ' lda color_dst_hi',' adc #$00',' sta color_dst_hi');
   e(' inc row_id',' lda row_id',' cmp #'+h(d.areaHeight),' bne fast_row_continue',
     ' lda #$00',' sta row_id',
     'fast_row_continue',' dec rows_left',' bne render_row',' rts');
 }else{
   // Safe fallback for maps whose duplicated row data does not fit RAM.
   e('render_to_dst',
   ' lda #$00',' sta dst_lo',' sta color_dst_lo',
   ' lda #$0c',' sta color_dst_hi',
   ' lda pending_y',' sta row_id',
   ' lda #$19',' sta rows_left',
   'render_row',
   ' ldx row_id',
   ' lda world_rows_lo,x',' sta src_lo',
   ' lda world_rows_hi,x',' sta src_hi',
   ' lda color_rows_lo,x',' sta color_src_lo',
   ' lda color_rows_hi,x',' sta color_src_hi',
   ' lda pending_x',' sta src_col',
   ' ldx #$00',
   'render_column',
   ' ldy src_col',' lda (src_lo),y',' sta tmp_chr',
   ' lda (color_src_lo),y',' sta tmp_col',
   ' txa',' tay',' lda tmp_chr',' sta (dst_lo),y',
   ' lda tmp_col',' sta (color_dst_lo),y',
   ' inc src_col',' lda src_col',' cmp #'+h(d.areaWidth),' bne col_continue',
   ' lda #$00',' sta src_col',
   'col_continue',' inx',' cpx #$28',' bne render_column',
   ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
   ' lda dst_hi',' adc #$00',' sta dst_hi',
   ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
   ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
   ' inc row_id',' lda row_id',' cmp #'+h(d.areaHeight),' bne row_continue',
   ' lda #$00',' sta row_id',
   'row_continue',' dec rows_left',' bne render_row',' rts');
 }
 // TEST199: stage all 1000 colors in shadow VIC RAM ($0C00-$0FE7).
 // Commit only AFTER screen swap, during raster IRQ at line $FA.
 // Sequential top-to-bottom copy runs ahead of the PAL raster beam in a
 // typical frame; C64 has no real double-buffered Color RAM.
 if(!d.uniformColor)e('commit_colors199',' ldx #$00','commit_color_pages199',
     ' lda $0c00,x',' sta $d800,x',
     ' lda $0d00,x',' sta $d900,x',
     ' lda $0e00,x',' sta $da00,x',
     ' lda $0f00,x',' sta $db00,x',
     ' inx',' bne commit_color_pages199',' rts');
 e('world_rows_lo');
 var los=[],his=[],clo=[],chi=[];
 for(var i=0;i<d.areaHeight;i++){
   los.push((0x4000+i*d.rowStride)&255);
   his.push((0x4000+i*d.rowStride)>>8);
   clo.push((0x7000+i*d.rowStride)&255);
   chi.push((0x7000+i*d.rowStride)>>8);
 }
 emitBytes(out,los);e('world_rows_hi');emitBytes(out,his);
 e('color_rows_lo');emitBytes(out,clo);e('color_rows_hi');emitBytes(out,chi);
 if(!d.uniformColor)colorSparse203(e);
 e('*=$3000','charset_bank1');emitBytes(out,d.bank1);
 e('*=$3800','charset_bank2');emitBytes(out,d.bank2);
 e('*=$4000','world_map_data');emitBytes(out,d.map);
 e('*=$7000','world_color_data');emitBytes(out,d.colors);
 if(d.group){
   if(!window.RICO_TEST186_HORIZONTAL||!window.RICO_TEST186_HORIZONTAL.groupASM)
     throw new Error('TEST196: módulo de caracteres no cargado.');
   out.push(window.RICO_TEST186_HORIZONTAL.groupASM(d.group,d.bank1,d.bank2));
 }else {
   e('*=$a000','group182_pending','!byte $00','group182_irq_tick',' rts','group182_step',' rts');
 }
 // TEST197: fixed-color maps initialize the VIC color RAM once.
 // Multicolor maps retain the original per-character color update path.
 if(d.uniformColor){
   var colorSetup=[
     ' lda #'+h(d.solidColor),' ldx #$00','init_uniform_color197',
     ' sta $d800,x',' sta $d900,x',' sta $da00,x',' sta $db00,x',
     ' inx',' bne init_uniform_color197'
   ];
   var setupAt=out.indexOf(' lda camera_x');
   if(setupAt<0)throw new Error('TEST197: startup color initialization point missing.');
   out.splice.apply(out,[setupAt,0].concat(colorSetup));
   var oldColorLines={
     ' sta color_dst_lo':true,' lda #$d8':true,' sta color_dst_hi':true,
     ' lda color_rows_lo,x':true,' sta color_src_lo':true,
     ' lda color_rows_hi,x':true,' sta color_src_hi':true,
     ' lda (color_src_lo),y':true,' sta tmp_col':true,
     ' lda tmp_col':true,' sta (color_dst_lo),y':true,
     ' lda color_dst_lo':true,' sta color_dst_lo':true,
     ' lda color_dst_hi':true,' sta color_dst_hi':true
   };
   // Two source-pointer ADD/ADC instructions and an unconditional CLC are also
   // eliminated together with the per-row destination color pointer advance.
   var rowAdvance=out.indexOf(' lda color_dst_lo');
   if(rowAdvance>=1 && out[rowAdvance-1]===' clc'){
     var block=out.slice(rowAdvance-1,rowAdvance+7);
     if(block.join('|')===' clc| lda color_dst_lo| adc #$28| sta color_dst_lo| lda color_dst_hi| adc #$00| sta color_dst_hi'){
       out.splice(rowAdvance-1,7);
     }
   }
   out=out.filter(function(x){return !oldColorLines[x];});
 }
 return out.join('\n')+'\n';
}
function assemble(self,asm){
 var a=g_app&&g_app.assembler;
 if(!a)throw new Error('Assembler de LVLLVL no disponible.');
 var r=a.assemble(asm,0x0801);
 if(!r||!r.success){
  var err=(r&&r.errors)||[];
  throw new Error('TEST196 ASM: '+err.map(function(x){return x.message||String(x);}).join(' | '));
 }
 var mem=a.getMemory(),prg=new Uint8Array(2+r.end-r.start);
 prg[0]=r.start&255;prg[1]=r.start>>8;
 for(var n=r.start;n<r.end;n++)prg[n-r.start+2]=mem[n]&255;
 return prg;
}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,fr=ed&&ed.graphic&&ed.graphic.frames&&ed.graphic.frames[0];
 var t=fr&&fr.ricoMapScrollV1&&fr.ricoMapScrollV1.type;
 if(!DIRECTIONS[t])return previous.apply(this,arguments);
 try{
  var data=collect(this),source=window.RICO_TEST196_DIAGONAL.build(data),prg=assemble(this,source);
  this.prg=prg;args=args||{};
  if(args.download===false)return prg;
  var name=args.filename||'rico-diagonal-test203.prg';
  if(!/\.prg$/i.test(name))name+='.prg';
  window.download(prg,name,'application/prg');
  return prg;
 }catch(err){
  // Never substitute a static classic PRG for a diagonal project.
  console.error('[TEST196] Diagonal exporter failed:',err);
  return false;
 }
};
window.RICO_TEST196_DIAGONAL={collect:collect,build:build,directions:DIRECTIONS};
console.log('[RICO TEST203] Diagonal adaptive changed-color patch lists; IRQ commits sparse changes before raster swap.');
})();

/* TEST221: incremental 40x25 diagonal char shift, adapting the proven
 * horizontal TEST220 and vertical TEST168 techniques.
 * Only fastRows path. Original color shadow remains exact for multicolor;
 * unsupported configurations use the original builder unchanged. */
(function(){
'use strict';
var mod=window.RICO_TEST196_DIAGONAL;if(!mod)return;
var previous=mod.build;
function num(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function b(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function generator(d){
 var horizontal=d.dir.x===-1?1:-1;
 var vertical=d.dir.y===-1?1:-1;
 var stride=horizontal+40*vertical;
 var entryX=horizontal===1?39:0,entryY=vertical===1?24:0;
 var a=['diag_shift221',' lda front_hi',' cmp #$04',
        ' beq diag_0408_221',' jmp diag_0804_221'];
 [[0x0400,0x0800,'0408'],[0x0800,0x0400,'0804']].forEach(function(q){
  var frm=q[0],to=q[1],name='diag_'+q[2]+'_221';
  a.push(name,' ldx #$00',name+'_copy');
  for(var page=0;page<3;page++){
   a.push(' lda '+num(frm+256*page+stride)+',x',
          ' sta '+num(to+256*page)+',x');
  }
  a.push(' inx',' bne '+name+'_copy',
   ' ldx #$00',name+'_tail',
   ' lda '+num(frm+768+stride)+',x',
   ' sta '+num(to+768)+',x',
   ' inx',' cpx #$e8',' bne '+name+'_tail',
   ' jmp diag_edge_column221');
 });
 // In both axes the pending camera already points at the next frame.
 // Add 25 new edge cells, then overwrite entire exposed top/bottom row.
 a.push('diag_edge_column221',
  ' lda pending_y',' sta row_id',
  ' lda #$19',' sta rows_left',
  ' lda #'+b(entryX),' sta dst_lo',
  ' lda back_hi',' sta dst_hi',
  'diag_edge_row221',
  ' ldx row_id',
  ' lda world_rows_lo,x',' clc',' adc pending_x',' sta src_lo',
  ' lda world_rows_hi,x',' adc #$00',' sta src_hi');
 if(entryX)a.push(' clc',' lda src_lo',' adc #'+b(entryX),' sta src_lo',
                  ' lda src_hi',' adc #$00',' sta src_hi');
 a.push(' ldy #$00',' lda (src_lo),y',' sta (dst_lo),y',
  ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
  ' lda dst_hi',' adc #$00',' sta dst_hi',
  ' inc row_id',' lda row_id',' cmp #'+b(d.areaHeight),
  ' bne diag_edge_next221',' lda #$00',' sta row_id',
  'diag_edge_next221',
  ' dec rows_left',' beq diag_edge_row_end221',
  ' jmp diag_edge_row221',
  'diag_edge_row_end221');
 if(entryY){
  a.push(' lda pending_y',' clc',' adc #$18',
   ' cmp #'+b(d.areaHeight),' bcc diag_edge_yready221',
   ' sec',' sbc #'+b(d.areaHeight),'diag_edge_yready221',
   ' tax');
 }else a.push(' ldx pending_y');
 a.push(' lda world_rows_lo,x',' clc',' adc pending_x',' sta src_lo',
  ' lda world_rows_hi,x',' adc #$00',' sta src_hi',
  ' lda #'+b(entryY?0xc0:0),' sta dst_lo',
  ' lda back_hi');
 if(entryY)a.push(' clc',' adc #$03');
 a.push(' sta dst_hi',
  ' ldy #$00','diag_edge_full_row221',
  ' lda (src_lo),y',' sta (dst_lo),y',
  ' iny',' cpy #$28',' bne diag_edge_full_row221',' rts');
 if(!d.uniformColor){
  // Color RAM is shared by VIC screens, so preserve TEST203 sparse-color
  // commit. Build its shadow without redundantly redrawing glyphs.
  a.push('diag_colors221',
   ' lda #$00',' sta color_dst_lo',
   ' lda #$0c',' sta color_dst_hi',
   ' lda pending_y',' sta row_id',
   ' lda #$19',' sta rows_left',
   'diag_color_row221',' ldx row_id',
   ' lda color_rows_lo,x',' clc',' adc pending_x',' sta color_src_lo',
   ' lda color_rows_hi,x',' adc #$00',' sta color_src_hi',
   ' ldy #$00','diag_color_column221',
   ' lda (color_src_lo),y',' sta (color_dst_lo),y',
   ' iny',' cpy #$28',' bne diag_color_column221',
   ' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
   ' lda color_dst_hi',' adc #$00',' sta color_dst_hi',
   ' inc row_id',' lda row_id',' cmp #'+b(d.areaHeight),
   ' bne diag_color_next221',' lda #$00',' sta row_id',
   'diag_color_next221',
   ' dec rows_left',' beq diag_color_done221',
   ' jmp diag_color_row221',
   'diag_color_done221',' rts');
 }
 return a.join('\n')+'\n';
}
mod.build=function(d){
 var src=previous(d);
 if(!d.fastRows)return src;
 var stage=' lda #$01\n sta main_busy\n lda back_hi\n sta dst_hi\n jsr render_to_dst';
 if(src.split(stage).length!==2)throw Error('TEST221: diagonal stage changed');
 src=src.replace(stage,stage.replace(' jsr render_to_dst',' jsr diag_shift221'+(d.uniformColor?'':'\n jsr diag_colors221')));
 var commit=' jsr apply_fine\n lda #$00\n sta prep_request\n sta prep_ready\n jmp irq_group\nirq_tick';
 if(src.split(commit).length!==2)throw Error('TEST221: diagonal IRQ commit changed');
 src=src.replace(commit,commit.replace(' jmp irq_group\nirq_tick',' jmp irq_tick\nirq_tick'));
 var label='*=$3000\ncharset_bank1';
 if(src.split(label).length!==2)throw Error('TEST221: diagonal charset label missing');
 src=src.replace(label,generator(d)+label);
 return src;
};
mod.TEST221={incrementalDiagonal:true,fallbackForNonDoubleRows:true,buildShift:generator};
})();

/* TEST221B: TEST220's lossless vertical-run Color RAM deltas along
 * the actual diagonal camera cycle. No new limitations: full generic
 * multicolor routine remains available whenever data won't fit safely. */
(function(){
'use strict';
var M=window.RICO_TEST196_DIAGONAL;if(!M)return;
var old=M.build;
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
function plan(d){
 if(!d.fastRows||d.uniformColor||d.group)return null;
 var len=d.areaWidth/gcd(d.areaWidth,d.areaHeight)*d.areaHeight;
 if(len<1||len>255)return null;
 var sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1,
     stride=d.rowStride,streams=[],bytes=2*len;
 for(var t=0;t<len;t++){
  var oldX=(d.cameraX+t*sx)%d.areaWidth,oldY=(d.cameraY+t*sy)%d.areaHeight,
      newX=(d.cameraX+(t+1)*sx)%d.areaWidth,newY=(d.cameraY+(t+1)*sy)%d.areaHeight;
  if(oldX<0)oldX+=d.areaWidth;if(oldY<0)oldY+=d.areaHeight;
  if(newX<0)newX+=d.areaWidth;if(newY<0)newY+=d.areaHeight;
  var output=[];
  for(var x=0;x<40;x++)for(var row=0;row<25;){
   var yOld=(oldY+row)%d.areaHeight,yNew=(newY+row)%d.areaHeight;
   var prev=d.colors[yOld*stride+oldX+x]&15,
       value=d.colors[yNew*stride+newX+x]&15;
   if(prev===value){row++;continue;}
   var start=row++,cnt=1;
   while(row<25){
    yOld=(oldY+row)%d.areaHeight;yNew=(newY+row)%d.areaHeight;
    var o=d.colors[yOld*stride+oldX+x]&15,n=d.colors[yNew*stride+newX+x]&15;
    if(o===n||n!==value)break;
    row++;cnt++;
   }
   var address=0xd800+40*start+x;
   output.push(cnt,address&255,address>>8,value);
  }
  output.push(0);streams.push(output);bytes+=output.length;
 }
 var start=0xa100,low=start+2*len,hi=0xb800,addresses=[],upper=false;
 for(var k=0;k<len;k++){
  var size=streams[k].length;
  if(!upper&&low+size<=0xb000){addresses.push(low);low+=size;}
  else if(hi+size<=0xd000){upper=true;addresses.push(hi);hi+=size;}
  else return null;
 }
 return{len:len,streams:streams,addresses:addresses,total:bytes,base:start};
}
function bytes(out,arr){
 for(var j=0;j<arr.length;j+=16)out.push('!byte '+arr.slice(j,j+16).map(h).join(','));
}
function data(p){
 var out=['*='+w(p.base),'diag_rle_lo221'];bytes(out,p.addresses.map(function(x){return x&255;}));
 out.push('diag_rle_hi221');bytes(out,p.addresses.map(function(x){return x>>8;}));
 for(var i=0;i<p.streams.length;i++){
  out.push('*='+w(p.addresses[i]),'diag_rle_stream_'+i);bytes(out,p.streams[i]);
 }
 return out.join('\n')+'\n';
}
function runtime(p){
 var a=['diag_rle_apply221',
  ' ldx diag_rle_phase221',
  ' lda diag_rle_lo221,x',' sta src_lo',
  ' lda diag_rle_hi221,x',' sta src_hi',
  ' inc diag_rle_phase221',
  ' lda diag_rle_phase221',' cmp #'+h(p.len),
  ' bne diag_rle_process221',
  ' lda #$00',' sta diag_rle_phase221',
  'diag_rle_process221',
  'diag_rle_next221',' ldy #$00',' lda (src_lo),y',
  ' bne diag_rle_open221',' rts',
  'diag_rle_open221',' sta rows_left',
  ' iny',' lda (src_lo),y',' sta dst_lo',
  ' iny',' lda (src_lo),y',' sta dst_hi',
  ' iny',' lda (src_lo),y',' sta tmp_col',
  ' clc',' lda src_lo',' adc #$04',' sta src_lo',
  ' bcc diag_rle_nocarry221',' inc src_hi',
  'diag_rle_nocarry221','diag_rle_write221',
  ' ldy #$00',' lda tmp_col',' sta (dst_lo),y',
  ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
  ' lda dst_hi',' adc #$00',' sta dst_hi',
  ' dec rows_left',' bne diag_rle_write221',
  ' jmp diag_rle_next221',
  'diag_rle_phase221','!byte $00'];
 return a.join('\n')+'\n';
}
M.build=function(d){
 var p=plan(d),s=old(d);
 if(!p)return s;
 var from=' jsr diag_colors221\n jsr prepare_sparse_colors203';
 var before=' jsr commit_sparse_colors203\n jsr swap_screens';
 if(s.split(from).length!==2||s.split(before).length!==2)throw Error('TEST221: diagonal multicolor optimization anchors changed');
 s=s.replace(from,'').replace(before,' jsr diag_rle_apply221\n jsr swap_screens');
 var marker='*=$3000\ncharset_bank1';
 if(s.split(marker).length!==2)throw Error('TEST221: diagonal code anchor missing');
 s=s.replace(marker,runtime(p)+marker);
 return s+'\n'+data(p);
};
M.TEST221.rlePlanner=plan;
})();