/* TEST363: integrate previously VICE-confirmed TEST342 multiframe diagonal
 * with TEST362's charset fix on the canonical gh-pages editor.
 * Preserve original frame342_* ASM names and code to minimize regression.
 * Add only a selective, non-destructive route ahead of prior exporters.
 */
(function(){
'use strict';
var tag='[RICO TEST363]';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST196_DIAGONAL)return;
var M=window.RICO_TEST196_DIAGONAL, prior=ToPRGAdv.prototype.createPRG;
var dirs={
 'diag-up-left':{x:0,y:0},'diag-up-right':{x:1,y:0},
 'diag-down-left':{x:0,y:1},'diag-down-right':{x:1,y:1}
};
function byte(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function word(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function bytes(list){var lines=[];for(var i=0;i<list.length;i+=16)lines.push('!byte '+list.slice(i,i+16).map(byte).join(','));return lines.join('\n');}
function once(text,needle,replacement,label){
 var p=text.indexOf(needle);
 if(p<0||text.indexOf(needle,p+needle.length)!==-1)
   throw Error('TEST342: contrato ASM '+label+' no encontrado o ambiguo.');
 return text.slice(0,p)+replacement+text.slice(p+needle.length);
}
function segment(text,head,tail,replacement,label){
 var i=text.indexOf(head),j=i<0?-1:text.indexOf(tail,i+head.length);
 if(i<0||j<0||text.indexOf(head,i+head.length)!==-1)
   throw Error('TEST342: bloque '+label+' no reconocido.');
 return text.slice(0,i)+replacement+text.slice(j);
}
function isStill(f){
 var type=f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;
 return !type||/^(none|off|disabled|false)$/i.test(String(type));
}
function getGroups(self){
 var layer=self.editor.layers.getSelectedLayerObject(),ts=layer.getTileSet(),record=ts.getDocRecord&&ts.getDocRecord();
 var store=record&&record.data||{},g=store.ricoGroupAnimationsV1||{},all=[];
 [1,2].forEach(function(bank){(g['bank'+bank]||[]).forEach(function(x){if(x&&x.type)all.push({bank:bank,type:x.type});});});
 return {all:all,ts:ts,store:store,layer:layer};
}
function collectFrame(self,i){
 var ed=self.editor,graphic=ed.graphic,actual=graphic.frames[i],layer=ed.layers.getSelectedLayerObject();
 var still=isStill(actual),effective=actual;
 if(still){
  var w=actual.ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};
  if(w.width!==40||w.height!==25)throw Error('TEST342: frame '+(i+1)+' sin scroll necesita Window 40x25.');
  var area=actual.ricoScrollAreaV1||{x:w.x,y:w.y,width:40,height:25};
  if(area.width<40||area.height<25)area={x:w.x,y:w.y,width:40,height:25};
  effective=Object.assign({},actual,{ricoMapScrollV1:{type:'diag-up-left',ticksPerStep:1,pixelsPerStep:1},
   ricoWindowDimensionV1:w,ricoScrollAreaV1:area});
 }
 var proxyGraphic=Object.create(graphic);proxyGraphic.frames=[effective];
 var proxyLayer=Object.create(layer);
 proxyLayer.getCell=function(p){return layer.getCell.call(layer,Object.assign({},p,{frame:i}));};
 if(typeof layer.getBackgroundColor==='function')proxyLayer.getBackgroundColor=function(){return layer.getBackgroundColor.call(layer,i);};
 if(typeof layer.getBorderColor==='function')proxyLayer.getBorderColor=function(){return layer.getBorderColor.call(layer,i);};
 var layers=Object.create(ed.layers);layers.getSelectedLayerObject=function(){return proxyLayer;};
 var editor=Object.create(ed);editor.graphic=proxyGraphic;editor.layers=layers;
 var holder=Object.create(self);holder.editor=editor;
 var d=M.collect(holder);
 if(d.group)throw Error('TEST342: Group Animate detectado en frame '+(i+1)+'. Integración diagonal multiframe + grupos pendiente; no se omite la animación.');
 // The generic row renderer handles varying frame sizes safely.
 // Disable TEST221 fixed-direction copy and doubled-row colour optimizations.
 if(d.fastRows){
  var stride=d.rowStride,newMap=[],newColors=[];
  for(var y=0;y<d.areaHeight;y++){
   newMap.push.apply(newMap,d.map.slice(y*stride,y*stride+d.areaWidth));
   newColors.push.apply(newColors,d.colors.slice(y*stride,y*stride+d.areaWidth));
  }
  d.map=newMap;d.colors=newColors;
 }
 d.fastRows=false;d.rowStride=d.areaWidth;d.uniformColor=false;d.group=null;
 d.still=still;
 d.pixels=still?0:d.pixels;
 var duration=Number(graphic.getFrameDuration?graphic.getFrameDuration(i):actual.duration);
 if(!Number.isInteger(duration)||duration<1||duration>65535)throw Error('TEST342: duracion fuera de 1..65535 ticks en frame '+(i+1)+'.');
 d.duration=duration;
 return d;
}
function collect(self){
 var ed=self.editor,fs=ed&&ed.graphic&&ed.graphic.frames||[],g=getGroups(self);
 if(fs.length<2||fs.length>255)throw Error('TEST342: se requieren 2..255 frames; la cantidad efectiva depende de RAM.');
 var sid=window.RICO_TEST207_ORIGINAL_SID&&window.RICO_TEST207_ORIGINAL_SID.getState&&window.RICO_TEST207_ORIGINAL_SID.getState();
 if(sid&&sid.enabled)throw Error('TEST342: SID activo; integración del player en esta ruta de múltiples diagonales pendiente. No se exporta audio omitido.');
 if(g.all.length)throw Error('TEST342: hay '+g.all.length+' Group Animate. Falta componer grupos con diagonal multiframe; no se exporta un PRG sin ellos.');
 var mode=g.layer&&g.layer.getScreenMode&&g.layer.getScreenMode();
 if(/bitmap|ecm/i.test(String(mode)))throw Error('TEST342: modo '+mode+' requiere su exportador propio; esta prueba es de mapa de caracteres.');
 var bank2=g.store&&g.store.ricoCharsetBank2&&g.store.ricoCharsetBank2.tileData;
 var all=[g.ts.tileData,bank2].filter(Boolean);
 if(all.some(function(tiles){return tiles.some(function(t){var p=t&&t.props&&t.props.animated;return p&&p!=='none';});}))
  throw Error('TEST342: animaciones individuales configuradas. Falta unirlas al planificador diagonal multiframe; no se descartan.');
 fs.forEach(function(fr,i){
  var type=fr&&fr.ricoMapScrollV1&&fr.ricoMapScrollV1.type;
  if(!isStill(fr)&&!dirs[type])throw Error('TEST363: frame '+(i+1)+' uses another scroll engine: '+type);
 });
 var frames=fs.map(function(f,i){return collectFrame(self,i);});
 var offset=0,maxHeight=0,entry=[];
 frames.forEach(function(f,i){
  if(f.map.length!==f.colors.length||f.map.length!==f.areaWidth*f.areaHeight)
   throw Error('TEST342: frame '+(i+1)+' no coincide con sus dimensiones de mapa y colores.');
  if(offset+f.map.length>0x3000)
   throw Error('TEST342: '+fs.length+' frames requieren '+(offset+f.map.length)+' bytes de mapa/color por banco; capacidad disponible 12288. No se descartan frames.');
  entry.push({map:0x4000+offset,colors:0x7000+offset,length:f.map.length});
  offset+=f.map.length;
  maxHeight=Math.max(maxHeight,f.areaHeight);
 });
 return {frames:frames,entry:entry,maxHeight:maxHeight,bytesPerBank:offset};
}
function table(name,values){return name+'\n'+bytes(values);}
function metadata(plan){
 var fs=plan.frames,en=plan.entry;
 var defs=[
 ['frame342_map_lo',function(f,i){return en[i].map&255;}],
 ['frame342_map_hi',function(f,i){return en[i].map>>8;}],
 ['frame342_col_lo',function(f,i){return en[i].colors&255;}],
 ['frame342_col_hi',function(f,i){return en[i].colors>>8;}],
 ['frame342_stride_lo',function(f){return f.rowStride&255;}],
 ['frame342_stride_hi',function(f){return f.rowStride>>8;}],
 ['frame342_width',function(f){return f.areaWidth;}],
 ['frame342_height',function(f){return f.areaHeight;}],
 ['frame342_x',function(f){return f.cameraX;}],
 ['frame342_y',function(f){return f.cameraY;}],
 ['frame342_dirx',function(f){return dirs[f.direction].x;}],
 ['frame342_diry',function(f){return dirs[f.direction].y;}],
 ['frame342_ticks_lo',function(f){return f.ticks&255;}],
 ['frame342_ticks_hi',function(f){return f.ticks>>8;}],
 ['frame342_pixels',function(f){return f.pixels;}],
 ['frame342_dur_lo',function(f){return f.duration&255;}],
 ['frame342_dur_hi',function(f){return f.duration>>8;}],
 ['frame342_fine_x',function(f){return dirs[f.direction].x?0:7;}],
 ['frame342_fine_y',function(f){return dirs[f.direction].y?0:7;}],
 ['frame342_bank',function(f){return f.bank===2?0x0e:0x0c;}],
 ['frame342_bg',function(f){return f.bg;}],
 ['frame342_border',function(f){return f.border;}],
 ['frame342_edge',function(f){return f.edgeMask?0:8;}]
 ];
 return defs.map(function(def){return table(def[0],fs.map(function(f,i){return def[1](f,i);}));}).join('\n');
}
function runtime(frameCount){
 var a=[
 'frame342_load',
 ' ldx f342_index',
 ' lda frame342_map_lo,x',' sta f342_maplo',
 ' lda frame342_map_hi,x',' sta f342_maphi',
 ' lda frame342_col_lo,x',' sta f342_collo',
 ' lda frame342_col_hi,x',' sta f342_colhi',
 ' lda frame342_stride_lo,x',' sta f342_stride_lo',
 ' lda frame342_stride_hi,x',' sta f342_stride_hi',
 ' lda frame342_width,x',' sta f342_width',
 ' lda frame342_height,x',' sta f342_height',
 ' lda frame342_x,x',' sta pending_x',
 ' lda frame342_y,x',' sta pending_y',
 ' lda frame342_dirx,x',' sta f342_dirx',
 ' lda frame342_diry,x',' sta f342_diry',
 ' lda frame342_ticks_lo,x',' sta f342_ticklo',
 ' lda frame342_ticks_hi,x',' sta f342_tickhi',
 ' lda frame342_pixels,x',' sta f342_pixels',
 ' lda frame342_dur_lo,x',' sta f342_durlo',
 ' lda frame342_dur_hi,x',' sta f342_durhi',
 ' lda frame342_fine_x,x',' sta next_fx',
 ' lda frame342_fine_y,x',' sta next_fy',
 ' lda frame342_bank,x',' sta charset_bits',
 ' lda frame342_bg,x',' sta f342_bg',
 ' lda frame342_border,x',' sta f342_border',
 ' lda frame342_edge,x',' sta f342_edge',
 ' lda #$00',' sta tick_lo',' sta tick_hi',
 ' ldy #$00',
 'frame342_row_loop',
 ' lda f342_maplo',' sta world_rows_lo,y',
 ' lda f342_maphi',' sta world_rows_hi,y',
 ' lda f342_collo',' sta color_rows_lo,y',
 ' lda f342_colhi',' sta color_rows_hi,y',
 ' clc',' lda f342_maplo',' adc f342_stride_lo',' sta f342_maplo',
 ' lda f342_maphi',' adc f342_stride_hi',' sta f342_maphi',
 ' clc',' lda f342_collo',' adc f342_stride_lo',' sta f342_collo',
 ' lda f342_colhi',' adc f342_stride_hi',' sta f342_colhi',
 ' iny',' cpy f342_height',' bne frame342_row_loop',
 ' rts',
 'frame342_tick',
 ' lda f342_pending',' ora f342_switching',' bne frame342_tick_done',
 ' sec',' lda f342_durlo',' sbc #$01',' sta f342_durlo',
 ' lda f342_durhi',' sbc #$00',' sta f342_durhi',
 ' ora f342_durlo',' bne frame342_tick_done',
 ' lda #$01',' sta f342_pending',
 'frame342_tick_done',' rts',
 'frame342_stage',
 ' lda f342_pending',' beq frame342_stage_done',
 ' lda prep_request',' bne frame342_stage_done',
 ' lda #$01',' sta main_busy',' sta f342_switching',
 ' lda #$00',' sta f342_pending',
 ' inc f342_index',' lda f342_index',' cmp #'+byte(frameCount),
 ' bne frame342_index_ok',
 ' lda #$00',' sta f342_index',
 'frame342_index_ok',
 ' jsr frame342_load',
 ' lda #$01',' sta prep_request',
 ' lda #$00',' sta prep_ready',
 'frame342_stage_done',' rts',
 'frame342_commit',
 ' lda f342_switching',' beq frame342_commit_done',
 ' lda f342_bg',' sta $d021',
 ' lda f342_border',' sta $d020',
 ' lda #$00',' sta f342_switching',
 'frame342_commit_done',' rts'
 ];
 return a.join('\n');
}
function planStep(){
 return [
 'plan_step',
 ' lda f342_pixels',' bne frame342_plan_move',' rts',
 'frame342_plan_move',
 ' lda #$00',' sta boundary',
 ' lda camera_x',' sta pending_x',
 ' lda camera_y',' sta pending_y',
 ' lda f342_dirx',' beq frame342_xleft',
 ' lda fine_x',' clc',' adc f342_pixels',' sta f342_tmpfine',
 ' cmp #$08',' bcc frame342_xdone',
 ' sec',' sbc #$08',' sta f342_tmpfine',
 ' lda pending_x',' bne frame342_xright_dec',
 ' lda f342_width',' sec',' sbc #$01',' sta pending_x',
 ' jmp frame342_xdone',
 'frame342_xright_dec',' dec pending_x',' jmp frame342_xdone',
 'frame342_xleft',
 ' lda fine_x',' sec',' sbc f342_pixels',' sta f342_tmpfine',' bcs frame342_xdone',
 ' clc',' adc #$08',' sta f342_tmpfine',
 ' inc pending_x',' ldx pending_x',' cpx f342_width',' bcc frame342_xdone',
 ' ldx #$00',' stx pending_x',
 'frame342_xdone',' lda f342_tmpfine',' sta next_fx',
 ' lda f342_diry',' beq frame342_yup',
 ' lda fine_y',' clc',' adc f342_pixels',' sta f342_tmpfine',
 ' cmp #$08',' bcc frame342_ydone',
 ' sec',' sbc #$08',' sta f342_tmpfine',
 ' lda pending_y',' bne frame342_ydown_dec',
 ' lda f342_height',' sec',' sbc #$01',' sta pending_y',
 ' jmp frame342_ydone',
 'frame342_ydown_dec',' dec pending_y',' jmp frame342_ydone',
 'frame342_yup',
 ' lda fine_y',' sec',' sbc f342_pixels',' sta f342_tmpfine',' bcs frame342_ydone',
 ' clc',' adc #$08',' sta f342_tmpfine',
 ' inc pending_y',' ldx pending_y',' cpx f342_height',' bcc frame342_ydone',
 ' ldx #$00',' stx pending_y',
 'frame342_ydone',' lda f342_tmpfine',' sta next_fy',
 ' lda pending_x',' cmp camera_x',' bne frame342_queue',
 ' lda pending_y',' cmp camera_y',' bne frame342_queue',
 ' lda next_fx',' sta fine_x',
 ' lda next_fy',' sta fine_y',' jsr apply_fine',' rts',
 'frame342_queue',' lda #$01',' sta prep_request',
 ' lda #$00',' sta prep_ready',' rts'
 ].join('\n');
}
function build(plan){
 var d=plan.frames[0],src=M.build(d),fs=plan.frames;
 var zp=[
 'f342_index=$29','f342_pending=$2a','f342_switching=$2b',
 'f342_durlo=$2c','f342_durhi=$2d','f342_pixels=$2e',
 'f342_ticklo=$2f','f342_tickhi=$30','f342_dirx=$31','f342_diry=$32',
 'f342_width=$33','f342_height=$34',
 'f342_maplo=$39','f342_maphi=$3a','f342_collo=$3b','f342_colhi=$3c',
 'f342_stride_lo=$3d','f342_stride_hi=$3e',
 'f342_bg=$3f','f342_border=$40','f342_edge=$41','f342_tmpfine=$42'
 ].join('\n');
 src=once(src,'start\n sei','start\n sei','startup'); // deliberate early source integrity check
 src=once(src,'tmp_x=$28\n','tmp_x=$28\n'+zp+'\n','ZP layout');
 src=once(src,' sta $d020\n lda camera_x\n sta pending_x\n lda camera_y\n sta pending_y',
  ' sta $d020\n lda #$00\n sta f342_index\n sta f342_pending\n sta f342_switching\n jsr frame342_load\n lda pending_x\n sta camera_x\n lda pending_y\n sta camera_y\n lda next_fx\n sta fine_x\n lda next_fy\n sta fine_y',
  'initial frame load');
 src=once(src,' sta $d019\n',' sta $d019\n jsr frame342_tick\n','frame timer IRQ');
 src=once(src,'main_loop\n lda prep_request',
  'main_loop\n jsr frame342_stage\n lda prep_request','frame stage main');
 src=once(src,'irq_tick\n inc tick_lo',
  'irq_tick\n lda f342_pending\n ora f342_switching\n bne irq_group\n inc tick_lo','tick gated by frame change');
 var m=/tick_check\n lda tick_hi\n cmp #\$[0-9a-f]{2}\n bne irq_group\n lda tick_lo\n cmp #\$[0-9a-f]{2}\n bne irq_group/;
 if(!m.test(src))throw Error('TEST342: contrato del contador IRQ de scroll modificado.');
 src=src.replace(m,'tick_check\n lda tick_hi\n cmp f342_tickhi\n bne irq_group\n lda tick_lo\n cmp f342_ticklo\n bne irq_group');
 src=once(src,' jsr swap_screens\n lda pending_x',
  ' jsr swap_screens\n jsr frame342_commit\n lda pending_x','commit atomico frame');
 src=segment(src,'\nplan_step\n','\nrender_to_dst\n','\n'+planStep()+'\n','cuatro direcciones plan_step');
 src=once(src,' inc src_col\n lda src_col\n cmp #'+byte(d.areaWidth),
  ' inc src_col\n lda src_col\n cmp f342_width','ancho variable');
 src=once(src,' inc row_id\n lda row_id\n cmp #'+byte(d.areaHeight),
  ' inc row_id\n lda row_id\n cmp f342_height','alto variable');
 src=once(src,'apply_fine\n lda fine_x\n and #$07\n ora #'+byte(d.edgeMask?0:8)+'\n sta $d016\n lda fine_y\n and #$07\n ora #'+byte(d.edgeMask?0x10:0x18)+'\n sta $d011\n rts',
  'apply_fine\n lda fine_x\n and #$07\n ora f342_edge\n sta $d016\n lda fine_y\n and #$07\n ora #$10\n ora f342_edge\n sta $d011\n rts','mask frame');
 var zeros=new Array(plan.maxHeight).fill(0);
 var extra=runtime(fs.length)+'\n'+metadata(plan)+'\n'+[
  table('world_rows_lo',zeros),table('world_rows_hi',zeros),
  table('color_rows_lo',zeros),table('color_rows_hi',zeros)
 ].join('\n')+'\n';
 src=segment(src,'world_rows_lo\n','prepare_sparse_colors203\n',extra,'tablas de filas variables (preserva rutinas de color TEST203)');
 var extraMap=fs.slice(1).map(function(f,i){return 'world_map_frame342_'+(i+1)+'\n'+bytes(f.map);}).join('\n');
 var extraColors=fs.slice(1).map(function(f,i){return 'world_colors_frame342_'+(i+1)+'\n'+bytes(f.colors);}).join('\n');
 src=once(src,'*=$7000\nworld_color_data',extraMap+'\n*=$7000\nworld_color_data','empaquetado mapas');
 src=once(src,'*=$a000\ngroup182_pending',extraColors+'\n*=$a000\ngroup182_pending','empaquetado colores');
 return src;
}
function assemble(self,src){
 var a=window.g_app&&window.g_app.assembler;if(!a)throw Error('TEST342: ensamblador LVLLVL no disponible.');
 var r=a.assemble(src,0x0801);
 if(!r||!r.success)throw Error('TEST342 ASM: '+((r&&r.errors)||[]).map(function(e){return e.message||String(e);}).join(' | '));
 var mem=a.getMemory(),result=new Uint8Array(2+r.end-r.start);
 result[0]=r.start&255;result[1]=r.start>>8;
 for(var i=r.start;i<r.end;i++)result[2+i-r.start]=mem[i]&255;
 return result;
}

var audit={version:363,last:'READY',lastError:null,lastPlan:null,lastRoute:'UNCHANGED',delegations:0};
function hasGroupOrIndividual(self){
 var layer=self&&self.editor&&self.editor.layers&&self.editor.layers.getSelectedLayerObject&&self.editor.layers.getSelectedLayerObject();
 var ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!ts)return false;
 var record=ts.getDocRecord&&ts.getDocRecord(),store=record&&record.data||{},groups=store.ricoGroupAnimationsV1||{};
 if((groups.bank1||[]).some(function(g){return g&&g.type;})||(groups.bank2||[]).some(function(g){return g&&g.type;}))return true;
 var banks=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
 return banks.some(function(bank){return bank&&bank.some(function(tile){
  var animated=tile&&tile.props&&tile.props.animated;
  return animated&&animated!=='none';
 });});
}
function candidate(self,args){
 var ed=self&&self.editor,fs=ed&&ed.graphic&&ed.graphic.frames||[];
 if(fs.length<2)return false;
 var layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
 var mode=layer&&layer.getScreenMode&&layer.getScreenMode();
 if(mode!=='textmode'&&mode!=='standard'&&mode!=='text')return false;
 if(!fs.some(function(f){return !isStill(f)&&!!dirs[f.ricoMapScrollV1.type];}))return false;
 if(!fs.every(function(f){return isStill(f)||!!dirs[f.ricoMapScrollV1.type];}))return false;
 // Preserve TEST354 handling of 40x25 output from a narrower scroll area.
 if(fs.some(function(f){var a=f&&f.ricoScrollAreaV1;return a&&(a.width<40||a.height<25);}))return false;
 // These cases need other compositors. Keep existing routing unchanged,
 // without silently dropping SID/group/individual effects or video modes.
 var sid=window.RICO_TEST207_ORIGINAL_SID;
 if(args&&(args.sidData||args.music==='sid'||args.music==='yes')||
    (sid&&sid.getState&&sid.getState()&&sid.getState().enabled)||
    hasGroupOrIndividual(self))return false;
 return true;
}
ToPRGAdv.prototype.createPRG=function(args){
 if(!candidate(this,args||{})){
  audit.lastRoute='PREVIOUS EXPORTER';audit.delegations++;
  return prior.apply(this,arguments);
 }
 try{
  audit.last='BUILDING';audit.lastRoute='TEST363 diagonal multiframe';audit.lastError=null;
  var data=collect(this),src=build(data),prg=assemble(this,src);
  this.prg=prg;
  audit.lastPlan={frameCount:data.frames.length,bytesPerBank:data.bytesPerBank,
   directions:data.frames.map(function(f){return f.still?'STILL':f.direction;}),
   durations:data.frames.map(function(f){return f.duration;}),
   banks:data.frames.map(function(f){return f.bank;}),
   pixels:data.frames.map(function(f){return f.pixels;}),
   memory:{maps:'$4000-'+word(0x4000+data.bytesPerBank-1),
           colors:'$7000-'+word(0x7000+data.bytesPerBank-1)}};
  audit.last='ASSEMBLED';
  if(args&&args.download===false)return prg;
  var name=args&&args.filename||'RICO_DIAGONAL_MULTIFRAME.prg';
  if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw Error('TEST363: download() unavailable.');
  window.download(prg,name,'application/prg');
  return prg;
 }catch(e){
  audit.last='ERROR';audit.lastError=String(e&&e.message||e);
  console.error(tag,'Export failed',e);
  if(typeof window.alert==='function')window.alert('TEST363 diagonal multiframe: '+audit.lastError);
  return false;
 }
};
window.RICO_TEST363_DIAGONAL_MULTIFRAME={
 version:363,collect:collect,build:build,candidate:candidate,state:audit,
 inspect:function(){return audit.lastPlan;}
};
console.log(tag,'Recovered TEST342 multiframe diagonal kernel; TEST362 and other engines unchanged.');
})();