/* TEST309: static C64 Bitmap Multicolor + existing TEST207 PSID player.
   USES exact TEST282 encoding (bitmap 8000, screen 1000, color 1000).
   No character-mode renderer and no per-cell HiRes/MC conversion.
   The SID audio source, IRQ cadence and INIT/PLAY protection remain those
   of the proven RICO_SID_RESTORED_TEST308 makeSource207 routine.
*/
(function(w){
'use strict';
function hx(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function h2(v){return '$'+('00'+(v&255).toString(16)).slice(-2);}
function data(name,address,bytes){
 var out=['*='+hx(address),name],slice;
 for(var i=0;i<bytes.length;i+=24){
  slice=Array.from(bytes.subarray(i,i+24),h2);
  out.push('!byte '+slice.join(','));
 }
 return out.join('\n');
}
function valid(data){
 if(!data||!data.bitmap||data.bitmap.length!==8000||
  !data.screen||data.screen.length!==1000||
  !data.color||data.color.length!==1000)
  throw Error('TEST309: Bitmap MC sin datos completos. No se convertirá a caracteres.');
 return data;
}
function buildSource(raw){
 var data=valid(raw),bg=data.bg&15,colors=new Uint8Array(1024);
 colors.set(data.color);
 var s=[
  '; TEST309 BITMAP MULTICOLOR STATIC + ORIGINAL SID PLAYER',
  '; VIC bank 1: bitmap $6000; screen $5C00; color $D800 from $3800',
  '*=$0801',
  '!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
  '*=$2000',
  'start',
  ' sei',
  ' lda #$35',
  ' sta $01',
  ' lda #$7f',
  ' sta $dc0d',
  ' sta $dd0d',
  ' lda $dc0d',
  ' lda $dd0d',
  ' lda #$0b',
  ' sta $d011',
  // bank $4000-$7FFF, address $5C00 screen and $6000 bitmap
  ' lda $dd02',
  ' ora #$03',
  ' sta $dd02',
  ' lda $dd00',
  ' and #$fc',
  ' ora #$02',
  ' sta $dd00',
  ' lda #$00',
  ' sta $d015',
  ' lda #$78',
  ' sta $d018',
  ' lda #'+h2(bg),
  ' sta $d021',
  ' sta $d020',
  ' lda #$18',
  ' sta $d016',
  // Copy Color RAM separately. The 16-bit per-cell C1/C2 data are already
  // loaded at $5C00 and the packed bitmap already at $6000.
  ' ldx #$00',
  'color309copy',
  ' lda color309_data,x',
  ' sta $d800,x',
  ' lda color309_data+$100,x',
  ' sta $d900,x',
  ' lda color309_data+$200,x',
  ' sta $da00,x',
  ' lda color309_data+$300,x',
  ' sta $db00,x',
  ' inx',
  ' bne color309copy',
  ' lda #$3b',
  ' sta $d011',
  // Keep exact IRQ source anchors for existing SID TEST207/229 patch.
  ' lda #$01',
  ' sta $d01a',
  ' lda #$fa',
  ' sta $d012',
  ' lda #<irq',
  ' sta $fffe',
  ' lda #>irq',
  ' sta $ffff',
  ' cli',
  'main_loop',
  ' jmp main_loop',
  'irq',
  ' pha',
  ' txa',
  ' pha',
  ' tya',
  ' pha',
  ' lda #$01',
  ' sta $d019',
  ' pla',
  ' tay',
  ' pla',
  ' tax',
  ' pla',
  ' rti',
  // The SID ABI helper is spliced before the next anchor by makeSource207.
  // Do not place bitmap/screen data in the SID load region $1000-$2FFF.
  '*=$3000',
  'charset_bank1',
  '!byte $00',
  data && data.bg>=0 ? dataBlock309(colors,data.screen,data.bitmap) : ''
 ];
 return s.join('\n')+'\n';
}
function dataBlock309(colors,screen,bitmap){
 return [data('color309_data',0x3800,colors),
         data('screen309_data',0x5c00,screen),
         data('bitmap309_data',0x6000,bitmap)].join('\n');
}
w.RICO_TEST309_BITMAP_SID={version:'TEST309',buildSource:buildSource,
 source:'TEST282 exact Bitmap MC planes; original TEST207 SID IRQ',
 memory:{colorSource:0x3800,screen:0x5c00,bitmap:0x6000}};
})(window);
