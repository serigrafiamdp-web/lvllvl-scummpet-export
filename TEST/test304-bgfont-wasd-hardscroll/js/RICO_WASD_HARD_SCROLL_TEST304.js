/* TEST304 — BGFONT-inspired whole-character scrolling, WASD ONLY.
   Standalone lab + experimental export PRG. Does not patch normal Export PRG.
   A left, D right, W up, S down. No joystick, no arrow keys.
   Map shifts bitmap+screen+color together; Group shifts glyph patterns but
   holds physical palette coordinates stationary. Exact lossless data.
*/
(function(w,doc){
'use strict';
var PRE='rico304',W=40,H=25,SZ=1000;
var colors=['#000000','#ffffff','#813338','#75cec8','#8e3c97','#56ac4d','#2e2c9b','#edf171','#8e5029','#553800','#c46c71','#4a4a4a','#7b7b7b','#a9ff9f','#706deb','#b2b2b2'];
var st={source:null,current:null,model:null,kind:'map',dx:0,dy:0,steps:0,keyboard:false,dialogOpen:false,dialog:null,report:null};
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
 if(src.kind==='char-mc')throw Error('Esta primera prueba PRG cubre Char HiRes y Bitmap MC. No convierte Char Multicolor.');
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
function makePRG(source){
 // Two independent bitmaps, two independent screen matrices, two COLOR-RAM
 // shadow buffers. Only one manual step per key press (key release needed).
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
 L('handle');I(0xA5,0xf2);R(0xd0,'pressed');
 I(0xA9,0);I(0x85,0xf0);J(0x4c,'poll');
 L('pressed');I(0xc5,0xf0);R(0xd0,'newPress');J(0x4c,'poll');
 L('newPress');I(0x85,0xf0);
 // Render the offscreen screen, color shadow, bitmap if MC. No background IRQ.
 plane(['scr',screen1,screen2,40,1]);
 plane(['col',color1,color2,40,1]);
 if(mc)plane(['bmp',bmp1,bmp2,320,8]);
 // Before color RAM copy, disable display, then swap data/video bank.
 I(0xA9,0x0b);A(0x8d,0xd011);
 I(0xA5,0xf1);R(0xf0,'showTwoColor');
 transfer(color1,0xd800,1000);J(0x4c,'colorReady');
 L('showTwoColor');transfer(color2,0xd800,1000);
 L('colorReady');
 I(0xA5,0xf1);R(0xf0,'showTwo');
 if(mc){A(0xad,0xdd00);I(0x29,252);I(0x09,2);A(0x8d,0xdd00);}
 I(0xA9,mc?0x78:0x14);A(0x8d,0xd018);I(0xA9,0);I(0x85,0xf1);J(0x4c,'display');
 L('showTwo');
 if(mc){A(0xad,0xdd00);I(0x29,252);A(0x8d,0xdd00);}
 I(0xA9,mc?0x18:0x24);A(0x8d,0xd018);I(0xA9,1);I(0x85,0xf1);
 L('display');I(0xA9,mc?0x3b:0x1b);A(0x8d,0xd011);
 J(0x4c,'poll');
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
 // Copy E5 pages and E4 remaining. Updates source+dest pointer high bytes.
 L('copyBytes');I(0xA5,0xe5);R(0xf0,'tailPart');
 L('nextPage');I(0xA0,0);L('pageByte');
 I(0xB1,0xe0);I(0x91,0xe2);b(0xc8);R(0xd0,'pageByte');
 I(0xe6,0xe1);I(0xe6,0xe3);I(0xc6,0xe5);R(0xd0,'nextPage');
 L('tailPart');I(0xA0,0);L('tailCheck');
 I(0xc4,0xe4);R(0xf0,'copied');
 I(0xB1,0xe0);I(0x91,0xe2);b(0xc8);J(0x4c,'tailCheck');
 L('copied');b(0x60);
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
  input:'WASD keyboard via CIA1 ($DC00/$DC01) only; edge-trigger per key press',
  mapType:'40x25 circular hard scroll; bitmap 8 bytes/cell and separate color matrices'};
}
function download(bytes,name){
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
function open(){
 // Only one compact native UI.Dialog. No floating button, preview or export menu.
 if(typeof UI==='undefined'||typeof UI.create!=='function')
  throw Error('La interfaz de LVLLVL no está disponible.');
 if(!st.dialog){
  var dlg=UI.create('UI.Dialog',{id:'rico304Dialog',title:'Ricos Manual Scroll',width:280,height:250});
  var markup='<div style="padding:10px;font:12px/1.4 sans-serif;text-align:center">'+
   '<div style="display:grid;grid-template-columns:repeat(3,52px);gap:5px;justify-content:center;margin:4px 0 12px">'+
   '<span></span><button type="button" class="rico304arrow" data-scroll="up" title="Arriba">▲</button><span></span>'+
   '<button type="button" class="rico304arrow" data-scroll="left" title="Izquierda">◀</button>'+
   '<span style="align-self:center">●</span>'+
   '<button type="button" class="rico304arrow" data-scroll="right" title="Derecha">▶</button>'+
   '<span></span><button type="button" class="rico304arrow" data-scroll="down" title="Abajo">▼</button><span></span>'+
   '</div>'+
   '<label style="display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer">'+
   '<input type="checkbox" id="rico304wasd"> Activar movimiento scroll WASD</label>'+
   '<div id="rico304status" style="font-size:11px;margin-top:10px;opacity:.7">1 celda por movimiento · circular</div>'+
   '</div>';
  dlg.add(UI.create('UI.HTMLPanel',{html:markup}));
  var close=UI.create('UI.Button',{text:'Close',color:'secondary'});
  dlg.addButton(close);
  close.on('click',function(){UI.closeDialog();});
  dlg.on('close',function(){st.dialogOpen=false;st.keyboard=false;});
  st.dialog=dlg;
 }
 st.dialogOpen=true;st.keyboard=false;
 UI.showDialog('rico304Dialog');
 var checkbox=doc.getElementById('rico304wasd');
 if(checkbox){
  checkbox.checked=false;
  checkbox.onchange=function(){st.keyboard=!!(st.dialogOpen&&checkbox.checked);};
 }
 var arrowButtons=doc.querySelectorAll?doc.querySelectorAll('#rico304Dialog .rico304arrow'):[];
 for(var i=0;i<arrowButtons.length;i++){
  arrowButtons[i].onclick=function(e){
   if(!st.dialogOpen)return;
   try{moveArtwork(this.getAttribute('data-scroll'));}
   catch(err){setStatus(err.message);}
  };
 }
 setStatus('1 celda por movimiento · circular');
}
// Native SCREEN menu injection follows.

function installScreenMenu(){
 // Same native menu construction API already used by the LVLLVL SCREEN mode.
 // Wrapping UI.create before Editor.init means no DOM mutation races.
 if(typeof UI!=='function'||typeof UI.create!=='function'||UI.__rico304ManualScrollMenu)return;
 var formerCreate=UI.create;
 UI.create=function(type,args){
  var comp=formerCreate.apply(this,arguments);
  if(type==='UI.MenuBar'&&comp&&typeof comp.addMenu==='function'){
   var formerAddMenu=comp.addMenu;
   comp.addMenu=function(config){
    var menu=formerAddMenu.apply(this,arguments);
    if(config&&config.label==='Screen'&&menu&&typeof menu.addItem==='function'){
     var formerItem=menu.addItem,added=false;
     menu.addItem=function(item){
      var result=formerItem.apply(this,arguments);
      if(item&&item.id==='screen-crop'&&!added){
       added=true;
       formerItem.call(this,{label:'Ricos Manual Scroll...',id:'screen-rico-manual-scroll'});
      }
      return result;
     };
    }
    return menu;
   };
  }
  return comp;
 };
 UI.__rico304ManualScrollMenu=true;
}
function installMenuAction(){
 if(typeof Editor==='undefined'||!Editor.prototype||Editor.prototype.__rico304ManualScrollAction)return;
 var oldMenuClick=Editor.prototype.menuClick;
 Editor.prototype.menuClick=function(id){
  if(id==='screen-rico-manual-scroll'){open();return;}
  return oldMenuClick.apply(this,arguments);
 };
 Editor.prototype.__rico304ManualScrollAction=true;
}
installScreenMenu();
installMenuAction();
doc.addEventListener('keydown',key,true);
w.RICO_TEST304={version:'TEST304',name:'Ricos Manual Scroll',entry:'SCREEN > Ricos Manual Scroll...',capture,mapMove,groupMove,makePRG,selfTest,moveArtwork,getState:()=>st,open};
})(window,document);