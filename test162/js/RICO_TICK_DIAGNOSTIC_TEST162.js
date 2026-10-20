(function(){
'use strict';
// TEST162 only: instrumentation, not a clock fix or change to Group Animate.
if(typeof Frames === 'undefined' || !Frames.prototype || typeof Frames.prototype.update !== 'function') return;
var oldUpdate=Frames.prototype.update;
var oldGroupUpdate = (typeof TileSet !== 'undefined' && TileSet.prototype) ? TileSet.prototype.update : null;
var perf = window.performance && window.performance.now ? function(){ return window.performance.now(); } : function(){ return Date.now(); };
var counters={calls:0,ticks:0,groupCalls:0,drawMs:0,windowStart:0,lastTick:null,paintMs:0,paintCalls:0};
var latest={callsPerSecond:0,ticksPerSecond:0,groupCallsPerSecond:0,groupMsPerTick:0};
function fmt(n){return isFinite(n)?n.toFixed(1):'?';}
Frames.prototype.update=function(){
  counters.calls++;
  var result=oldUpdate.apply(this,arguments);
  if(typeof g_tick !== 'undefined') {
    if(counters.lastTick !== null) counters.ticks+=Math.max(0,g_tick-counters.lastTick);
    counters.lastTick=g_tick;
  }
  return result;
};
if(oldGroupUpdate) {
  TileSet.prototype.update=function(){
    var ts=this,doc=null,has=false;
    try{doc=ts.getDocRecord&&ts.getDocRecord(); var v=doc&&doc.data&&doc.data.ricoGroupAnimationsV1;has=!!(v&&((v.bank1&&v.bank1.length)||(v.bank2&&v.bank2.length)));}catch(e){}
    if(!has)return oldGroupUpdate.apply(this,arguments);
    var before=perf(),r=oldGroupUpdate.apply(this,arguments),elapsed=perf()-before;
    counters.groupCalls++;counters.drawMs+=elapsed;
    return r;
  };
}
function ensurePanel(){
  var el=document.getElementById('rico-test162-hud');
  if(el)return el;
  if(!document.body)return null;
  el=document.createElement('div');el.id='rico-test162-hud';
  el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99998;background:rgba(0,0,0,.88);color:#cdf6d1;font:12px/1.5 Consolas,monospace;white-space:pre;padding:10px 13px;border:1px solid #529569;pointer-events:none;max-width:310px';
  document.body.appendChild(el);return el;
}
function refresh(){
  var now=perf();if(!counters.windowStart){counters.windowStart=now;return;}
  var dt=(now-counters.windowStart)/1000;if(dt<0.8)return;
  latest={callsPerSecond:counters.calls/dt,ticksPerSecond:counters.ticks/dt,groupCallsPerSecond:counters.groupCalls/dt,groupMsPerTick:counters.groupCalls?counters.drawMs/counters.groupCalls:0};
  window.RICO_TEST162_STATS=latest;
  var el=ensurePanel();if(el){
    var target=50,ok=latest.ticksPerSecond>=48;
    el.textContent='TEST162 | PREVIEW SIN CAMBIOS\n'+
      'Pantalla / update : '+fmt(latest.callsPerSecond)+' /s\n'+
      'Ticks LVLLVL      : '+fmt(latest.ticksPerSecond)+' /s'+(ok?'  OK':'  <50')+'\n'+
      'Group update     : '+fmt(latest.groupCallsPerSecond)+' /s\n'+
      'Costo update     : '+fmt(latest.groupMsPerTick)+' ms\n'+
      'Objetivo PAL     : '+target+' ticks/s\n'+
      'PRG VICE: monitor  m c000 c004';
  }
  counters.windowStart=now;counters.calls=0;counters.ticks=0;counters.groupCalls=0;counters.drawMs=0;
}
window.setInterval(refresh,1000);
window.RICO_TEST162_DIAGNOSTIC=true;
})();
