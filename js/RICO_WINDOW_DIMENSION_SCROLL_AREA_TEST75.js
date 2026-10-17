(function(){
'use strict';
if(typeof Editor==='undefined'||typeof Graphic==='undefined'){console.error('[RICO TEST75] Window/Scroll Area dependencies missing');return;}
var FIELD_WINDOW='ricoWindowDimensionV1';
var FIELD_SCROLL='ricoScrollAreaV1';

function clamp(v,a,b,d){v=parseInt(v,10);return isNaN(v)?d:Math.max(a,Math.min(b,v));}
function frameObj(g,n){if(!g||!g.frames)return null;if(typeof n==='undefined')n=g.getCurrentFrame();return n>=0&&n<g.frames.length?g.frames[n]:null;}
function gridSize(g){
  var w=40,h=25;
  try{w=g.getGridWidth();h=g.getGridHeight();}catch(e){
    try{w=Math.round(g.getGraphicWidth()/8);h=Math.round(g.getGraphicHeight()/8);}catch(e2){}
  }
  return{width:Math.max(1,w|0),height:Math.max(1,h|0)};
}
function cleanRect(g,c){
  var s=gridSize(g);c=c||{};
  var x=clamp(c.x,0,s.width-1,0),y=clamp(c.y,0,s.height-1,0);
  var width=clamp(c.width,1,s.width-x,s.width-x);
  var height=clamp(c.height,1,s.height-y,s.height-y);
  return{version:1,x:x,y:y,width:width,height:height,clearOutside:false};
}
function getWindowCfg(g,n){var f=frameObj(g,n);return cleanRect(g,f&&f[FIELD_WINDOW]?f[FIELD_WINDOW]:null);}
function getScrollCfg(g,n){var f=frameObj(g,n);return cleanRect(g,f&&f[FIELD_SCROLL]?f[FIELD_SCROLL]:null);}
function setRect(g,n,field,c){
  var f=frameObj(g,n);if(!f)return;
  f[field]=cleanRect(g,c);
  try{g.invalidateAllCells();g.redraw({allCells:true});}catch(e){}
}
function setWindowCfg(g,n,c){setRect(g,n,FIELD_WINDOW,c);}
function setScrollCfg(g,n,c){setRect(g,n,FIELD_SCROLL,c);}
function copyCfg(c){return{version:1,x:c.x,y:c.y,width:c.width,height:c.height,clearOutside:false};}

var dialog=null,activeEditor=null,activeScreenSize={width:40,height:25};
var activeMode='window',draftWindow=null,draftScroll=null;

function readMargin(id,maxValue){var v=parseInt($(id).val(),10);if(isNaN(v))v=0;return Math.max(0,Math.min(maxValue,v));}
function marginsFromCfg(g,c){
  var s=gridSize(g);
  return{left:c.x,top:c.y,right:Math.max(0,s.width-(c.x+c.width)),bottom:Math.max(0,s.height-(c.y+c.height))};
}
function rectFromMargins(changed){
  var s=activeScreenSize;
  var left=readMargin('#ricoGeomLeft75',s.width-1),right=readMargin('#ricoGeomRight75',s.width-1);
  var top=readMargin('#ricoGeomTop75',s.height-1),bottom=readMargin('#ricoGeomBottom75',s.height-1);
  if(left+right>=s.width){if(changed==='left')right=Math.max(0,s.width-left-1);else left=Math.max(0,s.width-right-1);}
  if(top+bottom>=s.height){if(changed==='top')bottom=Math.max(0,s.height-top-1);else top=Math.max(0,s.height-bottom-1);}
  $('#ricoGeomLeft75').val(left);$('#ricoGeomRight75').val(right);$('#ricoGeomTop75').val(top);$('#ricoGeomBottom75').val(bottom);
  return{x:left,y:top,width:s.width-left-right,height:s.height-top-bottom};
}
function setInputsFromRect(r){
  var s=activeScreenSize,m={left:r.x,top:r.y,right:Math.max(0,s.width-(r.x+r.width)),bottom:Math.max(0,s.height-(r.y+r.height))};
  $('#ricoGeomLeft75').attr('max',s.width-1).val(m.left);
  $('#ricoGeomRight75').attr('max',s.width-1).val(m.right);
  $('#ricoGeomTop75').attr('max',s.height-1).val(m.top);
  $('#ricoGeomBottom75').attr('max',s.height-1).val(m.bottom);
}
function captureActiveDraft(changed){
  var r=rectFromMargins(changed);
  if(activeMode==='scroll')draftScroll=r;else draftWindow=r;
  return r;
}
function summaryText(){
  var s=activeScreenSize,w=draftWindow||{x:0,y:0,width:s.width,height:s.height},a=draftScroll||{x:0,y:0,width:s.width,height:s.height};
  return 'Screen '+s.width+'×'+s.height+'  ·  Window '+w.width+'×'+w.height+' (X'+w.x+',Y'+w.y+')  ·  Scroll Area '+a.width+'×'+a.height+' (X'+a.x+',Y'+a.y+')';
}
function drawPreview(changed){
  if(changed)captureActiveDraft(changed);
  var s=activeScreenSize,w=draftWindow,a=draftScroll;
  if(!w||!a)return;
  var canvas=document.getElementById('ricoGeomCanvas75');
  if(canvas){
    var ctx=canvas.getContext('2d'),pad=16;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var scale=Math.min((canvas.width-pad*2)/s.width,(canvas.height-pad*2)/s.height);
    var ox=(canvas.width-s.width*scale)/2,oy=(canvas.height-s.height*scale)/2;
    ctx.fillStyle='#151515';ctx.fillRect(ox,oy,s.width*scale,s.height*scale);
    ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.strokeRect(ox+0.5,oy+0.5,s.width*scale-1,s.height*scale-1);

    ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#555';ctx.fillRect(ox+a.x*scale,oy+a.y*scale,a.width*scale,a.height*scale);ctx.restore();
    ctx.strokeStyle='#999';ctx.lineWidth=2;ctx.setLineDash([5,3]);
    ctx.strokeRect(ox+a.x*scale+0.5,oy+a.y*scale+0.5,a.width*scale-1,a.height*scale-1);ctx.setLineDash([]);

    ctx.strokeStyle='#eee';ctx.lineWidth=2;
    ctx.strokeRect(ox+w.x*scale+0.5,oy+w.y*scale+0.5,w.width*scale-1,w.height*scale-1);
  }
  $('#ricoGeomSummary75').text(summaryText());
  $('#ricoGeomEditing75').text(activeMode==='scroll'?'Editing: Scroll Area':'Editing: Window');
  $('#ricoGeomWindow75').css('font-weight',activeMode==='window'?'bold':'normal');
  $('#ricoGeomScroll75').css('font-weight',activeMode==='scroll'?'bold':'normal');
}
function switchMode75(mode){
  captureActiveDraft();
  activeMode=mode==='scroll'?'scroll':'window';
  setInputsFromRect(activeMode==='scroll'?draftScroll:draftWindow);
  drawPreview();
}
function saveDialogFrame75(){
  try{
    var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic;if(!g)return;
    captureActiveDraft();
    var n=g.getCurrentFrame();
    setWindowCfg(g,n,draftWindow);setScrollCfg(g,n,draftScroll);
  }catch(e){console.error('[RICO TEST75] save geometry failed',e);}
}
function loadDialogFrame75(){
  var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic;if(!g)return;
  var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1);
  activeScreenSize=gridSize(g);draftWindow=getWindowCfg(g,n);draftScroll=getScrollCfg(g,n);
  setInputsFromRect(activeMode==='scroll'?draftScroll:draftWindow);
  $('#ricoGeomFrame75').text('Frame '+(n+1)+' / '+count);
  $('#ricoGeomPrev75').toggleClass('disabled',n<=0).css('opacity',n<=0?0.35:1);
  $('#ricoGeomNext75').toggleClass('disabled',n>=count-1).css('opacity',n>=count-1?0.35:1);
  drawPreview();
}
function stepDialogFrame75(delta){
  var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic,frames=t&&t.frames;if(!g||!frames||!frames.gotoFrame)return;
  var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1),target=n+delta;
  if(target<0||target>=count)return;
  saveDialogFrame75();frames.gotoFrame(target);loadDialogFrame75();
}
function resetSelected75(){
  var s=activeScreenSize,r={x:0,y:0,width:s.width,height:s.height};
  if(activeMode==='scroll')draftScroll=r;else draftWindow=r;
  setInputsFromRect(r);drawPreview();
}
function ensureDialog(){
  if(dialog)return;
  dialog=UI.create('UI.Dialog',{id:'ricoWindowScrollDialog75',title:"Rico's Window Dimensions",width:560,height:610});
  var html='';
  html+='<div style="padding:16px 18px">';
  html+='<div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:10px"><div class="ui-button" id="ricoGeomPrev75" style="min-width:30px;text-align:center">&lt;</div><div id="ricoGeomFrame75" style="min-width:100px;text-align:center;font-weight:bold">Frame</div><div class="ui-button" id="ricoGeomNext75" style="min-width:30px;text-align:center">&gt;</div></div>';
  html+='<div id="ricoGeomSummary75" style="text-align:center;color:#aaa;font-size:11px;margin-bottom:12px"></div>';
  html+='<div style="display:flex;justify-content:center;gap:8px;margin-bottom:10px"><div class="ui-button" id="ricoGeomWindow75">Window</div><div class="ui-button" id="ricoGeomScroll75">Scroll Area</div></div>';
  html+='<div id="ricoGeomEditing75" style="text-align:center;font-weight:bold;margin-bottom:8px"></div>';
  html+='<div style="text-align:center;margin-bottom:8px"><label style="display:inline-block;width:62px">Top:</label><input id="ricoGeomTop75" type="number" min="0" value="0" style="width:72px"></div>';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:12px"><div style="width:92px;text-align:right"><label>Left:</label><br><input id="ricoGeomLeft75" type="number" min="0" value="0" style="width:72px;margin-top:4px"></div><canvas id="ricoGeomCanvas75" width="260" height="200" style="display:block"></canvas><div style="width:92px;text-align:left"><label>Right:</label><br><input id="ricoGeomRight75" type="number" min="0" value="0" style="width:72px;margin-top:4px"></div></div>';
  html+='<div style="text-align:center;margin-top:8px"><label style="display:inline-block;width:62px">Bottom:</label><input id="ricoGeomBottom75" type="number" min="0" value="0" style="width:72px"></div>';
  html+='<div style="text-align:center;margin-top:12px"><div class="ui-button" id="ricoGeomReset75">Reset selected to Screen</div></div>';
  html+='<div style="margin-top:16px;color:#aaa;font-size:11px;line-height:1.4"><b>Window</b> = visible viewport. <b>Scroll Area</b> = the part of the Screen that participates in MAP SCROLL. The normal LVLLVL editor always keeps the full Screen editable.</div>';
  html+='</div>';
  dialog.add(UI.create('UI.HTMLPanel',{html:html}));
  var ok=UI.create('UI.Button',{text:'OK',color:'primary'});dialog.addButton(ok);ok.on('click',function(){saveDialogFrame75();UI.closeDialog();});
  var cancel=UI.create('UI.Button',{text:'Cancel',color:'secondary'});dialog.addButton(cancel);cancel.on('click',function(){UI.closeDialog();});
  setTimeout(function(){
    $('#ricoGeomLeft75').on('input change',function(){drawPreview('left');});$('#ricoGeomRight75').on('input change',function(){drawPreview('right');});
    $('#ricoGeomTop75').on('input change',function(){drawPreview('top');});$('#ricoGeomBottom75').on('input change',function(){drawPreview('bottom');});
    $('#ricoGeomPrev75').on('click',function(){stepDialogFrame75(-1);});$('#ricoGeomNext75').on('click',function(){stepDialogFrame75(1);});
    $('#ricoGeomWindow75').on('click',function(){switchMode75('window');});$('#ricoGeomScroll75').on('click',function(){switchMode75('scroll');});
    $('#ricoGeomReset75').on('click',resetSelected75);
  },0);
}
function openDialog(editor){activeEditor=editor;ensureDialog();activeMode='window';UI.showDialog('ricoWindowScrollDialog75');loadDialogFrame75();}

