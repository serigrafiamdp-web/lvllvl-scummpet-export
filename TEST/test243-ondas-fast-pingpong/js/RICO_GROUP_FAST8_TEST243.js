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
 var cacheBase=tableBase+4*n+w,cacheEnd=cacheBase+8*n+8;
 if(cacheEnd>0xd000)return {source:source,mode:'memory-fallback',bytesRequired:cacheEnd};
 var old=' lda #$08\n sta group183_raster_left\ngroup183_raster_loop\n';
 if(source.split(old).length!==2)throw new Error('TEST243: bucle de raster de grupo incompatible.');
 source=source.replace(old,
   ' lda #$08\n sta group183_raster_left\n'+
   ' lda group183_bit_phase\n bne group183_raster_loop\n'+
   ' jmp group243_fast_tile\n'+
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
 ' sta group182_src_lo',
 ' lda group243_glyph_hi,x',
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
 source=source.replace(at,code.join('\n')+'\n'+at);
 var cc=[],rr=[],colStart=[],lo=[],hi=[],glyphCache=[];
 for(var x=0;x<w;x++)colStart.push(x*h);
 for(var x=0;x<w;x++)for(var y=0;y<h;y++){
   var i=x*h+y;
   cc.push(x);rr.push(y);
   var ptr=cacheBase+i*8;lo.push(ptr&255);hi.push(ptr>>8);
   var t=g.cells[x][y],pix=g.tiles[t]&&g.tiles[t].data&&g.tiles[t].data[0];
   if(!pix||pix.length!==64)throw new Error('TEST243: bitmap faltante '+t);
   for(var row=0;row<8;row++){
     var byte=0;
     for(var bit=0;bit<8;bit++)if(pix[row*8+bit])byte|=(128>>bit);
     glyphCache.push(byte);
   }
 }
 var d=['*='+h16(tableBase),'group243_dest_col'];
 emit(d,cc);d.push('group243_dest_row');emit(d,rr);
 d.push('group243_coloffset');emit(d,colStart);
 d.push('group243_glyph_lo');emit(d,lo);
 d.push('group243_glyph_hi');emit(d,hi);
 d.push('group243_original_glyph_cache');emit(d,glyphCache);
 d.push('group243_zero8','!byte $00,$00,$00,$00,$00,$00,$00,$00');
 source+='\n'+d.join('\n')+'\n';
 return {source:source,mode:'direct-8-byte-copy',glyphs:n,extraBytes:4*n+w+8*n+8};
}
window.RICO_TEST243_FAST8={transform:transform};
})();
