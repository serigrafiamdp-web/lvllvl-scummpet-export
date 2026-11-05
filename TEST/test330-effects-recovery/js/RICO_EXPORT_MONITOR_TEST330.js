(function(){
'use strict';
// TEST330: error-only diagnostics. Engines and supported mode selection stay intact.
if(typeof ToPRGAdv==='undefined')return;
var previous=ToPRGAdv.prototype.createPRG,monitor={version:330,last:null,lastError:null};
function inspect(self,args){
 var e=self.editor,g=e&&e.graphic,frames=g&&g.frames||[],
 layer=e&&e.layers&&e.layers.getSelectedLayerObject&&e.layers.getSelectedLayerObject(),
 ts=layer&&layer.getTileSet&&layer.getTileSet(),rec=ts&&ts.getDocRecord&&ts.getDocRecord(),
 data=rec&&rec.data||{},groups=data.ricoGroupAnimationsV1||{},all=[];
 for(var b=1;b<=2;b++)(groups['bank'+b]||[]).forEach(function(x){if(x&&x.type)all.push({bank:b,type:x.type,count:x.cells&&x.cells.length||0});});
 var configured=0,tiles=ts&&ts.tileData||[];
 for(var i=0;i<tiles.length;i++)if(tiles[i]&&tiles[i].props&&tiles[i].props.animated)configured++;
 return {width:g&&g.getGridWidth&&g.getGridWidth(),height:g&&g.getGridHeight&&g.getGridHeight(),
  frames:frames.length,motions:frames.map(function(f){return f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type||'';}),
  groups:all,individualConfiguredBank1:configured,
  requestedMode:args&&args.mode||'',screenMode:layer&&layer.getScreenMode&&layer.getScreenMode()||'',lastError:null};
}
function fail(msg){
 monitor.lastError=msg;if(monitor.last)monitor.last.lastError=msg;
 console.error('[RICO TEST330 ERROR]',msg);
 if(typeof window.alert==='function')window.alert('Error de exportación PRG: '+msg);
 return false;
}
ToPRGAdv.prototype.createPRG=function(args){
 args=args||{};
 try{monitor.last=inspect(this,args);}catch(e){monitor.last={analysisError:String(e),motions:[],groups:[]};}
 monitor.lastError=null;
 var info=monitor.last,m=info.motions||[],active=m.filter(Boolean),diag=active.some(function(t){return /^diag-/.test(t);}),
 vertical=active.some(function(t){return t==='up'||t==='down';}),
 horizontal=active.some(function(t){return t==='left'||t==='right';}),
 ecm=info.requestedMode==='extended'||info.screenMode==='c64ecm';
 info.route=diag?'diagonal':vertical?'vertical':horizontal?'horizontal':'standalone';
 // Suppress fake success: these exporters do not yet initialize ECM registers.
 if(ecm&&(diag||vertical||(horizontal&&info.frames>1))&&info.width>40)
  return fail('ECM '+info.route+' de '+info.frames+' frame(s) necesita portar el pack de 64 glyphs y los cuatro fondos. No se exporta un Text Mode distinto del solicitado.');
 // Group-only ECM is now handled by the group exporter, preserving 4 background registers.
 if(diag&&info.groups.length>1)
  return fail('La ruta diagonal actual solo usa un grupo. Hay '+info.groups.length+' y faltaría el resto. Necesita scheduler multigrupo.');
 var oldAlert=typeof window.alert==='function'?window.alert:null,said=false;
 if(oldAlert)window.alert=function(){said=true;return oldAlert.apply(window,arguments);};
 try{
  var result=previous.apply(this,arguments);
  if(result===false||result===null){
    var why=window.RICO_TEST326_HORIZONTAL_LAST_ERROR||
      window.RICO_TEST247_LAST_ERROR||
      window.RICO_TEST200_HORIZONTAL_LAST_ERROR||
      'El motor '+info.route+' no produjo PRG. Consultar errores de consola.';
    monitor.lastError=String(why);info.lastError=monitor.lastError;
    if(!said&&oldAlert)oldAlert.call(window,'Error de exportación PRG: '+monitor.lastError);
  }
  return result;
 }catch(err){
  monitor.lastError=String(err&&err.message||err);info.lastError=monitor.lastError;
  console.error('[RICO TEST330 ERROR]',err);
  if(!said&&oldAlert)oldAlert.call(window,'Error de exportación PRG: '+monitor.lastError);
  return false;
 }finally{if(oldAlert)window.alert=oldAlert;}
};
window.RICO_TEST330_EXPORT_MONITOR=monitor;
console.log('[RICO TEST330] Export monitor ready. No success notices.');
})();