if(!Editor.prototype.__ricoWindowScroll75){
  Editor.prototype.__ricoWindowScroll75=true;
  var oldBuild=Editor.prototype.buildInterface;
  Editor.prototype.buildInterface=function(){
    var r=oldBuild.apply(this,arguments),self=this;
    UI.on('ready',function(){
      try{
        if(!self.menuBar||!self.menuBar.menus)return;var screenMenu=null;
        for(var i=0;i<self.menuBar.menus.length;i++)if(self.menuBar.menus[i]&&self.menuBar.menus[i].label==='Screen'){screenMenu=self.menuBar.menus[i];break;}
        if(!screenMenu)return;var item=screenMenu.getItem('file-windowdimensions');
        if(!item)item=screenMenu.addItem({label:"Rico's Window Dimensions...",id:'file-windowdimensions'});
        if(item&&item.setLabel){item.label="Rico's Window Dimensions...";item.setLabel("Rico's Window Dimensions...");}
        var original=screenMenu.getItem('file-dimensions');
        if(original&&item){var originalEl=document.getElementById(original.id),cloneEl=document.getElementById(item.id);if(originalEl&&cloneEl&&originalEl.parentNode===cloneEl.parentNode)originalEl.parentNode.insertBefore(cloneEl,originalEl.nextSibling);}
      }catch(e){console.error('[RICO TEST75] menu install failed',e);}
    });
    return r;
  };
  var oldMenuClick=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(menuItem){if(menuItem==='file-windowdimensions'){openDialog(this);return;}return oldMenuClick.apply(this,arguments);};
}

