(function(){
'use strict';
/* TEST207 — SID adapter inspired by James' original LVLLVL:
   jaammees/lvllvl/src/js/textMode/c64export/export.asm
   Same PSID load/init/play contracts and IRQ play convention, NOT SCUMM.
   TEST208: 1 or more frames; 8 is a test target, NEVER a minimum.
   TEST229 expands non-relocatable PSID range to $1000-$2FFF when a safe core slot exists. */
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST206_COMPACT_FRAMES){
  console.error('[RICO TEST207] TEST206 compact engine missing');return;
}
var preceding=ToPRGAdv.prototype.createPRG,compact=window.RICO_TEST206_COMPACT_FRAMES;
var SID_STATE={data:null,enabled:false,name:'',speed:0,lastMessage:''};
var MEM={sidStart:0x1000,sidEnd:0x3000,patchStart:0xb000,patchEnd:0xb800};
function h2(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function hx(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function be16(b,p){return(b[p]<<8)|b[p+1];}
function be32(b,p){return ((b[p]*0x1000000)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3])>>>0;}
// TEST209: Decode a CIA Timer A latch from the SID's OWN 6502 init code,
// instead of interpreting the PSID CIA bit as a fixed 60 Hz tempo.
// Supports LDA/LDX/LDY immediate followed by STA/STX/STY to $DC04/$DC05.
// An ambiguous or undetectable latch retains TEST208's existing fallback.
function detectCIATimer209(bytes,clockFlag){
 var stores={0x8d:0xa9,0x8e:0xa2,0x8c:0xa0};
 function immediateBefore(pc,loadOp){
   // Restrict to a small basic block preceding this hardware write.
   for(var p=pc-2;p>=Math.max(0,pc-12);p--)
     if(bytes[p]===loadOp)return bytes[p+1];
   return null;
 }
 var results=[];
 for(var i=2;i+2<bytes.length;i++){
   var op=bytes[i];
   if(stores[op]===undefined||bytes[i+1]!==4||bytes[i+2]!==0xdc)continue;
   var lo=immediateBefore(i,stores[op]);if(lo===null)continue;
   for(var j=i+3;j<=Math.min(i+15,bytes.length-3);j++){
     var hiOp=bytes[j];
     if(stores[hiOp]===undefined||bytes[j+1]!==5||bytes[j+2]!==0xdc)continue;
     var hi=immediateBefore(j,stores[hiOp]);if(hi===null)continue;
     var latch=lo+(hi<<8);
     if(latch<1)continue;
     var cpuClock=clockFlag===2?1022727:985248; // NTSC vs PAL C64.
     var hz=cpuClock/(latch+1);
     if(hz<10||hz>200)continue; // Discard probable code/data false matches.
     results.push({latch:latch,hz:hz,clock:cpuClock});
   }
 }
 // Never guess when multiple distinct timer values were detected.
 var distinct={};
 for(var k=0;k<results.length;k++)distinct[results[k].latch]=results[k];
 var keys=Object.keys(distinct);
 return keys.length===1?distinct[keys[0]]:null;
}

function parseSID(raw){
 var data=raw instanceof Uint8Array?raw:ArrayBuffer.isView(raw)?new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength):raw instanceof ArrayBuffer?new Uint8Array(raw):Array.isArray(raw)?new Uint8Array(raw):null;
 if(!data||data.length<118)throw new Error('SID: falta un archivo PSID valido.');
 var signature=String.fromCharCode.apply(null,Array.prototype.slice.call(data,0,4));
 if(signature==='RSID')throw new Error('TEST207: RSID requiere un entorno de sistema/CIA que nuestro runtime aun no proporciona.');
 if(signature!=='PSID')throw new Error('TEST207: el archivo debe comenzar con PSID.');
 var offset=be16(data,6),version=be16(data,4);
 if(version<1||version>4||offset<118||offset>=data.length)throw new Error('SID: cabecera o version PSID invalida.');
 var load=be16(data,8),start=offset;
 if(load===0){
  if(data.length-offset<2)throw new Error('SID: direccion de carga indirecta incompleta.');
  load=data[offset]|(data[offset+1]<<8);start+=2;
 }
 var body=data.slice(start),init=be16(data,10)||load,play=be16(data,12);
 var songs=be16(data,14)||1,startSong=be16(data,16)||1,speedBits=be32(data,18);
 if(!play)throw new Error('SID sin direccion PLAY: necesita controlador propio; TEST207 usa JSR play como LVLLVL.');
 if(startSong>songs)throw new Error('SID: subtune inicial fuera de rango.');
 var clockFlag=version>=2&&data.length>=120? (be16(data,0x76)>>2)&3:0;
 var subtuneBit=startSong<=32?((speedBits>>>(startSong-1))&1):0;
 // PSID speed bit requests CIA timing: emulate ~60Hz on PAL by playing
 // six times every five 50Hz frames. Do not reject compatible PSIDs.
 if(load<MEM.sidStart||load+body.length>MEM.sidEnd)
  throw new Error('TEST229: el PSID carga en '+hx(load)+' y mide '+body.length+' bytes. El banco SID admitido es $1000-$2FFF (8 KB), sin reubicar la musica; $3000 empieza el charset.');
 if(init<load||init>=load+body.length||play<load||play>=load+body.length)throw new Error('SID: las direcciones INIT/PLAY deben estar dentro de los bytes cargados, para esta primera prueba.');
 var timer209=subtuneBit?detectCIATimer209(body,clockFlag):null;
 return {version,load,init,play,bytes:body,subtune:startSong-1,songs,speedBits,clockFlag,ciaTiming:!!subtuneBit,ciaTimer:timer209};
}
function bytesToAsm(u){
 var result=[];for(var i=0;i<u.length;i+=16)result.push('!byte '+Array.prototype.slice.call(u,i,i+16).map(h2).join(','));
 return result.join('\n');
}
function replaceOnce(src,target,replacement){
 var i=src.indexOf(target);
 if(i<0||src.indexOf(target,i+target.length)>=0)throw new Error('TEST207: cambió una ancla de TEST206: '+target.slice(0,65));
 return src.slice(0,i)+replacement+src.slice(i+target.length);
}
function validatePatchBank(alloc){
 var collisions=alloc.entries.filter(function(x){return x.address<MEM.patchEnd&&x.address+x.bytes.length>MEM.patchStart;});
 if(collisions.length)throw new Error('TEST207: los recursos ya ocupan $B000-$B7FF. Es necesario reducir Scroll Area o frames para reservar Color RAM.');
}
// TEST211 common audio ABI for the LVLLVL exporter and future SCUMM bridge:
// (1) INIT captures a private $F0-$FF SID state;
// (2) every PLAY saves/restores the engine $F0-$FF;
// (3) for native CIA: INIT => raster IRQ armed => one-shot start,
//     CIA IRQ owns audio, VIC IRQ owns animation. Frame count is irrelevant.
function buildSidShared211(sid,useHardwareCIA){
 var out=[
 'sid_init_protected211',
 ' ldx #$00',
 'sid_init_save211',
 ' lda $f0,x',' sta sid_engine_zp211,x',
 ' inx',' cpx #$10',' bne sid_init_save211',
 ' lda #'+h2(sid.subtune),
 ' jsr '+hx(sid.init),
 ' ldx #$00',
 'sid_init_capture211',
 ' lda $f0,x',' sta sid_private_zp211,x',
 ' lda sid_engine_zp211,x',' sta $f0,x',
 ' inx',' cpx #$10',' bne sid_init_capture211',
 ' rts',
 'sid_play_protected211',
 ' inc sid_audio_ticks_lo211',
 ' bne sid_audio_counted211',
 ' inc sid_audio_ticks_hi211',
 'sid_audio_counted211',
 ' ldx #$00',
 'sid_play_swapin211',
 ' lda $f0,x',' sta sid_engine_zp211,x',
 ' lda sid_private_zp211,x',' sta $f0,x',
 ' inx',' cpx #$10',' bne sid_play_swapin211',
 ' jsr '+hx(sid.play),
 ' ldx #$00',
 'sid_play_swapout211',
 ' lda $f0,x',' sta sid_private_zp211,x',
 ' lda sid_engine_zp211,x',' sta $f0,x',
 ' inx',' cpx #$10',' bne sid_play_swapout211',
 ' rts',
 'sid_engine_zp211',
 '!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00',
 'sid_private_zp211',
 '!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00',
 'sid_audio_ticks_lo211','!byte $00',
 'sid_audio_ticks_hi211','!byte $00',
 'sid_video_ticks_lo211','!byte $00',
 'sid_video_ticks_hi211','!byte $00'
 ];
 if(useHardwareCIA)out.push(
 'sid_cia_pending211','!byte $00',
 'sid_start_gate211','!byte $00',
 'sid_audio_only211',
 ' pla',' tay',' pla',' tax',' pla',' rti'
 );
 return out.join('\n');
}

// TEST229: keep non-relocatable SID bytes at their declared LOAD address.
// Move LVLLVL core ($2000-$2FFF) to unoccupied RAM when SID overlaps it.
// The BASIC SYS entry must follow the core. Never touch charset $3000/$3800.
function sidSourceRegions229(source){
 var chunks=[],at=-1,block=null,lines=source.split(/\r?\n/);
 for(var i=0;i<lines.length;i++){
  var line=lines[i].split(';')[0].trim(),m=line.match(/^\*=\$([0-9a-f]{4})$/i);
  if(m){at=parseInt(m[1],16);block={start:at,end:at,core:at===0x2000};chunks.push(block);continue;}
  if(!block||!line)continue;
  var count=0;
  if(/^!byte\s+/i.test(line))count=line.replace(/^!byte\s+/i,'').split(',').length;
  else if(/^!word\s+/i.test(line))count=2*line.replace(/^!word\s+/i,'').split(',').length;
  else if(/^!fill\s+/i.test(line)){var q=line.match(/^!fill\s+(\d+)/i);if(!q)throw new Error('TEST229: directiva !fill no verificable');count=+q[1];}
  else if(/^!text\s+/i.test(line))throw new Error('TEST229: !text sin tamaño fiable');
  else if(/^[a-z]{3}(?:\s|$)/i.test(line))count=3; // safe upper bound for 6502 instruction
  at+=count;block.end=at;
 }
 return chunks;
}
function chooseCoreSlot229(source){
 var blocks=sidSourceRegions229(source),main=blocks.filter(function(x){return x.core;});
 if(main.length!==1)throw new Error('TEST229: se esperaba un único bloque de motor en $2000.');
 // Leave 4 KB for the core PLUS SID helper. If an existing source segment
 // overlaps the slot, reject it; never corrupt art/frames or SID buffers.
 var slots=[0xc000,0x9000,0x8000,0x6000,0x5000];
 for(var j=0;j<slots.length;j++){
  var start=slots[j],end=start+0x1000;
  var occupied=blocks.some(function(b){return !b.core&&b.start<end&&b.end>start;});
  if(!occupied)return start;
 }
 throw new Error('TEST229: no hay banco de 4 KB libre para trasladar el motor; reduce el mapa/frames o revisa las tablas de color. No se genera un PRG corrupto.');
}
function relocateCoreForSID229(source,sid){
 var s0=sid.load,s1=sid.load+sid.bytes.length;
 if(s1<=0x2000||s0>=0x3000)return source; // legacy SID exactly unchanged
 var base=chooseCoreSlot229(source);
 var sys=String(base),ascii=Array.from(sys).map(function(v){return h2(v.charCodeAt(0));});
 var next=0x0801+6+ascii.length;
 var header='!byte '+[h2(next),h2(next>>8),'$0a','$00','$9e'].concat(ascii,['$00','$00','$00']).join(',');
 // The original BASIC SYS8192 header uses 4 digits; the new SYS
 // is usually 5 digits. Calculate linked-list pointer from actual size.
 var re=/!byte \$0b,\$08,\$0a,\$00,\$9e,\$38,\$31,\$39,\$32,\$00,\$00,\$00(?:[^\n]*)?/i;
 if(!re.test(source))throw new Error('TEST229: cabecera BASIC SYS8192 no reconocida.');
 source=source.replace(re,header+' ; 10 SYS'+sys);
 source=replaceOnce(source,'*=$2000\n','*='+hx(base)+'\n');
 window.RICO_TEST229_LAST_LAYOUT={sidStart:hx(s0),sidEnd:hx(s1-1),coreStart:hx(base),coreEnd:hx(base+0xfff),sys:base};
 console.log('[RICO TEST229] SID ampliado sin reubicacion:',window.RICO_TEST229_LAST_LAYOUT);
 return source;
}

function makeSource207(source,sid,speed){
 window.RICO_TEST229_LAST_LAYOUT=null;
 source=relocateCoreForSID229(source,sid);
 if(/^\*=\$1[0-9a-f]{3}\s*$/im.test(source))
  throw new Error('TEST228: el player visual ocupa $1000-$1FFF, reservado para el SID.');
 // Only relocate the sparse color lists if the output contains them.
 var edits=0;
 source=source.replace(/\$(1[0-7])00,([xy])/gi,function(_,hi,reg){edits++;return '$'+(0xb0+parseInt(hi,16)-0x10).toString(16)+'00,'+reg;});
 // TEST228: horizontal TEST220 may have 40 legitimate color-index references.
 // Verify memory banking collisions instead of requiring a specific reference count.
 // The working Color RAM indices move into $B000-$B7FF when SID occupies $1000+.
 if(edits&&/^\*=\$b[0-7][0-9a-f]{2}\s*$/im.test(source))
  throw new Error('TEST228: tablas compactas ocupan $B000-$B7FF, reservado para los índices de colores cuando hay SID.');
 if(/\$(?:1[0-7])00,[xy]/i.test(source))throw new Error('TEST211: quedan referencias a listas de color en la RAM del SID.');

 // Audio INIT leaves zero-page private variables at $F0-$FF.
 // Capture them and restore the graphics engine's previous page zero.
 source=replaceOnce(source,' lda #$01\n sta $d01a\n lda #$fa\n sta $d012',
  ' jsr sid_init_protected211\n lda #$01\n sta $d01a\n lda #$fa\n sta $d012');

 var hardware=speed==='cia-hardware210';
 var fractional=speed!==1&&speed!==2&&speed!==60&&!hardware;
 var play=fractional?'':' jsr sid_play_protected211\n';
 if(speed===2)play+=' jsr sid_play_protected211\n';
 if(speed===60){
   play+=' lda sid_phase208\n clc\n adc #$0a\n cmp #$32\n bcc sid_due208\n';
   play+=' sec\n sbc #$32\n sta sid_phase208\n jsr sid_play_protected211\n jmp sid_end208\n';
   play+='sid_due208\n sta sid_phase208\nsid_end208\n';
 }
 var fraction=0;
 if(fractional){
   var rate256=Math.round(speed*256/50),whole=Math.floor(rate256/256);
   fraction=rate256&255;
   for(var k=0;k<whole;k++)play+=' jsr sid_play_protected211\n';
   if(fraction){
     play+=' lda sid_phase209\n clc\n adc #'+h2(fraction)+'\n';
     play+=' sta sid_phase209\n bcc sid_skip209\n';
     play+=' jsr sid_play_protected211\nsid_skip209\n';
   }
 }
 if(hardware){
   // Follow the exact proven SCUMM-PET-C64 order: INIT first, install IRQ
   // vector with CIA disabled, then enable Timer A ONLY on first VIC raster.
   // The SID's own INIT-provided $DC04/$DC05 latch is never changed here.
   source=replaceOnce(source,' sta $ffff\n cli',
     ' sta $ffff\n lda #$00\n sta sid_start_gate211\n lda #$7f\n sta $dc0d\n lda $dc0d\n lda #$00\n sta $dc0e\n cli');
   source=replaceOnce(source,'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019',
     'irq\n pha\n txa\n pha\n tya\n pha\n lda $dc0d\n and #$01\n sta sid_cia_pending211\n beq sid_no_cia211\n jsr sid_play_protected211\nsid_no_cia211\n lda $d019\n and #$01\n bne sid_vic211\n jmp sid_audio_only211\nsid_vic211\n lda #$01\n sta $d019\n inc sid_video_ticks_lo211\n bne sid_video_counted211\n inc sid_video_ticks_hi211\nsid_video_counted211\n lda sid_start_gate211\n bne sid_vic_armed211\n lda #$81\n sta $dc0d\n lda #$11\n sta $dc0e\n lda #$01\n sta sid_start_gate211\nsid_vic_armed211');
 }else{
   // Standard SID timing still uses the shared private-ZP PLAY wrapper.
   source=replaceOnce(source,'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019',
    'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019\n inc sid_video_ticks_lo211\n bne sid_video_counted211\n inc sid_video_ticks_hi211\nsid_video_counted211\n'+play.trimEnd());
 }
 if(speed===60)source=replaceOnce(source,'*=$3000\ncharset_bank1',
  'sid_phase208\n!byte $00\n*=$3000\ncharset_bank1');
 if(fractional&&fraction)source=replaceOnce(source,'*=$3000\ncharset_bank1',
  'sid_phase209\n!byte '+h2((256-fraction)&255)+'\n*=$3000\ncharset_bank1');

 // Our SID ABI helper occupies only the free tail of the existing code bank.
 // No SCUMM addresses are copied; BANK$B000 can be used by compact frames.
 source=replaceOnce(source,'*=$3000\ncharset_bank1',
  buildSidShared211(sid,hardware)+'\n*=$3000\ncharset_bank1');
 var coreAnchor=window.RICO_TEST229_LAST_LAYOUT&&sid.load+sid.bytes.length>0x2000?'*='+window.RICO_TEST229_LAST_LAYOUT.coreStart+'\n':'*=$2000\n';
 source=replaceOnce(source,coreAnchor,
  '*='+hx(sid.load)+'\nSID_ORIGINAL_LVLLVL_TEST211\n'+bytesToAsm(sid.bytes)+'\n'+coreAnchor);
 // Additional safety: verify the relocated code still fits in its full 4KB
 // and that no other source region intrudes after INIT/PLAY integration.
 if(window.RICO_TEST229_LAST_LAYOUT){
  var home=window.RICO_TEST229_LAST_LAYOUT.sys,regions=sidSourceRegions229(source);
  var core=regions.filter(function(r){return r.start===home;});
  if(core.length!==1||core[0].end>home+0x1000)
   throw new Error('TEST229: motor + rutinas SID superan 4 KB del banco reubicado.');
  if(regions.some(function(r){return r!==core[0]&&r.start<home+0x1000&&r.end>home;}))
   throw new Error('TEST229: se detecto solapamiento de recursos con el motor reubicado.');
 }
 return source;
}
function export207(self,args,raw){
 var graphic=self.editor&&self.editor.graphic,fr=graphic&&graphic.frames||[];
 if(!fr.length)throw new Error('TEST208: el proyecto no contiene frames.');
 var sid=parseSID(raw);
 // TEST212: don't use args.sidSpeed as authoritative for audio playback.
 // Original LVLLVL may supply its own default '1', silently forcing 50Hz
 // even when the dedicated RICO SID option clearly displays 'Auto'.
 // Read the visible SID selector directly; explicit programmatic overrides
 // use our namespaced sidPlaybackMode212 key ONLY.
 var sidSpeedControl212=typeof document!=='undefined'&&document.getElementById('ricoSid207Speed');
 var playbackMode212=sidSpeedControl212?Number(sidSpeedControl212.value):SID_STATE.speed;
 if(args&&Object.prototype.hasOwnProperty.call(args,'sidPlaybackMode212'))
   playbackMode212=Number(args.sidPlaybackMode212);
 if(playbackMode212!==1&&playbackMode212!==2)playbackMode212=0;
 SID_STATE.speed=playbackMode212;
 var hardware210=sid.ciaTiming&&!!sid.ciaTimer&&playbackMode212===0;
 var speed=hardware210?'cia-hardware210':playbackMode212===1||playbackMode212===2?playbackMode212:(sid.ciaTiming?60:1);
 if(playbackMode212===0&&sid.ciaTiming&&sid.ciaTimer&&speed!=='cia-hardware210')
   throw new Error('TEST212: AUTO CIA seleccionado pero no se activo el temporizador hardware.');
 SID_STATE.lastTempo209=hardware210?('TEST212 AUTO CIA Timer A real $'+('0000'+sid.ciaTimer.latch.toString(16)).slice(-4)+' ≈ '+sid.ciaTimer.hz.toFixed(2)+' Hz'):sid.ciaTiming?('CIA sin latch detectable o modo manual; tempo '+(speed===60?'fallback':'seleccionado')):'VBlank PAL 50 Hz';
 var source;
 if(fr.length===1){
   var bitmapLayer309=null;
   try{bitmapLayer309=self.editor&&self.editor.layers&&self.editor.layers.getSelectedLayerObject();}catch(ignore){}
   var actualBitmap309=!!(bitmapLayer309&&bitmapLayer309.doc&&bitmapLayer309.doc.ricoBitmapV1Enabled&&
     bitmapLayer309.getScreenMode&&bitmapLayer309.getScreenMode()==='c64multicolor');
   if(actualBitmap309){
    // Real Bitmap MC: 8000 bitmap bytes + 1000 screen bytes + Color RAM.
    // Never route it through the HiRes/mixed CHARACTER renderer.
    var bmp309=window.RICO_TEST282_BITMAP,bitmapSid309=window.RICO_TEST309_BITMAP_SID;
    if(!bmp309||typeof bmp309.encode!=='function'||!bitmapSid309)
     throw new Error('TEST309: faltan los módulos de Bitmap Multicolor + SID.');
    var image309=bmp309.encode(self.editor);
    source=bitmapSid309.buildSource(image309);
    window.RICO_TEST309_LAST_BITMAP={mode:'C64 Bitmap Multicolor',source:'TEST282',
       sidAudio:'TEST207/229 unchanged',bitmapBytes:image309.bitmap.length,
       screenBytes:image309.screen.length,colorBytes:image309.color.length,
       sourceWidth:image309.sourceWidth,sourceHeight:image309.sourceHeight,
       cropped:!!image309.cropped};
   }else{
   // One-frame export needs no multi-frame storage, and works with horizontal,
   // diagonal or still frame. Reuse their tested routines.
   var type=fr[0].ricoMapScrollV1&&fr[0].ricoMapScrollV1.type||'';
   var diagonal=window.RICO_TEST196_DIAGONAL;
   var horizontal=window.RICO_TEST186_HORIZONTAL;
   if(/^diag-(?:up|down)-(?:left|right)$/.test(type)){
     if(!diagonal)throw new Error('Falta el exportador diagonal TEST203.');
     source=diagonal.build(diagonal.collect(self));
   }else{
     if(!horizontal)throw new Error('Falta el exportador horizontal TEST203.');
     if(type==='left'||type==='right'){
       source=horizontal.build(horizontal.collect(self));
     }else if(!type){
       // Static frame: synthesize a zero-speed horizontal camera *only* for
       // export, leaving the editable original frame completely unchanged.
       var original=fr[0],e=self.editor,gg=Object.create(graphic);
       var sw=original.ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};
       var sa=original.ricoScrollAreaV1||{x:0,y:0,width:40,height:25};
       if(sw.width!==40||sw.height!==25)sw={x:0,y:0,width:40,height:25};
       if(sa.width<40||sa.height<25)sa={x:sw.x||0,y:sw.y||0,width:40,height:25};
       gg.frames=[Object.assign({},original,{ricoWindowDimensionV1:sw,ricoScrollAreaV1:sa,
          ricoMapScrollV1:{type:'right',ticksPerStep:1,pixelsPerStep:1}})];
       var ee=Object.create(e);ee.graphic=gg;
       var vv=Object.create(self);vv.editor=ee;
       var one=horizontal.collect(vv);one.pixels=0;
       source=horizontal.build(one);
     }else throw new Error('TEST208: el tipo de scroll '+type+' aun requiere integrar el player musical; no se exportara con musica omitida.');
   }
   }
 }else{
   var frames=compact.collect(self),alloc=compact.pack(frames);
   validatePatchBank(alloc);
   source=compact.build({frames:frames,packed:alloc});
 }
 // TEST309: preserve the original VIC-II per-cell mixed character design.
 // 'c64multicolor' is only the global permission ($D016 bit4); each cell's
 // Color RAM bit3 independently selects HiRes (0) or Multicolor (1).
 // Never OR #$08 into foreground colors or normalize them to one mode.
 var layer309=null;
 try{layer309=self.editor&&self.editor.layers&&self.editor.layers.getSelectedLayerObject();}catch(ignore){}
 var mixedChar309=!!(layer309&&layer309.getScreenMode&&
  layer309.getScreenMode()==='c64multicolor'&&
  !(layer309.doc&&layer309.doc.ricoBitmapV1Enabled));
 if(mixedChar309){
  var adapter309=window.RICO_TEST264_MULTICOLOR;
  var context309=adapter309&&adapter309.context&&adapter309.context(self);
  if(!adapter309||!context309||typeof adapter309.patch!=='function')
   throw new Error('TEST309: falta inicializar el modo de caracteres Multicolor. Recargá la página.');
  // This proven patch only enables VIC global Multicolor and shared colors.
  // World Color RAM data retains its original 0..15 values, including bit3.
  var patched309=adapter309.patch(source,context309);
  source=patched309.source;
  window.RICO_TEST309_LAST_MIXED={
   mode:'MIXED CHARACTER',staticFrame:fr.length===1,
   globalMulticolor:true,d016Writes:patched309.d016,
   sharedMC1:context309.m1.slice(),sharedMC2:context309.m2.slice(),
   perCellColorRamUnchanged:true,
   sidMusicRouting:'TEST207/229 INIT PLAY UNCHANGED'
  };
 }else{
  window.RICO_TEST309_LAST_MIXED={
   mode:layer309&&layer309.doc&&layer309.doc.ricoBitmapV1Enabled?'BITMAP MULTICOLOR (SEPARATE RENDERER)':'HIRES / OTHER',
   globalMulticolor:false,sidMusicRouting:'UNCHANGED'};
 }
 var asm=makeSource207(source,sid,speed);
 var a=g_app&&g_app.assembler;
 if(!a)throw new Error('No se encontró el ensamblador LVLLVL.');
 var assembled=a.assemble(asm,0x0801);
 if(!assembled||!assembled.success){
  var err=(assembled&&assembled.errors||[]).map(function(e){return e.message||String(e);});
  throw new Error('TEST207 ASM: '+err.join(' | '));
 }
 window.RICO_TEST212_LAST_EXPORT={
   mode:speed==='cia-hardware210'?'CIA1 Timer A hardware':speed===1?'50 Hz raster':speed===2?'100 Hz raster':speed===60?'~60 Hz fallback':'fractional 50Hz raster',
   frames:fr.length, sidLoad:hx(sid.load), sidInit:hx(sid.init), sidPlay:hx(sid.play),
   ciaTimer:sid.ciaTimer?hx(sid.ciaTimer.latch):null,
   reportedHz:sid.ciaTimer?Number(sid.ciaTimer.hz.toFixed(3)):null,
   requestedMode:playbackMode212===0?'AUTO':playbackMode212===1?'MANUAL_50':'MANUAL_100',
   legacyArgsSidSpeedIgnored:args&&args.sidSpeed!==undefined?args.sidSpeed:null,
   hardwareCIAGuaranteed:playbackMode212===0&&sid.ciaTiming&&!!sid.ciaTimer
 };
 console.log('[RICO TEST212] actual SID playback route (old args.sidSpeed ignored)',window.RICO_TEST212_LAST_EXPORT);
 var visual210=typeof document!=='undefined'&&document.getElementById('ricoSid207Status');
 if(visual210)visual210.textContent='TEST212 '+window.RICO_TEST212_LAST_EXPORT.requestedMode+' / '+window.RICO_TEST212_LAST_EXPORT.mode+' | '+fr.length+' frame(s) | '+SID_STATE.lastTempo209;
 var mem=a.getMemory(),output=new Uint8Array(2+assembled.end-assembled.start);
 output[0]=assembled.start&255;output[1]=(assembled.start>>8)&255;
 for(var k=assembled.start;k<assembled.end;k++)output[2+k-assembled.start]=mem[k]&255;
 self.prg=output;
 args=args||{};
 if(args.download===false)return output;
 var name=args.filename||'rico-sid-auto-cia-test212.prg';
 if(!/\.prg$/i.test(name))name+='.prg';
 if(typeof window.download!=='function')throw new Error('window.download no disponible.');
 window.download(output,name,'application/prg');
 return output;
}

