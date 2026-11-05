/* TEST336 — common multiframe ECM assignment. No modifications to editor or JSON.
 * Preserve map only glyphs, independent animation source, and 4 backgrounds PER frame. */
(function(){
'use strict';
function pack(self,data){
 var ed=self.editor,layer=ed.layers.getSelectedLayerObject(),ts=layer.getTileSet(),
     store=ts.getDocRecord().data||{},frames=ed.graphic.frames,
     already=layer.getScreenMode&&layer.getScreenMode()==='c64ecm',
     noColor=ed.colorPaletteManager&&ed.colorPaletteManager.noColor,
     counts=Object.create(null),each=[],group=data[0].group||null,
     groupCodes=Object.create(null),animated=Object.create(null);
 function present(v){return v!==undefined&&v!==null&&v!==false&&v!==-1&&v!==noColor;}
 function color(v){v=Number(v);if(!Number.isInteger(v)||v<0||v>15)throw Error('ECM multiframe: color inválido '+v);return v;}
 for(var n=0;n<data.length;n++){
  var f=frames[n],d=data[n],ar=f.ricoScrollAreaV1||{},wi=f.ricoWindowDimensionV1||{},
      w=d.areaWidth,def=color(layer.getBackgroundColor?layer.getBackgroundColor(n):14),
      original=[],bgs=[],freq=Object.create(null),regs=[];
  if(already)for(var reg=0;reg<4;reg++){
   var rv=layer.getC64ECMColor?layer.getC64ECMColor(reg,n):def;
   regs.push(color(present(rv)?rv:def));
  }
  for(var y=0;y<25;y++)for(var x=0;x<w;x++){
   var cell=layer.getCell({x:ar.x+x,y:wi.y+y,frame:n})||{},tile=Number(cell.t);
   if(!Number.isInteger(tile)||tile<0||tile>255)
      throw Error('ECM Frame '+(n+1)+': tile fuera de 0..255.');
   var id=already?tile&63:tile,bg=already?(present(cell.bc)?Number(cell.bc):tile>>6):
     (present(cell.bc)?color(cell.bc):def);
   if(already&&(!Number.isInteger(bg)||bg<0||bg>3))
      throw Error('ECM Frame '+(n+1)+': selector de fondo fuera de 0..3.');
   original.push(id);bgs.push(bg);counts[id]=(counts[id]||0)+1;
   if(!already)freq[bg]=(freq[bg]||0)+1;
  }
  if(!already){
   var colors=Object.keys(freq).map(Number).sort(function(a,b){return freq[b]-freq[a]||a-b;});
   if(colors.length>4)throw Error('ECM Frame '+(n+1)+': '+colors.length+' fondos simultáneos; C64 permite 4.');
   regs=colors.includes(def)?[def].concat(colors.filter(function(v){return v!==def;})):colors.slice();
   if(!regs.length)regs=[def];while(regs.length<4)regs.push(regs[regs.length-1]);
  }
  each.push({raw:original,bgs:bgs,regs:regs,width:w});
 }
 if(group&&group.codes)Object.keys(group.codes).forEach(function(c){
  groupCodes[already?(Number(c)&63):Number(c)]=true;
 });
 var bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
 Object.keys(counts).forEach(function(id){
  for(var b=0;b<2;b++){
   var bank=b?bank2:ts.tileData,orig=bank&&bank[Number(id)];
   if(orig&&orig.props&&orig.props.animated)animated[id]=true;
  }
 });
 var allocator=window.RICO_TEST331_ECM_ALLOCATOR;
 if(!allocator)throw Error('TEST336: no está instalado el asignador ECM de TEST331.');
 var allocation=allocator.allocate({counts:counts,bank1:data[0].bank1,
   bank2:data[0].bank2,groupCodes:groupCodes,animatedCodes:animated});
 var names=allocation.physicalByCode;
 for(var i=0;i<data.length;i++){
  var d=data[i],info=each[i],palette=info.regs,slotByColor=Object.create(null),
      packed=[],w=info.width;
  if(!already)for(var k=0;k<4;k++)
    if(slotByColor[palette[k]]===undefined)slotByColor[palette[k]]=k;
  for(var yy=0;yy<25;yy++){
   var row=[];
   for(var xx=0;xx<w;xx++){
    var at=yy*w+xx,physical=names[info.raw[at]],
        slot=already?info.bgs[at]:slotByColor[info.bgs[at]];
    if(!Number.isInteger(physical)||physical>=64||!Number.isInteger(slot)||slot>3)
      throw Error('ECM Frame '+(i+1)+': no se pudo representar el glifo/fondo.');
    row.push(physical|(slot<<6));
   }
   packed.push.apply(packed,row.concat(row));
  }
  if(packed.length!==d.map.length)throw Error('ECM Frame '+(i+1)+': mapa compactado cambia la geometría.');
  d.map=packed;d.bank1=allocation.bank1;d.bank2=allocation.bank2;
  d.ecm328=true;d.ecmBG328=palette;d.bg=palette[0];
  if(d.group){
   var addr=[],codes=Object.create(null);
   for(var gx=0;gx<d.group.w;gx++)for(var gy=0;gy<d.group.h;gy++){
    var old=d.group.cells[gx][gy],id=already?old&63:old,physical=names[id];
    addr.push(physical===undefined?allocation.sinkAddress:
      (d.group.bank===2?0x3800:0x3000)+physical*8);
    if(physical!==undefined)codes[physical]=true;
   }
   d.group=Object.assign({},d.group,{addresses:addr,codes:codes});
  }
  d.__ricoIndividual327=(d.__ricoIndividual327||[]).map(function(rec){
   var old=already?rec.code&63:rec.code,physical=names[old];
   if(physical===undefined)throw Error('ECM Frame '+(i+1)+': animación individual sin glifo '+old);
   if(group&&group.bank===rec.bank&&groupCodes[old])
     throw Error('ECM: el glifo '+old+' tiene Group Scroll e Individual sobre los mismos 8 bytes.');
   return Object.assign({},rec,{code:physical,
     address:(rec.bank===2?0x3800:0x3000)+physical*8});
  });
 }
 var last={frames:data.length,mode:'ECM',glyphs:allocation.uniqueGlyphs,
   sourceIndices:allocation.sourceIndexCount,
   individual:data.reduce(function(v,d){return v+d.__ricoIndividual327.length;},0),
   backgrounds:each.map(function(x){return x.regs.slice();}),
   group:!!group,nonDestructive:true};
 window.RICO_TEST336_FRAME_REPORT=last;
 return last;
}
window.RICO_TEST336_SHARED_ECM={pack:pack,version:336};
})();