/* TEST343 — EBCM + native multiframe timing (via TEST342 validated frame player).
   Converts only the export copy. No editor/JSON mutation, no source tile replacement.
   40x25 static frames, shared 64-glyph charset, 4 physical ECM backgrounds/frame.
*/
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST342_DIAGONAL_MULTIFRAME){
 console.warn('[TEST343] TEST342 runtime missing');return;
}
var prior=ToPRGAdv.prototype.createPRG;
var core=window.RICO_TEST342_DIAGONAL_MULTIFRAME;
function hex(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function one(src,from,to,what){
 var i=src.indexOf(from);if(i<0||src.indexOf(from,i+from.length)!==-1)
  throw Error('TEST343 ASM: '+what+' no encontrado o duplicado.');
 return src.slice(0,i)+to+src.slice(i+from.length);
}
function modeIsECM(layer){
 var mode=layer.getScreenMode&&layer.getScreenMode();
 return mode==='c64ecm'||(typeof TextModeEditor!=='undefined'&&mode===TextModeEditor.Mode.C64ECM);
}
function noAnimation(ts){
 var rec=ts.getDocRecord&&ts.getDocRecord(),store=rec&&rec.data||{},gs=store.ricoGroupAnimationsV1||{};
 if((gs.bank1||[]).some(g=>g&&g.type)||(gs.bank2||[]).some(g=>g&&g.type))
  throw Error('TEST343: hay Group Animate configurado; todavía no está unido al reproductor EBCM multiframe.');
 var banks=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
 banks.forEach(function(tiles){
  if(tiles&&tiles.some(function(t){var a=t&&t.props&&t.props.animated;return a&&a!=='none';}))
   throw Error('TEST343: hay caracteres individuales animados. Se requiere otro scheduler; no se omite.');
 });
}
function prepare(self,args){
 var ed=self.editor,graphic=ed.graphic,layer=ed.layers.getSelectedLayerObject(),
     frames=graphic.frames||[],ts=layer.getTileSet();
 if(frames.length<2||frames.length>12)throw Error('TEST343: este banco de memoria permite 2–12 frames de 40×25; el proyecto tiene '+frames.length+'.');
 if(graphic.getGridWidth()!==40||graphic.getGridHeight()!==25)
  throw Error('TEST343: esta prueba es para animaciones EBCM de 40×25, sin Map Scroll.');
 if(frames.some(f=>f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type))
  throw Error('TEST343: Map Scroll activo. Esa combinación necesita otra ruta; no se eliminará.');
 if(args&&(args.sidData||args.music==='sid'))throw Error('TEST343: SID solicitado; no se descartará audio.');
 var sid=window.RICO_TEST207_ORIGINAL_SID&&window.RICO_TEST207_ORIGINAL_SID.getState&&window.RICO_TEST207_ORIGINAL_SID.getState();
 if(sid&&sid.enabled)throw Error('TEST343: SID activado en el editor; falta integración.');
 noAnimation(ts);
 if(!ts.tileData||ts.tileData.length<64)throw Error('TEST343: faltan glifos físicos 0–63.');
 // Avoid changing live layer mode; native TEST342 collector is used on a
 // temporary view to capture the same 9 frames, duration and cell colors.
 var virtualLayer=Object.create(layer);virtualLayer.getScreenMode=function(){return 'textmode';};
 var virtualLayers=Object.create(ed.layers);
 virtualLayers.getSelectedLayerObject=function(){return virtualLayer;};
 var virtualEditor=Object.create(ed);virtualEditor.layers=virtualLayers;
 var holder=Object.create(self);holder.editor=virtualEditor;
 var data=core.collect(holder),reports=[];
 var tsData=ts.tileData;
 function glyphPix(id){return tsData[id]&&tsData[id].data&&tsData[id].data[0];}
 for(var fi=0;fi<data.frames.length;fi++){
  var d=data.frames[fi],usedGlyphs=Object.create(null),map=[],colors=[],palettes=[];
  if(!d.still||d.map.length!==1000||d.colors.length!==1000)
   throw Error('TEST343: Frame '+(fi+1)+' no es una imagen estática 40×25.');
  for(var ry=0;ry<25;ry++){
   var row=[],freq=Object.create(null);
   for(var rx=0;rx<40;rx++){
    var cell=layer.getCell({x:rx,y:ry,frame:fi})||{},
        t=Number(cell.t),fg=Number(cell.fc),bg=Number(cell.bc);
    if(!Number.isInteger(t)||t<0||t>255||!Number.isInteger(fg)||fg<0||fg>15)
     throw Error('TEST343: tile o foreground inválido en frame '+(fi+1)+' X'+rx+' Y'+ry);
    if(!Number.isInteger(bg)||bg<0||bg>15)bg=Number(layer.getBackgroundColor(fi))&15;
    var id=t&63,pix=glyphPix(id);
    if(!pix||pix.length!==64)throw Error('TEST343: glifo físico '+id+' incompleto.');
    var solid=true;for(var q=0;q<64;q++)if(!pix[q]){solid=false;break;}
    if(!solid)freq[bg]=(freq[bg]||0)+1;
    usedGlyphs[id]=true;
    row.push({id:id,t:t,fg:fg,bg:bg,solid:solid,x:rx,y:ry});
   }
   var keys=Object.keys(freq).map(Number).sort(function(a,b){return freq[b]-freq[a]||a-b;});
   if(keys.length>4)throw Error('TEST343: frame '+(fi+1)+' fila '+ry+
      ' tiene '+keys.length+' fondos distintos sobre píxeles visibles; el C64 EBCM admite solo 4 por fila raster.');
   var bg0=Number(layer.getBackgroundColor(fi))&15;
   if(keys.length<4&&keys.indexOf(bg0)<0)keys.unshift(bg0);
   while(keys.length<4)keys.push(keys[keys.length-1]||0);
   palettes.push(keys);
   for(var ri=0;ri<40;ri++){
    var c=row[ri],slot=keys.indexOf(c.bg);
    if(slot<0){
     if(!c.solid)throw Error('TEST343: fondo sin índice físico en frame '+fi+' fila '+ry);
     slot=0; // all pixels are foreground; this background is never visible
    }
    map.push(c.id|(slot<<6));colors.push(c.fg);
   }
  }
  d.map=map;d.colors=colors;d.ecm343Rows=palettes;d.bg=palettes[0][0];d.edgeMask=false;
  reports.push({frame:fi+1,duration:d.duration,glyphs:Object.keys(usedGlyphs).length,
    paletteFirstRow:palettes[0],rasterPalettes:palettes.length});
 }
 return {data:data,reports:reports};
}
function build(info){
 var plan=info.data,fs=plan.frames,src=core.build(plan),extra=[];
 // VIC-II EBCM bit 6; TEST342's fine scroll writes D011 at frame updates.
 src=one(src,' ora #$10\n ora f342_edge\n sta $d011',
             ' ora #$10\n ora f342_edge\n ora #$40\n sta $d011','EBCM $D011');
 // Static 40x25: 40-column border and stable vertical scroll.
 src=one(src,'frame342_edge\n!byte '+fs.map(function(){return hex(0);}).join(','),
             'frame342_edge\n!byte '+fs.map(function(){return hex(8);}).join(','),'CSEL 40 columns');
 src=one(src,'frame342_fine_x\n!byte '+fs.map(function(){return hex(7);}).join(','),
             'frame342_fine_x\n!byte '+fs.map(function(){return hex(0);}).join(','),'horizontal centering');
 src=one(src,'frame342_fine_y\n!byte '+fs.map(function(){return hex(7);}).join(','),
             'frame342_fine_y\n!byte '+fs.map(function(){return hex(3);}).join(','),'vertical centering');
 // Run the existing tested TEST342 frame clock only at $FA. Use lightweight
 // raster interrupts at $30,$38,...,$F0 to change the 4 backgrounds per row.
 src=one(src,' lda #$fa\n sta $d012',' lda #$30\n sta $d012','first visible raster');
 src=one(src,' lda #<irq\n sta $fffe\n lda #>irq\n sta $ffff',
             ' lda #<frame343_irq\n sta $fffe\n lda #>frame343_irq\n sta $ffff','IRQ entry');
 src=one(src,' jsr frame342_load\n lda pending_x',
             ' jsr frame342_load\n jsr frame343_set_base\n lda pending_x','initial frame palette');
 src=one(src,' lda f342_border\n sta $d020\n lda #$00',
             ' lda f342_border\n sta $d020\n jsr frame343_set_base\n lda #$00','palette frame switch');
 var pal=[];
 for(var n=0;n<fs.length;n++){
  if(!fs[n].ecm343Rows||fs[n].ecm343Rows.length!==25)
   throw Error('TEST343: tabla raster de 25 filas incompleta en frame '+(n+1));
  for(var row=0;row<25;row++)pal.push(fs[n].ecm343Rows[row]);
 }
 if(pal.length>255)throw Error('TEST343: tablas raster superan 255 filas. Limitar las frames.');
 // ZP $68/$69 not used by TEST342 nor the TEST203 sparse color patch ($50-57).
 src=one(src,'f342_tmpfine=$42\n',
             'f342_tmpfine=$42\nf343_row=$68\nf343_base=$69\n','IRQ scratch ZP');
 extra.push(
  'frame343_set_base',
  ' ldx f342_index',
  ' lda frame343_frame_base,x',
  ' sta f343_base',
  ' lda #$00',' sta f343_row',
  ' rts',
  'frame343_irq',
  ' lda f343_row',' cmp #$19',' bne frame343_color_row',
  ' lda #$00',' sta f343_row',
  ' lda #$30',' sta $d012',
  ' jmp irq',
  'frame343_color_row',
  ' pha',' txa',' pha',' tya',' pha',
  ' lda #$01',' sta $d019',
  ' lda f343_row',' clc',' adc f343_base',' tax',
  ' lda frame343_bg0,x',' sta $d021',
  ' lda frame343_bg1,x',' sta $d022',
  ' lda frame343_bg2,x',' sta $d023',
  ' lda frame343_bg3,x',' sta $d024',
  ' inc f343_row',
  ' ldx f343_row',
  ' lda frame343_raster,x',' sta $d012',
  ' pla',' tay',' pla',' tax',' pla',' rti',
  'frame343_frame_base',
  '!byte '+fs.map(function(_,i){return hex(i*25);}).join(','),
  'frame343_raster',
  '!byte '+Array.from({length:25},function(_,i){return hex(0x30+i*8);}).concat([hex(0xfa)]).join(',')
 );
 for(var channel=0;channel<4;channel++){
  extra.push('frame343_bg'+channel);
  var vals=pal.map(function(row){return hex(row[channel]);});
  for(var k=0;k<vals.length;k+=16)extra.push('!byte '+vals.slice(k,k+16).join(','));
 }
 src=one(src,'*=$3000\ncharset_bank1',extra.join('\n')+'\n*=$3000\ncharset_bank1','row palette raster scheduler');
 if(!src.includes('frame342_tick')||!src.includes('frame342_stage')||!src.includes('frame343_irq'))
  throw Error('TEST343: planificador de frames e IRQ raster incompleto.');
 return src;
}
function assemble(src){
 var a=window.g_app&&window.g_app.assembler;if(!a)throw Error('TEST343: ensamblador LVLLVL no disponible.');
 var r=a.assemble(src,0x0801);
 if(!r||!r.success){
  var errors=(r&&r.errors||[]).map(e=>e.message||String(e)).join(' | ');
  throw Error('TEST343 ASM: '+errors);
 }
 var m=a.getMemory(),bytes=new Uint8Array(r.end-r.start+2);
 bytes[0]=r.start&255;bytes[1]=r.start>>8;
 for(var i=r.start;i<r.end;i++)bytes[2+i-r.start]=m[i]&255;
 if(bytes.length<16000)throw Error('TEST343: PRG demasiado corto; faltan mapas/charsets.');
 return bytes;
}
ToPRGAdv.prototype.createPRG=function(args){
 var e=this.editor,layer=e&&e.layers&&e.layers.getSelectedLayerObject&&e.layers.getSelectedLayerObject(),
     fs=e&&e.graphic&&e.graphic.frames||[];
 if(!layer||!modeIsECM(layer)||fs.length<2)return prior.apply(this,arguments);
 try{
  var state=prepare(this,args||{}),src=build(state),bytes=assemble(src);
  window.RICO_TEST343_REPORT={frames:state.reports,bytes:bytes.length,mode:'C64 EBCM',status:'BUILT, VICE PENDING'};
  window.RICO_TEST343_ERROR=null;
  this.prg=bytes;
  if(args&&args.download===false)return bytes;
  var name=args&&args.filename||'REMISERIA_TEST343';
  name=name.replace(/\.prg$/i,'')+'_TEST343.prg';
  if(typeof window.download!=='function')throw Error('TEST343: función de descarga inexistente.');
  window.download(bytes,name,'application/prg');
  return bytes;
 }catch(err){
  window.RICO_TEST343_ERROR=String(err&&err.message||err);
  console.error('[TEST343 EBCM MULTIFRAME]',err);
  if(typeof window.alert==='function')window.alert(window.RICO_TEST343_ERROR);
  return false;
 }
};
window.RICO_TEST343_ECM={version:343,prepare:prepare,build:build,last:()=>window.RICO_TEST343_REPORT||null};
console.log('[TEST343] Native 64-glyph EBCM + TEST342 frame scheduler (experimental) ready.');
})();