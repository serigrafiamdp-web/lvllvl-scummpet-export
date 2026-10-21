(function(){
'use strict';
// TEST205: multiframe Left/Right player, built on TEST203's tested color pipeline.
// A separate wrapper: single-frame exporter is never modified.
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST186_HORIZONTAL){console.error('[TEST205] TEST203 horizontal engine missing');return;}
var oldExport=ToPRGAdv.prototype.createPRG, H=window.RICO_TEST186_HORIZONTAL;
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function byteLine(arr){var lines=[];for(var i=0;i<arr.length;i+=16)lines.push('!byte '+arr.slice(i,i+16).map(h).join(','));return lines.join('\n');}
function onlyOnce(src,oldText,newText){
 var a=src.indexOf(oldText),b=a>=0?src.indexOf(oldText,a+oldText.length):-1;
 if(a<0||b>=0)throw new Error('TEST205: ancla del motor TEST203 cambiada: '+oldText.slice(0,75));
 return src.slice(0,a)+newText+src.slice(a+oldText.length);
}
function virtualCollect(self,i){
 var ed=self.editor,realGraphic=ed.graphic,fr=realGraphic.frames[i],layer=ed.layers.getSelectedLayerObject();
 var g=Object.create(realGraphic);g.frames=[fr];
 var l=Object.create(layer);
 l.getCell=function(pos){return layer.getCell.call(layer,Object.assign({},pos,{frame:i}));};
 if(typeof layer.getBorderColor==='function')l.getBorderColor=function(){return layer.getBorderColor.call(layer,i);};
 if(typeof layer.getBackgroundColor==='function')l.getBackgroundColor=function(){return layer.getBackgroundColor.call(layer,i);};
 var ls=Object.create(ed.layers);ls.getSelectedLayerObject=function(){return l;};
 var editor=Object.create(ed);editor.graphic=g;editor.layers=ls;
 var holder=Object.create(self);holder.editor=editor;
 var result=H.collect(holder);
 var dur=12;
 try{dur=realGraphic.getFrameDuration(i);}catch(e){dur=fr&&fr.duration;}
 dur=Number(dur);
 if(!Number.isInteger(dur)||dur<1)dur=12;
 if(dur>1024)dur=1024;
 result.duration=dur;
 return result;
}
function collect205(self){
 var ed=self.editor,frames=ed&&ed.graphic&&ed.graphic.frames||[];
 if(frames.length<2||frames.length>255)throw new Error('TEST205: se requieren de 2 a 255 frames (indice C64 de 8 bits).');
 var data=frames.map(function(f,i){return virtualCollect(self,i);});
 var used=0,entry=[];
 for(var i=0;i<data.length;i++){
   var f=data[i],length=f.map.length;
   if(length!==f.colors.length)throw new Error('TEST205: mapa y colores deben tener la misma geometria.');
   if(f.type!=='left'&&f.type!=='right')throw new Error('TEST205: Frame '+(i+1)+' requiere Left o Right.');
   if(f.initialX<0||f.initialX>=f.areaWidth)throw new Error('TEST205: camera X inicial fuera del mapa.');
   // The two 12KB source banks are the actual memory constraint.
   if(used+length>0x3000)throw new Error('TEST205: '+frames.length+' frames requieren '+(used+length)+' bytes por banco; el limite de RAM para mapas y colores es 12288. No se descarta ninguna frame.');
   entry.push({map:0x4000+used,colors:0x7000+used,length:length});
   used+=length;
 }
 return {frames:data,entry:entry,bytesPerBank:used};
}
function tables205(frames,entry){
 var text=[],tb=function(label,getter){text.push(label,byteLine(frames.map(getter)));};
 tb('frame205_map_lo',function(f,i){return entry[i].map&255;});
 tb('frame205_map_hi',function(f,i){return entry[i].map>>8;});
 tb('frame205_color_lo',function(f,i){return entry[i].colors&255;});
 tb('frame205_color_hi',function(f,i){return entry[i].colors>>8;});
 tb('frame205_start_x',function(f){return f.initialX;});
 tb('frame205_width',function(f){return f.areaWidth;});
 tb('frame205_stride_lo',function(f){return f.srcStride&255;});
 tb('frame205_stride_hi',function(f){return f.srcStride>>8;});
 tb('frame205_pixels',function(f){return f.pixels;});
 tb('frame205_ticks_lo',function(f){return f.ticks&255;});
 tb('frame205_ticks_hi',function(f){return f.ticks>>8;});
 tb('frame205_duration_lo',function(f){return f.duration&255;});
 tb('frame205_duration_hi',function(f){return f.duration>>8;});
 tb('frame205_dir',function(f){return f.type==='right'?1:0;});
 tb('frame205_fine',function(f){return f.type==='right'?0:7;});
 tb('frame205_charset',function(f){return f.bank===2?0x0e:0x0c;});
 tb('frame205_bg',function(f){return f.bg;});
 tb('frame205_border',function(f){return f.border;});
 return text.join('\n');
}
function actions205(count){
 var a=[
 'load_frame205',
 ' ldx frame_index205',
 ' lda frame205_map_lo,x',' sta world_map_lo205',
 ' lda frame205_map_hi,x',' sta world_map_hi205',
 ' lda frame205_color_lo,x',' sta world_col_lo205',
 ' lda frame205_color_hi,x',' sta world_col_hi205',
 ' lda frame205_start_x,x',' sta camera_x',
 ' lda frame205_width,x',' sta area_width205',
 ' lda frame205_stride_lo,x',' sta stride_lo205',
 ' lda frame205_stride_hi,x',' sta stride_hi205',
 ' lda frame205_pixels,x',' sta speed205',
 ' lda frame205_ticks_lo,x',' sta period_lo205',
 ' lda frame205_ticks_hi,x',' sta period_hi205',
 ' lda frame205_duration_lo,x',' sta duration_lo205',
 ' lda frame205_duration_hi,x',' sta duration_hi205',
 ' lda frame205_dir,x',' sta direction205',
 ' lda frame205_fine,x',' sta fine_pos',
 ' lda frame205_charset,x',' sta charset_bits',
 ' lda #$00',' sta step_tick_lo',' sta step_tick_hi',
 ' rts',
 'commit_frame205',
 ' ldx frame_index205',
 ' lda frame205_bg,x',' sta $d021',
 ' lda frame205_border,x',' sta $d020',
 ' rts',
 'duration_tick205',
 ' lda duration_lo205',' bne duration_dec_lo205',
 ' lda duration_hi205',' beq duration_next205',
 ' dec duration_hi205',
 ' dec duration_lo205',
 ' jmp duration_done205',
 'duration_dec_lo205',
 ' dec duration_lo205',
 ' bne duration_done205',
 ' lda duration_hi205',
 ' bne duration_done205',
 'duration_next205',
 ' inc frame_index205',
 ' lda frame_index205',' cmp #'+h(count),
 ' bne duration_keep_index205',
 ' lda #$00',' sta frame_index205',
 'duration_keep_index205',
 ' jsr load_frame205',
 ' lda #$01',' sta frame_request205',' sta prep_request',
 ' lda #$00',' sta prep_ready',
 'duration_done205',' rts'
 ];
 return a.join('\n');
}
function build205(d){
 var fs=d.frames,first=Object.assign({},fs[0],{multicolor:true});
 // TEST203 is reused; it already handles Group Scroll & sparse color patches.
 var src=H.build(first);
 function change(a,b){src=onlyOnce(src,a,b);}
 var zp=[
 'frame_index205=$22','frame_request205=$23','duration_lo205=$24','duration_hi205=$25',
 'world_map_lo205=$26','world_map_hi205=$27',
 'world_col_lo205=$28','world_col_hi205=$29',
 'stride_lo205=$2a','stride_hi205=$2b',
 'area_width205=$2c','speed205=$2d',
 'period_lo205=$2e','period_hi205=$2f','direction205=$30'
 ].join('\n');
 change('color_dst_hi=$21\n','color_dst_hi=$21\n'+zp+'\n');
 // Existing init remains byte-for-byte aside from adding the new parameters.
 change(' lda #$04\n sta dst_hi\n jsr render_to_dst',
  ' lda #$00\n sta frame_index205\n sta frame_request205\n jsr load_frame205\n jsr commit_frame205\n lda #$04\n sta dst_hi\n jsr render_to_dst');
 // The next frame waits for the existing TEST203 deferred prepare/render path.
 change('irq_map_step\n inc step_tick_lo',
  'irq_map_step\n jsr duration_tick205\n lda frame_request205\n beq duration_continue205\n jmp irq_only_group\nduration_continue205\n inc step_tick_lo');
 change('cmp #'+h(first.ticks>>8)+'\n bne irq_tick_wait',
  'cmp period_hi205\n bne irq_tick_wait');
 change('cmp #'+h(first.ticks&255)+'\n beq irq_tick_fire',
  'cmp period_lo205\n beq irq_tick_fire');
 // TEST203's color patches are committed before the screen pointer swap.
 change('jsr swap_screens\n jsr apply_horizontal',
  'jsr swap_screens\n lda frame_request205\n beq frame205_normal_swap\n jsr commit_frame205\n lda #$00\n sta frame_request205\nframe205_normal_swap\n jsr apply_horizontal');
 var tickHead='irq_tick_fire\n lda #$00\n sta step_tick_lo\n sta step_tick_hi\n';
 var left=' lda fine_pos\n sec\n sbc speed205\n bcc irq_boundary_left205\n sta fine_pos\n jsr apply_horizontal\n jmp irq_only_group\nirq_boundary_left205\n clc\n adc #$08\n sta fine_pos\n inc camera_x\n lda camera_x\n cmp area_width205\n bcc irq_queue\n lda #$00\n sta camera_x\n jmp irq_queue';
 var right=' lda fine_pos\n clc\n adc speed205\n cmp #$08\n bcs irq_boundary_right205\n sta fine_pos\n jsr apply_horizontal\n jmp irq_only_group\nirq_boundary_right205\n sec\n sbc #$08\n sta fine_pos\n lda camera_x\n bne irq_right_dec205\n lda area_width205\n sec\n sbc #$01\n sta camera_x\n jmp irq_queue\nirq_right_dec205\n dec camera_x';
 var tickCode=tickHead+' lda direction205\n beq irq_dir_left205\n jmp irq_dir_right205\nirq_dir_left205\n'+left+'\nirq_dir_right205\n'+right+'\n';
 var start=src.indexOf('irq_tick_fire\n'),end=src.indexOf('irq_queue\n',start);
 if(start<0||end<0||end<=start)throw new Error('TEST205: no se encuentra el codigo de Pixels/Step TEST203.');
 src=src.slice(0,start)+tickCode+src.slice(end);
 // Render screen+shadow color from the currently selected frame's own data.
 change('lda #<world_map_data\n sta src_lo\n lda #>world_map_data\n sta src_hi',
        'lda world_map_lo205\n sta src_lo\n lda world_map_hi205\n sta src_hi');
 change('lda #<world_colors\n sta color_src_lo\n lda #>world_colors\n sta color_src_hi',
        'lda world_col_lo205\n sta color_src_lo\n lda world_col_hi205\n sta color_src_hi');
 change('adc #'+h(first.srcStride&255)+'\n sta src_lo\n lda src_hi\n adc #'+h(first.srcStride>>8),
        'adc stride_lo205\n sta src_lo\n lda src_hi\n adc stride_hi205');
 change('adc #'+h(first.srcStride&255)+'\n sta color_src_lo\n lda color_src_hi\n adc #'+h(first.srcStride>>8),
        'adc stride_lo205\n sta color_src_lo\n lda color_src_hi\n adc stride_hi205');
 var code205=actions205(fs.length)+'\n'+tables205(fs,d.entry)+'\n';
 change('*=$3000\ncharset_bank1',code205+'*=$3000\ncharset_bank1');
 // Data banks $4000-$6FFF (map) and $7000-$9FFF (color).
 var extraMap=fs.slice(1).map(function(f,i){return 'world_map_frame205_'+(i+1)+'\n'+byteLine(f.map);}).join('\n');
 var extraColors=fs.slice(1).map(function(f,i){return 'world_colors_frame205_'+(i+1)+'\n'+byteLine(f.colors);}).join('\n');
 change('*=$7000\nworld_colors',extraMap+'\n*=$7000\nworld_colors');
 change('*=$a000\ngroup182_pending',extraColors+'\n*=$a000\ngroup182_pending');
 // A real Group Scroll uses another label immediately after $a000.
 // The fallback replacement above handles the no-group case only.
 return src;
}
function assemble205(self,src){
 var a=g_app&&g_app.assembler;if(!a)throw new Error('Ensamblador LVLLVL no disponible.');
 var r=a.assemble(src,0x0801);
 if(!r||!r.success)throw new Error('TEST205 ASM: '+((r&&r.errors)||[]).map(function(e){return e.message||String(e);}).join(' | '));
 var mem=a.getMemory(),data=new Uint8Array(2+r.end-r.start);
 data[0]=r.start&255;data[1]=(r.start>>8)&255;
 for(var i=r.start;i<r.end;i++)data[2+i-r.start]=mem[i]&255;
 self.prg=data;return data;
}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,fs=ed&&ed.graphic&&ed.graphic.frames||[],cfg=fs[0]&&fs[0].ricoMapScrollV1||{},width=ed&&ed.graphic&&ed.graphic.getGridWidth&&ed.graphic.getGridWidth();
 if(fs.length<2||width<=40||cfg.type!=='left'&&cfg.type!=='right')return oldExport.apply(this,arguments);
 try{
  var d=collect205(this),src=build205(d),prg=assemble205(this,src);
  args=args||{};
  if(args.download===false)return prg;
  var name=args.filename||'rico-horizontal-multiframe-test205.prg';if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw new Error('window.download no disponible');
  window.download(prg,name,'application/prg');
  return prg;
 }catch(err){
  window.RICO_TEST205_LAST_ERROR=err.message;
  console.error('[RICO TEST205] Multi-frame Left/Right export failed:',err);
  if(typeof window.alert==='function')window.alert('Rico TEST205 — exportacion: '+err.message);
  return false;
 }
};
window.RICO_TEST205_HORIZONTAL_MULTIFRAME={collect:collect205,build:build205,baseSingleFrame:oldExport};
console.log('[RICO TEST205] Horizontal Left/Right multi-frame exporter ready; TEST203 single-frame untouched.');
})();