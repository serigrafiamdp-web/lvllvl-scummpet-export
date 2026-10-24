/* TEST282 — Actual Commodore 64 MULTICOLOR BITMAP static PRG export.
 * Based on TEST281 PASS; no patches to legacy PRG, scroll, SID or MASTER.
 * C64 VIC bank $4000: screen=$5C00, bitmap=$6000, COLOR RAM=$D800.
 * BASIC SYS2064 loader copies embedded data from $1000 to VIC memory.
 */
(function(){
'use strict';
var TAG='[RICO TEST282]',WIDTH=40,HEIGHT=25,CELLS=1000;
var BMP_SIZE=8000,SCREEN_SIZE=1000,COLOR_SIZE=1000;
var LOAD=0x0801,CODE=0x0810,SOURCE=0x1000;
var BITMAP=0x6000,SCREEN=0x5C00,COLOR=0xD800;
var state={exports:0,last:null,error:null};
if(!window.RICO_TEST281_BITMAP || !window.RICO_TEST279_BITMAP ||
   typeof TextModeEditor==='undefined') {
  console.warn(TAG,'requires TEST279/280/281');return;
}
function currentEditor(){return window.g_app&&window.g_app.textModeEditor;}
function selectedLayer(ed){
  try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();}
  catch(e){return null;}
}
function active(ed){
  var l=selectedLayer(ed);
  return !!(l&&l.doc&&l.doc.ricoBitmapV1Enabled&&
    l.getScreenMode&&l.getScreenMode()==='c64multicolor');
}
function getFrame(l){
  var i=Number.isInteger(l.currentFrame)?l.currentFrame:0;
  if(!l.frames || !l.frames[i] || !l.frames[i].data)throw new Error('No hay frame seleccionada para exportar.');
  return {index:i,frame:l.frames[i]};
}
function encodeLayer(ed){
  var layer=selectedLayer(ed);
  if(!active(ed))throw new Error('Activá SCREEN → Multicolor Bitmap (Experimental).');
  if(!layer||layer.getType&&layer.getType()!=='grid')throw new Error('Seleccioná una capa de tipo grid.');
  var info=getFrame(layer),frame=info.frame;
  var ts=layer.getTileSet&&layer.getTileSet();
  if(!ts || !ts.getData || ts.getTileWidth()!==8||ts.getTileHeight()!==8)
    throw new Error('TEST282 solo permite patrones C64 8x8.');
  var w=layer.getGridWidth(),h=layer.getGridHeight(),tiles=ts.getData();
  if(!w||!h||w*h>100000)throw new Error('Dimensiones de mapa inválidas.');
  var palette=window.RICO_TEST279_BITMAP.seed(frame,layer);
  if(!palette)throw new Error('Paleta Bitmap de la frame no disponible.');
  var bmp=new Uint8Array(BMP_SIZE),screen=new Uint8Array(SCREEN_SIZE),
      color=new Uint8Array(COLOR_SIZE);
  var bg=Number(layer.getBackgroundColor(info.index));
  if(!Number.isInteger(bg)||bg<0||bg>15)bg=0;
  var copyW=Math.min(w,WIDTH),copyH=Math.min(h,HEIGHT),invalid=0;
  for(var y=0;y<copyH;y++)for(var x=0;x<copyW;x++){
    var loc=y*WIDTH+x,cell=frame.data[y]&&frame.data[y][x],
        tileIndex=cell&&cell.t;
    var tile=tiles && tiles[tileIndex],c=palette[y*w+x];
    if(typeof c!=='number')c=0;
    // Hardware bitmap: 01 = screen high nibble, 10 = screen low nibble,
    // 11 = Color RAM nibble, 00 = $D021.
    screen[loc]=((c&15)<<4)|((c>>>4)&15);
    color[loc]=(c>>>8)&15;
    if(!tile || tile.length<64){invalid++;continue;}
    for(var py=0;py<8;py++){
      var packed=0;
      for(var q=0;q<4;q++){
        var k=py*8+q*2,pair=(tile[k]?2:0)|(tile[k+1]?1:0);
        packed|=pair<<(6-2*q);
      }
      bmp[loc*8+py]=packed;
    }
  }
  return {bitmap:bmp,screen:screen,color:color,bg:bg,
    frame:info.index,sourceWidth:w,sourceHeight:h,
    cropped:w>WIDTH||h>HEIGHT,padded:w<WIDTH||h<HEIGHT,missingTiles:invalid,
    paletteFormat:'per-cell: screen upper C1/lower C2; Color RAM C3; background D021'};
}
// Assemble a tiny 6502 loader via byte opcodes and resolved labels rather
// than invoking the existing character-mode player. This keeps its PRG
// export path and optimizations byte-for-byte untouched.
function loader(bg){
  var bytes=[],labels={},fixups=[];
  function byte(v){bytes.push(v&255);}
  function word(v){byte(v);byte(v>>8);}
  function here(){return CODE+bytes.length;}
  function label(id){if(Object.prototype.hasOwnProperty.call(labels,id))throw new Error('Duplicate 6502 label '+id);labels[id]=here();}
  function imm(op,v){byte(op);byte(v);}
  function zp(op,v){byte(op);byte(v);}
  function abs(op,v){byte(op);word(v);}
  function bne(id){byte(0xD0);fixups.push({pos:bytes.length,id:id,type:'branch'});byte(0);}
  function jsr(id){byte(0x20);fixups.push({pos:bytes.length,id:id,type:'absolute'});word(0);}
  function jmp(id){byte(0x4C);fixups.push({pos:bytes.length,id:id,type:'absolute'});word(0);}
  function copy(src,dst,count,id){
    if(count<=0||count>0xFFFF)throw new Error('Copy size not supported');
    imm(0xA9,src&255);zp(0x85,0xFB);
    imm(0xA9,src>>8);zp(0x85,0xFC);
    imm(0xA9,dst&255);zp(0x85,0xFD);
    imm(0xA9,dst>>8);zp(0x85,0xFE);
    var pages=count>>8,rem=count&255;
    if(pages){imm(0xA2,pages);jsr('copyPages');}
    if(rem){
      imm(0xA0,0);
      label('tail'+id);
      zp(0xB1,0xFB); // LDA ($FB),Y
      zp(0x91,0xFD); // STA ($FD),Y
      byte(0xC8);    // INY
      imm(0xC0,rem);// CPY #remaining
      bne('tail'+id);
    }
  }
  byte(0x78);              // SEI: freezes KERNAL IRQ while display is ours
  imm(0xA9,0x0B);abs(0x8D,0xD011); // disable display until copied
  copy(SOURCE,BITMAP,BMP_SIZE,'Bmp');
  copy(SOURCE+BMP_SIZE,SCREEN,SCREEN_SIZE,'Screen');
  copy(SOURCE+BMP_SIZE+SCREEN_SIZE,COLOR,COLOR_SIZE,'Color');
  // CIA2 bank 1 ($4000-$7FFF). Preserve serial bus bits.
  abs(0xAD,0xDD02);imm(0x09,0x03);abs(0x8D,0xDD02);
  abs(0xAD,0xDD00);imm(0x29,0xFC);imm(0x09,0x02);abs(0x8D,0xDD00);
  imm(0xA9,0x00);abs(0x8D,0xD015); // sprites off
  imm(0xA9,0x78);abs(0x8D,0xD018); // screen $5C00, bitmap $6000
  imm(0xA9,bg);abs(0x8D,0xD020);abs(0x8D,0xD021);
  imm(0xA9,0x18);abs(0x8D,0xD016); // multicolor + 40 columns
  imm(0xA9,0x3B);abs(0x8D,0xD011); // bitmap + display + 25 rows
  label('hold');jmp('hold');
  label('copyPages');
  imm(0xA0,0x00);label('copyPage');
  zp(0xB1,0xFB);zp(0x91,0xFD);
  byte(0xC8);bne('copyPage');
  zp(0xE6,0xFC);zp(0xE6,0xFE);
  byte(0xCA);bne('copyPage');
  byte(0x60); // RTS
  for(var i=0;i<fixups.length;i++){
    var fx=fixups[i],target=labels[fx.id];
    if(typeof target!=='number')throw new Error('Undefined 6502 label '+fx.id);
    if(fx.type==='absolute'){
      bytes[fx.pos]=target&255;bytes[fx.pos+1]=target>>8;
    }else{
      var offset=target-(CODE+fx.pos+1);
      if(offset< -128 || offset>127)throw new Error('6502 branch out of range: '+fx.id);
      bytes[fx.pos]=offset&255;
    }
  }
  if(CODE+bytes.length>=SOURCE)throw new Error('El código 6502 pisa los datos de imagen.');
  return new Uint8Array(bytes);
}
function buildPRG(data){
  if(!data||!data.bitmap||!data.screen||!data.color||
     data.bitmap.length!==8000||data.screen.length!==1000||data.color.length!==1000)
    throw new Error('TEST282: datos bitmap/screen/color incompletos.');
  var code=loader(data.bg&15);
  var end=SOURCE+BMP_SIZE+SCREEN_SIZE+COLOR_SIZE;
  var prg=new Uint8Array(2+(end-LOAD));
  prg[0]=LOAD&255;prg[1]=LOAD>>8;
  function idx(address){return 2+address-LOAD;}
  // BASIC 10 SYS2064, terminator, then code at $0810.
  var basic=[0x0B,0x08,0x0A,0x00,0x9E,0x32,0x30,0x36,0x34,0x00,0x00,0x00];
  prg.set(basic,idx(LOAD));
  prg.set(code,idx(CODE));
  prg.set(data.bitmap,idx(SOURCE));
  prg.set(data.screen,idx(SOURCE+BMP_SIZE));
  prg.set(data.color,idx(SOURCE+BMP_SIZE+SCREEN_SIZE));
  return prg;
}
function deliver(bytes,name){
  if(typeof window.download==='function'){
    window.download(bytes,name,'application/prg');return;
  }
  var obj=new Blob([bytes],{type:'application/octet-stream'}),
      url=URL.createObjectURL(obj),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  a.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function exportNow(options){
  var ed=currentEditor();
  try{
    var data=encodeLayer(ed),prg=buildPRG(data);
    var filename='RICO_TEST282_BITMAP_MC_FRAME'+(data.frame+1)+'.prg';
    var summary={status:'BUILT',filename:filename,bytes:prg.length,
      frame:data.frame+1,visible:'40x25',bg:data.bg,cropped:data.cropped,
      padded:data.padded,missingTiles:data.missingTiles,
      mode:'C64 MULTICOLOR BITMAP ($D011=$3B, $D016=$18, $D018=$78)'};
    state.last=summary;state.error=null;
    window.RICO_TEST282_LAST_EXPORT=summary;
    if(options&&options.download===false)return prg;
    deliver(prg,filename);
    state.exports++;
    updateStatus('PRG generado: '+filename+
      (data.cropped?' · Se exportaron solo las primeras 40×25 celdas del mapa.':''));
    console.log(TAG,summary);
    return prg;
  }catch(err){
    state.error=String(err&&err.message||err);
    console.error(TAG,err);
    updateStatus('ERROR: '+state.error);
    if(!(options&&options.silent)&&typeof window.alert==='function')window.alert('TEST282: '+state.error);
    return false;
  }
}
function updateStatus(message){
  var el=document.getElementById('rico282Status');
  if(el)el.textContent=message;
}
function button(id){
  var btn=document.createElement('button');btn.id=id;btn.type='button';
  btn.textContent='Exportar Bitmap MC .PRG';
  btn.title='TEST282: exporta la frame actual como imagen fija de 40x25 celdas, Bitmap Multicolor real para VICE';
  btn.style.cssText='font:bold 11px Arial;cursor:pointer;padding:5px 8px;border-radius:3px;'+
    'border:1px solid #87afce;background:#245a7c;color:white;';
  btn.addEventListener('click',function(ev){ev.preventDefault();exportNow();});
  return btn;
}
function mount(){
  var ed=currentEditor();
  // Keep the controls exclusively in the experimental mode.
  var visible=active(ed);
  var target=document.getElementById('rico280InkBar');
  if(target){
    if(!document.getElementById('rico282Export')){
      var holder=document.createElement('div');holder.id='rico282Holder';
      holder.style.cssText='margin-top:7px;border-top:1px solid #4a6273;padding-top:6px;';
      holder.appendChild(button('rico282Export'));
      var status=document.createElement('div');status.id='rico282Status';
      status.textContent='TEST282: PRG estático · sin animaciones ni scroll';
      status.style.cssText='font:10px Arial;color:#c7d6e0;margin-top:4px;';
      holder.appendChild(status);target.appendChild(holder);
    }
    document.getElementById('rico282Holder').style.display=visible?'block':'none';
  }
  var side=document.getElementById('rico279Panel');
  if(side){
    if(!document.getElementById('rico282ExportSide')){
      var b=button('rico282ExportSide');side.appendChild(b);
    }
    document.getElementById('rico282ExportSide').style.display=visible?'inline-block':'none';
  }
  return !!(target||side);
}
var oldMenuClick=typeof Editor!=='undefined'&&Editor.prototype&&Editor.prototype.menuClick;
if(typeof oldMenuClick==='function'&&!Editor.prototype.__rico282BitmapMenu){
  Editor.prototype.menuClick=function(id){
    if(id==='export-prg'&&active(this.textModeEditor))return exportNow();
    return oldMenuClick.apply(this,arguments);
  };
  Editor.prototype.__rico282BitmapMenu=true;
}
var oldSetScreen=TextModeEditor.prototype.setScreenMode;
TextModeEditor.prototype.setScreenMode=function(){
  var r=oldSetScreen.apply(this,arguments);
  window.setTimeout(mount,0);
  return r;
};
function ready(){mount();}
if(window.UI&&UI.on)UI.on('ready',ready);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
else ready();
window.RICO_TEST282_BITMAP={
  version:'TEST282',encode:encodeLayer,loader:loader,buildPRG:buildPRG,
  exportPRG:exportNow,active:function(){return active(currentEditor());},
  mount:mount,state:state,
  constants:{load:LOAD,code:CODE,payload:SOURCE,bitmap:BITMAP,screen:SCREEN,color:COLOR,
    d011:0x3B,d016:0x18,d018:0x78,dd00bank:2}
};
console.log(TAG,'real static Bitmap Multicolor C64 PRG exporter installed');
})();