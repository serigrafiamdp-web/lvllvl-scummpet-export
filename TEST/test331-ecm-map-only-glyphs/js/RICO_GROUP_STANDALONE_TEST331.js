/* TEST246: export Group Animate without enabling Map Scroll.
 * The original TEST143/164 only accepts UP. This isolated wrapper adds
 * a static 40x25 VIC screen and reuses the same ASM group generator
 * as the combined Map Scroll routes, including four reflected Ping Pong modes.
 * No editor data is changed.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined')return;
var old=ToPRGAdv.prototype.createPRG;
function hex(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function b16(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function bytes(out,items){
  for(var i=0;i<items.length;i+=16){
    var slice=Array.prototype.slice.call(items,i,i+16);
    out.push('!byte '+slice.map(hex).join(','));
  }
}
function getLayer(ed){return ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}
function getTS(ed){var layer=getLayer(ed);return layer&&layer.getTileSet&&layer.getTileSet();}
function getCfg(ed,n){
  try{if(window.RICO_TEST79_MAP_SCROLL&&window.RICO_TEST79_MAP_SCROLL.getConfig)return window.RICO_TEST79_MAP_SCROLL.getConfig(ed.graphic,n);}
  catch(e){}
  var f=ed.graphic.frames&&ed.graphic.frames[n];return f&&f.ricoMapScrollV1||{};
}
function getWindow(ed){
  try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getConfig)return window.RICO_TEST75_WINDOW_DIMENSION.getConfig(ed.graphic,0);}
  catch(e){}
  return ed.graphic.frames[0].ricoWindowDimensionV1||{x:0,y:0,width:40,height:25};
}
function groupsFrom(ts){
  var rec=ts.getDocRecord&&ts.getDocRecord(),store=rec&&rec.data||{};
  var cfg=store.ricoGroupAnimationsV1||{},result=[];
  [1,2].forEach(function(bank){(cfg['bank'+bank]||[]).forEach(function(g){
    if(g&&g.type)result.push({bank:bank,g:g});
  });});
  return {groups:result,store:store,config:cfg};
}
function isStandalone(self){
  var ed=self&&self.editor;if(!ed||!ed.graphic||!ed.graphic.frames)return false;
  var ts=getTS(ed);if(!ts)return false;
  var active=groupsFrom(ts).groups;
  if(!active.length)return false;
  if(!active.some(function(x){return /^(pingpong-left|pingpong-right|pingpong-up|pingpong-down|ondas-left|ondas-right|ondas-up|ondas-down|left|right|up|down)$/.test(x.g.type);}))return false;
  for(var n=0;n<ed.graphic.frames.length;n++){var c=getCfg(ed,n);if(c&&c.type)return false;}
  return true;
}
function glyphs(tiles){
  var out=new Uint8Array(2048);
  for(var i=0;i<256;i++){
    var pixels=tiles&&tiles[i]&&tiles[i].data&&tiles[i].data[0];
    if(!pixels)continue;
    for(var y=0;y<8;y++){
      var n=0;for(var x=0;x<8;x++)if(pixels[y*8+x])n|=128>>x;
      out[i*8+y]=n;
    }
  }
  return out;
}
function readGroup(ts,holder){
  var groups=holder.groups,store=holder.store;
  if(groups.length!==1)throw new Error('TEST246: hay '+groups.length+' grupos activos. Este exportador independiente aún no planifica varios grupos simultáneos.');
  var bank=groups[0].bank,g=groups[0].g;
  // ONDAS keeps the byte-for-byte prior Ping Pong group engine.
  var waveSource330=g.type;
  // Keep the original ONDAS waveform: reflected phase, progressive writes to
  // visible VIC charset. It must never use atomic Ping Pong bank swapping.
  if(/^ondas-/.test(g.type))g=Object.assign({},g,{type:g.type.replace(/^ondas-/,'pingpong-')});
  if(!/^(left|right|up|down|pingpong-left|pingpong-right|pingpong-up|pingpong-down)$/.test(g.type))
    throw new Error('TEST246: efecto de grupo '+g.type+' pendiente en exportación independiente.');
  var w=Number(g.widthTiles),h=Number(g.heightTiles),ticks=Number(g.ticksPerFrame);
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||h>32||w*h>256)
    throw new Error('TEST246: dimensiones de grupo no representables en 256 caracteres.');
  if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw new Error('TEST246: ticks fuera del rango 1..255.');
  var rawPixels=g.pixelsPerTick;
  var standard=/^(up|down|pingpong-up|pingpong-down)$/.test(g.type);
  var pixels=(rawPixels===null||rawPixels===undefined)?(standard?((w===2&&h===8&&ticks===1)?1:2):4):Number(rawPixels);
  if(!Number.isInteger(pixels)||pixels<1||pixels>8)throw new Error('TEST246: píxeles por tick fuera del rango 1..8.');
  var bank1=ts.tileData,bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
  var tiles=bank===1?bank1:bank2;
  if(!tiles||tiles.length<256)throw new Error('TEST246: falta BANK '+bank+'.');
  var cells=Array.from({length:w},function(){return Array(h).fill(-1);});
  var seen={},ids={};
  if(!Array.isArray(g.cells)||g.cells.length!==w*h)throw new Error('TEST246: selección de grupo incompleta.');
  g.cells.forEach(function(c){
    var x=Number(c.x),y=Number(c.y),id=Number(c.tile);
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(id)||x<0||y<0||x>=w||y>=h||id<0||id>255||seen[id]||cells[x][y]!==-1)
      throw new Error('TEST246: grupo con índice repetido o geometría inválida.');
    cells[x][y]=id;ids[id]=true;seen[id]=true;
  });
  if(cells.some(function(col){return col.indexOf(-1)>=0;}))throw new Error('TEST246: grupo con huecos.');
  var protectedVals=[],addresses=[],cols=[],protect=holder.config.animateEmptyCharacters!==true;
  for(var cx=0;cx<w;cx++){
    var column=[];
    for(var cy=0;cy<h;cy++){
      var id=cells[cx][cy],bitmap=tiles[id]&&tiles[id].data&&tiles[id].data[0];
      if(!bitmap||bitmap.length!==64)throw new Error('TEST246: falta bitmap del tile '+id);
      var blank=!bitmap.some(function(n){return !!n;});
      addresses.push((bank===2?0x3800:0x3000)+id*8);
      protectedVals.push(protect&&blank?1:0);
      for(var yy=0;yy<8;yy++){
        var byte=0;
        for(var xx=0;xx<8;xx++)if(bitmap[yy*8+xx])byte|=128>>xx;
        column.push(byte);
      }
    }
    cols.push(column.concat(column));
  }
  return {bank:bank,w:w,h:h,ticks:ticks,pixels:pixels,type:g.type,cells:cells,tiles:tiles,columns:cols,addresses:addresses,protection:protectedVals,codes:ids,sourceEffect:waveSource330,ondasProgressive:/^ondas-/.test(waveSource330)};
}

function packGroupECM331(self,layer,ts,group,map,b1,b2,wx,wy){
  var ed=self.editor,sm=layer.getScreenMode&&layer.getScreenMode(),
      already=sm==='c64ecm'||(typeof TextModeEditor!=='undefined'&&sm===TextModeEditor.Mode.C64ECM),
      noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor,
      main=Number(layer.getBackgroundColor(0)),frame=layer.frames&&layer.frames[0]||{};
  function c(v){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('ECM Group: color fuera de paleta C64: '+v);return v;}
  function absent(v){return v===undefined||v===null||v===-1||v===false||v===noColor;}
  main=c(main);
  var used=Object.create(null),bgs=Object.create(null),glyphs=[],colors=[],regs=[];
  if(already)for(var n=0;n<4;n++){
    var color=layer.getC64ECMColor?layer.getC64ECMColor(n,0):
        (n?frame['c64ECMColor'+n]:main);
    regs.push(c(absent(color)?main:color));
  }
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
    var v=layer.getCell({x:wx+x,y:wy+y,frame:0})||{},id=Number(v.t);
    if(!Number.isInteger(id)||id<0||id>255)throw Error('ECM Group: tile fuera de 0–255 en '+x+','+y);
    var g=already?id&63:id,b=already?(absent(v.bc)?id>>6:Number(v.bc)):
        (absent(v.bc)?main:c(v.bc));
    if(already&&(!Number.isInteger(b)||b<0||b>3))
        throw Error('ECM Group: selector de fondo fuera de 0–3 en '+x+','+y);
    glyphs.push(g);colors.push(b);used[g]=(used[g]||0)+1;
    if(!already)bgs[b]=(bgs[b]||0)+1;
  }
  var grouped=Object.create(null),animated=Object.create(null);
  for(var col=0;col<group.w;col++)for(var row=0;row<group.h;row++){
    var tile=group.cells[col][row],g=already?tile&63:tile;
    if(!Number.isInteger(g)||g<0||g>255)throw Error('ECM Group: tile grupal inválido.');
    grouped[g]=true; // these are source glyphs; unused targets need no VIC slot
  }
  var tileStore=ts.getDocRecord().data||{},originalBanks=[ts.tileData,tileStore.ricoCharsetBank2&&tileStore.ricoCharsetBank2.tileData];
  for(var bank=0;bank<2;bank++)if(originalBanks[bank])for(var id in used){
    var tile=originalBanks[bank][Number(id)],props=tile&&tile.props||{};
    if(props.animated)animated[Number(id)]=true;
  }
  var allocator=window.RICO_TEST331_ECM_ALLOCATOR;
  if(!allocator)throw Error('TEST331: falta el asignador ECM compartido.');
  var allocated=allocator.allocate({counts:used,bank1:b1,bank2:b2,groupCodes:grouped,animatedCodes:animated});
  var ids=allocated.representatives,convert=allocated.physicalByCode;
  if(!already){
    var sorted=Object.keys(bgs).map(Number).sort(function(a,b){return bgs[b]-bgs[a]||a-b});
    if(sorted.length>4)throw Error('ECM Group: '+sorted.length+' fondos efectivos y ECM admite cuatro. No se modificó el proyecto.');
    regs=sorted.includes(main)?[main].concat(sorted.filter(function(v){return v!==main})):sorted.slice();
    if(!regs.length)regs=[main];
    while(regs.length<4)regs.push(regs[regs.length-1]);
  }
  var colorToSlot=Object.create(null);
  if(!already)for(var i=0;i<4;i++)if(colorToSlot[regs[i]]===undefined)colorToSlot[regs[i]]=i;
  var packed=[];
  for(var i=0;i<1000;i++){
    var g=convert[glyphs[i]],slot=already?colors[i]:colorToSlot[colors[i]];
    if(!Number.isInteger(g)||g>=64||!Number.isInteger(slot)||slot<0||slot>3)
       throw Error('ECM Group: error al codificar mapa/colores.');
    packed.push(g|(slot<<6));
  }
  var new1=allocated.bank1,new2=allocated.bank2;
  // The group source tile matrix MUST remain original: groupASM reads tiles[code].data.
  // Only target destination addresses are remapped; offscreen targets write to $E000.
  var originalBank=group.bank===2?b2:b1, columns=[],cells=[],addresses=[],protection=[],codes=Object.create(null),
      guard=ts.getDocRecord().data.ricoGroupAnimationsV1||{},
      protect=guard.animateEmptyCharacters!==true;
  for(var x=0;x<group.w;x++){
    var column=[],newCol=[];
    for(var y=0;y<group.h;y++){
      var tile=group.cells[x][y],original=already?tile&63:tile,target=convert[original],blank=true;
      newCol.push(target===undefined?-1:target);
      if(target===undefined){addresses.push(allocated.sinkAddress);}else{
        codes[target]=true;addresses.push((group.bank===2?0x3800:0x3000)+target*8);
      }
      for(var z=0;z<8;z++){var byte=originalBank[original*8+z];column.push(byte);if(byte)blank=false;}
      protection.push(protect&&blank?1:0);
    }
    cells.push(newCol);columns.push(column.concat(column));
  }
  window.RICO_TEST330_GROUP_ECM_LAST={mapIndices:allocated.sourceIndexCount,
    usedGlyphs:allocated.uniqueGlyphs,mergedAliases:allocated.mergedAliases,
    invisibleGroupSources:allocated.unpaintedGroupSourceCount,backgrounds:regs.slice(),
    groupType:group.sourceEffect||group.type,groupTiles:group.w*group.h,nonDestructive:true};
  return {bank1:new1,bank2:new2,map:packed,bg:regs[0],backgrounds:regs,physicalByCode:convert,
    group:Object.assign({},group,{addresses:addresses,codes:codes,columns:columns,protection:protection})};
}


function collectIndividual331(ts,layer,wx,wy,group,pack,mode){
 var store=ts.getDocRecord().data||{},banks=[ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData],
 used=Object.create(null),groupOriginal=Object.create(null),records=[],
 types={left:0,right:1,up:2,down:3,blink:4},
 already=mode==='c64ecm'||(typeof TextModeEditor!=='undefined'&&mode===TextModeEditor.Mode.C64ECM);
 for(var x=0;x<group.w;x++)for(var y=0;y<group.h;y++){
  var code=group.cells[x][y];groupOriginal[already?code&63:code]=true;
 }
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var c=layer.getCell({x:wx+x,y:wy+y,frame:0})||{},id=Number(c.t);
  if(Number.isInteger(id)&&id>=0&&id<=255)used[already?id&63:id]=true;
 }
 for(var bank=1;bank<=2;bank++){
  var tiles=banks[bank-1];if(!tiles)continue;
  for(var k in used){
   var id=Number(k),p=tiles[id]&&tiles[id].props||{},type=p.animated;
   if(type===null||type===undefined||type===false||type==='')continue;
   if(!Object.prototype.hasOwnProperty.call(types,type))
     throw Error('Group+Individual: tile '+id+' tiene efecto no soportado: '+type);
   var ticks=Number(p.ticksPerFrame);
   if(!Number.isInteger(ticks)||ticks<1||ticks>255)
     throw Error('Group+Individual: ticks inválidos para tile '+id+' (1–255).');
   if(group.bank===bank&&groupOriginal[id])
     throw Error('Group+Individual: tile '+id+' recibe dos animaciones sobre los mismos 8 bytes; hace falta composición física.');
   var dst=pack?pack.physicalByCode[id]:id;
   if(!Number.isInteger(dst))throw Error('Group+Individual: tile '+id+' sin posición física de exportación.');
   records.push({bank:bank,code:dst,ticks:ticks,type:types[type],
     address:(bank===2?0x3800:0x3000)+dst*8});
  }
 }
 return records;
}
function replaceASM331(src,a,b,which){
 var pos=src.indexOf(a);
 if(pos<0||src.indexOf(a,pos+a.length)>=0)throw Error('Group+Individual: ancla de ASM '+which+' cambió o está duplicada.');
 return src.slice(0,pos)+b+src.slice(pos+a.length);
}
function injectIndividual331(source,records,bank1,bank2,bank,bg,border){
 var L=window.RICO_TEST168_PRG_LARGE_MAP;
 if(!L||!L.buildSource)throw Error('Group+Individual: falta kernel TEST175.');
 var empty=new Uint8Array(40*26),colors=new Uint8Array(40*26);colors.fill(14);
 var mock={width:40,height:26,type:'up',typeCode:1,ticks:1,pixels:1,duration:12,
  bg:bg,border:border,bank:bank,initialRow:0,
  window:{x:0,y:0,width:40,height:25},area:{x:0,y:0,width:40,height:26},
  bank1:bank1,bank2:bank2,map:empty,colors:colors,
  anim175:{records:records,switchTicks:0,group:null}};
 var donor=L.buildSource(mock),start=donor.indexOf('\nanim175_tick\n'),end=donor.indexOf('\n*=$3000\n',start);
 if(start<0||end<start)throw Error('Group+Individual: kernel nativo TEST175 no encontrado.');
 source=replaceASM331(source,'*=$2000\nstart',
  '*=$2000\nanim175_ptr_lo=$30\nanim175_ptr_hi=$31\nanim175_dest_lo=$32\nanim175_dest_hi=$33\nanim175_temp=$34\nstart','punteros');
 source=replaceASM331(source,
  'main240\n lda group182_pending\n beq main240\n jsr group182_step\n jmp main240',
  'main240\n lda group182_pending\n bne group331_run\n lda anim175_pending\n beq main240\n jsr anim175_tick\n jmp main240\ngroup331_run\n jsr group182_step\n jmp main240',
  'planificador de grupo');
 source=replaceASM331(source,
  ' jsr group182_irq_tick\n pla\n tay\n pla\n tax\n pla\n rti',
  ' jsr group182_irq_tick\n lda anim175_pending\n cmp #$ff\n beq group331_pending_max\n inc anim175_pending\ngroup331_pending_max\n pla\n tay\n pla\n tax\n pla\n rti','tick IRQ');
 source=replaceASM331(source,'\n*=$3000\ncharset_bank1',
  '\n'+donor.slice(start+1,end)+'\n*=$3000\ncharset_bank1','kernel TEST175');
 return source;
}

function build(self,args){
  var ed=self.editor,graphic=ed.graphic,frames=graphic.frames,layer=getLayer(ed),ts=getTS(ed);
  if(frames.length!==1)throw new Error('TEST246: para exportar el grupo sin Map Scroll, todavía falta integrar la transición entre varios frames.');
  if(ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw new Error('TEST246: Charset C64 requiere caracteres de 8x8.');
  var state=groupsFrom(ts),group=readGroup(ts,state),windowCfg=getWindow(ed);
  var screenMode=layer.getScreenMode&&layer.getScreenMode();
  var wantECM=(args&&args.mode==='extended')||screenMode==='c64ecm'||
    (typeof TextModeEditor!=='undefined'&&screenMode===TextModeEditor.Mode.C64ECM);
  var perfect=/^pingpong-/.test(state.groups[0].g.type);
  var sw=Number(graphic.getGridWidth()),sh=Number(graphic.getGridHeight());
  var wx=Number(windowCfg.x)||0,wy=Number(windowCfg.y)||0;
  if(sw===40&&sh===25){wx=0;wy=0;}
  if(wx<0||wy<0||wx+40>sw||wy+25>sh)throw new Error('TEST246: la ventana de exportación 40x25 debe estar dentro del Screen original.');
  var rawBank2=state.store.ricoCharsetBank2&&state.store.ricoCharsetBank2.tileData;
  var bank1=glyphs(ts.tileData),bank2=rawBank2?glyphs(rawBank2):bank1;
  var activeBank=Number(frames[0].charsetBank)===2?2:1;
  if(perfect){var base=activeBank===2?bank2:bank1;bank1=new Uint8Array(base);bank2=new Uint8Array(base);}
  var map=[],colors=[];
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
    var cell=layer.getCell({x:wx+x,y:wy+y,frame:0})||{};
    map.push((Number(cell.t)||0)&255);
    colors.push((Number(cell.fc)||0)&15);
  }
  var bg=Number(layer.getBackgroundColor(0))&15,border=Number(layer.getBorderColor(0))&15,groupECM=null;
  if(wantECM){groupECM=packGroupECM331(self,layer,ts,group,map,bank1,bank2,wx,wy);
    map=groupECM.map;bank1=groupECM.bank1;bank2=groupECM.bank2;
    group=groupECM.group;bg=groupECM.bg;}
  var individual331=collectIndividual331(ts,layer,wx,wy,group,groupECM,screenMode);
  if(perfect&&individual331.length)throw Error('Group+Individual: Ping Pong atómico conmuta los dos bancos; todavía falta sincronizar las animaciones individuales con el intercambio. Las configuraciones siguen guardadas. ONDAS progresivas y Scroll circular sí pueden combinarse.');
  var originalGroupType=state.groups[0].g.type;
  var scroll247=/^(left|right|up|down)$/.test(originalGroupType);
  var pp247=/^pingpong-(left|right|up|down)$/.test(originalGroupType)&&group.pixels!==8;
  if(!wantECM&&!individual331.length&&(scroll247||pp247)&&window.RICO_TEST247_SCROLL_REMAP){
    var next=window.RICO_TEST247_SCROLL_REMAP.compile({
      group:group,map:map,colors:colors,bg:bg,border:border,
      bank1:bank1,bank2:bank2,activeBank:activeBank
    });
    if(next&&next.source){
      window.RICO_TEST247_LAST_PLAN={mode:'TEST247-FAST-SCROLL',speed:next.speed,
        direction:next.direction,positions:next.positions,phases:next.phaseCount,
        banks:next.vicBanks,fonts:next.variantCount,cycles:next.estimatedCyclesPerPhase};
      console.log('[TEST247 SCROLL REMAP]',window.RICO_TEST247_LAST_PLAN);
      return next.source;
    }
    window.RICO_TEST247_LAST_PLAN={mode:'TEST247-FALLBACK',speed:group.pixels,
      direction:originalGroupType,reason:next&&next.reason||'Sin datos de remapeo'};
    console.warn('[TEST247 FALLBACK]',window.RICO_TEST247_LAST_PLAN);
  }
  // TEST246 screen remap: prefer the four pre-shifted fonts and change only
  // screen references; no per-tick glyph-buffer copy for eligible groups.
  if(!wantECM&&!individual331.length&&perfect&&group.pixels===8&&window.RICO_TEST246_SCREEN_REMAP){
    var remapped=window.RICO_TEST246_SCREEN_REMAP.compile({
      group:group,map:map,colors:colors,bg:bg,border:border,
      bank1:bank1,bank2:bank2,activeBank:activeBank
    });
    if(remapped&&remapped.source){
      window.RICO_TEST246_LAST_PLAN={mode:remapped.reason,positions:remapped.positions,
        phases:remapped.phaseCount,cycles:remapped.estimatedCyclesPerFrame,
        fonts:4,blank:remapped.blankCode};
      console.log('[TEST246 SCREEN-REMAP]',window.RICO_TEST246_LAST_PLAN);
      return remapped.source;
    }
    window.RICO_TEST246_LAST_PLAN={mode:'fallback TEST245',reason:remapped&&remapped.reason||'Sin fuente'};
    console.warn('[TEST246]',window.RICO_TEST246_LAST_PLAN);
  }
  var out=[
    '; TEST240 standalone Group Animate, no Map Scroll required',
    '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
    '*=$2000',
    'start',' sei',' lda #$35',' sta $01',' lda #$7f',' sta $dc0d',' sta $dd0d',
    ' lda $dc0d',' lda $dd0d',
    ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
    ' lda #$00',' sta $d015',' lda #'+(wantECM?'$5b':'$1b'),' sta $d011',' lda #$08',' sta $d016',
    ' lda #'+hex(activeBank===2?0x1e:0x1c),' sta $d018',
    ' lda #'+hex(bg),' sta $d021',
    ...(wantECM?[' lda #'+hex(groupECM.backgrounds[1]),' sta $d022',' lda #'+hex(groupECM.backgrounds[2]),' sta $d023',' lda #'+hex(groupECM.backgrounds[3]),' sta $d024']:[]),
    ' lda #'+hex(border),' sta $d020',
    ' ldx #$00','draw240',
    ' lda $4000,x',' sta $0400,x',
    ' lda $4100,x',' sta $0500,x',
    ' lda $4200,x',' sta $0600,x',
    ' lda $4300,x',' sta $0700,x',
    ' lda $4400,x',' sta $d800,x',
    ' lda $4500,x',' sta $d900,x',
    ' lda $4600,x',' sta $da00,x',
    ' lda $4700,x',' sta $db00,x',
    ' inx',' bne draw240',
    ' lda #$01',' sta $d01a',' lda #$fa',' sta $d012',
    ' lda #<irq240',' sta $fffe',' lda #>irq240',' sta $ffff',
    ' cli',
    'main240',' lda group182_pending',' beq main240',
    ' jsr group182_step',' jmp main240',
    'irq240',' pha',' txa',' pha',' tya',' pha',
    ' lda #$01',' sta $d019',
    ' jsr group182_irq_tick',
    ' pla',' tay',' pla',' tax',' pla',' rti',
    '*=$3000','charset_bank1'
  ];
  // TEST246: atomic charset flip on raster IRQ. Stage complete groups off-screen.
  if(perfect){
    var start=out.indexOf('main240'),end=out.indexOf('*=$3000');
    if(start<0||end<start)throw new Error('TEST246: no se encontraron etiquetas base del reproductor.');
    var stageBank=activeBank===1?2:1;
    var initXor=group.bank===stageBank?0:8;
    out.splice(start,end-start,
      'main240',' lda group240_swap_request',' bne main240',
      ' lda group182_pending',' beq main240',
      ' jsr group182_step',
      ' lda group182_active',' bne main240',
      ' lda #$01',' sta group240_swap_request',' jmp main240',
      'irq240',' pha',' txa',' pha',' tya',' pha',
      ' lda #$01',' sta $d019',
      ' lda group240_swap_request',' beq group240_no_flip',
      ' lda group240_front',' eor #$02',' sta group240_front',' sta $d018',
      ' lda group240_target_xor',' eor #$08',' sta group240_target_xor',
      ' lda #$00',' sta group240_swap_request',
      'group240_no_flip',' jsr group182_irq_tick',
      ' lda group182_pending',' cmp #$01',' bcc group240_pending_capped',
      ' lda #$01',' sta group182_pending',
      'group240_pending_capped',
      ' pla',' tay',' pla',' tax',' pla',' rti',
      'group240_front','!byte '+hex(activeBank===2?0x1e:0x1c),
      'group240_target_xor','!byte '+hex(initXor),
      'group240_swap_request','!byte $00'
    );
  }
  bytes(out,bank1);
  out.push('*=$3800','charset_bank2');bytes(out,bank2);
  out.push('*=$4000','screen240');bytes(out,map);
  out.push('*=$4400','color240');bytes(out,colors);
  if(!window.RICO_TEST186_HORIZONTAL||typeof window.RICO_TEST186_HORIZONTAL.groupASM!=='function')
    throw new Error('TEST246: groupASM no disponible.');
  var demo245=!wantECM&&perfect&&group.pixels===8&&window.RICO_TEST245_DEMO_SPEED
    ?window.RICO_TEST245_DEMO_SPEED.compile(group):null;
  var accelerated245=!!(demo245&&demo245.source);
  var groupASM=accelerated245?demo245.source:
    window.RICO_TEST186_HORIZONTAL.groupASM(group,bank1,bank2);
  if(accelerated245){
    console.log('[TEST245 DEMOSCENE SPEEDCODE]',
      demo245.phaseFrames+' frames',demo245.frameCacheBytes+' cache bytes',
      '~'+demo245.estimatedCopyCycles+' CPU cycles per phase');
  }else if(demo245)console.log('[TEST245 FALLBACK]',demo245.reason,
    'Using proven TEST244 ASM.');
  if(!wantECM&&!accelerated245&&perfect&&group.pixels===8&&window.RICO_TEST243_FAST8){
    var fast=window.RICO_TEST243_FAST8.transform(groupASM,group);
    groupASM=fast.source;
    if(window.RICO_TEST244_SPEED){
      var optimized=window.RICO_TEST244_SPEED.transform(groupASM,group);
      groupASM=optimized.source;
      console.log('[TEST244 PING PONG ASM]',fast.mode,'=>',optimized.mode,'glyphs',fast.glyphs||0);
    }else throw new Error('TEST246: rutina ASM de optimización no cargada.');

  }
  if(perfect&&!accelerated245){
    // Only change the destination address on legacy TEST244 path.
    var rewritten=0;
    groupASM=groupASM.replace(/( lda group182_dest_his,[xy]\n)( sta group182_dest_hi)/g,function(_,load,store){rewritten++;return load+' eor group240_target_xor\n'+store;});
    if(rewritten!==1)throw new Error('TEST246: no se pudo aislar escritura del charset de grupo.');
  }
  if(group.ondasProgressive)out.push('; TEST330 ONDAS: original visible-charset progressive phase.');
  out.push(groupASM);
  var asm=out.join('\n')+'\n';
  if(individual331.length){
    asm=injectIndividual331(asm,individual331,bank1,bank2,activeBank,bg,border);
    window.RICO_TEST331_GROUP_INDIVIDUAL_LAST={records:individual331.length,
      group:group.sourceEffect||group.type,ecm:wantECM,
      scheduler:'Group first, individual native TEST175 after group, same IRQ'};
  }
  return asm;
}
function assemble(self,source){
  var as=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
  if(!as)throw new Error('TEST246: ensamblador no disponible');
  var result=as.assemble(source,0x0801);
  if(!result||!result.success)throw new Error('TEST240 ASM: '+((result&&result.errors)||[]).map(function(e){return e.message||String(e);}).join(' | '));
  var mem=as.getMemory(),prg=new Uint8Array(2+result.end-result.start);
  prg[0]=result.start&255;prg[1]=(result.start>>8)&255;
  for(var addr=result.start;addr<result.end;addr++)prg[addr-result.start+2]=mem[addr]&255;
  return prg;
}
function announce246(plan){
  if(typeof document==='undefined'||!plan)return;
  var node=document.getElementById('rico246ExportEngineStatus');
  if(!node){
    node=document.createElement('div');
    node.id='rico246ExportEngineStatus';
    node.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;max-width:410px;padding:8px 12px;background:#171b23;color:white;border:1px solid #65758e;border-radius:6px;font:12px Arial,sans-serif;box-shadow:0 2px 12px #0007;';
    document.body.appendChild(node);
  }
  if(plan.mode==='TEST247-FAST-SCROLL'){
    node.textContent='TEST247 SCROLL FAST ACTIVO — '+plan.direction+' '+plan.speed+
      'px | '+plan.positions+' celdas | '+plan.phases+' fases | '+plan.banks+' bancos VIC.';
  }else if(plan.mode==='TEST247-FALLBACK'){
    node.textContent='TEST247 FALLBACK — '+plan.direction+' '+plan.speed+'px: '+plan.reason;
  }else if(plan.mode==='screen-remap-4-fonts'){
    node.textContent='TEST246 REMAP ACTIVO — '+plan.positions+' celdas; '+plan.phases+' fases; ~'+plan.cycles+' ciclos estimados/fase.';
  }else{
    node.textContent='TEST246 FALLBACK (sin remapeo) — '+(plan.reason||'No se seleccionó Speedcode.');
  }
}
ToPRGAdv.prototype.createPRG=function(args){
  if(!isStandalone(this))return old.apply(this,arguments);
  try{
    args=args||{};
    window.RICO_TEST246_LAST_PLAN=null;
    window.RICO_TEST247_LAST_PLAN=null;
    var src=build(this,args),prg=assemble(this,src);this.prg=prg;
    // TEST330: only show errors in UI; engine choices remain in console.
    console.log('[TEST330 GROUP EXPORT]',window.RICO_TEST247_LAST_PLAN||window.RICO_TEST246_LAST_PLAN||'legacy ondas');
    if(args.download===false)return prg;
    var plan=window.RICO_TEST247_LAST_PLAN||window.RICO_TEST246_LAST_PLAN;
    var defaultName=plan&&plan.mode==='TEST247-FAST-SCROLL'
      ?'RICO_TEST247_'+plan.direction.replace(/[^a-z-]/g,'')+'_'+plan.speed+'PX.prg'
      :plan&&plan.mode==='screen-remap-4-fonts'?'RICO_TEST246_REMAP_8PX.prg'
      :'RICO_TEST247_FALLBACK.prg';
    var filename=args.filename||defaultName;
    if(!/\.prg$/i.test(filename))filename+='.prg';
    if(typeof window.download!=='function')throw new Error('TEST246: download() no disponible.');
    window.download(prg,filename,'application/prg');return prg;
  }catch(e){
    window.RICO_TEST247_LAST_ERROR=e.message;
    console.error('[RICO TEST246 STANDALONE]',e);
    if(typeof window.alert==='function')window.alert('RICO TEST246: '+e.message);
    return false;
  }
};
window.RICO_TEST247_STANDALONE={build:build,readGroup:readGroup,isStandalone:isStandalone};
console.log('[RICO TEST246] Group-only PRG engine with remapped screens loaded; no Map Scroll required');
})();