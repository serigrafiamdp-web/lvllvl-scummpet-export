(function(){
'use strict';
if(typeof Editor==='undefined'){console.error('[RICO TEST66] Editor missing');return;}
if(Editor.prototype.__ricoWindowDimension66)return;
Editor.prototype.__ricoWindowDimension66=true;

var oldBuild=Editor.prototype.buildInterface;
Editor.prototype.buildInterface=function(){
  var r=oldBuild.apply(this,arguments);
  var self=this;
  UI.on('ready',function(){
    try{
      if(!self.menuBar||!self.menuBar.menus)return;
      var screenMenu=null;
      for(var i=0;i<self.menuBar.menus.length;i++){
        if(self.menuBar.menus[i]&&self.menuBar.menus[i].label==='Screen'){
          screenMenu=self.menuBar.menus[i];
          break;
        }
      }
      if(!screenMenu||screenMenu.getItem('file-windowdimensions'))return;

      var clone=screenMenu.addItem({label:'Window Dimension...',id:'file-windowdimensions'});
      var original=screenMenu.getItem('file-dimensions');

      // Keep the clone immediately below the original Dimensions item.
      if(original&&clone){
        var originalEl=document.getElementById(original.id);
        var cloneEl=document.getElementById(clone.id);
        if(originalEl&&cloneEl&&originalEl.parentNode===cloneEl.parentNode){
          originalEl.parentNode.insertBefore(cloneEl,originalEl.nextSibling);
        }
      }
      console.log('[RICO TEST66] Screen > Window Dimension... installed');
    }catch(e){
      console.error('[RICO TEST66] menu install failed',e);
    }
  });
  return r;
};

var oldMenuClick=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(menuItem){
  if(menuItem==='file-windowdimensions'){
    if(this.textModeEditor&&this.textModeEditor.showDimensionsDialog){
      this.textModeEditor.showDimensionsDialog();
    }
    return;
  }
  return oldMenuClick.apply(this,arguments);
};

window.RICO_TEST66_WINDOW_DIMENSION={menuClone:true,sourceAction:'file-dimensions',cloneAction:'file-windowdimensions'};
console.log('[RICO TEST66] Window Dimension menu clone patch loaded');
})();