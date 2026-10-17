(function(){
'use strict';
if(typeof Editor==='undefined'||typeof Graphic==='undefined'){console.error('[RICO TEST67] Window Dimension dependencies missing');return;}
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
  return{version:1,x:x,y:y,width:width,height:height,clearOutside:true};
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
function copyCfg(c){return{version:1,x:c.x,y:c.y,width:c.width,height:c.height,clearOutside:true};}

var dialog=null,activeEditor=null;
function ensureDialog(){
  if(dialog)return;
  dialog=UI.create('UI.Dialog',{id:'ricoWindowDimensionDialog67',title:'Window Dimension',width:430,height:300});
  var html='';
  html+='<div style="padding:16px 18px">';
  html+='<div id="ricoWindowInfo67" style="margin-bottom:14px;color:#aaa;font-size:11px"></div>';
  html+='<div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Window Width:</label><input id="ricoWindowWidth67" type="number" min="1" style="width:80px"></div>';
  html+='<div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Window Height:</label><input id="ricoWindowHeight67" type="number" min="1" style="width:80px"></div>';
  html+='<div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Offset X:</label><input id="ricoWindowX67" type="number" min="0" style="width:80px"></div>';
  html+='<div style="margin-bottom:10px"><label style="display:inline-block;width:125px">Offset Y:</label><input id="ricoWindowY67" type="number" min="0" style="width:80px"></div>';
  html+='<div style="margin-top:16px;color:#aaa;font-size:11px">The Screen grid is not resized. Cells outside this Window remain editable data but are masked in black and sanitized on RICO PRG export.</div>';
  html+='</div>';
  dialog.add(UI.create('UI.HTMLPanel',{html:html}));
  var ok=UI.create('UI.Button',{text:'OK',color:'primary'});
  dialog.addButton(ok);
  ok.on('click',function(){
    try{
      var g=activeEditor&&activeEditor.textModeEditor&&activeEditor.textModeEditor.graphic;
      if(g){
        setCfg(g,g.getCurrentFrame(),{
          width:$('#ricoWindowWidth67').val(),
          height:$('#ricoWindowHeight67').val(),
          x:$('#ricoWindowX67').val(),
          y:$('#ricoWindowY67').val()
        });
      }
    }catch(e){console.error('[RICO TEST67] save Window Dimension failed',e);}
    UI.closeDialog();
  });
  var cancel=UI.create('UI.Button',{text:'Cancel',color:'secondary'});
  dialog.addButton(cancel);cancel.on('click',function(){UI.closeDialog();});
}
function openDialog(editor){
  activeEditor=editor;ensureDialog();
  var g=editor&&editor.textModeEditor&&editor.textModeEditor.graphic;if(!g)return;
  var n=g.getCurrentFrame(),c=getCfg(g,n),s=gridSize(g);
  $('#ricoWindowWidth67').attr('max',s.width).val(c.width);
  $('#ricoWindowHeight67').attr('max',s.height).val(c.height);
  $('#ricoWindowX67').attr('max',s.width-1).val(c.x);
  $('#ricoWindowY67').attr('max',s.height-1).val(c.y);
  $('#ricoWindowInfo67').text('Frame '+(n+1)+' · Screen '+s.width+'×'+s.height+' · Window '+c.width+'×'+c.height);
  UI.showDialog('ricoWindowDimensionDialog67');
}

if(!Editor.prototype.__ricoWindowDimension67){
  Editor.prototype.__ricoWindowDimension67=true;
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
        if(!clone)clone=screenMenu.addItem({label:'Window Dimension...',id:'file-windowdimensions'});
        var original=screenMenu.getItem('file-dimensions');
        if(original&&clone){
          var originalEl=document.getElementById(original.id),cloneEl=document.getElementById(clone.id);
          if(originalEl&&cloneEl&&originalEl.parentNode===cloneEl.parentNode)originalEl.parentNode.insertBefore(cloneEl,originalEl.nextSibling);
        }
      }catch(e){console.error('[RICO TEST67] menu install failed',e);}
    });
    return r;
  };
  var oldMenuClick=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(menuItem){
    if(menuItem==='file-windowdimensions'){openDialog(this);return;}
    return oldMenuClick.apply(this,arguments);
  };
}

if(!Graphic.prototype.__ricoWindowFrames67){
  Graphic.prototype.__ricoWindowFrames67=true;
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

  var oldDraw=Graphic.prototype.drawFrame;
  Graphic.prototype.drawFrame=function(a){
    var r=oldDraw.apply(this,arguments);
    try{
      a=a||{};if(!a.canvas||!a.context||a.__ricoWindow67)return r;
      var n=typeof a.frame!=='undefined'?parseInt(a.frame,10):this.getCurrentFrame();
      if(n<0||!this.frames||n>=this.frames.length)return r;
      var c=getCfg(this,n),s=gridSize(this);
      if(c.x===0&&c.y===0&&c.width===s.width&&c.height===s.height)return r;
      var sc=typeof a.scale!=='undefined'?a.scale:1;
      var pxW=this.getGraphicWidth()/s.width,pxH=this.getGraphicHeight()/s.height;
      var ox,oy;
      if(typeof a.drawAtX!=='undefined'){ox=a.drawAtX;oy=a.drawAtY;}
      else{ox=(a.dstX||0)-(a.srcX||0)*sc;oy=(a.dstY||0)-(a.srcY||0)*sc;}
      var totalW=this.getGraphicWidth()*sc,totalH=this.getGraphicHeight()*sc;
      var vx=ox+c.x*pxW*sc,vy=oy+c.y*pxH*sc,vw=c.width*pxW*sc,vh=c.height*pxH*sc;
      var ctx=a.context;ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000000';
      if(vy>oy)ctx.fillRect(ox,oy,totalW,vy-oy);
      if(vy+vh<oy+totalH)ctx.fillRect(ox,vy+vh,totalW,(oy+totalH)-(vy+vh));
      if(vx>ox)ctx.fillRect(ox,vy,vx-ox,vh);
      if(vx+vw<ox+totalW)ctx.fillRect(vx+vw,vy,(ox+totalW)-(vx+vw),vh);
      ctx.restore();
    }catch(e){console.error('[RICO TEST67] Window mask draw failed',e);}
    return r;
  };
}

window.RICO_TEST67_WINDOW_DIMENSION={field:FIELD,getConfig:getCfg,setConfig:setCfg,perFrame:true,nonDestructive:true,blackMask:true};
console.log('[RICO TEST67] per-frame Window Dimension loaded');
})();