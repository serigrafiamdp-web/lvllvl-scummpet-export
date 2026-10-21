(function(){
'use strict';
/* TEST207 — SID adapter inspired by James' original LVLLVL:
   jaammees/lvllvl/src/js/textMode/c64export/export.asm
   Same PSID load/init/play contracts and IRQ play convention, NOT SCUMM.
   Only 8 horizontal Map Scroll frames, only tested/isolated resident PSIDs
   loaded in $1000-$1fff. No existing exporter is changed. */
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST206_COMPACT_FRAMES){
  console.error('[RICO TEST207] TEST206 compact engine missing');return;
}
var preceding=ToPRGAdv.prototype.createPRG,compact=window.RICO_TEST206_COMPACT_FRAMES;
var SID_STATE={data:null,enabled:false,name:'',speed:1,lastMessage:''};
var MEM={sidStart:0x1000,sidEnd:0x2000,patchStart:0xb000,patchEnd:0xb800};
function h2(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function hx(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function be16(b,p){return(b[p]<<8)|b[p+1];}
function be32(b,p){return ((b[p]*0x1000000)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3])>>>0;}
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
 if(subtuneBit)throw new Error('SID utiliza temporizador CIA; TEST207 reproduce una llamada VBlank por cuadro, no temporizacion CIA.');
 if(load<MEM.sidStart||load+body.length>MEM.sidEnd)
  throw new Error('TEST207: este PSID carga en '+hx(load)+' y mide '+body.length+' bytes. Primera prueba: carga $1000-$1FFF (4096 B), sin reubicar SID no relocatable.');
 if(init<load||init>=load+body.length||play<load||play>=load+body.length)throw new Error('SID: las direcciones INIT/PLAY deben estar dentro de los bytes cargados, para esta primera prueba.');
 return {version,load,init,play,bytes:body,subtune:startSong-1,songs,speedBits,clockFlag};
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
 source=source.replace(/\$(1[0-7])00,x/gi,function(_,hi){edits++;return '$'+(0xb0+parseInt(hi,16)-0x10).toString(16)+'00,x';});
 if(edits<16)throw new Error('TEST207: tablas de color TEST203 no fueron encontradas para reubicacion ('+edits+').');
 if(/\$(?:1[0-7])00,x/i.test(source))throw new Error('TEST207: quedaron referencias de colores en $1000-$17ff.');
 // Original LVLLVL initializes the SID with A=subtune before enabling IRQ.
 var init=' lda #'+h2(sid.subtune)+'\n jsr '+hx(sid.init)+'\n';
 source=replaceOnce(source,' lda #$01\n sta $d01a\n lda #$fa\n sta $d012',
 init+' lda #$01\n sta $d01a\n lda #$fa\n sta $d012');
 // Its play is called in raster IRQ after register saves/IRQ acknowledgment.
 var play=' jsr '+hx(sid.play)+'\n'+(speed===2?' jsr '+hx(sid.play)+'\n':'');
 source=replaceOnce(source,'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019',
  'irq\n pha\n txa\n pha\n tya\n pha\n lda #$01\n sta $d019\n'+play.trimEnd());
 // Source is placed exactly at the SID's own load address; never relocate
 // compiled music data, because absolute JSR/JMP and embedded pointers exist.
 source=replaceOnce(source,'*=$2000\n',
  '*='+hx(sid.load)+'\nSID_ORIGINAL_LVLLVL_TEST207\n'+bytesToAsm(sid.bytes)+'\n*=$2000\n');
 return source;
}
function export207(self,args,raw){
 var graphic=self.editor&&self.editor.graphic,fr=graphic&&graphic.frames||[];
 if(fr.length!==8)throw new Error('TEST207 SID: prueba limitada a 8 frames. El exportador sin musica sigue aceptando mas frames.');
 var sid=parseSID(raw);
 var speed=(args&&args.sidSpeed===2)?2:SID_STATE.speed;
 if(speed!==1&&speed!==2)speed=1;
 var frames=compact.collect(self);
 var alloc=compact.pack(frames);
 validatePatchBank(alloc);
 var asm=makeSource207(compact.build({frames:frames,packed:alloc}),sid,speed);
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
 var name=args.filename||'rico-8frames-lvllvl-sid-test207.prg';
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
 box.innerHTML='<label style="display:block;margin-bottom:5px"><input type="checkbox" id="ricoSid207Enabled"> TEST207 — 8 frames + SID original LVLLVL (PSID $1000–$1FFF)</label>'
   +'<input id="ricoSid207Input" type="file" accept=".sid" style="width:260px">'
   +' <select id="ricoSid207Speed" title="SID play calls per 50Hz PAL frame"><option value="1">50 Hz · 1 play/tick</option><option value="2">100 Hz · 2 plays/tick</option></select>'
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
      message('SID: '+file.name+' · LOAD '+hx(info.load)+' · INIT '+hx(info.init)+' · PLAY '+hx(info.play)+' · '+info.bytes.length+' bytes.');
    }catch(e){message('SID incompatible: '+e.message);}
   };
   fr.readAsArrayBuffer(file);
 });
 flag.addEventListener('change',function(){SID_STATE.enabled=flag.checked;});
 speed.addEventListener('change',function(){SID_STATE.speed=Number(speed.value)===2?2:1;});
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
 var chosen=args&&args.music==='sid'&&args.sidData?args.sidData:SID_STATE.enabled&&SID_STATE.data?SID_STATE.data:null;
 if(!chosen)return preceding.apply(this,arguments);
 try{return export207(this,args,chosen);}
 catch(e){
   window.RICO_TEST207_LAST_ERROR=e.message;
   console.error('[RICO TEST207] original LVLLVL SID+8frames failed:',e);
   if(typeof window.alert==='function')window.alert('RICO TEST207 SID: '+e.message);
   return false;
 }
};
window.RICO_TEST207_ORIGINAL_SID={
 parseSID:parseSID,buildSource:makeSource207,export:export207,
 select:function(bytes){var result=parseSID(bytes);SID_STATE.data=bytes;SID_STATE.enabled=true;return result;},
 disable:function(){SID_STATE.enabled=false;},
 getState:function(){return{enabled:SID_STATE.enabled,name:SID_STATE.name,speed:SID_STATE.speed,message:SID_STATE.lastMessage};},
 memory:MEM
};
console.log('[RICO TEST207] Original LVLLVL SID init/play adapter, 8 frames with compact storage. Optional SID only, no changes to existing export routes.');
})();