(function(){
'use strict';
/* TEST260 — Restore native character animation during diagonal Map Scroll.
 * Standalone Group Animate remains from TEST186; native 5-mode glyph
 * animation is transplanted exactly from the original TEST168/175 6502
 * glyph engine. Shared PAL IRQ schedules one native tick per frame,
 * main thread shares its spare-time budget fairly with Group Animate.
 *
 * No graphics, Color RAM, raster bands, scroll tick, or camera modifications.
 */
var D=window.RICO_TEST196_DIAGONAL,V=window.RICO_TEST168_PRG_LARGE_MAP;
if(!D||!D.build||!V||!V.buildSource)return;
var previous=D.build,N='\n';
var K={left:0,right:1,up:2,down:3,blink:4};
function once(s,a,b,label){
 if(s.split(a).length!==2)throw Error('TEST260 '+label+' changed; export refused rather than drop animations');
 return s.replace(a,b);
}
function nums(a){return Array.from(a||[]);}
function getRecords(self,d){
 var ed=self&&self.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
 var ts=layer&&layer.getTileSet&&layer.getTileSet(),store=ts&&ts.getDocRecord&&ts.getDocRecord().data;
 if(!store)throw Error('TEST260: no TileSet editable para exportar caracteres animados');
 var groups=store.ricoGroupAnimationsV1||{},motion=[],switches=[];
 for(var bank=1;bank<=2;bank++)for(var g of groups['bank'+bank]||[]){
  if(!g)continue;
  if(g.type==='switch-bank')switches.push({bank,g});else motion.push({bank,g});
 }
 if(motion.length>1)throw Error('TEST260: mas de un Group Animate con Map Scroll requiere multiples planificadores; no se descartara ninguno');
 if(switches.length)throw Error('TEST260: Switch Bank con diagonal no se exporta sin scheduler; no ocultar el efecto');
 if(motion.length&&!d.group)throw Error('TEST260: el Group Animate existente no fue reconocido por el motor; se detiene exportacion para no perderlo');
 var bankTiles=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData],used=new Uint8Array(256);
 for(const raw of d.map)used[raw&255]=1;
 var records=[];
 for(var bi=0;bi<2;bi++){
  var tiles=bankTiles[bi];if(!tiles||tiles.length<256)continue;
  for(var code=0;code<256;code++){
   var props=tiles[code]&&tiles[code].props||{},kind=props.animated;
   if(kind===undefined||kind===null||kind===false||kind===''||kind==='none')continue;
   if(!used[code])continue;
   if(!Object.prototype.hasOwnProperty.call(K,kind))
    throw Error('TEST260: animacion individual '+String(kind)+' en BANK '+(bi+1)+' CHR '+code+' no implementada; no se exportara estatico');
   if(d.group&&d.group.bank===bi+1&&d.group.codes[code])
    throw Error('TEST260: CHR '+code+' BANK '+(bi+1)+' pertenece a Group Animate y animacion individual. No pueden modificar el mismo bitmap.');
   var ticks=Number(props.ticksPerFrame);
   if(!Number.isInteger(ticks)||ticks<1)ticks=1;
   if(ticks>255)throw Error('TEST260: CHR '+code+' tiene ticks individuales >255 sin soporte de 16 bits');
   records.push({bank:bi+1,code,ticks,type:K[kind],address:(bi?0x3800:0x3000)+code*8});
  }
 }
 return records;
}
function sourceForNative(d){
 var fake={width:40,height:32,type:'up',ticks:1,pixels:1,duration:128,
  bg:d.bg||0,border:d.border||0,bank:d.bank||1,
  window:{x:0,y:0,width:40,height:25},area:{x:0,y:0,width:40,height:32},
  initialRow:0,bank1:d.bank1,bank2:d.bank2,
  map:Array(1280).fill(32),colors:Array(1280).fill(7),
  anim175:{records:d.native260,group:null,switchTicks:0}};
 var vertical=V.buildSource(fake),start=vertical.indexOf(N+'anim175_tick'+N),
     stop=vertical.indexOf(N+'*=$3000'+N+'charset_bank1',start);
 if(start<0||stop<0||start===stop||vertical.slice(start,stop).indexOf('anim175_pending')<0)
  throw Error('TEST260: helper animador TEST175 no identificable, no exportar silenciosamente');
 return vertical.slice(start,stop);
}
function placeSafe(s,body){
 // TEST254/257 upper/lower color tables end near $C340, below $C400.
 // A standalone TEST182/183 Group block occupies A000..<=B800 with
 // max 256 animated characters and its source at A800..<=B800.
 // RLE streams can extend beyond C400: refuse that combination.
 var rle=window.RICO_TEST236_LAST_BUILD||{};
 if(rle.selected&&rle.mode!=='original fallback')
  throw Error('TEST260: plan de colores RLE no reserva espacio suficiente para animador independiente; no descartamos animaciones');
 return s+N+'*=$c400'+N+
  'anim175_ptr_lo=$30'+N+'anim175_ptr_hi=$31'+N+
  'anim175_dest_lo=$32'+N+'anim175_dest_hi=$33'+N+
  'anim175_temp=$34'+N+
  body+
  'anim260_fair'+N+'!byte $00'+N+
  'anim260_irq_tick'+N+
  ' lda anim175_pending'+N+' cmp #$ff'+N+
  ' beq anim260_irq_done'+N+
  ' inc anim175_pending'+N+
  'anim260_irq_done'+N+' rts'+N;
}
function patchScheduler(s,hasGroup){
 var first=s.indexOf(N+'main_group'+N),last=first<0?-1:s.indexOf(N+'irq'+N,first);
 if(first<0||last<0)throw Error('TEST260: main_group no encontrado; no anular Group Animate');
 var repl=[
  'main_group',
  // Alternating chance when BOTH effects have a pending step. Neither
  // group nor native is permanently favored.
  ' lda anim175_pending',' beq anim260_try_group',
  ' lda group182_pending',' beq anim260_native',
  ' lda anim260_fair',' eor #$01',' sta anim260_fair',
  ' bne anim260_native',
  'anim260_try_group',
  ' lda group182_pending',' beq main_loop',
  ' jsr group182_step',' jmp main_loop',
  'anim260_native',
  ' jsr anim175_tick',' jmp main_loop'
 ].join(N)+N;
 s=s.slice(0,first)+N+repl+s.slice(last);
 // Three IRQs per screen move: tick once at phase0, independently of
 // phase1/phase2. Two-stage: tick at middle. Generic: once at IRQ entry.
 if(s.includes(N+'t250_first'+N)){
  s=once(s,'t250_first'+N+' jsr t253_first',
   't250_first'+N+' jsr anim260_irq_tick'+N+' jsr t253_first',
   '3-band first-phase native tick');
 }else if(s.includes(N+'irq_mid244'+N)){
  s=once(s,'irq_mid244'+N,
   'irq_mid244'+N+' jsr anim260_irq_tick'+N,
   '2-band midphase native tick');
 }else{
  s=once(s,' sta $d019'+N+' lda main_busy',
   ' sta $d019'+N+' jsr anim260_irq_tick'+N+' lda main_busy',
   'generic single IRQ native tick');
 }
 return s;
}
D.build=function(d){
 var s=previous(d),records=d&&d.native260||[];
 var stat={version:260,selected:false,
  group:!!(d&&d.group),individuals:records.length,reason:'no individual chars'};
 if(records.length){
  s=patchScheduler(s,!!d.group);
  s=placeSafe(s,sourceForNative(d));
  stat={version:260,selected:true,individuals:records.length,group:!!d.group,
   destination:'C400..CFFF',banks:[...new Set(records.map(r=>r.bank))],
   scheduler:'one native tick per PAL frame, group/native fair spare-time dispatch',
   charset:'both original banks, no glyphs skipped',
   map:'unchanged',raster:'unchanged',
   status:'experimental awaiting VICE'};
 }
 window.RICO_TEST260_LAST_BUILD=stat;
 console.log('[TEST260 MAP/GROUP/NATIVE CHAR INTEGRATION]',stat);
 return s;
};
window.RICO_TEST260_CHAR_ANIM={version:260,attach:function(self,d){
 if(!d||!Array.isArray(d.map))throw Error('TEST260: missing map');
 d.native260=getRecords(self,d);
 return d;
},nativeSource:sourceForNative};
})();