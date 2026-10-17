(function(){
'use strict';
if(typeof Editor==='undefined'){console.error('[RICO TEST84 WINDOW] Editor missing');return;}
var FIELD='ricoWindowDimensionV1';
var FLAG='ricoLargeWindowDefault84';
function gridSize(g){var w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e){}return{width:Math.max(1,w|0),height:Math.max(1,h|0)};}
function isFull(c,s){return c&&((c.x|0)===0)&&((c.y|0)===0)&&((c.width|0)===s.width)&&((c.height|0)===s.height);}
function ensureDefault(editor){
  try{
    var t=editor&&editor.textModeEditor,g=t&&t.graphic;if(!g||!g.frames)return;
    var n=g.getCurrentFrame(),f=g.frames[n];if(!f)return;
    var s=gridSize(g);if(s.width<=40&&s.height<=25)return;
    if(f[FLAG]&&f[FLAG].width===s.width&&f[FLAG].height===s.height)return;
    var c=f[FIELD];
    if(!c||isFull(c,s)){
      f[FIELD]={version:1,x:0,y:0,width:Math.min(40,s.width),height:Math.min(25,s.height),clearOutside:false};
      f[FLAG]={version:1,width:s.width,height:s.height};
      try{g.invalidateAllCells();g.redraw({allCells:true});}catch(e2){}
      console.log('[RICO TEST84 WINDOW] Large Screen '+s.width+'x'+s.height+' -> default Window '+Math.min(40,s.width)+'x'+Math.min(25,s.height));
    }
  }catch(e){console.error('[RICO TEST84 WINDOW] default failed',e);}
}
var prev=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(menuItem){
  if(menuItem==='file-windowdimensions')ensureDefault(this);
  return prev.apply(this,arguments);
};
window.RICO_TEST84_LARGE_WINDOW_DEFAULT={defaultWidth:40,defaultHeight:25,nonDestructive:true,applyOnDimensionsOpen:true};
console.log('[RICO TEST84 WINDOW] Large maps default to C64 Window 40x25; Scroll Area remains untouched.');
})();
