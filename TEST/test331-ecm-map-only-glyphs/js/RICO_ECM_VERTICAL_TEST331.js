/* TEST331: vertical 40xN ECM extension using the shared map-only glyph allocator.
 * Applied only to the existing TEST168 single-frame Up/Down engine. The
 * horizontal TEST331 and the legacy Bitmap pipeline remain untouched.
 */
(function(){
'use strict';
var engine=window.RICO_TEST168_PRG_LARGE_MAP,alloc=window.RICO_TEST331_ECM_ALLOCATOR;
if(!engine||!engine.buildSource||!alloc||typeof ToPRGAdv==='undefined'){console.error('[TEST331 VERTICAL ECM] missing dependency');return;}
var oldBuild=engine.buildSource,oldCreate=ToPRGAdv.prototype.createPRG,
    state={active:false,version:331,last:null,error:null,builds:0};
var TYPES={left:0,right:1,up:2,down:3,blink:4};
function color(v,msg){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('ECM vertical: '+msg+' fuera de paleta C64: '+v);return v;}
function missing(v,none){return v===undefined||v===null||v===false||v===-1||v===none;}
function hex(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function once(source,from,to,why){var at=source.indexOf(from);if(at<0||source.indexOf(from,at+from.length)>=0)
  throw Error('ECM vertical: ancla ASM '+why+' cambió o se duplicó.');return source.slice(0,at)+to+source.slice(at+from.length);}
function transform(d){
 var ed=d.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
 var ts=layer&&layer.getTileSet&&layer.getTileSet(),f=ed&&ed.graphic&&ed.graphic.frames&&ed.graphic.frames[0];
 if(!layer||!ts||!f)throw Error('ECM vertical: falta capa, charset o frame original.');
 var sm=layer.getScreenMode&&layer.getScreenMode(),already=sm==='c64ecm'||
   (typeof TextModeEditor!=='undefined'&&sm===TextModeEditor.Mode.C64ECM);
 var noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor,bgMain=color(layer.getBackgroundColor(0),'fondo principal');
 var regs=[],hist=Object.create(null),ids=[],bgSlots=[],counts=Object.create(null);
 var rawMap=Array.from(d.map),bank2=ts.getDocRecord&&ts.getDocRecord();
 bank2=bank2&&bank2.data&&bank2.data.ricoCharsetBank2&&bank2.data.ricoCharsetBank2.tileData;
 if(already)for(var i=0;i<4;i++){
  var value=layer.getC64ECMColor?layer.getC64ECMColor(i,0):i?bgMain:bgMain;
  regs.push(color(missing(value,noColor)?bgMain:value,'fondo ECM '+i));
 }
 for(var y=0;y<d.height;y++)for(var x=0;x<40;x++){
  var c=layer.getCell({x:x,y:y,frame:0})||{},value=Number(c.t);
  if(!Number.isInteger(value)||value<0||value>255)throw Error('ECM vertical: tile incorrecto en X'+x+',Y'+y);
  var id=already?(value&63):value;
  var bg=already?(missing(c.bc,noColor)?value>>6:Number(c.bc)):
      (missing(c.bc,noColor)?bgMain:color(c.bc,'fondo en '+x+','+y));
  if(already&&(!Number.isInteger(bg)||bg<0||bg>3))throw Error('ECM vertical: slot de fondo fuera de 0..3.');
  ids.push(id);bgSlots.push(bg);counts[id]=(counts[id]||0)+1;
  if(!already)hist[bg]=(hist[bg]||0)+1;
 }
 if(ids.length!==rawMap.length)throw Error('ECM vertical: mapa original tiene geometría incompatible.');
 var group=d.anim175&&d.anim175.group||null,groupUsed=Object.create(null),indUsed=Object.create(null);
 if(group&&group.codes)Object.keys(group.codes).forEach(function(k){var id=Number(k);groupUsed[already?id&63:id]=true;});
 var banks=[ts.tileData,bank2],activeIDs=Object.keys(counts);
 for(var bank=0;bank<2;bank++)if(banks[bank])for(var k=0;k<activeIDs.length;k++){
  var id=Number(activeIDs[k]),props=banks[bank][id]&&banks[bank][id].props||{};
  if(props.animated)indUsed[id]=true;
 }
 var allocation=alloc.allocate({counts:counts,bank1:d.bank1,bank2:d.bank2,groupCodes:groupUsed,animatedCodes:indUsed});
 if(!already){
  var selected=Object.keys(hist).map(Number).sort(function(a,b){return hist[b]-hist[a]||a-b});
  if(selected.length>4)throw Error('ECM vertical: '+selected.length+' fondos distintos; máximo 4 en VIC-II.');
  regs=selected.includes(bgMain)?[bgMain].concat(selected.filter(function(c){return c!==bgMain})):selected.slice();
  if(!regs.length)regs=[bgMain];
  while(regs.length<4)regs.push(regs[regs.length-1]);
 }
 var bgToSlot=Object.create(null);
 if(!already)for(var r=0;r<4;r++)if(bgToSlot[regs[r]]===undefined)bgToSlot[regs[r]]=r;
 var map=[];
 for(var i=0;i<ids.length;i++){
  var phys=allocation.physicalByCode[ids[i]],slot=already?bgSlots[i]:bgToSlot[bgSlots[i]];
  if(phys===undefined||slot===undefined)throw Error('ECM vertical: sin índice físico para tile del mapa.');
  map.push(phys|(slot<<6));
 }
 // Original TEST168 software computes blank/no-color by 8-bit screen code.
 // Mirror each of the 64 physical patterns through four 64-slot aliases,
 // while VIC-II hardware still reads only the first 64 physical glyphs.
 function mirrored(src){
  var out=new Uint8Array(2048);
  for(var quarter=0;quarter<4;quarter++)
   out.set(src.subarray(0,512),quarter*512);
  return out;
 }
 var records=[],mapIdx=allocation.physicalByCode;
 for(var bank=1;bank<=2;bank++){
  var tileBank=banks[bank-1];if(!tileBank)continue;
  for(var k=0;k<activeIDs.length;k++){
   var oldId=Number(activeIDs[k]),props=tileBank[oldId]&&tileBank[oldId].props||{},type=props.animated;
   if(type===undefined||type===false||type===null||type==='')continue;
   if(!Object.prototype.hasOwnProperty.call(TYPES,type))throw Error('ECM vertical: movimiento individual '+type+' sin motor C64.');
   var ticks=Number(props.ticksPerFrame);
   if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw Error('ECM vertical: Ticks/Frame fuera de 1..255 para tile '+oldId);
   var target=mapIdx[oldId];
   if(group&&group.bank===bank&&groupUsed[oldId])throw Error('ECM vertical: el mismo glifo '+oldId+' es individual y grupal; falta compositor compartido.');
   records.push({bank:bank,code:target,ticks:ticks,type:TYPES[type],address:(bank===2?0x3800:0x3000)+target*8});
  }
 }
 var newGroup=group;
 if(group&&group.addresses){
  var addresses=[],codes=Object.create(null);
  for(var x=0;x<group.w;x++)for(var y=0;y<group.h;y++){
   var original=group.cells[x][y],id=already?original&63:original,phys=mapIdx[id];
   if(phys===undefined){addresses.push(allocation.sinkAddress);continue;}
   addresses.push((group.bank===2?0x3800:0x3000)+phys*8);codes[phys]=true;
  }
  newGroup=Object.assign({},group,{addresses:addresses,codes:codes});
 }
 d.bank1=mirrored(allocation.bank1);d.bank2=mirrored(allocation.bank2);d.map=map;d.bg=regs[0];
 var active=d.anim175||{switchTicks:0,records:[],group:null};
 d.anim175=Object.assign({},active,{records:records,group:newGroup});
 d.ecmVertical331={bg:regs,stats:{mapIndices:allocation.sourceIndexCount,
   usedGlyphs:allocation.uniqueGlyphs,mergedAliases:allocation.mergedAliases,
   invisibleGroupSources:allocation.unpaintedGroupSourceCount,individual:records.length,
   group:!!group,height:d.height,backgrounds:regs,sourceMode:sm}};
 state.last=d.ecmVertical331.stats;
 return d;
}
engine.buildSource=function(d){
 if(!state.active||!d||!d.editor||d.width!==40||d.height<=25||
    (d.type!=='up'&&d.type!=='down'))return oldBuild(d);
 var packed=transform(d),asm=oldBuild(packed);
 var from=' ora #$'+(d.window.height<=24?'10':'18'),to=' ora #$'+(d.window.height<=24?'50':'58');
 asm=once(asm,from,to,'$D011 al aplicar scroll vertical');
 asm=once(asm,' sta $d021\n',' sta $d021\n'+
   ' lda #'+hex(packed.ecmVertical331.bg[1])+'\n sta $d022\n'+
   ' lda #'+hex(packed.ecmVertical331.bg[2])+'\n sta $d023\n'+
   ' lda #'+hex(packed.ecmVertical331.bg[3])+'\n sta $d024\n','cuatro fondos');
 state.builds++;
 return asm;
};
ToPRGAdv.prototype.createPRG=function(args){
 var editor=this.editor,g=editor&&editor.graphic,layer=editor&&editor.layers&&editor.layers.getSelectedLayerObject&&editor.layers.getSelectedLayerObject(),
 mode=layer&&layer.getScreenMode&&layer.getScreenMode(),f=g&&g.frames&&g.frames[0],
 type=f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type,geometry=g&&g.getGridHeight&&g.getGridHeight(),
 active=(args&&args.mode==='extended'||mode==='c64ecm')&&
   (type==='up'||type==='down')&&geometry>25,
 previousActive=state.active;
 if(active){state.active=true;state.error=null;}
 try{return oldCreate.apply(this,arguments);}catch(e){if(active)state.error=String(e);throw e;}
 finally{state.active=previousActive;}
};
window.RICO_TEST331_ECM_VERTICAL=state;
console.log('[TEST331] ECM vertical 40xN map-only allocator installed.');
})();
