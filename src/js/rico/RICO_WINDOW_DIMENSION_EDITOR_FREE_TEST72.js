(function(){
'use strict';
if(typeof Editor==='undefined'||typeof Graphic==='undefined'){console.error('[RICO TEST72] Window Dimension dependencies missing');return;}
var FIELD='ricoWindowDimensionV1';

function clamp(v,a,b,d){v=parseInt(v,10);return isNaN(v)?d:Math.max(a,Math.min(b,v));}
function frameObj(g,n){if(!g||!g.frames)return null;if(typeof n==='undefined')n=g.getCurrentFrame();return n>=0&&n<g.frames.length?g.frames[n]:null;}
function gridSize(g){
  var w=40,h=25;
  try{w=g.getGridWidth();h=g.getGridHeight();}catch(e){
    try{w=Math.round(g.getGraphicWidth()/8);h=Math.round(g.getGraphicHeight()/8);}catch(e2){}
  }
  return{width:Math.max(1,w|0),height:Math.max(1,h|0)};
}
function clean(g,c){
  var s=gridSize(g);c=c||{};
  var x=clamp(c.x,0,s.width-1,0),y=clamp(c.y,0,s.height-1,0);
  var width=clamp(c.width,1,s.width-x,s.width-x);
  var height=clamp(c.height,1,s.height-y,s.height-y);
  return{version:1,x:x,y:y,width:width,height:height,clearOutside:false};
}
function getCfg(g,n){
  var f=frameObj(g,n);
  return clean(g,f&&f[FIELD]?f[FIELD]:null);
}
function setCfg(g,n,c){
  var f=frameObj(g,n);if(!f)return;
  f[FIELD]=clean(g,c);
  try{g.invalidateAllCells();g.redraw({allCells:true});}catch(e){}
}
function copyCfg(c){return{version:1,x:c.x,y:c.y,width:c.width,height:c.height,clearOutside:false};}

var dialog=null,activeEditor=null,activeScreenSize={width:40,height:25};

function readMargin(id,maxValue){
  var v=parseInt($(id).val(),10);
  if(isNaN(v))v=0;
  return Math.max(0,Math.min(maxValue,v));
}
function marginsFromCfg(g,c){
  var s=gridSize(g);
  return{
    left:c.x,
    top:c.y,
    right:Math.max(0,s.width-(c.x+c.width)),
    bottom:Math.max(0,s.height-(c.y+c.height))
  };
}
function normalizeMargins(changed){
  var s=activeScreenSize;
  var left=readMargin('#ricoWindowLeft72',s.width-1);
  var right=readMargin('#ricoWindowRight72',s.width-1);
  var top=readMargin('#ricoWindowTop72',s.height-1);
  var bottom=readMargin('#ricoWindowBottom72',s.height-1);

  if(left+right>=s.width){
    if(changed==='left')right=Math.max(0,s.width-left-1);
    else left=Math.max(0,s.width-right-1);
  }
  if(top+bottom>=s.height){
    if(changed==='top')bottom=Math.max(0,s.height-top-1);
    else top=Math.max(0,s.height-bottom-1);
  }

  $('#ricoWindowLeft72').val(left);
  $('#ricoWindowRight72').val(right);
  $('#ricoWindowTop72').val(top);
  $('#ricoWindowBottom72').val(bottom);

  return{
    left:left,right:right,top:top,bottom:bottom,
    x:left,y:top,
    width:s.width-left-right,
    height:s.height-top-bottom
  };
}
function drawWindowPreview72(changed){
  var m=normalizeMargins(changed);
  var canvas=document.getElementById('ricoWindowCanvas72');
  if(canvas){
    var ctx=canvas.getContext('2d'),s=activeScreenSize,pad=16;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var scale=Math.min((canvas.width-pad*2)/s.width,(canvas.height-pad*2)/s.height);
    var ox=(canvas.width-s.width*scale)/2,oy=(canvas.height-s.height*scale)/2;
    ctx.fillStyle='#111';
    ctx.fillRect(ox,oy,s.width*scale,s.height*scale);
    ctx.strokeStyle='#555';
    ctx.lineWidth=1;
    ctx.strokeRect(ox+0.5,oy+0.5,s.width*scale-1,s.height*scale-1);
    ctx.fillStyle='#777';
    ctx.fillRect(ox+m.x*scale,oy+m.y*scale,m.width*scale,m.height*scale);
    ctx.strokeStyle='#ddd';
    ctx.lineWidth=2;
    ctx.strokeRect(ox+m.x*scale+0.5,oy+m.y*scale+0.5,m.width*scale-1,m.height*scale-1);
  }
  $('#ricoWindowComputed72').text('Window '+m.width+'×'+m.height+' · X '+m.x+' · Y '+m.y);
  return m;
}
function saveDialogFrame72(){
  try{
    var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic;
    if(!g)return;
    var m=drawWindowPreview72();
    setCfg(g,g.getCurrentFrame(),{x:m.x,y:m.y,width:m.width,height:m.height});
  }catch(e){console.error('[RICO TEST72] save current Window frame failed',e);}
}
function loadDialogFrame72(){
  var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic;if(!g)return;
  var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1);
  var cfg=getCfg(g,n),s=gridSize(g),m=marginsFromCfg(g,cfg);
  activeScreenSize=s;
  $('#ricoWindowLeft72').attr('max',s.width-1).val(m.left);
  $('#ricoWindowRight72').attr('max',s.width-1).val(m.right);
  $('#ricoWindowTop72').attr('max',s.height-1).val(m.top);
  $('#ricoWindowBottom72').attr('max',s.height-1).val(m.bottom);
  $('#ricoWindowInfo72').text('Screen '+s.width+'×'+s.height+' · Window affects MAP SCROLL preview/export only');
  $('#ricoWindowFrame72').text('Frame '+(n+1)+' / '+count);
  $('#ricoWindowPrev72').toggleClass('disabled',n<=0).css('opacity',n<=0?0.35:1);
  $('#ricoWindowNext72').toggleClass('disabled',n>=count-1).css('opacity',n>=count-1?0.35:1);
  setTimeout(function(){drawWindowPreview72();},0);
}
function stepDialogFrame72(delta){
  var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic,frames=t&&t.frames;
  if(!g||!frames||!frames.gotoFrame)return;
  var n=g.getCurrentFrame(),count=g.getFrameCount?g.getFrameCount():(g.frames?g.frames.length:1),target=n+delta;
  if(target<0||target>=count)return;
  saveDialogFrame72();
  frames.gotoFrame(target);
  loadDialogFrame72();
}
function ensureDialog(){
  if(dialog)return;
  dialog=UI.create('UI.Dialog',{id:'ricoWindowDimensionDialog72',title:"Rico's Window Dimensions",width:500,height:535});
  var html='';
  html+='<div style="padding:16px 18px">';
  html+='<div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:12px">';
  html+='<div class="ui-button" id="ricoWindowPrev72" style="min-width:30px;text-align:center">&lt;</div>';
  html+='<div id="ricoWindowFrame72" style="min-width:100px;text-align:center;font-weight:bold">Frame</div>';
  html+='<div class="ui-button" id="ricoWindowNext72" style="min-width:30px;text-align:center">&gt;</div>';
  html+='</div>';
  html+='<div id="ricoWindowInfo72" style="margin-bottom:12px;color:#aaa;font-size:11px;text-align:center"></div>';
  html+='<div style="text-align:center;margin-bottom:8px"><label style="display:inline-block;width:62px">Top:</label><input id="ricoWindowTop72" type="number" min="0" value="0" style="width:72px"></div>';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:12px">';
  html+='<div style="width:92px;text-align:right"><label>Left:</label><br><input id="ricoWindowLeft72" type="number" min="0" value="0" style="width:72px;margin-top:4px"></div>';
  html+='<canvas id="ricoWindowCanvas72" width="240" height="190" style="display:block"></canvas>';
  html+='<div style="width:92px;text-align:left"><label>Right:</label><br><input id="ricoWindowRight72" type="number" min="0" value="0" style="width:72px;margin-top:4px"></div>';
  html+='</div>';
  html+='<div style="text-align:center;margin-top:8px"><label style="display:inline-block;width:62px">Bottom:</label><input id="ricoWindowBottom72" type="number" min="0" value="0" style="width:72px"></div>';
  html+='<div id="ricoWindowComputed72" style="margin-top:14px;text-align:center;font-weight:bold"></div>';
  html+='<div style="margin-top:16px;color:#aaa;font-size:11px">Window does not crop or mask the normal LVLLVL editor. The full Screen remains available for drawing, selection and paste. Window is used only by MAP SCROLL visualization and export.</div>';
  html+='</div>';
  dialog.add(UI.create('UI.HTMLPanel',{html:html}));

  var ok=UI.create('UI.Button',{text:'OK',color:'primary'});
  dialog.addButton(ok);
  ok.on('click',function(){saveDialogFrame72();UI.closeDialog();});
  var cancel=UI.create('UI.Button',{text:'Cancel',color:'secondary'});
  dialog.addButton(cancel);cancel.on('click',function(){UI.closeDialog();});

  setTimeout(function(){
    $('#ricoWindowLeft72').on('input change',function(){drawWindowPreview72('left');});
    $('#ricoWindowRight72').on('input change',function(){drawWindowPreview72('right');});
    $('#ricoWindowTop72').on('input change',function(){drawWindowPreview72('top');});
    $('#ricoWindowBottom72').on('input change',function(){drawWindowPreview72('bottom');});
    $('#ricoWindowPrev72').on('click',function(){stepDialogFrame72(-1);});
    $('#ricoWindowNext72').on('click',function(){stepDialogFrame72(1);});
  },0);
}
function openDialog(editor){
  activeEditor=editor;
  ensureDialog();
  UI.showDialog('ricoWindowDimensionDialog72');
  loadDialogFrame72();
}

if(!Editor.prototype.__ricoWindowDimension72){
  Editor.prototype.__ricoWindowDimension72=true;
  var oldBuild=Editor.prototype.buildInterface;
  Editor.prototype.buildInterface=function(){
    var r=oldBuild.apply(this,arguments),self=this;
    UI.on('ready',function(){
      try{
        if(!self.menuBar||!self.menuBar.menus)return;
        var screenMenu=null;
        for(var i=0;i<self.menuBar.menus.length;i++)if(self.menuBar.menus[i]&&self.menuBar.menus[i].label==='Screen'){screenMenu=self.menuBar.menus[i];break;}
        if(!screenMenu)return;
        var clone=screenMenu.getItem('file-windowdimensions');
        if(!clone)clone=screenMenu.addItem({label:"Rico's Window Dimensions...",id:'file-windowdimensions'});
        var original=screenMenu.getItem('file-dimensions');
        if(original&&clone){
          var originalEl=document.getElementById(original.id),cloneEl=document.getElementById(clone.id);
          if(originalEl&&cloneEl&&originalEl.parentNode===cloneEl.parentNode)originalEl.parentNode.insertBefore(cloneEl,originalEl.nextSibling);
        }
      }catch(e){console.error('[RICO TEST72] menu install failed',e);}
    });
    return r;
  };
  var oldMenuClick=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(menuItem){
    if(menuItem==='file-windowdimensions'){openDialog(this);return;}
    return oldMenuClick.apply(this,arguments);
  };
}

if(!Graphic.prototype.__ricoWindowFrames72){
  Graphic.prototype.__ricoWindowFrames72=true;
  var oldInsert=Graphic.prototype.insertFrame;
  Graphic.prototype.insertFrame=function(){
    var n=oldInsert.apply(this,arguments);
    if(n>=0&&n<this.frames.length&&!this.frames[n][FIELD])this.frames[n][FIELD]=clean(this,null);
    return n;
  };
  var oldDup=Graphic.prototype.duplicateFrame;
  Graphic.prototype.duplicateFrame=function(n){
    var src=typeof n==='undefined'?this.currentFrame:parseInt(n,10),cfg=getCfg(this,src),r=oldDup.apply(this,arguments);
    if(r>=0&&r<this.frames.length)this.frames[r][FIELD]=copyCfg(cfg);
    return r;
  };
}

window.RICO_TEST72_WINDOW_DIMENSION={field:FIELD,getConfig:getCfg,setConfig:setCfg,perFrame:true,nonDestructive:true,editorUnrestricted:true,previewExportOnly:true,fourSideCrop:true,frameNavigation:true};
window.RICO_TEST68_WINDOW_DIMENSION=window.RICO_TEST72_WINDOW_DIMENSION;
window.RICO_TEST67_WINDOW_DIMENSION=window.RICO_TEST72_WINDOW_DIMENSION;
console.log('[RICO TEST72] Rico's Window Dimensions: unrestricted editor + per-frame < > navigation');
})();