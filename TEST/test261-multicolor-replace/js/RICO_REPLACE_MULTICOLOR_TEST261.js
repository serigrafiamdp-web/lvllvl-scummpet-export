/* TEST261 — Replace Color: C64 multicolor channels + selected area.
 * Native LVLLVL edit/replace handles FC/BC only. MC needs 4 distinct
 * hardware channels: BG, shared MC1/MC2, cell foreground (color RAM bit3).
 * "Only selection" supports cell colors. Shared VIC registers are always
 * whole-frame; never change them secretly while selection scope is active.
 * No tileData edits, no charset repacking, no PRG engine modifications.
 */
(function(){
'use strict';
if(typeof ReplaceColorDialog==='undefined'||!ReplaceColorDialog.prototype)return;
var P=ReplaceColorDialog.prototype;
if(P.__rico261Installed)return;
var oldInit=P.initContent,oldShow=P.show,oldReplace=P.doReplaceColor;
function byId(id){return typeof document!=='undefined'?document.getElementById(id):null;}
function val(id,defaultValue){var x=byId(id);return x?x.value:defaultValue;}
function checked(id,defaultValue){var x=byId(id);return x?!!x.checked:defaultValue;}
function layerOf(d){try{return d.editor.layers.getSelectedLayerObject();}catch(e){return null;}}
function isMC(d){var layer=layerOf(d);try{return !!(layer&&layer.getScreenMode() === 'c64multicolor');}catch(e){return false;}}
function selectionOf(d){
 var obj=d.editor&&d.editor.tools&&d.editor.tools.drawTools&&d.editor.tools.drawTools.select;
 if(!obj||typeof obj.getSelection!=='function')return null;
 var s=obj.getSelection();
 if(!s||!s.visible||!(s.maxX>s.minX&&s.maxY>s.minY))return null;
 return s;
}
function labelFor(id,text){
 var elem=byId(id);if(!elem||!elem.closest)return;
 var label=elem.closest('label');if(!label)return;
 for(var p=label.firstChild;p;p=p.nextSibling){
   if(p.nodeType===3&&p.nodeValue.trim()){
     p.nodeValue=text+' ';return;
   }
 }
}
function updateUi(d){
 var mc=isMC(d),scope=byId('rico261Scope'),selection=selectionOf(d);
 var wrap=byId('rico261Controls'),extra=byId('rico261MCExtra'),swap=byId('rico261Swap');
 if(!wrap)return;
 if(scope){
   var opt=scope.querySelector('option[value="selection"]');
   if(opt)opt.disabled=!selection;
   if(!selection&&scope.value==='selection')scope.value='area';
 }
 if(extra)extra.style.display=mc?'block':'none';
 labelFor('replaceColorFG',mc?'Color 3 (celda Multicolor)':'Cell FG Colour');
 labelFor('replaceColorBG',mc?'Fondo compartido (frame)':'Cell BG Colour');
 var globalEnabled=!!(mc&&scope&&scope.value!=='selection');
 var bg=byId('replaceColorBG'),a=byId('rico261Multi1'),b=byId('rico261Multi2');
 if(bg){bg.disabled=mc&&!globalEnabled; bg.checked=mc? (globalEnabled&&d.__rico261LastBG!==false):bg.checked;}
 for(var input of [a,b])if(input){input.disabled=!globalEnabled;}
 var note=byId('rico261Hint');
 if(note){
  note.textContent=mc?
   (globalEnabled?'Multicolor: reemplaza Fondo, Color 1, Color 2 y Color 3 (celda) según las casillas. El Color 3 usa solo los 8 tonos 0–7 del C64.':
    'Solo selección: cambia el Color 3 de las celdas seleccionadas. Fondo/Colores 1 y 2 son compartidos por todo el frame y no se modificarán.') :
   'En selección solo se reemplazan colores de las celdas dentro del marco.';
 }
}
function buildUI(d){
 if(byId('rico261Controls')){updateUi(d);return;}
 var panel=byId('replaceColorPanel');
 if(!panel)return;
 var wrap=document.createElement('div');
 wrap.id='rico261Controls';
 wrap.style.cssText='font:12px Arial,sans-serif;margin:4px 0 0;padding:4px 0;border-top:1px solid #555;line-height:19px;';
 wrap.innerHTML=
  '<label style="display:block;margin-bottom:5px">Alcance: <select id="rico261Scope" style="margin-left:6px;padding:2px;background:#242424;color:white;border:1px solid #777">'+
  '<option value="area">Área de trabajo completa</option><option value="selection">Solo selección</option></select></label>'+
  '<div id="rico261MCExtra" style="margin-top:3px">'+
  '<label style="display:block"><input type="checkbox" id="rico261Multi1" checked> Color 1 compartido (Multicolor 1)</label>'+
  '<label style="display:block"><input type="checkbox" id="rico261Multi2" checked> Color 2 compartido (Multicolor 2)</label>'+
  '</div>'+
  '<label style="display:block;margin-top:3px"><input type="checkbox" id="rico261Swap"> Intercambiar A ↔ B (en vez de reemplazar A por B)</label>'+
  '<div id="rico261Hint" style="font-size:11px;line-height:14px;color:#b6bfcd;margin-top:5px"></div>';
 panel.appendChild(wrap);
 panel.style.overflowY='auto';
 panel.style.overflowX='hidden';
 panel.style.boxSizing='border-box';
 var sel=byId('rico261Scope');
 if(sel)sel.addEventListener('change',function(){updateUi(d);});
 updateUi(d);
}
P.initContent=function(){
 var result=oldInit.apply(this,arguments);
 buildUI(this);
 return result;
};
P.show=function(){
 var result=oldShow.apply(this,arguments),self=this;
 // HTMLPanel.load is async only on first show.
 if(typeof setTimeout==='function')setTimeout(function(){updateUi(self);},0);
 return result;
};
function changedValue(current,from,to,swap){
 if(swap){if(current===from)return to;if(current===to)return from;}
 else if(current===from)return to;
 return current;
}
function repaint(ed){
 try{if(typeof ed.updateC64MultiColorPickers==='function')ed.updateC64MultiColorPickers();}catch(e){}
 try{if(typeof ed.updateBackgroundColorPicker==='function')ed.updateBackgroundColorPicker();}catch(e){}
 try{if(typeof ed.modified==='function')ed.modified();}catch(e){}
 try{if(ed.graphic&&ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();}catch(e){}
 try{if(ed.graphic&&ed.graphic.redraw)ed.graphic.redraw({allCells:true});}catch(e){}
 try{if(ed.sideTilePalette&&ed.sideTilePalette.tilePaletteDisplay)
   ed.sideTilePalette.tilePaletteDisplay.draw({redrawTiles:true});}catch(e){}
}
function registerActual(layer,index,field){
 var obj=layer.frames&&layer.frames[index];
 if(!obj)return undefined;
 if(typeof obj[field]==='number')return obj[field];
 try{
  if(field==='bgColor')return layer.getBackgroundColor(index);
  if(field==='c64Multi1Color')return layer.getC64Multi1Color(index);
  if(field==='c64Multi2Color')return layer.getC64Multi2Color(index);
 }catch(e){}
 return undefined;
}
function applyRegister(ed,params,redo){
 var layer=ed.layers&&ed.layers.getLayerObjectFromRef&&ed.layers.getLayerObjectFromRef(params.layerRef);
 if(!layer&&ed.layers&&ed.layers.getSelectedLayerObject)layer=ed.layers.getSelectedLayerObject();
 if(!layer||!layer.frames||!layer.frames[params.frame])return;
 var frame=layer.frames[params.frame];
 if(redo)frame[params.key]=params.newColor;
 else if(params.hadOld)frame[params.key]=params.oldColor;
 else delete frame[params.key];
}
function apply(d){
 d.readSettings();
 var ed=d.editor,layer=layerOf(d),mc=isMC(d);
 if(!layer||layer.getType&&layer.getType()!=='grid')return false;
 var selectionMode=val('rico261Scope','area')==='selection';
 var selection=selectionMode?selectionOf(d):null;
 if(selectionMode&&!selection)return false;
 var total=ed.graphic.getFrameCount(),current=ed.graphic.getCurrentFrame();
 var begin=d.frames==='current'?current:0,end=d.frames==='current'?current+1:total;
 var width=layer.getGridWidth(),height=layer.getGridHeight();
 var x0=selection?Math.max(0,selection.minX):0,y0=selection?Math.max(0,selection.minY):0;
 var x1=selection?Math.min(width,selection.maxX):width,y1=selection?Math.min(height,selection.maxY):height;
 var oldColor=d.replaceColor,newColor=d.replaceWithColor;
 if(!Number.isInteger(oldColor)||!Number.isInteger(newColor)||oldColor<0||oldColor>15||newColor<0||newColor>15)return false;
 var swap=checked('rico261Swap',false),fg=d.replaceFG,bg=d.replaceBG;
 var multi1=mc&&!selectionMode&&checked('rico261Multi1',true);
 var multi2=mc&&!selectionMode&&checked('rico261Multi2',true);
 var sharedBg=mc&&!selectionMode&&bg;
 var cellBg=!mc&&bg,cellFg=fg;
 var history=ed.history,actions=0,started=false;
 try{
  for(var frameIndex=begin;frameIndex<end;frameIndex++){
   if(frameIndex<0||frameIndex>=layer.frames.length)continue;
   if(!started){history.startEntry('Replace Color (Multicolor/Selection)');started=true;}
   for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){
    var cell=layer.getCell({x:x,y:y,frame:frameIndex});
    if(!cell)continue;
    var args=null;
    if(cellFg&&Number.isInteger(cell.fc)){
      // Preserve deliberately Hi-Res cells even in an MC screen.
      if(mc&&cell.fc>=8){
       var before=cell.fc&7,after=changedValue(before,oldColor&7,newColor&7,swap);
       if(after!==before){args=Object.assign({},cell,{fc:(after&7)|8});}
      }else if(!mc){
       var afterFG=changedValue(cell.fc,oldColor,newColor,swap);
       if(afterFG!==cell.fc)args=Object.assign({},cell,{fc:afterFG});
      }
    }
    if(cellBg&&Number.isInteger(cell.bc)){
      var afterBG=changedValue(cell.bc,oldColor,newColor,swap);
      if(afterBG!==cell.bc){args=args||Object.assign({},cell);args.bc=afterBG;}
    }
    if(args){
      args.x=x;args.y=y;args.frame=frameIndex;
      layer.setCell(args);actions++;
    }
   }
   if(!mc||selectionMode)continue;
   var slots=[['bgColor',sharedBg],['c64Multi1Color',multi1],['c64Multi2Color',multi2]];
   for(var slot of slots){
    if(!slot[1])continue;
    var key=slot[0],actual=registerActual(layer,frameIndex,key);
    if(!Number.isInteger(actual))continue;
    var afterReg=changedValue(actual,oldColor,newColor,swap);
    if(afterReg===actual)continue;
    var record=layer.frames[frameIndex];
    var action={layerRef:layer.layerRef,frame:frameIndex,key:key,
      hadOld:Object.prototype.hasOwnProperty.call(record,key),
      oldColor:record[key],newColor:afterReg};
    record[key]=afterReg;
    history.addAction('rico261MultiRegister',action);actions++;
   }
  }
 }finally{if(started)history.endEntry();}
 if(actions)repaint(ed);
 window.RICO_TEST261_LAST_RESULT={actions:actions,scope:selectionMode?'selection':'area',multicolor:mc,frames:end-begin,swapped:swap};
 return actions>0;
}
P.doReplaceColor=function(){
 var mc=isMC(this),selection=val('rico261Scope','area')==='selection';
 if(!mc&&!selection&& !checked('rico261Swap',false))
  return oldReplace.apply(this,arguments);
 return apply(this);
};
// Teach native Undo/Redo how to restore 2-bit shared-register edits.
if(typeof History!=='undefined'&&History.prototype&&!History.prototype.__rico261MultiUndo){
 var Hp=History.prototype,oldUndo=Hp.undo,oldRedo=Hp.redo;
 function regs(entry){
   if(!entry||!entry.actions)return [];
   return entry.actions.filter(function(a){return a.name==='rico261MultiRegister';});
 }
 Hp.undo=function(){
   var entry=regs(this.history&&this.history[this.historyPosition-1]),ed=this.editor;
   var result=oldUndo.apply(this,arguments);
   if(entry.length){for(var i=entry.length-1;i>=0;i--)applyRegister(ed,entry[i].params,false);repaint(ed);}
   return result;
 };
 Hp.redo=function(){
   var entry=regs(this.history&&this.history[this.historyPosition]),ed=this.editor;
   var result=oldRedo.apply(this,arguments);
   if(entry.length){for(var i=0;i<entry.length;i++)applyRegister(ed,entry[i].params,true);repaint(ed);}
   return result;
 };
 Hp.__rico261MultiUndo=true;
}
P.__rico261Installed=true;
window.RICO_TEST261_REPLACE={replace:apply,changedValue:changedValue,selectionOf:selectionOf};
console.log('[RICO TEST261] Edit Replace Color: full canvas or selection, MC1/MC2/BG/Cell3, swap and Undo');
})();