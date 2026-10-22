(function(){
'use strict';
// TEST224: reduce vertical main_busy. One-time prime uses exact original
// 960+40-char copy; subsequent backbuffers are two camera rows behind,
// so apply offline computed char changes (cam-2 -> cam) directly.
// All colors/IRQs/ticks/SID/horizontal/diagonal remain untouched.
var V=window.RICO_TEST168_PRG_LARGE_MAP;if(!V)return;
var old=V.buildSource,NL=String.fromCharCode(10);
function hx(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function bt(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function blockBytes(a){var x=[];for(var i=0;i<a.length;i+=16)x.push('!byte '+a.slice(i,i+16).map(bt).join(','));return x.join(NL);}
function plan(d,asm){
 if(d.pixels!==8||d.type!=='up'&&d.type!=='down'||!d.area||d.area.width!==40)return null;
 if(d.anim175&&(d.anim175.group||d.anim175.switchTicks||(d.anim175.records||[]).length))return null;
 // Avoid the sparse-color table storage and optional TEST221 RLE table
 // occupying $A100-$CFFF. Dynamic or uniform color use these slots safely.
 if(asm.includes('vcolor221_data_')||asm.includes('color_update_count'+NL))return null;
 var H=d.area.height;
 if(H<25||H>255||d.map.length<(d.area.y+H)*40)return null;
 var base=0xa100,lo=base+2*H,hi=0xb800,extra=false,addr=[],lists=[],count=0,max=0;
 for(var target=0;target<H;target++){
  var oldCam=(target+(d.type==='up'?H-2:2))%H,stream=[];
  // For Up the hardware-visible map's camera advances +1 at every swap;
  // for Down it advances -1. Reuse the hidden VIC screen from 2 swaps ago.
  for(var row=0;row<25;row++)for(var col=0;col<40;col++){
   var was=d.map[(d.area.y+(oldCam+row)%H)*40+col]&255,
       now=d.map[(d.area.y+(target+row)%H)*40+col]&255;
   if(was===now)continue;
   var offset=40*row+col;
   stream.push(offset>>8,offset&255,now);count++;
  }
  stream.push(255); max=Math.max(max,(stream.length-1)/3);
  if(!extra&&lo+stream.length<=0xb000){addr.push(lo);lo+=stream.length;}
  else if(hi+stream.length<=0xd000){extra=true;addr.push(hi);hi+=stream.length;}
  else return null; // exact original 960+40 path, never reject artwork
  lists.push(stream);
 }
 // Conservative performance rule: around 30 CPU cycles per patch record.
 // A full direct screen shift costs ~11k cycles; stay well below.
 if(max>220)return null;
 return{base,H,addr,lists,max,total:count};
}
function runtime(){
 return ['render_delta224',
  ' lda glyph224_primed',' bne glyph224_ready',
  ' lda #$01',' sta glyph224_primed',' jmp prepare_back_shift',
  'glyph224_ready',' ldx camera_row',
  ' lda glyph224_ptrlo,x',' sta src_lo',
  ' lda glyph224_ptrhi,x',' sta src_hi',
  'glyph224_next',' ldy #$00',' lda (src_lo),y',
  ' cmp #$ff',' beq glyph224_done',
  ' clc',' adc back_hi',' sta dst_hi',
  ' iny',' lda (src_lo),y',' sta dst_lo',
  ' iny',' lda (src_lo),y',' ldy #$00',' sta (dst_lo),y',
  ' clc',' lda src_lo',' adc #$03',' sta src_lo',
  ' bcc glyph224_no_carry',' inc src_hi',
  'glyph224_no_carry',' jmp glyph224_next',
  'glyph224_done',' rts',
  'glyph224_primed','!byte $00'].join(NL)+NL;
}
function data(p){
 var a=['*='+hx(p.base),'glyph224_ptrlo',blockBytes(p.addr.map(function(v){return v&255;})),
  'glyph224_ptrhi',blockBytes(p.addr.map(function(v){return v>>8;}))];
 for(var j=0;j<p.H;j++)a.push('*='+hx(p.addr[j]),'glyph224_data_'+j,blockBytes(p.lists[j]));
 return a.join(NL)+NL;
}
V.buildSource=function(d){
 var asm=old(d),p=plan(d,asm);
 window.RICO_TEST224_LAST_BUILD={selected:!!p,reason:p?'sparse-glyph-changes':'legacy',changedCells:p?.total||null,maxPerFrame:p?.max||null};
 if(d.pixels===8)console.log('[RICO TEST224 VERTICAL]',d.type,p?'GLYPH DELTA':'FULL COPY',p?'max '+p.max+' updated cells/step':'original render retained');
 if(!p)return asm;
 var from=['main_prepare_shift',' jsr prepare_back_shift'].join(NL),
     to=['main_prepare_shift',' jsr render_delta224'].join(NL);
 if(asm.split(from).length!==2)throw Error('TEST224: vertical main prepare changed');
 asm=asm.replace(from,to);
 var mark='*=$3000'+NL;
 if(asm.split(mark).length!==2)throw Error('TEST224: charset marker changed');
 return asm.replace(mark,runtime()+mark)+NL+data(p);
};
window.RICO_TEST224_VERTICAL_GLYPH_DELTA={version:224,plan,buildOld:old};
})();