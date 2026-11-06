/* TEST337 forensic instrumentation; no export engine replacement.
   Captures the real Export PRG call and status, selected layer/banks,
   and clock samples. All original methods delegate synchronously. */
(function(){
'use strict';
var records=[], attempted=0, downloaded=0, inExport=false, ui=null, lastTick=null, ticks=0;
function log(kind,details){
  var line={at:new Date().toISOString(),kind:kind,details:details||{}};
  records.push(line);if(records.length>160)records.shift();
  if(ui&&ui.status)ui.status.textContent=kind+' · '+(details&&details.message||details&&details.result||'');
  console.log('[RICO TEST337]',line);
}
function safe(f){try{return f();}catch(e){return {error:String(e&&e.message||e)};}}
function objInfo(obj){return {isArray:Array.isArray(obj),length:obj&&obj.length||0};}
function fingerprint(tiles){
  if(!tiles)return {present:false};
  var nonempty=0,checksum=2166136261,total=0;
  for(var i=0;i<Math.min(256,tiles.length);i++){
    var dat=tiles[i]&&tiles[i].data&&tiles[i].data[0];
    if(!dat)continue;
    var ink=0;
    for(var j=0;j<dat.length;j++){
      var n=Number(dat[j])||0;
      ink+=n?1:0;checksum=Math.imul(checksum^n,16777619)>>>0;total++;
    }
    if(ink)nonempty++;
  }
  return {present:true,tiles:tiles.length,nonempty:nonempty,checksum:checksum.toString(16),pixels:total};
}
function snapshot(){
 return safe(function(){
  var ed=typeof g_app!=='undefined'&&g_app&&g_app.textModeEditor;
  if(!ed)return {editor:false};
  var gr=ed.graphic,layer=ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
  var ts=layer&&layer.getTileSet&&layer.getTileSet();
  var doc=ts&&ts.getDocRecord&&ts.getDocRecord(),store=doc&&doc.data||{};
  var a=store.ricoGroupAnimationsV1||{};
  var fr=gr&&gr.frames||[];
  var frame=fr[gr&&gr.currentFrame||0]||fr[0]||{};
  var mode=layer&&layer.getScreenMode&&layer.getScreenMode();
  var b1=fingerprint(ts&&ts.tileData),b2=fingerprint(store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData);
  return {
   editor:true,grid:{width:gr&&gr.getGridWidth&&gr.getGridWidth(),height:gr&&gr.getGridHeight&&gr.getGridHeight()},
   frames:fr.length,screenMode:mode,charsetBank:frame.charsetBank||1,
   mapScroll:frame.ricoMapScrollV1||null,window:frame.ricoWindowDimensionV1||null,scrollArea:frame.ricoScrollAreaV1||null,
   groups:[1,2].flatMap(function(bank){return (a['bank'+bank]||[]).filter(function(g){return g&&g.type;}).map(function(g){return {bank:bank,id:g.id,type:g.type,tiles:g.cells&&g.cells.length,width:g.widthTiles,height:g.heightTiles,ticks:g.ticksPerFrame,pixels:g.pixelsPerTick};});}),
   bank1:b1,bank2:b2,bank2IsExplicit:!!(store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData),
   ticksObserved:ticks,lastTick:lastTick,
   HBuildPlan:window.RICO_TEST336_LAST_PLAN||null,
   HError:window.RICO_TEST326_HORIZONTAL_LAST_ERROR||null,
   standaloneError:window.RICO_TEST247_LAST_ERROR||null,
   ecmError:window.RICO_TEST328_ECM_EXPORT&&window.RICO_TEST328_ECM_EXPORT.lastError||null
  };
 });
}
function readable(v){try{return JSON.stringify(v,null,2);}catch(e){return String(v);}}
function mount(){
 if(document.getElementById('rico337panel'))return;
 var panel=document.createElement('div');panel.id='rico337panel';
 panel.style.cssText='position:fixed;bottom:10px;left:10px;z-index:2147483640;width:320px;max-width:90vw;background:#101721;color:#f0f5ff;border:1px solid #61a8be;border-radius:8px;padding:10px;font:12px Arial;box-shadow:0 2px 14px #0009';
 var title=document.createElement('div');title.textContent='TEST337 · Auditoría (solo lectura)';title.style.fontWeight='bold';title.style.marginBottom='6px';panel.appendChild(title);
 var status=document.createElement('div');status.textContent='Listo. Cargá JSON, probá Play y Export PRG.';status.style.marginBottom='8px';panel.appendChild(status);
 function addButton(label,handler){
  var button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='padding:5px;margin:2px;background:#295e78;color:white;border:0;border-radius:4px;cursor:pointer';
  button.addEventListener('click',handler);panel.appendChild(button);
 }
 addButton('Estado / Bancos',function(){var snap=snapshot();log('snapshot',snap);window.alert('TEST337 datos de proyecto:\n'+readable(snap).slice(0,2600));});
 addButton('Copiar diagnóstico',function(){
  var dump=readable({test:337,project:snapshot(),attempted:attempted,downloads:downloaded,events:records});
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(dump).then(function(){status.textContent='Diagnóstico copiado: pegalo en el chat';},function(){fallback(dump);});}
  else fallback(dump);
 });
 function fallback(dump){window.prompt('Copiá el diagnóstico:',dump);}
 addButton('Ocultar',function(){panel.style.display='none';});
 var reopen=document.createElement('button');reopen.textContent='TEST337';reopen.style.cssText='position:fixed;bottom:6px;left:6px;z-index:2147483640;background:#295e78;color:white;border:0;padding:5px;border-radius:3px';
 reopen.onclick=function(){panel.style.display='block';};document.body.appendChild(reopen);
 document.body.appendChild(panel);ui={panel:panel,status:status};
}
if(typeof ToPRGAdv==='undefined'){console.error('[TEST337] ToPRGAdv unavailable');return;}
var oldCreate=ToPRGAdv.prototype.createPRG;
ToPRGAdv.prototype.createPRG=function(){
 attempted++;
 log('export-start',{attempt:attempted,args:safe(function(){return arguments[0];}.bind(null,arguments[0])),project:snapshot()});
 var before=downloaded;
 inExport=true;
 try{
  var result=oldCreate.apply(this,arguments);
  log('export-return',{result:result===false?'false':result==null?String(result):result&&result.byteLength!=null?'bytes '+result.byteLength:typeof result,downloadDelta:downloaded-before,
   HBuildPlan:window.RICO_TEST336_LAST_PLAN||null,ecm:window.RICO_TEST328_ECM_EXPORT&&window.RICO_TEST328_ECM_EXPORT.lastError||null,
   horizontalError:window.RICO_TEST326_HORIZONTAL_LAST_ERROR||null,standaloneError:window.RICO_TEST247_LAST_ERROR||null});
  if(!result&&downloaded===before&&(!arguments[0]||arguments[0].download!==false)){
   log('export-failed-no-file',{message:'La cadena devolvió '+String(result)+' y no descargó PRG. Mirá los datos y copiá el diagnóstico.'});
  }
  return result;
 }catch(e){log('export-exception',{message:String(e&&e.message||e),stack:e&&e.stack||null});throw e;}
 finally{inExport=false;}
};
if(typeof window.download==='function'){
 var oldDownload=window.download;
 window.download=function(){
  if(inExport){downloaded++;log('download',{name:arguments[1],bytes:arguments[0]&&arguments[0].length||0});}
  return oldDownload.apply(this,arguments);
 };
}
var oldAlert=window.alert;
window.alert=function(msg){if(inExport)log('export-alert',{message:String(msg)});return oldAlert.apply(this,arguments);};
window.addEventListener('error',function(e){log('page-error',{message:e.message||'',source:e.filename||'',line:e.lineno||0});});
window.addEventListener('unhandledrejection',function(e){log('rejection',{message:String(e.reason&&e.reason.message||e.reason)});});
if(typeof TileSet!=='undefined'&&TileSet.prototype&&TileSet.prototype.update){
 var oldUpdate=TileSet.prototype.update;
 TileSet.prototype.update=function(tick){
  if(tick!==lastTick){ticks++;lastTick=tick;}
  return oldUpdate.apply(this,arguments);
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
window.RICO_TEST337_DIAGNOSTIC={snapshot:snapshot,events:records,report:function(){return {project:snapshot(),attempted:attempted,downloads:downloaded,events:records};}};
log('loaded',{message:'Forensic instrumentation active, no export engine modifications'});
})();