if(!Graphic.prototype.__ricoWindowScrollFrames75){
  Graphic.prototype.__ricoWindowScrollFrames75=true;
  var oldInsert=Graphic.prototype.insertFrame;
  Graphic.prototype.insertFrame=function(){
    var n=oldInsert.apply(this,arguments);
    if(n>=0&&n<this.frames.length){if(!this.frames[n][FIELD_WINDOW])this.frames[n][FIELD_WINDOW]=cleanRect(this,null);if(!this.frames[n][FIELD_SCROLL])this.frames[n][FIELD_SCROLL]=cleanRect(this,null);}
    return n;
  };
  var oldDup=Graphic.prototype.duplicateFrame;
  Graphic.prototype.duplicateFrame=function(n){
    var src=typeof n==='undefined'?this.currentFrame:parseInt(n,10),wc=getWindowCfg(this,src),sc=getScrollCfg(this,src),r=oldDup.apply(this,arguments);
    if(r>=0&&r<this.frames.length){this.frames[r][FIELD_WINDOW]=copyCfg(wc);this.frames[r][FIELD_SCROLL]=copyCfg(sc);}return r;
  };
}

window.RICO_TEST75_WINDOW_DIMENSION={field:FIELD_WINDOW,scrollField:FIELD_SCROLL,getConfig:getWindowCfg,setConfig:setWindowCfg,getScrollArea:getScrollCfg,setScrollArea:setScrollCfg,perFrame:true,nonDestructive:true,editorUnrestricted:true,windowIsViewport:true,scrollAreaIndependent:true,frameNavigation:true};
window.RICO_TEST72_WINDOW_DIMENSION=window.RICO_TEST75_WINDOW_DIMENSION;
window.RICO_TEST68_WINDOW_DIMENSION=window.RICO_TEST75_WINDOW_DIMENSION;
window.RICO_TEST67_WINDOW_DIMENSION=window.RICO_TEST75_WINDOW_DIMENSION;
console.log("[RICO TEST75] Rico's Window Dimensions: independent Window + Scroll Area loaded");
})();
