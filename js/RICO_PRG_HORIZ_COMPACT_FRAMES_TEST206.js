(function(){
'use strict';
// TEST206 compact multi-frame store: single-copy character rows + 4-bit packed colors.
// TEST205 remains the original driver for projects whose doubled rows already fit.
// Working buffers: $4000-$53ff (map), $5400-$67ff (colors), each <= 4800 B.
// Packed banks: $6800-$9fff, $b000-$cfff, $e000-$feff (skip group and vectors).
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST205_HORIZONTAL_MULTIFRAME){
 console.error('[RICO TEST206] Requires TEST205 multi-frame exporter');return;
}
var previous=ToPRGAdv.prototype.createPRG,engine=window.RICO_TEST205_HORIZONTAL_MULTIFRAME;
var POOLS=[{start:0x6800,end:0xa000},{start:0xb000,end:0xd000},{start:0xe000,end:0xff00}];
function b2(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function b4(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function lines(bytes){
 var out=[];for(var i=0;i<bytes.length;i+=16)out.push('!byte '+bytes.slice(i,i+16).map(b2).join(','));
 return out.join('\n');
}
function swapOne(s,oldText,replacement){
 var i=s.indexOf(oldText);
 if(i<0||s.indexOf(oldText,i+oldText.length)>=0)throw new Error('TEST206: anchor changed: '+oldText.slice(0,90));
 return s.slice(0,i)+replacement+s.slice(i+oldText.length);
}
function compactFrame(d){
 var w=d.areaWidth;
 if(w<40||w>96||d.map.length!==w*50||d.colors.length!==w*50)throw new Error('TEST206: ancho/filas de mapa no contemplados.');
 var m=[],c=[],stride=Math.ceil(w/2);
 for(var row=0;row<25;row++){
  var off=row*w*2;
  for(var x=0;x<w;x++)m.push(d.map[off+x]&255);
  for(var cx=0;cx<w;cx+=2){
    var c0=d.colors[off+cx]&15,c1=cx+1<w?d.colors[off+cx+1]&15:0;
    c.push(c0|(c1<<4));
  }
 }
 return {map:m,color:c,colorStride:stride};
}
function allocate(frames){
 var pools=POOLS.map(function(x){return{x:x.start,end:x.end,ptr:x.start};}),all=[];
 function alloc(bytes,label){
  var p=null;
  for(var i=0;i<pools.length;i++)if(pools[i].end-pools[i].ptr>=bytes.length){p=pools[i];break;}
  if(!p)throw new Error('TEST206 RAM completa: los '+frames.length+' frames compactos ocupan mas que las zonas disponibles. Probá menos frames, reducir Scroll Area o compartir dibujos. No se elimina ninguna frame.');
  var result={address:p.ptr,bytes:bytes,label:label};p.ptr+=bytes.length;all.push(result);return result;
 }
 var refs=[];
 for(var f=0;f<frames.length;f++){
  var packed=compactFrame(frames[f]);
  refs.push({map:alloc(packed.map,'frame206_map_'+f),color:alloc(packed.color,'frame206_colors_'+f),colorStride:packed.colorStride});
 }
 return{refs:refs,entries:all,free:pools.reduce(function(s,x){return s+x.end-x.ptr;},0)};
}
function synthCollect(self){
 var ed=self.editor,fs=ed&&ed.graphic&&ed.graphic.frames||[];
 if(fs.length<2||fs.length>255)throw new Error('TEST206 requiere entre 2 y 255 frames para indexarlas en el C64.');
 // The existing TEST205 collector deliberately has a small 12KB total limit.
 // Reuse its precisely tested *per-frame* camera/data collection by providing
 // a one-frame virtual graphic for each frame, as in TEST205.
 var layer=ed.layers.getSelectedLayerObject(),gr=ed.graphic,result=[],input=H();
 for(var n=0;n<fs.length;n++){
  var frame=fs[n],current=frame,t=frame.ricoMapScrollV1&&frame.ricoMapScrollV1.type;
  var still=!t;
  if(t&&t!=='left'&&t!=='right')throw new Error('TEST206: frame '+(n+1)+' requiere scroll Left/Right o OFF; no se exporta otro efecto silenciosamente.');
  if(still){
   var w=frame.ricoWindowDimensionV1||{};
   if(w.width!==40||w.height!==25)w={x:0,y:0,width:40,height:25};
   var area=frame.ricoScrollAreaV1||{};
   if(area.width<40||area.height<25)area={x:w.x||0,y:w.y||0,width:40,height:25};
   current=Object.assign({},frame,{ricoMapScrollV1:{type:'right',pixelsPerStep:1,ticksPerStep:1},ricoWindowDimensionV1:w,ricoScrollAreaV1:area});
  }
  var g=Object.create(gr);g.frames=[current];
  var l=Object.create(layer);
  l.getCell=function(index){return layer.getCell.call(layer,Object.assign({},index,{frame:this.__rico206Frame}));};
  l.__rico206Frame=n;
  if(layer.getBackgroundColor)l.getBackgroundColor=function(){return layer.getBackgroundColor.call(layer,this.__rico206Frame);};
  if(layer.getBorderColor)l.getBorderColor=function(){return layer.getBorderColor.call(layer,this.__rico206Frame);};
  var ls=Object.create(ed.layers);ls.getSelectedLayerObject=function(){return l;};
  var vEd=Object.create(ed);vEd.graphic=g;vEd.layers=ls;
  var v=Object.create(self);v.editor=vEd;
  var d=input.collect(v);
  if(still){d.type='right';d.pixels=0;}
  var duration=12;try{duration=gr.getFrameDuration(n);}catch(e){duration=frame.duration;}
  duration=Number(duration);if(!Number.isInteger(duration)||duration<1)duration=12;
  if(duration>1024)duration=1024;
  d.duration=duration;
  result.push(d);
 }
 return result;
}
function H(){var h=window.RICO_TEST186_HORIZONTAL;if(!h||!h.collect)throw new Error('Falta motor horizontal TEST203.');return h;}
function memoryStats(frames){
 var doubled=0;for(var i=0;i<frames.length;i++)doubled+=frames[i].map.length;
 return doubled;
}
function sourceLoader206(refs){
 var out=[
 'u_srcmap_lo=$60','u_srcmap_hi=$61','u_srccol_lo=$62','u_srccol_hi=$63',
 'u_dstmap_lo=$64','u_dstmap_hi=$65','u_dstcol_lo=$66','u_dstcol_hi=$67',
 'u_width=$68','u_colorstride=$69','u_stride_lo=$6a','u_stride_hi=$6b',
 'u_rows=$6c','u_char=$6d','u_color=$6e'
 ];
 var add=function(){for(var i=0;i<arguments.length;i++)out.push(arguments[i]);};
 add('unpack_frame206',
 ' ldx frame_index205',
 ' lda frame206_map_lo,x',' sta u_srcmap_lo',
 ' lda frame206_map_hi,x',' sta u_srcmap_hi',
 ' lda frame206_color_lo,x',' sta u_srccol_lo',
 ' lda frame206_color_hi,x',' sta u_srccol_hi',
 ' lda frame205_width,x',' sta u_width',
 ' lda frame206_colorstride,x',' sta u_colorstride',
 ' lda frame205_stride_lo,x',' sta u_stride_lo',
 ' lda frame205_stride_hi,x',' sta u_stride_hi',
 ' lda #<world_map_data',' sta u_dstmap_lo',
 ' lda #>world_map_data',' sta u_dstmap_hi',
 ' lda #<world_colors',' sta u_dstcol_lo',
 ' lda #>world_colors',' sta u_dstcol_hi',
 ' lda #$19',' sta u_rows',
 'unpack_row206',' ldx #$00',
 'unpack_col206',
 ' txa',' tay',' lda (u_srcmap_lo),y',' sta u_char',
 ' sta (u_dstmap_lo),y',
 ' txa',' clc',' adc u_width',' tay',
 ' lda u_char',' sta (u_dstmap_lo),y',
 ' txa',' lsr',' tay',' lda (u_srccol_lo),y',' sta u_color',
 ' txa',' and #$01',' beq unpack_even206',
 ' lda u_color',' lsr',' lsr',' lsr',' lsr',' jmp unpack_color_done206',
 'unpack_even206',' lda u_color',' and #$0f',
 'unpack_color_done206',' sta u_color',
 ' txa',' tay',' lda u_color',' sta (u_dstcol_lo),y',
 ' txa',' clc',' adc u_width',' tay',
 ' lda u_color',' sta (u_dstcol_lo),y',
 ' inx',' cpx u_width',' beq unpack_row_done206',
 ' jmp unpack_col206',
 'unpack_row_done206',
 ' clc',' lda u_srcmap_lo',' adc u_width',' sta u_srcmap_lo',
 ' lda u_srcmap_hi',' adc #$00',' sta u_srcmap_hi',
 ' clc',' lda u_srccol_lo',' adc u_colorstride',' sta u_srccol_lo',
 ' lda u_srccol_hi',' adc #$00',' sta u_srccol_hi',
 ' clc',' lda u_dstmap_lo',' adc u_stride_lo',' sta u_dstmap_lo',
 ' lda u_dstmap_hi',' adc u_stride_hi',' sta u_dstmap_hi',
 ' clc',' lda u_dstcol_lo',' adc u_stride_lo',' sta u_dstcol_lo',
 ' lda u_dstcol_hi',' adc u_stride_hi',' sta u_dstcol_hi',
 ' dec u_rows',' beq unpack_end206',
 ' jmp unpack_row206',
 'unpack_end206',' rts');
 function table(label,method){add(label,lines(refs.map(method)));}
 table('frame206_map_lo',function(x){return x.map.address&255;});
 table('frame206_map_hi',function(x){return x.map.address>>8;});
 table('frame206_color_lo',function(x){return x.color.address&255;});
 table('frame206_color_hi',function(x){return x.color.address>>8;});
 table('frame206_colorstride',function(x){return x.colorStride;});
 return out.join('\n');
}
function build206(data){
 var frames=data.frames,packed=data.packed;
 var fake={frames:frames,entry:frames.map(function(f){return {map:0x4000,colors:0x5400,length:f.map.length};})};
 var src=engine.build(fake);
 // The old 12KB buffers are now only ONE frame's shared work area.
 var maximum=frames.reduce(function(n,f){return Math.max(n,f.map.length);},0);
 if(maximum>0x1400)throw new Error('TEST206: el buffer 2x excede los 5 KB disponibles.');
 var empty=Array(maximum).fill(0);
 var mapData='*=$4000\nworld_map_data\n'+lines(empty)+'\n';
 var colorData='*=$5400\nworld_colors\n'+lines(empty)+'\n';
 var mapStart=src.indexOf('*=$4000\nworld_map_data\n'),colorStart=src.indexOf('*=$7000\nworld_colors\n'),groupStart=src.indexOf('*=$a000\n');
 if(mapStart<0||colorStart<0||groupStart<0||!(mapStart<colorStart&&colorStart<groupStart))throw new Error('TEST206: bancos del motor TEST205 no identificados.');
 src=src.slice(0,mapStart)+mapData+colorData+src.slice(groupStart);
 // Decode the current compact frame BEFORE preparing the 40x25 hidden screen.
 src=swapOne(src,'jsr load_frame205\n jsr commit_frame205',
  'jsr load_frame205\n jsr unpack_frame206\n jsr commit_frame205');
 src=swapOne(src,'lda back_hi\n sta dst_hi\n jsr render_to_dst',
  'lda frame_request205\n beq frame206_already_unpacked\n jsr unpack_frame206\nframe206_already_unpacked\n lda back_hi\n sta dst_hi\n jsr render_to_dst');
 // Frame map/color pointers already refer to the shared working $4000/$5400.
 src=swapOne(src,'*=$3000\ncharset_bank1',
  sourceLoader206(packed.refs)+'\n*=$3000\ncharset_bank1');
 // Packed resources live in the free RAM banks, never in the group at $A000/$A800.
 var blobs=packed.entries.slice().sort(function(a,b){return a.address-b.address;});
 var resources=blobs.map(function(x){return '*='+b4(x.address)+'\n'+x.label+'\n'+lines(x.bytes);}).join('\n')+'\n';
 src+=resources;
 return src;
}
function assemble206(self,asm){
 var a=g_app&&g_app.assembler;if(!a)throw new Error('Falta ensamblador LVLLVL.');
 var r=a.assemble(asm,0x0801);
 if(!r||!r.success)throw new Error('TEST206 assembler: '+((r&&r.errors)||[]).map(function(e){return e.message||String(e);}).join(' | '));
 var mem=a.getMemory(),prg=new Uint8Array(2+r.end-r.start);
 prg[0]=r.start&255;prg[1]=(r.start>>8)&255;
 for(var i=r.start;i<r.end;i++)prg[2+i-r.start]=mem[i]&255;
 self.prg=prg;return prg;
}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,frames=ed&&ed.graphic&&ed.graphic.frames||[],dim=ed&&ed.graphic;
 var active=frames.some(function(f){var type=f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;return type==='left'||type==='right';});
 if(frames.length<2||(!active)||(dim.getGridWidth()<=40&&dim.getGridHeight()<=25))return previous.apply(this,arguments);
 try {
  var d=synthCollect(this),doubled=memoryStats(d);
  // Keep exactly the existing TEST205 binary path when its 12KB duplicated
  // buffers fit. This is important for users with previous PASS projects.
  if(doubled<=0x3000)return previous.apply(this,arguments);
  var packed=allocate(d);
  var source=build206({frames:d,packed:packed}),out=assemble206(this,source);
  args=args||{};
  if(args.download===false)return out;
  var name=args.filename||'rico-horizontal-compact-test206.prg';
  if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw new Error('No esta disponible window.download.');
  window.download(out,name,'application/prg');
  return out;
 }catch(e){
  window.RICO_TEST206_LAST_ERROR=e.message;
  console.error('[RICO TEST206] Compact multi-frame export failed:',e);
  if(typeof window.alert==='function')window.alert('Rico TEST206 — exportacion: '+e.message);
  return false;
 }
};
window.RICO_TEST206_COMPACT_FRAMES={collect:synthCollect,pack:allocate,build:build206,compactFrame:compactFrame,pools:POOLS};
console.log('[RICO TEST206] Compact multi-frame bank: 4-bit colors, single-copy frames; fallback to TEST205 when 12KB permits.');
})();