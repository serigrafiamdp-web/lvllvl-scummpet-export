/* TEST327 — Horizontal Map Scroll 100+ columns + simultaneous native
 * individual C64 character scroll (both banks) + existing group scroll.
 * Isolated TEST326 fork; no changes to production/master engines.
 * TEST175/176's native glyph routine is reused verbatim from the existing
 * large-map vertical engine, while the horizontal IRQ remains map-first.
 */
(function(){
'use strict';
var TAG='[RICO TEST327]';
var H=window.RICO_TEST186_HORIZONTAL;
if(!H||!H.collect||!H.build||!window.RICO_TEST168_PRG_LARGE_MAP){
  console.error(TAG,'Missing horizontal/vertical exporter dependencies');return;
}
var oldCollect=H.collect,oldBuild=H.build;
var TYPE_CODE={left:0,right:1,up:2,down:3,blink:4};
var state={version:327,last:null,error:null,builds:0};
function replaceOne(source,needle,replacement,label){
  var at=source.indexOf(needle);
  if(at<0||source.indexOf(needle,at+needle.length)>=0)
    throw new Error('TEST327: ancla ASM '+label+' ausente o duplicada. Exportación cancelada, no se omiten efectos.');
  return source.slice(0,at)+replacement+source.slice(at+needle.length);
}
function glyphRecords(self,d){
  var ed=self.editor,layer=ed.layers.getSelectedLayerObject(),ts=layer&&layer.getTileSet&&layer.getTileSet();
  if(!ts)throw new Error('TEST327: falta TileSet del editor.');
  var record=ts.getDocRecord&&ts.getDocRecord();
  var store=record&&record.data||{},bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
  var banks=[ts.tileData,bank2],used=new Uint8Array(256),map=d.map||[];
  // Respect animated characters present in the exported map. One code can
  // be used many times but its physical glyph moves only once each tick.
  for(var j=0;j<map.length;j++)used[map[j]&255]=1;
  var records=[],unseen=[],groups=d.group||null;
  for(var b=0;b<2;b++){
    var tiles=banks[b];if(!tiles||tiles.length<256)continue;
    for(var id=0;id<256;id++){
      var tile=tiles[id],props=tile&&tile.props||{},type=props.animated;
      if(type===undefined||type===null||type===false||type==='')continue;
      if(!Object.prototype.hasOwnProperty.call(TYPE_CODE,type))
        throw new Error('TEST327: animación individual '+type+' de BANK'+(b+1)+' carácter '+id+' todavía no tiene rutina nativa.');
      if(!used[id]){unseen.push('BANK'+(b+1)+':'+id);continue;}
      if(groups&&groups.bank===b+1&&groups.codes&&groups.codes[id])
        throw new Error('TEST327: BANK'+(b+1)+' carácter '+id+' tiene scroll individual Y grupal en los mismos 8 bytes. Requiere composición por glyph; no se descartará ninguno silenciosamente.');
      var ticks=Number(props.ticksPerFrame);
      if(!Number.isInteger(ticks)||ticks<1||ticks>255)
        throw new Error('TEST327: ticks por frame de BANK'+(b+1)+' carácter '+id+' fuera de 1..255.');
      var addr=(b?0x3800:0x3000)+id*8;
      records.push({bank:b+1,code:id,ticks:ticks,type:TYPE_CODE[type],address:addr});
    }
  }
  state.last={screenWidth:ed.graphic.getGridWidth(),screenHeight:ed.graphic.getGridHeight(),
    mapWidth:d.areaWidth,mapDirection:d.type,individual:records.length,groups:groups?1:0,
    unusedConfigured:unseen,recordAddresses:records.map(function(x){return x.address;})};
  return records;
}
H.collect=function(self){
  var d=oldCollect(self);
  d.__ricoIndividual327=glyphRecords(self,d);
  return d;
};
function extractNativeGlyphRoutine(d){
  // Reuse the actual already implemented and tested glyph kernel rather than
  // maintaining a competing version. Only the data/counter addresses differ.
  var z=new Uint8Array(40*26),c=new Uint8Array(40*26);
  c.fill(14);
  var mock={width:40,height:26,type:'up',typeCode:1,ticks:1,pixels:1,
    duration:12,bg:d.bg||0,border:d.border||0,bank:d.bank||1,initialRow:0,
    window:{x:0,y:0,width:40,height:25},area:{x:0,y:0,width:40,height:25},
    bank1:d.bank1,bank2:d.bank2,map:z,colors:c,
    anim175:{switchTicks:0,records:d.__ricoIndividual327,group:null}};
  var donor=window.RICO_TEST168_PRG_LARGE_MAP.buildSource(mock);
  var start=donor.indexOf('\nanim175_tick\n'),end=donor.indexOf('\n*=$3000\n',start);
  if(start<0||end<start)throw new Error('TEST327: no se encontró el kernel nativo TEST175/176 para injertarlo.');
  return donor.slice(start+1,end);
}
H.build=function(d){
  var src=oldBuild(d),records=d.__ricoIndividual327||[];
  if(!records.length)return src; // Identical PRG path for map/group without native glyph motion.
  var donor=extractNativeGlyphRoutine(d);
  src=replaceOne(src,'charset_bits=$1b\n',
    'charset_bits=$1b\nanim175_ptr_lo=$30\nanim175_ptr_hi=$31\nanim175_dest_lo=$32\nanim175_dest_hi=$33\nanim175_temp=$34\n','zero-page');
  src=replaceOne(src,
    'main_try_group\n lda group182_pending\n beq main_loop\n jsr group182_step\n jmp main_loop',
    'main_try_group\n lda group182_pending\n beq rico327_try_individual\n jsr group182_step\n jmp main_loop\nrico327_try_individual\n lda anim175_pending\n beq main_loop\n jsr anim175_tick\n jmp main_loop','main-loop scheduler');
  src=replaceOne(src,
    'irq_only_group\n jsr group182_irq_tick\n pla\n tay\n pla\n tax\n pla\n rti',
    'irq_only_group\n jsr group182_irq_tick\n lda anim175_pending\n cmp #$ff\n beq rico327_pending_full\n inc anim175_pending\nrico327_pending_full\n pla\n tay\n pla\n tax\n pla\n rti','IRQ tick');
  src=replaceOne(src,'\n*=$3000\ncharset_bank1',
    '\n'+donor+'\n*=$3000\ncharset_bank1','native sprite kernel');
  if(state.last){state.last.asmHasGlyphKernel=src.indexOf('anim175_tick\n')>=0;
    state.last.asmHasMap=src.indexOf('irq_map_step\n')>=0;
    state.last.asmHasGroup=src.indexOf('group182_irq_tick\n')>=0;}
  state.builds++;
  console.log(TAG,'Assembled source with',records.length,'individual glyph animators and group=',!!d.group);
  return src;
};
// Horizontal multi-frame uses a different frame replacement scheduler. Do not
// fake first-frame-only animation support for its other frames.
if(typeof ToPRGAdv!=='undefined'){
  var previousExport=ToPRGAdv.prototype.createPRG;
  ToPRGAdv.prototype.createPRG=function(args){
    try{
      var ed=this.editor,gr=ed&&ed.graphic,fs=gr&&gr.frames||[],
        width=gr&&gr.getGridWidth&&gr.getGridWidth();
      if(fs.length>1&&width>40&&fs.some(function(f){var t=f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;return t==='left'||t==='right';})){
        var layer=ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
        var ts=layer&&layer.getTileSet&&layer.getTileSet(),doc=ts&&ts.getDocRecord&&ts.getDocRecord(),
          store=doc&&doc.data||{},bs=[ts&&ts.tileData,store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData];
        var hasIndividual=bs.some(function(tiles){
          return !!(tiles&&tiles.some(function(t){return !!(t&&t.props&&t.props.animated);}));
        });
        if(hasIndividual)throw new Error('Horizontal multiframe + scroll individual requiere planificador de charset entre frames. TEST327 soporta la combinación completa en 1 frame y no descarta las animaciones de los demás.');
      }
      state.error=null;
      return previousExport.apply(this,arguments);
    }catch(e){
      state.error=e.message;console.error(TAG,e);
      if(typeof window.alert==='function')window.alert('TEST327: '+e.message);
      return false;
    }
  };
}
window.RICO_TEST327_HORIZONTAL=state;
console.log(TAG,'Native individual character animation enabled alongside 1-frame horizontal map and group scroll; groups and bank animation kept.');
})();
