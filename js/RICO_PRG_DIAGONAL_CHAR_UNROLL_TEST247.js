(function(){
'use strict';
// TEST247: optimize only the character-copy stage of TEST244.
// DEMOSCENE technique: 936 generated absolute LDA/STA pairs for EACH
// of the two VIC screen-buffer directions. No X loop, no branch per byte.
// The entering column and entire bottom row are rebuilt by the *unchanged*
// diag_edge_column221. Color RAM / raster IRQ remain TEST244 exactly.
// Bound to spare mapped RAM: $1800..$1fff, $ac41..$afff,
// $c341..$cfff, $e000..$ffff with KERNAL disabled ($01=$35).
// Never touch $b000-$b7ff SID, $3000/$3800 charset,
// $4000-$9fff world map/colors, or core $2000.
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var previous=E.build,NL='\n';
function h(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function pairs(a,from,to,stride,edgeX,first,last){
 for(var i=first;i<last;i++){
  if(i%40===edgeX)continue; // overwritten by the existing edge-column builder
  a.push(' lda '+h(from+i+stride),' sta '+h(to+i));
 }
}
function emit(d){
 var sx=d.dir.x===-1?1:-1,stride=40+sx,edgeX=sx===1?39:0;
 var a=[
 '; TEST247 generated direct LDA/STA — character screen only',
 '; 0400 -> 0800, full unroll, 936 copies, $E000-$F5F0',
 '*=$e000','char_copy_0408_247'];
 pairs(a,0x0400,0x0800,stride,edgeX,0,960);
 a.push(' rts');
 // 0800 -> 0400, the SAME 936 copies spread over three free RAM areas.
 // The two long JMPs occur only once per screen copy, not per character.
 a.push('*=$1800','char_copy_0804_247');
 pairs(a,0x0800,0x0400,stride,edgeX,0,320);
 a.push(' jmp char_copy_0804_seg2_247',
  '*=$ac41','char_copy_0804_seg2_247');
 pairs(a,0x0800,0x0400,stride,edgeX,320,480);
 a.push(' jmp char_copy_0804_seg3_247',
  '*=$c341','char_copy_0804_seg3_247');
 pairs(a,0x0800,0x0400,stride,edgeX,480,960);
 a.push(' rts');
 return a.join(NL)+NL;
}
function stage(){
 return [
 'diag_shift221',
 ' lda front_hi',
 ' cmp #$04',' beq diag_0408_221',
 ' jmp diag_0804_221',
 'diag_0408_221',
 ' jsr char_copy_0408_247',
 ' jmp diag_edge_column221',
 'diag_0804_221',
 ' jsr char_copy_0804_247',
 ' jmp diag_edge_column221'
 ].join(NL)+NL;
}
E.build=function(d){
 var s=previous(d),color=window.RICO_TEST244_LAST_BUILD||{};
 var info={version:247,selected:false,reason:'TEST244 two-stage direct-color not selected'};
 if(!d||!color.selected||color.mode!=='two-stage-raster-direct-color'||
    !d.fastRows||d.uniformColor||d.group||!d.dir||d.dir.y!==-1){
   window.RICO_TEST247_LAST_BUILD=info;return s;
 }
 var begin=NL+'diag_shift221'+NL,
     finish=NL+'diag_edge_column221'+NL,
     at=s.indexOf(begin),end=at<0?-1:s.indexOf(finish,at+begin.length);
 if(at<0||end<0||s.indexOf(begin,at+begin.length)>=0||
    s.split(finish).length!==2||
    s.split(' jsr diag_shift221').length!==2)
   throw Error('TEST247: unexpected character stage — REFUSE to patch');
 var old=s.slice(at,end),updated=stage();
 // Defensive uniqueness before replacing a tested routine.
 if(!old.includes('diag_0408_221')||!old.includes('diag_0804_221')||
    !old.includes(' lda ')||!old.includes(' sta ')||
    s.includes('*=$e000')||s.includes('*=$1800')||
    s.includes('*=$ac41')||s.includes('*=$c341'))
   throw Error('TEST247: baseline/memory layout incompatible');
 s=s.slice(0,at)+NL+updated+s.slice(end+1);
 s+=NL+emit(d);
 info={version:247,selected:true,mode:'unrolled-char-copy-plus-test244',
    copiesPerScreen:936,cycleEstimatePerScreen:936*8+6+12,
    skipped:'entire incoming bottom row and exposed column; existing edge builder unchanged',
    codeBanks:[
     '$E000-$F5F0 (0408)',
     '$1800-$1F82 (0804 part1)',
     '$AC41-$B000 (0804 part2, bounded)',
     '$C341-$CE50 (0804 part3, bounded)'
    ],
    stable:'original TEST244 raster $A0/$FA, SID, both charsets, 16 foreground colors',
    caveat:'RAM $E000 must be visible (original $01=$35) and ROM/SID relocation must not conflict'};
 window.RICO_TEST247_LAST_BUILD=info;
 console.log('[TEST247 CHAR COPY]',info);
 return s;
};
window.RICO_TEST247_DIAGONAL={version:247,emit:emit,previous:previous};
})();