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
  var d=data.frames[fi],fullCells=[],otherColors=Object.create(null),countBG=Object.create(null),
      usedGlyphs=Object.create(null),warnings=[],exact=0;
  if(!d.still||d.map.length!==1000||d.colors.length!==1000)
   throw Error('TEST343: Frame '+(fi+1)+' no es una imagen estática 40×25.');
  var cells=[];
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
   var cell=layer.getCell({x:x,y:y,frame:fi})||{},t=Number(cell.t),fg=Number(cell.fc),bg=Number(cell.bc);
   if(!Number.isInteger(t)||t<0||t>255||!Number.isInteger(fg)||fg<0||fg>15)
    throw Error('TEST343: tile o foreground inválido en frame '+(fi+1)+' X'+x+' Y'+y);
   if(!Number.isInteger(bg)||bg<0||bg>15)
    bg=Number(layer.getBackgroundColor(fi))&15;
   var id=t&63,pix=glyphPix(id);
   if(!pix||pix.length!==64)throw Error('TEST343: glifo físico '+id+' incompleto.');
   var solid=true;for(var q=0;q<64;q++){if(!pix[q]){solid=false;break;}}
   if(!solid)countBG[bg]=(countBG[bg]||0)+1;
   usedGlyphs[id]=true;
   cells.push({id:id,t:t,fg:fg,bg:bg,solid:solid,x:x,y:y});
  }
  var bg0=Number(layer.getBackgroundColor(fi))&15;
  var sorted=Object.keys(countBG).map(Number).sort(function(a,b){
   return (b===bg0?1:0)-(a===bg0?1:0)||countBG[b]-countBG[a]||a-b;
  });
  var palette=[bg0];
  sorted.forEach(function(c){if(palette.length<4&&palette.indexOf(c)<0)palette.push(c);});
  while(palette.length<4)palette.push(palette[palette.length-1]);
  var map=[],colors=[],unrepresented=[];
  for(var ci=0;ci<cells.length;ci++){
   var c=cells[ci],slot=palette.indexOf(c.bg);
   if(slot<0){
    // A completely filled glyph never exposes its background.
    // For other glyphs, reject: never silently substitute a background.
    if(!c.solid)unrepresented.push({x:c.x,y:c.y,bg:c.bg,fg:c.fg,glyph:c.id});
    slot=0;
   }
   map.push(c.id|(slot<<6));colors.push(c.fg);
  }
  if(unrepresented.length)
   throw Error('TEST343: Frame '+(fi+1)+' necesita '+(new Set(unrepresented.map(x=>x.bg))).size+
    ' colores extra de fondo en '+unrepresented.length+' celdas con dibujo. EBCM permite 4 fondos por raster. Ejemplo: X'+
    unrepresented[0].x+' Y'+unrepresented[0].y+' BG'+unrepresented[0].bg+
    '. Se necesita planificador raster para conservar esos colores; no se reemplazaron.');
  d.map=map;d.colors=colors;d.ecm343=palette;d.bg=palette[0];d.edgeMask=false;
  reports.push({frame:fi+1,duration:d.duration,glyphs:Object.keys(usedGlyphs).length,palette:palette});
 }
 return {data:data,reports:reports};
}
function build(info){
 var plan=info.data,fs=plan.frames,src=core.build(plan),extra=[];
 // VIC-II ECM: bit 6. TEST342's fine scroll may write D011 on each frame.
 src=one(src,' ora #$10\n ora f342_edge\n sta $d011',
             ' ora #$10\n ora f342_edge\n ora #$40\n sta $d011','ECM $D011');
 // 40 columns and stable vertical scroll of 3 pixels for full 40x25.
 src=one(src,'frame342_edge\n!byte '+fs.map(function(){return hex(0);}).join(','),
             'frame342_edge\n!byte '+fs.map(function(){return hex(8);}).join(','),'CSEL 40-column table');
 src=one(src,'frame342_fine_x\n!byte '+fs.map(function(){return hex(7);}).join(','),
             'frame342_fine_x\n!byte '+fs.map(function(){return hex(0);}).join(','),'fine X table');
 src=one(src,'frame342_fine_y\n!byte '+fs.map(function(){return hex(7);}).join(','),
             'frame342_fine_y\n!byte '+fs.map(function(){return hex(3);}).join(','),'fine Y table');
 // Copy palettes once at startup and upon every committed frame change.
 var call=' jsr frame343_backgrounds\n';
 src=one(src,' jsr frame342_load\n lda pending_x',
             ' jsr frame342_load\n'+call+' lda pending_x','initial palette');
 src=one(src,' lda f342_border\n sta $d020\n lda #$00',
             ' lda f342_border\n sta $d020\n'+call+' lda #$00','palette per frame');
 extra.push('frame343_backgrounds',' ldx f342_index');
 for(var channel=1;channel<4;channel++){
  extra.push(' lda frame343_bg'+channel+',x',' sta $d0'+(21+channel).toString(16));
 }
 extra.push(' rts');
 for(var n=1;n<4;n++){
  extra.push('frame343_bg'+n);
  extra.push('!byte '+fs.map(function(f){return hex(f.ecm343[n]);}).join(','));
 }
 src=one(src,'*=$3000\ncharset_bank1',extra.join('\n')+'\n*=$3000\ncharset_bank1','insert palette scheduler');
 if(!src.includes('frame342_tick')||!src.includes('frame342_stage')||!src.includes('frame343_backgrounds'))
  throw Error('TEST343: código ASM de multiframe incompleto.');
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