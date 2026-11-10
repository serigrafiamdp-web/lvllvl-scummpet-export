/* TEST351: selected PSID + EBCM static multiframe export.
 * Does not alter TEST207, TEST349 or TEST350; unhandled requests delegate
 * unchanged to the previous export chain, including every Map Scroll variant.
 * This renderer uses the TEST349-pass visual ASM and inserts a PSID player
 * exclusively at the 50Hz VBlank IRQ, never on 4-7 background raster IRQs.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST350_STATIC_ECM||
   !window.RICO_TEST207_ORIGINAL_SID)return;
var prior=ToPRGAdv.prototype.createPRG;
var engine=window.RICO_TEST350_STATIC_ECM;
var sidEngine=window.RICO_TEST207_ORIGINAL_SID;
var state={version:351,phase:'READY',lastError:null,lastExport:null};
function hex8(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function hex16(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function unique(s,needle,repl,label){
 var i=s.indexOf(needle);
 if(i<0||s.indexOf(needle,i+needle.length)>=0)
  throw Error('TEST351: ASM incompatible; ancla '+label+' no única.');
 return s.slice(0,i)+repl+s.slice(i+needle.length);
}
function bytesAsm(arr){
 var a=[];for(var i=0;i<arr.length;i+=16)
  a.push('!byte '+Array.prototype.slice.call(arr,i,i+16).map(hex8).join(','));
 return a.join('\n');
}
function route(self,args){
 var editor=self&&self.editor,graphic=editor&&editor.graphic,
     layer=editor&&editor.layers&&editor.layers.getSelectedLayerObject&&editor.layers.getSelectedLayerObject(),
     frames=graphic&&graphic.frames||[],
     mode=layer&&layer.getScreenMode&&layer.getScreenMode();
 if(mode!=='c64ecm'&&!(typeof TextModeEditor!=='undefined'&&mode===TextModeEditor.Mode.C64ECM))
  return 'other screen mode';
 if(frames.length<2||frames.length>10||!graphic||!graphic.getGridWidth||!graphic.getGridHeight||
    graphic.getGridWidth()!==40||graphic.getGridHeight()!==25)
  return 'different size or frame count';
 if(frames.some(function(f){
   var t=String(f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type||'').toLowerCase();
   return t&&t!=='none'&&t!=='off'&&t!=='disabled'&&t!=='false';
 }))return 'Map Scroll';
 if(frames.some(function(f){return f&&Number(f.charsetBank)===2;}))return 'BANK2';
 var ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!ts)return 'no tileset';
 var rec=ts.getDocRecord&&ts.getDocRecord(),data=rec&&rec.data||{},
     gr=data.ricoGroupAnimationsV1||{};
 if((gr.bank1||[]).some(function(x){return x&&x.type;})||
    (gr.bank2||[]).some(function(x){return x&&x.type;}))return 'Group Animate';
 if([ts.tileData,data.ricoCharsetBank2&&data.ricoCharsetBank2.tileData].some(function(tiles){
   return tiles&&tiles.some(function(t){var v=t&&t.props&&t.props.animated;return v&&v!=='none';});
 }))return 'individual character animation';
 return null;
}
function sidSelected(args){
 if(args&&(args.sidData||args.music==='sid'))return true;
 var state=sidEngine.getState&&sidEngine.getState();
 return !!(state&&state.enabled);
}
function readSID(args){
 if(args&&args.sidData)return Promise.resolve(args.sidData);
 if(typeof document==='undefined')return Promise.reject(Error('No hay archivo PSID seleccionado.'));
 var elem=document.getElementById('ricoSid207Input'),file=elem&&elem.files&&elem.files[0];
 if(!file)return Promise.reject(Error('SID seleccionado pero no hay archivo .sid en el control de TEST207.'));
 if(typeof file.arrayBuffer==='function')return file.arrayBuffer().then(function(b){return new Uint8Array(b);});
 return new Promise(function(resolve,reject){
  var r=new FileReader();
  r.onerror=function(){reject(Error('No se pudo leer el archivo SID.'));};
  r.onload=function(){resolve(new Uint8Array(r.result));};
  r.readAsArrayBuffer(file);
 });
}
function speedInfo(sid,args){
 var ctl=typeof document!=='undefined'&&document.getElementById('ricoSid207Speed'),
     state=sidEngine.getState&&sidEngine.getState(),
     selected=ctl?Number(ctl.value):state&&Number(state.speed)||0;
 if(args&&Object.prototype.hasOwnProperty.call(args,'sidPlaybackMode212'))
  selected=Number(args.sidPlaybackMode212);
 var rate=selected===1?50:selected===2?100:sid.ciaTiming?(sid.ciaTimer?sid.ciaTimer.hz:60):50;
 if(!Number.isFinite(rate)||rate<10||rate>200)
  throw Error('TEST351: tempo SID ilegible; se preservó el PSID y se canceló.');
 var q=Math.round(rate*256/50),whole=Math.floor(q/256),fraction=q%256;
 return {requested:selected===1?'MANUAL 50':selected===2?'MANUAL 100':'AUTO',
  hz:rate,whole:whole,fraction:fraction,hardwareCIA:false,
  note:sid.ciaTiming?'CIA del PSID aproximado con scheduler de raster PAL':'PSID VBlank PAL'};
}
function helpers(sid,timing){
 var v=[
 'sid351_init',
 ' jsr sid351_enter',
 ' lda #'+hex8(sid.subtune),
 ' jsr '+hex16(sid.init),
 ' jsr sid351_leave',
 ' rts',
 'sid351_play',
 ' jsr sid351_enter',
 ' jsr '+hex16(sid.play),
 ' jsr sid351_leave',
 ' rts',
 'sid351_enter',
 // Preserve EBCM frame engine's ZP and SID music's private ZP independently.
 ' ldx #$00',
 'sid351_swap_head',
 ' lda $02,x',' sta sid351_engine_head,x',
 ' lda sid351_music_head,x',' sta $02,x',
 ' inx',' cpx #$05',' bne sid351_swap_head',
 ' ldx #$00',
 'sid351_swap_tail',
 ' lda $f0,x',' sta sid351_engine_tail,x',
 ' lda sid351_music_tail,x',' sta $f0,x',
 ' inx',' cpx #$10',' bne sid351_swap_tail',
 ' rts',
 'sid351_leave',
 ' ldx #$00',
 'sid351_restore_head',
 ' lda $02,x',' sta sid351_music_head,x',
 ' lda sid351_engine_head,x',' sta $02,x',
 ' inx',' cpx #$05',' bne sid351_restore_head',
 ' ldx #$00',
 'sid351_restore_tail',
 ' lda $f0,x',' sta sid351_music_tail,x',
 ' lda sid351_engine_tail,x',' sta $f0,x',
 ' inx',' cpx #$10',' bne sid351_restore_tail',
 ' rts',
 'sid351_tick'
 ];
 for(var i=0;i<timing.whole;i++)v.push(' jsr sid351_play');
 if(timing.fraction){
  v.push(' lda sid351_phase',
    ' clc',' adc #'+hex8(timing.fraction),
    ' sta sid351_phase',' bcc sid351_no_extra',
    ' jsr sid351_play','sid351_no_extra');
 }
 v.push(' rts',
 'sid351_phase','!byte $00',
 'sid351_engine_head','!byte $00,$00,$00,$00,$00',
 'sid351_music_head','!byte $00,$00,$00,$00,$00',
 'sid351_engine_tail','!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00',
 'sid351_music_tail','!byte $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00'
 );
 return v.join('\n')+'\n';
}
function build(plan,sid,timing){
 var src=engine.build(plan);
 var codeAnchor='*=$2000\n',fontAnchor='*=$3800\n',
     coreStart=src.indexOf(codeAnchor),coreEnd=src.indexOf(fontAnchor,coreStart+codeAnchor.length);
 if(coreStart<0||coreEnd<0||src.indexOf(codeAnchor,coreStart+codeAnchor.length)>=0||
    src.indexOf(fontAnchor,coreEnd+fontAnchor.length)>=0)
  throw Error('TEST351: bloques de memoria del motor EBCM cambiaron.');
 var before=src.slice(0,coreStart),
     core=src.slice(coreStart+codeAnchor.length,coreEnd),
     after=src.slice(coreEnd);
 before=unique(before,
  '!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
  '!byte $0b,$08,$0a,$00,$9e,$32,$30,$36,$31,$00,$00,$00',
  'BASIC SYS 2061');
 core=unique(core,' sta duration_hi\n ldx #$00\n',
  ' sta duration_hi\n jsr sid351_init\n ldx #$00\n','SID INIT');
 core=unique(core,' sta $d024\n lda duration_lo',
  ' sta $d024\n jsr sid351_tick\n lda duration_lo','SID PLAY once per PAL frame');
 core+='\n'+helpers(sid,timing);
 // Stub stays in RAM visible to BASIC ROM on startup, then banks out BASIC
 // before jumping to the relocated kernel at $8000.
 var entry='*=$080d\nsid351_entry\n sei\n lda #$35\n sta $01\n jmp start\n';
 return before+entry+
    '*='+hex16(sid.load)+'\nSID351_PSID_DATA\n'+bytesAsm(sid.bytes)+'\n'+
    after+'*=$8000\n'+core;
}
function assemble(source,plan,sid){
 var asm=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
 if(!asm)throw Error('TEST351: ensamblador C64 no disponible.');
 var compiled=asm.assemble(source,0x0801);
 if(!compiled||!compiled.success)
  throw Error('TEST351 ASM: '+((compiled&&compiled.errors||[]).map(function(x){return x.message||String(x);}).join(' | ')||'error desconocido'));
 var mem=asm.getMemory();
 for(var g=0;g<512;g++)if((mem[0x3800+g]&255)!==plan.glyphs[g])
  throw Error('TEST351: charset sobrescrito en $'+(0x3800+g).toString(16));
 for(var c=0;c<1000;c++)if((mem[0x6000+c]&255)!==plan.frames[0].screen[c]||
    (mem[0x6400+c]&255)!==plan.frames[0].colors[c])
  throw Error('TEST351: datos de pantalla sobrescritos en '+c);
 for(var k=0;k<sid.bytes.length;k++)if((mem[sid.load+k]&255)!==sid.bytes[k])
  throw Error('TEST351: SID sobrescrito en '+hex16(sid.load+k));
 if(compiled.start!==0x0801||compiled.end<0x8000||compiled.end>0x9000)
  throw Error('TEST351: rango de RAM inesperado, no se creó el PRG.');
 var out=new Uint8Array(2+compiled.end-compiled.start);
 out[0]=compiled.start&255;out[1]=(compiled.start>>8)&255;
 for(var i=compiled.start;i<compiled.end;i++)out[2+i-compiled.start]=mem[i]&255;
 return out;
}
function export351(self,args,raw){
 var sid=sidEngine.parseSID(raw),timing=speedInfo(sid,args);
 var plan=engine.collect(self,Object.assign({},args||{},{sidData:null,music:null}));
 var source=build(plan,sid,timing),out=assemble(source,plan,sid);
 self.prg=out;
 state.lastExport={frames:plan.frames.length,characters:64,mode:'ECM STATIC + PSID',
  sidLoad:hex16(sid.load),sidInit:hex16(sid.init),sidPlay:hex16(sid.play),
  sidBytes:sid.bytes.length,rateHz:timing.hz,tempoMode:timing.requested,
  clock:timing.note,bytes:out.length};
 state.lastError=null;state.phase='ASSEMBLED';
 window.RICO_TEST351_LAST_EXPORT=state.lastExport;
 var status=typeof document!=='undefined'&&document.getElementById('ricoSid207Status');
 if(status)status.textContent='TEST351 EBCM + '+plan.frames.length+' frames + PSID · '+timing.note+' '+timing.hz.toFixed(1)+' Hz';
 if(args&&args.download===false)return out;
 var name=(args&&args.filename||'REMISERIA').replace(/\.prg$/i,'')+'_TEST351_SID.prg';
 if(typeof window.download!=='function')throw Error('TEST351: no hay función de descarga.');
 window.download(out,name,'application/prg');
 return out;
}
ToPRGAdv.prototype.createPRG=function(args){
 if(!sidSelected(args))return prior.apply(this,arguments);
 var reason=route(this,args||{});
 if(reason){
  state.phase='DELEGATED '+reason;
  return prior.apply(this,arguments);
 }
 // Do not consume this route if the 2–10 static frames cannot be represented;
 // pass the original SID and visual features to their established exporter.
 try{engine.collect(this,Object.assign({},args||{},{sidData:null,music:null}));}
 catch(error){
  state.phase='DELEGATED: EBCM static unavailable ('+String(error.message||error)+')';
  return prior.apply(this,arguments);
 }
 var self=this,originalArgs=args;
 if(args&&args.sidData){
  try{return export351(self,args,args.sidData);}
  catch(e){
   state.lastError=String(e&&e.message||e);state.phase='ERROR';
   console.error('[TEST351 PSID EBCM]',e);
   if(typeof window.alert==='function')window.alert('TEST351: '+state.lastError);
   return false;
  }
 }
 // Existing file selection is already present in TEST207's input; a fresh
 // FileReader is needed because TEST207 deliberately keeps raw bytes private.
 state.phase='READING SID';
 readSID(args||{}).then(function(raw){
  try{export351(self,originalArgs,raw);}
  catch(e){state.lastError=String(e&&e.message||e);state.phase='ERROR';
   console.error('[TEST351 PSID EBCM]',e);
   if(typeof window.alert==='function')window.alert('TEST351: '+state.lastError);
  }
 }).catch(function(e){
  state.lastError=String(e&&e.message||e);state.phase='ERROR';
  if(typeof window.alert==='function')window.alert('TEST351: '+state.lastError);
 });
 return true;
};
window.RICO_TEST351_ECM_SID={version:351,route:route,build:build,
 speedInfo:speedInfo,export:export351,last:state};
console.log('[TEST351] EBCM static frames + protected PSID; all scroll and unrelated engines delegated unchanged.');
})();