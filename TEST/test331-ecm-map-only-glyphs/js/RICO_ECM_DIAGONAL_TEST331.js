/* RICO TEST331 — Diagonal ECM with shared map-used-only charset allocator
 * Supports one frame, 40x25 Window, Left/Right+Up/Down diagonal directions.
 * Uses TEST196 map source and TEST175 native individual kernel. No user-data edits.
 */
(function(){
'use strict';
var D=window.RICO_TEST196_DIAGONAL,L=window.RICO_TEST168_PRG_LARGE_MAP,
    A=window.RICO_TEST331_ECM_ALLOCATOR;
if(!D||!D.build||!L||!L.buildSource||!A||typeof ToPRGAdv==='undefined'){console.error('[ECM DIAGONAL] dependencies missing');return;}
var oldBuild=D.build,oldCreate=ToPRGAdv.prototype.createPRG,
state={active:false,exporter:null,last:null,error:null,builds:0};
var TYPE={left:0,right:1,up:2,down:3,blink:4};
function valid(v){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('ECM diagonal: color C64 fuera de 0..15: '+v);return v;}
function unset(v,none){return v===undefined||v===null||v===false||v===-1||v===none;}
function hx(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function replacement(s,a,b,label){var k=s.indexOf(a);if(k<0||s.indexOf(a,k+a.length)>=0)throw Error('ECM diagonal: ancla ASM '+label+' no encontrada o duplicada.');return s.slice(0,k)+b+s.slice(k+a.length);}
function nativeKernel(d){
 var map=new Uint8Array(40*26),colors=new Uint8Array(40*26);colors.fill(14);
 var mock={width:40,height:26,type:'up',typeCode:1,ticks:1,pixels:1,duration:12,
  bg:d.bg,border:d.border,bank:d.bank,initialRow:0,
  window:{x:0,y:0,width:40,height:25},area:{x:0,y:0,width:40,height:26},
  map:map,colors:colors,bank1:d.bank1,bank2:d.bank2,
  anim175:{switchTicks:0,records:d.ecmDiag331Records,group:null}};
 var asm=L.buildSource(mock),start=asm.indexOf('\nanim175_tick\n'),end=asm.indexOf('\n*=$3000\n',start);
 if(start<0||end<start)throw Error('ECM diagonal: no se pudo recuperar kernel TEST175 de animación individual.');
 return asm.slice(start+1,end);
}
function transform(d,self){
 var ed=self.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
  ts=layer&&layer.getTileSet&&layer.getTileSet(),frame=ed&&ed.graphic&&ed.graphic.frames&&ed.graphic.frames[0];
 if(!layer||!ts||!frame)throw Error('ECM diagonal: falta pantalla o charset.');
 var sm=layer.getScreenMode&&layer.getScreenMode(),already=sm==='c64ecm'||
  (typeof TextModeEditor!=='undefined'&&sm===TextModeEditor.Mode.C64ECM),
  noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor;
 var rect=frame.ricoScrollAreaV1||{x:0,y:0,width:d.areaWidth,height:d.areaHeight};
 var main=valid(layer.getBackgroundColor(0)),slots=[],orig=[],hist=Object.create(null),counts=Object.create(null),regs=[];
 if(already)for(var i=0;i<4;i++){
  var val=layer.getC64ECMColor?layer.getC64ECMColor(i,0):main;regs.push(valid(unset(val,noColor)?main:val));
 }
 // TEST196 sometimes duplicates every map row to avoid per-character wrapping.
 var activeCodes=[],activeBG=[];
 for(var y=0;y<d.areaHeight;y++){
  var charRow=[],bgRow=[];
  for(var x=0;x<d.areaWidth;x++){
   var c=layer.getCell({x:rect.x+x,y:rect.y+y,frame:0})||{},v=Number(c.t);
   if(!Number.isInteger(v)||v<0||v>255)throw Error('ECM diagonal: índice tile inválido en X'+x+',Y'+y);
   var g=already?v&63:v,bg=already?(unset(c.bc,noColor)?v>>6:Number(c.bc)):
     (unset(c.bc,noColor)?main:valid(c.bc));
   if(already&&(!Number.isInteger(bg)||bg<0||bg>3))throw Error('ECM diagonal: selector BG fuera 0..3.');
   charRow.push(g);bgRow.push(bg);counts[g]=(counts[g]||0)+1;
   if(!already)hist[bg]=(hist[bg]||0)+1;
  }
  activeCodes.push.apply(activeCodes,charRow);activeBG.push.apply(activeBG,bgRow);
  if(d.fastRows){activeCodes.push.apply(activeCodes,charRow);activeBG.push.apply(activeBG,bgRow);}
 }
 if(activeCodes.length!==d.map.length)throw Error('ECM diagonal: los datos del mapa no coinciden con la geometría duplicada de TEST196.');
 var store=ts.getDocRecord().data||{},groupsCfg=store.ricoGroupAnimationsV1||{},configured=[];
 for(var gb=1;gb<=2;gb++)(groupsCfg['bank'+gb]||[]).forEach(function(cfg){if(cfg&&cfg.type)configured.push(cfg.type);});
 if(configured.includes('switch-bank'))throw Error('ECM diagonal: Switch Bank sin integración diagonal; no se omite el efecto.');
 if(configured.length>1)throw Error('ECM diagonal: varios grupos requieren planificador multigrupo; no se elimina ninguno.');
 if(configured.length&&!d.group)throw Error('ECM diagonal: efecto grupal '+configured[0]+' no reconocido en esta ruta.');
 var bs=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData],
  groups=Object.create(null),anim=Object.create(null);
 if(d.group&&d.group.codes)Object.keys(d.group.codes).forEach(function(c){var id=Number(c);groups[already?id&63:id]=true;});
 var used=Object.keys(counts);
 for(var bank=0;bank<2;bank++)if(bs[bank])for(var k=0;k<used.length;k++){
  var id=Number(used[k]),props=bs[bank][id]&&bs[bank][id].props||{};
  if(props.animated)anim[id]=true;
 }
 var a=A.allocate({counts:counts,bank1:d.bank1,bank2:d.bank2,groupCodes:groups,animatedCodes:anim});
 if(!already){
  var bgList=Object.keys(hist).map(Number).sort(function(a,b){return hist[b]-hist[a]||a-b});
  if(bgList.length>4)throw Error('ECM diagonal: '+bgList.length+' fondos efectivos; máximo 4.');
  regs=bgList.includes(main)?[main].concat(bgList.filter(function(c){return c!==main;})):bgList.slice();
  if(!regs.length)regs=[main];while(regs.length<4)regs.push(regs[regs.length-1]);
 }
 var slotMap=Object.create(null);
 if(!already)for(var i=0;i<4;i++)if(slotMap[regs[i]]===undefined)slotMap[regs[i]]=i;
 var finalMap=[];
 for(var i=0;i<activeCodes.length;i++){
  var physical=a.physicalByCode[activeCodes[i]],slot=already?activeBG[i]:slotMap[activeBG[i]];
  if(physical===undefined||slot===undefined)throw Error('ECM diagonal: falta asignación de fondo o glifo.');
  finalMap.push(physical|(slot<<6));
 }
 var group=d.group;
 if(group){
  var targets=[],codes=Object.create(null);
  for(var x=0;x<group.w;x++)for(var y=0;y<group.h;y++){
   var original=group.cells[x][y],id=already?original&63:original,phys=a.physicalByCode[id];
   if(phys===undefined){targets.push(a.sinkAddress);continue;}
   targets.push((group.bank===2?0x3800:0x3000)+phys*8);codes[phys]=true;
  }
  group=Object.assign({},group,{addresses:targets,codes:codes});
 }
 var records=[];
 for(var bank=1;bank<=2;bank++){
  var tileBank=bs[bank-1];if(!tileBank)continue;
  for(var k=0;k<used.length;k++){
   var old=Number(used[k]),p=tileBank[old]&&tileBank[old].props||{},type=p.animated;
   if(type===undefined||type===null||type===false||type==='')continue;
   if(!Object.prototype.hasOwnProperty.call(TYPE,type))throw Error('ECM diagonal: efecto individual '+type+' pendiente.');
   var ticks=Number(p.ticksPerFrame);
   if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw Error('ECM diagonal: Ticks individuales fuera de 1..255 para '+old);
   if(group&&group.bank===bank&&groups[old])throw Error('ECM diagonal: glyph '+old+' es individual y grupal, necesita compositor.');
   var physical=a.physicalByCode[old];
   records.push({bank:bank,code:physical,ticks:ticks,type:TYPE[type],address:(bank===2?0x3800:0x3000)+physical*8});
  }
 }
 d.map=finalMap;d.bank1=a.bank1;d.bank2=a.bank2;d.group=group;d.bg=regs[0];
 d.ecmDiag331BG=regs;d.ecmDiag331Records=records;
 state.last={mapIndices:a.sourceIndexCount,usedGlyphs:a.uniqueGlyphs,
  mergedAliases:a.mergedAliases,invisibleGroupSources:a.unpaintedGroupSourceCount,
  backgrounds:regs,individual:records.length,group:!!group,direction:d.direction,
  area:[d.areaWidth,d.areaHeight],doubleRows:d.fastRows,nonDestructive:true};
 return d;
}
D.build=function(d){
 if(!state.active||!state.exporter)return oldBuild(d);
 try{
 var data=transform(d,state.exporter),asm=oldBuild(data);
 var from=' lda fine_y\n and #$07\n ora #'+(data.edgeMask?'$10':'$18')+'\n sta $d011';
 var to=' lda fine_y\n and #$07\n ora #'+(data.edgeMask?'$50':'$58')+'\n sta $d011';
 asm=replacement(asm,from,to,'bit ECM de D011 durante diagonal');
 asm=replacement(asm,' sta $d021\n',' sta $d021\n lda #'+hx(data.ecmDiag331BG[1])+
  '\n sta $d022\n lda #'+hx(data.ecmDiag331BG[2])+'\n sta $d023\n lda #'+hx(data.ecmDiag331BG[3])+'\n sta $d024\n',
  'registros de fondo');
 if(data.ecmDiag331Records.length){
  var donor=nativeKernel(data);
  asm=replacement(asm,'charset_bits=$26\n','charset_bits=$26\n'+
   'anim175_ptr_lo=$30\nanim175_ptr_hi=$31\nanim175_dest_lo=$32\nanim175_dest_hi=$33\nanim175_temp=$34\n',
   'punteros individuales');
  asm=replacement(asm,'main_group\n lda group182_pending\n beq main_loop\n jsr group182_step\n jmp main_loop',
   'main_group\n lda group182_pending\n beq diag331_individual\n jsr group182_step\n jmp main_loop\n'+
   'diag331_individual\n lda anim175_pending\n beq main_loop\n jsr anim175_tick\n jmp main_loop',
   'turno de caracteres individuales');
  asm=replacement(asm,'irq_group\n jsr group182_irq_tick\n pla\n tay\n pla\n tax\n pla\n rti',
   'irq_group\n jsr group182_irq_tick\n lda anim175_pending\n cmp #$ff\n beq diag331_pending_max\n inc anim175_pending\n'+
   'diag331_pending_max\n pla\n tay\n pla\n tax\n pla\n rti',
   'tick de caracteres');
  asm=replacement(asm,'\n*=$3000\ncharset_bank1','\n'+donor+'\n*=$3000\ncharset_bank1',
   'kernel nativo TEST175');
 }
 state.builds++;return asm;
 }catch(err){state.error=String(err&&err.message||err);
  console.error('[TEST331 DIAGONAL ECM] '+state.error);throw err;}
};
ToPRGAdv.prototype.createPRG=function(args){
 var e=this.editor,g=e&&e.graphic,fs=g&&g.frames||[],layer=e&&e.layers&&e.layers.getSelectedLayerObject&&e.layers.getSelectedLayerObject(),
  mode=layer&&layer.getScreenMode&&layer.getScreenMode(),type=fs[0]&&fs[0].ricoMapScrollV1&&fs[0].ricoMapScrollV1.type,
  isDiagonal=!!(type&&type.indexOf('diag-')===0),
  requested=args&&args.mode==='extended'||mode==='c64ecm',
  active=isDiagonal&&requested&&fs.length===1,prevActive=state.active,prevExport=state.exporter;
 if(isDiagonal&&requested&&fs.length!==1){
  state.error='ECM diagonal multiframe requiere su propio planificador. No se ignoran las demás frames.';
  if(typeof window.alert==='function')window.alert('Error PRG: '+state.error);
  return false;
 }
 if(active){state.active=true;state.exporter=this;state.error=null;}
 try{return oldCreate.apply(this,arguments);}catch(err){if(active)state.error=String(err);throw err;}
 finally{state.active=prevActive;state.exporter=prevExport;}
};
window.RICO_TEST331_ECM_DIAGONAL=state;
console.log('[RICO TEST331] Diagonal ECM shared 64-glyph packing and native individual scheduler loaded.');
})();
