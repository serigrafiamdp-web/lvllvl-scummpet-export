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
// TEST240: foreground colors do not matter while the newly displayed glyph
// is visually invisible. This is **only** the export-time RLE planner fallback.
// A later transition from invisible to visible MUST rewrite its Color RAM,
// even if old and new logical foreground colors happen to match.
function plan(d){
 if(!d||!d.fastRows||d.uniformColor||d.group)return null;
 var W=d.areaWidth,H=d.areaHeight,len=W/gcd(W,H)*H;
 if(len<1||len>255)return null;
 var bank=d.bank===2?d.bank2:d.bank1;
 if(!bank||bank.length<2048)return null;
 var ink=new Uint8Array(256);
 for(var ch=0;ch<256;ch++){
  for(var bit=0;bit<8;bit++)if(bank[ch*8+bit]){ink[ch]=1;break;}
 }
 function requiredColor(ox,oy,nx,ny,x,r){
  var prev=((oy+r)%H)*d.rowStride+((ox+x)%W),
      next=((ny+r)%H)*d.rowStride+((nx+x)%W),
      newColor=d.colors[next]&15,
      oldColor=d.colors[prev]&15,
      newCode=d.map[next]&255,
      oldCode=d.map[prev]&255;
  // In regular hires text, pixels 0 use $D021 background. Only actual
  // opaque pixels with foreground != background can need Color RAM.
  if(!ink[newCode]||newColor===(d.bg&15))return -1;
  // If the previous screen cell was invisible, the actual Color RAM
  // may be stale because earlier invisible transitions were skipped.
  if(ink[oldCode]&&oldColor!==(d.bg&15)&&oldColor===newColor)return -1;
  return newColor;
 }
 var sx=d.dir.x===-1?1:-1,sy=d.dir.y===-1?1:-1,phases=[],unique=[],known={},
     emittedWrites=0,legacyDifferences=0,invisibleSaved=0;
 for(var t=0;t<len;t++){
  var ox=((d.cameraX+t*sx)%W+W)%W,oy=((d.cameraY+t*sy)%H+H)%H,
      nx=(ox+sx+W)%W,ny=(oy+sy+H)%H,run=[];
  for(var x=0;x<40;x++)for(var r=0;r<25;){
   var v=requiredColor(ox,oy,nx,ny,x,r);
   var oldPos=((oy+r)%H)*d.rowStride+((ox+x)%W),
       newPos=((ny+r)%H)*d.rowStride+((nx+x)%W);
   if((d.colors[oldPos]&15)!==(d.colors[newPos]&15)){
    legacyDifferences++;
    if(v<0)invisibleSaved++;
   }
   if(v<0){r++;continue;}
   var first=r++,count=1;
   while(r<25){
    var next=requiredColor(ox,oy,nx,ny,x,r);
    if(next!==v)break;
    r++;count++;
   }
   var dest=0xd800+first*40+x;
   run.push(count,dest&255,dest>>8,v);
   emittedWrites+=count;
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
    totalUnique:unique.length,originalPhases:len,
    colorWrites:emittedWrites,legacyColorDifferences:legacyDifferences,
    skippedInvisibleColorWrites:invisibleSaved,visibilityAware:true};
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
// TEST240 second-tier safety fallback: if RLE cannot fit, skip Color RAM
// comparisons for invisible glyphs. Keep the proven sparse IRQ writer.
// Precompute a bit-7 invisibility marker in world_color_data ONLY for this
// fallback. VIC-II Color RAM uses the low four bits, so startup is unaffected.
function invisibleSparseFallback(d,s){
 var glyphs=d.bank===2?d.bank2:d.bank1;
 if(!glyphs||glyphs.length<2048||!d.map||!d.colors||d.map.length!==d.colors.length)return null;
 var ink=new Uint8Array(256);
 for(var i=0;i<256;i++)for(var b=0;b<8;b++)if(glyphs[i*8+b]){ink[i]=1;break;}
 var tagged=new Uint8Array(d.colors.length),hidden=0;
 for(var k=0;k<tagged.length;k++){
  var color=d.colors[k]&15;
  var invisible=!ink[d.map[k]&255]||color===(d.bg&15);
  tagged[k]=color|(invisible?0x80:0);
  if(invisible)hidden++;
 }
 // If nearly every cell is visible the extra branch may be slower.
 if(hidden*2<tagged.length)return null;
 var marker='*=$7000'+NL+'world_color_data'+NL,at=s.indexOf(marker);
 var stop=at<0?-1:s.indexOf('*=$a000'+NL,at+marker.length);
 if(at<0||stop<0||s.indexOf(marker,at+marker.length)>=0)
  throw Error('TEST240: missing unique color data anchor');
 var out=[];bytes(out,Array.from(tagged));
 s=s.slice(0,at)+marker+out.join(NL)+NL+s.slice(stop);
 for(var page=0;page<4;page++){
  var src='
  var label='color_scan203_'+page+NL;
  var old=label+' lda '+dest+',x'+NL+' and #$0f'+NL+' cmp '+src+',x';
  var safer=label+' lda '+src+',x'+NL+' bmi color_next203_'+page+
    NL+' lda '+dest+',x'+NL+' and #$0f'+NL+' cmp '+src+',x';
  if(s.split(old).length!==2)throw Error('TEST240: sparse scan anchor missing page '+page);
  s=s.replace(old,safer);
 }
 return{source:s,hidden: hidden,cellCount:tagged.length};
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
 if(!p){
  var opacity=invisibleSparseFallback(d,s);
  if(opacity){
   info={selected:true,direction:d.direction,pixels:d.pixels,
    mode:'visibility-sparse-fallback',visibilityAware:true,
    hiddenCells:opacity.hidden,totalCells:opacity.cellCount,
    colorScan:true,irqCommit:'original sparse writer',
    screenCopy:'unchanged',introColor:'low nibble unchanged'};
   window.RICO_TEST236_LAST_BUILD=info;
   console.log('[TEST240 INVISIBLE SPARSE FALLBACK]',info);
   return opacity.source;
  }
  window.RICO_TEST236_LAST_BUILD=info;return s;
 }
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
  colorWrites:p.colorWrites,legacyColorDifferences:p.legacyColorDifferences,
  skippedInvisibleColorWrites:p.skippedInvisibleColorWrites,visibilityAware:true,
  changed:'one-pass diagonal + accelerated color runs',irqCommit:'RLE',colorScan:false};
 window.RICO_TEST236_LAST_BUILD=info;
 console.log('[TEST236 FAST DIAGONAL]',info);
 return s;
};
window.RICO_TEST236_DIAGONAL={version:236,previous:previous,plan:plan,executor:executor,tables:tables};
})();+(0x0c00+page*256).toString(16),dest=w(0xd800+page*256);
  var label='color_scan203_'+page+NL;
  var old=label+' lda '+dest+',x'+NL+' and #$0f'+NL+' cmp '+src+',x';
  var safer=label+' lda '+src+',x'+NL+' bmi color_next203_'+page+
    NL+' lda '+dest+',x'+NL+' and #$0f'+NL+' cmp '+src+',x';
  if(s.split(old).length!==2)throw Error('TEST240: sparse scan anchor missing page '+page);
  s=s.replace(old,safer);
 }
 return{source:s,hidden: hidden,cellCount:tagged.length};
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
 if(!p){
  var opacity=invisibleSparseFallback(d,s);
  if(opacity){
   info={selected:true,direction:d.direction,pixels:d.pixels,
    mode:'visibility-sparse-fallback',visibilityAware:true,
    hiddenCells:opacity.hidden,totalCells:opacity.cellCount,
    colorScan:true,irqCommit:'original sparse writer',
    screenCopy:'unchanged',introColor:'low nibble unchanged'};
   window.RICO_TEST236_LAST_BUILD=info;
   console.log('[TEST240 INVISIBLE SPARSE FALLBACK]',info);
   return opacity.source;
  }
  window.RICO_TEST236_LAST_BUILD=info;return s;
 }
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
  colorWrites:p.colorWrites,legacyColorDifferences:p.legacyColorDifferences,
  skippedInvisibleColorWrites:p.skippedInvisibleColorWrites,visibilityAware:true,
  changed:'one-pass diagonal + accelerated color runs',irqCommit:'RLE',colorScan:false};
 window.RICO_TEST236_LAST_BUILD=info;
 console.log('[TEST236 FAST DIAGONAL]',info);
 return s;
};
window.RICO_TEST236_DIAGONAL={version:236,previous:previous,plan:plan,executor:executor,tables:tables};
})();