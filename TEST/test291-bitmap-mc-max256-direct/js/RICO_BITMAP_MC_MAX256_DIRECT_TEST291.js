/* TEST291 — 8 multicolor pixels / step, 256 selected tiles stress.
 * 8 MC pixels = 16 bitmap bits = two adjacent 8-bit bitmap tile-columns.
 * Fast aligned case: direct source charset -> bitmap cells, no WORK atlas
 * render and no second refresh copy. Source address lookup per group phase.
 * Explicitly only one horizontal group at rate 8, preserving other modes
 * via the TEST290 normal Export PRG handler. Unchanged: TEST289 PASS.
 */
(function(){
'use strict';
var NAME='[RICO TEST291]',ORIGIN=0x0801,START=0x0810,
    BMPSRC=0x1000,SCRSRC=0x2F40,COLSRC=0x3328,
    BASE=0x8000,DATA=0x9000,END=0xD000;
if(!window.RICO_TEST290_BITMAP||!window.RICO_TEST282_BITMAP||
   typeof Editor==='undefined')return;
var stats={last:null,error:null,exports:0};
function gcd(a,b){while(b){var x=a%b;a=b;b=x;}return a;}
function eligible(model){
 var gs=model&&model.animations;
 return !!(gs&&gs.length===1&&gs[0].rate===8 &&
   (gs[0].type==='left'||gs[0].type==='right')&&
   gs[0].width>=2&&gs[0].memberCount>=1);
}
function highData(model){
 if(!eligible(model))throw Error('TEST291 rápido requiere un grupo horizontal con Pixels/Tick = 8; los demás casos siguen usando TEST290.');
 var g=model.animations[0],width=g.width,shiftTiles=2;
 var period=width/gcd(width,shiftTiles);
 if(period>255)throw Error('Demasiadas fases de scroll.');
 // Identify original group tile slots (the matrix stores tile IDs), and
 // parse the exact list of visible occurrences already built by TEST286.
 var positions={},blank=DATA; // the 8 leading bytes of DATA are zero
 for(var i=0;i<g.matrix.length;i++){
  var tile=g.matrix[i];
  if(tile>=0&&positions[tile]===undefined)
   positions[tile]={x:i%width,y:Math.floor(i/width)};
 }
 var occurrences=[],at=model.refreshPtr-DATA;
 if(at<0||at+4*model.refreshCount>model.data.length)
  throw Error('Tabla original de celdas Bitmap inválida.');
 for(var j=0;j<model.refreshCount;j++){
  var off=at+j*4,workPtr=model.data[off]|model.data[off+1]<<8,
      dest=model.data[off+2]|model.data[off+3]<<8;
  var tile=(workPtr-0x8800)/8;
  if(!Number.isInteger(tile)||!positions[tile])
   throw Error('Tile de grupo sin posición: '+tile);
  occurrences.push({tile,dest});
 }
 // Critical for MAX stress: the same tile ID can occur 1,000 times, yet
 // we store its phase/source address only ONCE per phase. Per occurrence
 // we need 3 bytes: tileID + destination address. No bitmap variants.
 var recordAddress=DATA+8,recordLength=occurrences.length*3,
     loTables=(recordAddress+recordLength+255)&~255,
     hiTables=loTables+period*256,end=hiTables+period*256;
 if(end>END)
  throw Error('TEST291: punteros de '+occurrences.length+' celdas necesitan '+
    (end-DATA)+' bytes; límite '+(END-DATA)+'.');
 var data=new Uint8Array(end-DATA);
 for(var i=0;i<occurrences.length;i++){
  var o=occurrences[i],p=recordAddress-DATA+i*3;
  data[p]=o.tile;data[p+1]=o.dest&255;data[p+2]=o.dest>>8;
 }
 for(var phase=0;phase<period;phase++){
  var displacement=(phase*shiftTiles)%width;
  for(var id in positions){
   var tile=Number(id),o=positions[tile],
       sourceX=g.type==='left'?(o.x+displacement)%width:
         ((o.x-displacement)%width+width)%width,
       sourceTile=g.matrix[o.y*width+sourceX],
       src=sourceTile<0?DATA:BASE+sourceTile*8;
   data[loTables-DATA+phase*256+tile]=src&255;
   data[hiTables-DATA+phase*256+tile]=src>>8;
  }
 }
 return {data,recordAddress,recordLength,loTables,hiTables,
   pointerBytes:period*256*2,period,end,visible:occurrences.length,
   groupWidth:width,direction:g.type,pixelsPerTick:8,
   sourceColumnsPerTick:2,atlasBytes:2048};

}
function assemble(m,hd){
 var op=[],labels={},patches=[];
 function pc(){return START+op.length;}
 function b(v){op.push(v&255);}function w(v){b(v);b(v>>8);}
 function label(n){if(labels[n]!==undefined)throw Error('Etiqueta duplicada '+n);labels[n]=pc();}
 function imm(ins,x){b(ins);b(x);}
 function abs(ins,x){b(ins);w(x);}
 function ref(ins,n){b(ins);patches.push({p:op.length,n:n,rel:false});w(0);}
 function branch(ins,n){b(ins);patches.push({p:op.length,n:n,rel:true});b(0);}
 function copy(src,dst,count,key){
  imm(0xA9,src);imm(0x85,0xFB);
  imm(0xA9,src>>8);imm(0x85,0xFC);
  imm(0xA9,dst);imm(0x85,0xFD);
  imm(0xA9,dst>>8);imm(0x85,0xFE);
  if(count>>>8){imm(0xA2,count>>>8);ref(0x20,'copyPages');}
  if(count&255){
   imm(0xA0,0);label('tail'+key);
   imm(0xB1,0xFB);imm(0x91,0xFD);
   b(0xC8);imm(0xC0,count&255);branch(0xD0,'tail'+key);
  }
 }
 // Boot is identical to TEST282 bitmap memory, but no second atlas
 // or WORK copy. BASIC ROM off keeps high RAM $A000-$BFFF accessible.
 b(0x78);imm(0xA9,0x36);imm(0x85,0x01);
 imm(0xA9,0x0B);abs(0x8D,0xD011);
 copy(BMPSRC,0x6000,8000,'bmp');
 copy(SCRSRC,0x5C00,1000,'scr');
 copy(COLSRC,0xD800,1000,'color');
 abs(0xAD,0xDD02);imm(0x09,0x03);abs(0x8D,0xDD02);
 abs(0xAD,0xDD00);imm(0x29,0xFC);imm(0x09,0x02);abs(0x8D,0xDD00);
 imm(0xA9,0);abs(0x8D,0xD015);
 imm(0xA9,0x78);abs(0x8D,0xD018);
 imm(0xA9,m.bg);abs(0x8D,0xD020);abs(0x8D,0xD021);
 imm(0xA9,0x18);abs(0x8D,0xD016);
 imm(0xA9,0x3B);abs(0x8D,0xD011);
 // ZP scratch: phase B1, tick counter B0, pointer stream E0/E1,
 // source E2/E3, destination E4/E5, remaining E6/E7.
 imm(0xA9,m.animations[0].delay);imm(0x85,0xB0);
 imm(0xA9,0);imm(0x85,0xB1);
 label('tick');
 label('wait');abs(0xAD,0xD012);imm(0xC9,250);branch(0xD0,'wait');
 label('leave');abs(0xAD,0xD012);imm(0xC9,250);branch(0xF0,'leave');
 imm(0xC6,0xB0);branch(0xD0,'tick');
 imm(0xA9,m.animations[0].delay);imm(0x85,0xB0);
 imm(0xE6,0xB1);imm(0xA5,0xB1);imm(0xC9,hd.period);
 branch(0xD0,'phaseValid');imm(0xA9,0);imm(0x85,0xB1);
 label('phaseValid');
 imm(0xA6,0xB1); // phase index
 ref(0xBD,'loTablePages');abs(0x8D,0x0000); // patched below
 // Replace the temporary STA $0000 with a self-modifying STA address.
 var staLoHigh=pc()-2;
 ref(0xBD,'hiTablePages');abs(0x8D,0x0000);
 var staHiHigh=pc()-2;
 imm(0xA9,hd.recordAddress);imm(0x85,0xE0);
 imm(0xA9,hd.recordAddress>>8);imm(0x85,0xE1);
 imm(0xA9,hd.visible);imm(0x85,0xE6);
 imm(0xA9,hd.visible>>8);imm(0x85,0xE7);
 label('nextCell');
 imm(0xA5,0xE6);imm(0x05,0xE7);branch(0xF0,'doneFrame');
 imm(0xA0,0);
 imm(0xB1,0xE0);b(0xAA); // tile ID -> X, 0..255
 b(0xBD);b(0);label('srcLoOperand');b(hd.loTables>>8);imm(0x85,0xE2);
 b(0xBD);b(0);label('srcHiOperand');b(hd.hiTables>>8);imm(0x85,0xE3);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE4);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE5);
 imm(0xA0,7);label('copyCell');
 imm(0xB1,0xE2);imm(0x91,0xE4);
 b(0x88);branch(0x10,'copyCell');
 b(0x18);imm(0xA5,0xE0);imm(0x69,3);imm(0x85,0xE0);
 branch(0x90,'noCarry');imm(0xE6,0xE1);label('noCarry');
 imm(0xA5,0xE6);branch(0xD0,'countLow');
 imm(0xC6,0xE7);label('countLow');imm(0xC6,0xE6);
 ref(0x4C,'nextCell');
 label('doneFrame');ref(0x4C,'tick');
 // Word-address patch for the absolute "STA operandHigh" instructions.
 // The assembler fixup below writes the target low/high once labels resolve.
 patches.push({p:staLoHigh,n:'srcLoOperand',rel:false,oneByteHigh:true});
 patches.push({p:staHiHigh,n:'srcHiOperand',rel:false,oneByteHigh:true});
 label('copyPages');
 imm(0xA0,0);label('pageLoop');
 imm(0xB1,0xFB);imm(0x91,0xFD);
 b(0xC8);branch(0xD0,'pageLoop');
 imm(0xE6,0xFC);imm(0xE6,0xFE);
 b(0xCA);branch(0xD0,'pageLoop');b(0x60);
 label('loTablePages');for(var i=0;i<hd.period;i++)b((hd.loTables>>8)+i);
 label('hiTablePages');for(var i=0;i<hd.period;i++)b((hd.hiTables>>8)+i);
 for(var f of patches){
  var addr=labels[f.n];if(addr===undefined)throw Error('Etiqueta inexistente '+f.n);
  if(f.rel){var offset=addr-(START+f.p+1);
   if(offset< -128||offset>127)throw Error('Branch fuera de rango '+f.n+' '+offset);
   op[f.p]=offset&255;
  }else if(f.oneByteHigh)op[f.p]=addr&255;
  else{op[f.p]=addr&255;op[f.p+1]=addr>>8;}
 }
 if(START+op.length>=BMPSRC)throw Error('ASM invade Bitmap inicial.');
 return {code:new Uint8Array(op),labels};
}
function build(m){
 var hd=highData(m),a=assemble(m,hd),out=new Uint8Array(2+hd.end-ORIGIN);
 function at(adr){return 2+adr-ORIGIN;}
 out[0]=1;out[1]=8;
 out.set([0x0B,0x08,10,0,0x9E,50,48,54,52,0,0,0],at(ORIGIN));
 out.set(a.code,at(START));
 out.set(m.bitmap,at(BMPSRC));
 out.set(m.screen,at(SCRSRC));
 out.set(m.color,at(COLSRC));
 out.set(m.atlas,at(BASE));
 // The original TEST290 metadata is not copied: phase lookup replaces
 // its per-tile group matrices and per-occurrence WORK refresh list.
 out.set(hd.data,at(DATA));
 return {bytes:out,model:m,meta:hd,labels:a.labels,asmBytes:a.code.length};
}
function download(prg){
 if(typeof window.download==='function')return window.download(prg,'RICO_TEST291_MC_8PIX_256TILES.prg','application/prg');
 var blob=new Blob([prg],{type:'application/octet-stream'}),
 url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='RICO_TEST291_MC_8PIX_256TILES.prg';
 document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(function(){URL.revokeObjectURL(url);},2500);
}
function exportPRG(opts){
 try{
  var editor=window.g_app&&window.g_app.textModeEditor;
  var l=editor&&editor.layers&&editor.layers.getSelectedLayerObject();
  if(!l||!l.doc||!l.doc.ricoBitmapV1Enabled||l.getScreenMode()!=='c64multicolor')return null;
  var m=window.RICO_TEST290_BITMAP.analyze();
  if(!eligible(m))return null; // TEST290's native menu remains fallback
  var built=build(m),out=built.bytes;
  stats.error=null;stats.exports++;
  stats.last={status:'PENDING VICE',selectedTileLimit:256,
   bytes:out.length,visibleCells:built.meta.visible,groupWidth:built.meta.groupWidth,
   groupMembers:m.animations[0].memberCount,phaseCount:built.meta.period,
   pixelsPerTick:8,sourceColumnsPerStep:2,bitmapBytesPerUpdate:built.meta.visible*8,
   totalPointerBytes:built.meta.pointerBytes,positionListBytes:built.meta.recordLength,atlasBytes:2048,
   asmBytes:built.asmBytes};
  window.RICO_TEST291_LAST_EXPORT=stats.last;
  if(opts&&opts.download===false)return built;
  download(out);console.log(NAME,stats.last);return built;
 }catch(err){
  stats.error=String(err&&err.message||err);console.error(NAME,err);
  if(!(opts&&opts.silent)&&typeof window.alert==='function')
   window.alert('Exportar PRG · Bitmap Multicolor 8px: '+stats.error);
  return false;
 }
}
var original=Editor.prototype.menuClick;
Editor.prototype.menuClick=function(id){
 if(id==='export-prg'){
  var result=exportPRG({download:true,silent:false});
  if(result!==null)return result;
 }
 return original.apply(this,arguments);
};
window.RICO_TEST291_BITMAP={version:'TEST291',eligible,highData,assemble,build,
 exportPRG,state:stats};
console.log(NAME,'direct bitmap copy for aligned 8 MC pixels/tick and max 256 tiles installed');
})();