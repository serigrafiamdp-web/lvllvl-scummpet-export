/* TEST307 — C64 full-map manual scroll and simultaneous WASD diagonals.
   No viewport-local wrapping: cameras run over the configured Scroll Area.
   A cell is represented as tile/fg (HiRes), or tile/C1C2/C3 (Bitmap MC).
   Entire packed source at $8000-$BFFF, glyph atlas at $4000 or $5000.
   This experimental export is separate from TEST306 and TEST297.
*/
(function(w){
'use strict';
var BASE=0x0810,MAP=0x8000,TABLE_ROW_LO=0x3000,TABLE_ROW_HI=0x3100,
    TABLE_COL_LO=0x3200,TABLE_COL_HI=0x3300,TABLE_TILE_LO=0x3400,TABLE_TILE_HI=0x3500;
// SID occupies its original $1000-$2FFF. No lookup table may overlap the SID.
var ENGINE_SHADOW=0x3600,SID_SHADOW=0x3610,AUDIO_PHASE=0x3620;
function assemble(){
 var bytes=[],labels={},fix=[],sequence=0;
 function b(v){bytes.push(v&255);}
 function I(op,value){b(op);b(value);}
 function A(op,value){b(op);b(value);b(value>>8);}
 function L(name){if(labels[name]!==undefined)throw Error('Duplicate label '+name);labels[name]=BASE+bytes.length;}
 function J(op,label){b(op);fix.push({at:bytes.length,label,relative:false});b(0);b(0);}
 function Q(label,high){b(0xa9);fix.push({at:bytes.length,label,part:high?'hi':'lo'});b(0);}
 function R(op,label){b(op);fix.push({at:bytes.length,label,relative:true});b(0);}
 function fresh(s){return s+(++sequence);}
 function finish(){
  for(var f of fix){
   var dest=labels[f.label];if(dest===undefined)throw Error('Missing label '+f.label);
   if(f.part){bytes[f.at]=f.part==='hi'?(dest>>8)&255:dest&255;}
   else if(f.relative){var delta=dest-(BASE+f.at+1);if(delta< -128||delta>127)throw Error('Relative branch too far '+f.label+': '+delta);bytes[f.at]=delta&255;}
   else{bytes[f.at]=dest&255;bytes[f.at+1]=dest>>8;}
  }
  if(BASE+bytes.length>0x1000)throw Error('TEST307 ASM de '+bytes.length+' bytes sobrepasa $1000.');
  return{code:new Uint8Array(bytes),labels};
 }
 return{b,I,A,L,J,R,Q,fresh,finish};
}
function build(source,sid){
 if(!sid||!sid.bytes||!sid.bytes.length||!Number.isInteger(sid.load)||!Number.isInteger(sid.play)||!Number.isInteger(sid.init))
  throw Error('TEST311 requiere un PSID válido con direcciones INIT/PLAY.');
 if(sid.load<0x1000||sid.load+sid.bytes.length>0x3000)
  throw Error('TEST311: SID debe ocupar $1000-$2FFF sin superponer tablas.');
 if(!source||!source.fullMap)throw Error('Falta el mapa completo del editor.');
 var mc=source.kind==='bitmap-mc',hi=source.kind==='char-hires',mixed=source.kind==='char-mc';
 if(!mc&&!hi&&!mixed)throw Error('TEST311 admite HiRes, caracteres mixtos y Bitmap Multicolor.');
 var m=source.fullMap,a=m.area,cols=m.viewWidth,rows=m.viewHeight,count=m.width*m.height,sz=mc?3:2;
 if(m.width>255||m.height>255||a.width>255||a.height>255||sz*count>16384)
  throw Error('TEST307: el mapa excede la RAM disponible (16KB) o 255 celdas/eje.');
 if(!cols||!rows||cols>40||rows>25||a.width<cols||a.height<rows)
  throw Error('Ventana/Scroll Area incompatibles.');
 var screen1=mc?0x5c00:0x4400,screen2=mc?0xc400:0x4800,
     color1=mc?0x3800:0x2800,color2=mc?0x3c00:0x2c00,
     bitmap1=0x6000,bitmap2=0xe000,atlasBase=mc?0x4000:0x5000,
     phys=(m.physicalY*40+m.physicalX)|0,skip=40-cols;
 var c=assemble(),b=c.b,I=c.I,A=c.A,L=c.L,J=c.J,R=c.R,Q=c.Q,uid=c.fresh,
     hardwareCIA=!!(sid.ciaTiming&&sid.ciaTimer);
 // ZP E0/E1 map pointer, E2/E3 destination screen, E4/E5 color,
 // E6/E7 destination bitmap, E8/E9 atlas char,
 // EF tile id, F0 input movement, F1 displayed buffer,
 // F2 remaining columns, F3 relative map X,
 // F4 remaining rows, F5 relative map Y,
 // F6 camera X, F7 CIA col1, F8 CIA col2, F9 camera Y.
 function ptr(z,addr){I(0xa9,addr&255);I(0x85,z);I(0xa9,addr>>8);I(0x85,z+1);}
 function inc(z,n){var end=uid('incEnd');b(0x18);I(0xa5,z);I(0x69,n&255);I(0x85,z);
  I(0xa5,z+1);I(0x69,(n>>8)&255);I(0x85,z+1);}
 // Add a positive constant 16-bit to zero-page pointer, preserving carry.
 function addPtr(z,n){b(0x18);I(0xa5,z);I(0x69,n&255);I(0x85,z);I(0xa5,z+1);I(0x69,n>>8);I(0x85,z+1);}
 function fill(dest,len,value){
  ptr(0xe0,dest);I(0xa9,len&255);I(0x85,0xe4);I(0xa9,len>>8);I(0x85,0xe5);
  I(0xa9,value&255);I(0x85,0xef);J(0x20,'fillBytes');
 }
 function copyColor(dest){J(0x20,dest);}
 function camInc(z,max,name){
  L(name);I(0xe6,z);I(0xa5,z);I(0xc9,max);R(0xd0,name+'end');
  I(0xa9,0);I(0x85,z);L(name+'end');b(0x60);
 }
 function camDec(z,max,name){
  L(name);I(0xa5,z);R(0xd0,name+'subtract');I(0xa9,max);I(0x85,z);
  L(name+'subtract');I(0xc6,z);b(0x60);
 }
 // Entry: BASIC SYS2064. Initialization is blank ONCE, not on every step.
 L('start');b(0x78);I(0xa9,0x35);I(0x85,1);
 // Silence old KERNAL IRQ and acknowledge both CIAs, then call PSID INIT
 // while engine's $F0-$FF are saved. The musician retains its ZP state.
 I(0xa9,0x7f);A(0x8d,0xdc0d);A(0x8d,0xdd0d);
 A(0xad,0xdc0d);A(0xad,0xdd0d);
 J(0x20,'sidInitProtected');
 I(0xa9,0x0b);A(0x8d,0xd011);
 I(0xa9,255);A(0x8d,0xdc02);I(0xa9,0);A(0x8d,0xdc03);I(0xa9,255);A(0x8d,0xdc00);
 fill(screen1,1000,0);fill(screen2,1000,0);
 fill(color1,1000,mc?0:source.bg&15);fill(color2,1000,mc?0:source.bg&15);
 if(mc){fill(bitmap1,8000,0);fill(bitmap2,8000,0);}
 I(0xa9,m.initialX);I(0x85,0xf6);I(0xa9,m.initialY);I(0x85,0xf9);
 I(0xa9,1);I(0x85,0xf1);J(0x20,'renderWindow');copyColor('copyColorOne');
 A(0xad,0xdd02);I(0x09,3);A(0x8d,0xdd02);
 A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);
 I(0xa9,mc?0x78:0x14);A(0x8d,0xd018);
 I(0xa9,(mc||mixed)?0x18:0x08);A(0x8d,0xd016);
 I(0xa9,source.bg&15);A(0x8d,0xd020);A(0x8d,0xd021);
 if(mixed){I(0xa9,source.mc1&15);A(0x8d,0xd022);I(0xa9,source.mc2&15);A(0x8d,0xd023);}
 I(0xa9,0);I(0x85,0xf1);
 I(0xa9,mc?0x3b:0x1b);A(0x8d,0xd011);
 // VIC raster IRQ: PLAY uses its own protected zero-page and does not
 // disturb the scroll renderer, including its 2-buffer Color RAM scheduler.
 I(0xa9,0x01);A(0x8d,0xd019);
 I(0xa9,0xfa);A(0x8d,0xd012);
 Q('sidIRQ',false);A(0x8d,0xfffe);
 Q('sidIRQ',true);A(0x8d,0xffff);
 I(0xa9,0x01);A(0x8d,0xd01a);
 if(hardwareCIA){
  // Original tune's INIT wrote CIA Timer A latch. Keep it untouched.
  I(0xa9,0x81);A(0x8d,0xdc0d);
  I(0xa9,0x11);A(0x8d,0xdc0e);
 }
 b(0x58); // CLI: audio IRQ remains active during held WASD scroll.
 // Read two keyboard columns. Every key is evaluated independently.
 // Thus W+A, W+D, S+A, S+D each alter BOTH camera coordinates once.
 L('poll');
 I(0xa9,0xfd);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf7);
 I(0xa9,0xfb);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf8);
 I(0xa9,0xff);A(0x8d,0xdc00);
 I(0xa9,0);I(0x85,0xf0);
 I(0xa5,0xf7);I(0x29,2);R(0xd0,'notW');J(0x20,'incCameraY');I(0xe6,0xf0);
 L('notW');I(0xa5,0xf7);I(0x29,32);R(0xd0,'notS');J(0x20,'decCameraY');I(0xe6,0xf0);
 L('notS');I(0xa5,0xf7);I(0x29,4);R(0xd0,'notA');J(0x20,'incCameraX');I(0xe6,0xf0);
 L('notA');I(0xa5,0xf8);I(0x29,4);R(0xd0,'notD');J(0x20,'decCameraX');I(0xe6,0xf0);
 L('notD');I(0xa5,0xf0);R(0xd0,'renderRequested');J(0x4c,'poll');
 L('renderRequested');J(0x20,'renderWindow');
 J(0x20,'waitRaster252');
 I(0xa5,0xf1);R(0xf0,'swapSecond');
 // F1=1: renderWindow just populated first (low) display bank.
 if(mc){A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);}
 I(0xa9,mc?0x78:0x14);A(0x8d,0xd018);
 I(0xa9,0);I(0x85,0xf1);copyColor('copyColorOne');J(0x4c,'poll');
 L('swapSecond');
 if(mc){A(0xad,0xdd00);I(0x29,252);A(0x8d,0xdd00);}
 I(0xa9,mc?0x18:0x24);A(0x8d,0xd018);
 I(0xa9,1);I(0x85,0xf1);copyColor('copyColorTwo');J(0x4c,'poll');
 camInc(0xf9,a.height,'incCameraY');camDec(0xf9,a.height,'decCameraY');
 camInc(0xf6,a.width,'incCameraX');camDec(0xf6,a.width,'decCameraX');
 L('waitRaster252');L('rasterLoop');A(0xad,0xd012);I(0xc9,252);R(0x90,'rasterLoop');b(0x60);
 // Render all cells of the configured viewport, not just a wrapped snapshot.
 // Outside the viewport remains blank from the one-time bank clear.
 L('renderWindow');
 I(0xa5,0xf1);R(0xf0,'targetTwo');
 ptr(0xe2,screen1+phys);ptr(0xe4,color1+phys);
 if(mc)ptr(0xe6,bitmap1+phys*8);
 J(0x4c,'targetReady');
 L('targetTwo');ptr(0xe2,screen2+phys);ptr(0xe4,color2+phys);
 if(mc)ptr(0xe6,bitmap2+phys*8);
 L('targetReady');
 I(0xa9,rows);I(0x85,0xf4);
 I(0xa5,0xf9);I(0x85,0xf5);
 L('rowLoop');
 I(0xa4,0xf5); // LDY camera-relative row
 A(0xb9,TABLE_ROW_LO);I(0x85,0xe0);A(0xb9,TABLE_ROW_HI);I(0x85,0xe1);
 I(0xa6,0xf6); // LDX camera X
 b(0x18);I(0xa5,0xe0);A(0x7d,TABLE_COL_LO);I(0x85,0xe0);
 I(0xa5,0xe1);A(0x7d,TABLE_COL_HI);I(0x85,0xe1);
 I(0xa5,0xf6);I(0x85,0xf3);
 I(0xa9,cols);I(0x85,0xf2);
 L('cellLoop');
 I(0xa0,0);I(0xb1,0xe0); // LDA (mapPointer),Y: tile ID
 if(mc){
  b(0xaa);A(0xbd,TABLE_TILE_LO);I(0x85,0xe8);A(0xbd,TABLE_TILE_HI);I(0x85,0xe9);
  // Eight glyph scanlines into offscreen bitmap (one cell).
  I(0xa0,0);
  for(var j=0;j<8;j++){I(0xb1,0xe8);I(0x91,0xe6);if(j!==7)b(0xc8);}
  I(0xa0,1);I(0xb1,0xe0);I(0xa0,0);I(0x91,0xe2);
  I(0xa0,2);I(0xb1,0xe0);I(0xa0,0);I(0x91,0xe4);
 }else{
  I(0x91,0xe2);
  I(0xa0,1);I(0xb1,0xe0);I(0xa0,0);I(0x91,0xe4);
 }
 addPtr(0xe2,1);addPtr(0xe4,1);if(mc)addPtr(0xe6,8);
 addPtr(0xe0,sz);
 I(0xe6,0xf3);I(0xa5,0xf3);I(0xc9,a.width);R(0xd0,'xNoWrap');
 I(0xa9,0);I(0x85,0xf3);
 I(0xa4,0xf5);A(0xb9,TABLE_ROW_LO);I(0x85,0xe0);A(0xb9,TABLE_ROW_HI);I(0x85,0xe1);
 L('xNoWrap');
 I(0xc6,0xf2);R(0xf0,'rowDone');J(0x4c,'cellLoop');
 L('rowDone');
 if(skip){addPtr(0xe2,skip);addPtr(0xe4,skip);if(mc)addPtr(0xe6,skip*8);}
 I(0xe6,0xf5);I(0xa5,0xf5);I(0xc9,a.height);R(0xd0,'yNoWrap');I(0xa9,0);I(0x85,0xf5);
 L('yNoWrap');I(0xc6,0xf4);R(0xf0,'renderDone');J(0x4c,'rowLoop');
 L('renderDone');b(0x60);
 // Bulk clear used only during startup, when the display is disabled.
 L('fillBytes');I(0xa5,0xe5);R(0xf0,'fillTail');
 L('fillPage');I(0xa0,0);L('fillPageByte');I(0xa5,0xef);I(0x91,0xe0);b(0xc8);R(0xd0,'fillPageByte');
 I(0xe6,0xe1);I(0xc6,0xe5);R(0xd0,'fillPage');
 L('fillTail');I(0xa0,0);L('fillTailCheck');I(0xc4,0xe4);R(0xf0,'fillDone');
 I(0xa5,0xef);I(0x91,0xe0);b(0xc8);J(0x4c,'fillTailCheck');
 L('fillDone');b(0x60);
 // Shadow to Color RAM. Never clear DEN ($D011) during movement.
 function colorCopy(label,base){
  L(label);
  for(var page=0;page<4;page++){
   I(0xa2,0);var loop=label+'p'+page;L(loop);
   for(var i=0;i<8;i++){A(0xbd,base+page*256+i);A(0x9d,0xd800+page*256+i);}
   b(0x8a);b(0x18);I(0x69,8);b(0xaa);
   if(page===3)I(0xe0,232);
   R(0xd0,loop);
  }
  b(0x60);
 }
 colorCopy('copyColorOne',color1);colorCopy('copyColorTwo',color2);
 // SID zero-page isolation: the 6502 renderer uses $F0-$F9.
 // The player is given its private $F0-$FF for INIT and every PLAY.
 L('sidInitProtected');
 I(0xa2,0);L('sidInitSave');
 A(0xbd,0x00f0);A(0x9d,ENGINE_SHADOW);b(0xe8);I(0xe0,16);R(0xd0,'sidInitSave');
 I(0xa9,sid.subtune&255);A(0x20,sid.init);
 I(0xa2,0);L('sidInitRestore');
 A(0xbd,0x00f0);A(0x9d,SID_SHADOW);
 A(0xbd,ENGINE_SHADOW);A(0x9d,0x00f0);
 b(0xe8);I(0xe0,16);R(0xd0,'sidInitRestore');b(0x60);
 L('sidPlayProtected');
 I(0xa2,0);L('sidPlaySwapIn');
 A(0xbd,0x00f0);A(0x9d,ENGINE_SHADOW);
 A(0xbd,SID_SHADOW);A(0x9d,0x00f0);
 b(0xe8);I(0xe0,16);R(0xd0,'sidPlaySwapIn');
 A(0x20,sid.play);
 I(0xa2,0);L('sidPlaySwapOut');
 A(0xbd,0x00f0);A(0x9d,SID_SHADOW);
 A(0xbd,ENGINE_SHADOW);A(0x9d,0x00f0);
 b(0xe8);I(0xe0,16);R(0xd0,'sidPlaySwapOut');b(0x60);
 L('sidIRQ');
 b(0x48);b(0x8a);b(0x48);b(0x98);b(0x48);
 if(hardwareCIA){
  A(0xad,0xdc0d);I(0x29,1);R(0xf0,'sidCheckRaster');
  J(0x20,'sidPlayProtected');
  L('sidCheckRaster');
  A(0xad,0xd019);I(0x29,1);R(0xf0,'sidIRQEnd');
  I(0xa9,1);A(0x8d,0xd019);
 }else{
  I(0xa9,1);A(0x8d,0xd019);
  J(0x20,'sidPlayProtected');
  if(sid.ciaTiming){
   // No provable CIA latch: the TEST207-compatible PAL ~60Hz fallback.
   A(0xee,AUDIO_PHASE);A(0xad,AUDIO_PHASE);I(0xc9,5);R(0xd0,'sidIRQEnd');
   I(0xa9,0);A(0x8d,AUDIO_PHASE);J(0x20,'sidPlayProtected');
  }
 }
 L('sidIRQEnd');b(0x68);b(0xa8);b(0x68);b(0xaa);b(0x68);b(0x40);

 var program=c.finish(),load=0x0801,end=Math.max(atlasBase+2048,TABLE_TILE_HI+256,MAP+m.packed.length,sid.load+sid.bytes.length);
 if(end>0xc000)throw Error('Los datos invaden memoria de video C64.');
 var prg=new Uint8Array(2+end-load);
 function at(addr){return 2+addr-load;}
 prg[0]=1;prg[1]=8;
 prg.set([0x0b,0x08,10,0,0x9e,50,48,54,52,0,0,0],at(0x0801));
 prg.set(program.code,at(BASE));
 prg.set(sid.bytes,at(sid.load));
 prg.set(source.atlas,at(atlasBase));
 prg.set(m.packed,at(MAP));
 // Direct lookup row base already includes the user's Scroll Area X offset.
 for(var yr=0;yr<a.height;yr++){
  var addr=MAP+((a.y+yr)*m.width+a.x)*sz;
  prg[at(TABLE_ROW_LO+yr)]=addr&255;
  prg[at(TABLE_ROW_HI+yr)]=(addr>>8)&255;
 }
 for(var xc=0;xc<a.width;xc++){
  var offs=xc*sz;
  prg[at(TABLE_COL_LO+xc)]=offs&255;
  prg[at(TABLE_COL_HI+xc)]=(offs>>8)&255;
 }
 if(mc)for(var tile=0;tile<256;tile++){
  var atlasAddr=atlasBase+tile*8;
  prg[at(TABLE_TILE_LO+tile)]=atlasAddr&255;
  prg[at(TABLE_TILE_HI+tile)]=(atlasAddr>>8)&255;
 }
 return{bytes:prg,code:program.code,labels:program.labels,mode:source.kind,
  fullMap:{width:m.width,height:m.height,scrollArea:a,window:m.window,viewWidth:cols,viewHeight:rows,
   physicalX:m.physicalX,physicalY:m.physicalY},
  input:'Simultaneous held WASD; diagonal updates are atomic in one render',
  mapType:'TEST311 full map WASD with SID audio IRQ (hardware CIA or PAL raster)',
  sid:{load:sid.load,init:sid.init,play:sid.play,size:sid.bytes.length,hardwareCIA:hardwareCIA}};
}
w.RICO_TEST311_HYBRID={version:'TEST311',makePRG:build,engine:'TEST307 FULL MAP WASD + PSID protected raster/CIA IRQ'};
})(window);
