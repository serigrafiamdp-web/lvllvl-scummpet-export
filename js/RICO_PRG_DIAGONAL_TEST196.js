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
 var b1=glyphs(ts.tileData),b2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData?glyphs(store.ricoCharsetBank2.tileData):b1;
 var bg=Number(layer.getBackgroundColor(0))&15,border=Number(layer.getBorderColor(0))&15;
 return{direction:cfg.type,dir:dir,ticks:ticks,pixels:pixels,areaWidth:area.width,areaHeight:area.height,
   cameraX:w.x-area.x,cameraY:w.y-area.y,bank:fr.charsetBank===2?2:1,bg:bg,border:border,
   map:map,colors:colors,bank1:b1,bank2:b2,group:groupFromStore(ts,store)};
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
   ' lda #$08',' sta dst_hi',' jsr render_to_dst',
   ' jsr update_d018',' jsr apply_fine',
   ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',
   ' lda #<irq',' sta $fffe',' lda #>irq',' sta $ffff',' cli',
   'main_loop',' lda prep_request',' beq main_group',' lda prep_ready',' bne main_group',
   ' lda #$01',' sta main_busy',
   ' lda back_hi',' sta dst_hi',' jsr render_to_dst',
   ' lda #$01',' sta prep_ready',
   ' lda #$00',' sta main_busy',' jmp main_loop',
   'main_group',' lda group182_pending',' beq main_loop',' jsr group182_step',' jmp main_loop',
   'irq',' pha',' txa',' pha',' tya',' pha',
   ' lda #$01',' sta $d019',
   ' lda main_busy',' bne irq_group',
   ' lda prep_request',' beq irq_tick',
   ' lda prep_ready',' beq irq_group',
   ' jsr swap_screens',
   ' lda pending_x',' sta camera_x',' lda pending_y',' sta camera_y',
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
   'apply_fine',' lda fine_x',' and #$07',' ora #$08',' sta $d016',
   ' lda fine_y',' and #$07',' ora #$18',' sta $d011',' rts',
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
   'queue_frame',' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',' rts',
   'render_to_dst',
   ' lda #$00',' sta dst_lo',' sta color_dst_lo',
   ' lda #$d8',' sta color_dst_hi',
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
   'row_continue',' dec rows_left',' bne render_row',' rts',
   'world_rows_lo');
 var los=[],his=[],clo=[],chi=[];
 for(var i=0;i<d.areaHeight;i++){
   los.push((0x4000+i*d.areaWidth)&255);
   his.push((0x4000+i*d.areaWidth)>>8);
   clo.push((0x7000+i*d.areaWidth)&255);
   chi.push((0x7000+i*d.areaWidth)>>8);
 }
 emitBytes(out,los);e('world_rows_hi');emitBytes(out,his);
 e('color_rows_lo');emitBytes(out,clo);e('color_rows_hi');emitBytes(out,chi);
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
  var data=collect(this),source=build(data),prg=assemble(this,source);
  this.prg=prg;args=args||{};
  if(args.download===false)return prg;
  var name=args.filename||'rico-diagonal-test196.prg';
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
console.log('[RICO TEST196] Diagonal map engine loaded; Group Scroll is optional.');
})();