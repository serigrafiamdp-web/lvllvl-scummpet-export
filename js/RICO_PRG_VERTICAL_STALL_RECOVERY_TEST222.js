(function(){
'use strict';
// TEST222: eliminate variable pauses in vertical Color RAM transitions.
// Reuse TEST221 RLE when cheaper; high-change transitions use predictable
// direct Color RAM 960-cell row shift + the single incoming color row.
// Original character scroll, scheduler and SID paths are unchanged.
var E=window.RICO_TEST168_PRG_LARGE_MAP;
var V=window.RICO_TEST221_VERTICAL_COLOR;
if(!E||!V)return;
var previous=E.buildSource, raw=V.original, NL=String.fromCharCode(10);
function hex(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function byte(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function rows(d){
 var H=d.area.height,list=[];
 for(var cam=0;cam<H;cam++){
  var entering=d.type==='up'?(cam+24)%H:cam;
  list.push(0x7000+(d.area.y+entering)*40);
 }
 return list;
}
function rleModes(plan){
 if(!plan)return null;
 return plan.streams.map(function(bytes){
  var i=0,runs=0,writes=0;
  while(bytes[i]!==0){writes+=bytes[i];i+=4;runs++;}
  // Conservative 6502 cost estimate: direct full Color RAM shift
  // ~13.5K CPU cycles incl incoming row; RLE scales with changed cells.
  return 75*runs+25*writes>12700?1:0;
 });
}
function runtime(d,plan,modes){
 var source=rows(d),lines=['vertical_color_commit222'];
 if(plan){
  lines.push(' ldx camera_row',
    ' lda vertical_color_choice222,x',
    ' bne vertical_color_shift222',
    ' jmp apply_vertical_color221');
 }else lines.push(' jmp vertical_color_shift222');
 lines.push('vertical_color_shift222');
 var up=d.type==='up';
 var pages=up?[0,1,2]:[2,1,0];
 if(!up){
  lines.push(' ldy #$bf','color222_down_tail',
     ' lda $db00,y',' sta $db28,y',' dey',' bpl color222_down_tail');
 }
 for(var i=0;i<pages.length;i++){
  var p=pages[i],tag='color222_'+(up?'up':'down')+'_page'+p;
  lines.push(' ldy #'+(up?'$00':'$ff'),tag,
    ' lda '+hex(0xd800+p*256+(up?40:0))+',y',
    ' sta '+hex(0xd800+p*256+(up?0:40))+',y',
    up?' iny':' dey');
  if(up)lines.push(' bne '+tag);
  else lines.push(' cpy #$ff',' bne '+tag);
 }
 if(up)lines.push(' ldy #$00','color222_up_tail',
   ' lda $db28,y',' sta $db00,y',' iny',' cpy #$c0',' bne color222_up_tail');
 // Only the new color row is copied from the large map.
 lines.push(' ldx camera_row',
  ' lda color222_row_lo,x',' sta src_lo',
  ' lda color222_row_hi,x',' sta src_hi',
  ' ldy #$00','color222_new_row',
  ' lda (src_lo),y',' sta '+hex(up?0xdbc0:0xd800)+',y',
  ' iny',' cpy #$28',' bne color222_new_row',' rts');
 if(plan){
  lines.push('vertical_color_choice222');
  for(var k=0;k<modes.length;k+=16)lines.push('!byte '+modes.slice(k,k+16).map(byte).join(','));
 }
 lines.push('color222_row_lo');
 for(var m=0;m<source.length;m+=16)lines.push('!byte '+source.slice(m,m+16).map(function(x){return byte(x);}).join(','));
 lines.push('color222_row_hi');
 for(var n=0;n<source.length;n+=16)lines.push('!byte '+source.slice(n,n+16).map(function(x){return byte(x>>8);}).join(','));
 return lines.join(NL)+NL;
}
E.buildSource=function(d){
 var result=previous(d);
 // Preserve uniform/sparse color engines and any native animation configurations.
 if(result.indexOf('dynamic_color_row_loop'+NL)<0)return result;
 if(d.anim175&&(d.anim175.group||d.anim175.switchTicks||(d.anim175.records||[]).length))return result;
 if(d.area.width!==40||d.area.height<25||d.area.height>255)return result;
 var p=V.plan(d),m=rleModes(p);
 if(p&&m.every(function(v){return v===0;}))return result;
 // Recover clean original without old RLE when no RLE tables fit.
 if(!p)result=raw(d);
 var target=p?' jsr apply_vertical_color221':' jsr apply_sparse_colors';
 for(var label of ['commit_prepared','commit_fast8']){
  var from=[label,target,' jsr swap_screens'].join(NL);
  var to=[label,' jsr vertical_color_commit222',' jsr swap_screens'].join(NL);
  if(result.split(from).length!==2)throw new Error('TEST222: vertical commit layout changed at '+label);
  result=result.replace(from,to);
 }
 var before='*=$3000'+NL;
 if(result.split(before).length!==2)throw new Error('TEST222: missing charset segment');
 return result.replace(before,runtime(d,p,m)+before);
};
window.RICO_TEST222_VERTICAL_RECOVERY={version:222,build:runtime,rows:rows,rleModes:rleModes,original:previous,raw:raw};
})();