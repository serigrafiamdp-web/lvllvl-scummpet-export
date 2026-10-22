(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST168_PRG_LARGE_MAP){console.error('[TEST186] Missing TEST185');return;}
var previous=ToPRGAdv.prototype.createPRG;
var MAP_BASE=0x4000, COLORS_BASE=0x7000;
function h(v){return ('$'+('0'+((v||0)&255).toString(16)).slice(-2));}
function bytes(out,dat){for(var i=0;i<dat.length;i+=16)out.push('!byte '+Array.prototype.slice.call(dat,i,i+16).map(h).join(','));}
function getCfg(ed,n){return (ed.graphic.frames[n]||{}).ricoMapScrollV1||{};}
function size(ed){return {w:ed.graphic.getGridWidth(),h:ed.graphic.getGridHeight()};}
function glyphBytes(data){var out=new Uint8Array(2048);for(var i=0;i<256;i++){var pix=data&&data[i]&&data[i].data&&data[i].data[0];if(!pix)continue;for(var y=0;y<8;y++){var v=0;for(var x=0;x<8;x++)if(pix[y*8+x])v|=128>>x;out[i*8+y]=v;}}return out;}
function makeGroup(ts,store){
  var groups=store.ricoGroupAnimationsV1||{},all=[];
  for(var bank=1;bank<=2;bank++)(groups['bank'+bank]||[]).forEach(function(g){all.push({bank:bank,raw:g});});
  var mods=all.filter(function(g){return g.raw.type!=='switch-bank';});
  // TEST194: horizontal Map Scroll is valid without a Group Scroll.
  if(mods.length===0){ if(all.length)throw new Error('No se puede omitir Switch Bank al exportar.');return null; }
  if(mods.length!==1)throw new Error('TEST186: selecciona exactamente UN Group Scroll vertical para esta prueba.');
  if(all.some(function(g){return g.raw.type==='switch-bank';}))throw new Error('TEST186: combinar Switch Bank con mapa horizontal queda pendiente; no se exportara un efecto distinto.');
  var selection=mods[0],cfg=selection.raw,bank=selection.bank;
  if(!/^(up|down|left|right)$/.test(cfg.type))throw new Error('TEST192: direccion de Group Scroll no implementada en el runtime combinado: '+cfg.type);
  var w=Number(cfg.widthTiles),hh=Number(cfg.heightTiles),ticks=Number(cfg.ticksPerFrame);
  var hasPixels=cfg.pixelsPerTick!==undefined&&cfg.pixelsPerTick!==null;
  var pixels=hasPixels?Number(cfg.pixelsPerTick):(cfg.type==='up'||cfg.type==='down'?((w===2&&hh===8&&ticks===1)?1:2):4);
  if(!Number.isInteger(pixels)||pixels<1||pixels>8)
    throw new Error('TEST195: Group Animate Pixels/Tick debe estar entre 1 y 8.');
  if(!Number.isInteger(w)||!Number.isInteger(hh)||w<1||hh<1||hh>32||w*hh>256||!Number.isInteger(ticks)||ticks<1||ticks>255)throw new Error('TEST186: geometria o ticks de grupo invalidos.');
  var tileSet=bank===1?ts.tileData:store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
  if(!tileSet||tileSet.length<256)throw new Error('TEST186: falta el BANK '+bank+'.');
  var matrix=Array.from({length:w},function(){return Array(hh).fill(-1);}),ids={};
  for(var i=0;i<(cfg.cells||[]).length;i++){var c=cfg.cells[i],x=Number(c.x),y=Number(c.y),t=Number(c.tile);if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(t)||x<0||x>=w||y<0||y>=hh||t<0||t>255||ids[t]||matrix[x][y]!==-1)throw new Error('TEST186: grupo con huecos o caracteres repetidos.');matrix[x][y]=t;ids[t]=true;}
  if(Object.keys(ids).length!==w*hh||matrix.some(function(c){return c.includes(-1);}))throw new Error('TEST186: el grupo debe ser rectangular y completo.');
  var protect=groups.animateEmptyCharacters!==true,columns=[],addresses=[],protectedVals=[];
  for(var cx=0;cx<w;cx++){
    var col=[];
    for(var cy=0;cy<hh;cy++){
      var t=matrix[cx][cy],p=tileSet[t].data[0],empty=!p.some(function(b){return !!b;});if(!p||p.length!==64)throw new Error('TEST186: bitmap de grupo faltante.');
      addresses.push((bank===2?0x3800:0x3000)+t*8);protectedVals.push(protect&&empty?1:0);
      for(var y=0;y<8;y++){var v=0;for(var x=0;x<8;x++)if(p[y*8+x])v|=128>>x;col.push(v);}
    }
    columns.push(col.concat(col));
  }
  return {bank:bank,w:w,h:hh,ticks:ticks,pixels:pixels,type:cfg.type,cells:matrix,tiles:tileSet,columns:columns,addresses:addresses,protection:protectedVals,codes:ids};
}
function groupASM(group,tileBank1,tileBank2){
 var blank=new Uint8Array(1280);var col=new Uint8Array(1280);col.fill(14);
 var d={width:40,height:32,type:'up',ticks:1,pixels:1,duration:128,bg:0,border:0,bank:1,window:{x:0,y:0,width:40,height:25},area:{x:0,y:0,width:40,height:32},initialRow:0,bank1:tileBank1,bank2:tileBank2,map:blank,colors:col,anim175:{records:[],switchTicks:0,group:Object.assign({},group,{type:group.type==='down'?'up':group.type})}};
 var asm=window.RICO_TEST168_PRG_LARGE_MAP.buildSource(d);
 var comment=/^(left|right)$/.test(group.type)?'; TEST183 independent horizontal group scroll '+group.type+' with pixel wrap':'; TEST182: standalone group scroll outside raster IRQ; map-first scheduling.';
 var at=asm.indexOf(comment);if(at<0)throw new Error('TEST186: modulo Group Scroll TEST182 no disponible.');
 var start=asm.lastIndexOf('*=$',at),tail=asm.slice(start);
 if(group.type==='down'){
   var first=tail.indexOf('group182_step\n'),last=tail.indexOf('\ngroup182_continue\n',first)+1;
   if(first<0||last<0)throw new Error('TEST186: grupo vertical Down sin fase identificable.');
   var old=tail.slice(first,last),anchor=' bne group182_continue\n',z=old.indexOf(anchor);
   if(z<0)throw new Error('TEST186: scheduler de grupo cambiado.');
   var n=group.h*8,speed=group.pixels||((group.w===2&&group.h===8&&group.ticks===1)?1:2);
   var body=' lda group182_phase\n sec\n sbc #'+h(speed)+'\n';
   if(n!==256)body+=' bcs group182_down_wrap_done\n clc\n adc #'+h(n)+'\ngroup182_down_wrap_done\n';
   body+=' sta group182_phase\n';
   var after=old.lastIndexOf(' lda #$01\n sta group182_active');if(after<0)throw new Error('TEST186: missing phase continuation.');
   tail=tail.slice(0,first)+old.slice(0,z+anchor.length)+body+old.slice(after)+tail.slice(last);
 }
 return tail;
}
function collect(self){
 var ed=self.editor,sz=size(ed),fr=ed.graphic.frames||[];
 if(fr.length!==1)throw new Error('TEST186: Map Scroll horizontal ancho requiere un solo frame de mapa.');
 var f=fr[0],cfg=getCfg(ed,0),w=f.ricoWindowDimensionV1||{},area=f.ricoScrollAreaV1||{},type=cfg.type;
 if(type!=='left'&&type!=='right')throw new Error('TEST186: Map Scroll debe ser Left o Right.');
 var ints=[w.x,w.y,w.width,w.height,area.x,area.y,area.width,area.height].every(Number.isInteger);
 if(!ints||w.width!==40||w.height!==25||w.x<0||w.y<0||w.x+40>sz.w||w.y+25>sz.h||area.x<0||area.y<0||area.width<40||area.x+area.width>sz.w||area.y+area.height>sz.h||w.x<area.x||w.x+40>area.x+area.width||w.y<area.y||w.y+25>area.y+area.height)
  throw new Error('TEST186: Window 40x25 debe quedar dentro del Screen y Scroll Area completos.');
 if(area.width>96||area.width*2*25>=0x3000)throw new Error('TEST186: Scroll Area horizontal supera el limite de esta primera prueba.');
 if(!Number.isInteger(cfg.ticksPerStep)||cfg.ticksPerStep<1||cfg.ticksPerStep>1024)throw new Error('Ticks/Step fuera del rango representable (1..1024).');
 if(!Number.isInteger(cfg.pixelsPerStep)||cfg.pixelsPerStep<1||cfg.pixelsPerStep>8)throw new Error('Pixels/Step debe estar entre 1 y 8.');
 var layer=ed.layers.getSelectedLayerObject(),ts=layer.getTileSet();if(ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw new Error('TEST186: solo charset C64 8x8.');
 var store=ts.getDocRecord().data||{},group=makeGroup(ts,store);
 var bank1=glyphBytes(ts.tileData),bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData?glyphBytes(store.ricoCharsetBank2.tileData):bank1;
 // Native individual scroll also writes charset RAM. It has not yet been
 // scheduled alongside this FIRST wide-horizontal driver. Never drop it silently.
 var animated=[],bankTiles=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
 for(var bi=0;bi<2;bi++)if(bankTiles[bi])for(var ci=0;ci<256;ci++){
   var prop=bankTiles[bi][ci]&&bankTiles[bi][ci].props||{};
   if(prop.animated!==undefined&&prop.animated!==null&&prop.animated!==false&&prop.animated!=='')animated.push('BANK'+(bi+1)+':'+ci);
 }
 if(animated.length)throw new Error('TEST186: animaciones individuales detectadas ('+animated.slice(0,4).join(', ')+'). Esta primera prueba horizontal solo integra Group Scroll vertical, no las omitira silenciosamente.');

 var colors={},map=[],rawCols=[];
 for(var row=0;row<25;row++){
   var vals=[],cvals=[];
   for(var x=0;x<area.width;x++){
      var p=layer.getCell({x:area.x+x,y:w.y+row,frame:0})||{},t=Number(p.t)||0,c=Number(p.fc)||0;
      vals.push(t&255);cvals.push(c&15);colors[c&15]=true;
   }
   map.push.apply(map,vals.concat(vals));rawCols.push.apply(rawCols,cvals.concat(cvals));
 }
 // TEST200: multi-color horizontal map is staged offscreen and committed on swap.
 var fc=Number(Object.keys(colors)[0]),bcolor=Number(layer.getBorderColor(0))&15,bg=Number(layer.getBackgroundColor(0))&15,bank=f.charsetBank===2?2:1;
 return{map:map,colors:rawCols,group:group,bank1:bank1,bank2:bank2,type:type,pixels:cfg.pixelsPerStep,ticks:cfg.ticksPerStep,initialX:w.x-area.x,areaWidth:area.width,srcStride:area.width*2,fg:fc,multicolor:Object.keys(colors).length>1,border:bcolor,bg:bg,bank:bank};
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
   // TEST216: four comparisons per loop; same sparse-index/color results.
   // Maximum backward 6502 branch: 4 * 29 + 2 = 118 bytes (< 128).
   // Keep TEST215 screen copy, buffer swap, and map tick scheduler unchanged.
   add(' ldx #$00',' ldy #$00',' lda #$00',' sta '+full203,scan203);
   for(var k216=0;k216<4;k216++){
     var next216=next203+'_'+k216;
     add(' lda '+dst203+',x',' and #$0f',' cmp '+src203+',x',
         ' beq '+next216,
         ' lda '+src203+',x',' sta '+val203+',y',
         ' txa',' sta '+idx203+',y',
         ' iny',' bne '+next216,
         ' lda #$01',' sta '+full203,
         next216,' inx');
   }
   add(' bne '+scan203,' sty '+count203);
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
 var a=[],emit=function(){for(var i=0;i<arguments.length;i++)a.push(arguments[i]);};
 // TEST188: 8 pixels = one full character column per successful backbuffer swap.
 // Wait for prep_ready when needed; never swap an incomplete buffer.
 // VIC bank 0, two screen buffers, banked charsets, and independent group scheduler.
 emit('; TEST186 RICO WIDE HORIZONTAL MAP + VERTICAL GROUP UP/DOWN', '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00','*=$2000',
 'src_lo=$0a','src_hi=$0b','dst_lo=$0c','dst_hi=$0d','front_hi=$0e','back_hi=$0f','camera_x=$11','prep_request=$13','prep_ready=$14','main_busy=$17','fine_pos=$18','step_ticks=$19','tmp_row=$1a','charset_bits=$1b','step_tick_lo=$1c','step_tick_hi=$1d','color_src_lo=$1e','color_src_hi=$1f','color_dst_lo=$20','color_dst_hi=$21',
 'start',' sei',' lda #$35',' sta $01',' lda #$7f',' sta $dc0d',' sta $dd0d',' lda $dc0d',' lda $dd0d',
 ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
 ' lda #$04',' sta front_hi',' lda #$08',' sta back_hi',' lda #'+h(d.initialX),' sta camera_x',
 ' lda #$00',' sta prep_request',' sta prep_ready',' sta main_busy',' sta step_tick_lo',' sta step_tick_hi',
 ' lda #'+h(d.bank===2?0x0e:0x0c),' sta charset_bits',
 ' lda #'+h(d.type==='left'?7:0),' sta fine_pos',
 ' lda #'+h(d.bg),' sta $d021',' lda #'+h(d.border),' sta $d020');
 if(!d.multicolor)emit(' lda #'+h(d.fg),' ldx #$00','init_colorram',' sta $d800,x',' sta $d900,x',' sta $da00,x',' sta $db00,x',' inx',' bne init_colorram');
 emit(' lda #$04',' sta dst_hi',' jsr render_to_dst',' lda #$08',' sta dst_hi',' jsr render_to_dst');
 if(d.multicolor)emit(' jsr commit_colors200');
 emit(' jsr update_d018',' jsr apply_horizontal',
 ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',' lda #<irq',' sta $fffe',' lda #>irq',' sta $ffff',' cli',
 'main_loop',' lda prep_request',' beq main_try_group',' lda prep_ready',' bne main_try_group',
 ' lda #$01',' sta main_busy',' lda back_hi',' sta dst_hi',' jsr render_to_dst');
 if(d.multicolor)emit(' jsr prepare_sparse_colors203');
 emit(' lda #$01',' sta prep_ready',' lda #$00',' sta main_busy',' jmp main_loop',
 'main_try_group',' lda group182_pending',' beq main_loop',' jsr group182_step',' jmp main_loop',
 'irq',' pha',' txa',' pha',' tya',' pha',' lda #$01',' sta $d019',
 ' lda main_busy',' bne irq_only_group',' lda prep_request',' beq irq_map_step',' lda prep_ready',' beq irq_only_group');
 if(d.multicolor)emit(' jsr commit_sparse_colors203');
 emit(' jsr swap_screens',' jsr apply_horizontal',' lda #$00',' sta prep_request',' sta prep_ready',
 // TEST213: same 3-byte JMP, but process the current raster's map tick.
 // Screen/color commit finishes before the movement scheduler runs.
 ' jmp irq_map_step',
 'irq_map_step',
 ' inc step_tick_lo',' bne irq_tick_check',' inc step_tick_hi',
 'irq_tick_check',' lda step_tick_hi',' cmp #'+h((d.ticks>>8)&255),' bne irq_tick_wait',
 ' lda step_tick_lo',' cmp #'+h(d.ticks&255),' beq irq_tick_fire',
 'irq_tick_wait',' jmp irq_only_group',
 'irq_tick_fire',' lda #$00',' sta step_tick_lo',' sta step_tick_hi');
 // TEST193: 1..8 pixels each configured tick. Preserve sub-character remainder
 // when crossing a character boundary; swap only after the backbuffer is ready.
 if(d.type==='left'){
  emit(' lda fine_pos',' sec',' sbc #'+h(d.pixels),' bcc irq_boundary_left',
       ' sta fine_pos',' jsr apply_horizontal',' jmp irq_only_group',
       'irq_boundary_left',' clc',' adc #$08',' sta fine_pos',
       ' inc camera_x',' lda camera_x',' cmp #'+h(d.areaWidth),
       ' bcc irq_queue',' lda #$00',' sta camera_x',' jmp irq_queue');
 }else{
  emit(' lda fine_pos',' clc',' adc #'+h(d.pixels),' cmp #$08',
       ' bcs irq_boundary_right',' sta fine_pos',' jsr apply_horizontal',' jmp irq_only_group',
       'irq_boundary_right',' sec',' sbc #$08',' sta fine_pos',
       ' lda camera_x',' bne irq_right_dec',
       ' lda #'+h(d.areaWidth-1),' sta camera_x',' jmp irq_queue',
       'irq_right_dec',' dec camera_x');
 }
 emit('irq_queue',' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',
 'irq_only_group',' jsr group182_irq_tick',' pla',' tay',' pla',' tax',' pla',' rti',
 'swap_screens',' lda front_hi',' pha',' lda back_hi',' sta front_hi',' pla',' sta back_hi',' jsr update_d018',' rts',
 'update_d018',' lda front_hi',' cmp #$04',' bne d018_0800',' lda #$10',' jmp d018_charset','d018_0800',' lda #$20','d018_charset',' ora charset_bits',' sta $d018',' rts',
 'apply_horizontal',' lda fine_pos',' and #$07',' sta $d016',' lda #$1b',' sta $d011',' rts',
 'render_to_dst',' lda #$00',' sta dst_lo');
 if(d.multicolor)emit(' sta color_dst_lo',' lda #$0c',' sta color_dst_hi');
 emit(' lda #<world_map_data',' sta src_lo',' lda #>world_map_data',' sta src_hi',
 ' clc',' lda src_lo',' adc camera_x',' sta src_lo',' lda src_hi',' adc #$00',' sta src_hi');
 if(d.multicolor)emit(
 ' lda #<world_colors',' sta color_src_lo',' lda #>world_colors',' sta color_src_hi',
 ' clc',' lda color_src_lo',' adc camera_x',' sta color_src_lo',
 ' lda color_src_hi',' adc #$00',' sta color_src_hi');
 // TEST217: fast 8-cell copy with legal absolute return to the next row.
 // Eight cells x five passes = 40 columns. Render all 25 rows.
 // Fixes TEST214 out-of-range outer BNE; preserves IRQ, buffers, SID.
 emit(' lda #$19',' sta tmp_row','render_row',' ldy #$00','render_column');
 for(var cell217=0;cell217<8;cell217++){
  emit(' lda (src_lo),y',' sta (dst_lo),y');
  if(d.multicolor)emit(' lda (color_src_lo),y',' sta (color_dst_lo),y');
  emit(' iny');
 }
 emit(' cpy #$28',' bne render_column',
 ' clc',' lda src_lo',' adc #'+h(d.srcStride&255),' sta src_lo',
 ' lda src_hi',' adc #'+h(d.srcStride>>8),' sta src_hi');
 if(d.multicolor)emit(' clc',' lda color_src_lo',' adc #'+h(d.srcStride&255),' sta color_src_lo',
 ' lda color_src_hi',' adc #'+h(d.srcStride>>8),' sta color_src_hi');
 emit(' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
 ' lda dst_hi',' adc #$00',' sta dst_hi');
 if(d.multicolor)emit(' clc',' lda color_dst_lo',' adc #$28',' sta color_dst_lo',
 ' lda color_dst_hi',' adc #$00',' sta color_dst_hi');
 emit(' dec tmp_row',' beq render_done217',' jmp render_row','render_done217',' rts');
 if(d.multicolor)emit('commit_colors200',' ldx #$00','color_page_loop200',
 ' lda $0c00,x',' sta $d800,x',' lda $0d00,x',' sta $d900,x',
 ' lda $0e00,x',' sta $da00,x',' lda $0f00,x',' sta $db00,x',
 ' inx',' bne color_page_loop200',' rts');
 if(d.multicolor)colorSparse203(emit);
 emit('*=$3000','charset_bank1');bytes(a,d.bank1);
 emit('*=$3800','charset_bank2');bytes(a,d.bank2);
 emit('*=$4000','world_map_data');bytes(a,d.map);
 emit('*=$7000','world_colors');bytes(a,d.colors);
 // TEST194: no dummy animation is added to the user's project.
 // Minimal inert labels satisfy the shared IRQ/main-loop scheduler.
 a.push(d.group?groupASM(d.group,d.bank1,d.bank2):'*=$a000\ngroup182_pending\n!byte $00\ngroup182_irq_tick\n rts\ngroup182_step\n rts');
 return a.join('\n')+'\n';
}
function assemble(self,src){var a=g_app&&g_app.assembler;if(!a)throw new Error('TEST186: ensamblador LVLLVL no disponible');var r=a.assemble(src,0x0801);if(!r||!r.success){var errors=r&&r.errors||[];throw new Error('TEST186 error ASM: '+errors.map(function(e){return e.message||String(e)}).join(' | '));}var mem=a.getMemory(),b=new Uint8Array(2+r.end-r.start);b[0]=r.start&255;b[1]=r.start>>8;for(var i=r.start;i<r.end;i++)b[2+i-r.start]=mem[i]&255;return b;}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,s=ed&&size(ed),cfg=ed&&getCfg(ed,0),t=cfg&&cfg.type;
 if(!s||s.w<=40||t!=='left'&&t!=='right')return previous.apply(this,arguments);
 try{
   var d=collect(this),text=window.RICO_TEST186_HORIZONTAL.build(d),prg=assemble(this,text),name=(args&&args.filename)||'rico-horizontal-wide-test203.prg';this.prg=prg;
   if(args&&args.download===false)return prg;
   if(!/\.prg$/i.test(name))name+='.prg';
   if(typeof window.download!=='function')throw new Error('No esta disponible window.download');
   window.download(prg,name,'application/prg');return prg;
 }catch(e){
 window.RICO_TEST200_HORIZONTAL_LAST_ERROR=e.message;
 console.error('[RICO TEST200] Right/Left horizontal export error (no static fallback):',e);
 return false;
}
};
window.RICO_TEST186_HORIZONTAL={collect:collect,build:build,groupASM:groupASM};
console.log('[RICO TEST203] Left/Right adaptive changed-color patch lists; IRQ performs sparse writes before screen swap.');
})();



