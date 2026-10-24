/* TEST247 Group Scroll FAST: circular 4 directions / 1..8px,
   Ping Pong 1..7px; TEST246 Ping Pong 8px remains unchanged.
   ONDAS is never accepted. Offline pre-shifted fonts, direct screen speedcode.
   Even pixel steps: two screens + 4 fonts in VIC bank1.
   Odd pixel steps: even fonts in VIC bank1, odd fonts in VIC bank3.
   6502 RAM mapped under I/O ($01=$35) for bank3's $d000 font.
*/
(function(){
'use strict';
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function w16(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function emit(a,items){for(var j=0;j<items.length;j+=16)a.push('!byte '+Array.prototype.slice.call(items,j,j+16).map(h).join(','));}
function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
function floorMod(n,mod){return (n%mod+mod)%mod;}
function build(opt){
 var g=opt.group,m=opt.map,col=opt.colors,typ=g&&g.type||'';
 var circular=/^(left|right|up|down)$/.test(typ);
 var reflected=/^pingpong-(left|right|up|down)$/.test(typ);
 if(!g||(!circular&&!reflected)||g.pixels<1||g.pixels>8||!Number.isInteger(g.pixels))
   return {source:null,reason:'Modo no compatible; ONDAS permanece sin cambios'};
 if(reflected&&g.pixels===8)return {source:null,reason:'Ping Pong 8px pertenece a TEST246'};
 if(g.bank!==opt.activeBank)return {source:null,reason:'Banco activo distinto al banco del grupo'};
 var gw=g.w,gh=g.h,n=gw*gh,axis=/(?:left|right)$/.test(typ)?'x':'y';
 if(!Number.isInteger(gw)||!Number.isInteger(gh)||n<1||n>256||m.length!==1000||col.length!==1000)
   return {source:null,reason:'Dimensiones o Screen incompatibles'};
 var dim=(axis==='x'?gw:gh)*8,period=reflected?2*(dim-1):dim;
 var steps=period/gcd(period,g.pixels),odd=(g.pixels%2)===1;
 if(steps>256||steps<1)return {source:null,reason:'Más de 256 fases: necesita contador 16-bit'};
 var sign=/(?:left|up)$/.test(typ)?1:-1;
 var original=opt.activeBank===2?opt.bank2:opt.bank1;
 if(!original||original.length!==2048)return {source:null,reason:'Charset original incompleto'};
 var groupCodes=new Set(),coordinates={},protectedByIndex={};
 for(var x=0;x<gw;x++)for(var y=0;y<gh;y++){
   var id=g.cells[x][y],cellIndex=x*gh+y;
   if(!Number.isInteger(id)||id<0||id>255||groupCodes.has(id))
     return {source:null,reason:'Group Scroll necesita caracteres únicos y válidos'};
   groupCodes.add(id);coordinates[id]={x:x,y:y};
   protectedByIndex[id]=g.protection[cellIndex]===1;
 }
 var allUsed=new Set(m),blank=-1;
 if(reflected){
   for(var id=0;id<256;id++)if(!groupCodes.has(id)){
     var empty=true;for(var k=0;k<8;k++)if(original[id*8+k]){empty=false;break;}
     if(empty){blank=id;break;}
   }
   if(blank<0)for(var id=0;id<256;id++)if(!groupCodes.has(id)&&!allUsed.has(id)){blank=id;break;}
   if(blank<0)return {source:null,reason:'No hay código libre para el fondo recortado del Ping Pong'};
 }
 var groupCodesSorted=[...groupCodes].sort((a,b)=>a-b);
 var visible=[];
 for(var i=0;i<1000;i++)if(groupCodes.has(m[i]))visible.push({cell:i,code:m[i]});
 if(!visible.length)return {source:null,reason:'Ningún carácter seleccionado aparece en la pantalla'};
 var axisTiles=axis==='x'?gw:gh;
 var variants=[];
 var residues=odd?[0,2,4,6,1,3,5,7]:[0,2,4,6];
 for(var v=0;v<residues.length;v++){
   var shift=residues[v],font=new Uint8Array(original);
   if(reflected)font.fill(0,blank*8,blank*8+8);
   for(var x=0;x<gw;x++)for(var y=0;y<gh;y++){
     var code=g.cells[x][y];
     for(var yy=0;yy<8;yy++){
       var value=0;
       for(var xx=0;xx<8;xx++){
         var sx=x*8+xx+(axis==='x'?sign*shift:0);
         var sy=y*8+yy+(axis==='y'?sign*shift:0);
         if(circular){sx=floorMod(sx,gw*8);sy=floorMod(sy,gh*8);}
         if(!protectedByIndex[code]&&sx>=0&&sy>=0&&sx<gw*8&&sy<gh*8){
           var sourceId=g.cells[Math.floor(sx/8)][Math.floor(sy/8)];
           var bitmap=g.tiles[sourceId]&&g.tiles[sourceId].data&&g.tiles[sourceId].data[0];
           if(!bitmap||bitmap.length!==64)throw Error('TEST247: no hay pixels base de código '+sourceId);
           if(bitmap[(sy&7)*8+(sx&7)])value|=128>>xx;
         }
       }
       font[code*8+yy]=value;
     }
   }
   variants.push(font);
 }
 var codeTable={};
 for(var c of groupCodesSorted){
   var at=coordinates[c],mapped=[];
   for(var coarse=0;coarse<axisTiles;coarse++){
     var nx=at.x+(axis==='x'?sign*coarse:0);
     var ny=at.y+(axis==='y'?sign*coarse:0);
     if(circular){nx=floorMod(nx,gw);ny=floorMod(ny,gh);}
     mapped.push(protectedByIndex[c]?c:
       (nx>=0&&ny>=0&&nx<gw&&ny<gh?g.cells[nx][ny]:blank));
   }
   codeTable[c]=mapped;
 }
 var coarseSteps=[],remainderSteps=[];
 for(var t=1;t<=steps;t++){
   var phase=(t*g.pixels)%period,delta=reflected&&phase>dim-1?period-phase:phase;
   coarseSteps.push(Math.floor(delta/8));remainderSteps.push(Math.floor((delta&7)/2));
 }
 // The code budget is reserved before emitting any source.
 var tblStart=0x7800;
 var tblEnd=tblStart+groupCodesSorted.length*axisTiles+steps*2+16;
 var codeStart=Math.max(0x9000,(tblEnd+255)&0xff00);
 var codeEnd=codeStart+visible.length*12+128;
 if(tblEnd>0x9000||codeEnd>=0xc000)
   return {source:null,reason:'No alcanza RAM para remapear todos los códigos de pantalla',
      affected:visible.length,tableBytes:tblEnd-tblStart,codeEnd:codeEnd};
 var a=['; TEST247 DEMOSCENE GROUP SCROLL SCREEN-REMAPPING',
   '; Type '+typ+' '+g.pixels+'px/'+g.ticks+' ticks; '+(odd?'2 VIC banks odd/even':'VIC bank1 only'),
   '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
   '*=$2000',
   'start',' sei',' lda #$35',' sta $01',
   ' lda #$7f',' sta $dc0d',' sta $dd0d',' lda $dc0d',' lda $dd0d',
   ' lda #$00',' sta $d015',
   ' lda $dd00',' and #$fc',' ora #$02',' sta $dd00',
   ' lda #$14',' sta $d018',
   ' lda #$1b',' sta $d011',' lda #$08',' sta $d016',
   ' lda #'+h(opt.bg),' sta $d021',
   ' lda #'+h(opt.border),' sta $d020',
   ' ldx #$00','init247',
   ' lda $7000,x',' sta $4400,x',' sta '+(odd?'$c400,x':'$4800,x'),
   ' lda $7100,x',' sta $4500,x',' sta '+(odd?'$c500,x':'$4900,x'),
   ' lda $7200,x',' sta $4600,x',' sta '+(odd?'$c600,x':'$4a00,x'),
   ' lda $7300,x',' sta $4700,x',' sta '+(odd?'$c700,x':'$4b00,x'),
   ' lda $7400,x',' sta $d800,x',
   ' lda $7500,x',' sta $d900,x',
   ' lda $7600,x',' sta $da00,x',
   ' lda $7700,x',' sta $db00,x',
   ' inx',' bne init247',
   ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',
   ' lda #<irq247',' sta $fffe',' lda #>irq247',' sta $ffff',
   ' cli','main247',
   ' lda ready247',' bne main247',
   ' lda pending247',' beq main247',' dec pending247',
   ' ldx phase247',
   ' lda coarse247,x',' sta coarse_now247',
   ' lda residue247,x',' tay',
   ' inc phase247'];
 if(steps!==256)a.push(' lda phase247',' cmp #'+h(steps),' bne phase_ok247',
   ' lda #$00',' sta phase247','phase_ok247');
 a.push(' lda screen_active247',' bne stage_a247',
   ' lda fonts_b247,y',' sta d018_next247',
   ' jsr update_b247',' jmp staged247',
   'stage_a247',' lda fonts_a247,y',' sta d018_next247',
   ' jsr update_a247',
   'staged247',' lda #$01',' sta ready247',' jmp main247',
   'irq247',' pha',' txa',' pha',' tya',' pha',
   ' lda #$01',' sta $d019',
   ' lda ready247',' beq tick247',
   ' lda screen_active247',' eor #$01',' sta screen_active247');
 if(odd){
   a.push(' beq bank1_247',
     ' lda $dd00',' and #$fc',' ora #$00',' sta $dd00',' jmp update_d018247',
     'bank1_247',
     ' lda $dd00',' and #$fc',' ora #$02',' sta $dd00',
     'update_d018247');
 }
 a.push(' lda d018_next247',' sta $d018',
   ' lda #$00',' sta ready247',
   'tick247',' dec timer247',' bne irq_end247',
   ' lda #'+h(g.ticks),' sta timer247',
   ' lda pending247',' bne irq_end247',' inc pending247',
   'irq_end247',' pla',' tay',' pla',' tax',' pla',' rti',
   'phase247','!byte $00',
   'coarse_now247','!byte $00',
   'ready247','!byte $00',
   'pending247','!byte $00',
   'screen_active247','!byte $00',
   'd018_next247','!byte $14',
   'timer247','!byte '+h(g.ticks),
   'fonts_a247','!byte $14,$16,$18,$1a',
   'fonts_b247','!byte '+(odd?'$12,$18,$1a,$1c':'$24,$26,$28,$2a'));
 // Pack odd charset data below I/O in the PRG. The 6510 moves it to VIC
 // bank3 after $01=$35. Loading a linear PRG over $D000 would hit I/O.
 if(odd){
   var head=a.indexOf('*=$2000'),early=['*=$1000','odd_font_source247_0'];
   emit(early,variants[4]);
   early.push('*=$1800','odd_font_source247_1');
   emit(early,variants[5]);
   if(head<0)throw Error('TEST247: inicio de código ausente');
   a.splice.apply(a,[head,0].concat(early));
   var afterBank=a.indexOf(' sta $01');
   var bootstrap=[' ldx #$00','copy_odd_fonts247'];
   var sourceBanks=[0x1000,0x1800,0x2800,0x3000],
       targetBanks=[0xc800,0xe000,0xe800,0xf000];
   for(var fb=0;fb<4;fb++)for(var pg=0;pg<8;pg++){
     bootstrap.push(' lda '+w16(sourceBanks[fb]+pg*256)+',x',
       ' sta '+w16(targetBanks[fb]+pg*256)+',x');
   }
   bootstrap.push(' inx',' bne copy_odd_fonts247');
   if(afterBank<0)throw Error('TEST247: inicialización CPU ausente');
   a.splice.apply(a,[afterBank+1,0].concat(bootstrap));
   a.push('*=$2800','odd_font_source247_2');emit(a,variants[6]);
   a.push('*=$3000','odd_font_source247_3');emit(a,variants[7]);
 }
 var fontAddresses=odd?[0x5000,0x5800,0x6000,0x6800,0xc800,0xe000,0xe800,0xf000]:[0x5000,0x5800,0x6000,0x6800];
 for(var i=0;i<4;i++){
   a.push('*='+w16(fontAddresses[i]),'font247_'+i);emit(a,variants[i]);
 }
 a.push('*=$7000','source_screen247');emit(a,m);
 a.push('*=$7400','source_colors247');emit(a,col);
 a.push('*='+w16(tblStart),'map_tables247');
 for(var c of groupCodesSorted){a.push('map_code247_'+c);emit(a,codeTable[c]);}
 a.push('coarse247');emit(a,coarseSteps);
 a.push('residue247');emit(a,remainderSteps);
 a.push('*='+w16(codeStart),'update_a247',' ldx coarse_now247');
 for(var loc of visible)a.push(' lda map_code247_'+loc.code+',x',' sta '+w16(0x4400+loc.cell));
 a.push(' rts','update_b247',' ldx coarse_now247');
 for(var loc of visible)a.push(' lda map_code247_'+loc.code+',x',' sta '+w16((odd?0xc400:0x4800)+loc.cell));
 a.push(' rts');
 // Bank3 fonts are materialized by the startup copy: no PRG payload through $D000.
 return {source:a.join('\n')+'\n',reason:'TEST247-FAST-SCROLL',
   speed:g.pixels,direction:typ,positions:visible.length,phaseCount:steps,
   variantCount:fontAddresses.length,vicBanks:odd?2:1,estimatedCyclesPerPhase:visible.length*8+170,
   codeStart:codeStart,codeEnd:codeEnd,tableEnd:tblEnd};
}
window.RICO_TEST247_SCROLL_REMAP={compile:build};
})();