/* TEST348: static 40x25 EBCM player, 64 shared glyphs, native 9-frame patches.
 * Standalone C64 6510 runtime. No Map Scroll code, TEST342 or TEST344 ASM.
 * Raster IRQ preserves A/X/Y before any operation; row palette slots are
 * changed only when their previous color was UNUSED in the preceding row.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined')return;
var old=ToPRGAdv.prototype.createPRG;
var VERSION=348;
function h(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function w(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function emit(arr,label,bytes){
 arr.push(label);
 for(var i=0;i<bytes.length;i+=16)arr.push('!byte '+bytes.slice(i,i+16).map(h).join(','));
}
function validColor(v,label){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('TEST348: color '+label+' inválido: '+v);return v;}
function getDuration(g,f,i){
 var v;
 try{v=g.getFrameDuration(i);}catch(e){}
 if(v===undefined||v===null)v=f.duration;
 v=Number(v);
 if(!Number.isInteger(v)||v<1||v>65535)
  throw Error('TEST348: duración de frame '+(i+1)+' fuera de 1..65535 ticks.');
 return v;
}
function collect(self,args){
 var ed=self.editor,g=ed&&ed.graphic,
     layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
     frames=g&&g.frames||[],ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!layer||!ts||!g)throw Error('TEST348: no hay capa/tileset.');
 if(g.getGridWidth()!==40||g.getGridHeight()!==25)
  throw Error('TEST348: esta ruta admite imágenes fijas 40x25, sin Map Scroll.');
 if(frames.length<2||frames.length>10)
  throw Error('TEST348: se admiten 2..10 frames de pantalla fija EBCM (tabla raster de 8 bits).');
 if(ts.getTileWidth()!==8||ts.getTileHeight()!==8||!ts.tileData||ts.tileData.length<64)
  throw Error('TEST348: faltan los 64 glifos C64 de 8x8.');
 if(frames.some(function(f){return f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;}))
  throw Error('TEST348: hay Map Scroll activo; se preservó la ruta anterior.');
 if(frames.some(function(f){return f&&Number(f.charsetBank)===2;}))
  throw Error('TEST348: BANK 2 no está integrado en esta prueba EBCM de frames fijas.');
 if(args&&(args.sidData||args.music==='sid'||args.music==='yes'))
  throw Error('TEST348: hay SID configurado en Export PRG; no se omitirá.');
 var record=ts.getDocRecord&&ts.getDocRecord(),store=record&&record.data||{},grp=store.ricoGroupAnimationsV1||{};
 if((grp.bank1||[]).some(function(x){return x&&x.type;})||(grp.bank2||[]).some(function(x){return x&&x.type;}))
  throw Error('TEST348: Group Animate activo; la ruta estática no lo omite.');
 var banks=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
 if(banks.some(function(tiles){return tiles&&tiles.some(function(x){
  var a=x&&x.props&&x.props.animated;return a&&a!=='none';
 });}))
  throw Error('TEST348: hay caracteres animados individualmente; falta otro scheduler.');
 var patterns=[],glyphBytes=[],tileSolid=[];
 for(var id=0;id<64;id++){
  var pixels=ts.tileData[id]&&ts.tileData[id].data&&ts.tileData[id].data[0];
  if(!pixels||pixels.length!==64)throw Error('TEST348: glifo '+id+' no contiene sus 64 píxeles.');
  var solid=true;
  for(var y=0;y<8;y++){
   var b=0;
   for(var x=0;x<8;x++){if(pixels[y*8+x])b|=128>>>x;else solid=false;}
   glyphBytes.push(b);
  }
  tileSolid.push(solid);
 }
 var noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor;
 var all=[],freq=Object.create(null),usesBGOutside3=false;
 for(var i=0;i<frames.length;i++){
  var bg0=validColor(layer.getBackgroundColor?layer.getBackgroundColor(i):0,'BG frame '+(i+1));
  var border=validColor(layer.getBorderColor?layer.getBorderColor(i):0,'borde frame '+(i+1));
  var raw=[],visible=Array.from({length:25},function(){return new Set();});
  for(var ry=0;ry<25;ry++)for(var rx=0;rx<40;rx++){
   var c=layer.getCell({x:rx,y:ry,frame:i})||{};
   var tile=Number(c.t),fg=validColor(c.fc,'FG frame '+(i+1)+' X'+rx+' Y'+ry);
   if(!Number.isInteger(tile)||tile<0||tile>255)
    throw Error('TEST348: índice de carácter inválido en frame '+(i+1)+' X'+rx+' Y'+ry);
   var bc=Number(c.bc);
   if(!Number.isInteger(bc)||bc===noColor||bc<0)bc=bg0;
   if(bc>15)throw Error('TEST348: BG fuera de paleta en frame '+(i+1)+' X'+rx+' Y'+ry);
   if(bc>3)usesBGOutside3=true;
   raw.push({id:tile&63,t:tile,bg:bc,fg:fg,y:ry,x:rx});
  }
  all.push({raw:raw,bg0:bg0,border:border,duration:getDuration(g,frames[i],i),
    hasExplicitPalette:!!(layer.frames&&layer.frames[i]&&
      ['c64ECMColor1','c64ECMColor2','c64ECMColor3'].some(function(key){
       return Object.prototype.hasOwnProperty.call(layer.frames[i],key);
      }))});
 }
 // Converted historic JSONs can store direct C64 palette BG colors in bc.
 // Native projects can instead store ECM slot 0..3 (when explicit registers exist).
 var direct=usesBGOutside3||!all.some(function(f){return f.hasExplicitPalette;});
 var count=Object.create(null);
 all.forEach(function(f,i){
  f.required=Array.from({length:25},function(){return new Set();});
  f.raw.forEach(function(c){
   if(!direct&&f.hasExplicitPalette&&c.bg>=0&&c.bg<=3&&layer.getC64ECMColor)
    c.bg=validColor(layer.getC64ECMColor(c.bg,i),'ECM BG slot');
   if(!tileSolid[c.id]){
    f.required[c.y].add(c.bg);
    count[c.bg]=(count[c.bg]||0)+1;
   }
  });
 });
 var initial=Object.keys(count).map(Number).sort(function(a,b){return count[b]-count[a]||a-b;}).slice(0,4);
 if(initial.indexOf(all[0].bg0)===-1)initial[initial.length===4?3:initial.length]=all[0].bg0;
 for(var c=0;initial.length<4&&c<16;c++)if(initial.indexOf(c)<0)initial.push(c);
 // A *single* row-palette scheme across EVERY frame. A blink that only
 // changes one cell must not force 25 other screen codes to be rewritten.
 var unionNeed=Array.from({length:25},function(){return new Set();});
 all.forEach(function(f){f.required.forEach(function(set,row){
  set.forEach(function(c){unionNeed[row].add(c);});
 });});
 for(var ur=0;ur<25;ur++)if(unionNeed[ur].size>4)
  throw Error('TEST348: fila '+ur+' utiliza '+unionNeed[ur].size+
    ' fondos distintos entre frames; requiere un compositor ECM por frame. No se altera la imagen.');
 var currentPal=initial.slice(),previousRow=new Set(),sharedPal=[],events=[];
 for(var ry=0;ry<25;ry++){
  var need=unionNeed[ry],missing=Array.from(need).filter(function(bg){return currentPal.indexOf(bg)===-1;});
  missing.sort(function(a,b){return a-b;});
  missing.forEach(function(bg){
   var choices=[];
   for(var k=0;k<4;k++)if(!need.has(currentPal[k]))choices.push(k);
   if(!choices.length)throw Error('TEST348: faltan slots EBCM en fila '+ry+'.');
   choices.sort(function(a,b){
    function score(idx){
     var v=currentPal[idx],next=25;
     for(var y=ry+1;y<25;y++)if(unionNeed[y].has(v)){next=y;break;}
     return (previousRow.has(v)?0:1000)+next;
    }
    return score(b)-score(a)||a-b;
   });
   var slot=choices[0],old=currentPal[slot];
   if(previousRow.has(old))
    throw Error('TEST348: cambio de fondo raster inseguro en fila '+ry+' (color '+old+').');
   currentPal[slot]=bg;events.push({row:ry,slot:slot,from:old,to:bg});
  });
  sharedPal.push(currentPal.slice());previousRow=need;
 }
 var reports=[],maxWrites=0;
 all.forEach(function(f,fi){
  var screen=[],colors=[];
  for(var row=0;row<25;row++)for(var x=0;x<40;x++){
   var cell=f.raw[row*40+x],slot=sharedPal[row].indexOf(cell.bg);
   if(slot<0){
    if(!tileSolid[cell.id])throw Error('TEST348: BG no representable en frame '+(fi+1)+', fila '+row);
    slot=0;
   }
   screen.push((slot<<6)|cell.id);colors.push(cell.fg);
  }
  f.screen=screen;f.colors=colors;f.rowPal=sharedPal;f.events=events;
  reports.push({frame:fi+1,duration:f.duration,rasterChanges:events.length,
    changedCells:0,changedChars:0,changedColors:0,backgroundsRow0:sharedPal[0]});
 });
 // The display update is a small collection of fixed-address STA instructions
 // at vertical blank; no indirect screen copier or map-scroll engine.
 var patchASM=[],patchBytes=0;
 for(var to=0;to<all.length;to++){
  var before=all[(to+all.length-1)%all.length],after=all[to],lines=['patch_frame_'+to],writes=0,changes=0,cc=0,fgc=0;
  for(var pos=0;pos<1000;pos++){
   var differentChar=before.screen[pos]!==after.screen[pos],differentColor=before.colors[pos]!==after.colors[pos];
   if(!differentChar&&!differentColor)continue;
   changes++;
   if(differentChar){lines.push(' lda #'+h(after.screen[pos]),' sta '+w(0x0400+pos));writes++;cc++;}
   if(differentColor){lines.push(' lda #'+h(after.colors[pos]),' sta '+w(0xd800+pos));writes++;fgc++;}
  }
  lines.push(' rts');
  patchBytes+=writes*5+1;
  reports[to].changedCells=changes;reports[to].changedChars=cc;reports[to].changedColors=fgc;
  var estimatedCycles=writes*6+200;
  if(estimatedCycles>5500)throw Error('TEST348: transición '+(to+1)+' requiere '+estimatedCycles+
   ' ciclos estimados, demasiados para VBlank. No se exporta con tearing.');
  if(estimatedCycles>maxWrites)maxWrites=estimatedCycles;
  patchASM.push(lines.join('\n'));
 }
 if(patchBytes>0x2000)throw Error('TEST348: parches exceden $4000-$5FFF ('+patchBytes+' bytes).');
 return {frames:all,glyphs:glyphBytes,initial:initial,reports:reports,
         patchASM:patchASM,maxCycles:maxWrites,patchBytes:patchBytes,bgInput:direct?'direct palette':'ECM selectors'};
}
function build(plan){
 var fs=plan.frames,n=fs.length,rowPalette=fs[0].rowPal,
     events=fs[0].events,
     eventRows=events.map(function(ev){return ev.row;});
 if(!eventRows.length)throw Error('TEST348: este proyecto no necesita raster; usar modo EBCM de cuatro fondos sin scheduler.');
 if(new Set(eventRows).size!==eventRows.length)
  throw Error('TEST348: esta versión admite solo un cambio de fondo por fila.');
 if(eventRows.some(function(row,i){return !Number.isInteger(row)||row<1||row>24||(i>0&&row<=eventRows[i-1]);}))
  throw Error('TEST348: filas de cambio raster no válidas o desordenadas.');
 for(var fi=1;fi<fs.length;fi++)for(var row=0;row<25;row++)
  for(var slot=0;slot<4;slot++)if(fs[fi].rowPal[row][slot]!==rowPalette[row][slot])
   throw Error('TEST348: paletas no compartidas entre frames.');
 var eventRaster=eventRows.map(function(row){return 0x33+8*(row-1);}),
     eventColors=events.map(function(e){return e.to;}),
     eventSlots=events.map(function(e){return e.slot;});
 eventRaster.push(0xfc); // End of all visible character rows
 var topRaster=eventRaster[0],firstPalette=rowPalette[0];
 var code=[
 '; TEST348 EBCM 40x25 STATIC FRAMES — NO MAP SCROLL',
 '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
 '*=$2000',
 'frame_idx=$02','duration_lo=$03','duration_hi=$04','frame_pal_base=$05','irq_row=$06',
 'start',
 ' sei',' lda #$35',' sta $01',
 ' lda #$0b',' sta $d011',
 ' lda #$7f',' sta $dc0d',' sta $dd0d',
 ' lda $dc0d',' lda $dd0d',
 ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
 ' lda #$00',' sta frame_idx',' sta frame_pal_base',' sta irq_row',
 ' lda #'+h(fs[0].duration&255),' sta duration_lo',
 ' lda #'+h(fs[0].duration>>>8),' sta duration_hi',
 ' ldx #$00',
 'frame348_initialize',
 ' lda $6000,x',' sta $0400,x',
 ' lda $6100,x',' sta $0500,x',
 ' lda $6200,x',' sta $0600,x',
 ' lda $6300,x',' sta $0700,x',
 ' lda $6400,x',' sta $d800,x',
 ' lda $6500,x',' sta $d900,x',
 ' lda $6600,x',' sta $da00,x',
 ' lda $6700,x',' sta $db00,x',
 ' inx',' bne frame348_initialize',
 ' lda #'+h(fs[0].rowPal[0][0]),' sta $d021',
 ' lda #'+h(fs[0].rowPal[0][1]),' sta $d022',
 ' lda #'+h(fs[0].rowPal[0][2]),' sta $d023',
 ' lda #'+h(fs[0].rowPal[0][3]),' sta $d024',
 ' lda #'+h(fs[0].border),' sta $d020',
 ' lda #$00',' sta $d015',
 ' lda #$08',' sta $d016',
 ' lda #$1e',' sta $d018',
 ' lda #$5b',' sta $d011',
 ' lda #'+h(topRaster),' sta $d012',
 ' lda #<frame348_irq',' sta $fffe',
 ' lda #>frame348_irq',' sta $ffff',
 ' lda #$01',' sta $d019',' sta $d01a',
 ' cli',
 'frame348_idle',' jmp frame348_idle',
 // Crucial: PUSH ACCUMULATOR before the FIRST LDA/CMP/STA in an interrupt.
 'frame348_irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 ' lda irq_row',' cmp #'+h(eventRows.length),' bne frame348_event_irq',
 ' jmp frame348_vblank',
 'frame348_event_irq',
 ' tax',
 ' lda frame348_event_color,x',
 ' ldy frame348_event_slot,x',
 ' sta $d021,y', // only the background register whose previous color is no longer used
 ' inc irq_row',
 ' ldx irq_row',
 ' lda frame348_event_raster,x',' sta $d012',
 ' jmp frame348_exit',
 'frame348_vblank',
 ' lda #$00',' sta irq_row',
 ' lda #'+h(topRaster),' sta $d012',
 ' lda #'+h(firstPalette[0]),' sta $d021',
 ' lda #'+h(firstPalette[1]),' sta $d022',
 ' lda #'+h(firstPalette[2]),' sta $d023',
 ' lda #'+h(firstPalette[3]),' sta $d024',
 ' lda duration_lo',' bne frame348_decrease_lo',
 ' dec duration_hi',
 'frame348_decrease_lo',' dec duration_lo',
 ' lda duration_lo',' ora duration_hi',' bne frame348_exit',
 ' inc frame_idx',' lda frame_idx',' cmp #'+h(n),' bcc frame348_next_frame',
 ' lda #$00',' sta frame_idx',
 'frame348_next_frame',
 ' ldx frame_idx',
 ' lda frame348_dur_lo,x',' sta duration_lo',
 ' lda frame348_dur_hi,x',' sta duration_hi',
 ' lda frame348_border,x',' sta $d020',
 ' jsr frame348_patch',
 'frame348_exit',
 ' pla',' tay',' pla',' tax',' pla',' rti',
 'frame348_patch',
 ' ldx frame_idx'
 ];
 for(var i=0;i<n-1;i++)code.push(' cpx #'+h(i),' bne frame348_try_'+(i+1),' jmp patch_frame_'+i,'frame348_try_'+(i+1));
 code.push(' jmp patch_frame_'+(n-1));
 emit(code,'frame348_dur_lo',fs.map(function(f){return f.duration&255;}));
 emit(code,'frame348_dur_hi',fs.map(function(f){return f.duration>>8;}));
 emit(code,'frame348_border',fs.map(function(f){return f.border;}));
 code.push('*=$3800');
 emit(code,'frame348_charset',plan.glyphs);
 code.push('*=$4000');
 plan.patchASM.forEach(function(s){code.push(s);});
 code.push('*=$6000');
 var screen0=fs[0].screen.slice(),col0=fs[0].colors.slice();
 while(screen0.length<1024)screen0.push(0);
 while(col0.length<1024)col0.push(0);
 emit(code,'frame348_screen',screen0);
 code.push('*=$6400');
 emit(code,'frame348_color',col0);
 code.push('*=$7000');
 emit(code,'frame348_event_raster',eventRaster);
 emit(code,'frame348_event_color',eventColors);
 emit(code,'frame348_event_slot',eventSlots);
 return code.join('\n')+'\n';
}
function assemble(source,plan){
 var app=typeof g_app==='undefined'?null:g_app,assembler=app&&app.assembler;
 if(!assembler||typeof assembler.assemble!=='function')throw Error('TEST348: ensamblador del editor no disponible.');
 var result=assembler.assemble(source,0x0801);
 if(!result||!result.success){
  var msg=((result&&result.errors)||[]).map(function(e){return e.message||String(e);}).join(' | ');
  throw Error('TEST348 ASM: '+(msg||'error de ensamblado sin detalles'));
 }
 var mem=assembler.getMemory();
 for(var gi=0;gi<512;gi++){
  if((mem[0x3800+gi]&255)!==plan.glyphs[gi])
   throw Error('TEST348: charset sobrescrito en $'+(0x3800+gi).toString(16));
 }
 for(var pi=0;pi<1000;pi++){
  if((mem[0x6000+pi]&255)!==plan.frames[0].screen[pi])
   throw Error('TEST348: pantalla inicial sobrescrita en byte '+pi);
  if((mem[0x6400+pi]&255)!==plan.frames[0].colors[pi])
   throw Error('TEST348: color inicial sobrescrito en byte '+pi);
 }
 if(result.start!==0x0801||result.end<=0x7000||result.end>=0x8000)
  throw Error('TEST348: rango de PRG inesperado: '+w(result.start)+'..'+w(result.end));
 var bytes=new Uint8Array(result.end-result.start+2);
 bytes[0]=result.start&255;bytes[1]=(result.start>>8)&255;
 for(var i=result.start;i<result.end;i++)bytes[i-result.start+2]=mem[i]&255;
 return bytes;
}
ToPRGAdv.prototype.createPRG=function(args){
 var ed=this.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
     mode=layer&&layer.getScreenMode&&layer.getScreenMode(),
     fs=ed&&ed.graphic&&ed.graphic.frames||[];
 if(mode!=='c64ecm'&&!(typeof TextModeEditor!=='undefined'&&mode===TextModeEditor.Mode.C64ECM)
    ||fs.length<2)return old.apply(this,arguments);
 try{
  var plan=collect(this,args||{});
  var pos348=15*40+8, a348=plan.frames[0],b348=plan.frames[1];
  window.RICO_TEST348_CHAR_CHECK={pos:'X8 Y15',
    frame1Tile:a348.raw[pos348].t,frame2Tile:b348.raw[pos348].t,
    frame1Screen:a348.screen[pos348],frame2Screen:b348.screen[pos348],
    frame1Foreground:a348.colors[pos348],frame2Foreground:b348.colors[pos348],
    frame1Background:a348.raw[pos348].bg,frame2Background:b348.raw[pos348].bg,
    earlyRows:plan.frames[0].events.map(function(e){return {row:e.row,slot:e.slot,color:e.to};})};
  if(a348.raw[pos348].t===14&&b348.raw[pos348].t===88 &&
     (a348.screen[pos348]===b348.screen[pos348]||
      (a348.screen[pos348]&63)!==14||(b348.screen[pos348]&63)!==24))
   throw Error('TEST348: el parpadeo debe alternar glifos físicos 14 y 24; no se exportó.');
  console.log('[TEST348 EBCM CHARACTER BYTE CHECK]',window.RICO_TEST348_CHAR_CHECK);
  var asm=build(plan),prg=assemble(asm,plan);
  this.prg=prg;
  window.RICO_TEST348_LAST_REPORT={status:'PRG GENERADO; PENDIENTE DE VICE',frames:plan.reports,
    charsetBytes:512,patchBytes:plan.patchBytes,maxTransitionCycles:plan.maxCycles,
    backgroundFormat:plan.bgInput,bytes:prg.length};
  window.RICO_TEST348_LAST_ERROR=null;
  if(args&&args.download===false)return prg;
  var fn=(args&&args.filename||'REMISERIA').replace(/\.prg$/i,'');
  if(!/_TEST348$/i.test(fn))fn+='_TEST348';
  if(typeof window.download!=='function')throw Error('TEST348: función download no disponible.');
  window.download(prg,fn+'.prg','application/prg');
  return prg;
 }catch(e){
  window.RICO_TEST348_LAST_ERROR=String(e&&e.message||e);
  console.error('[TEST348 EBCM STATIC]',e);
  if(typeof window.alert==='function')window.alert(window.RICO_TEST348_LAST_ERROR);
  return false;
 }
};
window.RICO_TEST348_STATIC_ECM={version:VERSION,collect:collect,build:build};
console.log('[RICO TEST348] EBCM static delta-frame exporter installed; Map Scroll engines untouched.');

window.RICO_TEST348_BUILD_ID='TEST348 STATIC EBCM 20261109-A1 SAFE EARLY REGISTER EVENT';
try{
 if(typeof document!=='undefined' && document.body){
  var tag=document.createElement('div');
  tag.id='rico-test348-build-marker';
  tag.textContent='TEST348 · EBCM · EARLY IRQ · V348-A1';
  tag.style.cssText='position:fixed;right:12px;bottom:12px;background:#151515;color:#f0f0f0;border:1px solid #b0b0b0;padding:8px 12px;font:600 12px Arial,sans-serif;z-index:999999;pointer-events:none;opacity:.95;border-radius:4px';
  document.body.appendChild(tag);
 }
}catch(e){console.warn('TEST348 UI marker',e);}
})();