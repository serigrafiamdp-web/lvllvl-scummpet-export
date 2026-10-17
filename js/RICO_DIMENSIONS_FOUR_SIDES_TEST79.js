(function(){
'use strict';
if(typeof Editor==='undefined'||typeof Graphic==='undefined'){console.error('[RICO TEST79] Dimensions dependencies missing');return;}

var dialog=null,activeEditor=null,currentSize={width:40,height:25};

function clampInt(v,d){
  v=parseInt(v,10);
  return isNaN(v)?d:v;
}
function readDelta(id){
  return clampInt($(id).val(),0);
}
function normalize(changed){
  var left=readDelta('#ricoDimLeft73');
  var right=readDelta('#ricoDimRight73');
  var top=readDelta('#ricoDimTop73');
  var bottom=readDelta('#ricoDimBottom73');

  if(currentSize.width+left+right<1){
    if(changed==='left')left=1-currentSize.width-right;
    else right=1-currentSize.width-left;
  }
  if(currentSize.height+top+bottom<1){
    if(changed==='top')top=1-currentSize.height-bottom;
    else bottom=1-currentSize.height-top;
  }

  $('#ricoDimLeft73').val(left);
  $('#ricoDimRight73').val(right);
  $('#ricoDimTop73').val(top);
  $('#ricoDimBottom73').val(bottom);

  return {
    left:left,right:right,top:top,bottom:bottom,
    width:currentSize.width+left+right,
    height:currentSize.height+top+bottom
  };
}
function drawPreview(changed){
  var d=normalize(changed);
  $('#ricoDimComputed73').text('New Screen: '+d.width+' × '+d.height);

  var canvas=document.getElementById('ricoDimCanvas73');
  if(!canvas)return d;
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  var oldX=d.left,oldY=d.top;
  var minX=Math.min(0,oldX),minY=Math.min(0,oldY);
  var maxX=Math.max(d.width,oldX+currentSize.width);
  var maxY=Math.max(d.height,oldY+currentSize.height);
  var spanW=Math.max(1,maxX-minX),spanH=Math.max(1,maxY-minY);
  var pad=18,scale=Math.min((canvas.width-pad*2)/spanW,(canvas.height-pad*2)/spanH);
  var ox=(canvas.width-spanW*scale)/2-minX*scale;
  var oy=(canvas.height-spanH*scale)/2-minY*scale;

  ctx.fillStyle='#777';
  ctx.fillRect(ox+oldX*scale,oy+oldY*scale,currentSize.width*scale,currentSize.height*scale);
  ctx.strokeStyle='#aaa';
  ctx.lineWidth=1;
  ctx.strokeRect(ox+oldX*scale+0.5,oy+oldY*scale+0.5,currentSize.width*scale-1,currentSize.height*scale-1);

  ctx.save();
  ctx.globalAlpha=0.45;
  ctx.fillStyle='#222';
  ctx.fillRect(ox,oy,d.width*scale,d.height*scale);
  ctx.restore();
  ctx.strokeStyle='#eee';
  ctx.lineWidth=2;
  ctx.strokeRect(ox+0.5,oy+0.5,d.width*scale-1,d.height*scale-1);

  return d;
}
function applyResize(){
  var t=activeEditor&&activeEditor.textModeEditor,g=t&&t.graphic;
  if(!g)return;
  var d=drawPreview();
  if(d.width<1||d.height<1)return;

  g.setGridDimensions({
    width:d.width,
    height:d.height,
    offsetX:d.left,
    offsetY:d.top
  });

  try{
    if(t.frames&&t.frames.updateFrameInfo)t.frames.updateFrameInfo();
  }catch(e){}
}
function resetDeltas(){
  $('#ricoDimLeft73,#ricoDimRight73,#ricoDimTop73,#ricoDimBottom73').val(0);
  drawPreview();
}
function ensureDialog(){
  if(dialog)return;
  dialog=UI.create('UI.Dialog',{id:'ricoDimensionsDialog73',title:"Rico's Screen Dimension",width:510,height:520});
  var html='';
  html+='<div style="padding:16px 18px">';
  html+='<div id="ricoDimInfo73" style="text-align:center;color:#aaa;font-size:11px;margin-bottom:10px"></div>';
  html+='<div style="text-align:center;font-size:11px;color:#aaa;margin-bottom:12px">Positive values add rows/columns. Negative values remove them.</div>';

  html+='<div style="text-align:center;margin-bottom:8px"><label style="display:inline-block;width:70px">Top:</label><input id="ricoDimTop73" type="number" value="0" step="1" style="width:78px"></div>';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:12px">';
  html+='<div style="width:100px;text-align:right"><label>Left:</label><br><input id="ricoDimLeft73" type="number" value="0" step="1" style="width:78px;margin-top:4px"></div>';
  html+='<canvas id="ricoDimCanvas73" width="240" height="190" style="display:block"></canvas>';
  html+='<div style="width:100px;text-align:left"><label>Right:</label><br><input id="ricoDimRight73" type="number" value="0" step="1" style="width:78px;margin-top:4px"></div>';
  html+='</div>';
  html+='<div style="text-align:center;margin-top:8px"><label style="display:inline-block;width:70px">Bottom:</label><input id="ricoDimBottom73" type="number" value="0" step="1" style="width:78px"></div>';

  html+='<div id="ricoDimComputed73" style="margin-top:14px;text-align:center;font-weight:bold"></div>';
  html+='<div style="text-align:center;margin-top:12px"><div class="ui-button" id="ricoDimReset73">Reset changes</div></div>';
  html+='<div style="margin-top:16px;color:#aaa;font-size:11px">This changes the real Screen dimensions for every frame. Adding/removing on Left or Top shifts existing content so the chosen edge is modified physically.</div>';
  html+='</div>';

  dialog.add(UI.create('UI.HTMLPanel',{html:html}));

  var ok=UI.create('UI.Button',{text:'OK',color:'primary'});
  dialog.addButton(ok);
  ok.on('click',function(){applyResize();UI.closeDialog();});

  var cancel=UI.create('UI.Button',{text:'Cancel',color:'secondary'});
  dialog.addButton(cancel);
  cancel.on('click',function(){UI.closeDialog();});

  setTimeout(function(){
    $('#ricoDimLeft73').on('input change',function(){drawPreview('left');});
    $('#ricoDimRight73').on('input change',function(){drawPreview('right');});
    $('#ricoDimTop73').on('input change',function(){drawPreview('top');});
    $('#ricoDimBottom73').on('input change',function(){drawPreview('bottom');});
    $('#ricoDimReset73').on('click',resetDeltas);
  },0);
}
function openDialog(editor){
  activeEditor=editor;
  var t=editor&&editor.textModeEditor,g=t&&t.graphic;
  if(!g)return;

  if(g.getType&&g.getType()==='sprite'){
    if(t.showDimensionsDialog)t.showDimensionsDialog();
    return;
  }

  ensureDialog();
  currentSize={width:g.getGridWidth(),height:g.getGridHeight()};
  $('#ricoDimInfo73').text('Current Screen: '+currentSize.width+' × '+currentSize.height);
  resetDeltas();
  UI.showDialog('ricoDimensionsDialog73');
  setTimeout(function(){drawPreview();},0);
}

if(!Editor.prototype.__ricoDimensions79){
  Editor.prototype.__ricoDimensions79=true;

  var oldBuild=Editor.prototype.buildInterface;
  Editor.prototype.buildInterface=function(){
    var r=oldBuild.apply(this,arguments),self=this;
    UI.on('ready',function(){
      try{
        if(!self.menuBar||!self.menuBar.menus)return;
        var screenMenu=null;
        for(var i=0;i<self.menuBar.menus.length;i++){
          if(self.menuBar.menus[i]&&self.menuBar.menus[i].label==='Screen'){screenMenu=self.menuBar.menus[i];break;}
        }
        if(!screenMenu)return;
        var item=screenMenu.getItem('file-dimensions');
        if(item&&item.setLabel){
          item.label="Rico's Screen Dimension";
          item.setLabel("Rico's Screen Dimension");
        }
      }catch(e){console.error('[RICO TEST79] menu rename failed',e);}
    });
    return r;
  };

  var oldMenuClick=Editor.prototype.menuClick;
  Editor.prototype.menuClick=function(menuItem){
    if(menuItem==='file-dimensions'){
      openDialog(this);
      return;
    }
    return oldMenuClick.apply(this,arguments);
  };
}

window.RICO_TEST79_DIMENSIONS={
  fourSideResize:true,
  signedEdges:true,
  physicalScreenResize:true,
  leftTopShiftContent:true,
  nativeSpriteFallback:true
};
console.log("[RICO TEST79] Rico's Screen Dimension: four-side signed Screen resize loaded");
})();
window.RICO_TEST73_DIMENSIONS=window.RICO_TEST79_DIMENSIONS;
