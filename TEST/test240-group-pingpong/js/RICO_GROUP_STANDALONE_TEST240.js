/* TEST240: export Group Animate without enabling Map Scroll.
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
  if(!active.some(function(x){return /^(pingpong-left|pingpong-right|pingpong-up|pingpong-down|left|right|up|down)$/.test(x.g.type);}))return false;
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
  if(groups.length!==1)throw new Error('TEST240: hay '+groups.length+' grupos activos. Este exportador independiente aún no planifica varios grupos simultáneos.');
  var bank=groups[0].bank,g=groups[0].g;
  if(!/^(left|right|up|down|pingpong-left|pingpong-right|pingpong-up|pingpong-down)$/.test(g.type))
    throw new Error('TEST240: efecto de grupo '+g.type+' pendiente en exportación independiente.');
  var w=Number(g.widthTiles),h=Number(g.heightTiles),ticks=Number(g.ticksPerFrame);
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||h>32||w*h>256)
    throw new Error('TEST240: dimensiones de grupo no representables en 256 caracteres.');
  if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw new Error('TEST240: ticks fuera del rango 1..255.');
  var rawPixels=g.pixelsPerTick;
  var standard=/^(up|down|pingpong-up|pingpong-down)$/.test(g.type);
  var pixels=(rawPixels===null||rawPixels===undefined)?(standard?((w===2&&h===8&&ticks===1)?1:2):4):Number(rawPixels);
  if(!Number.isInteger(pixels)||pixels<1||pixels>8)throw new Error('TEST240: píxeles por tick fuera del rango 1..8.');
  var bank1=ts.tileData,bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
  var tiles=bank===1?bank1:bank2;
  if(!tiles||tiles.length<256)throw new Error('TEST240: falta BANK '+bank+'.');
  var cells=Array.from({length:w},function(){return Array(h).fill(-1);});
  var seen={},ids={};
  if(!Array.isArray(g.cells)||g.cells.length!==w*h)throw new Error('TEST240: selección de grupo incompleta.');
  g.cells.forEach(function(c){
    var x=Number(c.x),y=Number(c.y),id=Number(c.tile);
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(id)||x<0||y<0||x>=w||y>=h||id<0||id>255||seen[id]||cells[x][y]!==-1)
      throw new Error('TEST240: grupo con índice repetido o geometría inválida.');
    cells[x][y]=id;ids[id]=true;seen[id]=true;
  });
  if(cells.some(function(col){return col.indexOf(-1)>=0;}))throw new Error('TEST240: grupo con huecos.');
  var protectedVals=[],addresses=[],cols=[],protect=holder.config.animateEmptyCharacters!==true;
  for(var cx=0;cx<w;cx++){
    var column=[];
    for(var cy=0;cy<h;cy++){
      var id=cells[cx][cy],bitmap=tiles[id]&&tiles[id].data&&tiles[id].data[0];
      if(!bitmap||bitmap.length!==64)throw new Error('TEST240: falta bitmap del tile '+id);
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
  return {bank:bank,w:w,h:h,ticks:ticks,pixels:pixels,type:g.type,cells:cells,tiles:tiles,columns:cols,addresses:addresses,protection:protectedVals,codes:ids};
}
function build(self){
  var ed=self.editor,graphic=ed.graphic,frames=graphic.frames,layer=getLayer(ed),ts=getTS(ed);
  if(frames.length!==1)throw new Error('TEST240: para exportar el grupo sin Map Scroll, todavía falta integrar la transición entre varios frames.');
  if(ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw new Error('TEST240: Charset C64 requiere caracteres de 8x8.');
  var state=groupsFrom(ts),group=readGroup(ts,state),windowCfg=getWindow(ed);
  var sw=Number(graphic.getGridWidth()),sh=Number(graphic.getGridHeight());
  var wx=Number(windowCfg.x)||0,wy=Number(windowCfg.y)||0;
  if(sw===40&&sh===25){wx=0;wy=0;}
  if(wx<0||wy<0||wx+40>sw||wy+25>sh)throw new Error('TEST240: la ventana de exportación 40x25 debe estar dentro del Screen original.');
  var rawBank2=state.store.ricoCharsetBank2&&state.store.ricoCharsetBank2.tileData;
  var bank1=glyphs(ts.tileData),bank2=rawBank2?glyphs(rawBank2):bank1;
  var activeBank=frames[0].charsetBank===2?2:1;
  var map=[],colors=[];
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
    var cell=layer.getCell({x:wx+x,y:wy+y,frame:0})||{};
    map.push((Number(cell.t)||0)&255);
    colors.push((Number(cell.fc)||0)&15);
  }
  var bg=Number(layer.getBackgroundColor(0))&15,border=Number(layer.getBorderColor(0))&15;
  var out=[
    '; TEST240 standalone Group Animate, no Map Scroll required',
    '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
    '*=$2000',
    'start',' sei',' lda #$35',' sta $01',' lda #$7f',' sta $dc0d',' sta $dd0d',
    ' lda $dc0d',' lda $dd0d',
    ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
    ' lda #$1b',' sta $d011',' lda #$08',' sta $d016',
    ' lda #'+hex(activeBank===2?0x1e:0x1c),' sta $d018',
    ' lda #'+hex(bg),' sta $d021',
    ' lda #'+hex(border),' sta $d020',
    ' ldx #$00','draw240',
    ' lda screen240,x',' sta $0400,x',
    ' lda screen240+$100,x',' sta $0500,x',
    ' lda screen240+$200,x',' sta $0600,x',
    ' lda screen240+$300,x',' sta $0700,x',
    ' lda color240,x',' sta $d800,x',
    ' lda color240+$100,x',' sta $d900,x',
    ' lda color240+$200,x',' sta $da00,x',
    ' lda color240+$300,x',' sta $db00,x',
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
  bytes(out,bank1);
  out.push('*=$3800','charset_bank2');bytes(out,bank2);
  out.push('*=$4000','screen240');bytes(out,map);
  out.push('*=$4400','color240');bytes(out,colors);
  if(!window.RICO_TEST186_HORIZONTAL||typeof window.RICO_TEST186_HORIZONTAL.groupASM!=='function')
    throw new Error('TEST240: groupASM no disponible.');
  out.push(window.RICO_TEST186_HORIZONTAL.groupASM(group,bank1,bank2));
  return out.join('\n')+'\n';
}
function assemble(self,source){
  var as=typeof g_app!=='undefined'&&g_app&&g_app.assembler;
  if(!as)throw new Error('TEST240: ensamblador no disponible');
  var result=as.assemble(source,0x0801);
  if(!result||!result.success)throw new Error('TEST240 ASM: '+((result&&result.errors)||[]).map(function(e){return e.message||String(e);}).join(' | '));
  var mem=as.getMemory(),prg=new Uint8Array(2+result.end-result.start);
  prg[0]=result.start&255;prg[1]=(result.start>>8)&255;
  for(var addr=result.start;addr<result.end;addr++)prg[addr-result.start+2]=mem[addr]&255;
  return prg;
}
ToPRGAdv.prototype.createPRG=function(args){
  if(!isStandalone(this))return old.apply(this,arguments);
  try{
    args=args||{};
    var src=build(this),prg=assemble(this,src);this.prg=prg;
    if(args.download===false)return prg;
    var filename=args.filename||'rico-test240-group-solo.prg';
    if(!/\.prg$/i.test(filename))filename+='.prg';
    if(typeof window.download!=='function')throw new Error('TEST240: download() no disponible.');
    window.download(prg,filename,'application/prg');return prg;
  }catch(e){
    window.RICO_TEST240_LAST_ERROR=e.message;
    console.error('[RICO TEST240 STANDALONE]',e);
    if(typeof window.alert==='function')window.alert('RICO TEST240: '+e.message);
    return false;
  }
};
window.RICO_TEST240_STANDALONE={build:build,readGroup:readGroup,isStandalone:isStandalone};
console.log('[RICO TEST240] Group-only PRG route loaded: Map Scroll not required');
})();