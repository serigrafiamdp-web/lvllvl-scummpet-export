(function(){
'use strict';
// TEST233: faster Color RAM updates in the four diagonal directions.
// Recompile TEST221's exact camera-to-camera RLE deltas to absolute
// STA $D800-$DBE7 instructions, with the proven TEST227 patched JMP.
// Keep character scrolling, frame scheduler, 25-row view, SID and groups.
// Source engine remains byte-identical whenever a safe direct path
// cannot fit in $A100-$BFFF or cannot be calculated.
var D=window.RICO_TEST196_DIAGONAL;
if(!D||!D.TEST221||!D.TEST221.rlePlanner)return;
var former=D.build,NL=String.fromCharCode(10);
function w(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function b(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function emit(out,a){
 for(var k=0;k<a.length;k+=16)
  out.push('!byte '+a.slice(k,k+16).map(b).join(','));
}
function plan(d,p){
 if(!p||!d.fastRows||d.uniformColor||d.group||p.len<1||p.len>255)return null;
 // $A000 houses stub/group code. $C000 is needed for TEST229 SID-core
 // relocation; avoid eating that bank. Preserve whole $D000 I/O page.
 var base=0xa100,cursor=base+2*p.len,frames=[],pointers=[],writes=[],cycles=[];
 if(cursor>0xc000)return null;
 for(var t=0;t<p.len;t++){
  var stream=p.streams[t],groups=Array.from({length:16},function(){return[];});
  var i=0,count=0;
  while(i<stream.length&&stream[i]!==0){
   if(i+3>=stream.length)return null;
   var n=stream[i++],addr=stream[i++]|(stream[i++]<<8),color=stream[i++]&15;
   if(!n||addr<0xd800||addr>0xdbe7)return null;
   for(var row=0;row<n;row++){
    var dest=addr+40*row;
    if(dest<0xd800||dest>0xdbe7)return null;
    groups[color].push(dest);count++;
   }
  }
  if(stream[i]!==0||i!==stream.length-1)return null;
  var instructions=[],loads=0;
  for(var color=0;color<16;color++){
   if(!groups[color].length)continue;
   instructions.push(' lda #'+b(color));loads++;
   for(var j=0;j<groups[color].length;j++)
    instructions.push(' sta '+w(groups[color][j]));
  }
  instructions.push(' rts');
  var bytes=2*loads+3*count+1;
  if(cursor+bytes>0xc000)return null;
  pointers.push(cursor);cursor+=bytes;
  frames.push(instructions);writes.push(count);
  cycles.push(2*loads+4*count+6); // 6502 cycles excluding dispatcher
 }
 return{len:p.len,base:base,end:cursor,pointers:pointers,frames:frames,writes:writes,cycles:cycles};
}
function runtime(p){
 return[
  'diag_direct_apply233',
  ' ldx diag_direct_phase233',
  ' lda diag_direct_lo233,x',' sta diag_direct_jmp233+1',
  ' lda diag_direct_hi233,x',' sta diag_direct_jmp233+2',
  ' inc diag_direct_phase233',
  ' lda diag_direct_phase233',' cmp #'+b(p.len),
  ' bne diag_direct_go233',
  ' lda #$00',' sta diag_direct_phase233',
  'diag_direct_go233',
  'diag_direct_jmp233',' jmp diag_direct_frame_0',
  'diag_direct_phase233','!byte $00'
 ].join(NL)+NL;
}
function data(p){
 var out=['*='+w(p.base),'diag_direct_lo233'];
 emit(out,p.pointers.map(function(addr){return addr&255;}));
 out.push('diag_direct_hi233');
 emit(out,p.pointers.map(function(addr){return addr>>8;}));
 for(var i=0;i<p.len;i++){
  out.push('diag_direct_frame_'+i);
  Array.prototype.push.apply(out,p.frames[i]);
 }
 return out.join(NL)+NL;
}
D.build=function(d){
 var source=former(d),rle=D.TEST221.rlePlanner(d),p=plan(d,rle);
 window.RICO_TEST233_LAST_BUILD={
  selected:!!p,mode:'legacy',direction:d.direction,pixels:d.pixels,
  maxWrites:p?Math.max.apply(null,p.writes):null,
  maxCycles:p?Math.max.apply(null,p.cycles):null,
  compiledBytes:p?p.end-p.base:null,
  cycleCount:p?p.len:null
 };
 if(!p)return source;
 var call=' jsr diag_rle_apply221'+NL+' jsr swap_screens';
 if(source.split(call).length!==2)
  throw Error('TEST233: diagonal TEST221 IRQ commit moved');
 source=source.replace(call,' jsr diag_direct_apply233'+NL+' jsr swap_screens');
 // Remove the old RLE runtime; it cannot coexist with the new dispatch.
 var start=source.indexOf(NL+'diag_rle_apply221'+NL);
 var end=source.indexOf(NL+'*=$3000'+NL+'charset_bank1',start);
 if(start<0||end<0||start>=end)
  throw Error('TEST233: old TEST221 RLE runtime not found');
 source=source.slice(0,start+1)+runtime(p)+source.slice(end+1);
 // Remove all the old RLE data before adding the absolute routines.
 var marker=NL+'*=$a100'+NL+'diag_rle_lo221';
 var pos=source.lastIndexOf(marker);
 if(pos<0||source.slice(pos).includes(NL+'*=$')&&source.slice(pos+1).includes(NL+'*=$')&&source.slice(pos+1).indexOf(NL+'*=$')!==source.slice(pos+1).lastIndexOf(NL+'*=$'))
  throw Error('TEST233: old RLE data layout changed');
 source=source.slice(0,pos);
 source+=NL+data(p);
 window.RICO_TEST233_LAST_BUILD.mode='direct-STA';
 console.log('[RICO TEST233 DIAGONAL COLOR]',window.RICO_TEST233_LAST_BUILD);
 return source;
};
D.TEST233={version:233,plan:plan,previous:former};
})();