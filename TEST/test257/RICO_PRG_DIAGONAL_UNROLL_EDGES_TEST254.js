(function(){
'use strict';
/* TEST254: fully unrolled 6510 edge preparation.
 * 25 column cells + 40 bottom-row cells, with direct absolute STA
 * (not abs,Y) and no per-cell CPY/BNE. Preserve TEST253 CIA profiling.
 */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var previous=E.build,N='\n';
function once(s,from,to){
 if(s.split(from).length!==2)throw Error('TEST254 expected unique marker: '+from.slice(0,90));
 return s.replace(from,to);
}
function col(){
 var lines=['t252_column_loop'];
 for(var i=0;i<25;i++){
  lines.push(' lda (src_lo),y',' sta buf_colchar249+'+i,
   ' lda (color_src_lo),y',' sta buf_colcolor249+'+i);
  if(i<24)lines.push(' iny');
 }
 lines.push(' jmp t252_last_row');
 return lines.join(N);
}
function row(){
 var lines=['t249_prep_last'];
 for(var i=0;i<40;i++){
  lines.push(' lda (src_lo),y',' sta buf_rowchar249+'+i,
   ' lda (color_src_lo),y',' and #$0f',
   ' sta buf_rowcolor249+'+i);
  if(i<39)lines.push(' iny');
 }
 lines.push(' rts');
 return lines.join(N);
}
var beforeCol=[
 't252_column_loop',' lda (src_lo),y',' sta buf_colchar249,y',
 ' lda (color_src_lo),y',' sta buf_colcolor249,y',
 ' iny',' cpy #$19',' bne t252_column_loop',
 ' jmp t252_last_row'].join(N);
var beforeRow=[
 't249_prep_last',' lda (src_lo),y',' sta buf_rowchar249,y',
 ' lda (color_src_lo),y',' and #$0f',
 ' sta buf_rowcolor249,y',' iny',' cpy #$28',
 ' bne t249_prep_last',' rts'].join(N);
E.build=function(d){
 var asm=previous(d),prev=window.RICO_TEST253_LAST_BUILD||{};
 var info={version:254,selected:false,reason:'TEST253 profiler path inactive'};
 if(!prev.selected||prev.mode!=='cia1-16-bit-cycle-profiler'){
  window.RICO_TEST254_LAST_BUILD=info;
  return asm;
 }
 asm=once(asm,beforeCol,col());
 asm=once(asm,beforeRow,row());
 info={version:254,selected:true,mode:'6502-unrolled-direct-edge-preparation',
  colCells:25,rowCells:40,colorSupported:'16 unrestricted VIC colors',
  upperAndLowerRaster:[86,132,218],
  savedRuntime:'65 branches and comparisons removed; 130 indexed stores replaced with absolute',
  estimatedSavings:'approximately 450 6510 cycles per prepared diagonal',
  profiling:'unchanged TEST253 CIA timer fields $A030..$A049',
  counters:'m a030 a049 then m a020 a028',
  status:'EXPERIMENTAL — run in VICE before PASS'};
 window.RICO_TEST254_LAST_BUILD=info;
 console.log('[TEST254 ASM EDGE UNROLL]',info);
 return asm;
};
})();