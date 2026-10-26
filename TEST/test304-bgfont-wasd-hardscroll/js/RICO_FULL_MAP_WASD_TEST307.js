/* TEST307 — C64 full-map manual scroll and simultaneous WASD diagonals.
   No viewport-local wrapping: cameras run over the configured Scroll Area.
   A cell is represented as tile/fg (HiRes), or tile/C1C2/C3 (Bitmap MC).
   Entire packed source at $8000-$BFFF, glyph atlas at $4000 or $5000.
   This experimental export is separate from TEST306 and TEST297.
*/
(function(w){
'use strict';
var BASE=0x0810,MAP=0x8000,TABLE_ROW_LO=0x1000,TABLE_ROW_HI=0x1100,
    TABLE_COL_LO=0x1200,TABLE_COL_HI=0x1300,TABLE_TILE_LO=0x1400,TABLE_TILE_HI=0x1500;
function assemble(codeLimit){
 var bytes=[],labels={},fix=[],sequence=0;
 function b(v){bytes.push(v&255);}
 function I(op,value){b(op);b(value);}
 function A(op,value){b(op);b(value);b(value>>8);}
 function L(name){if(labels[name]!==undefined)throw Error('Duplicate label '+name);labels[name]=BASE+bytes.length;}
 function J(op,label){b(op);fix.push({at:bytes.length,label,relative:false});b(0);b(0);}
 function R(op,label){b(op);fix.push({at:bytes.length,label,relative:true});b(0);}
 function fresh(s){return s+(++sequence);}
 function finish(){
  for(var f of fix){
   var dest=labels[f.label];if(dest===undefined)throw Error('Missing label '+f.label);
   if(f.relative){var delta=dest-(BASE+f.at+1);if(delta< -128||delta>127)throw Error('Relative branch too far '+f.label+': '+delta);bytes[f.at]=delta&255;}
   else{bytes[f.at]=dest&255;bytes[f.at+1]=dest>>8;}
  }
  if(BASE+bytes.length>(codeLimit||0x1000))throw Error('TEST317 ASM de '+bytes.length+' bytes sobrepasa $'+(codeLimit||0x1000).toString(16)+'.');
  return{code:new Uint8Array(bytes),labels};
 }
 return{b,I,A,L,J,R,fresh,finish};
}
function build(source,scrollSpeed,autoScroll){
 var auto=autoScroll&&autoScroll.type?autoScroll:null;
 if(auto&&!/^(up|down|left|right)$/.test(auto.type))
  throw Error('TEST313 Bitmap Multicolor Map Scroll: dirección automática no disponible: '+auto.type);
 // Preserve existing WASD input when no autonomous Map Scroll is requested.
 var autoRow=auto?(auto.type==='up'?0xfd:auto.type==='down'?0xdf:auto.type==='left'?0xfb:0xff):0xff;
 var autoCol=auto&&auto.type==='right'?0xfb:0xff;
 var speed=scrollSpeed==null?1:Number(scrollSpeed);
 var extraBySpeed={1:0,2:8,4:16,8:32,12:64};
 if(!Object.prototype.hasOwnProperty.call(extraBySpeed,speed))throw Error('TEST312: velocidad no admitida.');
 var extraFrames=extraBySpeed[speed];
 if(auto){
  extraFrames=Math.min(200,Math.max(0,Math.round(
   (Number(auto.ticksPerStep)||1)*(8/Math.max(1,Number(auto.pixelsPerStep)||8))
  )));
 }
 if(!source||!source.fullMap)throw Error('Falta el mapa completo del editor.');
 var mc=source.kind==='bitmap-mc',hi=source.kind==='char-hires',mixed=source.kind==='char-mc';
 if(!mc&&!hi&&!mixed)throw Error('TEST315 admite HiRes, Multicolor Character mixto y Bitmap Multicolor.');
 var m=source.fullMap,a=m.area,cols=m.viewWidth,rows=m.viewHeight,count=m.width*m.height,sz=mc?3:2;
 var fastChar315=!mc&&cols>1&&rows>1;
 if(m.width>255||m.height>255||a.width>255||a.height>255||sz*count>16384)
  throw Error('TEST307: el mapa excede la RAM disponible (16KB) o 255 celdas/eje.');
 if(!cols||!rows||cols>40||rows>25||a.width<cols||a.height<rows)
  throw Error('Ventana/Scroll Area incompatibles.');
 var screen1=mc?0x5c00:0x4400,screen2=mc?0xc400:0x4800,
     color1=mc?0x3800:0x2800,color2=mc?0x3c00:0x2c00,
     bitmap1=0x6000,bitmap2=0xe000,atlasBase=mc?0x4000:0x5000,
     phys=(m.physicalY*40+m.physicalX)|0,skip=40-cols;
 // Only exact 40x25 HiRes (no SID) uses in-place Color RAM shift.
  // Relocate all lookup tables above the extended 6502 code; keep
  // original addresses and binary unmodified for Bitmap/other viewports.
  var fastColor317=hi&&cols===40&&rows===25&&m.physicalX===0&&m.physicalY===0;
  // Local table-address shadowing: building a HiRes PRG must never change
  // the lookup addresses of a later Bitmap export in the same browser.
  var TABLE_ROW_LO=fastColor317?0x3000:0x1000,
      TABLE_ROW_HI=fastColor317?0x3100:0x1100,
      TABLE_COL_LO=fastColor317?0x3200:0x1200,
      TABLE_COL_HI=fastColor317?0x3300:0x1300,
      TABLE_TILE_LO=fastColor317?0x3400:0x1400,
      TABLE_TILE_HI=fastColor317?0x3500:0x1500;
  var c=assemble(fastColor317?0x2000:0x1000),b=c.b,I=c.I,A=c.A,L=c.L,J=c.J,R=c.R,uid=c.fresh;
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
 // Read two keyboard columns. Every key is evaluated independently.
 // Thus W+A, W+D, S+A, S+D each alter BOTH camera coordinates once.
 L('poll');
 if(auto){
  // Automatic bitmap Map Scroll: emulate the exact CIA key-column masks
  // that already drive the tested cardinal camera movement and bitmap render.
  I(0xa9,autoRow);I(0x85,0xf7);
  I(0xa9,autoCol);I(0x85,0xf8);
 }else{
  I(0xa9,0xfd);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf7);
  I(0xa9,0xfb);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf8);
  I(0xa9,0xff);A(0x8d,0xdc00);
 }
 I(0xa9,0);I(0x85,0xf0);
 if(fastChar315){I(0xa5,0xf6);I(0x85,0xea);I(0xa5,0xf9);I(0x85,0xeb);}
 I(0xa5,0xf7);I(0x29,2);R(0xd0,'notW');J(0x20,'incCameraY');I(0xe6,0xf0);
 L('notW');I(0xa5,0xf7);I(0x29,32);R(0xd0,'notS');J(0x20,'decCameraY');I(0xe6,0xf0);
 L('notS');I(0xa5,0xf7);I(0x29,4);R(0xd0,'notA');J(0x20,'incCameraX');I(0xe6,0xf0);
 L('notA');I(0xa5,0xf8);I(0x29,4);R(0xd0,'notD');J(0x20,'decCameraX');I(0xe6,0xf0);
 L('notD');I(0xa5,0xf0);R(0xd0,'renderRequested');J(0x4c,'poll');
 L('renderRequested');
 if(fastChar315){
  // Preserve exact 8x8 steps; reverse simultaneous keys cancel naturally.
  I(0xa9,0);I(0x85,0xee);I(0x85,0xef);
  I(0xa5,0xf6);I(0xc5,0xea);R(0xf0,'dxResolved');
  I(0xa5,0xf7);I(0x29,4);R(0xd0,'dxNegative');
  I(0xa9,1);J(0x4c,'dxSave');
  L('dxNegative');I(0xa9,255);
  L('dxSave');I(0x85,0xef);
  L('dxResolved');
  I(0xa5,0xf9);I(0xc5,0xeb);R(0xf0,'dyResolved');
  I(0xa5,0xf7);I(0x29,2);R(0xd0,'dyNegative');
  I(0xa9,1);J(0x4c,'dySave');
  L('dyNegative');I(0xa9,255);
  L('dySave');I(0x85,0xee);
  L('dyResolved');
  I(0xa5,0xee);I(0x05,0xef);R(0xd0,'deltaReallyMoved315');
  J(0x4c,'poll');
  L('deltaReallyMoved315');J(0x20,'renderDelta315');
 }else J(0x20,'renderWindow');
 J(0x20,'waitRaster252');
 I(0xa5,0xf1);R(0xf0,'swapSecond');
 // F1=1: renderWindow just populated first (low) display bank.
 if(mc){A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);}
 I(0xa9,mc?0x78:0x14);A(0x8d,0xd018);
 I(0xa9,0);I(0x85,0xf1);if(fastColor317)J(0x20,'colorShift317');else copyColor('copyColorOne');if(extraFrames>0)J(0x20,'extraDelayFrames');J(0x4c,'poll');
 L('swapSecond');
 if(mc){A(0xad,0xdd00);I(0x29,252);A(0x8d,0xdd00);}
 I(0xa9,mc?0x18:0x24);A(0x8d,0xd018);
 I(0xa9,1);I(0x85,0xf1);if(fastColor317)J(0x20,'colorShift317');else copyColor('copyColorTwo');if(extraFrames>0)J(0x20,'extraDelayFrames');J(0x4c,'poll');
 camInc(0xf9,a.height,'incCameraY');camDec(0xf9,a.height,'decCameraY');
 camInc(0xf6,a.width,'incCameraX');camDec(0xf6,a.width,'decCameraX');
 L('waitRaster252');L('rasterLoop');A(0xad,0xd012);I(0xc9,252);R(0x90,'rasterLoop');b(0x60);
 if(extraFrames>0){
  // Extra complete frames between movements. Wait for the beam to leave
  // the lower border, then return to it on the next VIC frame.
  // SID-free engine has no raster IRQ; video registers are the clock.
  L('extraDelayFrames');I(0xa2,extraFrames);
  L('waitFrameLeave');A(0xad,0xd012);I(0xc9,252);R(0xb0,'waitFrameLeave');
  J(0x20,'waitRaster252');b(0xca);R(0xd0,'waitFrameLeave');b(0x60);
 }
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
 if(!mc){I(0xa9,0);I(0x85,0xe8);I(0x85,0xe9);}
 L('cellLoop');
 if(mc){
  I(0xa0,0);I(0xb1,0xe0); // LDA (mapPointer),Y: tile ID
  b(0xaa);A(0xbd,TABLE_TILE_LO);I(0x85,0xe8);A(0xbd,TABLE_TILE_HI);I(0x85,0xe9);
  // Eight glyph scanlines into offscreen bitmap (one cell).
  I(0xa0,0);
  for(var j=0;j<8;j++){I(0xb1,0xe8);I(0x91,0xe6);if(j!==7)b(0xc8);}
  I(0xa0,1);I(0xb1,0xe0);I(0xa0,0);I(0x91,0xe2);
  I(0xa0,2);I(0xb1,0xe0);I(0xa0,0);I(0x91,0xe4);
 }else{
  // TEST314: keep the destination column at $E8 and source byte offset
  // at $E9. No 16-bit pointer additions for each screen cell.
  // The renderer resets $E9 to zero whenever the world row wraps.
  I(0xa4,0xe9);I(0xb1,0xe0);  // Y=2*sourceCol, tile
  I(0xa4,0xe8);I(0x91,0xe2);  // Y=destCol, screen char
  I(0xa4,0xe9);b(0xc8);I(0xb1,0xe0); // Y=2*sourceCol+1, Color RAM nibble
  I(0xa4,0xe8);I(0x91,0xe4);  // Y=destCol, color shadow
  I(0xe6,0xe8);I(0xe6,0xe9);I(0xe6,0xe9);
 }
 if(mc){addPtr(0xe2,1);addPtr(0xe4,1);addPtr(0xe6,8);addPtr(0xe0,sz);}

 I(0xe6,0xf3);I(0xa5,0xf3);I(0xc9,a.width);R(0xd0,'xNoWrap');
 I(0xa9,0);I(0x85,0xf3);
 I(0xa4,0xf5);A(0xb9,TABLE_ROW_LO);I(0x85,0xe0);A(0xb9,TABLE_ROW_HI);I(0x85,0xe1);
 if(!mc){I(0xa9,0);I(0x85,0xe9);}
 L('xNoWrap');
 I(0xc6,0xf2);R(0xf0,'rowDone');J(0x4c,'cellLoop');
 L('rowDone');
 if(mc){
  if(skip){addPtr(0xe2,skip);addPtr(0xe4,skip);addPtr(0xe6,skip*8);}
 }else{
  // Next visible row begins 40 C64 screen columns after previous row.
  addPtr(0xe2,40);addPtr(0xe4,40);
 }
 I(0xe6,0xf5);I(0xa5,0xf5);I(0xc9,a.height);R(0xd0,'yNoWrap');I(0xa9,0);I(0x85,0xf5);
 L('yNoWrap');I(0xc6,0xf4);R(0xf0,'renderDone');J(0x4c,'rowLoop');
 L('renderDone');b(0x60);
 // TEST315: fast char delta renderer. Both screen/color buffers remain intact.
 // On each movement, shift the previous displayed bank to the other bank,
 // then consult the world map for only newly exposed row/column cells.
 // A 1-cell viewport stays on the proven full-render path.
 if(fastChar315){
  function selectBanks315(srcScreen,srcColor,dstScreen,dstColor){
   ptr(0xe0,srcScreen+phys);ptr(0xe4,srcColor+phys);
   ptr(0xe2,dstScreen+phys);ptr(0xe6,dstColor+phys);
  }
  function target315(extra){
   I(0xa5,0xf1);R(0xf0,'target315two'+extra);
   ptr(0xe2,screen1+phys);ptr(0xe4,color1+phys);J(0x4c,'target315ready'+extra);
   L('target315two'+extra);
   ptr(0xe2,screen2+phys);ptr(0xe4,color2+phys);
   L('target315ready'+extra);
  }
  function incrementWrapped315(addr,height,label){
   I(0xe6,addr);I(0xa5,addr);I(0xc9,height);R(0xd0,label);
   I(0xa9,0);I(0x85,addr);L(label);
  }
  L('renderDelta315');
  I(0xa5,0xee);I(0x05,0xef);R(0xd0,'deltaNonzero315');b(0x60);
  L('deltaNonzero315');
  // F1=0 -> front is bank1, render into bank2; F1=1 reverse.
  I(0xa5,0xf1);R(0xf0,'deltaFromBankOne315');
  selectBanks315(screen2,color2,screen1,color1);J(0x4c,'deltaBanksReady315');
  L('deltaFromBankOne315');
  selectBanks315(screen1,color1,screen2,color2);
  L('deltaBanksReady315');
  // Camera +X/+Y: source rectangle begins one tile later.
  // Camera -X/-Y: destination rectangle begins one tile later.
  I(0xa5,0xef);I(0xc9,1);R(0xd0,'deltaXPosDone315');
  addPtr(0xe0,1);addPtr(0xe4,1);
  L('deltaXPosDone315');
  I(0xa5,0xef);I(0xc9,255);R(0xd0,'deltaXNegDone315');
  addPtr(0xe2,1);addPtr(0xe6,1);
  L('deltaXNegDone315');
  I(0xa5,0xee);I(0xc9,1);R(0xd0,'deltaYPosDone315');
  addPtr(0xe0,40);addPtr(0xe4,40);
  L('deltaYPosDone315');
  I(0xa5,0xee);I(0xc9,255);R(0xd0,'deltaYNegDone315');
  addPtr(0xe2,40);addPtr(0xe6,40);
  L('deltaYNegDone315');
  I(0xa9,cols);I(0x85,0xf2);I(0xa5,0xef);R(0xf0,'deltaKeepWidth315');I(0xc6,0xf2);L('deltaKeepWidth315');
  I(0xa9,rows);I(0x85,0xf4);I(0xa5,0xee);R(0xf0,'deltaKeepHeight315');I(0xc6,0xf4);L('deltaKeepHeight315');
  L('deltaRow315');
  I(0xa0,0);
  L('deltaCopyCell315');
  I(0xb1,0xe0);I(0x91,0xe2);
  if(!fastColor317){I(0xb1,0xe4);I(0x91,0xe6);}
  b(0xc8);I(0xc4,0xf2);R(0xd0,'deltaCopyCell315');
  addPtr(0xe0,40);addPtr(0xe2,40);
  if(!fastColor317){addPtr(0xe4,40);addPtr(0xe6,40);}
  I(0xc6,0xf4);R(0xd0,'deltaRow315');
  I(0xa5,0xee);R(0xf0,'deltaNoRow315');J(0x20,'deltaEdgeRow315');
  L('deltaNoRow315');
  I(0xa5,0xef);R(0xf0,'deltaNoCol315');J(0x20,'deltaEdgeCol315');
  L('deltaNoCol315');b(0x60);
  // Generic one-tile map fetch; F3/F5 are world x/y relative to Scroll Area.
  // E2/E4 are destination pointers; E8 selects a column (0 for vertical edge).
  L('deltaFetchCell315');
  I(0xa4,0xf5);A(0xb9,TABLE_ROW_LO);I(0x85,0xe0);
  A(0xb9,TABLE_ROW_HI);I(0x85,0xe1);
  I(0xa6,0xf3);b(0x18);I(0xa5,0xe0);A(0x7d,TABLE_COL_LO);I(0x85,0xe0);
  I(0xa5,0xe1);A(0x7d,TABLE_COL_HI);I(0x85,0xe1);
  I(0xa0,0);I(0xb1,0xe0);I(0xa4,0xe8);I(0x91,0xe2);
  I(0xa0,1);I(0xb1,0xe0);I(0xa4,0xe8);I(0x91,0xe4);b(0x60);
  L('deltaEdgeRow315');
  target315('row');
  I(0xa5,0xf9);I(0x85,0xf5); // world Y of first visible row
  I(0xa5,0xee);I(0xc9,1);R(0xd0,'deltaRowTop315');
  addPtr(0xe2,(rows-1)*40);addPtr(0xe4,(rows-1)*40);
  I(0xa2,rows-1);
  L('deltaRowComputeY315');incrementWrapped315(0xf5,a.height,'deltaRowYNoWrap315');
  b(0xca);R(0xd0,'deltaRowComputeY315');
  L('deltaRowTop315');
  I(0xa5,0xf6);I(0x85,0xf3);
  I(0xa9,0);I(0x85,0xe8);
  L('deltaDrawRow315');
  J(0x20,'deltaFetchCell315');
  incrementWrapped315(0xf3,a.width,'deltaRowXNoWrap315');
  I(0xe6,0xe8);I(0xa5,0xe8);I(0xc9,cols);R(0xd0,'deltaDrawRow315');
  b(0x60);
  L('deltaEdgeCol315');
  target315('col');
  I(0xa5,0xf6);I(0x85,0xf3);
  I(0xa5,0xef);I(0xc9,1);R(0xd0,'deltaColLeft315');
  addPtr(0xe2,cols-1);addPtr(0xe4,cols-1);
  I(0xa2,cols-1);
  L('deltaColComputeX315');incrementWrapped315(0xf3,a.width,'deltaColXNoWrap315');
  b(0xca);R(0xd0,'deltaColComputeX315');
  L('deltaColLeft315');
  I(0xa5,0xf9);I(0x85,0xf5);
  I(0xa9,0);I(0x85,0xe8);
  I(0xa9,rows);I(0x85,0xf4);
  L('deltaDrawCol315');
  J(0x20,'deltaFetchCell315');
  addPtr(0xe2,40);addPtr(0xe4,40);
  incrementWrapped315(0xf5,a.height,'deltaColYNoWrap315');
  I(0xc6,0xf4);R(0xd0,'deltaDrawCol315');
  b(0x60);
 }
 // TEST317: direct in-place Color RAM scroll for full-screen HiRes only.
 // Preserves per-cell colors (0-15) without copying Color RAM shadows.
 // All screen codes still use tested TEST315 double-buffer renderer.
 if(fastColor317){
  L('colorShift317');
  I(0xa5,0xee);I(0xc9,1);R(0xf0,'colorDyPos317');
  I(0xc9,255);R(0xf0,'colorDyNeg317');
  L('colorDyZero317');
  I(0xa5,0xef);I(0xc9,1);R(0xf0,'colorDxOnlyPos317');
  J(0x4c,'colorMove_m1');
  L('colorDxOnlyPos317');J(0x4c,'colorMove_p1');
  L('colorDyPos317');
  I(0xa5,0xef);I(0xc9,1);R(0xf0,'colorYposXpos317');
  I(0xc9,255);R(0xf0,'colorYposXneg317');
  J(0x4c,'colorMove_p40');
  L('colorYposXpos317');J(0x4c,'colorMove_p41');
  L('colorYposXneg317');J(0x4c,'colorMove_p39');
  L('colorDyNeg317');
  I(0xa5,0xef);I(0xc9,1);R(0xf0,'colorYnegXpos317');
  I(0xc9,255);R(0xf0,'colorYnegXneg317');
  J(0x4c,'colorMove_m40');
  L('colorYnegXpos317');J(0x4c,'colorMove_m39');
  L('colorYnegXneg317');J(0x4c,'colorMove_m41');
  // Each movement has an overlap-safe forward or backward copy; linear
  // 40x25 indexing may cross row borders but those edge cells are repainted.
  for(var shift317 of [1,-1,40,-40,39,41,-39,-41]){
   var id317=(shift317>0?'p':'m')+Math.abs(shift317),
       count317=1000-Math.abs(shift317),pages317=Math.floor(count317/256),
       tail317=count317%256;
   L('colorMove_'+id317);
   if(shift317>0){
    for(var page317=0;page317<pages317;page317++){
     I(0xa2,0);var loop317='c317'+id317+'p'+page317;L(loop317);
     for(var k317=0;k317<8;k317++){
      A(0xbd,0xd800+shift317+page317*256+k317*1);
      A(0x9d,0xd800+page317*256+k317*1);
     }
     b(0x8a);b(0x18);I(0x69,8);b(0xaa);R(0xd0,loop317);
    }
    if(tail317){
     var bulk317=tail317&~7,rem317=tail317-bulk317;
     if(bulk317){
      I(0xa2,0);var tailLabel317='c317'+id317+'tail';L(tailLabel317);
      for(var k317=0;k317<8;k317++){
       A(0xbd,0xd800+shift317+pages317*256+k317);
       A(0x9d,0xd800+pages317*256+k317);
      }
      b(0x8a);b(0x18);I(0x69,8);b(0xaa);I(0xe0,bulk317);R(0xd0,tailLabel317);
     }
     for(var k317=bulk317;k317<tail317;k317++){
      A(0xad,0xd800+shift317+pages317*256+k317);
      A(0x8d,0xd800+pages317*256+k317);
     }
    }
   }else{
    var absShift317=-shift317;
    for(var page317=0;page317<pages317;page317++){
     var dstFirst317=999-page317*256-255;
     I(0xa2,255);var loop317='c317'+id317+'p'+page317;L(loop317);
     for(var k317=0;k317<8;k317++){
      A(0xbd,0xd800+dstFirst317-absShift317-k317);
      A(0x9d,0xd800+dstFirst317-k317);
     }
     b(0x8a);b(0x38);I(0xe9,8);b(0xaa);I(0xe0,255);R(0xd0,loop317);
    }
    if(tail317){
     var dstStart317=999-pages317*256-(tail317-1),
         bulk317=tail317&~7,rem317=tail317-bulk317;
     if(bulk317){
      I(0xa2,tail317-1);var tailLabel317='c317'+id317+'tail';L(tailLabel317);
      for(var k317=0;k317<8;k317++){
       A(0xbd,0xd800+dstStart317-absShift317-k317);
       A(0x9d,0xd800+dstStart317-k317);
      }
      b(0x8a);b(0x38);I(0xe9,8);b(0xaa);I(0xe0,rem317-1);R(0xd0,tailLabel317);
     }
     for(var k317=rem317-1;k317>=0;k317--){
      A(0xad,0xd800+dstStart317-absShift317+k317);
      A(0x8d,0xd800+dstStart317+k317);
     }
    }
   }
   J(0x4c,'colorBorders317');
  }
  // The destination shadow bank contains exact values for the new border
  // cells written by deltaEdgeRow315 / deltaEdgeCol315 before VIC swap.
  L('colorBorders317');
  // $F1=0 means the first bank is now visible.
  I(0xa5,0xf1);R(0xf0,'colorBankOne317');
  I(0xa9,1);I(0x85,0xed);J(0x4c,'colorEdgeDispatch317');
  L('colorBankOne317');I(0xa9,0);I(0x85,0xed);
  L('colorEdgeDispatch317');
  I(0xa5,0xee);R(0xf0,'colorNoRow317');
  I(0xc9,1);R(0xf0,'colorBottom317');
  I(0xa5,0xed);R(0xf0,'colorRowTopOne317');
  J(0x20,'colorRowTopTwo317');J(0x4c,'colorNoRow317');
  L('colorRowTopOne317');J(0x20,'colorRowTopOneBody317');J(0x4c,'colorNoRow317');
  L('colorBottom317');
  I(0xa5,0xed);R(0xf0,'colorRowBottomOne317');
  J(0x20,'colorRowBottomTwo317');J(0x4c,'colorNoRow317');
  L('colorRowBottomOne317');J(0x20,'colorRowBottomOneBody317');
  L('colorNoRow317');
  I(0xa5,0xef);R(0xf0,'colorDone317');
  I(0xc9,1);R(0xf0,'colorRight317');
  I(0xa5,0xed);R(0xf0,'colorColLeftOne317');
  J(0x20,'colorColLeftTwo317');J(0x4c,'colorDone317');
  L('colorColLeftOne317');J(0x20,'colorColLeftOneBody317');J(0x4c,'colorDone317');
  L('colorRight317');
  I(0xa5,0xed);R(0xf0,'colorColRightOne317');
  J(0x20,'colorColRightTwo317');J(0x4c,'colorDone317');
  L('colorColRightOne317');J(0x20,'colorColRightOneBody317');
  L('colorDone317');b(0x60);
  for(var bank317=0;bank317<=1;bank317++){
   var source317=bank317?color2:color1,suffix317=bank317?'Two317':'OneBody317';
   for(var atBottom317 of [false,true]){
    var rowName317='colorRow'+(atBottom317?'Bottom':'Top')+suffix317;
    L(rowName317);
    I(0xa2,0);
    L(rowName317+'Loop');
    var rowBase317=atBottom317?960:0;
    A(0xbd,source317+rowBase317);
    A(0x9d,0xd800+rowBase317);
    b(0xe8);I(0xe0,40);R(0xd0,rowName317+'Loop');b(0x60);
   }
   for(var atRight317 of [false,true]){
    var colName317='colorCol'+(atRight317?'Right':'Left')+suffix317;L(colName317);
    for(var row317=0;row317<25;row317++){
     var colOffset317=row317*40+(atRight317?39:0);
     A(0xad,source317+colOffset317);
     A(0x8d,0xd800+colOffset317);
    }
    b(0x60);
   }
  }
 }
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
 var program=c.finish(),load=0x0801,end=Math.max(atlasBase+2048,TABLE_TILE_HI+256,MAP+m.packed.length);
 if(end>0xc000)throw Error('Los datos invaden memoria de video C64.');
 var prg=new Uint8Array(2+end-load);
 function at(addr){return 2+addr-load;}
 prg[0]=1;prg[1]=8;
 prg.set([0x0b,0x08,10,0,0x9e,50,48,54,52,0,0,0],at(0x0801));
 prg.set(program.code,at(BASE));
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
  mapType:'Full configured LVLLVL source, cyclic over Scroll Area instead of 40x25 window',
  rendererOptimization:mc?'unchanged bitmap':fastColor317?'TEST317 Color RAM in-place shifting + edge-only recolor':fastChar315?'TEST315 shifted double-buffer + border-only redraw':'TEST314 narrow viewport fallback',
  scrollSpeedFrames:extraFrames,scrollSpeedLevel:speed,autoMapScroll:auto?{...auto,actualStepPixels:8}:null};
}
w.RICO_TEST307_FULLMAP={version:'TEST307',makePRG:build};
})(window);
