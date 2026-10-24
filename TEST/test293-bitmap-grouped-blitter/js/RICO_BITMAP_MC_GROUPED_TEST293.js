/* TEST293 — Group-by-tile blitter. Exactly ONE source lookup per tile ID,
 * NOT per appearance; an unrolled eight-byte copy and double buffering.
 * Stress case: 256 tile IDs, 1,000 bitmap-cell occurrences.
 * Compare output/cycles with TEST292 before claiming an improvement.
 */
/* TEST292 — 8 MC pixels, 256 tiles, true VIC-II double buffering.
 * Bank1: BMP $6000, SCREEN $5C00, DD00=2, D018=$78.
 * Bank3: BMP $E000, SCREEN $C400, DD00=0, D018=$18.
 * CPU $01=$35: I/O visible, BASIC+KERNAL RAM available.
 * Color RAM shared; palette is static per cell in this version.
 * Render offscreen and flip only during border (raster 250).
 * Previous TEST291 output stays untouched for A/B comparisons.
 */
/* TEST291 — 8 multicolor pixels / step, 256 selected tiles stress.
 * 8 MC pixels = 16 bitmap bits = two adjacent 8-bit bitmap tile-columns.
 * Fast aligned case: direct source charset -> bitmap cells, no WORK atlas
 * render and no second refresh copy. Source address lookup per group phase.
 * Explicitly only one horizontal group at rate 8, preserving other modes
 * via the TEST290 normal Export PRG handler. Unchanged: TEST289 PASS.
 */
