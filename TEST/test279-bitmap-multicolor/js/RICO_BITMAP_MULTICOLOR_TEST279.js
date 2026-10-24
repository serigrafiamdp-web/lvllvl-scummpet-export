/* TEST279 — Multicolor Bitmap experimental EDITOR mode (not PRG export).
 * Native C64 glyphs, maps and animation remain the edit source. The bitmap
 * preview paints each cell with BG shared, plus three LOCAL colors C1,C2,C3.
 * Each cell stores its own 12-bit C1/C2/C3 palette in frame.ricoBmpColors.
 * Native LVLLVL stays in c64multicolor internally to preserve tools and
 * timeline. Editor-set mode is exposed as a new SCREEN->Screen Mode option.
 * THIS DOES NOT CHANGE VIC-II HARDWARE BEHAVIOR OR ENABLE BITMAP PRG EXPORT.
 */
(function(){
'use strict';
var TAG='[RICO TEST279]',MODE='ricobitmapmulticolor';
if(typeof TextModeEditor==='undefined'||typeof LayerGrid==='undefined')return;
if(TextModeEditor.prototype.__rico279Installed)return;
var originalScreen=TextModeEditor.prototype.setScreenMode;
var originalInterface=TextModeEditor.prototype.setInterfaceScreenMode;
var originalDraw=LayerGrid.prototype.draw;
var originalCell=LayerGrid.prototype.setCell;
var htmlKey='html/textMode/screenModeDialog.html';
/* Install a native item in the actual SCREEN menu, not just in its dialog.
 * Editor.buildInterface creates the menu after the UI-ready event. Wrap
 * creation of that one MenuBar and its Screen menu, preserving all existing
 * menu IDs and handlers.
 */
if(typeof UI==='function' && typeof UI.create==='function' && !UI.__rico279ScreenItem) {
  var oldCreate=UI.create;
  UI.create=function(kind,args){
    var result=oldCreate.apply(this,arguments);
    if(kind==='UI.MenuBar'&&result&&typeof result.addMenu==='function'){
      var oldAddMenu=result.addMenu;
      result.addMenu=function(cfg){
        var menu=oldAddMenu.apply(this,arguments);
        if(cfg&&cfg.label==='Screen'&&menu&&typeof menu.addItem==='function'){
          var oldAddItem=menu.addItem;
          menu.addItem=function(item){
            var orig=oldAddItem.apply(this,arguments);
            if(item&&item.id==='mode-c64multicolor'){
              oldAddItem.call(this,{label:'Multicolor Bitmap (Experimental)',
                id:'mode-ricobitmapmulticolor'});
            }
            return orig;
          };
        }
        return menu;
      };
    }
    return result;
  };
  UI.__rico279ScreenItem=true;
}
if(typeof Editor!=='undefined'&&Editor.prototype&&
   typeof Editor.prototype.menuClick==='function'&&!Editor.prototype.__rico279Menu){
  var oldMenuClick=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(id){
    if(id==='mode-ricobitmapmulticolor'){
      var ed=this.textModeEditor;
      return ed&&ed.setScreenMode&&ed.setScreenMode(MODE);
    }
    return oldMenuClick.apply(this,arguments);
  };
  Editor.prototype.__rico279Menu=true;
}

var cache=window.g_htmlCache;
if(cache&&typeof cache[htmlKey]==='string'&&cache[htmlKey].indexOf('value="'+MODE+'"')<0){
  cache[htmlKey]=cache[htmlKey].replace('<option value="c64multicolor">C64 Multicolour</option>',
    '<option value="c64multicolor">C64 Multicolour</option>'+
    '<option value="'+MODE+'">Multicolor Bitmap (Experimental)</option>');
}
function layerOf(ed){
  try{return ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject()}catch(e){return null}
}
function enabled(layer){
  return !!(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled&&
    layer.getScreenMode&&layer.getScreenMode()==='c64multicolor');
}
function getBrush(ed){
  if(!ed.__ricoBitmapBrush) {
    var layer=layerOf(ed);
    ed.__ricoBitmapBrush={
      c1:((layer&&layer.getC64Multi1Color&&layer.getC64Multi1Color())||0)&15,
      c2:((layer&&layer.getC64Multi2Color&&layer.getC64Multi2Color())||0)&15,
      c3:(((ed.currentTile&&ed.currentTile.getColor&&ed.currentTile.getColor())||9)&7)
    };
  }
  return ed.__ricoBitmapBrush;
}
function pack(c1,c2,c3){return (c1&15)|((c2&15)<<4)|((c3&15)<<8);}
function seed(frame,layer){
  if(!frame)return null;
  var cells=frame.data||[],w=layer.getGridWidth(),h=layer.getGridHeight();
  if(!Array.isArray(frame.ricoBmpColors))frame.ricoBmpColors=[];
  var colors=frame.ricoBmpColors;
  var m1=layer.getC64Multi1Color?layer.getC64Multi1Color():0;
  var m2=layer.getC64Multi2Color?layer.getC64Multi2Color():0;
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      var i=y*w+x;
      if(typeof colors[i]!=='number') {
        var cell=cells[y]&&cells[y][x];
        colors[i]=pack(m1,m2,cell&&typeof cell.fc==='number'?cell.fc:1);
      }
    }
  }
  return colors;
}
function redraw(ed){
  if(!ed||!ed.graphic)return;
  if(ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();
  ed.graphic.redraw({allCells:true});
}
function setMode(ed,on){
  var layer=layerOf(ed);
  if(!layer||layer.getType()!=='grid')return false;
  if(on){
    if(!layer.doc)return false;
    layer.doc.ricoBitmapV1Enabled=true;
    // The native MC mode keeps edit tools and animation runtime alive.
    originalScreen.call(ed,'c64multicolor');
    for(var f=0;f<layer.frames.length;f++)seed(layer.frames[f],layer);
    getBrush(ed);
  } else {
    if(layer.doc)layer.doc.ricoBitmapV1Enabled=false;
    originalScreen.call(ed,'c64multicolor');
  }
  ed.modified&&ed.modified();
  redraw(ed);
  syncControls(ed);
  return true;
}
TextModeEditor.prototype.setScreenMode=function(mode){
  if(mode===MODE)return setMode(this,true);
  var layer=layerOf(this);
  if(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled)
    layer.doc.ricoBitmapV1Enabled=false;
  var result=originalScreen.apply(this,arguments);
  syncControls(this);
  return result;
};
TextModeEditor.prototype.setInterfaceScreenMode=function(mode){
  var result=originalInterface.apply(this,arguments);
  var layer=layerOf(this);
  if(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled&&mode!=='c64multicolor'){
    layer.doc.ricoBitmapV1Enabled=false;
  }
  // Native interface checks C64MULTICOLOR because the bitmap preview
  // intentionally shares editing tools. Show the actual experimental mode
  // selected in the SCREEN menu instead.
  try{
    if(typeof UI==='function'&&typeof UI.exists==='function'&&
       UI.exists('mode-ricobitmapmulticolor')){
      var custom=enabled(layerOf(this));
      UI('mode-ricobitmapmulticolor').setChecked(custom);
      if(custom&&UI.exists('mode-c64multicolor'))
        UI('mode-c64multicolor').setChecked(false);
    }
  }catch(e){console.warn(TAG,'menu checkmark:',e);}
  syncControls(this);
  return result;
};
function hexColor(palette,index){
  var n=palette.getHex(index&15);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
function raster(layer,args){
  if(!args||!args.canvas)return;
  var drawing=args.draw||'grid';
  if(drawing!=='grid'&&drawing!=='prevgrid')return;
  var frameIndex=typeof args.frame==='number'?args.frame:layer.currentFrame;
  var frame=layer.frames&&layer.frames[frameIndex];
  var palette=layer.getColorPalette&&layer.getColorPalette();
  var ts=layer.getTileSet&&layer.getTileSet();
  if(!frame||!palette||!ts||!ts.getData)return;
  var w=layer.getGridWidth(),h=layer.getGridHeight(),TW=8,TH=8;
  if(w*h>16000||!w||!h||args.canvas.width<w*TW||args.canvas.height<h*TH)return;
  var img=args.canvas.getContext('2d').createImageData(w*TW,h*TH),out=img.data;
  var data=frame.data,colors=seed(frame,layer),tiles=ts.getData();
  var bg=((layer.getBackgroundColor&&layer.getBackgroundColor(frameIndex))||0)&15;
  var rgb=new Array(16);
  for(var n=0;n<16;n++)rgb[n]=hexColor(palette,n);
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      var cell=data[y]&&data[y][x],code=cell&&cell.t;
      var tile=tiles&&tiles[code];
      var v=colors[y*w+x];
      var colorIds=[bg,v&15,(v>>4)&15,(v>>8)&15];
      var c0=rgb[colorIds[0]],c1=rgb[colorIds[1]],c2=rgb[colorIds[2]],c3=rgb[colorIds[3]];
      var palette4=[c0,c1,c2,c3];
      for(var py=0;py<8;py++){
        for(var px=0;px<4;px++){
          var bit=py*8+px*2;
          var pair=tile?((tile[bit]?2:0)|(tile[bit+1]?1:0)):0;
          var cc=palette4[pair];
          var i=((y*8+py)*(w*8)+x*8+px*2)*4;
          out[i]=out[i+4]=cc[0];
          out[i+1]=out[i+5]=cc[1];
          out[i+2]=out[i+6]=cc[2];
          out[i+3]=out[i+7]=255;
        }
      }
    }
  }
  args.canvas.getContext('2d').putImageData(img,0,0);
}
LayerGrid.prototype.draw=function(args){
  var result=originalDraw.apply(this,arguments);
  if(enabled(this)){
    try{raster(this,args)}catch(e){console.warn(TAG,'raster preview:',e)}
  }
  return result;
};
LayerGrid.prototype.setCell=function(args){
  var result=originalCell.apply(this,arguments);
  if(enabled(this)&&args&&Number.isInteger(args.x)&&Number.isInteger(args.y)&&
     args.x>=0&&args.y>=0&&args.x<this.getGridWidth()&&args.y<this.getGridHeight()){
    var f=Number.isInteger(args.frame)?args.frame:this.currentFrame;
    var frame=this.frames&&this.frames[f];
    if(frame){
      var c=seed(frame,this),ed=this.editor,b=getBrush(ed);
      var cell=frame.data[args.y]&&frame.data[args.y][args.x];
      // Color applies at the new painted cell, never across the whole map.
      if(cell&&cell.t===args.t)c[args.y*this.getGridWidth()+args.x]=pack(b.c1,b.c2,b.c3);
    }
  }
  return result;
};
function pickerColor(label,value) {
  var c=document.createElement('select');
  c.id='rico279'+label;
  c.title=label+' por celda; fondo global compartido';
  c.style.cssText='font:11px sans-serif;min-width:55px;max-width:88px;color:#ddd;background:#262a33;';
  for(var i=0;i<16;i++){
    var op=document.createElement('option');op.value=String(i);
    op.textContent=String(i);c.appendChild(op);
  }
  c.value=String(value);
  c.addEventListener('change',function(){
    var ed=window.g_app&&window.g_app.textModeEditor;
    if(!ed)return;
    getBrush(ed)[label]=Number(c.value)&15;
    syncControls(ed);
  });
  return c;
}
function syncControls(ed){
  var bar=document.getElementById('rico279Panel');
  if(!bar)return;
  ed=ed||(window.g_app&&window.g_app.textModeEditor);
  if(!ed)return;
  var layer=layerOf(ed),yes=enabled(layer),brush=getBrush(ed);
  var btn=document.getElementById('rico279Toggle');
  if(btn)btn.textContent=yes?'Bitmap MC ✓':'Activar Bitmap MC';
  var colors=document.getElementById('rico279Colors');
  if(colors)colors.style.display=yes?'inline-flex':'none';
  for(var k of ['c1','c2','c3']){
    var e=document.getElementById('rico279'+k);
    if(e)e.value=String(brush[k]);
  }
  var warn=document.getElementById('rico279Warning');
  if(warn)warn.textContent=yes?'Fondo compartido · PRG bitmap aún NO exporta':'SCREEN → Screen Mode → Bitmap Multicolor';
}
function mount(){
  if(document.getElementById('rico279Panel'))return true;
  var parent=document.getElementById('sidecharPalette'),
      holder=document.getElementById('sidetilePaletteHolder');
  if(!parent||!holder)return false;
  var panel=document.createElement('div');panel.id='rico279Panel';
  panel.style.cssText='position:absolute;top:43px;left:2px;right:2px;z-index:82;'+
    'padding:4px 6px;min-height:45px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;'+
    'font:11px sans-serif;color:#c8d9e4;background:#1f2833;border-bottom:1px solid #576878;';
  var toggle=document.createElement('button');toggle.id='rico279Toggle';toggle.type='button';
  toggle.style.cssText='font:11px sans-serif;background:#345b7c;color:#fff;border:1px solid #7194b8;cursor:pointer;padding:3px 6px;border-radius:3px;';
  toggle.textContent='Activar Bitmap MC';
  toggle.addEventListener('click',function(){
    var ed=window.g_app&&window.g_app.textModeEditor;
    if(ed)setMode(ed,!enabled(layerOf(ed)));
  });
  panel.appendChild(toggle);
  var colors=document.createElement('span');colors.id='rico279Colors';
  colors.style.cssText='display:none;gap:4px;align-items:center;flex-wrap:wrap;';
  var b={c1:1,c2:2,c3:3};
  for(var k of ['c1','c2','c3']){
    var label=document.createElement('span');label.textContent=k.toUpperCase()+':';colors.appendChild(label);
    colors.appendChild(pickerColor(k,b[k]));
  }
  var apply=document.createElement('button');apply.type='button';apply.textContent='Aplicar celda';
  apply.style.cssText='font:10px sans-serif;background:#3e5941;color:#fff;border:1px solid #6a936e;cursor:pointer;';
  apply.addEventListener('click',function(){
    var ed=window.g_app&&window.g_app.textModeEditor,l=layerOf(ed);
    if(!enabled(l))return;
    var p=ed.grid&&ed.grid.grid2d&&ed.grid.grid2d.cursor&&ed.grid.grid2d.cursor.position;
    if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||
       p.x>=l.getGridWidth()||p.y>=l.getGridHeight())return;
    var c=seed(l.frames[l.currentFrame],l),b=getBrush(ed);
    c[p.y*l.getGridWidth()+p.x]=pack(b.c1,b.c2,b.c3);
    ed.modified&&ed.modified();redraw(ed);
  });
  colors.appendChild(apply);panel.appendChild(colors);
  var warning=document.createElement('span');warning.id='rico279Warning';
  warning.style.cssText='font-size:10px;color:#aebfc9;';panel.appendChild(warning);
  parent.appendChild(panel);
  holder.style.setProperty('top','98px','important');
  syncControls(window.g_app&&window.g_app.textModeEditor);
  return true;
}
var nativeShowDialog=TextModeEditor.prototype.showScreenModeDialog;
if(typeof nativeShowDialog==='function') {
  TextModeEditor.prototype.showScreenModeDialog=function(){
    var result=nativeShowDialog.apply(this,arguments);
    var ed=this;
    // HTML panel loads asynchronously. Native dialog reads the select value.
    setTimeout(function(){
      var select=document.getElementById('screenModeDialogMode');
      if(select&&enabled(layerOf(ed)))select.value=MODE;
    },0);
    return result;
  };
}
// The Tiles sidebar is built by the editor during UI-ready. The first
// callback can run before its DOM exists. Retry briefly until it is mounted.
var mountTries=0;
function ensureMounted(){
  if(mount())return;
  if(mountTries++<35)setTimeout(ensureMounted,100);
}
if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',ensureMounted);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureMounted);
else ensureMounted();
if(typeof ImportC64Formats!=='undefined'&&ImportC64Formats.prototype){
  var originalImport=ImportC64Formats.prototype.importPrg;
  ImportC64Formats.prototype.importPrg=function(){
    var r=originalImport.apply(this,arguments);
    if(r===true)mount();
    return r;
  };
}
TextModeEditor.prototype.__rico279Installed=true;
window.RICO_TEST279_BITMAP={
  mode:MODE,activate:function(){var ed=window.g_app&&window.g_app.textModeEditor;return ed&&setMode(ed,true)},
  active:function(){return enabled(layerOf(window.g_app&&window.g_app.textModeEditor))},
  pack:pack,seed:seed,render:raster
};
console.log(TAG,'Bitmap MC editor mode installed (experimental, NOT PRG export).');
})();