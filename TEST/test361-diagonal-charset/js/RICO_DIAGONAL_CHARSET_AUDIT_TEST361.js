/* TEST361 — passive, non-blocking C64 diagonal PRG charset audit.
 * Validates the actual downloaded binary against the active editor glyphs.
 * NEVER rewrites bytes, intercepts the download, or vetoes any export mode.
 * Designed for LVLLVL TEST.json 50x35 diag-up-left 8px/tick regression.
 */
(function(){
 'use strict';
 if(typeof ToPRGAdv==='undefined'||ToPRGAdv.prototype.__rico361Audit)return;
 var original=ToPRGAdv.prototype.createPRG;
 function expectedGlyphBytes(tiles){
  if(!tiles||tiles.length<256)return null;
  var result=new Uint8Array(2048);
  for(var code=0;code<256;code++){
   var pixels=tiles[code]&&tiles[code].data&&tiles[code].data[0];
   if(!pixels||pixels.length!==64)return null;
   for(var row=0;row<8;row++){
    var value=0;
    for(var col=0;col<8;col++)if(pixels[row*8+col])value|=(128>>col);
    result[code*8+row]=value;
   }
  }
  return result;
 }
 function compareAt(bin,load,address,expected){
  if(!expected)return {status:'NO GLYPH DATA'};
  var offset=address-load+2;
  if(offset<2||offset+expected.length>bin.length)return {status:'OUTSIDE PRG',address:address,load:load,length:bin.length};
  var errors=0,examples=[];
  for(var i=0;i<expected.length;i++){
   if(bin[offset+i]!==expected[i]){
    if(examples.length<8)examples.push({address:address+i,expected:expected[i],actual:bin[offset+i]});
    errors++;
   }
  }
  return {status:errors===0?'MATCH':'MISMATCH',address:address,checked:expected.length,mismatches:errors,firstDifferences:examples};
 }
 function check(prg,instance){
  var editor=instance&&instance.editor,frames=editor&&editor.graphic&&editor.graphic.frames||[];
  var f=frames[0],scroll=f&&f.ricoMapScrollV1;
  if(!scroll||!/^diag-(up|down)-(left|right)$/.test(scroll.type))return null;
  var layer=editor.layers&&editor.layers.getSelectedLayerObject&&editor.layers.getSelectedLayerObject();
  var ts=layer&&layer.getTileSet&&layer.getTileSet();
  var font1=ts&&expectedGlyphBytes(ts.tileData);
  var record=ts&&ts.getDocRecord&&ts.getDocRecord(),store=record&&record.data||{};
  var font2=expectedGlyphBytes(store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData)||font1;
  var o={version:361,direction:scroll.type,frameCount:frames.length,
   size:[editor.graphic.getGridWidth(),editor.graphic.getGridHeight()],
   bank:Number(f.charsetBank)===2?2:1,
   bytes:prg&&prg.length||0,nonBlocking:true,checked:false};
  if(!(prg instanceof Uint8Array)&&!(prg&&prg.buffer instanceof ArrayBuffer)){
   o.status='NO BINARY RETURN';return o;
  }
  var b=prg instanceof Uint8Array?prg:new Uint8Array(prg.buffer,prg.byteOffset||0,prg.byteLength||prg.buffer.byteLength);
  if(b.length<3){o.status='INVALID PRG LENGTH';return o;}
  var load=b[0]|(b[1]<<8);
  o.loadAddress=load;
  // These fixed addresses belong to the existing TEST196 diagonal map route.
  // Other valid exporters may use alternate layouts. Report but DO NOT BLOCK.
  o.charsetBank1=compareAt(b,load,0x3000,font1);
  o.charsetBank2=compareAt(b,load,0x3800,font2);
  o.status=o.charsetBank1.status==='MATCH'&&o.charsetBank2.status==='MATCH'?'FONT BYTES MATCH PRG':'CHECK EXPORT ROUTE / FONT ADDRESS';
  o.checked=true;
  return o;
 }
 ToPRGAdv.prototype.createPRG=function(args){
  var value=original.apply(this,arguments);
  try{
   var r=check(value&&value.length?value:this.prg,this);
   if(r){
    window.RICO_TEST361_DIAG.last=r;
    console.info('[TEST361] Diagonal charset audit (informational only)',r);
   }
  }catch(error){
   console.warn('[TEST361] Audit skipped; export is unaffected:',error);
  }
  return value;
 };
 ToPRGAdv.prototype.__rico361Audit=true;
 window.RICO_TEST361_DIAG={version:361,last:null,check:check,expectedGlyphBytes:expectedGlyphBytes,nonBlocking:true};
 console.info('[TEST361] Passive charset PRG audit enabled; exporter unchanged.');
})();
