/* TEST280 — Bitmap MC: correct per-cell canvas paint and visible Tile Editor inks.
 * Non-destructive additive patch atop TEST279. No PRG/ASM changes.
 */
(function () {
  'use strict';
  var TAG='[RICO TEST280]', MODE='c64multicolor';
  if (!window.RICO_TEST279_BITMAP || !window.LayerGrid || !window.TextModeEditor) {
    console.warn(TAG,'requires TEST279');return;
  }
  if (LayerGrid.prototype.__rico280) return;
  function edNow(){return window.g_app && window.g_app.textModeEditor;}
  function layerOf(ed){try{return ed.layers.getSelectedLayerObject();}catch(e){return null;}}
  function active(l){return !!(l && l.doc && l.doc.ricoBitmapV1Enabled && l.getScreenMode()===MODE);}
  function brush(ed){
    if (!ed.__ricoBitmapBrush) ed.__ricoBitmapBrush={c1:1,c2:2,c3:3};
    return ed.__ricoBitmapBrush;
  }
  function pack(b){return (b.c1&15)|((b.c2&15)<<4)|((b.c3&15)<<8);}
  function paletteRGB(p, id) {
    var n=p.getHex(id&15);
    return [(n>>>16)&255,(n>>>8)&255,n&255];
  }
  var debug={draws:0,paintedCells:0,skips:0,last:''};
  // Render exactly the portion of the layer canvas that exists. TEST279
  // returned early on large maps whenever canvas.height < mapHeight*8.
  function paintLayer(l,args) {
    if (!args || !args.canvas || (args.draw && args.draw!=='grid' && args.draw!=='prevgrid')) return;
    var canvas=args.canvas, ctx=canvas.getContext('2d');
    var f=Number.isInteger(args.frame)?args.frame:l.currentFrame;
    var frame=l.frames && l.frames[f], ts=l.getTileSet&&l.getTileSet();
    var pal=l.getColorPalette&&l.getColorPalette();
    if (!frame || !frame.data || !pal || !ts) return;
    var tileWidth=ts.getTileWidth(),tileHeight=ts.getTileHeight();
    if (tileWidth!==8 || tileHeight!==8) { debug.skips++;debug.last='requires 8x8 tiles';return; }
    var mw=l.getGridWidth(),mh=l.getGridHeight();
    var cw=Math.min(canvas.width,mw*8), ch=Math.min(canvas.height,mh*8);
    if (cw<8 || ch<8) return;
    var maxX=Math.min(mw,Math.floor(cw/8)),maxY=Math.min(mh,Math.floor(ch/8));
    var pixels=ctx.getImageData(0,0,cw,ch),out=pixels.data;
    var colors=window.RICO_TEST279_BITMAP.seed(frame,l);
    var patterns=ts.getData(),bg=l.getBackgroundColor(f)&15;
    var rgb=new Array(16);
    for(var n=0;n<16;n++)rgb[n]=paletteRGB(pal,n);
    for(var y=0;y<maxY;y++)for(var x=0;x<maxX;x++){
      var cell=frame.data[y]&&frame.data[y][x],code=cell&&cell.t;
      var bits=patterns && patterns[code],value=colors[y*mw+x];
      var inks=[rgb[bg],rgb[value&15],rgb[(value>>4)&15],rgb[(value>>8)&15]];
      for(var py=0;py<8;py++)for(var px=0;px<4;px++){
        var ofs=py*8+px*2, pair=bits?((bits[ofs]?2:0)|(bits[ofs+1]?1:0)):0;
        var ink=inks[pair], i=((y*8+py)*cw+x*8+px*2)*4;
        out[i]=out[i+4]=ink[0];
        out[i+1]=out[i+5]=ink[1];
        out[i+2]=out[i+6]=ink[2];
        out[i+3]=out[i+7]=255;
      }
    }
    ctx.putImageData(pixels,0,0);
    debug.draws++;debug.paintedCells=maxX*maxY;debug.last=cw+'x'+ch+' / '+mw+'x'+mh;
  }
  var baseDraw=LayerGrid.prototype.draw;
  LayerGrid.prototype.draw=function(args){
    var r=baseDraw.apply(this,arguments);
    if(active(this)){try{paintLayer(this,args)}catch(e){debug.last='error: '+e;console.warn(TAG,'canvas paint',e);}}
    return r;
  };
  var pending=false;
  function redraw(ed){
    if(!ed || pending)return;
    pending=true;
    var raf=window.requestAnimationFrame||function(fn){setTimeout(fn,0);};
    raf(function(){
      pending=false;
      try{
        if(ed.graphic && active(layerOf(ed))){
          ed.graphic.invalidateAllCells();
          ed.graphic.redraw({allCells:true});
        }
      }catch(e){console.warn(TAG,'redraw',e);}
    });
  }
  // Even when native setCell returns early for the same character/FC,
  // change the local bitmap palette and invalidate the canvas.
  var baseCell=LayerGrid.prototype.setCell;
  LayerGrid.prototype.setCell=function(args){
    var f=args&&Number.isInteger(args.frame)?args.frame:this.currentFrame;
    var x=args&&args.x,y=args&&args.y;
    var valid=active(this)&&Number.isInteger(x)&&Number.isInteger(y)&&
       x>=0&&y>=0&&x<this.getGridWidth()&&y<this.getGridHeight()&&
       f>=0&&f<this.frames.length;
    var r=baseCell.apply(this,arguments);
    if(valid){
      var row=this.frames[f].data[y],cell=row&&row[x];
      if(cell&&cell.t===args.t){
        var colors=window.RICO_TEST279_BITMAP.seed(this.frames[f],this);
        var index=y*this.getGridWidth()+x,next=pack(brush(this.editor));
        if(colors[index]!==next){
          colors[index]=next;
          if(this.editor.modified)this.editor.modified();
          redraw(this.editor);
        }
      }
    }
    return r;
  };
  // Recolor the *glyph editor preview* with the same 00/BG, 01/C1,
  // 10/C2, 11/C3 mapping as the document bitmap, including C3=8..15.
  if(window.TileEditorGrid && TileEditorGrid.prototype.drawTileCanvas) {
    var nativeGlyphDraw=TileEditorGrid.prototype.drawTileCanvas;
    TileEditorGrid.prototype.drawTileCanvas=function(){
      var result=nativeGlyphDraw.apply(this,arguments),ed=this.editor,l=layerOf(ed);
      if(!active(l)||!this.characterCanvas||!this.characterContext)return result;
      try{
        var ts=ed.tileSetManager.getCurrentTileSet(),p=l.getColorPalette();
        if(!ts || ts.getTileWidth()!==8||ts.getTileHeight()!==8)return result;
        var all=ts.getData(), b=brush(ed),rgb=new Array(16);
        for(var i=0;i<16;i++)rgb[i]=paletteRGB(p,i);
        var inks=[rgb[l.getBackgroundColor()&15],rgb[b.c1&15],rgb[b.c2&15],rgb[b.c3&15]];
        var w=this.characterCanvas.width,h=this.characterCanvas.height,
            img=this.characterContext.getImageData(0,0,w,h),a=img.data;
        for(var ty=0;ty<this.charsDown;ty++)for(var tx=0;tx<this.charsAcross;tx++){
          var ch=this.useCells?(this.cells[ty]&&this.cells[ty][tx]&&this.cells[ty][tx].t):
             (this.characters[ty]&&this.characters[ty][tx]);
          var pixels=all && all[ch]; if(!pixels)continue;
          for(var py=0;py<8;py++)for(var px=0;px<4;px++){
            var z=py*8+px*2,v=(pixels[z]?2:0)|(pixels[z+1]?1:0),c=inks[v],
                xx=tx*8+px*2,yy=ty*8+py;
            if(xx+1>=w||yy>=h)continue;
            var j=(yy*w+xx)*4;
            a[j]=a[j+4]=c[0];a[j+1]=a[j+5]=c[1];
            a[j+2]=a[j+6]=c[2];a[j+3]=a[j+7]=255;
          }
        }
        this.characterContext.putImageData(img,0,0);
      }catch(e){console.warn(TAG,'glyph preview',e);}
      return result;
    };
  }
  function applyAtCursor(ed){
    var l=layerOf(ed);if(!active(l))return;
    var p=ed.grid&&ed.grid.grid2d&&ed.grid.grid2d.cursor&&ed.grid.grid2d.cursor.position;
    if(!p || !Number.isInteger(p.x)||!Number.isInteger(p.y)||
       p.x<0||p.y<0||p.x>=l.getGridWidth()||p.y>=l.getGridHeight())return;
    var f=l.frames[l.currentFrame],colors=window.RICO_TEST279_BITMAP.seed(f,l);
    colors[p.y*l.getGridWidth()+p.x]=pack(brush(ed));
    if(ed.modified)ed.modified();
    redraw(ed);
  }
  function updatePreview(ed){
    try{
      if(ed.tileEditor && ed.tileEditor.tileEditorGrid)ed.tileEditor.tileEditorGrid.draw();
      if(ed.currentTile)ed.currentTile.refresh();
    }catch(e){console.warn(TAG,'preview',e);}
  }
  function openPicker(key,swatch,event) {
    var ed=edNow(),l=ed&&layerOf(ed);if(!active(l))return;
    var b=brush(ed);
    var now=key==='bg'?(l.getBackgroundColor()&15):b[key];
    ed.colorPaletteManager.showColorPicker(event.pageX,event.pageY,{
      currentColor:now,
      colorPickedCallback:function(value){
        var num=Number(value);
        if(!Number.isInteger(num)||num<0||num>15)return;
        if(key==='bg')ed.setBackgroundColor(num);
        else b[key]=num;
        refreshUI();updatePreview(ed);redraw(ed);
      }
    });
  }
  function refreshUI(){
    var ed=edNow(),l=ed&&layerOf(ed),yes=active(l),bar=document.getElementById('rico280InkBar');
    if(bar)bar.style.display=yes?'block':'none';
    if(!bar||!yes)return;
    var b=brush(ed),p=l.getColorPalette();
    ['bg','c1','c2','c3'].forEach(function(k){
      var v=k==='bg'?(l.getBackgroundColor()&15):b[k];
      var el=document.getElementById('rico280-'+k),hex=p.getHexString(v);
      if(el){el.style.backgroundColor='#'+hex;el.title=k.toUpperCase()+' = '+v;el.dataset.color=v;}
      var label=document.getElementById('rico280-value-'+k);
      if(label)label.textContent=String(v);
    });
    // The native controls do not describe per-cell bitmap colours.
    // Keep native draw tools internally but hide only these misleading swatches.
    var natives=document.querySelectorAll('#tileEditorC64Colors');
    for(var i=0;i<natives.length;i++)if(natives[i].parentElement && natives[i].parentElement.id==='tileEditor')natives[i].style.display='none';
  }
  function mount(){
    if(document.getElementById('rico280InkBar')){refreshUI();return true;}
    var anchor=document.getElementById('tileEditorCanvasHolder');
    if(!anchor||!anchor.parentNode)return false;
    var bar=document.createElement('div');
    bar.id='rico280InkBar';
    bar.style.cssText='display:none;margin:6px 7px 3px;padding:7px 8px;background:#202a33;color:#eee;border:1px solid #637381;border-radius:3px;font:11px Arial,sans-serif;';
    var header=document.createElement('div');
    header.textContent='BITMAP MULTICOLOR · Fondo global / C1-C3 por celda';
    header.style.cssText='font-weight:bold;margin-bottom:6px;font-size:11px;';
    bar.appendChild(header);
    var strip=document.createElement('div');strip.style.cssText='display:flex;gap:6px;flex-wrap:wrap;';
    [['bg','BG'],['c1','C1'],['c2','C2'],['c3','C3']].forEach(function(item){
      var key=item[0],wrap=document.createElement('div');wrap.style.cssText='display:flex;align-items:center;gap:3px;';
      var name=document.createElement('span');name.textContent=item[1];wrap.appendChild(name);
      var swatch=document.createElement('button');swatch.type='button';swatch.id='rico280-'+key;
      swatch.style.cssText='width:23px;height:22px;border:1px solid #e2e2e2;cursor:pointer;padding:0;';
      swatch.addEventListener('click',function(e){openPicker(key,swatch,e);});
      wrap.appendChild(swatch);
      var v=document.createElement('span');v.id='rico280-value-'+key;v.style.minWidth='12px';wrap.appendChild(v);
      strip.appendChild(wrap);
    });
    bar.appendChild(strip);
    var apply=document.createElement('button');apply.type='button';
    apply.textContent='Aplicar C1-C3 a la celda del cursor';
    apply.style.cssText='margin-top:6px;background:#3e5941;color:white;border:1px solid #78a17b;font:11px Arial;cursor:pointer;padding:4px;';
    apply.addEventListener('click',function(){applyAtCursor(edNow());});
    bar.appendChild(apply);
    anchor.parentNode.insertBefore(bar,anchor.nextSibling);
    refreshUI();return true;
  }
  var oldInterface=TextModeEditor.prototype.setInterfaceScreenMode;
  TextModeEditor.prototype.setInterfaceScreenMode=function(){
    var r=oldInterface.apply(this,arguments);
    window.setTimeout(function(){mount();refreshUI();},0);
    return r;
  };
  var oldSetMode=TextModeEditor.prototype.setScreenMode;
  TextModeEditor.prototype.setScreenMode=function(){
    var r=oldSetMode.apply(this,arguments);
    window.setTimeout(function(){mount();refreshUI();},0);
    return r;
  };
  // Tiles editor HTML is loaded asynchronously, so a short retry is necessary.
  var tries=0;
  function ready(){if(!mount()&&tries++<70)window.setTimeout(ready,120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
  else ready();
  if(window.UI&&UI.on)UI.on('ready',ready);
  LayerGrid.prototype.__rico280=true;
  window.RICO_TEST280_BITMAP={
    version:'TEST280',debug:debug,refresh:refreshUI,render:paintLayer,
    recolorCursor:function(){applyAtCursor(edNow());},active:function(){return active(layerOf(edNow()));}
  };
  console.log(TAG,'per-cell bitmap paint and dedicated Tile Editor swatches installed');
})();