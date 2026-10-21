(function(){
'use strict';
/* TEST207 — SID adapter inspired by James' original LVLLVL:
   jaammees/lvllvl/src/js/textMode/c64export/export.asm
   Same PSID load/init/play contracts and IRQ play convention, NOT SCUMM.
   TEST208: 1 or more frames; 8 is a test target, NEVER a minimum.
   Tested/isolated resident PSIDs loaded in $1000-$1fff. */
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST206_COMPACT_FRAMES){
  console.error('[RICO TEST207] TEST206 compact engine missing');return;
}
var preceding=ToPRGAdv.prototype.createPRG,compact=window.RICO_TEST206_COMPACT_FRAMES;
var SID_STATE={data:null,enabled:false,name:'',speed:0,lastMessage:''};
var MEM={sidStart:0x1000,sidEnd:0x2000,patchStart:0xb000,patchEnd:0xb800};
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
  throw new Error('TEST207: este PSID carga en '+hx(load)+' y mide '+body.length+' bytes. Primera prueba: carga $1000-$1FFF (4096 B), sin reubicar SID no relocatable.');
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
function makeSource207(source,sid,speed){
 // Color RAM's sparse scratch from TEST203 must no longer occupy $1000-$17ff.
 // Its 4 index pages + 4 color pages are relocated to $b000-$b7ff.
 var edits=0;
 source=source.replace(/\$(1[0-7])00,([xy])/gi,function(_,hi,reg){edits++;return '$'+(0xb0+parseInt(hi,16)-0x10).toString(16)+'00,'+reg;});
 if(edits!==0&&edits!==16)throw new Error('TEST208: reubicacion de color incompleta ('+edits+' referencias).');
 if(/\$(?:1[0-7])00,[xy]/i.test(source))throw new Error('TEST207: quedaron referencias de colores en $1000-$17ff.');
 // Original LVLLVL initializes the SID with A=subtune before enabling IRQ.
 var init=' lda #'+h2(sid.subtune)+'\n jsr '+hx(sid.init)+'\n';
 source=replaceOnce(source,' lda #$01\n sta $d01a\n lda #$fa\n sta $d012',
 init+' lda #$01\n sta $d01a\n lda #$fa\n sta $d012');
 // Its play is called in raster IRQ after register saves/IRQ acknowledgment.
 var fractional209=speed!==1&&speed!==2&&speed!==60;
 // The three TEST208 modes are kept exactly as before for regression safety.
 var play=fractional209?'':' jsr '+hx(sid.play)+'\n';
 if(speed===2)play+=' jsr '+hx(sid.play)+'\n';
 if(speed===60){
   // Preserve TEST208's previous CIA fallback for tunes with unknown timers.
   play+=' lda sid_phase208\n clc\n adc #$0a\n cmp #$32\n bcc sid_due208\n';
   play+=' sec\n sbc #$32\n sta sid_phase208\n jsr '+hx(sid.play)+'\n jmp sid_end208\n';
   play+='sid_due208\n sta sid_phase208\nsid_end208\n';
 }
 var fraction209=0;
 if(fractional209){
   var rate256=Math.round(speed*256/50),whole209=Math.floor(rate256/256);
   fraction209=rate256&255;
   for(var calls209=0;calls209<whole209;calls209++)play+=' jsr '+hx(sid.play)+'\n';
   if(fraction209){
     // 8-bit phase accumulator: for 40Hz on PAL this gives 4 of every 5
     // 50Hz raster IRQs, rather than TEST208's accelerated 6/5 plays.
     play+=' lda sid_phase209\n clc\n adc #'+h2(fraction209)+'\n';
     play+=' sta sid_phase209\n bcc sid_skip209\n';
     play+=' jsr '+hx(sid.play)+'\nsid_skip209\n';
   }
 }
 source=replaceOnce(source,'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019',
  'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019\n'+play.trimEnd());
 // Source is placed exactly at the SID's own load address; never relocate
 // compiled music data, because absolute JSR/JMP and embedded pointers exist.
 if(speed===60)source=replaceOnce(source,'*=$3000\ncharset_bank1',
  'sid_phase208\n!byte $00\n*=$3000\ncharset_bank1');
 if(fractional209&&fraction209)
   source=replaceOnce(source,'*=$3000\ncharset_bank1',
    'sid_phase209\n!byte '+h2((256-fraction209)&255)+'\n*=$3000\ncharset_bank1');
 source=replaceOnce(source,'*=$2000\n',
  '*='+hx(sid.load)+'\nSID_ORIGINAL_LVLLVL_TEST207\n'+bytesToAsm(sid.bytes)+'\n*=$2000\n');
 return source;
}
function export207(self,args,raw){
 var graphic=self.editor&&self.editor.graphic,fr=graphic&&graphic.frames||[];
 if(!fr.length)throw new Error('TEST208: el proyecto no contiene frames.');
 var sid=parseSID(raw);
 var explicitSpeed=args&&(args.sidSpeed===1||args.sidSpeed===2)?args.sidSpeed:SID_STATE.speed;
 var speed=explicitSpeed===1||explicitSpeed===2?explicitSpeed:(sid.ciaTiming?(sid.ciaTimer?sid.ciaTimer.hz:60):1);
 SID_STATE.lastTempo209=sid.ciaTiming?(sid.ciaTimer?('CIA $'+('0000'+sid.ciaTimer.latch.toString(16)).slice(-4)+' = '+sid.ciaTimer.hz.toFixed(2)+' Hz'):'CIA sin timer detectable: TEST208 ~60 Hz'):'VBlank PAL 50 Hz';
 var source;
 if(fr.length===1){
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
 }else{
   var frames=compact.collect(self),alloc=compact.pack(frames);
   validatePatchBank(alloc);
   source=compact.build({frames:frames,packed:alloc});
 }
 var asm=makeSource207(source,sid,speed);
 var a=g_app&&g_app.assembler;
 if(!a)throw new Error('No se encontró el ensamblador LVLLVL.');
 var assembled=a.assemble(asm,0x0801);
 if(!assembled||!assembled.success){
  var err=(assembled&&assembled.errors||[]).map(function(e){return e.message||String(e);});
  throw new Error('TEST207 ASM: '+err.join(' | '));
 }
 var mem=a.getMemory(),output=new Uint8Array(2+assembled.end-assembled.start);
 output[0]=assembled.start&255;output[1]=(assembled.start>>8)&255;
 for(var k=assembled.start;k<assembled.end;k++)output[2+k-assembled.start]=mem[k]&255;
 self.prg=output;
 args=args||{};
 if(args.download===false)return output;
 var name=args.filename||'rico-sid-frames-test208.prg';
 if(!/\.prg$/i.test(name))name+='.prg';
 if(typeof window.download!=='function')throw new Error('window.download no disponible.');
 window.download(output,name,'application/prg');
 return output;
}
function ensureUI207(){
 if(typeof document==='undefined')return;
 var el=document.getElementById('exportPRGAdvTools');
 if(!el||document.getElementById('ricoSid207Input'))return;
 var box=document.createElement('div');
 box.id='ricoSid207Panel';
 box.style.cssText='margin:8px 16px;padding:8px;border:1px solid #666;font-size:12px;';
 box.innerHTML='<label style="display:block;margin-bottom:5px"><input type="checkbox" id="ricoSid207Enabled"> SID original LVLLVL — 1 o más frames (TEST208)</label>'
   +'<input id="ricoSid207Input" type="file" accept=".sid" style="width:260px">'
   +' <select id="ricoSid207Speed" title="Tasa de reproducción SID"><option value="0">Auto: leer tempo CIA del SID</option><option value="1">50 Hz</option><option value="2">100 Hz</option></select>'
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
  var requestedMusic=args&&args.music&&args.music!=='no';
  if(requiresNative||requestedMusic){
   window.RICO_TEST207_LAST_ERROR=requiresNative?'Elegiste SID pero no hay un archivo cargado.':'Para esta prueba de scroll + SID, elegi un archivo PSID original en TEST207. Todavia no integramos musica interna del editor.';
   if(typeof window.alert==='function')window.alert('RICO TEST207 SID: '+window.RICO_TEST207_LAST_ERROR);
   return false;
  }
  return preceding.apply(this,arguments);
 }
 try{return export207(this,args,chosen);}
 catch(e){
   window.RICO_TEST207_LAST_ERROR=e.message;
   console.error('[RICO TEST207] original LVLLVL SID+8frames failed:',e);
   if(typeof window.alert==='function')window.alert('RICO TEST207 SID: '+e.message);
   return false;
 }
};
window.RICO_TEST207_ORIGINAL_SID={
 parseSID:parseSID,detectTimer:detectCIATimer209,buildSource:makeSource207,export:export207,
 select:function(bytes){var result=parseSID(bytes);SID_STATE.data=bytes;SID_STATE.enabled=true;return result;},
 disable:function(){SID_STATE.enabled=false;},
 getState:function(){return{enabled:SID_STATE.enabled,name:SID_STATE.name,speed:SID_STATE.speed,message:SID_STATE.lastMessage,tempo:SID_STATE.lastTempo209||''};},
 memory:MEM
};
console.log('[RICO TEST209] SIDTracker64 CIA Timer A auto-detection (e.g. $6037 ~40Hz), TEST208 timing fallback preserved.');
})();