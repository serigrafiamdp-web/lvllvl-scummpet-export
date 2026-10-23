/* TEST243 - optimiza sólo PING PONG grupal a 8 px/tick.
   Mantiene la fase reflejada exacta y vuelve al ASM TEST242 para fases
   no alineadas al límite de 8 pixeles, sin cambiar ONDAS. */
(function(){
'use strict';
function h8(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function h16(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function emit(out,a){for(var i=0;i<a.length;i+=16)out.push('!byte '+a.slice(i,i+16).map(h8).join(','));}
function transform(source,g){
 if(!/^pingpong-(?:left|right)$/.test(g.type)||g.pixels!==8)return {source:source,mode:'fallback'};
 var w=g.w,h=g.h,n=w*h;
 if(!(Number.isInteger(w)&&Number.isInteger(h)&&n>0&&n<=256))throw new Error('TEST243: tamaño de grupo inválido.');
 var originalBaseMatch=source.match(/\*=\$([0-9a-f]{4})\ngroup183_original_sources\b/i);
 if(!originalBaseMatch)throw new Error('TEST243: fuente horizontal TEST242 no encontrada.');
 var oldSourceBase=parseInt(originalBaseMatch[1],16);
 var oldSourceLength=n*(g.type==='pingpong-right'?24:16);
 var tableBase=oldSourceBase+oldSourceLength;
 // Four pointer/index tables + one start-offset table.
 var fullCacheBase=tableBase+4*n+w+16,fullCacheEnd=fullCacheBase+64*n+8;
 var fastAll=fullCacheEnd<=0xd000;
 var cacheBase=fastAll?fullCacheBase:(tableBase+4*n+w);
 var cacheEnd=fastAll?fullCacheEnd:(cacheBase+8*n+8);
 if(cacheEnd>0xd000)return {source:source,mode:'memory-fallback',bytesRequired:cacheEnd};
 var old=' lda #$08\n sta group183_raster_left\ngroup183_raster_loop\n';
 if(source.split(old).length!==2)throw new Error('TEST243: bucle de raster de grupo incompatible.');
 source=source.replace(old,
   ' lda #$08\n sta group183_raster_left\n'+
   (fastAll?' jmp group243_fast_tile\n':' lda group183_bit_phase\n bne group183_raster_loop\n jmp group243_fast_tile\n')+
   'group183_raster_loop\n');
 var at='group183_source_los\n';
 if(source.split(at).length!==2)throw new Error('TEST243: tablas de fuentes del grupo no encontradas.');
 var code=[
 'group243_fast_tile',
 ' ldx group182_tile_index',
 ' lda group243_dest_col,x',
 g.type==='pingpong-right'?' sec':' clc',
 g.type==='pingpong-right'?' sbc group183_byte_phase':' adc group183_byte_phase',
 g.type==='pingpong-right'?' bcc group243_blank':' bcs group243_blank'
 ];
 if(w!==256)code.push(' cmp #'+h8(w),' bcs group243_blank');
 code.push(
 ' tax',
 ' lda group243_coloffset,x',
 ' ldx group182_tile_index',
 ' clc',
 ' adc group243_dest_row,x',
 ' tax',
 ' lda group243_glyph_lo,x',
 ...(fastAll?[' clc',' adc group243_offset_lo']:[]),
 ' sta group182_src_lo',
 ' lda group243_glyph_hi,x',
 ...(fastAll?[' adc group243_offset_hi']:[]),
 ' sta group182_src_hi',
 ' jmp group243_do_copy',
 'group243_blank',
 ' lda #<group243_zero8',
 ' sta group182_src_lo',
 ' lda #>group243_zero8',
 ' sta group182_src_hi',
 'group243_do_copy',
 ' ldy #$00',
 'group243_copy8',
 ' lda (group182_src_lo),y',
 ' sta (group182_dest_lo),y',
 ' iny',
 ' cpy #$08',
 ' bne group243_copy8',
 ' jmp group183_next_tile');
 source=source.replace(at,
   (fastAll?'group243_offset_lo\n!byte $00\ngroup243_offset_hi\n!byte $00\n':'')+
   code.join('\n')+'\n'+at);
 if(fastAll){
   var phaseEnd=' sta group183_byte_phase\n rts\n';
   if(source.split(phaseEnd).length!==2)throw new Error('TEST243: fase Ping Pong incompatible.');
   source=source.replace(phaseEnd,
     ' sta group183_byte_phase\n'+
     ' tax\n'+
     ' lda group243_phase_lo,x\n sta group243_offset_lo\n'+
     ' lda group243_phase_hi,x\n sta group243_offset_hi\n rts\n');
 }
 var cc=[],rr=[],colStart=[],lo=[],hi=[],glyphCache=[];
 function rowByte(x,y,row){
   if(x<0||x>=w)return 0;
   var id=g.cells[x][y],bitmap=g.tiles[id]&&g.tiles[id].data&&g.tiles[id].data[0];
   if(!bitmap||bitmap.length!==64)throw new Error('TEST243: bitmap faltante '+id);
   var byte=0;
   for(var bit=0;bit<8;bit++)if(bitmap[row*8+bit])byte|=(128>>bit);
   return byte;
 }
 for(var x=0;x<w;x++)colStart.push(x*h);
 for(var x=0;x<w;x++)for(var y=0;y<h;y++){
   var i=x*h+y;
   cc.push(x);rr.push(y);
   var ptr=cacheBase+i*8;lo.push(ptr&255);hi.push(ptr>>8);
   if(!fastAll)for(var row=0;row<8;row++)glyphCache.push(rowByte(x,y,row));
 }
 if(fastAll)for(var phase=0;phase<8;phase++){
   for(var px=0;px<w;px++)for(var py=0;py<h;py++)for(var row=0;row<8;row++){
     var current=rowByte(px,py,row),near=rowByte(px+(g.type==='pingpong-left'?1:-1),py,row);
     var byte=phase===0?current:(g.type==='pingpong-left'
       ?((current<<phase)|(near>>>(8-phase)))
       :((current>>>phase)|(near<<(8-phase))));
     glyphCache.push(byte&255);
   }
 }
 var d=['*='+h16(tableBase),'group243_dest_col'];
 emit(d,cc);d.push('group243_dest_row');emit(d,rr);
 d.push('group243_coloffset');emit(d,colStart);
 d.push('group243_glyph_lo');emit(d,lo);
 d.push('group243_glyph_hi');emit(d,hi);
 if(fastAll){
   d.push('group243_phase_lo');emit(d,Array.from({length:8},(_,p)=>(p*8*n)&255));
   d.push('group243_phase_hi');emit(d,Array.from({length:8},(_,p)=>(p*8*n)>>8));
 }
 d.push('group243_original_glyph_cache');emit(d,glyphCache);
 d.push('group243_zero8','!byte $00,$00,$00,$00,$00,$00,$00,$00');
 source+='\n'+d.join('\n')+'\n';
 return {source:source,mode:fastAll?'all-subpixel-LUT':'direct-8-byte-copy',glyphs:n,extraBytes:4*n+w+(fastAll?16+64*n:8*n)+8};
}
window.RICO_TEST243_FAST8={transform:transform};
})();
