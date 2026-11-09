/* TEST346: static 40x25 EBCM player, 64 shared glyphs, native 9-frame patches.
 * Standalone C64 6510 runtime. No Map Scroll code, TEST342 or TEST344 ASM.
 * Raster IRQ preserves A/X/Y before any operation; row palette slots are
 * changed only when their previous color was UNUSED in the preceding row.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined')return;
var old=ToPRGAdv.prototype.createPRG;
var VERSION=346;
function h(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function w(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function emit(arr,label,bytes){
 arr.push(label);
 for(var i=0;i<bytes.length;i+=16)arr.push('!byte '+bytes.slice(i,i+16).map(h).join(','));
}
function validColor(v,label){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('TEST346: color '+label+' inválido: '+v);return v;}
function getDuration(g,f,i){
 var v;
 try{v=g.getFrameDuration(i);}catch(e){}
 if(v===undefined||v===null)v=f.duration;
 v=Number(v);
 if(!Number.isInteger(v)||v<1||v>65535)
  throw Error('TEST346: duración de frame '+(i+1)+' fuera de 1..65535 ticks.');
 return v;
}
function collect(self,args){
 var ed=self.editor,g=ed&&ed.graphic,
     layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
     frames=g&&g.frames||[],ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!layer||!ts||!g)throw Error('TEST346: no hay capa/tileset.');
 if(g.getGridWidth()!==40||g.getGridHeight()!==25)
  throw Error('TEST346: esta ruta admite imágenes fijas 40x25, sin Map Scroll.');
 if(frames.length<2||frames.length>10)
  throw Error('TEST346: se admiten 2..10 frames de pantalla fija EBCM (tabla raster de 8 bits).');
 if(ts.getTileWidth()!==8||ts.getTileHeight()!==8||!ts.tileData||ts.tileData.length<64)
  throw Error('TEST346: faltan los 64 glifos C64 de 8x8.');
 if(frames.some(function(f){return f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;}))
  throw Error('TEST346: hay Map Scroll activo; se preservó la ruta anterior.');
 if(frames.some(function(f){return f&&Number(f.charsetBank)===2;}))
  throw Error('TEST346: BANK 2 no está integrado en esta prueba EBCM de frames fijas.');
 if(args&&(args.sidData||args.music==='sid'||args.music==='yes'))
  throw Error('TEST346: hay SID configurado en Export PRG; no se omitirá.');
 var record=ts.getDocRecord&&ts.getDocRecord(),store=record&&record.data||{},grp=store.ricoGroupAnimationsV1||{};
 if((grp.bank1||[]).some(function(x){return x&&x.type;})||(grp.bank2||[]).some(function(x){return x&&x.type;}))
  throw Error('TEST346: Group Animate activo; la ruta estática no lo omite.');
 var banks=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
 if(banks.some(function(tiles){return tiles&&tiles.some(function(x){
  var a=x&&x.props&&x.props.animated;return a&&a!=='none';
 });}))
  throw Error('TEST346: hay caracteres animados individualmente; falta otro scheduler.');
 var patterns=[],glyphBytes=[],tileSolid=[];
 for(var id=0;id<64;id++){
  var pixels=ts.tileData[id]&&ts.tileData[id].data&&ts.tileData[id].data[0];
  if(!pixels||pixels.length!==64)throw Error('TEST346: glifo '+id+' no contiene sus 64 píxeles.');
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
    throw Error('TEST346: índice de carácter inválido en frame '+(i+1)+' X'+rx+' Y'+ry);
   var bc=Number(c.bc);
   if(!Number.isInteger(bc)||bc===noColor||bc<0)bc=bg0;
   if(bc>15)throw Error('TEST346: BG fuera de paleta en frame '+(i+1)+' X'+rx+' Y'+ry);
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
  throw Error('TEST346: fila '+ur+' utiliza '+unionNeed[ur].size+
    ' fondos distintos entre frames; requiere un compositor ECM por frame. No se altera la imagen.');
 var currentPal=initial.slice(),previousRow=new Set(),sharedPal=[],events=[];
 for(var ry=0;ry<25;ry++){
  var need=unionNeed[ry],missing=Array.from(need).filter(function(bg){return currentPal.indexOf(bg)===-1;});
  missing.sort(function(a,b){return a-b;});
  missing.forEach(function(bg){
   var choices=[];
   for(var k=0;k<4;k++)if(!need.has(currentPal[k]))choices.push(k);
   if(!choices.length)throw Error('TEST346: faltan slots EBCM en fila '+ry+'.');
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
    throw Error('TEST346: cambio de fondo raster inseguro en fila '+ry+' (color '+old+').');
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
    if(!tileSolid[cell.id])throw Error('TEST346: BG no representable en frame '+(fi+1)+', fila '+row);
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
  if(estimatedCycles>5500)throw Error('TEST346: transición '+(to+1)+' requiere '+estimatedCycles+
   ' ciclos estimados, demasiados para VBlank. No se exporta con tearing.');
  if(estimatedCycles>maxWrites)maxWrites=estimatedCycles;
  patchASM.push(lines.join('\n'));
 }
 if(patchBytes>0x2000)throw Error('TEST346: parches exceden $4000-$5FFF ('+patchBytes+' bytes).');
 return {frames:all,glyphs:glyphBytes,initial:initial,reports:reports,
         patchASM:patchASM,maxCycles:maxWrites,patchBytes:patchBytes,bgInput:direct?'direct palette':'ECM selectors'};
}
function build(plan){
 var fs=plan.frames,n=fs.length,code=[
 '; TEST346 EBCM 40x25 STATIC FRAMES — NO MAP SCROLL',
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
 'frame346_initialize',
 ' lda $6000,x',' sta $0400,x',
 ' lda $6100,x',' sta $0500,x',
 ' lda $6200,x',' sta $0600,x',
 ' lda $6300,x',' sta $0700,x',
 ' lda $6400,x',' sta $d800,x',
 ' lda $6500,x',' sta $d900,x',
 ' lda $6600,x',' sta $da00,x',
 ' lda $6700,x',' sta $db00,x',
 ' inx',' bne frame346_initialize',
 ' lda #'+h(fs[0].rowPal[0][0]),' sta $d021',
 ' lda #'+h(fs[0].rowPal[0][1]),' sta $d022',
 ' lda #'+h(fs[0].rowPal[0][2]),' sta $d023',
 ' lda #'+h(fs[0].rowPal[0][3]),' sta $d024',
 ' lda #'+h(fs[0].border),' sta $d020',
 ' lda #$00',' sta $d015',
 ' lda #$08',' sta $d016',
 ' lda #$1e',' sta $d018',
 ' lda #$5b',' sta $d011',
 ' lda #$30',' sta $d012',
 ' lda #<frame346_irq',' sta $fffe',
 ' lda #>frame346_irq',' sta $ffff',
 ' lda #$01',' sta $d019',' sta $d01a',
 ' cli',
 'frame346_idle',' jmp frame346_idle',
 // Crucial: PUSH ACCUMULATOR before the FIRST LDA/CMP/STA in an interrupt.
 'frame346_irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 ' lda irq_row',' cmp #$19',' bne frame346_row_irq',
 ' jmp frame346_vblank',
 'frame346_row_irq',
 ' clc',' adc frame_pal_base',' tax',
 ' lda frame346_bg0,x',' sta $d021',
 ' lda frame346_bg1,x',' sta $d022',
 ' lda frame346_bg2,x',' sta $d023',
 ' lda frame346_bg3,x',' sta $d024',
 ' inc irq_row',
 ' lda irq_row',' cmp #$19',' bne frame346_next_row',
 ' lda #$fc',' sta $d012',
 ' jmp frame346_exit',
 'frame346_next_row',
 ' asl',' asl',' asl',' clc',' adc #$30',' sta $d012',
 ' jmp frame346_exit',
 'frame346_vblank',
 ' lda #$00',' sta irq_row',
 ' lda #$30',' sta $d012',
 ' lda duration_lo',' bne frame346_decrease_lo',
 ' dec duration_hi',
 'frame346_decrease_lo',' dec duration_lo',
 ' lda duration_lo',' ora duration_hi',' bne frame346_exit',
 ' inc frame_idx',' lda frame_idx',' cmp #'+h(n),' bcc frame346_next_frame',
 ' lda #$00',' sta frame_idx',
 'frame346_next_frame',
 ' ldx frame_idx',
 ' lda frame346_dur_lo,x',' sta duration_lo',
 ' lda frame346_dur_hi,x',' sta duration_hi',
 ' lda frame346_base,x',' sta frame_pal_base',
 ' lda frame346_border,x',' sta $d020',
 ' jsr frame346_patch',
 'frame346_exit',
 ' pla',' tay',' pla',' tax',' pla',' rti',
 'frame346_patch',
 ' ldx frame_idx'
 ];
 for(var i=0;i<n-1;i++)code.push(' cpx #'+h(i),' bne frame346_try_'+(i+1),' jmp patch_frame_'+i,'frame346_try_'+(i+1));
 code.push(' jmp patch_frame_'+(n-1));
 emit(code,'frame346_dur_lo',fs.map(function(f){return f.duration&255;}));
 emit(code,'frame346_dur_hi',fs.map(function(f){return f.duration>>8;}));
 emit(code,'frame346_base',fs.map(function(_,i){return i*25;}));
 emit(code,'frame346_border',fs.map(function(f){return f.border;}));
 code.push('*=$3800');
 emit(code,'frame346_charset',plan.glyphs);
 code.push('*=$4000');
 plan.patchASM.forEach(function(s){code.push(s);});
 code.push('*=$6000');
 var screen0=fs[0].screen.slice(),col0=fs[0].colors.slice();
 while(screen0.length<1024)screen0.push(0);
 while(col0.length<1024)col0.push(0);
 emit(code,'frame346_screen',screen0);
 code.push('*=$6400');
 emit(code,'frame346_color',col0);
 code.push('*=$7000');
 for(var reg=0;reg<4;reg++){
  var rows=[];
  fs.forEach(function(f){f.rowPal.forEach(function(colors){rows.push(colors[reg]);});});
  emit(code,'frame346_bg'+reg,rows);
 }
 return code.join('\n')+'\n';
}
function assemble(source,plan){
 var app=typeof g_app==='undefined'?null:g_app,assembler=app&&app.assembler;
 if(!assembler||typeof assembler.assemble!=='function')throw Error('TEST346: ensamblador del editor no disponible.');
 var result=assembler.assemble(source,0x0801);
 if(!result||!result.success){
  var msg=((result&&result.errors)||[]).map(function(e){return e.message||String(e);}).join(' | ');
  throw Error('TEST346 ASM: '+(msg||'error de ensamblado sin detalles'));
 }
 var mem=assembler.getMemory();
 for(var gi=0;gi<512;gi++){
  if((mem[0x3800+gi]&255)!==plan.glyphs[gi])
   throw Error('TEST346: charset sobrescrito en $'+(0x3800+gi).toString(16));
 }
 for(var pi=0;pi<1000;pi++){
  if((mem[0x6000+pi]&255)!==plan.frames[0].screen[pi])
   throw Error('TEST346: pantalla inicial sobrescrita en byte '+pi);
  if((mem[0x6400+pi]&255)!==plan.frames[0].colors[pi])
   throw Error('TEST346: color inicial sobrescrito en byte '+pi);
 }
 if(result.start!==0x0801||result.end<=0x7000||result.end>=0x8000)
  throw Error('TEST346: rango de PRG inesperado: '+w(result.start)+'..'+w(result.end));
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
  var plan=collect(this,args||{}),asm=build(plan),prg=assemble(asm,plan);
  this.prg=prg;
  window.RICO_TEST346_LAST_REPORT={status:'PRG GENERADO; PENDIENTE DE VICE',frames:plan.reports,
    charsetBytes:512,patchBytes:plan.patchBytes,maxTransitionCycles:plan.maxCycles,
    backgroundFormat:plan.bgInput,bytes:prg.length};
  window.RICO_TEST346_LAST_ERROR=null;
  if(args&&args.download===false)return prg;
  var fn=(args&&args.filename||'REMISERIA').replace(/\.prg$/i,'');
  if(!/_TEST346$/i.test(fn))fn+='_TEST346';
  if(typeof window.download!=='function')throw Error('TEST346: función download no disponible.');
  window.download(prg,fn+'.prg','application/prg');
  return prg;
 }catch(e){
  window.RICO_TEST346_LAST_ERROR=String(e&&e.message||e);
  console.error('[TEST346 EBCM STATIC]',e);
  if(typeof window.alert==='function')window.alert(window.RICO_TEST346_LAST_ERROR);
  return false;
 }
};
window.RICO_TEST346_STATIC_ECM={version:VERSION,collect:collect,build:build};
console.log('[RICO TEST346] EBCM static delta-frame exporter installed; Map Scroll engines untouched.');

window.RICO_TEST346_BUILD_ID='TEST346 STATIC EBCM 20261109-A1 ABSOLUTE';
try{
 if(typeof document!=='undefined' && document.body){
  var tag=document.createElement('div');
  tag.id='rico-test346-build-marker';
  tag.textContent='TEST346 · EBCM FRAMES · V346-A1';
  tag.style.cssText='position:fixed;right:12px;bottom:12px;background:#151515;color:#f0f0f0;border:1px solid #b0b0b0;padding:8px 12px;font:600 12px Arial,sans-serif;z-index:999999;pointer-events:none;opacity:.95;border-radius:4px';
  document.body.appendChild(tag);
 }
}catch(e){console.warn('TEST346 UI marker',e);}
})();