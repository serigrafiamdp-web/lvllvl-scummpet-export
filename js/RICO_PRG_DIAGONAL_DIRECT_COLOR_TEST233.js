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
function gcd(a,b){while(b){var v=a%b;a=b;b=v;}return a;}
function plan(d){
 if(!d||!d.fastRows||d.uniformColor||d.group||!d.dir||!d.colors||!d.rowStride)return null;
 var W=d.areaWidth,H=d.areaHeight,stride=d.rowStride;
 if(W<40||W>255||H<25||H>255||stride<2*W||d.colors.length<stride*H)return null;
 var len=W/gcd(W,H)*H;
 if(len<1||len>255)return null;
 var dx=d.dir.x===-1?1:-1,dy=d.dir.y===-1?1:-1,
     start=0xa100,cursor=start+2*len,ptr=[],blocks=[],writes=[],cycles=[],
     seen=Object.create(null),deduplicated=0;
 for(var phase=0;phase<len;phase++){
  var xx=(d.cameraX+phase*dx)%W,yy=(d.cameraY+phase*dy)%H;
  var nx=(xx+dx+W)%W,ny=(yy+dy+H)%H;
  if(xx<0)xx+=W;if(yy<0)yy+=H;
  var grouped=Array.from({length:16},function(){return[];}),count=0;
  for(var row=0;row<25;row++){
   var old=(yy+row)%H*stride+xx,
       now=(ny+row)%H*stride+nx;
   for(var col=0;col<40;col++){
    var oldColor=d.colors[old+col]&15,newColor=d.colors[now+col]&15;
    if(oldColor===newColor)continue;
    grouped[newColor].push(0xd800+row*40+col);count++;
   }
  }
  var ins=[],loads=0;
  for(var color=0;color<16;color++)if(grouped[color].length){
   loads++;ins.push(' lda #'+b(color));
   for(var k=0;k<grouped[color].length;k++)ins.push(' sta '+w(grouped[color][k]));
  }
  ins.push(' rts');
  var signature=ins.join(NL),bytes=2*loads+3*count+1,at=seen[signature];
  if(at===undefined){
   if(cursor+bytes>0xd000)return null;
   at=cursor;seen[signature]=at;cursor+=bytes;
   blocks.push({phase:phase,at:at,ins:ins}); 
  }else deduplicated++;
  ptr.push(at);writes.push(count);cycles.push(2*loads+4*count+6);
 }
 return{len:len,base:start,end:cursor,pointers:ptr,blocks:blocks,
        writes:writes,cycles:cycles,deduplicated:deduplicated};
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
 for(var i=0;i<p.blocks.length;i++){
  out.push('diag_direct_frame_'+p.blocks[i].phase);
  Array.prototype.push.apply(out,p.blocks[i].ins);
 }
 return out.join(NL)+NL;
}
D.build=function(d){
 var source=former(d),p=plan(d);
 window.RICO_TEST233_LAST_BUILD={
  selected:!!p,mode:'legacy',direction:d.direction,pixels:d.pixels,
  maxWrites:p?Math.max.apply(null,p.writes):null,
  maxCycles:p?Math.max.apply(null,p.cycles):null,
  compiledBytes:p?p.end-p.base:null,
  cycleCount:p?p.len:null,deduplicated:p?p.deduplicated:null
 };
 if(!p)return source;
 var rle=source.includes(' jsr diag_rle_apply221'+NL+' jsr swap_screens');
 var originalCall=rle?' jsr diag_rle_apply221'+NL+' jsr swap_screens':
                         ' jsr commit_sparse_colors203'+NL+' jsr swap_screens';
 if(source.split(originalCall).length!==2)
  throw Error('TEST233: diagonal color commit changed');
 source=source.replace(originalCall,' jsr diag_direct_apply233'+NL+' jsr swap_screens');
 if(rle){
  // Remove obsolete runtime and data emitted by the TEST221B wrapper.
  var first=source.indexOf(NL+'diag_rle_apply221'+NL);
  var last=source.indexOf(NL+'*=$3000'+NL+'charset_bank1',first);
  if(first<0||last<=first)throw Error('TEST233: RLE runtime layout changed');
  source=source.slice(0,first+1)+runtime(p)+source.slice(last+1);
  var marker=NL+'*=$a100'+NL+'diag_rle_lo221';
  var dataPos=source.lastIndexOf(marker);
  if(dataPos<0)throw Error('TEST233: RLE data layout changed');
  source=source.slice(0,dataPos);
 }else{
  // Dynamic fallback normally makes a 1000-cell color shadow and scans
  // another 1000 cells each scroll commit; with direct code neither is needed.
  var stage=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203';
  if(source.split(stage).length!==2)
   throw Error('TEST233: diagonal shadow preparation changed');
  source=source.replace(stage,'');
  var charset=NL+'*=$3000'+NL+'charset_bank1';
  if(source.split(charset).length!==2)
   throw Error('TEST233: diagonal charset layout changed');
  source=source.replace(charset,NL+runtime(p)+charset);
 }
 source+=NL+data(p);
 window.RICO_TEST233_LAST_BUILD.mode='direct-STA';
 console.log('[RICO TEST233 DIAGONAL COLOR]',window.RICO_TEST233_LAST_BUILD);
 return source;
};
D.TEST233={version:233,plan:plan,previous:former};
})();