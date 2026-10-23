(function(){
'use strict';
// TEST247 / SAFE LOADER: generated unrolled double-buffer character shift.
// Both directions use 936 *8-cycle absolute LDA/STA copies.
// Source never makes a contiguous PRG cross IO $D000-$DFFF:
// - 0800 -> 0400: embedded static code $1000-$1FFF and $C341-$CFFF.
// - 0400 -> 0800: compact 6502 generator at startup emits machine
//   code at $E000 (RAM visible after original start sets $01=$35).
// Original TEST244 Color RAM raster IRQ and entering edges stay unchanged.
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var previous=E.build,NL='\n';
function word(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function byte(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function pairs(a,from,to,stride,edgeX,first,last){
 for(var i=first;i<last;i++){
  if(i%40===edgeX)continue;
  a.push(' lda '+word(from+i+stride),' sta '+word(to+i));
 }
}
function otherScreen(d){
 var sx=d.dir.x===-1?1:-1,stride=40+sx,edgeX=sx===1?39:0;
 var a=['; Embedded compact-address-space direct screen copies',
  '*=$1000','char_copy_0804_247'];
 pairs(a,0x0800,0x0400,stride,edgeX,0,640);
 a.push(' jmp char_copy_0804_tail247',
  '*=$c341','char_copy_0804_tail247');
 pairs(a,0x0800,0x0400,stride,edgeX,640,960);
 a.push(' rts');
 return a.join(NL)+NL;
}
function bootGenerator(d){
 var sx=d.dir.x===-1?1:-1,stride=40+sx,edgeX=sx===1?39:0;
 var a=['; Initial one-time generated code. Never included in PRG load bytes.',
  'char_copy_0408_247=$e000',
  'build_char_0408_247',
  ' lda #$00',' sta color_src_lo',
  ' lda #$e0',' sta color_src_hi',
  ' lda #'+byte((0x0400+stride)&255),' sta src_lo',
  ' lda #'+byte((0x0400+stride)>>8),' sta src_hi',
  ' lda #$00',' sta dst_lo',
  ' lda #$08',' sta dst_hi',
  ' lda #$18',' sta rows_left',
  'char_build_row247',
  ' lda #$28',' sta src_col',
  'char_build_cell247',
  ' lda src_col',
  ' cmp #'+byte(edgeX===39?1:40),
  ' beq char_build_skip247',
  ' ldy #$00',
  ' lda #$ad',' sta (color_src_lo),y',' iny', // LDA absolute opcode
  ' lda src_lo',' sta (color_src_lo),y',' iny',
  ' lda src_hi',' sta (color_src_lo),y',' iny',
  ' lda #$8d',' sta (color_src_lo),y',' iny', // STA absolute opcode
  ' lda dst_lo',' sta (color_src_lo),y',' iny',
  ' lda dst_hi',' sta (color_src_lo),y',
  ' clc',' lda color_src_lo',' adc #$06',' sta color_src_lo',
  ' bcc char_build_output_ok247',
  ' inc color_src_hi',
  'char_build_output_ok247',
  'char_build_skip247',
  ' inc src_lo',' bne char_build_src_ok247',
  ' inc src_hi',
  'char_build_src_ok247',
  ' inc dst_lo',' bne char_build_dst_ok247',
  ' inc dst_hi',
  'char_build_dst_ok247',
  ' dec src_col',' beq char_build_rowdone247',
  ' jmp char_build_cell247',
  'char_build_rowdone247',
  ' dec rows_left',' beq char_build_finish247',
  ' jmp char_build_row247',
  'char_build_finish247',
  ' lda #$60',' ldy #$00',' sta (color_src_lo),y', // RTS after 936 pairs
  ' rts'];
 return a.join(NL)+NL;
}
function stage(){
 return [
 'diag_shift221',
 ' lda front_hi',
 ' cmp #$04',' beq diag_0408_221',
 ' jmp diag_0804_221',
 'diag_0408_221',' jsr char_copy_0408_247',
 ' jmp diag_edge_column221',
 'diag_0804_221',' jsr char_copy_0804_247',
 ' jmp diag_edge_column221'
 ].join(NL)+NL;
}
E.build=function(d){
 var src=previous(d),b=window.RICO_TEST244_LAST_BUILD||{};
 var info={version:247,selected:false,reason:'no eligible TEST244 upward raster path'};
 if(!d||!b.selected||b.mode!=='two-stage-raster-direct-color'||
     d.uniformColor||d.group||!d.fastRows||!d.dir||d.dir.y!==-1){
  window.RICO_TEST247_LAST_BUILD=info;return src;
 }
 var begin=NL+'diag_shift221'+NL,finish=NL+'diag_edge_column221'+NL,
     i=src.indexOf(begin),j=i<0?-1:src.indexOf(finish,i+begin.length);
 var marker='*=$3000'+NL+'charset_bank1';
 var bootStart='start'+NL+' sei'+NL+' lda #$35'+NL+' sta $01';
 if(i<0||j<0||src.split(begin).length!==2||src.split(finish).length!==2||
    src.split(marker).length!==2||src.split(bootStart).length!==2||
    src.includes('*=$1000')||src.includes('*=$c341')||src.includes('*=$e000'))
  throw Error('TEST247: memory/stage anchors changed — refusing unsafe output');
 src=src.slice(0,i)+NL+stage()+src.slice(j+1);
 src=src.replace(bootStart,bootStart+NL+' jsr build_char_0408_247');
 src=src.replace(marker,bootGenerator(d)+marker);
 src+=NL+otherScreen(d);
 info={version:247,selected:true,mode:'safe-loader-unrolled-double-screen',
  copiesPerScreen:936,estimatedCopyCycles:936*8+6+12,
  savedVsTest244CyclesApprox:4400,
  highCode:'generated ONCE at start in RAM $E000-$F5F0, not PRG file',
  embeddedCode:'$1000-$1EA2 and $C341-$CAA1, below IO',
  colorIRQ:'unchanged TEST244 two-stage $A0/$FA',
  unchanged:'BANK1, BANK2, SID-reserved B000-B7FF, nonupward directions, Group Animate',
  needsRealVICE:true};
 window.RICO_TEST247_LAST_BUILD=info;
 console.log('[TEST247 SAFE CHAR UNROLL]',info);
 return src;
};
window.RICO_TEST247_DIAGONAL={version:247,bootGenerator:bootGenerator,otherScreen:otherScreen,previous:previous};
})();