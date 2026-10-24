/* TEST246 - DemoScene style four pre-shifted fonts plus screen-code remapping.
 * For standalone Group Ping Pong 8px/tick, update screen characters rather
 * than recomposing the entire 2KB font each tick. Two screen buffers:
 * VIC bank1 screen buffers $4400/$4800 and 4 fonts $5000/$5800/$6000/$6800.
 * ROM-safe bank1 avoids character ROM mirroring in VIC banks 0 and 2.
 * Code at $2000 + generated screen renderer at >=$9000.
 * No changes to ONDAS, Map Scroll or the original editor document.
 */
(function(){
'use strict';
function hex8(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function hex16(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function writeBytes(a,b){
 for(var i=0;i<b.length;i+=16)a.push('!byte '+Array.prototype.slice.call(b,i,i+16).map(hex8).join(','));
}
function gcd(a,b){while(b){var x=a%b;a=b;b=x;}return a;}
function compile(opt){
 var g=opt.group,original=opt.map,color=opt.colors;
 if(!g||g.pixels!==8||!/^pingpong-(left|right|up|down)$/.test(g.type))
   return {source:null,reason:'No es Ping Pong 8px'};
 if(g.bank!==opt.activeBank)return {source:null,reason:'Grupo y banco activo diferentes'};
 var width=g.w,height=g.h,count=width*height;
 if(count<=0||count>256||original.length!==1000||color.length!==1000)
   return {source:null,reason:'Formato de pantalla no compatible'};
 var sideways=/-(left|right)$/.test(g.type),sign=/-(left|up)$/.test(g.type)?1:-1;
 var tiles=sideways?width:height,steps=2*(tiles*8-1)/gcd(2*(tiles*8-1),8);
 if(steps>255)return {source:null,reason:'Más de 255 fases'};
 var groupCoord={},sel=new Set(),screenIds=new Set(original);
 for(var x=0;x<width;x++)for(var y=0;y<height;y++){
   var c=g.cells[x][y];
   if(groupCoord[c])return {source:null,reason:'Índices de grupo duplicados'};
   groupCoord[c]={x:x,y:y,protected:g.protection[x*height+y]===1};sel.add(c);
 }
 var baseline=opt.activeBank===2?opt.bank2:opt.bank1;
 if(!baseline||baseline.length!==2048)return {source:null,reason:'Charset base ausente'};
 var blank=-1;
 for(var i=0;i<256;i++){
  if(sel.has(i))continue;
  var allZero=true;for(var row=0;row<8;row++)if(baseline[i*8+row]){allZero=false;break;}
  if(allZero){blank=i;break;}
 }
 if(blank<0)for(var i=0;i<256;i++)if(!sel.has(i)&&!screenIds.has(i)){blank=i;break;}
 if(blank<0)return {source:null,reason:'No hay código de glyph vacío disponible; conservar motor anterior'};
 // Precompute the pixels for each character index and 8px phase remainder.
 var variants=[];
 for(var rem of [0,2,4,6]){
   var font=new Uint8Array(baseline);
   font.fill(0,blank*8,blank*8+8);
   for(var x=0;x<width;x++)for(var y=0;y<height;y++){
     var id=g.cells[x][y],ci=x*height+y;
     for(var py=0;py<8;py++){
       var v=0;
       for(var px=0;px<8;px++){
         var sx=x*8+px+(sideways?sign*rem:0);
         var sy=y*8+py+(!sideways?sign*rem:0);
         if(!g.protection[ci]&&sx>=0&&sy>=0&&sx<width*8&&sy<height*8){
           var srcId=g.cells[Math.floor(sx/8)][Math.floor(sy/8)];
           var bitmap=g.tiles[srcId]&&g.tiles[srcId].data&&g.tiles[srcId].data[0];
           if(!bitmap||bitmap.length!==64)throw new Error('TEST246 bitmap faltante '+srcId);
           if(bitmap[(sy&7)*8+(sx&7)])v|=128>>px;
         }
       }
       font[id*8+py]=v;
     }
   }
   variants.push(font);
 }
 // One mapping table per selected code, indexed by coarse tile movement.
 var codes=[...sel].sort((a,b)=>a-b),positions=[];
 for(var off=0;off<1000;off++)if(sel.has(original[off]))positions.push({off:off,code:original[off]});
 if(!positions.length)return {source:null,reason:'No hay caracteres del grupo visibles en pantalla'};
 var tables={};
 for(var code of codes){
   var at=groupCoord[code],values=[];
   for(var k=0;k<tiles;k++){
     var nx=at.x+(sideways?sign*k:0),ny=at.y+(!sideways?sign*k:0);
     values.push(at.protected?code:(nx>=0&&ny>=0&&nx<width&&ny<height?g.cells[nx][ny]:blank));
   }
   tables[code]=values;
 }
 var phasesQ=[],phasesRem=[];
 for(var j=1;j<=steps;j++){
   var period=2*(tiles*8-1),phase=(j*8)%period,disp=phase>tiles*8-1?period-phase:phase;
   phasesQ.push(Math.floor(disp/8));
   phasesRem.push((disp&7)/2); // 0,1,2,3 -> remainders 0,2,4,6
 }
 var tableStart=0x7800,tableEnd=tableStart+tiles*codes.length+steps*2+8;
 var speedStart=Math.max(0x9000,(tableEnd+255)&0xff00);
 var speedEnd=speedStart+positions.length*12+64;
 if(tableEnd>0x9000||speedEnd>=0xd000)
   return {source:null,reason:'El remapeo excede RAM segura',positions:positions.length,tableBytes:tableEnd-tableStart,speedEnd:speedEnd};
 var a=['; TEST246 DEMOSCENE SCREEN REMAP - 8px group pingpong',
   '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
   '*=$2000',
   'start',' sei',' lda #$35',' sta $01',
   ' lda #$7f',' sta $dc0d',' sta $dd0d',' lda $dc0d',' lda $dd0d',
   ' lda #$00',' sta $d015',
   ' lda $dd00',' and #$fc',' ora #$02',' sta $dd00',
   ' lda #$14',' sta $d018',
   ' lda #$1b',' sta $d011',' lda #$08',' sta $d016',
   ' lda #'+hex8(opt.bg),' sta $d021',
   ' lda #'+hex8(opt.border),' sta $d020',
   ' ldx #$00','init246',
   ' lda $7000,x',' sta $4400,x',' sta $4800,x',
   ' lda $7100,x',' sta $4500,x',' sta $4900,x',
   ' lda $7200,x',' sta $4600,x',' sta $4a00,x',
   ' lda $7300,x',' sta $4700,x',' sta $4b00,x',
   ' lda $7400,x',' sta $d800,x',
   ' lda $7500,x',' sta $d900,x',
   ' lda $7600,x',' sta $da00,x',
   ' lda $7700,x',' sta $db00,x',
   ' inx',' bne init246',
   ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',
   ' lda #<irq246',' sta $fffe',' lda #>irq246',' sta $ffff',' cli',
   'main246',
   ' lda ready246',' bne main246',
   ' lda pending246',' beq main246',' dec pending246',
   ' ldx phase246',
   ' lda qtable246,x',' sta coarse246',
   ' lda rtable246,x',' tay',
   ' inc phase246',' lda phase246',' cmp #'+hex8(steps),
   ' bne phase_ok246',' lda #$00',' sta phase246','phase_ok246',
   ' lda current246',' bne stage_a246',
   ' lda font_b246,y',' sta next_d018246',
   ' jsr update_b246',' jmp staged246',
   'stage_a246',
   ' lda font_a246,y',' sta next_d018246',
   ' jsr update_a246',
   'staged246',
   ' lda #$01',' sta ready246',' jmp main246',
   'irq246',' pha',' txa',' pha',' tya',' pha',' lda #$01',' sta $d019',
   ' lda ready246',' beq clock246',
   ' lda current246',' eor #$01',' sta current246',
   ' beq show_a246',
   ' lda next_d018246',' sta $d018',' jmp flipped246',
   'show_a246',
   ' lda next_d018246',' sta $d018',
   'flipped246',' lda #$00',' sta ready246',
   'clock246',' dec timer246',' bne end_irq246',
   ' lda #'+hex8(g.ticks),' sta timer246',
   ' lda pending246',' bne end_irq246',
   ' inc pending246',
   'end_irq246',' pla',' tay',' pla',' tax',' pla',' rti',
   'phase246','!byte $00','pending246','!byte $00','ready246','!byte $00',
   'current246','!byte $00','next_d018246','!byte $14',
   'coarse246','!byte $00','timer246','!byte '+hex8(g.ticks),
   'font_a246','!byte $14,$16,$18,$1a',
   'font_b246','!byte $24,$26,$28,$2a'];
 // Fonts generated entirely offline.
 var locations=[0x5000,0x5800,0x6000,0x6800];
 for(var i=0;i<4;i++){a.push('*='+hex16(locations[i]),'font246_'+i);writeBytes(a,variants[i]);}
 a.push('*=$7000','source_screen246');writeBytes(a,original);
 a.push('*=$7400','source_colors246');writeBytes(a,color);
 a.push('*='+hex16(tableStart),'mapping_start246');
 for(var code of codes){a.push('map_code246_'+code);writeBytes(a,tables[code]);}
 a.push('qtable246');writeBytes(a,phasesQ);
 a.push('rtable246');writeBytes(a,phasesRem);
 a.push('*='+hex16(speedStart),'update_a246',' ldx coarse246');
 for(var p of positions)a.push(' lda map_code246_'+p.code+',x',' sta '+hex16(0x4400+p.off));
 a.push(' rts','update_b246',' ldx coarse246');
 for(var p of positions)a.push(' lda map_code246_'+p.code+',x',' sta '+hex16(0x4800+p.off));
 a.push(' rts');
 return {source:a.join('\n')+'\n',reason:'screen-remap-4-fonts',
   positions:positions.length,tableBytes:tableEnd-tableStart,speedcodeBytes:12*positions.length,
   phaseCount:steps,estimatedCyclesPerFrame:positions.length*8+150,blankCode:blank,
   fontLocations:locations,codeBase:speedStart,codeEnd:speedEnd};
}
window.RICO_TEST246_SCREEN_REMAP={compile:compile};
})();