/* RICO TEST174 — Block Copy/Paste in Tile Editor, compatible with BANK 1 and BANK 2.
 * Extends the existing Copy/Paste buttons, reuses native multi-character selection.
 * No source tiles are mutated until Paste; no exporter/raster changes.
 */
(function () {
  'use strict';
  if (typeof TileEditorGrid === 'undefined') return;

  var p = TileEditorGrid.prototype;
  var originalCopy = p.copyCharacter;
  var originalPaste = p.pasteCharacter;

  function gridOf(editorGrid) {
    return editorGrid.useCells
      ? (editorGrid.cells || []).map(function (row) { return row.map(function (cell) { return cell && cell.t; }); })
      : (editorGrid.characters || []);
  }
  function validTile(v, count) {
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < count;
  }
  function activeBank(editor) {
    try {
      var g = editor.graphic, f = g.getCurrentFrame();
      return +g.frames[f].charsetBank === 2 ? 2 : 1;
    } catch(e) { return 1; }
  }
  function maps(editor) {
    var a = [];
    try { if (editor.sideTilePalette && editor.sideTilePalette.tilePaletteDisplay) a.push(editor.sideTilePalette.tilePaletteDisplay); } catch(e) {}
    try { if (editor.tools && editor.tools.drawTools && editor.tools.drawTools.tilePalette) a.push(editor.tools.drawTools.tilePalette.tilePaletteDisplay); } catch(e) {}
    return a;
  }
  function findAnchor(map, target) {
    for (var y=0; y<map.length; ++y) {
      if (!map[y]) continue;
      for (var x=0; x<map[y].length; ++x) {
        if (map[y][x] === target) return {x:x, y:y};
      }
    }
    return null;
  }
  function paletteDestinations(editor, start, rows, cols, count) {
    var bank = activeBank(editor), all = maps(editor);
    for (var m=0; m<all.length; ++m) {
      var map = all[m] && all[m].charPaletteMap;
      if (!map || !map.length) continue;
      // Side dual-bank palettes represent BANK 2 with virtual indices 256..511.
      var a = findAnchor(map, start + (bank===2 && map.some(function(r){return r && r.some(function(v){return v>=256;});}) ? 256 : 0));
      if (!a) a = findAnchor(map,start);
      if (!a) continue;
      var out=[], good=true;
      var sourceVirtual = map[a.y][a.x] >= count;
      for (var y=0; y<rows && good; ++y) {
        var row=[];
        for (var x=0; x<cols; ++x) {
          var raw = map[a.y+y] && map[a.y+y][a.x+x];
          var virt = typeof raw==='number' && raw >= count;
          var id = virt ? raw-count : raw;
          if (!validTile(id,count) || virt!==sourceVirtual) {good=false;break;}
          row.push(id);
        }
        out.push(row);
      }
      if (good) return out;
    }
    // Native index order fallback if palette layout cannot be inspected.
    // Do not cross beyond the real charset.
    var width = 16, matrix=[];
    for (var yy=0; yy<rows; ++yy) {
      var dest=[];
      for (var xx=0; xx<cols; ++xx) {
        var offset = start + yy*width + xx;
        if ((start % width)+xx >= width || !validTile(offset,count)) return null;
        dest.push(offset);
      }
      matrix.push(dest);
    }
    return matrix;
  }
  function destinations(grid, src, editor, count) {
    if (!grid.length || !grid[0] || !grid[0].length) return null;
    if (grid.length >= src.rows && grid.every(function(r){return r && r.length>=src.cols;})) {
      var result=[];
      for(var y=0;y<src.rows;y++) {
        var row=[];
        for(var x=0;x<src.cols;x++) {
          if(!validTile(grid[y][x], count))return null;
          row.push(grid[y][x]);
        }
        result.push(row);
      }
      return result;
    }
    // A single selected destination means paste the whole block starting there.
    return paletteDestinations(editor, grid[0][0], src.rows, src.cols, count);
  }
  function clipboardPreview(grid, src) {
    try {
      if (!grid.clipboardCanvas) grid.clipboardCanvas=document.getElementById('tileEditorClipboard');
      var canvas=grid.clipboardCanvas;if(!canvas || !canvas.getContext) return;
      var realW=src.cols*src.charW, realH=src.rows*src.charH;
      var scale=Math.min(2,128/realW,128/realH);
      canvas.width=Math.max(1,Math.floor(realW*scale));
      canvas.height=Math.max(1,Math.floor(realH*scale));
      var ctx=canvas.getContext('2d'); if(!ctx)return;
      var pixels=ctx.createImageData(canvas.width,canvas.height);
      for(var y=0;y<canvas.height;y++)for(var x=0;x<canvas.width;x++) {
        var px=Math.floor(x*realW/canvas.width),py=Math.floor(y*realH/canvas.height);
        var row=src.tiles[Math.floor(py/src.charH)];
        var tile=row && row[Math.floor(px/src.charW)];
        var value=tile&&tile.pixels[(py%src.charH)*src.charW+(px%src.charW)];
        var n=(y*canvas.width+x)*4;
        pixels.data[n]=255; pixels.data[n+1]=255; pixels.data[n+2]=255;
        pixels.data[n+3]=value?255:0;
      }
      ctx.putImageData(pixels,0,0);
      grid.clipboardContext=ctx;grid.clipboardImageData=pixels;
      canvas.title=src.cols+' x '+src.rows+' caracteres copiados';
      canvas.style.maxWidth='64px';canvas.style.maxHeight='64px';
    } catch(e) { console.warn('[RICO TEST174] clipboard preview:',e); }
  }

  p.copyCharacter = function () {
    var selected=gridOf(this),rows=selected.length,cols=selected[0]&&selected[0].length||0;
    if(rows*cols<=1) {
      this.__ricoBlockClipboard174=null;
      return originalCopy.apply(this,arguments);
    }
    var tiles=[],charW=this.charWidth,charH=this.charHeight;
    for(var y=0;y<rows;y++) {
      if(!selected[y] || selected[y].length!==cols)return;
      var row=[];
      for(var x=0;x<cols;x++) {
        var tile=selected[y][x],pix=[];
        if (typeof tile !== 'number' || tile<0) {row.push(null);continue;}
        for(var py=0;py<charH;py++)for(var px=0;px<charW;px++) {
          pix.push(this.getPixel(x*charW+px,y*charH+py));
        }
        row.push({pixels:pix});
      }
      tiles.push(row);
    }
    this.__ricoBlockClipboard174={rows:rows,cols:cols,charW:charW,charH:charH,tiles:tiles};
    clipboardPreview(this,this.__ricoBlockClipboard174);
    console.log('[RICO TEST174] copied '+cols+' x '+rows+' tile block (pixels, without altering source).');
  };

  p.pasteCharacter = function () {
    var src=this.__ricoBlockClipboard174;
    if(!src)return originalPaste.apply(this,arguments);
    var editor=this.editor,ts=this.tileSet || (editor.tileSetManager&&editor.tileSetManager.getCurrentTileSet());
    if(!ts || !ts.getTileCount || this.charWidth!==src.charW || this.charHeight!==src.charH)return;
    var dst=destinations(gridOf(this),src,editor,ts.getTileCount());
    if(!dst) {
      console.warn('[RICO TEST174] select a destination where the entire '+src.cols+' x '+src.rows+' block fits. Nothing changed.');
      return false;
    }
    var history=editor.history,changed=0,started=false;
    try {
      if(history && history.startEntry) {history.startEntry('paste tile block '+src.cols+'x'+src.rows);started=true;}
      for(var y=0;y<src.rows;y++)for(var x=0;x<src.cols;x++){
        var tile=src.tiles[y][x];if(!tile)continue;
        var target=dst[y][x];
        for(var py=0;py<src.charH;py++)for(var px=0;px<src.charW;px++) {
          var value=tile.pixels[py*src.charW+px];
          if(ts.getPixel(target,px,py,this.frame)===value)continue;
          ts.setPixel(target,px,py,value,false,this.frame);changed++;
        }
      }
    } finally {
      if(started && history.endEntry)history.endEntry();
    }
    if(changed) {
      // The ordinary editor refreshes only the selected cell. A single anchor
      // may have received an entire 2D block; tell TEST38/TEST33 to refresh
      // every affected index, then restore the user's actual selection.
      var actualSelection=this.characters;
      try {
        this.characters=dst;
        this.updateCharacter();
      } catch(e) {
        console.warn('[RICO TEST174] redraw',e);
      } finally {
        this.characters=actualSelection;
      }
      try {if(this.editor.tileSetManager && this.editor.tileSetManager.getCurrentTileSet) this.editor.tileSetManager.getCurrentTileSet().modified();}catch(e){}
    }
    console.log('[RICO TEST174] pasted '+src.cols+' x '+src.rows+' tile block ('+changed+' pixel changes).');
    return true;
  };

  window.RICO_TEST174_BLOCK_CLIPBOARD={version:174,selects:'native TileEditorGrid.characters',paste:'rectangular grid or index anchor',sourceBankPreserved:true};
  console.log('[RICO TEST174] Tile Editor multi-character clipboard enabled.');
})();
