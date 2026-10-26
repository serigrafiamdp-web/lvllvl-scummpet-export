/* TEST306 — hold-to-scroll panel and continuously repeating WASD PRG.
   Standalone lab + experimental export PRG. Does not patch normal Export PRG.
   A left, D right, W up, S down. No joystick, no arrow keys.
   Map shifts bitmap+screen+color together; Group shifts glyph patterns but
   holds physical palette coordinates stationary. Exact lossless data.
*/
(function(w,doc){
'use strict';
var PRE='rico304',W=40,H=25,SZ=1000;
var colors=['#000000','#ffffff','#813338','#75cec8','#8e3c97','#56ac4d','#2e2c9b','#edf171','#8e5029','#553800','#c46c71','#4a4a4a','#7b7b7b','#a9ff9f','#706deb','#b2b2b2'];
var st={source:null,current:null,model:null,kind:'map',dx:0,dy:0,steps:0,keyboard:false,dialogOpen:false,dialog:null,exportWithWASD:false,report:null,holdButton:null,holdDelayTimer:null,holdTimer:null,scrollSpeed:1,scrollEngine319:'character',charProjection323:false};
function mod(n,k){return(n%k+k)%k;}
function equal(a,b){return a.length===b.length&&a.every(function(v,i){return v===b[i];});}
function clone(s){return{kind:s.kind,tiles:s.tiles.slice(),fg:s.fg.slice(),atlas:s.atlas.slice(),bg:s.bg,
 bitmap:s.bitmap&&s.bitmap.slice(),screen:s.screen&&s.screen.slice(),color:s.color&&s.color.slice()};}
function mapMove(s,dx,dy){var o=clone(s);
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var dest=y*40+x,from=mod(y+dy,25)*40+mod(x+dx,40);
  o.tiles[dest]=s.tiles[from];o.fg[dest]=s.fg[from];
  if(s.bitmap)o.bitmap.set(s.bitmap.subarray(from*8,from*8+8),dest*8);
  if(s.screen)o.screen[dest]=s.screen[from];
  if(s.color)o.color[dest]=s.color[from];
 }return o;}
function groupMove(s,g,dx,dy){var o=clone(s);if(!g)return o;
 var coords={},chosen=new Set(g.members.map(function(x){return x.tile;}));
 g.matrix.forEach(function(id,i){if(id>=0&&!coords[id])coords[id]={x:i%g.width,y:Math.floor(i/g.width)};});
 for(var n=0;n<1000;n++){
  var id=s.tiles[n],pos=coords[id];if(!chosen.has(id)||!pos)continue;
  var newID=g.matrix[mod(pos.y+dy,g.height)*g.width+mod(pos.x+dx,g.width)];
  if(newID<0||newID>255||newID===undefined)continue;
  o.tiles[n]=newID;if(s.bitmap)o.bitmap.set(s.atlas.subarray(newID*8,newID*8+8),n*8);
 }return o;}
function capture(){
 var e=w.g_app&&w.g_app.textModeEditor,l=e&&e.layers&&e.layers.getSelectedLayerObject();
 if(!l||!l.frames)throw Error('Seleccioná un Layer con mapa.');
 var f=l.currentFrame||0,fr=l.frames[f],ts=l.getTileSet();
 if(!fr||!fr.data||!ts||ts.getTileWidth()!==8||ts.getTileHeight()!==8)throw Error('Se requiere Layer y tiles 8×8.');
 var bm=l.getScreenMode()==='c64multicolor'&&l.doc&&l.doc.ricoBitmapV1Enabled;
 var mode=l.getScreenMode(),bank=Number(e.graphic&&e.graphic.frames&&e.graphic.frames[f]&&e.graphic.frames[f].charsetBank)===2?2:1,
  rec=ts.getDocRecord&&ts.getDocRecord(),settings=rec&&rec.data||{},
  glyphs=bank===2?settings.ricoCharsetBank2&&settings.ricoCharsetBank2.tileData:ts.tileData;
 if(!glyphs)throw Error('Charset BANK'+bank+' no encontrado.');
 var atlas=new Uint8Array(2048),ids=new Uint8Array(1000),fg=new Uint8Array(1000);
 for(var t=0;t<256;t++)for(var row=0;row<8;row++){
  var p=glyphs[t]&&glyphs[t].data&&glyphs[t].data[0]||[],v=0;
  for(var col=0;col<8;col++)if(p[row*8+col])v|=128>>col;
  atlas[t*8+row]=v;
 }
 var ww=l.getGridWidth(),hh=l.getGridHeight();
 for(var y=0;y<25;y++)for(var x=0;x<40;x++){
  var cell=y<hh&&x<ww&&fr.data[y]&&fr.data[y][x],i=y*40+x;
  ids[i]=cell&&Number.isInteger(cell.t)&&cell.t>=0&&cell.t<256?cell.t:0;
  fg[i]=cell&&Number.isInteger(cell.fc)?cell.fc&15:1;
 }
 var src={kind:bm?'bitmap-mc':mode==='c64multicolor'?'char-mc':'char-hires',tiles:ids,fg,atlas,
 bg:typeof l.getBackgroundColor==='function'?l.getBackgroundColor()&15:0,
 mc1:typeof l.getC64Multi1Color==='function'?l.getC64Multi1Color(f)&15:11,
 mc2:typeof l.getC64Multi2Color==='function'?l.getC64Multi2Color(f)&15:12,
 bitmap:null,screen:null,color:null};
 var model=null;if(bm){
  // Capture a STATIC Bitmap MC directly. Manual MAP scroll MUST work
  // even without a Group Animate, or with group types unsupported by
  // the TEST290 animation exporter.
  var pal=(w.RICO_TEST279_BITMAP&&typeof w.RICO_TEST279_BITMAP.seed==='function')?
    w.RICO_TEST279_BITMAP.seed(fr,l):fr.ricoBmpColors||[];
  var bitmap=new Uint8Array(8000),screen=new Uint8Array(1000),
      color=new Uint8Array(1000);
  for(var cy=0;cy<25;cy++)for(var cx=0;cx<40;cx++){
   var k=cy*40+cx,tile=ids[k],within=cy<hh&&cx<ww,
       ink=within?(Number(pal[cy*ww+cx])||0)&4095:0;
   bitmap.set(atlas.subarray(tile*8,tile*8+8),k*8);
   screen[k]=((ink&15)<<4)|((ink>>4)&15);
   color[k]=(ink>>8)&15;
  }
  model={atlas:atlas,bitmap:bitmap,screen:screen,color:color,animations:[]};
  // GROUP is optional: read a selected group when it can be analyzed.
  try{
   if(w.RICO_TEST290_BITMAP&&typeof w.RICO_TEST290_BITMAP.analyze==='function'){
    var groupModel=w.RICO_TEST290_BITMAP.analyze();
    if(groupModel&&Array.isArray(groupModel.animations))
     model.animations=groupModel.animations;
   }
  }catch(groupError){ /* MAP is independent of group exporter. */ }
  src.bitmap=bitmap;src.screen=screen;src.color=color;
 }
 // Mixed Character preserves per-cell Color RAM bit3 (0..7 HiRes, 8..15 Multicolor).

 // TEST307: retain every configured map cell, not just the 40x25 viewport.
 // Packing keeps the full level in 16K of CPU RAM at $8000-$BFFF;
 // the VIC double bitmaps, screens and C3 shadow buffers stay independent.
 if(!Number.isInteger(ww)||!Number.isInteger(hh)||ww<1||hh<1||ww>255||hh>255)
  throw Error('WASD mapa completo admite dimensiones de 1 a 255 celdas por eje.');
 var count=ww*hh,bytesPerCell=bm?3:2;
 if(count*bytesPerCell>0x4000)
  throw Error('WASD: mapa '+ww+'x'+hh+' excede los 16 KB de datos C64 ('+
   Math.floor(0x4000/bytesPerCell)+' celdas máximas en este motor).');
 var packed=new Uint8Array(count*bytesPerCell);
 var wholePal=bm?((w.RICO_TEST279_BITMAP&&typeof w.RICO_TEST279_BITMAP.seed==='function')?
  w.RICO_TEST279_BITMAP.seed(fr,l):(fr.ricoBmpColors||[])):null;
 for(var fy=0;fy<hh;fy++)for(var fx=0;fx<ww;fx++){
  var fi=fy*ww+fx,cell=fr.data[fy]&&fr.data[fy][fx],code=(cell&&Number.isInteger(cell.t)&&cell.t>=0&&cell.t<256)?cell.t:0;
  packed[fi*bytesPerCell]=code;
  if(bm){
   var cp=(Number(wholePal&&wholePal[fi])||0)&4095;
   packed[fi*3+1]=((cp&15)<<4)|((cp>>4)&15);
   packed[fi*3+2]=(cp>>8)&15;
  }else packed[fi*2+1]=cell&&Number.isInteger(cell.fc)?cell.fc&15:1;
 }
 var graphic=e.graphic,geo=w.RICO_TEST75_WINDOW_DIMENSION,win=null,area=null;
 try{if(geo&&graphic&&typeof geo.getConfig==='function')win=geo.getConfig(graphic,f);}catch(ignore){}
 try{if(geo&&graphic&&typeof geo.getScrollArea==='function')area=geo.getScrollArea(graphic,f);}catch(ignore){}
 function rect(r){r=r||{};var x=Math.max(0,Math.min(ww-1,Number(r.x)||0)),y=Math.max(0,Math.min(hh-1,Number(r.y)||0));
  return{x:x,y:y,width:Math.max(1,Math.min(ww-x,Number(r.width)||ww-x)),
   height:Math.max(1,Math.min(hh-y,Number(r.height)||hh-y))};}
 win=rect(win);area=rect(area);
 var vw=Math.min(40,win.width,area.width),vh=Math.min(25,win.height,area.height);
 var worldX=((win.x-area.x)%area.width+area.width)%area.width;
 var worldY=((win.y-area.y)%area.height+area.height)%area.height;
 src.fullMap={width:ww,height:hh,packed:packed,bytesPerCell:bytesPerCell,
  area:area,window:win,viewWidth:vw,viewHeight:vh,
  physicalX:Math.max(0,Math.min(40-vw,win.x)),
  physicalY:Math.max(0,Math.min(25-vh,win.y)),
  initialX:worldX,initialY:worldY};
 return {source:src,model,bank:bank};
}
function verify(src,model){
 var report={kind:src.kind,mapTested:4,groupTested:4,roundTrips:0,colorsUnchangedForGroup:true,pass:true,failures:[]};
 for(var dir of [[1,0],[-1,0],[0,1],[0,-1]]){
  var a=mapMove(src,dir[0],dir[1]),back=mapMove(a,-dir[0],-dir[1]);
  for(var p of ['tiles','bitmap','screen','color','fg'])if(src[p]&&!equal(src[p],back[p]))report.failures.push('MAP '+p);
  if(!report.failures.length)report.roundTrips++;
  var group=model&&model.animations&&model.animations[0];
  if(group){
   var q=groupMove(src,group,dir[0],dir[1]),returnMove=groupMove(q,group,-dir[0],-dir[1]);
   for(var p of ['tiles','bitmap','screen','color','fg'])if(src[p]&&!equal(src[p],returnMove[p]))
    report.failures.push('GROUP '+p);
   if(src.color&&!equal(src.color,q.color))report.colorsUnchangedForGroup=false;
  }
 }
 report.pass=!report.failures.length&&report.colorsUnchangedForGroup;return report;
}
var rgb=colors.map(function(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];});
function paint(canvas,sc){
 var ctx=canvas.getContext('2d'),im=ctx.createImageData(320,200),d=im.data;
 for(var ry=0;ry<25;ry++)for(var rx=0;rx<40;rx++){
  var c=ry*40+rx,tile=sc.tiles[c],inks=sc.bitmap?[sc.bg,sc.screen[c]>>4,sc.screen[c]&15,sc.color[c]&15]:
   [sc.bg,sc.fg[c],sc.fg[c],sc.fg[c]];
  for(var y=0;y<8;y++){
   var bits=sc.bitmap?sc.bitmap[c*8+y]:sc.atlas[tile*8+y];
   for(var x=0;x<8;x++){
    var k=sc.bitmap?(bits>>(6-2*(x>>1)))&3:(bits>>(7-x))&1,
       col=rgb[inks[k]&15],i=((ry*8+y)*320+rx*8+x)*4;
    d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;
   }
  }
 }ctx.putImageData(im,0,0);
}
function compiler(){
 var buf=[],labels={},fix=[],start=0x0810;
 var pc=()=>start+buf.length,b=x=>buf.push(x&255),I=(op,n)=>{b(op);b(n);},A=(op,n)=>{b(op);b(n);b(n>>8);};
 var L=n=>{if(labels[n]!==undefined)throw Error('Label duplicate '+n);labels[n]=pc();};
 var J=(op,n)=>{b(op);fix.push({index:buf.length,name:n});b(0);b(0);};
 var R=(op,n)=>{b(op);fix.push({index:buf.length,name:n,rel:true});b(0);};
 function done(){for(var f of fix){
  var p=labels[f.name];if(p===undefined)throw Error('Missing label '+f.name);
  if(f.rel){var v=p-(start+f.index+1);if(v<-128||v>127)throw Error('Branch too far '+f.name+' '+v);buf[f.index]=v&255;}
  else{buf[f.index]=p&255;buf[f.index+1]=p>>8;}
 }return{code:new Uint8Array(buf),labels};}
 return {b,I,A,L,J,R,done};
}
function makePRG(source,scrollSpeed){
  if(source&&source.fullMap){
   if(!w.RICO_TEST307_FULLMAP||typeof w.RICO_TEST307_FULLMAP.makePRG!=='function')
    throw Error('TEST307 Full Map no se cargó; recargá la página con Ctrl+F5.');
   return w.RICO_TEST307_FULLMAP.makePRG(source,scrollSpeed||st.scrollSpeed);
  }
 // Two independent bitmaps, two independent screen matrices, two COLOR-RAM
 // shadow buffers. Held WASD repeats continuously at the render-limited C64 cadence.
 if(source.kind!=='char-hires'&&source.kind!=='bitmap-mc')throw Error('Modo no disponible.');
 var mc=source.kind==='bitmap-mc',screen1=mc?0x5c00:0x4400,
  screen2=mc?0xc400:0x4800,color1=mc?0x3800:0x2800,color2=mc?0x3c00:0x2c00,
  bmp1=0x6000,bmp2=0xe000;
 var c=compiler(),b=c.b,I=c.I,A=c.A,L=c.L,J=c.J,R=c.R;
 function ptr(z,address){I(0xA9,address&255);I(0x85,z);I(0xA9,address>>8);I(0x85,z+1);}
 function transfer(src,dst,n){ptr(0xe0,src);ptr(0xe2,dst);I(0xA9,n&255);I(0x85,0xe4);
  I(0xA9,n>>8);I(0x85,0xe5);J(0x20,'copyBytes');}
 function plane(z){ // position pair selected by current visible-screen flag
  I(0xA5,0xf1);R(0xF0,'plane'+z+'one');
  ptr(0xe0,z[2]);ptr(0xe2,z[1]);J(0x4c,'plane'+z+'ready');
  L('plane'+z+'one');ptr(0xe0,z[1]);ptr(0xe2,z[2]);L('plane'+z+'ready');
  I(0xA9,z[3]&255);I(0x85,0xec);I(0xA9,z[3]>>8);I(0x85,0xed);
  I(0xA9,z[4]);I(0x85,0xee);I(0xA9,0);I(0x85,0xef);
  I(0xA9,(z[3]*25)&255);I(0x85,0xf4);
  I(0xA9,(z[3]*25)>>8);I(0x85,0xf5);
  J(0x20,'scrollDirection');
 }
 L('start');b(0x78);I(0xA9,0x35);I(0x85,1);
 I(0xA9,0x0b);A(0x8d,0xd011);
 // CIA1 keyboard columns output, rows input. No joystick controls.
 I(0xA9,255);A(0x8d,0xdc02);I(0xA9,0);A(0x8d,0xdc03);I(0xA9,255);A(0x8d,0xdc00);
 if(mc){
  transfer(0x1000,bmp1,8000);transfer(0x1000,bmp2,8000);
  transfer(0x2f40,screen1,1000);transfer(0x2f40,screen2,1000);
  transfer(0x3328,color1,1000);transfer(0x3328,color2,1000);
 }else{
  transfer(0x2000,screen1,1000);transfer(0x2000,screen2,1000);
  transfer(0x2400,color1,1000);transfer(0x2400,color2,1000);
 }
 transfer(color1,0xd800,1000);
 A(0xad,0xdd02);I(0x09,3);A(0x8d,0xdd02);
 A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);
 I(0xA9,mc?0x78:0x14);A(0x8d,0xd018);
 I(0xA9,mc?0x18:0x08);A(0x8d,0xd016);
 I(0xA9,source.bg&15);A(0x8d,0xd020);A(0x8d,0xd021);
 I(0xA9,0);I(0x85,0xf0);I(0x85,0xf1);
 I(0xA9,mc?0x3b:0x1b);A(0x8d,0xd011);
 L('poll');
 // W: col1 row1 = bit1, A: col1 row2 bit2, S: col1 row5 bit5;
 // D: col2 row2 bit2. CIA active-low keyboard scan.
 I(0xA9,0xfd);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf7);
 I(0xA9,0xfb);A(0x8d,0xdc00);A(0xad,0xdc01);I(0x85,0xf8);
 I(0xA9,0xff);A(0x8d,0xdc00);
 I(0xA9,0);I(0x85,0xf2);
 I(0xA5,0xf7);I(0x29,2);R(0xf0,'keyW');
 I(0xA5,0xf7);I(0x29,4);R(0xf0,'keyA');
 I(0xA5,0xf7);I(0x29,32);R(0xf0,'keyS');
 I(0xA5,0xf8);I(0x29,4);R(0xf0,'keyD');
 J(0x4c,'handle');
 L('keyW');I(0xA9,2);J(0x4c,'keySave');
 L('keyA');I(0xA9,1);J(0x4c,'keySave');
 L('keyS');I(0xA9,3);J(0x4c,'keySave');
 L('keyD');I(0xA9,4);
 L('keySave');I(0x85,0xf2);
 // Holding a key repeats immediately after each completed frame redraw.
 L('handle');I(0xA5,0xf2);R(0xd0,'heldKey');J(0x4c,'poll');
 L('heldKey');
 // Render the offscreen screen, color shadow, bitmap if MC. No background IRQ.
 plane(['scr',screen1,screen2,40,1]);
 plane(['col',color1,color2,40,1]);
 if(mc)plane(['bmp',bmp1,bmp2,320,8]);
 // Display never blanks on a scroll. Finish the new bank offscreen and swap
 // at raster ~252, then update Color RAM top-to-bottom ahead of the beam.
 J(0x20,'waitRaster252');
 I(0xA5,0xf1);R(0xf0,'showTwo');
 if(mc){A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);}
 I(0xA9,mc?0x78:0x14);A(0x8d,0xd018);I(0xA9,0);I(0x85,0xf1);J(0x4c,'colorFrontOne');
 L('showTwo');
 if(mc){A(0xad,0xdd00);I(0x29,252);A(0x8d,0xdd00);}
 I(0xA9,mc?0x18:0x24);A(0x8d,0xd018);I(0xA9,1);I(0x85,0xf1);
 J(0x20,'copyFastColorTwo');J(0x4c,'poll');
 L('colorFrontOne');J(0x20,'copyFastColorOne');J(0x4c,'poll');
 L('waitRaster252');
 L('waitRasterLoop');A(0xad,0xd012);I(0xc9,252);R(0x90,'waitRasterLoop');b(0x60);
 // -------- scroll kernel ----------------------------------------------
 // -------- scroll kernel ----------------------------------------------
 // Input E0/1 original source address, E2/3 destination,
 // EC/ED row byte stride (40 / 320), EE glyph byte size (1 / 8),
 // F4/F5 bytes total (1000 / 8000), F2 direction 1 A, 2 W, 3 S, 4 D.
 L('scrollDirection');
 I(0xA5,0xe0);I(0x85,0xe8);I(0xA5,0xe1);I(0x85,0xe9);
 I(0xA5,0xe2);I(0x85,0xea);I(0xA5,0xe3);I(0x85,0xeb);
 I(0xA5,0xf2);I(0xc9,1);R(0xd0,'notLeft');J(0x20,'slideLeft');b(0x60);
 L('notLeft');I(0xc9,4);R(0xd0,'notRight');J(0x20,'slideRight');b(0x60);
 L('notRight');I(0xc9,2);R(0xd0,'notUp');J(0x20,'slideUp');b(0x60);
 L('notUp');J(0x20,'slideDown');b(0x60);
 function restore(){I(0xA5,0xe8);I(0x85,0xe0);I(0xA5,0xe9);I(0x85,0xe1);
                   I(0xA5,0xea);I(0x85,0xe2);I(0xA5,0xeb);I(0x85,0xe3);}
 function countUnit(){I(0xA5,0xee);I(0x85,0xe4);I(0xA9,0);I(0x85,0xe5);}
 function countRowMinusUnit(){
  b(0x38);I(0xA5,0xec);I(0xe5,0xee);I(0x85,0xe4);
  I(0xA5,0xed);I(0xe9,0);I(0x85,0xe5);
 }
 function countRow(){I(0xA5,0xec);I(0x85,0xe4);I(0xA5,0xed);I(0x85,0xe5);}
 function countTotalMinusRow(){
  b(0x38);I(0xA5,0xf4);I(0xe5,0xec);I(0x85,0xe4);
  I(0xA5,0xf5);I(0xe5,0xed);I(0x85,0xe5);
 }
 function addToPtr(ptr,lo,hi){b(0x18);I(0xA5,ptr);I(0x65,lo);I(0x85,ptr);
  I(0xA5,ptr+1);I(0x65,hi);I(0x85,ptr+1);}
 function addImmediate(ptr,val){b(0x18);I(0xA5,ptr);I(0x69,val&255);I(0x85,ptr);
  I(0xA5,ptr+1);I(0x69,val>>8);I(0x85,ptr+1);}
 // temp count E4/E5 is consumed by copyBytes, so compute after pointer change.
 L('slideLeft');
 I(0xA9,25);I(0x85,0xe6);L('leftRow');
 restore();addToPtr(0xe0,0xee,0xef);countRowMinusUnit();J(0x20,'copyBytes');
 restore();
 // Dest offset stride-unit via two's complement: add stride then subtract unit
 addToPtr(0xe2,0xec,0xed);
 b(0x38);I(0xA5,0xe2);I(0xe5,0xee);I(0x85,0xe2);
 I(0xA5,0xe3);I(0xe9,0);I(0x85,0xe3);
 countUnit();J(0x20,'copyBytes');J(0x20,'advanceBases');
 I(0xc6,0xe6);R(0xd0,'leftRow');b(0x60);
 L('slideRight');I(0xA9,25);I(0x85,0xe6);L('rightRow');
 restore();addToPtr(0xe0,0xec,0xed);
 b(0x38);I(0xA5,0xe0);I(0xe5,0xee);I(0x85,0xe0);
 I(0xA5,0xe1);I(0xe9,0);I(0x85,0xe1);
 countUnit();J(0x20,'copyBytes');
 restore();addToPtr(0xe2,0xee,0xef);
 countRowMinusUnit();J(0x20,'copyBytes');J(0x20,'advanceBases');
 I(0xc6,0xe6);R(0xd0,'rightRow');b(0x60);
 L('slideUp');restore();addToPtr(0xe0,0xec,0xed);countTotalMinusRow();J(0x20,'copyBytes');
 restore();countTotalMinusRow();addToPtr(0xe2,0xe4,0xe5);
 countRow();J(0x20,'copyBytes');b(0x60);
 L('slideDown');restore();countTotalMinusRow();addToPtr(0xe0,0xe4,0xe5);
 countRow();J(0x20,'copyBytes');
 restore();addToPtr(0xe2,0xec,0xed);countTotalMinusRow();J(0x20,'copyBytes');b(0x60);
 L('advanceBases');addToPtr(0xe8,0xec,0xed);addToPtr(0xea,0xec,0xed);b(0x60);
 // Copy 8 bytes per loop before branching: faster bitmap memory transfers.
 L('copyBytes');I(0xA5,0xe5);R(0xf0,'tailPart');
 L('nextPage');I(0xA0,0);L('pageOctet');
 for(var u=0;u<8;u++){I(0xB1,0xe0);I(0x91,0xe2);b(0xc8);}
 R(0xd0,'pageOctet');
 I(0xe6,0xe1);I(0xe6,0xe3);I(0xc6,0xe5);R(0xd0,'nextPage');
 L('tailPart');I(0xA0,0);I(0xA5,0xe4);R(0xf0,'copied');
 L('tailByte');I(0xB1,0xe0);I(0x91,0xe2);b(0xc8);
 I(0xc4,0xe4);R(0xd0,'tailByte');
 L('copied');b(0x60);
 // Screen colors are copied with unrolled absolute,X groups.
 function fastColor(label,src){
  L(label);
  for(var page=0;page<4;page++){
   I(0xa2,0);var loop=label+'Page'+page;L(loop);
   for(var j=0;j<8;j++){
    A(0xbd,src+page*256+j);
    A(0x9d,0xd800+page*256+j);
   }
   b(0x8a);b(0x18);I(0x69,8);b(0xaa);
   if(page===3)I(0xe0,232);
   R(0xd0,loop);
  }
  b(0x60);
 }
 fastColor('copyFastColorOne',color1);
 fastColor('copyFastColorTwo',color2);
 var asm=c.done();
 if(0x0810+asm.code.length>=0x1000)throw Error('El ASM sobrepasa el área segura del PRG: '+asm.code.length+' bytes.');
 var load=0x0801,end=mc?0x3710:0x5800,prg=new Uint8Array(2+end-load);
 function at(v){return 2+v-load;}
 prg[0]=1;prg[1]=8;
 prg.set([0x0b,0x08,10,0,0x9e,50,48,54,52,0,0,0],at(0x0801));
 prg.set(asm.code,at(0x0810));
 if(mc){
  prg.set(source.bitmap,at(0x1000));prg.set(source.screen,at(0x2f40));
  prg.set(source.color,at(0x3328));
 }else{
  prg.set(source.tiles,at(0x2000));prg.set(source.fg,at(0x2400));
  prg.set(source.atlas,at(0x5000));
 }
 return {bytes:prg,code:asm.code,labels:asm.labels,mode:source.kind,
  input:'WASD keyboard via CIA1 ($DC00/$DC01) only; repeat while held; no VIC blank on scroll',
  mapType:'40x25 circular hard scroll; bitmap 8 bytes/cell and separate color matrices'};
}
function download(bytes,name){
 if(typeof w.download==='function')return w.download(bytes,name,'application/prg');
 var url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
 var a=doc.createElement('a');a.href=url;a.download=name;doc.body.appendChild(a);a.click();a.remove();
 w.setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function selfTest(){
 var bitmap=new Uint8Array(8000),screen=new Uint8Array(1000),color=new Uint8Array(1000),tiles=new Uint8Array(1000),fg=new Uint8Array(1000);
 for(var i=0;i<1000;i++){tiles[i]=i&255;screen[i]=i%256;color[i]=i&15;fg[i]=(i*3)&15;
  for(var y=0;y<8;y++)bitmap[i*8+y]=(i*17+y*11)&255;}
 var base={kind:'bitmap-mc',tiles,fg,bitmap,screen,color,atlas:new Uint8Array(2048),bg:0};
 var checks=[],passed=true;
 for(var [x,y] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]){
  var round=mapMove(mapMove(base,x,y),-x,-y),ok=true;
  for(var key of ['bitmap','screen','color','tiles','fg'])ok=ok&&equal(round[key],base[key]);
  checks.push({dx:x,dy:y,pass:ok});if(!ok)passed=false;
 }
 return {pass:passed,cases:checks,bufferBytes:{bitmap:8000,screen:1000,color:1000},
  control:'W A S D only'};
}
function setStatus(message){
 var label=doc.getElementById('rico304status');
 if(label)label.textContent=message;
}
function moveArtwork(direction){
 // BGFONT circular hard-scroll. Move real document cells (not an offscreen preview).
 // Preserve cell objects and all per-cell fields including rotations, fg/bg colors,
 // plus Bitmap Multicolor ricoBmpColors packed C1,C2,C3 data.
 var ed=w.g_app&&w.g_app.textModeEditor,
     layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject();
 if(!layer||!layer.frames||!Number.isInteger(layer.currentFrame))
  throw Error('Primero seleccioná una pantalla y un frame.');
 var frame=layer.frames[layer.currentFrame],grid=frame&&frame.data;
 if(!grid||!Array.isArray(grid)||!grid.length)throw Error('No hay un mapa activo.');
 var ww=layer.getGridWidth(),hh=layer.getGridHeight();
 if(!ww||!hh||ww>4096||hh>4096)throw Error('Dimensiones del mapa no válidas.');
 if(!['left','right','up','down'].includes(direction))
  throw Error('Dirección inválida: '+direction);
 var sx=direction==='left'?1:direction==='right'?-1:0,
     sy=direction==='up'?1:direction==='down'?-1:0;
 var old=grid.map(function(row){return row.slice();}),oldColors=null,newColors=null,
     bm=layer.doc&&layer.doc.ricoBitmapV1Enabled&&layer.getScreenMode()==='c64multicolor';
 if(bm){
  if(w.RICO_TEST279_BITMAP&&typeof w.RICO_TEST279_BITMAP.seed==='function')
   w.RICO_TEST279_BITMAP.seed(frame,layer);
  if(Array.isArray(frame.ricoBmpColors)){
   oldColors=frame.ricoBmpColors.slice();
   newColors=frame.ricoBmpColors.slice();
  }
 }
 for(var y=0;y<hh;y++){
  if(!grid[y]||!old[y])throw Error('Fila '+y+' no disponible');
  for(var x=0;x<ww;x++){
   var fromY=mod(y+sy,hh),fromX=mod(x+sx,ww);
   grid[y][x]=old[fromY][fromX];
   if(newColors)newColors[y*ww+x]=oldColors[fromY*ww+fromX];
  }
 }
 if(newColors)frame.ricoBmpColors=newColors;
 if(ed.modified)ed.modified();
 if(ed.graphic){
  if(ed.graphic.invalidateAllCells)ed.graphic.invalidateAllCells();
  if(ed.graphic.redraw)ed.graphic.redraw({allCells:true});
 }
 if(ed.layers&&ed.layers.updateAllLayerPreviews)ed.layers.updateAllLayerPreviews();
 st.steps++;
 setStatus('Movimientos: '+st.steps+' · último: '+direction.toUpperCase());
 return {direction,width:ww,height:hh,colorsMoved:!!newColors,steps:st.steps};
}
function stopHolding(){
 if(st.holdDelayTimer!==null){w.clearTimeout(st.holdDelayTimer);st.holdDelayTimer=null;}
 if(st.holdTimer!==null){w.clearInterval(st.holdTimer);st.holdTimer=null;}
 st.holdButton=null;
}
function manualStep(button){
 if(!st.dialogOpen)return;
 try{moveArtwork(button.getAttribute('data-scroll'));}
 catch(err){stopHolding();setStatus('ERROR: '+err.message);if(w.console)w.console.warn('TEST306',err);}
}
// TEST312 speed affects ONLY camera cadence (not SID play frequency).
var SPEEDS={1:{label:'Máxima · sin pausa',mouse:70},2:{label:'Rápida · +8 cuadros',mouse:105},
 4:{label:'Media · +16 cuadros',mouse:160},8:{label:'Lenta · +32 cuadros',mouse:275},
 12:{label:'Muy lenta · +64 cuadros',mouse:420}};
