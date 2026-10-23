(function(){
'use strict';
/* TEST252: Transposed edge source cache.
 * Keep TEST251's identical three raster-band 6502 copy engine.
 * Replace slow 25-row column preparation (two pointer rebuilds
 * per row) with two sequential indexed reads per row.
 * Precompute CHAR+COLOR vertically doubled column-major data
 * at export into spare $8000-$9FFF, no runtime transposition.
 * Supports arbitrary character indices, color values 0..15,
 * dynamic circular world map, Bank1/2, two upward diagonals.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var old=E.build,N='\n';
function hx(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function hb(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function byteData(a,values){
 for(var k=0;k<values.length;k+=16){
  a.push('!byte '+values.slice(k,k+16).map(hb).join(','));
 }
}
function cache(d){
 var W=d.areaWidth,H=d.areaHeight,stride=d.rowStride,span=2*H,
     edge=d.dir.x===-1?39:0,
     total=W*span*2,
     a=['; TEST252 vertically doubled column-major char+color cache', '*=$8000','t252_column_chars'],
     chars=[],cols=[];
 for(var x=0;x<W;x++)for(var y=0;y<span;y++){
  var index=(y%H)*stride+x;
  chars.push(d.map[index]&255);
  cols.push(d.colors[index]&15);
 }
 byteData(a,chars);
 var cb=0x8000+W*span;
 a.push('*='+hx(cb),'t252_column_colors');
 byteData(a,cols);
 return {asm:a.join(N)+N,width:W,height:H,span:span,total:total,colorBase:cb,edge:edge};
}
function prefetch(c){
 var W=c.width,H=c.height,
     base=0x8000,cb=c.colorBase,span=c.span,edge=c.edge,
     cl=[],ch=[],kl=[],kh=[];
 for(var x=0;x<W;x++){
  var actual=(x+edge)%W,addr=base+actual*span,col=cb+actual*span;
  cl.push(addr&255);ch.push(addr>>8);
  kl.push(col&255);kh.push(col>>8);
 }
 var a=['; TEST252: one table lookup per pending column, not 25 row tables',
 'prep_edges249',
 ' ldx pending_x',
 ' lda t252_col_char_lo,x',' clc',' adc pending_y',' sta src_lo',
 ' lda t252_col_char_hi,x',' adc #$00',' sta src_hi',
 ' lda t252_col_color_lo,x',' clc',' adc pending_y',' sta color_src_lo',
 ' lda t252_col_color_hi,x',' adc #$00',' sta color_src_hi',
 ' ldy #$00','t252_column_loop',
 ' lda (src_lo),y',' sta buf_colchar249,y',
 ' lda (color_src_lo),y',' sta buf_colcolor249,y',
 ' iny',' cpy #$19',' bne t252_column_loop'];
 var tables=[
  ['t252_col_char_lo',cl],['t252_col_char_hi',ch],
  ['t252_col_color_lo',kl],['t252_col_color_hi',kh]
 ];
 for(var k=0;k<tables.length;k++){
  a.push(tables[k][0]);byteData(a,tables[k][1]);
 }
 return a.join(N)+N;
}
E.build=function(d){
 var s=old(d),baseline=window.RICO_TEST251_LAST_BUILD||{};
 var stat={version:252,selected:false,reason:'TEST251 path unavailable'};
 if(!d||!baseline.selected||baseline.mode!=='tight-three-band-raster'){
  window.RICO_TEST252_LAST_BUILD=stat;return s;
 }
 var W=d.areaWidth,H=d.areaHeight,stride=d.rowStride,bytes=4*W*H;
 if(W<40||W>255||H<25||H>231||stride<W||bytes>8192||
    (H-1)*stride+W>d.map.length||(H-1)*stride+W>d.colors.length){
  stat.reason='insufficient safe column-major cache region or source';
  window.RICO_TEST252_LAST_BUILD=stat;return s;
 }
 var c=cache(d);
 var label=N+'prep_edges249'+N,
     tail='; Precompute the full incoming last row';
 var i=s.indexOf(label),j=i<0?-1:s.indexOf(tail,i+label.length);
 if(i<0||j<0||s.split(label).length!==2||s.split(tail).length!==2)
  throw Error('TEST252: failed to isolate original column prefetch code');
 s=s.slice(0,i)+N+prefetch(c)+s.slice(j);
 var world='*=$a000'+N+'group182_pending';
 if(s.split(world).length!==2)
  throw Error('TEST252: expected world/charset memory layout changed');
 s=s.replace(world,c.asm+world);
 stat={version:252,selected:true,mode:'column-major-6502-edge-cache',
  raster:[86,132,218],unchanged:'TEST251 three-band CHAR+ColorRAM copies and IRQ schedule',
  map:'arbitrary char indices and arbitrary 16-color values',
  cachedBytes:c.total,region:hx(0x8000)+'..'+hx(0x8000+c.total-1),
  sourceStride:stride,dimensions:[W,H],columnSpan:c.span,
  oldSource:'25 row pointer calculations for chars plus 25 for colors',
  newSource:'single column lookup, 25 contiguous paired indexed loads',
  predictedSavingCyclesPerStep:'~1400-1700 (analytical estimate, VICE not validated)',
  monitor:'m a020 a028',
  status:'experimental: verify real VICE screenshot/video before PASS'};
 window.RICO_TEST252_LAST_BUILD=stat;
 console.log('[TEST252 COLUMN-MAJOR EDGE CACHE]',stat);
 return s;
};
window.RICO_TEST252_COLUMN_MAJOR={version:252,previous:old,cache:cache,prefetch:prefetch};
})();