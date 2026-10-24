/* RICO TEST262 — C64 MULTICOLOR exports must configure actual VIC-II.
 * Exporters TEST77, TEST168, TEST246/247, TEST207 SID and baseline may
 * write $D016 with bit 4 clear. This forces Hires even when the editor
 * shows Multicolor and Color RAM has valid 8..15 values.
 *
 * Apply a guarded source-level fix only during MULTICOLOR exports:
 *  - set bit4 on EVERY $D016 write, preserving scroll and 38-column bits.
 *  - initialize shared $D022/$D023 per frame at each $D021 update.
 *  - use frame tables when source declares current_frame;
 *    never silently use frame0's colors on multiframe projects.
 *  - block downloads if no ASM path or no registers were found.
 *
 * All non-Multicolor PRGs are byte-for-byte untouched.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!ToPRGAdv.prototype)return;
var oldExport=ToPRGAdv.prototype.createPRG;
if(oldExport.__rico262) return;
function hex(v){return '$'+('0'+((v|0)&255).toString(16)).slice(-2);}
function color(v,fallback){
  var n=Number(v);return Number.isFinite(n)&&n>=0&&n<=15?(n|0):fallback;
}
function buildContext(self){
  var e=self&&self.editor,l=null;
  try{l=e&&e.layers&&e.layers.getSelectedLayerObject();}catch(err){}
  if(!e||!l||!l.getScreenMode||l.getScreenMode()!=='c64multicolor')return null;
  var count=1;
  try{count=e.graphic.getFrameCount()||1;}catch(err){
    count=e.graphic&&e.graphic.frames&&e.graphic.frames.length||1;
  }
  var m1=[],m2=[];
  for(var i=0;i<count;i++){
    var a=11,b=12;
    try{a=color(l.getC64Multi1Color(i),11);}catch(err){}
    try{b=color(l.getC64Multi2Color(i),12);}catch(err){}
    m1.push(a);m2.push(b);
  }
  return {count:count,m1:m1,m2:m2,layer:l};
}
function patch(source,config){
  if(typeof source!=='string')throw new Error('TEST262: se recibió ASM no textual, no se exportará Hi-Res por error.');
  if(source.indexOf('RICO_TEST262_MULTICOLOR')>=0)return {source:source,d016:1,d021:1,already:true};
  // Original sources from TEST77 and GROUP engines use ACME syntax and one STA per line.
  var d016rx=/^([ \t]*)sta[ \t]+\$d016([ \t]*(?:;[^\n]*)?)$/gim;
  var d021rx=/^([ \t]*)sta[ \t]+\$d021([ \t]*(?:;[^\n]*)?)$/gim;
  var d016Count=(source.match(d016rx)||[]).length;
  var d021Count=(source.match(d021rx)||[]).length;
  if(!d016Count||!d021Count)
    throw new Error('TEST262: este motor PRG no expone los registros $D016/$D021 en el ASM; se detuvo la exportación Multicolor para evitar un falso Hi-Res. Motor pendiente de adaptación.');
  var dynamic=config.count>1 && (config.m1.some(v=>v!==config.m1[0])||config.m2.some(v=>v!==config.m2[0]));
  var hasFrame=/^current_frame\s*(?:;[^\n]*)?$/mi.test(source);
  if(dynamic&&!hasFrame)
    throw new Error('TEST262: este motor tiene varios frames con colores Multicolor diferentes pero no expone current_frame. No se exportará con colores incorrectos.');
  // Add ORA #$10 while the desired A value is in the accumulator.
  // $D016 low bits and bit3 still come from the original renderer.
  source=source.replace(d016rx,function(match,indent,comment){
    return indent+'ora #$10\n'+indent+'sta $d016'+(comment||'');
  });
  var patchMC=dynamic?
    // preserve A and X; indexed shared C64 colors use the current exported frame.
    ' pha\n txa\n pha\n ldx current_frame\n lda rico262_mc1_table,x\n sta $d022\n lda rico262_mc2_table,x\n sta $d023\n pla\n tax\n pla':
    ' pha\n lda #'+hex(config.m1[0])+'\n sta $d022\n lda #'+hex(config.m2[0])+'\n sta $d023\n pla';
  // Inject after $D021: background register source is untouched.
  source=source.replace(d021rx,function(match){return match+'\n'+patchMC;});
  if(dynamic){
    source+='\nrico262_mc1_table\n';
    source+='!byte '+config.m1.map(hex).join(',')+'\n';
    source+='rico262_mc2_table\n';
    source+='!byte '+config.m2.map(hex).join(',')+'\n';
  }
  return {source:'; RICO_TEST262_MULTICOLOR\n'+source,d016:d016Count,d021:d021Count,dynamic:dynamic};
}
ToPRGAdv.prototype.createPRG=function(args){
  var ctx=buildContext(this);
  if(!ctx)return oldExport.apply(this,arguments);
  var assembler=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
  if(!assembler||typeof assembler.assemble!=='function'){
    if(typeof window.alert==='function')window.alert('TEST262: ensamblador C64 no disponible.');
    return false;
  }
  args=args||{};
  var origAsm=assembler.assemble,origDownload=window.download;
  var captures=[],count=0,lastInfo=null,error=null,output=null;
  var self=this;
  try{
    window.download=function(data,filename,mime){captures.push({data:data,filename:filename,mime:mime});return data;};
    assembler.assemble=function(src,entry){
      var info=patch(src,ctx);
      lastInfo=info;count++;
      return origAsm.call(this,info.source,entry);
    };
    var silent=Object.assign({},args,{download:false});
    // Exports with SID may temporarily install their own assembler wrapper;
    // the wrapped original above stays reachable underneath it.
    output=oldExport.call(self,silent);
    if(!count)throw new Error('TEST262: el exportador no utilizó el ensamblador ASM interceptado. Se bloqueó el PRG Hi-Res.');
    // Older LVLLVL exporters only call window.download and return undefined.
    // The interception above keeps their complete PRG in memory, not in a file.
    if((!output||!output.length)&&captures.length)
      output=captures[captures.length-1].data;
    if(!output||output===false||!output.length)
      throw new Error('TEST262: el motor de exportación no devolvió un PRG válido.');
    var bytes=output instanceof Uint8Array?output:new Uint8Array(output);
    self.prg=bytes;
    window.RICO_TEST262_LAST_EXPORT={status:'MULTICOLOR ASM',frames:ctx.count,
      d016Patches:lastInfo.d016,d021Patches:lastInfo.d021,frameTables:!!lastInfo.dynamic,
      mc1:ctx.m1.slice(),mc2:ctx.m2.slice(),size:bytes.length};
    console.log('[RICO TEST262]',window.RICO_TEST262_LAST_EXPORT);
    if(args.download===false)return bytes;
    var originalName=captures.length&&captures[captures.length-1].filename;
    var fn=args.filename||originalName||'RICO_TEST262_MULTICOLOR.prg';
    if(!/\.prg$/i.test(fn))fn+='.prg';
    if(typeof origDownload==='function')origDownload.call(window,bytes,fn,'application/prg');
    else throw new Error('TEST262: download no disponible.');
    return bytes;
  }catch(ex){
    error=ex;
    window.RICO_TEST262_LAST_ERROR=String(ex&&ex.message||ex);
    console.error('[RICO TEST262 MULTICOLOR]',ex);
    if(typeof window.alert==='function')window.alert('RICO TEST262 MULTICOLOR: '+window.RICO_TEST262_LAST_ERROR);
    return false;
  }finally{
    assembler.assemble=origAsm;
    window.download=origDownload;
  }
};
ToPRGAdv.prototype.createPRG.__rico262=true;
window.RICO_TEST262_MULTICOLOR={patch:patch,context:buildContext};
console.log('[RICO TEST262] protected Multicolor PRG ASM export installed; Hi-Res exports unchanged');
})();