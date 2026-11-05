/* TEST328 — Non-destructive Extended Background Color PRG remap for
 * one-frame 40x25-window wide horizontal Map Scroll (TEST327).
 * Reads selected editor cells, builds a PRIVATE 64-glyph export charset,
 * remaps screen codes to (bgSlot << 6) | glyphSlot, and retains native
 * individual/group animation addresses after compaction.
 * Never calls setMode and never writes to editor JSON, TileSet or cells.
 */
(function(){
'use strict';
var H=window.RICO_TEST186_HORIZONTAL;
if(!H||typeof ToPRGAdv==='undefined'||!H.collect||!H.build){
  console.error('[TEST328 ECM] TEST327 horizontal exporter missing');return;
}
var previousCollect=H.collect,previousBuild=H.build;
var previousCreate=ToPRGAdv.prototype.createPRG;
var TYPES={left:0,right:1,up:2,down:3,blink:4};
var state={version:328,active:null,exporter:null,horizontal:false,last:null,lastError:null,exportCount:0};
function number(v){return Number(v);}
function ensureColor(v,label){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw new Error('ECM: '+label+' fuera de paleta C64 0–15 ('+v+').');return v;}
function noBG(v,sentinel){return v===undefined||v===null||v===false||v===sentinel||v===-1;}
function hex(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function substituteOnce(str,needle,repl,label){
  var index=str.indexOf(needle);
  if(index<0||str.indexOf(needle,index+needle.length)!==-1)throw new Error('ECM: ancla ASM '+label+' ausente o duplicada. PRG cancelado.');
  return str.slice(0,index)+repl+str.slice(index+needle.length);
}
function pack(self,d,opts){
  var ed=self.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
      ts=layer&&layer.getTileSet&&layer.getTileSet(),g=ed&&ed.graphic,
      f=g&&g.frames&&g.frames[0],screenMode=layer&&layer.getScreenMode&&layer.getScreenMode();
  if(!layer||!ts||!f)throw new Error('ECM: no hay capa, tileset o frame C64.');
  var isECM=screenMode==='c64ecm'||(typeof TextModeEditor!=='undefined'&&screenMode===TextModeEditor.Mode.C64ECM);
  var x0=(f.ricoScrollAreaV1||{}).x||0,y0=(f.ricoWindowDimensionV1||{}).y||0;
  var width=d.areaWidth,tiles=ts.tileData,bank2Record=ts.getDocRecord&&ts.getDocRecord(),
      bank2=bank2Record&&bank2Record.data&&bank2Record.data.ricoCharsetBank2&&bank2Record.data.ricoCharsetBank2.tileData,
      noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor;
  if(!Number.isInteger(width)||width<40||width>245||d.map.length!==width*50)throw new Error('ECM: Screen/Scroll Area horizontal no compatible con TEST328.');
  if(!tiles||tiles.length<256||!d.bank1||d.bank1.length!==2048||!d.bank2||d.bank2.length!==2048)throw new Error('ECM: datos de charset de 256 tiles incompletos.');
  var counts=Object.create(null),backgrounds=Object.create(null),pixels=[],origCodes=[],sourceBg=[],physicalCodes=[];
  var defaultBG=ensureColor(layer.getBackgroundColor?layer.getBackgroundColor(0):14,'fondo principal');
  var bgRegs=[];
  if(isECM){
    for(var reg=0;reg<4;reg++)bgRegs.push(ensureColor(layer.getC64ECMColor?layer.getC64ECMColor(reg,0):(reg?defaultBG:defaultBG),'registro de fondo '+reg));
  }
  for(var y=0;y<25;y++){
    for(var x=0;x<width;x++){
      var cell=layer.getCell({x:x0+x,y:y0+y,frame:0})||{};
      var code=Number(cell.t);
      if(!Number.isInteger(code)||code<0||code>255)throw new Error('ECM: índice de carácter inválido en X'+x+' Y'+y+': '+code);
      var sourceChar=isECM?(code&63):code;
      var slotOrColor;
      if(isECM){
        slotOrColor=noBG(cell.bc,noColor)?(code>>6):Number(cell.bc);
        if(!Number.isInteger(slotOrColor)||slotOrColor<0||slotOrColor>3)throw new Error('ECM: el selector de fondo de X'+x+' Y'+y+' debe ser 0–3; obtenido '+slotOrColor);
      }else{
        slotOrColor=noBG(cell.bc,noColor)?defaultBG:ensureColor(cell.bc,'fondo de X'+x+' Y'+y);
        backgrounds[slotOrColor]=(backgrounds[slotOrColor]||0)+1;
      }
      origCodes.push(sourceChar);sourceBg.push(slotOrColor);
      counts[sourceChar]=(counts[sourceChar]||0)+1;
    }
  }
  // TEST331: only codes used by the full horizontal map occupy physical ECM glyph slots.
  // Keep Group source tiles in immutable columns; invisible Group destinations go to $E000.
  var group=d.group||null, groupCodes=Object.create(null),individualCodes=Object.create(null);
  if(group&&group.codes)Object.keys(group.codes).forEach(function(id){
    var n=Number(id);groupCodes[isECM?n&63:n]=true;
  });
  var scannedBanks=[tiles,bank2];
  for(var bk=0;bk<2;bk++)if(scannedBanks[bk])for(var oldID in counts){
    var tile=scannedBanks[bk][Number(oldID)],props=tile&&tile.props||{};
    if(props.animated)individualCodes[Number(oldID)]=true;
  }
  var allocator=window.RICO_TEST331_ECM_ALLOCATOR;
  if(!allocator)throw Error('TEST331: cargá antes el asignador ECM compartido.');
  var allocation=allocator.allocate({counts:counts,bank1:d.bank1,bank2:d.bank2,
    groupCodes:groupCodes,animatedCodes:individualCodes});
  var IDs=allocation.representatives,map=allocation.physicalByCode;
  if(!isECM){
    var selected=Object.keys(backgrounds).map(Number).sort(function(a,b){return backgrounds[b]-backgrounds[a]||a-b;});
    if(selected.length>4)throw new Error('ECM: el mapa utiliza '+selected.length+' fondos efectivos y ECM admite 4. Colores usados: '+selected.join(', ')+'. No se alteró el diseño.');
    bgRegs=selected.includes(defaultBG)?[defaultBG].concat(selected.filter(function(c){return c!==defaultBG;})):selected.slice();
    if(!bgRegs.length)bgRegs=[defaultBG];
    while(bgRegs.length<4)bgRegs.push(bgRegs[bgRegs.length-1]);
  }
  var colorToSlot=Object.create(null);
  if(!isECM)for(var k=0;k<4;k++)if(colorToSlot[bgRegs[k]]===undefined)colorToSlot[bgRegs[k]]=k;
  var newBank1=allocation.bank1,newBank2=allocation.bank2;
  var nextMap=[];
  for(var yy=0;yy<25;yy++){
    var newRow=[];
    for(var xx=0;xx<width;xx++){
      var index=yy*width+xx,phys=map[origCodes[index]],slot=isECM?sourceBg[index]:colorToSlot[sourceBg[index]];
      if(!Number.isInteger(phys)||phys<0||phys>63||!Number.isInteger(slot)||slot<0||slot>3)
        throw new Error('ECM: no se pudo codificar fondo o tile en X'+xx+',Y'+yy);
      newRow.push(phys|(slot<<6));
    }
    nextMap.push.apply(nextMap,newRow.concat(newRow));
  }
  // Map group writes to the same 8-byte glyph positions as their remapped map.
  if(group&&group.codes){
    var addresses=[],codes=Object.create(null);
    for(var col=0;col<group.w;col++){
      for(var gr=0;gr<group.h;gr++){
        var old=group.cells[col][gr],orig=isECM?(old&63):old,phys=map[orig];
        // Invisible source-only group cells must not consume the 64 VIC glyphs.
        // The ASM still processes their source column, but writes to CPU-only $E000.
        if(phys===undefined){addresses.push(allocation.sinkAddress);continue;}
        if(!Number.isInteger(phys)||phys>=64)throw new Error('ECM: referencia grupal física inválida.');
        addresses.push((group.bank===2?0x3800:0x3000)+phys*8);
        codes[phys]=true;
      }
    }
    group=Object.assign({},group,{addresses:addresses,codes:codes});
  }
  // Recreate native animation index: TEST327's initial detection looks for
  // original codes and cannot see c64ecm aliases with upper background bits.
  var individual=[];
  for(var bank=1;bank<=2;bank++){
    var bankTiles=bank===1?tiles:bank2;
    if(!bankTiles)continue;
    for(var ci=0;ci<IDs.length;ci++){
      var id2=IDs[ci],props=bankTiles[id2]&&bankTiles[id2].props||{};
      var typ=props.animated;
      if(typ===undefined||typ===null||typ===false||typ==='')continue;
      if(!Object.prototype.hasOwnProperty.call(TYPES,typ))throw new Error('ECM: animación '+typ+' del tile '+id2+' no soportada.');
      var ticks=Number(props.ticksPerFrame);
      if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw new Error('ECM: ticks inválidos del tile '+id2+'.');
      if(group&&group.bank===bank&&group.codes[ci])
        throw new Error('ECM: tile '+id2+' tiene animación individual y grupal simultáneas en BANK'+bank+'; esas escrituras necesitan composición, no basta con renumerarlas.');
      individual.push({bank:bank,code:ci,ticks:ticks,type:TYPES[typ],address:(bank===2?0x3800:0x3000)+ci*8});
    }
  }
  d.bank1=newBank1;d.bank2=newBank2;d.map=nextMap;d.group=group;d.__ricoIndividual327=individual;
  d.ecm328=true;d.ecmBG328=bgRegs;d.bg=bgRegs[0];
  state.last={mode:screenMode||'textmode',exportMode:'extended',width:width,visibleHeight:25,
    mapIndices:allocation.sourceIndexCount,usedGlyphs:allocation.uniqueGlyphs,
    mergedAliases:allocation.mergedAliases,invisibleGroupSources:allocation.unpaintedGroupSourceCount,
    sourceToPhysical:Object.keys(map).map(function(id){return{id:Number(id),slot:map[id]};}),
    backgrounds:bgRegs.slice(),individual:individual.length,group:!!group,
    alreadyECM:isECM,nonDestructive:true};
  return d;
}
H.collect=function(self){
  var d=previousCollect(self);
  if(!state.active)return d;
  return pack(self,d,state.active);
};
H.build=function(d){
  // TEST327's actual PRG path calls the lexical TEST186 collect(self), not
  // window.RICO_TEST186_HORIZONTAL.collect(self). Recollect through the public
  // TEST327 hook while the real export is active, otherwise individual
  // animations and ECM remaps silently disappear from downloaded PRGs.
  if(state.horizontal&&state.exporter)d=H.collect(state.exporter);
  var asm=previousBuild(d);
  if(!d.ecm328)return asm;
  // $d011 bit 6 selects Extended Background Color Mode, whereas TEST327
  // hardcoded $1b (standard text mode) every horizontal frame.
  asm=substituteOnce(asm,' lda #$1b\n sta $d011',
      ' lda #$5b\n sta $d011','VIC-II $D011 ECM bit');
  // d.bg already initializes $D021; explicitly initialize $D022/$D023/$D024.
  asm=substituteOnce(asm,' sta $d021\n',
      ' sta $d021\n lda #'+hex(d.ecmBG328[1])+'\n sta $d022\n lda #'+hex(d.ecmBG328[2])+
      '\n sta $d023\n lda #'+hex(d.ecmBG328[3])+'\n sta $d024\n','VIC-II 4 background registers');
  if(!asm.includes('world_map_data\n')||!asm.includes('anim175_tick\n')&&d.__ricoIndividual327.length)
    throw new Error('ECM: integridad del mapa o de las animaciones no verificada en el ASM.');
  state.exportCount++;
  return asm;
};
ToPRGAdv.prototype.createPRG=function(args){
  var editor=this.editor,layer=editor&&editor.layers&&editor.layers.getSelectedLayerObject&&editor.layers.getSelectedLayerObject(),
    mode=layer&&layer.getScreenMode&&layer.getScreenMode(),cfg=editor&&editor.graphic&&editor.graphic.frames&&editor.graphic.frames[0]&&editor.graphic.frames[0].ricoMapScrollV1||{},
    width=editor&&editor.graphic&&editor.graphic.getGridWidth&&editor.graphic.getGridWidth(),
    isECM=mode==='c64ecm'||(typeof TextModeEditor!=='undefined'&&mode===TextModeEditor.Mode.C64ECM);
  var horizontal=!!(width>40&&(cfg.type==='left'||cfg.type==='right'));
  var applies=!!(horizontal&&((args&&args.mode==='extended')||isECM));
  var before=state.active,previousExporter=state.exporter,previousHorizontal=state.horizontal;
  if(horizontal){state.horizontal=true;state.exporter=this;}
  if(applies){state.active=args||{mode:'extended'};state.lastError=null;}
  try{return previousCreate.apply(this,arguments);}
  catch(e){
    if(applies){state.lastError=e.message;console.error('[TEST328 ECM]',e);}
    throw e;
  }finally{state.active=before;state.exporter=previousExporter;state.horizontal=previousHorizontal;}
};
window.RICO_TEST328_ECM_EXPORT=state;
console.log('[TEST328 ECM] Non-destructive 64-glyph remap and 4-background PRG support installed for horizontal map.');
})();