function exportSelectedEngine228(self,args,raw){
 args=args||{};
 var sid=parseSID(raw);
 var control=typeof document!=='undefined'&&document.getElementById('ricoSid207Speed');
 var requested=control?Number(control.value):SID_STATE.speed;
 if(Object.prototype.hasOwnProperty.call(args,'sidPlaybackMode212'))requested=Number(args.sidPlaybackMode212);
 if(requested!==1&&requested!==2)requested=0;
 SID_STATE.speed=requested;
 var nativeCIA=sid.ciaTiming&&!!sid.ciaTimer&&requested===0;
 var speed=nativeCIA?'cia-hardware210':requested===1||requested===2?requested:(sid.ciaTiming?60:1);
 var assembler=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
 if(!assembler||typeof assembler.assemble!=='function')throw new Error('TEST228: ensamblador no disponible.');
 var oldAssemble=assembler.assemble,oldExport=ToPRGAdv.prototype.createPRG;
 var count=0,attempts=0,output,parsedSource=null;
 try{
  // Reuse exact native source chosen by preceding: Up/Down TEST227,
  // Left/Right TEST220, four TEST221 diagonals, or multiframe TEST206.
  assembler.assemble=function(src,entry){
   attempts++;
   if(typeof src!=='string')throw new Error('TEST228: el exportador no entregó ASM textual.');
   parsedSource=makeSource207(src,sid,speed);
   count++;
   return oldAssemble.call(this,parsedSource,entry);
  };
  // The TEST168 wide vertical viewport calls the public prototype again.
  // Point that recursive call to the underlying visual exporter while busy.
  ToPRGAdv.prototype.createPRG=preceding;
  var silent=Object.assign({},args,{download:false,music:null,sidData:null});
  output=preceding.call(self,silent);
  if(!count)throw new Error('TEST228: esta ruta no llamó al ensamblador; no se exporta sin música.');
  if(!output||output===false||!output.length)
   throw new Error('TEST228: el exportador visual no pudo generar el PRG con SID.');
 }finally{
  assembler.assemble=oldAssemble;
  ToPRGAdv.prototype.createPRG=oldExport;
 }
 var bytes=output instanceof Uint8Array?output:new Uint8Array(output);
 self.prg=bytes;
 var frames=self.editor&&self.editor.graphic&&self.editor.graphic.frames||[];
 window.RICO_TEST228_LAST_EXPORT={
  integrated:true,directions:frames.map(function(f){return f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type||'';}),
  frames:frames.length,assemblers:attempts,patches:count,
  mode:nativeCIA?'CIA1 hardware':speed===1?'PAL 50 Hz':speed===2?'PAL 100 Hz':speed===60?'~60 Hz':'fractional PAL',
  sidLoad:hx(sid.load),sidInit:hx(sid.init),sidPlay:hx(sid.play),
  requestedMode:requested===0?'AUTO':requested===1?'MANUAL_50':'MANUAL_100'
 };
 window.RICO_TEST212_LAST_EXPORT=window.RICO_TEST228_LAST_EXPORT;
 console.log('[RICO TEST229 SID + native Map Scroll]',window.RICO_TEST228_LAST_EXPORT);
 var status=typeof document!=='undefined'&&document.getElementById('ricoSid207Status');
 if(status)status.textContent='TEST229 SID 8KB + scroll: '+window.RICO_TEST228_LAST_EXPORT.mode+' / '+frames.length+' frame(s)';
 if(args.download===false)return bytes;
 var name=args.filename||'rico-mapscroll-sid-test228.prg';
 if(!/\.prg$/i.test(name))name+='.prg';
 if(typeof window.download!=='function')throw new Error('TEST228: descarga no disponible.');
 window.download(bytes,name,'application/prg');
 return bytes;
}