(function(){
'use strict';
var NAME='[RICO TEST293]',ORIGIN=0x0801,START=0x0810,
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
 if(!eligible(model))throw Error('TEST293 necesita un único Group Scroll horizontal a 8 píxeles multicolor/tick.');
 var g=model.animations[0],width=g.width,step=2,period=width/gcd(width,step);
 if(period>255)throw Error('Periodo del scroll demasiado largo.');
 var positions={},zero=DATA;
 for(var i=0;i<g.matrix.length;i++){
  var id=g.matrix[i];
  if(id>=0&&positions[id]===undefined)
   positions[id]={x:i%width,y:Math.floor(i/width)};
 }
 var byTile={},at=model.refreshPtr-DATA;
 if(at<0||at+4*model.refreshCount>model.data.length)
  throw Error('Lista de ocurrencias inválida.');
 for(var j=0;j<model.refreshCount;j++){
  var offset=at+j*4,
      work=model.data[offset]|model.data[offset+1]<<8,
      dst=model.data[offset+2]|model.data[offset+3]<<8,
      tile=(work-0x8800)/8;
  if(!Number.isInteger(tile)||!positions[tile])
   throw Error('Tile sin origen en Group Animate: '+tile);
  (byTile[tile]||(byTile[tile]=[])).push(dst);
 }
 var ids=Object.keys(byTile).map(Number).sort(function(a,b){return a-b;});
 var header=DATA+8,headerLen=ids.length*5,list=header+headerLen,
     listLen=model.refreshCount*2,
     lo=(list+listLen+255)&~255,hi=lo+period*256,
     end=hi+period*256;
 if(end>END)throw Error('TEST293 necesita '+(end-DATA)+' bytes y solo hay '+(END-DATA)+' bytes de RAM alta.');
 var bytes=new Uint8Array(end-DATA),pos=list;
 for(var k=0;k<ids.length;k++){
  var id=ids[k],locations=byTile[id],off=header-DATA+k*5;
  bytes[off]=id;bytes[off+1]=locations.length&255;bytes[off+2]=locations.length>>8;
  bytes[off+3]=pos&255;bytes[off+4]=pos>>8;
  for(var n=0;n<locations.length;n++){
   bytes[pos-DATA]=locations[n]&255;bytes[pos-DATA+1]=locations[n]>>8;pos+=2;
  }
 }
 for(var phase=0;phase<period;phase++){
  var disp=(phase*step)%width;
  for(var str in positions){
   var id=Number(str),o=positions[id],
       sourceX=g.type==='left'?(o.x+disp)%width:((o.x-disp)%width+width)%width,
       srcTile=g.matrix[o.y*width+sourceX],
       source=srcTile<0?zero:BASE+srcTile*8;
   bytes[lo-DATA+phase*256+id]=source&255;
   bytes[hi-DATA+phase*256+id]=source>>8;
  }
 }
 return {data:bytes,header,groupCount:ids.length,list,recordLength:listLen,
   loTables:lo,hiTables:hi,period,end,visible:model.refreshCount,
   tiles:ids.length,groupWidth:width,direction:g.type,pixelsPerTick:8,
   sourceColumnsPerTick:2,pointerBytes:period*256*2,atlasBytes:2048};
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
 // Boot uses TEST282 bitmap banks, two independent screen matrices, no atlas
 // or WORK copy. BASIC ROM off keeps high RAM $A000-$BFFF accessible.
 b(0x78);imm(0xA9,0x35);imm(0x85,0x01);
 imm(0xA9,0x0B);abs(0x8D,0xD011);
 copy(BMPSRC,0x6000,8000,'bmp');
 copy(SCRSRC,0x5C00,1000,'scr');
 copy(COLSRC,0xD800,1000,'color');
 // Two independent VIC banks: do NOT add $E000 bitmap to PRG image,
 // otherwise a normal BASIC LOAD would write into I/O $D000-$DFFF.
 // Instead initialize the second screen and bitmap at runtime.
 copy(BMPSRC,0xE000,8000,'hiddenbitmap');
 copy(SCRSRC,0xC400,1000,'hiddenscreen');
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
 // $EA=0: VIC bank1 is currently visible, so write bank3.
 // $EA=1: VIC bank3 is visible, so write bank1.
 imm(0xA9,0);imm(0x85,0xEA);
 label('tick');
 label('wait');abs(0xAD,0xD012);imm(0xC9,250);branch(0xD0,'wait');
 label('leave');abs(0xAD,0xD012);imm(0xC9,250);branch(0xF0,'leave');
 imm(0xC6,0xB0);branch(0xD0,'tick');
 imm(0xA9,m.animations[0].delay);imm(0x85,0xB0);
 imm(0xE6,0xB1);imm(0xA5,0xB1);imm(0xC9,hd.period);
 branch(0xD0,'phaseValid');imm(0xA9,0);imm(0x85,0xB1);
 label('phaseValid');
 imm(0xA6,0xB1); // X: phase index
 ref(0xBD,'loTablePages');abs(0x8D,0x0000);
 var patchLo=pc()-2;
 ref(0xBD,'hiTablePages');abs(0x8D,0x0000);
 var patchHi=pc()-2;
 imm(0xA9,hd.header);imm(0x85,0xE0);
 imm(0xA9,hd.header>>8);imm(0x85,0xE1);
 imm(0xA9,hd.groupCount);imm(0x85,0xEC);
 imm(0xA9,hd.groupCount>>8);imm(0x85,0xED);
 // Bank3 hidden when $EA=0. Compute high-byte mask ONCE per phase.
 imm(0xA5,0xEA);branch(0xD0,'maskZero');
 imm(0xA9,0x80);ref(0x4C,'maskStore');
 label('maskZero');imm(0xA9,0);
 label('maskStore');imm(0x85,0xEB);
 label('groupLoop');
 imm(0xA5,0xEC);imm(0x05,0xED);branch(0xD0,'hasGroup');
 ref(0x4C,'doneFrame');
 label('hasGroup');
 imm(0xA0,0);imm(0xB1,0xE0);b(0xAA); // ID, once per GROUP, not cell.
 b(0xBD);b(0);label('srcLoOperand');b(hd.loTables>>8);imm(0x85,0xE2);
 b(0xBD);b(0);label('srcHiOperand');b(hd.hiTables>>8);imm(0x85,0xE3);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE6);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE7);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE8);
 b(0xC8);imm(0xB1,0xE0);imm(0x85,0xE9);
 label('cellLoop');
 // destination list uses 2 bytes per cell; tile source stays unchanged.
 imm(0xA0,0);imm(0xB1,0xE8);imm(0x85,0xE4);
 b(0xC8);imm(0xB1,0xE8);imm(0x05,0xEB);imm(0x85,0xE5);
 // Unrolled 8 rows: no DEY/BPL per-byte loop branches.
 imm(0xA0,0);
 for(var row=0;row<8;row++){
  imm(0xB1,0xE2);imm(0x91,0xE4);
  if(row<7)b(0xC8);
 }
 // destination-list pointer += 2
 b(0x18);imm(0xA5,0xE8);imm(0x69,2);imm(0x85,0xE8);
 branch(0x90,'destPointerNoCarry');imm(0xE6,0xE9);
 label('destPointerNoCarry');
 imm(0xA5,0xE6);branch(0xD0,'countLow');
 imm(0xC6,0xE7);
 label('countLow');imm(0xC6,0xE6);
 imm(0xA5,0xE6);imm(0x05,0xE7);branch(0xF0,'groupAdvance');
 ref(0x4C,'cellLoop');
 label('groupAdvance');
 b(0x18);imm(0xA5,0xE0);imm(0x69,5);imm(0x85,0xE0);
 branch(0x90,'groupPtrNoCarry');imm(0xE6,0xE1);
 label('groupPtrNoCarry');
 imm(0xA5,0xEC);branch(0xD0,'groupCountLow');
 imm(0xC6,0xED);
 label('groupCountLow');imm(0xC6,0xEC);
 ref(0x4C,'groupLoop');
 label('doneFrame');
 // Wait for the next bottom-border interval before changing VIC banks.
 // Changes to DD00/D018 are a few cycles apart, outside visible picture.
 label('flipWait');abs(0xAD,0xD012);imm(0xC9,250);branch(0xD0,'flipWait');
 label('flipEndLine');abs(0xAD,0xD012);imm(0xC9,250);branch(0xF0,'flipEndLine');
 imm(0xA5,0xEA);branch(0xD0,'showBank1');
 // Show bank3: CIA2 low bits %00, $D018=$18 -> $E000 / $C400.
 abs(0xAD,0xDD00);imm(0x29,0xFC);abs(0x8D,0xDD00);
 imm(0xA9,0x18);abs(0x8D,0xD018);
 imm(0xA9,1);imm(0x85,0xEA);ref(0x4C,'tick');
 label('showBank1');
 // Show bank1: CIA2 %10, $D018=$78 -> $6000 / $5C00.
 abs(0xAD,0xDD00);imm(0x29,0xFC);imm(0x09,2);abs(0x8D,0xDD00);
 imm(0xA9,0x78);abs(0x8D,0xD018);
 imm(0xA9,0);imm(0x85,0xEA);ref(0x4C,'tick');
 // Word-address patch for the absolute "STA operandHigh" instructions.
 // The assembler fixup below writes the target low/high once labels resolve.
 patches.push({p:patchLo-START,n:'srcLoOperand',rel:false});
 patches.push({p:patchHi-START,n:'srcHiOperand',rel:false});
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
 if(typeof window.download==='function')return window.download(prg,'RICO_TEST293_MC_GROUPED_256TILES.prg','application/prg');
 var blob=new Blob([prg],{type:'application/octet-stream'}),
 url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='RICO_TEST292_MC_DOUBLE_BUFFER_256TILES.prg';
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
  stats.last={status:'PENDING VICE',selectedTileLimit:256,videoMode:'BANK1/BANK3 double buffer',
   fasterRenderer:'grouped by tile ID + 8 row loop unrolled',
   distinctTileIDs:built.meta.tiles,
   visibleBitmap1:'$6000',visibleBitmap2:'$E000',screen1:'$5C00',screen2:'$C400',
   rasterSwap:250,port01:'$35',
   bytes:out.length,visibleCells:built.meta.visible,groupWidth:built.meta.groupWidth,
   groupMembers:m.animations[0].memberCount,phaseCount:built.meta.period,
   pixelsPerTick:8,sourceColumnsPerStep:2,bitmapBytesPerUpdate:built.meta.visible*8,
   totalPointerBytes:built.meta.pointerBytes,positionListBytes:built.meta.recordLength,atlasBytes:2048,
   asmBytes:built.asmBytes};
  window.RICO_TEST293_LAST_EXPORT=stats.last;
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
window.RICO_TEST293_BITMAP={version:'TEST293',eligible,highData,assemble,build,
 exportPRG,state:stats};
console.log(NAME,'TEST293 grouped by tile: source once per ID, unrolled 8-row blits into hidden bitmap');
})();