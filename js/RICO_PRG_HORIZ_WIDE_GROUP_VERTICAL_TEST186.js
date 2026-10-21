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
  if(mods.length!==1)throw new Error('TEST186: selecciona exactamente UN Group Scroll vertical para esta prueba.');
  if(all.some(function(g){return g.raw.type==='switch-bank';}))throw new Error('TEST186: combinar Switch Bank con mapa horizontal queda pendiente; no se exportara un efecto distinto.');
  var selection=mods[0],cfg=selection.raw,bank=selection.bank;
  if(!/^(up|down|left|right)$/.test(cfg.type))throw new Error('TEST192: direccion de Group Scroll no implementada en el runtime combinado: '+cfg.type);
  var w=Number(cfg.widthTiles),hh=Number(cfg.heightTiles),ticks=Number(cfg.ticksPerFrame);
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
  return {bank:bank,w:w,h:hh,ticks:ticks,type:cfg.type,cells:matrix,tiles:tileSet,columns:columns,addresses:addresses,protection:protectedVals,codes:ids};
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
   var n=group.h*8,speed=(group.w===2&&group.h===8&&group.ticks===1)?1:2;
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
 if(cfg.pixelsPerStep!==1&&cfg.pixelsPerStep!==8)throw new Error('TEST191: el motor horizontal de esta rama necesita implementar aun los saltos intermedios en pixels/step.');
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
 if(Object.keys(colors).length!==1)throw new Error('TEST186: TERRY usa color de caracteres uniforme; mapas multicolor necesitan actualizar Color RAM al desplazar horizontalmente (pendiente).');
 var fc=Number(Object.keys(colors)[0]),bcolor=Number(layer.getBorderColor(0))&15,bg=Number(layer.getBackgroundColor(0))&15,bank=f.charsetBank===2?2:1;
 return{map:map,colors:rawCols,group:group,bank1:bank1,bank2:bank2,type:type,pixels:cfg.pixelsPerStep,ticks:cfg.ticksPerStep,initialX:w.x-area.x,areaWidth:area.width,srcStride:area.width*2,fg:fc,border:bcolor,bg:bg,bank:bank};
}
function build(d){
 var a=[],emit=function(){for(var i=0;i<arguments.length;i++)a.push(arguments[i]);};
 // TEST188: 8 pixels = one full character column per successful backbuffer swap.
 // Wait for prep_ready when needed; never swap an incomplete buffer.
 // VIC bank 0, two screen buffers, banked charsets, and independent group scheduler.
 emit('; TEST186 RICO WIDE HORIZONTAL MAP + VERTICAL GROUP UP/DOWN', '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00','*=$2000',
 'src_lo=$0a','src_hi=$0b','dst_lo=$0c','dst_hi=$0d','front_hi=$0e','back_hi=$0f','camera_x=$11','prep_request=$13','prep_ready=$14','main_busy=$17','fine_pos=$18','step_ticks=$19','tmp_row=$1a','charset_bits=$1b','step_tick_lo=$1c','step_tick_hi=$1d',
 'start',' sei',' lda #$35',' sta $01',' lda #$7f',' sta $dc0d',' sta $dd0d',' lda $dc0d',' lda $dd0d',
 ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
 ' lda #$04',' sta front_hi',' lda #$08',' sta back_hi',' lda #'+h(d.initialX),' sta camera_x',
 ' lda #$00',' sta prep_request',' sta prep_ready',' sta main_busy',' sta step_tick_lo',' sta step_tick_hi',
 ' lda #'+h(d.bank===2?0x0e:0x0c),' sta charset_bits',
 ' lda #'+h(d.type==='left'?7:0),' sta fine_pos',
 ' lda #'+h(d.bg),' sta $d021',' lda #'+h(d.border),' sta $d020',
 ' lda #'+h(d.fg),' ldx #$00','init_colorram',' sta $d800,x',' sta $d900,x',' sta $da00,x',' sta $db00,x',' inx',' bne init_colorram',
 ' lda #$04',' sta dst_hi',' jsr render_to_dst',' lda #$08',' sta dst_hi',' jsr render_to_dst',
 ' jsr update_d018',' jsr apply_horizontal',
 ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',' lda #<irq',' sta $fffe',' lda #>irq',' sta $ffff',' cli',
 'main_loop',' lda prep_request',' beq main_try_group',' lda prep_ready',' bne main_try_group',
 ' lda #$01',' sta main_busy',' lda back_hi',' sta dst_hi',' jsr render_to_dst',
 ' lda #$01',' sta prep_ready',' lda #$00',' sta main_busy',' jmp main_loop',
 'main_try_group',' lda group182_pending',' beq main_loop',' jsr group182_step',' jmp main_loop',
 'irq',' pha',' txa',' pha',' tya',' pha',' lda #$01',' sta $d019',
 ' lda main_busy',' bne irq_only_group',' lda prep_request',' beq irq_map_step',' lda prep_ready',' beq irq_only_group',
 ' jsr swap_screens',' lda #'+h(d.type==='left'?7:0),' sta fine_pos',
 ' jsr apply_horizontal',' lda #$00',' sta prep_request',' sta prep_ready',
 (d.pixels===8?' jmp irq_map_step':' jmp irq_only_group'),
 'irq_map_step',
 ' inc step_tick_lo',' bne irq_tick_check',' inc step_tick_hi',
 'irq_tick_check',' lda step_tick_hi',' cmp #'+h((d.ticks>>8)&255),' bne irq_tick_wait',
 ' lda step_tick_lo',' cmp #'+h(d.ticks&255),' beq irq_tick_fire',
 'irq_tick_wait',' jmp irq_only_group',
 'irq_tick_fire',' lda #$00',' sta step_tick_lo',' sta step_tick_hi');
 if(d.pixels===8){
   // A character-wide step is 8 pixels; map camera changes only by one column.
   // Never swap an unfinished backbuffer; group animation remains ticked on every IRQ.
   if(d.type==='left'){
     emit(' inc camera_x',' lda camera_x',' cmp #'+h(d.areaWidth),' bcc irq_queue',' lda #$00',' sta camera_x',' jmp irq_queue');
   }else{
     emit(' lda camera_x',' bne irq_right_dec8',' lda #'+h(d.areaWidth-1),' sta camera_x',' jmp irq_queue',
          'irq_right_dec8',' dec camera_x');
   }
 }else{
   emit(' lda fine_pos');

 if(d.type==='left'){
  emit(' beq irq_boundary_left',' dec fine_pos',' jsr apply_horizontal',' jmp irq_only_group',
 'irq_boundary_left',' inc camera_x',' lda camera_x',' cmp #'+h(d.areaWidth),' bcc irq_queue',' lda #$00',' sta camera_x',' jmp irq_queue');
 }else{
  emit(' cmp #$07',' beq irq_boundary_right',' inc fine_pos',' jsr apply_horizontal',' jmp irq_only_group',
 'irq_boundary_right',' lda camera_x',' bne irq_right_dec',' lda #'+h(d.areaWidth-1),' sta camera_x',' jmp irq_queue', 'irq_right_dec',' dec camera_x');
 }
 }
 emit('irq_queue',' lda #$01',' sta prep_request',' lda #$00',' sta prep_ready',
 'irq_only_group',' jsr group182_irq_tick',' pla',' tay',' pla',' tax',' pla',' rti',
 'swap_screens',' lda front_hi',' pha',' lda back_hi',' sta front_hi',' pla',' sta back_hi',' jsr update_d018',' rts',
 'update_d018',' lda front_hi',' cmp #$04',' bne d018_0800',' lda #$10',' jmp d018_charset','d018_0800',' lda #$20','d018_charset',' ora charset_bits',' sta $d018',' rts',
 'apply_horizontal',' lda fine_pos',' and #$07',' sta $d016',' lda #$1b',' sta $d011',' rts',
 'render_to_dst',' lda #$00',' sta dst_lo',
 ' lda #<world_map_data',' sta src_lo',' lda #>world_map_data',' sta src_hi',
 ' clc',' lda src_lo',' adc camera_x',' sta src_lo',' lda src_hi',' adc #$00',' sta src_hi',
 ' lda #$19',' sta tmp_row',
 'render_row',' ldy #$00','render_column',' lda (src_lo),y',' sta (dst_lo),y',' iny',' cpy #$28',' bne render_column',
 ' clc',' lda src_lo',' adc #'+h(d.srcStride&255),' sta src_lo',' lda src_hi',' adc #'+h(d.srcStride>>8),' sta src_hi',
 ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',' lda dst_hi',' adc #$00',' sta dst_hi',
 ' dec tmp_row',' bne render_row',' rts',
 '*=$3000','charset_bank1');bytes(a,d.bank1);
 emit('*=$3800','charset_bank2');bytes(a,d.bank2);
 emit('*=$4000','world_map_data');bytes(a,d.map);
 emit('*=$7000','world_colors');bytes(a,d.colors);
 a.push(groupASM(d.group,d.bank1,d.bank2));
 return a.join('\n')+'\n';
}
function assemble(self,src){var a=g_app&&g_app.assembler;if(!a)throw new Error('TEST186: ensamblador LVLLVL no disponible');var r=a.assemble(src,0x0801);if(!r||!r.success){var errors=r&&r.errors||[];throw new Error('TEST186 error ASM: '+errors.map(function(e){return e.message||String(e)}).join(' | '));}var mem=a.getMemory(),b=new Uint8Array(2+r.end-r.start);b[0]=r.start&255;b[1]=r.start>>8;for(var i=r.start;i<r.end;i++)b[2+i-r.start]=mem[i]&255;return b;}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,s=ed&&size(ed),cfg=ed&&getCfg(ed,0),t=cfg&&cfg.type;
 if(!s||s.w<=40||t!=='left'&&t!=='right')return previous.apply(this,arguments);
 try{
   var d=collect(this),text=build(d),prg=assemble(this,text),name=(args&&args.filename)||'rico-horizontal-wide-test186.prg';this.prg=prg;
   if(args&&args.download===false)return prg;
   if(!/\.prg$/i.test(name))name+='.prg';
   if(typeof window.download!=='function')throw new Error('No esta disponible window.download');
   window.download(prg,name,'application/prg');return prg;
 }catch(e){
 console.warn('[RICO TEST189] Exportador de prueba no admite esta combinacion; pasando al motor anterior:',e.message);
 try{return previous.apply(this,arguments);}
 catch(f){console.error('[RICO TEST189] Error del exportador anterior:',f);console.error('[RICO TEST190] Error tecnico en motor previo (sin cartel):',f.message);return false;}
}
};
window.RICO_TEST186_HORIZONTAL={collect:collect,build:build,groupASM:groupASM};
console.log('[RICO TEST192] Experimental combined Group Scroll cardinal directions Up/Down/Left/Right with 1..255 ticks; VICE validation pending.');
})();
