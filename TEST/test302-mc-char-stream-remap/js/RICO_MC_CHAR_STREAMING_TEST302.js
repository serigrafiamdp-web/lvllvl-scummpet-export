/* TEST302 — Streaming 256-entry glyph permutation, unlimited group phase
 * count within TEST290's normal 31-tile group width.
 * NO pre-cached 1000-byte screen per phase. Preserve original colors and
 * per-physical-cell selection. Backward-compatible to TEST297 PASS fallback.
 * Uses original TEST301 strict color analysis (no recoloring).
 */
/* TEST301 — TEST247 C64 Multicolor Character Remap compatibility laboratory.
 * Safe: Bitmap MC with three 16-color local inks remains the default.
 * A standalone VIC character-mode remap PRG is exported ONLY if every
 * physical pixel and per-cell color maps exactly onto standard C64
 * multicolor character mode. Otherwise normal TEST297 PRG is exported.
 * No document conversion, no color quantization, no tile deletion.
 *
 * MC bitmap: %01 C1 per cell, %10 C2 per cell, %11 C3 per cell 0..15.
 * MC charset: %01 D022 global, %10 D023 global, %11 ColorRAM 0..7.
 * ColorRAM $D800 3-bit color + high 1 enables multicolor char mode.
 */
(function(w,doc){
'use strict';
if(!w.RICO_TEST290_BITMAP||!w.RICO_TEST297_BITMAP||typeof Editor==='undefined')return;
var NAME='[RICO TEST302]',last=null,errors=null,exportCalls=0;
function layer(){
 var ed=w.g_app&&w.g_app.textModeEditor;
 return ed&&ed.layers&&ed.layers.getSelectedLayerObject();
}
function currentIds(){
 var l=layer(),f=Number.isInteger(l.currentFrame)?l.currentFrame:0,
     frame=l.frames[f],width=l.getGridWidth(),height=l.getGridHeight();
 var ids=new Uint8Array(1000);
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var cell=y<height&&x<width&&frame.data[y]&&frame.data[y][x];
  var tile=cell&&Number.isInteger(cell.t)?cell.t:0;
  if(tile<0||tile>255)throw Error('Índice de tile fuera de 0–255 en '+x+','+y);
  ids[y*40+x]=tile;
 }
 return ids;
}
function gcd(a,b){while(b){var c=a%b;a=b;b=c;}return a;}
function test(model,ids){
 var report={version:'TEST301',engine:'MC CHAR REMAP (strict, lossless)',
  atlasTiles:256,physicalCells:1000,animatedCells:model.refreshCount||0,
  groupCount:model.animations.length,rowsCompatible:0,totalRows:25,
  fullScreenEligible:false,mode:'BITMAP MC TEST297 (safe fallback)',
  estimatedByteWritesPerFrame:model.refreshCount*8,viableRows:[],candidateBands:[],
  reasons:[],diagnostic:[],phaseCount:0,globalC1:null,globalC2:null};
 function reason(s){if(report.reasons.indexOf(s)<0)report.reasons.push(s);}
 if(model.animations.length!==1){reason('Se requiere exactamente un Group Animate horizontal.');return report;}
 var g=model.animations[0];
 if(g.rate!==8||(g.type!=='left'&&g.type!=='right')||g.delay!==1){
  reason('Ruta rápida solo para Left/Right, 8 píxeles MC/tick, Ticks/Frame=1.');return report;
 }
 if(!Array.isArray(g.matrix)||g.matrix.some(function(id){return !Number.isInteger(id)||id<0||id>255;})){
  reason('El grupo contiene huecos; este prototipo solo admite matrices completas.');return report;
 }
 var period=g.width/gcd(g.width,2);
 if(period<2||period>31){reason('El grupo necesita '+period+' fases; el motor admite hasta 31 fases.');return report;}
 report.phaseCount=period;report.phaseStorage='STREAMING_LUT_256_BYTES';
 var coords={},selected={};
 for(var y=0;y<g.height;y++)for(var x=0;x<g.width;x++){
  var id=g.matrix[y*g.width+x];
  if(coords[id]){reason('Se repitió un índice dentro de la matriz del grupo.');return report;}
  coords[id]={x:x,y:y};
 }
 for(var mem of g.members)selected[mem.tile]=coords[mem.tile];
 var phases=[],uses=new Uint8Array(256);
 for(var tile=0;tile<256;tile++){
  var bits=0;
  for(var row=0;row<8;row++){
   var v=model.atlas[tile*8+row];
   for(var col=0;col<4;col++)bits|=1<<((v>>(6-col*2))&3);
  }
  uses[tile]=bits;
 }
 for(var p=0;p<period;p++){
  var screen=new Uint8Array(1000);
  for(var cell=0;cell<1000;cell++){
   var id=ids[cell],pos=selected[id];
   if(pos){
    var sx=g.type==='left'?(pos.x+p*2)%g.width:
     ((pos.x-p*2)%g.width+g.width)%g.width;
    id=g.matrix[pos.y*g.width+sx];
   }
   screen[cell]=id;
  }
  phases.push(screen);
 }
 report.phaseScreens=phases;
 var rowC1=new Array(25),rowC2=new Array(25),mismatchCells=0,
     invalidC3Cells=0,rowFails=[];
 for(var y=0;y<25;y++){
  var need1=-1,need2=-1,bad=false,badReason='',activePixels=0;
  for(var c=0;c<40;c++){
   var index=y*40+c,sc=model.screen[index],
    col1=sc>>4,col2=sc&15,col3=model.color[index]&15;
   for(var p=0;p<period;p++){
    var tile=phases[p][index],use=uses[tile];
    if(use&2){activePixels++;if(need1<0)need1=col1;else if(need1!==col1){bad=true;badReason='C1 diferente entre celdas';mismatchCells++;}}
    if(use&4){activePixels++;if(need2<0)need2=col2;else if(need2!==col2){bad=true;badReason='C2 diferente entre celdas';mismatchCells++;}}
    if((use&8)&&col3>7){bad=true;badReason='C3 requiere un color entre 8 y 15';invalidC3Cells++;}
   }
  }
  rowC1[y]=need1;rowC2[y]=need2;
  if(!bad){report.rowsCompatible++;report.viableRows.push(y);}
  else rowFails.push({row:y,reason:badReason});
 }
 var global1=-1,global2=-1,conflictingRows=0;
 for(var y=0;y<25;y++)if(report.viableRows.indexOf(y)>=0){
  if(rowC1[y]>=0){if(global1<0)global1=rowC1[y];else if(global1!==rowC1[y])conflictingRows++;}
  if(rowC2[y]>=0){if(global2<0)global2=rowC2[y];else if(global2!==rowC2[y])conflictingRows++;}
 }
 // Contiguous horizontal strips having internally consistent MC-Char
 // global inks. Future hybrid raster splits may use these bands. They
 // are DIAGNOSTIC ONLY: never export a partial mode without IRQ support.
 var band=null;
 for(var y=0;y<25;y++){
  var okay=report.viableRows.indexOf(y)>=0,
      v1=rowC1[y],v2=rowC2[y];
  if(!okay){if(band){report.candidateBands.push(band);band=null;}continue;}
  var matching=band&&(v1<0||band.c1<0||band.c1===v1)&&
      (v2<0||band.c2<0||band.c2===v2);
  if(!matching){if(band)report.candidateBands.push(band);
    band={startRow:y,endRow:y,rows:1,c1:v1,c2:v2};}
  else{band.endRow=y;band.rows++;if(band.c1<0)band.c1=v1;
    if(band.c2<0)band.c2=v2;}
 }
 if(band)report.candidateBands.push(band);
 report.globalC1=global1<0?0:global1;
 report.globalC2=global2<0?0:global2;
 report.diagnostic=rowFails.slice(0,12);
 report.colorConflicts=mismatchCells;
 report.outOfRangeLocalC3=invalidC3Cells;
 report.conflictingCompatibleRows=conflictingRows;
 if(mismatchCells)reason('C1/C2 son colores independientes por celda y no coinciden entre los píxeles usados.');
 if(invalidC3Cells)reason('Algún píxel %11 utiliza C3 superior a 7; Color RAM MC-Char solo admite 0–7.');
 if(conflictingRows)reason('Las filas compatibles necesitan distintos colores globales; requerirían split por raster.');
 if(report.rowsCompatible!==25)reason('Hay filas que deben continuar en Bitmap Multicolor.');
 report.fullScreenEligible=report.rowsCompatible===25&&conflictingRows===0;
 if(report.fullScreenEligible){
  report.mode='MC CHAR REMAP TEST301 (lossless)';
  report.estimatedByteWritesPerFrame=1000; // upper bound, before sparse updates
 }else if(report.rowsCompatible>0){
  report.mode='HIBRIDO POR FILAS: SOLO DIAGNÓSTICO (aún sin IRQ de splits)';
 }
 return report;
}
function analyze(model){
 if(!model)model=w.RICO_TEST290_BITMAP.analyze();
 return test(model,currentIds());
}
function assembler(){
 var code=[],labels={},fixes=[],base=0x810;
 function pc(){return base+code.length;}
 function b(a){code.push(a&255);}
 function imm(op,v){b(op);b(v);}
 function zp(op,v){b(op);b(v);}
 function abs(op,v){b(op);b(v);b(v>>8);}
 function label(n){if(Object.prototype.hasOwnProperty.call(labels,n))throw Error('Etiqueta duplicada '+n);labels[n]=pc();}
 function j(op,n){b(op);fixes.push({at:code.length,name:n,relative:false});b(0);b(0);}
 function br(op,n){b(op);fixes.push({at:code.length,name:n,relative:true});b(0);}
 function bytes(data){for(var n of data)b(n);}
 function end(){
  for(var f of fixes){
   var dest=labels[f.name];if(dest===undefined)throw Error('Etiqueta ausente '+f.name);
   if(f.relative){
    var delta=dest-(base+f.at+1);
    if(delta<-128||delta>127)throw Error('Branch fuera de alcance '+f.name+': '+delta);
    code[f.at]=delta&255;
   }else{code[f.at]=dest&255;code[f.at+1]=dest>>8;}
  }
  return {bytes:new Uint8Array(code),labels:labels};
 }
 return {b:b,imm:imm,zp:zp,abs:abs,label:label,j:j,br:br,bytes:bytes,end:end,pc:pc};
}
function build(model,report){
 if(!report)report=analyze(model);
 if(!report.fullScreenEligible)throw Error('TEST302 no puede convertir el dibujo sin cambiar colores.');
 var a=assembler(),b=a.b,I=a.imm,Z=a.zp,A=a.abs,L=a.label,J=a.j,B=a.br;
 var screenSource=0x2C00,maskSource=0x3000,colorSource=0x3400,
     screen1=0x4400,screen2=0x4800,font=0x5000,lutAddress=0x5800;
 var g=model.animations[0],period=report.phaseCount,ids=currentIds();
 var color=new Uint8Array(1000),mask=new Uint8Array(1000),
     lookup=new Uint8Array(256);
 for(var i=0;i<256;i++)lookup[i]=i;
 var coordinates={},members={};
 for(var yy=0;yy<g.height;yy++)for(var xx=0;xx<g.width;xx++){
  var id=g.matrix[yy*g.width+xx];
  if(id<0||id>=256||coordinates[id])throw Error('Grupo incompleto o duplicado.');
  coordinates[id]={x:xx,y:yy};
 }
 for(var m of g.members)members[m.tile]=true;
 for(var name in coordinates){
  var k=Number(name),pos=coordinates[k],
    nx=g.type==='left'?(pos.x+2)%g.width:
      ((pos.x-2)%g.width+g.width)%g.width,
    destination=g.matrix[pos.y*g.width+nx];
  if(!Number.isInteger(destination)||destination<0||destination>255)
   throw Error('Tabla de remapeo contiene índice inválido.');
  lookup[k]=destination;
 }
 for(var cell=0;cell<1000;cell++){
  color[cell]=8|(model.color[cell]&7);
  mask[cell]=members[ids[cell]]?1:0;
 }
 // The original tile index must remain fixed for cells NOT in the
 // selected animation. For selected physical cells, the visible screen
 // is the source of the next step. This is permutation T^phase.
 var base=(addr)=>{I(0xA9,addr&255);Z(0x85,0xE0);
   I(0xA9,addr>>8);Z(0x85,0xE1);};
 var dest=(addr)=>{I(0xA9,addr&255);Z(0x85,0xE2);
   I(0xA9,addr>>8);Z(0x85,0xE3);};
 L('start');b(0x78);I(0xA9,0x35);Z(0x85,0x01); // SEI and RAM under ROM
 A(0xAD,0xDD02);I(0x09,3);A(0x8D,0xDD02);
 A(0xAD,0xDD00);I(0x29,0xFC);I(0x09,2);A(0x8D,0xDD00);
 I(0xA9,0);A(0x8D,0xD011);
 I(0xA9,model.bg);A(0x8D,0xD021);
 I(0xA9,report.globalC1);A(0x8D,0xD022);
 I(0xA9,report.globalC2);A(0x8D,0xD023);
 I(0xA9,0);A(0x8D,0xD020);
 base(colorSource);dest(0xD800);J(0x20,'copy1000');
 for(var v of [screen1,screen2]){
  base(screenSource);dest(v);J(0x20,'copy1000');
 }
 I(0xA9,0);Z(0x85,0xF2);Z(0x85,0xF3);
 I(0xA9,0x14);A(0x8D,0xD018);
 I(0xA9,0x18);A(0x8D,0xD016);
 I(0xA9,0x1B);A(0x8D,0xD011);
 L('next');
 // Always read currently-visible screen, write the hidden one.
 // $F3=0 -> screen1 displayed, update screen2; else reverse.
 Z(0xA5,0xF3);B(0xF0,'visible1');
 base(screen2);dest(screen1);J(0x4C,'pointersReady');
 L('visible1');base(screen1);dest(screen2);
 L('pointersReady');
 I(0xA9,maskSource&255);Z(0x85,0xE4);
 I(0xA9,maskSource>>8);Z(0x85,0xE5);
 J(0x20,'copyMapped1000');
 L('vblank');
 A(0xAD,0xD011);B(0x30,'flip');
 A(0xAD,0xD012);I(0xC9,251);B(0xB0,'flip');
 I(0xC9,33);B(0x90,'flip');
 J(0x4C,'vblank');
 L('flip');Z(0xA5,0xF3);B(0xD0,'showScreen1');
 I(0xA9,0x24);A(0x8D,0xD018);
 I(0xA9,1);Z(0x85,0xF3);J(0x4C,'advance');
 L('showScreen1');I(0xA9,0x14);A(0x8D,0xD018);
 I(0xA9,0);Z(0x85,0xF3);
 L('advance');Z(0xE6,0xF2);Z(0xA5,0xF2);I(0xC9,period);
 B(0x90,'next');I(0xA9,0);Z(0x85,0xF2);J(0x4C,'next');
 // A raw 1000-byte copy, for one-time initialization.
 L('copy1000');I(0xA2,3);L('rawPage');I(0xA0,0);
 L('rawByte');Z(0xB1,0xE0);Z(0x91,0xE2);b(0xC8);B(0xD0,'rawByte');
 Z(0xE6,0xE1);Z(0xE6,0xE3);b(0xCA);B(0xD0,'rawPage');
 I(0xA0,0);L('rawTail');Z(0xB1,0xE0);Z(0x91,0xE2);b(0xC8);
 I(0xC0,232);B(0xD0,'rawTail');b(0x60);
 // Runtime remap only for original physically selected cells:
 // physical mask sits at $3000; lookup of glyph ID at $5800.
 L('copyMapped1000');I(0xA2,3);L('mapPage');I(0xA0,0);
 L('mapByte');Z(0xB1,0xE4);B(0xF0,'unchanged');
 Z(0xB1,0xE0);b(0xAA);A(0xBD,lutAddress);
 J(0x4C,'storeMapped');
 L('unchanged');Z(0xB1,0xE0);
 L('storeMapped');Z(0x91,0xE2);b(0xC8);B(0xD0,'mapByte');
 Z(0xE6,0xE1);Z(0xE6,0xE3);Z(0xE6,0xE5);
 b(0xCA);B(0xD0,'mapPage');
 I(0xA0,0);L('mapTail');Z(0xB1,0xE4);B(0xF0,'tailUnchanged');
 Z(0xB1,0xE0);b(0xAA);A(0xBD,lutAddress);J(0x4C,'tailStore');
 L('tailUnchanged');Z(0xB1,0xE0);
 L('tailStore');Z(0x91,0xE2);b(0xC8);I(0xC0,232);
 B(0xD0,'mapTail');b(0x60);
 var machine=a.end(),origin=0x0801,end=lutAddress+256;
 if(0x0810+machine.bytes.length>=0x1000)
  throw Error('TEST302: ASM excede límite $1000: '+machine.bytes.length);
 var prg=new Uint8Array(2+end-origin);
 var at=function(addr){return 2+addr-origin;};
 prg[0]=1;prg[1]=8;
 prg.set([0x0B,0x08,10,0,0x9E,50,48,54,52,0,0,0],at(origin));
 prg.set(machine.bytes,at(0x0810));
 prg.set(ids,at(screenSource));prg.set(mask,at(maskSource));
 prg.set(color,at(colorSource));prg.set(ids,at(screen1));
 prg.set(ids,at(screen2));prg.set(model.atlas,at(font));
 prg.set(lookup,at(lutAddress));
 return {bytes:prg,meta:{renderStrategy:'TEST302 MC-CHAR streaming LUT — lossless',
  phaseCount:period, atlasBytes:2048,screenCopyBytes:1000,
  bitmapCopyBytes:0,screenBuffers:['$4400','$4800'],font:'$5000',
  lookupAddress:'$5800',physicalMask:'$3000',phaseCacheBytes:0,
  colorRAM:true,colors:[model.bg,report.globalC1,report.globalC2],
  asmBytes:machine.bytes.length,prgBytes:prg.length,
  visibleCellCount:1000},
  labels:machine.labels,model:model,lookup:lookup,mask:mask};
}
function notice(message){
 if(!doc||!doc.body||!doc.createElement)return;
 var el=doc.getElementById('rico301status');
 if(!el){
  el=doc.createElement('div');el.id='rico301status';
  el.style.cssText='position:fixed;right:18px;bottom:20px;z-index:999999;max-width:470px;white-space:pre-line;pointer-events:none;background:rgba(14,17,22,.97);border:2px solid #e8a84b;border-radius:8px;color:#fff;padding:14px;font:bold 14px/1.55 sans-serif;box-shadow:0 7px 20px #0009';
  doc.body.appendChild(el);
 }
 el.textContent=message;
}
function download(prg,name){
 if(typeof w.download==='function')return w.download(prg,name,'application/prg');
 var blob=new Blob([prg],{type:'application/octet-stream'}),
  url=URL.createObjectURL(blob),a=doc.createElement('a');
 a.href=url;a.download=name;doc.body.appendChild(a);a.click();a.remove();
 w.setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function exportPRG(opts){
 exportCalls++;
 var model=w.RICO_TEST290_BITMAP.analyze(),report=analyze(model);
 report.exportClickCount=exportCalls;
 last=report;errors=null;w.RICO_TEST302_LAST_EXPORT=report;
 if(!report.fullScreenEligible){
  report.actualExporter='TEST297 BITMAP MULTICOLOR — RUTA ORIGINAL';
  report.fallbackReason=report.reasons.join(' | ')||'Imagen no convertible en MC Character.';
  report.prgFilename='RICO_TEST297_MC_DISTRIBUTED_SPEEDCODE_256TILES.prg';
  w.RICO_TEST302_LAST_EXPORT=report;
  notice('TEST302: CONVERSIÓN NO ACTIVADA\n'+
    'Se exporta TEST297 sin ninguna aceleración nueva.\n'+
    'Filas compatibles: '+report.rowsCompatible+'/25 · Bandas: '+report.candidateBands.length+
    '\nMotivo: '+(report.reasons[0]||'Bitmap MC necesario.')+
    '\nArchivo: '+report.prgFilename);
  if(typeof w.alert==='function'&&!(opts&&opts.silent))
   w.alert('TEST302 NO ACTIVADO. Se exporta TEST297 sin mejora de velocidad.\n'+
      'Filas compatibles: '+report.rowsCompatible+'/25.\n'+
      'Motivo: '+(report.reasons[0]||'No cumple condiciones.'));
  if(w.console&&w.console.log)w.console.log(NAME,'FALLBACK TEST297 · SIN CAMBIOS DE MOTOR',report);
  return null; // Hand off to TEST297 standard Export PRG.
 }
 var built=build(model,report);
 report.mode=built.meta.renderStrategy;report.prgBytes=built.bytes.length;
 report.actualExporter='TEST302 MULTICOLOR CHAR STREAMING — NUEVO MOTOR';
 report.prgFilename='RICO_TEST302_MC_CHAR_STREAMING_LOSSLESS.prg';
 if(!(opts&&opts.download===false)){
  download(built.bytes,'RICO_TEST302_MC_CHAR_STREAMING_LOSSLESS.prg');
  if(typeof w.alert==='function'&&!(opts&&opts.silent))
   w.alert('TEST302 ACTIVADO: nuevo motor Multicolor Character.\n'+
      '25/25 filas compatibles; comprobar velocidad en VICE.');
  notice('TEST302: CONVERSIÓN ACTIVADA\nMotor nuevo MC CHARACTER: solo 1000 códigos por fase.\n'+
   'Colores originales conservados.\nArchivo: '+report.prgFilename);
 }
 w.RICO_TEST302_LAST_EXPORT=report;
 return built;
}
var previous=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(id){
 if(id==='export-prg'){
  try{
   var l=layer();
   if(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&l.getScreenMode()==='c64multicolor'){
    var result=exportPRG({download:true});
    if(result!==null)return result;
   }
  }catch(err){
   errors=String(err&&err.message||err);
   notice('TEST301: no elegible. Se conserva TEST297. '+errors);
   if(w.console&&w.console.warn)w.console.warn(NAME,errors);
  }
 }
 return previous.apply(this,arguments);
};
w.RICO_TEST302_DIAGNOSTIC_VERSION='streaming-v1'; 
w.RICO_TEST302_MC_REMAP={version:'TEST302',analyze:analyze,test:test,
 build:build,exportPRG:exportPRG,getLast:function(){return last;},
 getError:function(){return errors;}};
})(window,document);