function ensureUI207(){
 if(typeof document==='undefined')return;
 var el=document.getElementById('exportPRGAdvTools');
 if(!el||document.getElementById('ricoSid207Input'))return;
 var box=document.createElement('div');
 box.id='ricoSid207Panel';
 box.style.cssText='margin:8px 16px;padding:8px;border:1px solid #666;font-size:12px;';
 box.innerHTML='<label style="display:block;margin-bottom:5px"><input type="checkbox" id="ricoSid207Enabled"> TEST229 — SID hasta 8KB / Map Scroll todas direcciones</label>'
   +'<input id="ricoSid207Input" type="file" accept=".sid" style="width:260px">'
   +' <select id="ricoSid207Speed" title="Tasa de reproducción SID"><option value="0">Auto — CIA original o VBlank 50 Hz</option><option value="1">50 Hz</option><option value="2">100 Hz</option></select>'
   +'<div id="ricoSid207Status" style="margin-top:5px;color:#bbb">Elegí un archivo .sid. Sólo activa SID cuando tildás la casilla.</div>';
 el.appendChild(box);
 var input=document.getElementById('ricoSid207Input'),flag=document.getElementById('ricoSid207Enabled'),speed=document.getElementById('ricoSid207Speed'),status=document.getElementById('ricoSid207Status');
 function message(msg){SID_STATE.lastMessage=msg;status.textContent=msg;}
 input.addEventListener('change',function(){
   SID_STATE.data=null;SID_STATE.name='';SID_STATE.enabled=false;flag.checked=false;
   var file=input.files&&input.files[0];if(!file){message('Sin SID.');return;}
   var fr=new FileReader();
   fr.onload=function(){
    try {
      var bytes=new Uint8Array(fr.result),info=parseSID(bytes);
      SID_STATE.data=bytes;SID_STATE.name=file.name;SID_STATE.enabled=true;flag.checked=true;
      message('SID: '+file.name+' · LOAD '+hx(info.load)+' · INIT '+hx(info.init)+' · PLAY '+hx(info.play)+' · '+info.bytes.length+' bytes'+(info.ciaTiming?(info.ciaTimer?' · CIA $'+('0000'+info.ciaTimer.latch.toString(16)).slice(-4)+' = '+info.ciaTimer.hz.toFixed(2)+' Hz':' · CIA: tempo no detectado, fallback TEST208'):' · VBlank 50 Hz')+'.');
    }catch(e){message('SID incompatible: '+e.message);}
   };
   fr.readAsArrayBuffer(file);
 });
 flag.addEventListener('change',function(){SID_STATE.enabled=flag.checked;});
 speed.addEventListener('change',function(){var v=Number(speed.value);SID_STATE.speed=v===1||v===2?v:0;});
}
var previousInit=ToPRGAdv.prototype.init;
if(typeof previousInit==='function'){
 ToPRGAdv.prototype.init=function(){var result=previousInit.apply(this,arguments);ensureUI207();return result;};
}
var previousStart=ToPRGAdv.prototype.start;
if(typeof previousStart==='function'){
 ToPRGAdv.prototype.start=function(){var result=previousStart.apply(this,arguments);ensureUI207();return result;};
}
ToPRGAdv.prototype.createPRG=function(args){
 var requiresNative=args&&args.music==='sid';
 var chosen=requiresNative?args.sidData:SID_STATE.enabled&&SID_STATE.data?SID_STATE.data:null;
 if(!chosen){
  // Sin PSID: usar el exportador normal. Solo exigir archivo si SID
  // fue elegido de forma explicita. El scroll no depende del audio.
  if(requiresNative){
   window.RICO_TEST207_LAST_ERROR='Elegiste SID pero no hay un archivo cargado.';
   if(typeof window.alert==='function')window.alert('RICO TEST207 SID: '+window.RICO_TEST207_LAST_ERROR);
   return false;
  }
  return preceding.apply(this,arguments);
 }
 try{
   // TEST308: the stopped one-frame case has a dedicated working PSID route.
   // TEST228 wraps an animated map-scroll visual engine; don't force it on
   // stationary scenes. Preserve the original INIT/PLAY + CIA/VBlank timing.
   var frames=this.editor&&this.editor.graphic&&this.editor.graphic.frames||[];
   var mapType=frames.length===1&&frames[0]&&frames[0].ricoMapScrollV1&&frames[0].ricoMapScrollV1.type||'';
   if(frames.length===1&&!mapType){
    window.RICO_TEST308_SID_ROUTE='STATIC_SID_TEST207';
    return export207(this,args,chosen);
   }
   window.RICO_TEST308_SID_ROUTE='ANIMATED_SID_TEST228';
   return exportSelectedEngine228(this,args,chosen);
  }
 catch(e){
   window.RICO_TEST207_LAST_ERROR=e.message;
   console.error('[RICO TEST229] SID memory + native Map Scroll failed:',e);
   if(typeof window.alert==='function')window.alert('RICO TEST229 SID: '+e.message);
   return false;
 }
};
window.RICO_TEST207_ORIGINAL_SID={
 sidMemoryPlanner229:{regions:sidSourceRegions229,choose:chooseCoreSlot229,relocate:relocateCoreForSID229},
 parseSID:parseSID,detectTimer:detectCIATimer209,buildSource:makeSource207,export:exportSelectedEngine228,legacyExport207:export207,exportSelectedEngine228:exportSelectedEngine228,
 select:function(bytes){var result=parseSID(bytes);SID_STATE.data=bytes;SID_STATE.enabled=true;return result;},
 disable:function(){SID_STATE.enabled=false;},
 getState:function(){return{enabled:SID_STATE.enabled,name:SID_STATE.name,speed:SID_STATE.speed,message:SID_STATE.lastMessage,tempo:SID_STATE.lastTempo209||''};},
 memory:MEM
};
window.RICO_SID_SHARED_ABI_V1={version:211,zeroPageStart:0xf0,zeroPageLength:16,timerRegisters:['$DC04','$DC05'],irqSources:['CIA1 Timer A','VIC-II raster'],initContract:'INIT(A=subtune) then capture SID ZP',playContract:'private SID ZP around PLAY',starting:'first VIC raster after INIT',debugCounters:['sid_audio_ticks_lo211','sid_audio_ticks_hi211','sid_video_ticks_lo211','sid_video_ticks_hi211']};
console.log('[RICO TEST229 READY] PSID up to 8KB with validated core relocation; native scroll and CIA kept.');
})();