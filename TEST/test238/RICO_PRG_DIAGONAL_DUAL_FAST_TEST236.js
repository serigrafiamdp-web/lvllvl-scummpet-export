(function(){
'use strict';
// TEST236 — combined quick diagonal: TEST220-style one-pass character
// shift + TEST227-style export-time color planning, one VIC-II swap.
// Does NOT run two independent scrolling loops. Preserves TEST232 base,
// original browser, 25 rows and native SID wrapper.
// Legacy TEST221B RLE is accelerated with a 1-cell and <=6-cell writer.
// When the original RLE tables did not fit, deduplicated phase streams
// can enable the same low-IRQ-cost path for more maps.
// No full Color RAM copy and no per-frame 1000-cell sparse scan in
// the selected RLE path.
var E=window.RICO_TEST196_DIAGONAL;if(!E)return;
var previous=E.build,NL='\n';
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
function bytes(a,values){
 for(var i=0;i<values.length;i+=16)
  a.push('!byte '+values.slice(i,i+16).map(h).join(','));
}
// Addresses and data must respect SID/core and RLE reserve boundaries:
// $A100-$AFFF + $B800-$CFFF; never touch $B000-$B7FF or IO.
function plan(d){
 if(!d||!d.fastRows||d.uniformColor||d.group)return null;
 var W=d.areaWidth,H=d.areaHeight,len=W/gcd(W,H)*H;
 if(len<1||len>255)return null;
 var sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1,phases=[],unique=[],known={};
 for(var t=0;t<len;t++){
  var ox=((d.cameraX+t*sx)%W+W)%W,oy=((d.cameraY+t*sy)%H+H)%H,
      nx=(ox+sx+W)%W,ny=(oy+sy+H)%H,run=[];
  for(var x=0;x<40;x++)for(var r=0;r<25;){
   var old=d.colors[((oy+r)%H)*d.rowStride+((ox+x)%W)]&15,
       v=d.colors[((ny+r)%H)*d.rowStride+((nx+x)%W)]&15;
   if(old===v){r++;continue;}
   var first=r++,count=1;
   while(r<25){
    var o=d.colors[((oy+r)%H)*d.rowStride+((ox+x)%W)]&15,
        n=d.colors[((ny+r)%H)*d.rowStride+((nx+x)%W)]&15;
    if(o===n||n!==v)break;
    r++;count++;
   }
   var dest=0xd800+first*40+x;
   run.push(count,dest&255,dest>>8,v);
  }
  run.push(0);
  var key=run.join(',');
  if(known[key]===undefined){known[key]=unique.length;unique.push(run);}
  phases.push(known[key]);
 }
 var addresses=new Array(unique.length),ptr=new Array(len),low=0xa100+len*2,high=0xb800,hi=false;
 for(var i=0;i<unique.length;i++){
  var nbytes=unique[i].length;
  if(!hi&&low+nbytes<=0xb000){addresses[i]=low;low+=nbytes;}
  else if(high+nbytes<=0xd000){hi=true;addresses[i]=high;high+=nbytes;}
  else return null;
 }
 for(var k=0;k<len;k++)ptr[k]=addresses[phases[k]];
 return{len:len,phases:phases,ptr:ptr,unique:unique,addresses:addresses,
    compressedBytes:len*2+unique.reduce(function(n,s){return n+s.length;},0),
    totalUnique:unique.length,originalPhases:len};
}
function tables(p){
 var a=['*=$a100','diag_rle_lo221'];bytes(a,p.ptr.map(function(v){return v&255;}));
 a.push('diag_rle_hi221');bytes(a,p.ptr.map(function(v){return v>>8;}));
 for(var j=0;j<p.unique.length;j++){
  a.push('*='+w(p.addresses[j]),'diag_fast_stream236_'+j);
  bytes(a,p.unique[j]);
 }
 return a.join(NL)+NL;
}
// Uses existing RLE encoding and phase counter; only the run executor changes.
// Single-cell run: direct store and skip pointer arithmetic.
// Short vertical run: Y indexes +40 without modifying the 16-bit pointer.
// Long run: original 16-bit address advance, fully compatible.
function executor(len){
 return [
 'diag_rle_apply221',
 ' ldx diag_rle_phase221',
 ' lda diag_rle_lo221,x',' sta src_lo',
 ' lda diag_rle_hi221,x',' sta src_hi',
 ' inc diag_rle_phase221',
 ' lda diag_rle_phase221',' cmp #'+h(len),
 ' bne diag_rle_loop236',
 ' lda #$00',' sta diag_rle_phase221',
 'diag_rle_loop236',
 ' ldy #$00',' lda (src_lo),y',
 ' bne diag_rle_open236',' rts',
 'diag_rle_open236',
 ' sta rows_left',
 ' iny',' lda (src_lo),y',' sta dst_lo',
 ' iny',' lda (src_lo),y',' sta dst_hi',
 ' iny',' lda (src_lo),y',' sta tmp_col',
 ' clc',' lda src_lo',' adc #$04',' sta src_lo',
 ' bcc diag_rle_pointer_ok236',' inc src_hi',
 'diag_rle_pointer_ok236',
 ' lda rows_left',
 ' cmp #$02',' bcc diag_rle_one236',
 ' cmp #$07',' bcc diag_rle_short_setup236',
 ' ldy #$00',
 'diag_rle_long_loop236',
 ' lda tmp_col',' sta (dst_lo),y',
 ' clc',' lda dst_lo',' adc #$28',' sta dst_lo',
 ' lda dst_hi',' adc #$00',' sta dst_hi',
 ' dec rows_left',' bne diag_rle_long_loop236',
 ' jmp diag_rle_loop236',
 'diag_rle_one236',
 ' ldy #$00',' lda tmp_col',' sta (dst_lo),y',
 ' jmp diag_rle_loop236',
 'diag_rle_short_setup236',
 ' ldy #$00',' lda tmp_col',
 'diag_rle_short_loop236',
 ' sta (dst_lo),y',' tya',' clc',' adc #$28',' tay',' lda tmp_col',
 ' dec rows_left',' bne diag_rle_short_loop236',
 ' jmp diag_rle_loop236',
 'diag_rle_phase221','!byte $00'
 ].join(NL)+NL;
}
E.build=function(d){
 var s=previous(d),info={selected:false,direction:d&&d.direction,pixels:d&&d.pixels,
    mode:'original fallback',reason:'fast RLE not selected'};
 if(!d||!d.fastRows||d.uniformColor||d.group){
  info.reason='uniform / group / large source';window.RICO_TEST236_LAST_BUILD=info;return s;
 }
 var start=NL+'diag_rle_apply221'+NL,stop='diag_rle_phase221'+NL+'!byte $00',
     isRLE=s.includes(start);
 if(isRLE){
  var length=d.areaWidth/gcd(d.areaWidth,d.areaHeight)*d.areaHeight;
  var si=s.indexOf(start),ei=s.indexOf(stop,si);
  if(si<0||ei<0||length>255)throw Error('TEST236: RLE code layout changed');
  s=s.slice(0,si)+NL+executor(length)+s.slice(ei+stop.length);
  info={selected:true,direction:d.direction,pixels:d.pixels,mode:'RLE-optimized-executor',
   changed:'single-cell and short vertical runs',irqCommit:'RLE',colorScan:false};
  window.RICO_TEST236_LAST_BUILD=info;
  console.log('[TEST236 FAST DIAGONAL]',info);
  return s;
 }
 var p=plan(d);
 if(!p){window.RICO_TEST236_LAST_BUILD=info;return s;}
 var prep=' jsr diag_colors221'+NL+' jsr prepare_sparse_colors203',
     colorIRQ=' jsr commit_sparse_colors203'+NL+' jsr swap_screens',
     charsets='*=$3000'+NL+'charset_bank1';
 if(s.split(prep).length!==2||s.split(colorIRQ).length!==2||s.split(charsets).length!==2)
  throw Error('TEST236: diagonal safe-stage anchors changed');
 s=s.replace(prep,'').replace(colorIRQ,' jsr diag_rle_apply221'+NL+' jsr swap_screens');
 s=s.replace(charsets,executor(p.len)+charsets);
 s+=NL+tables(p);
 info={selected:true,direction:d.direction,pixels:d.pixels,mode:'deduplicated-RLE-fast',
  uniquePhases:p.totalUnique,phases:p.originalPhases,compressedBytes:p.compressedBytes,
  changed:'one-pass diagonal + accelerated color runs',irqCommit:'RLE',colorScan:false};
 window.RICO_TEST236_LAST_BUILD=info;
 console.log('[TEST236 FAST DIAGONAL]',info);
 return s;
};
window.RICO_TEST236_DIAGONAL={version:236,previous:previous,plan:plan,executor:executor,tables:tables};
})();