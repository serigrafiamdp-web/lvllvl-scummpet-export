/* TEST145: rebalanced count-aware estimated NORMAL character preview, not C64 IRQ timing.
 * This adapter receives ONLY the visual tick of the TileSet update. It never
 * edits character props, source pixels, saved ticks, map scroll, or PRG export.
 * TEST144 forced 128 active chars to ~15 Hz; the user reports RICO VICE
 * export is visibly FASTER than that preview. TEST145 raises the estimate.
 * Still an unverified heuristic; match exact VICE speed from recorded playback.
 */
(function () {
  'use strict';
  if (typeof TileSet === 'undefined') return;
  var previousUpdate = TileSet.prototype.update;
  var POINTS = [[0,50],[16,50],[32,50],[64,48],[96,37],[128,26],[160,23],[192,20],[224,18],[256,16]];
  var GROUP_FIELD = 'ricoGroupAnimationsV1';
  var BANK2_FIELD = 'ricoCharsetBank2';

  function interpolateRate(n) {
    n = Math.max(0, Math.min(256, n | 0));
    for(var i=1;i<POINTS.length;i++){
      if(n<=POINTS[i][0]){
        var a=POINTS[i-1],b=POINTS[i];
        return a[1]+(b[1]-a[1])*(n-a[0])/(b[0]-a[0]);
      }
    }
    return 8;
  }
  function isAnimated(tile) {
    var t=tile && tile.props && tile.props.animated;
    return !!(t && t!=='none');
  }
  function countBank(tiles) {
    if(!tiles)return 0;
    var n=0;
    for(var i=0;i<Math.min(256,tiles.length);i++) if(isAnimated(tiles[i]))n++;
    return n;
  }
  function bank2Record(ts) {
    try{
      var rec=ts.getDocRecord && ts.getDocRecord();
      var b=rec && rec.data && rec.data[BANK2_FIELD];
      if(b && b.version===1 && b.tileData && b.tileData.length>=256) return b;
    }catch(e){}
    return null;
  }
  function activeBank(ts) {
    var g=ts.editor && ts.editor.graphic;
    if(!g || !g.frames || !g.frames.length)return 1;
    var f=g.frames[g.getCurrentFrame()];
    return f && +f.charsetBank===2 ? 2:1;
  }
  function bypass(ts,b2) {
    if(!b2 || !ts.getTileWidth || ts.getTileWidth()!==8 || ts.getTileHeight()!==8)return true;
    var g=ts.editor && ts.editor.graphic;
    if(!g || !g.frames || !g.frames.length)return false;
    var f=g.frames[g.getCurrentFrame()];
    // SCUMM visual scheduler and Group Animate remain entirely independent.
    if(f && f.ricoMapScrollV1 && f.ricoMapScrollV1.type)return true;
    var record=ts.getDocRecord && ts.getDocRecord();
    var groups=record && record.data && record.data[GROUP_FIELD];
    if(groups){
      if(Array.isArray(groups) && groups.length)return true;
      if(groups[1] && groups[1].length)return true;
      if(groups[2] && groups[2].length)return true;
      if(groups.bank1 && groups.bank1.length)return true;
      if(groups.bank2 && groups.bank2.length)return true;
    }
    return false;
  }
  // Use the input tick itself, not wall-clock catch-up. This mimics LVLLVL's
  // one-step-per-completed-browser-update rule and preserves 1T => 1 phase.
  // Subsequent nested updates at the same input tick are idempotent.
  function nextTick(ts, raw, rate) {
    var s=ts.__ricoNormalPreview145;
    if(!s || raw<s.raw || raw-s.raw>100){
      s={raw:raw,visual:raw,rate:rate};
      ts.__ricoNormalPreview145=s;
      return raw;
    }
    var delta=Math.max(0,Math.min(10,raw-s.raw));
    s.raw=raw;
    s.visual+=delta*rate/50;
    s.rate=rate;
    return Math.floor(s.visual);
  }
  TileSet.prototype.update=function(tick){
    if(typeof tick!=='number' || !isFinite(tick))return previousUpdate.apply(this,arguments);
    var b2=bank2Record(this);
    if(bypass(this,b2)){
      this.__ricoNormalPreview145=null;
      return previousUpdate.apply(this,arguments);
    }
    var bank=activeBank(this);
    var visibleCount=countBank(bank===2?b2.tileData:this.tileData);
    var otherCount=countBank(bank===2?this.tileData:b2.tileData);
    // Both indexes animate independently, but must share one coherent phase clock.
    var rate=interpolateRate(Math.max(visibleCount,otherCount));
    var virtualTick=nextTick(this,tick,rate);
    return previousUpdate.call(this,virtualTick);
  };
  window.RICO_TEST145_REALISTIC_PREVIEW = {rateForCount:interpolateRate,countBank:countBank,version:'145'};
  console.log('[RICO TEST145] Normal character preview calibrated by animated tile count; PRG/Map Scroll unchanged.');
})();