/* TEST218: compressed, export-time Color RAM deltas. Full 40x25 renderer.
 * Projects without room for lookup tables use the original generic code. */
(function(){
'use strict';
var H=window.RICO_TEST186_HORIZONTAL;if(!H)return;
var normal=H.build;
function num(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function byt(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function plan(d){
 if(!d.multicolor||d.duration!==undefined||d.disableFast218)return null;
 var width=d.areaWidth,stride=d.srcStride;
 if(width<40||width>255||stride!==2*width||d.colors.length<25*stride)return null;
 var lists=[],total=2*width;
 for(var cam=0;cam<width;cam++){
  var prev=(cam+(d.type==='left'?width-1:1))%width,byColor=Array.from({length:16},function(){return[];});
  for(var row=0;row<25;row++)for(var x=0;x<40;x++){
   var position=row*stride+x,old=d.colors[position+prev]&15,now=d.colors[position+cam]&15;
   if(old!==now)byColor[now].push(0xd800+40*row+x);
  }
  var words=[];
  for(var color=0;color<16;color++)if(byColor[color].length){
   var aa=byColor[color],cnt=aa.length;words.push(color,cnt&255,cnt>>8);
   for(var n=0;n<cnt;n++)words.push(aa[n]&255,aa[n]>>8);
  }
  words.push(255);lists.push(words);total+=words.length;
 }
 // Normal one-file PRGs must not write across VIC/SID/CIA I/O $D000.
 // No group: use spare $A100-$AFFF, then $B800-$CFFF.
 // With group: reserve its $A000+ engine and use only $B800-$CFFF.
 // $B000-$B7FF stays free for the SID relocation ABI.
 var origin=d.group?0xb800:0xa100,ptr=origin+2*width,extra=0xb800,addresses=[];
 for(var k=0;k<lists.length;k++){
  var size=lists[k].length,limit=d.group?0xd000:0xb000;
  if(ptr+size<=limit){addresses.push(ptr);ptr+=size;}
  else if(!d.group&&extra+size<=0xd000){addresses.push(extra);extra+=size;}
  else return null;
 }
 return{base:origin,lists:lists,addresses:addresses,bytes:total};
}
function newScreen(d){
 var arr=['render_fast218',' lda #$00',' sta dst_lo',
 ' lda #<world_map_data',' sta src_lo',' lda #>world_map_data',' sta src_hi',
 ' clc',' lda src_lo',' adc camera_x',' sta src_lo',
 ' lda src_hi',' adc #$00',' sta src_hi',
 ' lda #$19',' sta tmp_row','render_fast_row218',' ldy #$00','render_fast_col218'];
 for(var k=0;k<8;k++)arr.push(' lda (src_lo),y',' sta (dst_lo),y',' iny');
 arr.push(' cpy #$28',' bne render_fast_col218',
 ' clc',' lda src_lo',' adc #'+byt(d.srcStride&255),' sta src_lo',
 ' lda src_hi',' adc #'+byt(d.srcStride>>8),' sta src_hi',
 ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
 ' lda dst_hi',' adc #$00',' sta dst_hi',
 ' dec tmp_row',' beq render_fast_done218',' jmp render_fast_row218',
 'render_fast_done218',' rts',
 'apply_patch218',' ldx camera_x',
 ' lda patch218_ptrlo,x',' sta src_lo',
 ' lda patch218_ptrhi,x',' sta src_hi',
 'patch_group218',' ldy #$00',' lda (src_lo),y',
 ' cmp #$ff',' bne patch_group_begin218',' rts',
 'patch_group_begin218',' sta step_ticks',
 ' iny',' lda (src_lo),y',' sta color_src_lo',
 ' iny',' lda (src_lo),y',' sta color_src_hi',
 ' clc',' lda src_lo',' adc #$03',' sta src_lo',
 ' bcc patch_group_nocarry218',' inc src_hi',
 'patch_group_nocarry218',
 'patch_cell_check218',' lda color_src_lo',' ora color_src_hi',
 ' bne patch_cell218',' jmp patch_group218',
 'patch_cell218',' ldy #$00',
 ' lda (src_lo),y',' sta dst_lo',
 ' iny',' lda (src_lo),y',' sta dst_hi',
 ' ldy #$00',' lda step_ticks',' sta (dst_lo),y',
 ' clc',' lda src_lo',' adc #$02',' sta src_lo',
 ' bcc patch_cell_nocarry218',' inc src_hi',
 'patch_cell_nocarry218',' lda color_src_lo',' bne patch_dec218',
 ' dec color_src_hi','patch_dec218',' dec color_src_lo',
 ' jmp patch_cell_check218');
 return arr.join('\n')+'\n';
}
function outputData(p){
 var arr=[],lows=p.addresses.map(function(x){return x&255;}),highs=p.addresses.map(function(x){return x>>8;});
 arr.push('*='+num(p.base),'patch218_ptrlo');
 for(var j=0;j<lows.length;j+=16)arr.push('!byte '+lows.slice(j,j+16).map(byt).join(','));
 arr.push('patch218_ptrhi');
 for(j=0;j<highs.length;j+=16)arr.push('!byte '+highs.slice(j,j+16).map(byt).join(','));
 for(var i=0;i<p.lists.length;i++){
  arr.push('*='+num(p.addresses[i]),'patch218_list_'+i);
  var data=p.lists[i];
  for(j=0;j<data.length;j+=16)arr.push('!byte '+data.slice(j,j+16).map(byt).join(','));
 }
 return arr.join('\n')+'\n';
}
H.build=function(d){
 var p=plan(d),src=normal(d);if(!p)return src;
 var stage=' jsr render_to_dst\n jsr prepare_sparse_colors203';
 var commit=' jsr commit_sparse_colors203\n jsr swap_screens';
 if(src.split(stage).length!==2||src.split(commit).length!==2)throw new Error('TEST218: source anchors changed');
 src=src.replace(stage,' jsr render_fast218').replace(commit,' jsr apply_patch218\n jsr swap_screens');
 var anchor='*=$3000\ncharset_bank1';
 if(src.split(anchor).length!==2)throw new Error('TEST218: charset anchor changed');
 src=src.replace(anchor,newScreen(d)+anchor);
 return src+'\n'+outputData(p);
};
window.RICO_TEST218_FAST_COLOR={plan:plan,normal:normal,version:218};
})();