function setScrollSpeed(value){
 var n=Number(value);
 if(!Object.prototype.hasOwnProperty.call(SPEEDS,n))throw Error('Velocidad de scroll no válida: '+value);
 st.scrollSpeed=n;
 var select=doc.getElementById('rico304speed');
 if(select&&Number(select.value)!==n)select.value=String(n);
 return st.scrollSpeed;
}
function startHolding(button){
 if(!st.dialogOpen)return;
 stopHolding();st.holdButton=button;manualStep(button);
 if(st.holdButton!==button)return;
 st.holdDelayTimer=w.setTimeout(function(){
  st.holdDelayTimer=null;
  if(st.dialogOpen&&st.holdButton===button){
   st.holdTimer=w.setInterval(function(){
    if(!st.dialogOpen||st.holdButton!==button){stopHolding();return;}
    manualStep(button);
   },SPEEDS[st.scrollSpeed].mouse);
  }
 },140);
}
function closeManual(){
  stopHolding();
  // Real non-modal DOM window: do not enter the UI dialog stack.
  st.dialogOpen=false;
  st.keyboard=false;
  if(st.dialog&&st.dialog.parentNode)st.dialog.parentNode.removeChild(st.dialog);
  st.dialog=null;
 }
 function open(){
  // Native UI.Dialog.show() creates a blocking gray backdrop even WITHOUT
  // UI.showDialog(). Use a plain independent floating window instead.
  if(st.dialogOpen&&st.dialog&&st.dialog.parentNode)return;
  closeManual();
  if(!doc.body||!doc.createElement)throw Error('El editor todavía no está preparado.');
  var dlg=doc.createElement('div');
  dlg.id='rico304Dialog';
  dlg.setAttribute('role','dialog');
  dlg.setAttribute('aria-label','Rico\'s Manual Scroll');
  dlg.style.cssText='position:fixed;z-index:2200;top:64px;right:28px;width:280px;box-sizing:border-box;'+
   'background:#292b30;border:1px solid #62666d;border-radius:5px;color:#f4f4f4;font:12px/1.4 sans-serif;'+
   'box-shadow:0 4px 20px rgba(0,0,0,.35);pointer-events:auto;';
  dlg.innerHTML='<div id="rico304Handle" style="padding:7px 10px;display:flex;justify-content:space-between;'+
   'align-items:center;background:#373a40;cursor:move;user-select:none"><b>Rico\'s Manual Scroll</b>'+
   '<button type="button" id="rico304Close" aria-label="Cerrar" style="background:transparent;border:0;color:#fff;'+
   'font-size:18px;cursor:pointer">×</button></div>'+
   '<div style="padding:10px;text-align:center">'+
   '<div style="display:grid;grid-template-columns:repeat(3,50px);gap:5px;justify-content:center;margin:3px 0 13px">'+
   '<span></span><button type="button" class="rico304arrow" data-scroll="up">▲</button><span></span>'+
   '<button type="button" class="rico304arrow" data-scroll="left">◀</button><span>●</span>'+
   '<button type="button" class="rico304arrow" data-scroll="right">▶</button>'+
   '<span></span><button type="button" class="rico304arrow" data-scroll="down">▼</button><span></span></div>'+
   '<label style="display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer">'+
   '<input type="checkbox" id="rico304wasd"> Export with WASD Scroll Control</label>'+
   '<label style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:12px">'+
   '<span>Velocidad</span><select title="Cuadros de pausa adicionales en el PRG; el SID conserva su tempo" id="rico304speed" style="background:#3b3e45;color:#fff;'+
   'border:1px solid #666;padding:4px;border-radius:3px;min-width:145px">'+
   '<option value="1">Máxima · sin pausa</option><option value="2">Rápida · +8 cuadros</option>'+
   '<option value="4">Media · +16 cuadros</option><option value="8">Lenta · +32 cuadros</option>'+
   '<option value="12">Muy lenta · +64 cuadros</option></select></label>'+
   '<label style="display:flex;justify-content:center;align-items:center;gap:7px;margin-top:10px">'+
   '<span>Motor PRG</span><select id="rico304engine319" style="background:#3b3e45;color:#fff;'+
   'border:1px solid #666;padding:4px;border-radius:3px;max-width:190px">'+
   '<option value="native">VIC-II original · TEST323 (HiRes / Char MC)</option>'+
   '<option value="character">Avance 8 px · TEST318</option></select></label>'+
   '<div style="font-size:10px;opacity:.70;margin-top:5px">Motor nativo: Screen 40×25 W/A/S/D · Screen alto W/S · frame 1</div>'+
    '<label style="display:flex;align-items:flex-start;text-align:left;gap:7px;margin-top:8px;font-size:11px">'+
    '<input type="checkbox" id="rico304charProjection323" style="margin-top:2px">'+
    '<span>Interpretar Bitmap como Multicolor Character (solo PRG)</span></label>'+
    '<div style="font-size:10px;opacity:.80;text-align:left;margin-top:2px">No modifica tu arte. Conserva caracteres, NO los tres colores locales Bitmap.</div>'+
   '<div id="rico304status" style="font-size:11px;margin-top:9px;opacity:.8">Editor: solo flechas · 1 celda por clic</div></div>';
  doc.body.appendChild(dlg);
  st.dialog=dlg;st.dialogOpen=true;st.keyboard=false;
  var close=doc.getElementById('rico304Close');
  close.onclick=function(e){e.preventDefault();e.stopPropagation();closeManual();};
  var check=doc.getElementById('rico304wasd');
  check.checked=st.exportWithWASD;
  check.onchange=function(){setExportWASD(check.checked);};
  var speed=doc.getElementById('rico304speed');
  if(speed){speed.value=String(st.scrollSpeed);speed.onchange=function(){setScrollSpeed(speed.value);};}
  var engine319=doc.getElementById('rico304engine319');
  if(engine319){engine319.value=st.scrollEngine319;engine319.onchange=function(){st.scrollEngine319=engine319.value;};}
  var projection323=doc.getElementById('rico304charProjection323');
  if(projection323){projection323.checked=st.charProjection323;
   projection323.onchange=function(){st.charProjection323=!!projection323.checked;};}
  var buttons=dlg.querySelectorAll('.rico304arrow');
  for(var i=0;i<buttons.length;i++){
   var btn=buttons[i];
   btn.style.cssText='width:50px;height:34px;cursor:pointer;touch-action:none;'+
    'background:#454950;border:1px solid #62666d;border-radius:3px;color:white;font-size:16px;';
   btn.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.preventDefault)e.preventDefault();
    if(e.stopPropagation)e.stopPropagation();
    if(this.setPointerCapture)this.setPointerCapture(e.pointerId);
    startHolding(this);
   });
   btn.addEventListener('pointerup',stopHolding);
   btn.addEventListener('pointercancel',stopHolding);
   btn.addEventListener('lostpointercapture',stopHolding);
  }
  if(!w.__rico306HoldStopInstalled){
   w.addEventListener('blur',stopHolding);
   doc.addEventListener('visibilitychange',function(){if(doc.hidden)stopHolding();});
   w.__rico306HoldStopInstalled=true;
  }
  // Drag by title, leaving the editor fully interactive everywhere else.
  var handle=doc.getElementById('rico304Handle'),drag=null;
  handle.onpointerdown=function(e){
   if(e.target===close)return;
   var r=dlg.getBoundingClientRect();
   drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};
   if(handle.setPointerCapture)handle.setPointerCapture(e.pointerId);
  };
  handle.onpointermove=function(e){
   if(!drag)return;
   dlg.style.right='auto';
   dlg.style.left=Math.max(0,drag.left+e.clientX-drag.x)+'px';
   dlg.style.top=Math.max(0,drag.top+e.clientY-drag.y)+'px';
  };
  handle.onpointerup=handle.onpointercancel=function(){drag=null;};
  setStatus('Editor: solo flechas · movimiento circular');
 }
 // SCREEN and Interfaz menu integration follows.

 function toggleManual(){
 // SCREEN and Interfaz share ONE panel instance: the menu items toggle its visibility.
 if(st.dialogOpen&&st.dialog&&st.dialog.parentNode)closeManual();
 else open();
}
function installPanelMenus(){
 // Wrap the native menu bar before the editor creates its menus.
 // Keep the legacy SCREEN entry for compatibility and introduce Interfaz.
 if(typeof UI!=='function'||typeof UI.create!=='function'||UI.__rico305ManualPanelMenu)return;
 var originalCreate=UI.create;
 UI.create=function(type,args){
  var comp=originalCreate.apply(this,arguments);
  if(type==='UI.MenuBar'&&comp&&typeof comp.addMenu==='function'){
   var nativeAddMenu=comp.addMenu;
   var interfaceFound=false,interfaceAdded=false,scheduled=false;
   function addInterfaceEntry(menu){
    if(!menu||typeof menu.addItem!=='function'||interfaceAdded)return;
    menu.addItem({label:'Rico\'s Manual Scroll...',id:'interface-rico-manual-scroll'});
    interfaceAdded=true;
   }
   comp.addMenu=function(config){
    var menu=nativeAddMenu.apply(this,arguments);
    if(config&&config.label==='Screen'&&menu&&typeof menu.addItem==='function'){
     var nativeAddItem=menu.addItem,screenAdded=false;
     menu.addItem=function(item){
      var result=nativeAddItem.apply(this,arguments);
      if(item&&item.id==='screen-crop'&&!screenAdded){
       screenAdded=true;
       nativeAddItem.call(this,{label:'Rico\'s Manual Scroll...',id:'screen-rico-manual-scroll'});
      }
      return result;
     };
    }
    if(config&&/^(Interfaz|Interface)$/i.test(String(config.label||''))){
     interfaceFound=true;
     addInterfaceEntry(menu);
    }
    // Wait until the native menus are constructed. Reuse a native Interfaz
    // menu if present; otherwise create exactly ONE program menu of that name.
    if(!scheduled){
     scheduled=true;
     w.setTimeout(function(){
      if(!interfaceFound&&!interfaceAdded){
       var extra=nativeAddMenu.call(comp,{label:'Interfaz'});
       addInterfaceEntry(extra);
      }
     },0);
    }
    return menu;
   };
  }
  return comp;
 };
 UI.__rico305ManualPanelMenu=true;
}
function setExportWASD(enabled){
 st.exportWithWASD=!!enabled;
 var manual=doc.getElementById('rico304wasd'),exportBox=doc.getElementById('rico304exportWasd');
 if(manual)manual.checked=st.exportWithWASD;
 if(exportBox)exportBox.checked=st.exportWithWASD;
 return st.exportWithWASD;
}
function sidRequested(toPrg){
 var selected=doc.getElementById('exportPRGMusic');
 // Native LVLLVL can select a default music entry without any SID upload.
 // Only treat 'sid' as a request if actual binary data was provided.
 var data=toPrg&&toPrg.sidData;
 var loaded=!!(data&&((typeof data.byteLength==='number'&&data.byteLength>0)||
  (typeof data.length==='number'&&data.length>0)||
  (data.data&&typeof data.data.length==='number'&&data.data.length>0)));
 var nativeSid=!!(selected&&selected.value==='sid'&&loaded);
 // TEST229 is the original dedicated SID player in the Advanced Export UI.
 var api=w.RICO_TEST207_ORIGINAL_SID,state=null;
 try{state=api&&typeof api.getState==='function'?api.getState():null;}catch(ignore){}
 return {requested:nativeSid||!!(state&&state.enabled),
  nativeSid:nativeSid,advancedSid:!!(state&&state.enabled)};
}
function sidAdvancedInstance(editor,forExport){
 if(!editor)return null;
 var existing=editor.toPrgAdv||editor.toPRGAdv||editor.prgAdv;
 if(existing)return existing;
 // On some LVLLVL builds Advanced Export is a menu-only utility and is not
 // kept as textModeEditor.toPrgAdv. Reuse the already-installed prototype
 // and its original SID wrapper instead of silently falling back to no music.
 if(forExport&&typeof ToPRGAdv!=='undefined'&&ToPRGAdv.prototype&&
    typeof ToPRGAdv.prototype.createPRG==='function'){
  var adapter=Object.create(ToPRGAdv.prototype);
  adapter.editor=editor;
  return adapter;
 }
 return null;
}
// TEST313: respect LVLLVL's existing autonomous Map Scroll metadata.
function traditionalMapConfig(ed){
 if(!ed||!ed.graphic)return null;
 var frames=ed.graphic.frames||[],service=w.RICO_TEST57_MAP_SCROLL||w.RICO_TEST56_MAP_SCROLL||w.RICO_TEST37_MAP_SCROLL;
 for(var i=0;i<frames.length;i++){
  var f=frames[i]||{},cfg=f.ricoMapScrollV1||null;
  try{if(service&&typeof service.getConfig==='function')cfg=service.getConfig(ed.graphic,i)||cfg;}catch(ignore){}
  if(cfg&&typeof cfg.type==='string'&&cfg.type.trim()){
   return {frame:i,type:cfg.type,ticksPerStep:Math.max(1,Number(cfg.ticksPerStep)||1),
    pixelsPerStep:Math.max(1,Number(cfg.pixelsPerStep)||1)};
  }
 }
 return null;
}
function traditionalPRG(ed,normal,sid,filename){
 var cfg=traditionalMapConfig(ed),layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject(),
  bitmap=!!(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled&&layer.getScreenMode()==='c64multicolor');
 if(bitmap){
  // TEST313: The character-mode ToPRGAdv cannot be used for Bitmap MC.
  // TEST290/TEST299 may create a STILL picture when no Group Animate runs.
  // Use the true bitmap full-map renderer with autonomous cardinal camera.
  if(!/^(up|down|left|right)$/.test(cfg.type))
   throw Error('Bitmap Multicolor: Map Scroll '+cfg.type+' aún no recuperado. No se exportará una imagen fija.');
  var captured=capture(),bitmapBuilder=null,parsed=null;
  if(sid&&sid.requested){
   var api=w.RICO_TEST207_ORIGINAL_SID,raw=(sid.nativeSid&&normal&&normal.sidData)||null;
   if(!raw&&api&&typeof api.getRawSID==='function')raw=api.getRawSID();
   if(!api||typeof api.parseSID!=='function'||!raw)
    throw Error('Requiere el SID original PSID cargado, no solo los datos decodificados.');
   try{parsed=api.parseSID(raw);}catch(sidError){
    if(st.rawSid311)parsed=api.parseSID(st.rawSid311);
    else throw sidError;
   }
   bitmapBuilder=w.RICO_TEST311_HYBRID;
  }else bitmapBuilder=w.RICO_TEST307_FULLMAP;
  if(!bitmapBuilder||typeof bitmapBuilder.makePRG!=='function')
   throw Error('Falta el renderer Bitmap MC de TEST311/TEST307; recargá la WEB.');
  var result=parsed?bitmapBuilder.makePRG(captured.source,parsed,1,cfg):
   bitmapBuilder.makePRG(captured.source,1,cfg);
  var name=(filename||'rico-map-scroll.prg').replace(/[.]prg$/i,'')+'_BITMAP_AUTO.prg';
  download(result.bytes,name);
  st.lastExport={engine:'TEST313 Bitmap MC AUTO MAP 8px',configuration:cfg,
   sid:!!parsed,actualStepPixels:8,filename:name,bytes:result.bytes.length};
  w.RICO_TEST313_LAST_EXPORT=st.lastExport;
  return result;
 }
 var adv=sidAdvancedInstance(ed,true);
 if(!adv||typeof adv.createPRG!=='function')
  throw Error('No se encontró ToPRGAdv para restaurar Map Scroll.');
 var args={download:true,filename:filename||'rico-map-scroll.prg'};
 if(sid&&sid.nativeSid){args.music='sid';args.sidData=normal&&normal.sidData;}
 st.lastExport={engine:'TEST313 ORIGINAL ToPRGAdv MAP SCROLL',configuration:cfg,
  sid:!!(sid&&sid.requested),manualWASD:false};
 var result=adv.createPRG(args);
 if(result===false||result==null)
  throw Error('El motor Map Scroll no pudo exportar; no se generará una imagen fija como sustituto.');
 return result;
}
function installExportCheckbox(){
 if(typeof ToPRG==='undefined'||!ToPRG.prototype||ToPRG.prototype.__rico304ExportOption)return;
 var oldInitEvents=ToPRG.prototype.initEvents;
 var oldInitContent=ToPRG.prototype.initContent;
 function ensureCheckbox(){
  var existing=doc.getElementById('rico304exportWasd');
  if(existing){existing.checked=st.exportWithWASD;return existing;}
  var parent=doc.getElementById('toPrgDialog');
  if(!parent||!doc.createElement)return null;
  var group=doc.createElement('div');group.id='rico304wasdExportGroup';
  group.className='formGroup';
  group.style.cssText='padding:7px 12px;margin:5px 0;border-top:1px solid #555';
  var label=doc.createElement('label');
  label.style.cssText='display:flex;gap:9px;align-items:center;cursor:pointer';
  var box=doc.createElement('input');box.type='checkbox';box.id='rico304exportWasd';
  box.checked=st.exportWithWASD;
  box.addEventListener('change',function(){setExportWASD(box.checked);});
  label.appendChild(box);
  label.appendChild(doc.createTextNode('Export with WASD Scroll Control'));
  group.appendChild(label);
  var content=parent.querySelector&&parent.querySelector('.dialogContent');
  (content||parent).appendChild(group);
  // Record the original PSID before LVLLVL optionally transforms it into
  // body bytes for its native player.
  var fileInput=doc.getElementById('exportPRGSIDFile');
  if(fileInput&&!fileInput.__rico311SidCapture){
   fileInput.__rico311SidCapture=true;
   fileInput.addEventListener('change',function(){
    st.rawSid311=null;
    var file=fileInput.files&&fileInput.files[0];
    if(!file||typeof FileReader==='undefined')return;
    var reader=new FileReader();
    reader.onload=function(){
     if(reader.result instanceof ArrayBuffer)st.rawSid311=new Uint8Array(reader.result);
    };
    reader.readAsArrayBuffer(file);
   });
  }
  return box;
 }
 ToPRG.prototype.initEvents=function(){
  var r=oldInitEvents.apply(this,arguments);
  ensureCheckbox();return r;
 };
 ToPRG.prototype.initContent=function(){
  var r=oldInitContent.apply(this,arguments);
  ensureCheckbox();return r;
 };
 var oldExport=ToPRG.prototype.exportPrg;
 ToPRG.prototype.exportPrg=function(){
  var ed=this.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject(),
      bitmap=!!(layer&&layer.doc&&layer.doc.ricoBitmapV1Enabled&&layer.getScreenMode()==='c64multicolor');
  // Existing SID playback is never subordinate to experimental scroll export.
  // Explicit SID choices must not be swallowed by WASD or TEST299.
  var sid=sidRequested(this),autoMap=traditionalMapConfig(ed);
  // A configured autonomous Map Scroll must use the original fast
  // ToPRGAdv renderers, not the BASIC static exporter or TEST299.
  if(autoMap&&!st.exportWithWASD){
   try{
    var inputAuto=doc.getElementById('exportPRGAs'),
     nameAuto=(inputAuto&&inputAuto.value&&inputAuto.value.trim()||'rico-map-scroll').replace(/[.]prg$/i,'')+'.prg';
    return traditionalPRG(ed,this,sid,nameAuto);
   }catch(errAuto){
    st.lastExport={engine:'TEST313 MAP SCROLL ERROR',configuration:autoMap,error:errAuto.message};
    if(typeof w.alert==='function')w.alert('Map Scroll tradicional: '+errAuto.message);
    return false;
   }
  }
  if(sid.requested){
   if(st.exportWithWASD&&st.scrollEngine319==='native'){
    var msg323='El motor VIC-II original con WASD todavía no reproduce SID. '+
     'Seleccioná No Music para probar su velocidad. '+
     'Si querés SID con WASD, elegí el motor Avance 8 px.';
    if(typeof w.alert==='function')w.alert('Rico\'s Manual Scroll: '+msg323);
    st.lastExport={engine:'TEST323 SID UNSUPPORTED',error:msg323};return false;
   }
   if(st.exportWithWASD){
    // TEST311: SID + held WASD is one PRG, not two incompatible exporters.
    // Never silently clear the user's checkbox or strip the soundtrack.
    try{
     var sidAPI=w.RICO_TEST207_ORIGINAL_SID;
     var raw=sid.nativeSid?this.sidData:null;
     if(raw&&raw.data&&!(raw instanceof Uint8Array)&&!(raw instanceof ArrayBuffer))raw=raw.data;
     if(!raw&&sidAPI&&typeof sidAPI.getRawSID==='function')raw=sidAPI.getRawSID();
     if(!sidAPI||typeof sidAPI.parseSID!=='function'||!raw)
      throw Error('No se encontraron los bytes PSID cargados. Elegí el archivo SID nuevamente.');
     var sidData;
     try{sidData=sidAPI.parseSID(raw);}
     catch(parseNativeError){
      if(st.rawSid311)sidData=sidAPI.parseSID(st.rawSid311);
      else throw parseNativeError;
     }
     var exporter=w.RICO_TEST311_HYBRID;
     if(!exporter||typeof exporter.makePRG!=='function')
      throw Error('Falta cargar el motor híbrido TEST311. Recargá la página.');
     var typeHybrid=doc.getElementById('exportPRGType');
     if(typeHybrid&&typeHybrid.value==='d64')
      throw Error('El motor híbrido entrega PRG. Elegí PRG para combinar SID con WASD.');
     var snapshotHybrid=capture(),builtHybrid=exporter.makePRG(snapshotHybrid.source,sidData,st.scrollSpeed);
     var nameInput=doc.getElementById('exportPRGAs'),
      hybridName=(nameInput&&nameInput.value&&nameInput.value.trim()||'RICO').replace(/[.]prg$/i,'')+'_SID_WASD.prg';
     download(builtHybrid.bytes,hybridName);
     st.lastExport={engine:'TEST311 FULL MAP + DIAGONAL WASD + SID',
      bytes:builtHybrid.bytes.length,filename:hybridName,sid:builtHybrid.sid,
      checkboxPreserved:st.exportWithWASD};
     w.RICO_TEST311_LAST_EXPORT=st.lastExport;
     return builtHybrid;
    }catch(e){
     if(typeof w.alert==='function')w.alert('TEST311 SID + WASD: '+e.message);
     st.lastExport={engine:'TEST311 ERROR',error:e.message,checkboxPreserved:st.exportWithWASD};
     return false;
    }
   }
   st.lastExport={engine:'NATIVE SID',sidPreserved:true,bypassWASD:true,bypassTEST299:true};
   if(sid.advancedSid){
    var adv=sidAdvancedInstance(ed,true);
    if(adv&&typeof adv.createPRG==='function'){
     var filenameInput=doc.getElementById('exportPRGAs');
     var sidName=filenameInput&&filenameInput.value&&filenameInput.value.trim()||'rico-sid.prg';
     if(!/\\.prg$/i.test(sidName))sidName+='.prg';
     return adv.createPRG({download:true,filename:sidName});
    }
   }
   return oldExport.apply(this,arguments);
  }
  if(st.exportWithWASD){
   // No SID selected: manual WASD PRG is independent from the musical player.
   var type=doc.getElementById('exportPRGType');
   if(type&&type.value==='d64'){
    // Instead of blocking D64, preserve the user's original disk-export path.
    setExportWASD(false);
    st.lastExport={engine:'NATIVE D64',bypassWASD:true};
    return oldExport.apply(this,arguments);
   }
   try{
    if(st.scrollEngine319==='native'){
     // TEST319 bypasses the rebuilt 8px character blitter and invokes
     // the ACTUAL original ToPRGAdv TEST77 VIC-II fine-scroller.
     // Its wide map / diagonal / SID variants are not validated.
     if(!ed||!ed.graphic||!ed.layers)throw Error('Falta el editor activo.');
     var gridW=ed.graphic.getGridWidth?ed.graphic.getGridWidth():0,
      gridH=ed.graphic.getGridHeight?ed.graphic.getGridHeight():0,
      frameCount=ed.graphic.getFrameCount?ed.graphic.getFrameCount():(ed.graphic.frames||[]).length,
      layer319=ed.layers.getSelectedLayerObject();
     // TEST322: use actual Screen dimensions, not hardcoded 40x50.
     gridW=Number(gridW)||0;gridH=Number(gridH)||0;
     if(gridW<40||gridH<25||gridH>255||frameCount<1)
      throw Error('TEST322: Screen detectado '+gridW+'×'+gridH+
       ', frames='+frameCount+'. Motor VIC-II: mínimo 40 columnas y 25 filas, altura máxima 255. Rico\'s Window es independiente.');
     if(gridH===25&&gridW!==40)
      throw Error('TEST322: Screen '+gridW+'×25. El motor de cuatro direcciones requiere 40×25; el vertical admite alturas mayores.');
     if(frameCount>1){
      var from322=doc.getElementById('exportFrameFrom'),
          to322=doc.getElementById('exportFrameTo');
      if((from322&&Number(from322.value)!==1)||
         (to322&&Number(to322.value)!==1))
       throw Error('TEST322: con '+frameCount+' frames, seleccioná Export Frames 1 To 1.');
     }
     if(!layer319||!layer319.getType||layer319.getType()!=='grid')
      throw Error('TEST323: seleccioná una capa Grid de caracteres.');
     var mode319=layer319.getScreenMode&&layer319.getScreenMode(),
      bitmapActive323=!!(layer319.doc&&layer319.doc.ricoBitmapV1Enabled&&
       mode319==='c64multicolor'),
      isCharMC320=mode319==='c64multicolor';
     // The Bitmap editor TEST279 uses 'c64multicolor' internally;
     // the export dialog's "Multicolour Character" radio is not proof.
     // For the explicit opt-in, generate a char interpretation directly
     // from its native tile IDs and FC fields, NEVER mutate project data.
     if(bitmapActive323&&!st.charProjection323)
      throw Error('TEST323 detectó Bitmap Multicolor experimental ACTIVO en la capa. '+
       'La ventana Export muestra Multicolour Character porque ambos comparten el modo interno. '+
       'Para probar el VIC-II rápido, activá la casilla "Interpretar Bitmap como Multicolor Character" '+
       'en Rico\'s Manual Scroll. No modifica el proyecto, pero cambia los colores '+
       'respecto a Bitmap. Para conservar los tres colores locales, usá Avance 8 px.');
     if(mode319!=='c64multicolor'&&mode319!=='textmode'&&mode319!=='c64standard')
      throw Error('TEST323: modo de capa no compatible: '+mode319);
     // Native TEST77 uses a character matrix. Mixed per-cell MC needs
     // the existing TEST264 VIC bit4 + shared $D022/$D023 patch.
     // Bitmap MC must NEVER be sent through character-mode TEST77.
     if(isCharMC320&&(!w.RICO_TEST264_MULTICOLOR||
          typeof w.RICO_TEST264_MULTICOLOR.patch!=='function'))
      throw Error('TEST320 Multicolor Character: falta el módulo VIC-II Multicolor TEST264. Recargá la WEB.');
     var advanced319=sidAdvancedInstance(ed,true);
     if(!advanced319||typeof advanced319.createPRG!=='function')
      throw Error('No se encontró el motor ToPRGAdv original.');
     var input319=doc.getElementById('exportPRGAs'),
      name319=(input319&&input319.value&&input319.value.trim()||'RICO').replace(/[.]prg$/i,'')+'_VIC_WASD_TEST319.prg';
     var large321=gridH>25;
     // The source may have more frames, but this native WASD experiment
     // intentionally exports the first frame only (1 To 1), no mutation.
     if(large321&&(!w.RICO_TEST168_PRG_LARGE_MAP||!w.RICO_TEST168_PRG_LARGE_MAP.wasd321))
      throw Error('TEST322: no cargó el motor vertical para '+gridW+'×'+gridH+'. Ctrl+F5 para actualizar.');
     var generated319=advanced319.createPRG(large321?
      {download:true,filename:name319.replace('TEST319','TEST323'),
       ricoWASD321:true,ricoWASD321Speed:st.scrollSpeed,gridWidth:gridW,gridHeight:gridH}:
      {download:true,filename:name319,ricoWASD319:true,
       ricoWASD319Speed:st.scrollSpeed,gridWidth:40,gridHeight:25}
     );
     if(generated319===false||!generated319||!generated319.length)
      throw Error('El ensamblador del motor VIC-II no produjo PRG válido. Para 40×50 se utiliza el motor vertical TEST168.');
     st.lastExport={engine:large321?'TEST323 ORIGINAL VIC-II LARGE MAP VERTICAL WASD':isCharMC320?'TEST320 VIC-II MULTICOLOR CHARACTER + WASD':'TEST319 ORIGINAL VIC-II FINE SCROLL + WASD',
      speed:st.scrollSpeed,bytes:generated319.length,
      filename:large321?name319.replace('TEST319','TEST323'):name319,
      mode:isCharMC320?'Multicolor Character':'HiRes Character',
      sid:false,diagonal:false,map:gridW+'×'+gridH,
      directions:large321?'W/S solamente':'W/S/A/D',
      characterProjection:bitmapActive323&&st.charProjection323,
      bitmapOriginalPreserved:bitmapActive323};
     w.RICO_TEST319_LAST_EXPORT=st.lastExport;
     return generated319;
    }
    var snapshot=capture(),built=makePRG(snapshot.source,st.scrollSpeed);
    var input=doc.getElementById('exportPRGAs'),name=input&&input.value&&input.value.trim()||'RICO';
    name=name.replace(/\.prg$/i,'')+'_WASD.prg';
    download(built.bytes,name);
    st.lastExport={engine:built.fullMap?'TEST307 FULL MAP + DIAGONAL WASD':'TEST306 LEGACY WASD',bytes:built.bytes.length,filename:name};
    return built;
   }catch(e){
    if(typeof w.alert==='function')w.alert('Rico\'s Manual Scroll: '+e.message);
    st.lastExport={engine:'TEST304 ERROR',error:e.message};
    return false;
   }
  }
  if(bitmap&&w.RICO_TEST299_BITMAP&&typeof w.RICO_TEST299_BITMAP.exportPRG==='function'){
    var result=w.RICO_TEST299_BITMAP.exportPRG({download:true});
    if(result!==null){
     st.lastExport={engine:'TEST299 Bitmap Multicolor normal'};
     return result;
    }
  }
  st.lastExport={engine:'LVLLVL normal'};
  return oldExport.apply(this,arguments);
 };
 ToPRG.prototype.__rico304ExportOption=true;
}
function installMenuAction(){
 if(typeof Editor==='undefined'||!Editor.prototype||Editor.prototype.__rico304ManualScrollAction)return;
 var oldMenuClick=Editor.prototype.menuClick;
 Editor.prototype.menuClick=function(id){
  if(id==='screen-rico-manual-scroll'||id==='interface-rico-manual-scroll'){toggleManual();return;}
  if(id==='export-prg'&&this.textModeEditor&&this.textModeEditor.toPrg){
   var sid=sidRequested(this.textModeEditor.toPrg);
   var adv=sid.advancedSid&&!st.exportWithWASD&&sidAdvancedInstance(this.textModeEditor);
   if(adv&&typeof adv.start==='function')return adv.start();
   // Keep the standard Export PRG dialog only when the dedicated advanced
   // SID path is not selected. No bitmap fast-path may preempt its choice.
   installExportCheckbox();
   return this.textModeEditor.toPrg.start();
  }
  return oldMenuClick.apply(this,arguments);
 };
 Editor.prototype.__rico304ManualScrollAction=true;
}
installPanelMenus();
installExportCheckbox();
installMenuAction();
w.RICO_TEST304={version:'TEST323',name:'Rico\'s Manual Scroll',entry:'Interfaz > Rico\'s Manual Scroll... (also Screen menu)',capture,mapMove,groupMove,makePRG,selfTest,moveArtwork,setExportWASD,setScrollSpeed,traditionalMapConfig,closeManual,getState:()=>st,open,toggleManual};
})(window,document);