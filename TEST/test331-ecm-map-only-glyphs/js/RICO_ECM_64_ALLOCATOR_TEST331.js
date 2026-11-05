/* RICO TEST331: one allocation rule for all participating ECM PRG exporters.
 * Count ONLY glyph codes referenced in the full source map. Group source tiles
 * not painted anywhere stay in immutable animation source data and write their
 * runtime destination to an unused CPU-RAM sink ($E000), not a VIC glyph slot.
 * Merge visually identical static glyphs only when BOTH 8-byte charset banks
 * match. Never merge separately animated destination glyphs.
 */
(function(){
'use strict';
function allocate(args){
 var counts=args.counts||{},bank1=args.bank1,bank2=args.bank2||bank1,
   groups=args.groupCodes||{},animated=args.animatedCodes||{},pinned={},
   glyphCodes=Object.keys(counts).map(Number);
 if(!bank1||!bank2||bank1.length!==2048||bank2.length!==2048)
  throw Error('ECM: falta un charset de 256 caracteres × 8 bytes en BANK 1/2.');
 glyphCodes.forEach(function(code){
  if(!Number.isInteger(code)||code<0||code>255)
   throw Error('ECM: índice de mapa fuera de 0..255: '+code);
  if(groups[code]||animated[code])pinned[code]=true;
 });
 glyphCodes.sort(function(a,b){return counts[b]-counts[a]||a-b});
 var map=Object.create(null),reps=[],keys=Object.create(null),seen={},groupActive=0,merged=0;
 function pattern(code){
  var out='';for(var row=0;row<8;row++){
   out+=String.fromCharCode(bank1[code*8+row]);
   out+=String.fromCharCode(bank2[code*8+row]);
  }
  return out;
 }
 for(var i=0;i<glyphCodes.length;i++){
  var id=glyphCodes[i],key=pattern(id),slot;
  // Pinned characters must NEVER share physical bytes with another character,
  // even when their starting shape is identical.
  if(!pinned[id]&&Object.prototype.hasOwnProperty.call(keys,key)){
   slot=keys[key];merged++;
  }else{
   slot=reps.length;
   reps.push(id);
   if(!pinned[id])keys[key]=slot;
  }
  map[id]=slot;
  if(groups[id])groupActive++;
 }
 if(reps.length>64){
  throw Error('ECM: el mapa tiene '+glyphCodes.length+' índices utilizados, '+
   reps.length+' glifos físicos necesarios tras compactar dibujos idénticos ( '+
   groupActive+' destinos grupales independientes ). El VIC-II admite 64. '+
   'No se alteró el proyecto. Para más de 64 simultáneos se necesita un charset dinámico.');
 }
 var b1=new Uint8Array(2048),b2=new Uint8Array(2048);
 for(var k=0;k<reps.length;k++)for(var row=0;row<8;row++){
  b1[k*8+row]=bank1[reps[k]*8+row];
  b2[k*8+row]=bank2[reps[k]*8+row];
 }
 var unpaintedGroup=Object.keys(groups).filter(function(k){return map[Number(k)]===undefined;});
 return {physicalByCode:map,representatives:reps,bank1:b1,bank2:b2,
  sourceIndexCount:glyphCodes.length,uniqueGlyphs:reps.length,mergedAliases:merged,
  activeGroupDestinations:groupActive,unpaintedGroupSourceCount:unpaintedGroup.length,
  unpaintedGroupSourceCodes:unpaintedGroup.map(Number),sinkAddress:0xe000,
  rule:'Only map-used glyph codes receive visible VIC charset indices'};
}
window.RICO_TEST331_ECM_ALLOCATOR={allocate:allocate,version:331};
console.log('[RICO TEST331] Source-map-only 64-glyph allocator loaded.');
})();
