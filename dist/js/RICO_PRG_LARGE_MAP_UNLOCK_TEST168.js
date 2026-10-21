(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'){console.error('[RICO TEST168 LARGE MAP] ToPRGAdv missing');return;}

var MAP_DATA_BASE=0x4000;
var COLOR_DATA_BASE=0x7000;
var MAX_MAP_HEIGHT=255;

function clamp(v,a,b,d){v=parseInt(v,10);return isNaN(v)?d:Math.max(a,Math.min(b,v));}
function hex2(v){return ('0'+((v||0)&255).toString(16)).slice(-2);}
function colorIndex(v,d){v=parseInt(v,10);return isNaN(v)||v<0?d:(v&15);}
function frameCount(editor){try{return editor.graphic.getFrameCount();}catch(e){return editor.graphic.frames?editor.graphic.frames.length:0;}}
function gridSize(editor){var g=editor&&editor.graphic,w=40,h=25;try{w=g.getGridWidth();h=g.getGridHeight();}catch(e){}return{width:w|0,height:h|0};}
function getCfg(editor,n){
  try{
    if(window.RICO_TEST79_MAP_SCROLL&&window.RICO_TEST79_MAP_SCROLL.getConfig)return window.RICO_TEST79_MAP_SCROLL.getConfig(editor.graphic,n);
    if(window.RICO_TEST75_MAP_SCROLL&&window.RICO_TEST75_MAP_SCROLL.getConfig)return window.RICO_TEST75_MAP_SCROLL.getConfig(editor.graphic,n);
    if(window.RICO_TEST37_MAP_SCROLL&&window.RICO_TEST37_MAP_SCROLL.getConfig)return window.RICO_TEST37_MAP_SCROLL.getConfig(editor.graphic,n);
  }catch(e){}
  var f=editor.graphic.frames&&editor.graphic.frames[n];return(f&&f.ricoMapScrollV1)||{type:'',ticksPerStep:6,pixelsPerStep:1};
}
function getWindowCfg(editor,n){
  try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getConfig)return window.RICO_TEST75_WINDOW_DIMENSION.getConfig(editor.graphic,n);}catch(e){}
  return{x:0,y:0,width:40,height:25};
}
function getScrollAreaCfg(editor,n){
  try{if(window.RICO_TEST75_WINDOW_DIMENSION&&window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea)return window.RICO_TEST75_WINDOW_DIMENSION.getScrollArea(editor.graphic,n);}catch(e){}
  var s=gridSize(editor);return{x:0,y:0,width:s.width,height:s.height};
}
function getTileSet(editor){
  try{var l=editor.layers.getSelectedLayerObject();if(l&&l.getType&&l.getType()==='grid'&&l.getTileSet)return l.getTileSet();return editor.tileSetManager.getCurrentTileSet();}catch(e){return null;}
}
function getBank2(ts){try{var r=ts.getDocRecord&&ts.getDocRecord(),d=r&&r.data&&r.data.ricoCharsetBank2;if(d&&d.tileData&&d.tileData.length>=256)return d.tileData;}catch(e){}return null;}
function pixels(tile){return tile&&tile.data&&tile.data.length?tile.data[0]:null;}
function charsetBytes(data,fallback){
  var o=new Uint8Array(2048);
  for(var c=0;c<256;c++){
    var p=pixels(data&&data[c])||pixels(fallback&&fallback[c]);if(!p)continue;
    for(var y=0;y<8;y++){var b=0;for(var x=0;x<8;x++)if(p[y*8+x])b|=1<<(7-x);o[c*8+y]=b;}
  }
  return o;
}
function mapData(layer,frame,w,h){
  var out=new Uint8Array(w*h),p=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var t=0;try{var c=layer.getCell({x:x,y:y,frame:frame});t=parseInt(c&&c.t,10);if(isNaN(t)||t<0||t>255)t=0;}catch(e){t=0;}out[p++]=t&255;
  }
  return out;
}
function mapColorData(layer,frame,w,h){
  var out=new Uint8Array(w*h),p=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var fc=14;try{var c=layer.getCell({x:x,y:y,frame:frame});fc=colorIndex(c&&c.fc,14);}catch(e){fc=14;}out[p++]=fc&15;
  }
  return out;
}
function dominantColor(layer,frame,w,h){
  var hist=[];for(var i=0;i<16;i++)hist[i]=0;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++)try{var c=layer.getCell({x:x,y:y,frame:frame}),fc=colorIndex(c&&c.fc,14);hist[fc]++;}catch(e){}
  var best=14,n=-1;for(var j=0;j<16;j++)if(hist[j]>n){n=hist[j];best=j;}return best;
}
function bytesLine(a){var s=[];for(var i=0;i<a.length;i++)s.push('$'+hex2(a[i]));return '!byte '+s.join(',');}
function emitBytes(out,a){for(var i=0;i<a.length;i+=16)out.push(bytesLine(Array.prototype.slice.call(a,i,i+16)));}

function isLargeCandidate(self){
  var ed=self&&self.editor;if(!ed)return false;var s=gridSize(ed);
  // TEST181: width != 40 must not silently fall through to the classic
  // 40x25 PRG exporter (which drops the user's Map Scroll configuration).
  return s.width!==40||s.height>25;
}
// TEST182: independent character animation and group-scroll discovery.
// None of these options depends on the presence of Switch Bank.
function collectAnimations175(ts,data){
  var rec=ts&&ts.getDocRecord&&ts.getDocRecord(),store=rec&&rec.data||{};
  var groups=store.ricoGroupAnimationsV1||{},all=[];
  (groups.bank1||[]).forEach(function(g){if(g)all.push({bank:1,g:g});});
  (groups.bank2||[]).forEach(function(g){if(g)all.push({bank:2,g:g});});
  var switches=all.filter(function(g){return g.g.type==='switch-bank';});
  var motions=all.filter(function(g){return g.g.type!=='switch-bank';});
  if(switches.length>1)throw new Error('TEST182: se encontro mas de un Switch Bank. Unificar el contador global de bancos.');
  if(motions.length>1)throw new Error('TEST182: multiples Group Animate con Map Scroll necesitan planificador de grupos separado. No se exportara sin ellos.');
  var bank2=store.ricoCharsetBank2&&store.ricoCharsetBank2.tileData;
  if(switches.length&&(!bank2||bank2.length<256))throw new Error('Switch Bank necesita BANK 2 completo.');
  var tiles=[ts.tileData,bank2],types={left:0,right:1,up:2,down:3,blink:4},records=[];
  var motion=motions.length?motions[0]:null,group=null;
  if(motion){
    var g=motion.g,w=Number(g.widthTiles),h=Number(g.heightTiles),ticks=Number(g.ticksPerFrame);
    if(g.type!=='up'&&g.type!=='left'&&g.type!=='right')throw new Error('TEST183: este motor combina Map Scroll con Group Scroll Up, Left o Right. No se alterara la direccion seleccionada.');
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>256||h>32||!Array.isArray(g.cells)||g.cells.length!==w*h)
      throw new Error('TEST182: Group Scroll debe ser un rectangulo completo de caracteres distintos, maximo 256 tiles.');
    if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw new Error('TEST182: ticks del Group Scroll deben estar entre 1 y 255.');
    var cells=Array.from({length:w},function(){return Array(h).fill(-1);}),found={};
    for(var ci=0;ci<g.cells.length;ci++){
      var c=g.cells[ci],x=Number(c.x),y=Number(c.y),id=Number(c.tile);
      if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(id)||x<0||x>=w||y<0||y>=h||id<0||id>255||found[id]||cells[x][y]!==-1)
        throw new Error('TEST182: el Group Scroll necesita codigos de caracter unicos y sin huecos.');
      found[id]=true;cells[x][y]=id;
    }
    if(cells.some(function(col){return col.includes(-1);}))throw new Error('TEST182: faltan caracteres en la seleccion grupal.');
    var groupBank=motion.bank,groupTiles=tiles[groupBank-1];
    if(!groupTiles||groupTiles.length<256)throw new Error('TEST182: falta el banco de caracteres del Group Scroll.');
    var protect=groups.animateEmptyCharacters!==true;
    var protectedIds={},original=[],addresses=[],protection=[];
    for(var cx=0;cx<w;cx++){
      var column=[];
      for(var cy=0;cy<h;cy++){
        var code=cells[cx][cy],pix=groupTiles[code]&&groupTiles[code].data&&groupTiles[code].data[0];
        if(!pix||pix.length!==64)throw new Error('TEST182: falta bitmap original para grupo '+code);
        var empty=!pix.some(function(v){return !!v;});
        if(empty&&protect)protectedIds[code]=true;
        protection.push(empty&&protect?1:0);
        addresses.push((groupBank===2?0x3800:0x3000)+code*8);
        for(var yy=0;yy<8;yy++){
          var mask=0;for(var xx=0;xx<8;xx++)if(pix[yy*8+xx])mask|=1<<(7-xx);
          column.push(mask);
        }
      }
      original.push(column.concat(column));
    }
    group={bank:groupBank,w:w,h:h,ticks:ticks,type:g.type,cells:cells,tiles:groupTiles,columns:original,addresses:addresses,protection:protection,codes:found,protectedIds:protectedIds};
  }
  var used=new Uint8Array(256);
  for(var cell=0;cell<data.length;cell++)used[data[cell]&255]=1;
  // Preserve active native animation even when no Switch Bank group exists.
  for(var bank=0;bank<2;bank++){
    if(!tiles[bank]||tiles[bank].length<256)continue;
    for(var code=0;code<256;code++){
      if(!used[code])continue;
      var props=tiles[bank][code]&&tiles[bank][code].props||{},type=props.animated;
      if(type===null||type===false||type===undefined||type==='')continue;
      if(!Object.prototype.hasOwnProperty.call(types,type))throw new Error('TEST182: animacion individual '+type+' aun no soportada en PRG');
      // The same physical charset bytes cannot be driven by two different
      // methods. Do not silently choose one and lose the other's settings.
      if(group&&group.bank===bank+1&&group.codes[code])
        throw new Error('TEST182: caracter '+code+' BANK '+(bank+1)+' tiene Scroll individual Y grupal. Elegir uno para ese caracter.');
      var ticksN=clamp(props.ticksPerFrame,1,255,1);
      records.push({bank:bank+1,code:code,ticks:ticksN,type:types[type],address:(bank?0x3800:0x3000)+code*8});
    }
  }
  var sw=switches.length?switches[0].g:null;
  // Leave old 40-wide map-only output unchanged if there are no new effects.
  if(!sw&&!group&&!records.length)return null;
  return {switchTicks:sw?clamp(sw.ticksPerFrame,1,255,1):0,records:records,group:group};
}

function collect(self){
  var ed=self.editor,s=gridSize(ed),fc=frameCount(ed);
  if(s.width!==40)throw new Error('TEST84 grande vertical requiere Screen de 40 columnas.');
  if(s.height<=25||s.height>MAX_MAP_HEIGHT)throw new Error('El formato del mapa de esta ruta utiliza indices de fila de 8 bits (hasta 255).');
  if(fc!==1)throw new Error('Esta ruta de mapas grandes requiere transiciones multiframe implementadas antes de exportar.');
  var layer=ed.layers&&ed.layers.getSelectedLayerObject?ed.layers.getSelectedLayerObject():null;
  if(!layer||!layer.getType||layer.getType()!=='grid')throw new Error('Selecciona una capa Grid.');
  var ts=getTileSet(ed);if(!ts||ts.getTileWidth()!=8||ts.getTileHeight()!=8)throw new Error('TEST84 requiere charset 8x8.');
  var cfg=getCfg(ed,0),type=(cfg&&cfg.type)||'';
  if(type!=='up'&&type!=='down')throw new Error('Para este movimiento falta una rutina de mapa grande. Se preservo el mapa original y el MASTER.');
  var win=getWindowCfg(ed,0),area=getScrollAreaCfg(ed,0);
  win={x:clamp(win.x,0,s.width-1,0),y:clamp(win.y,0,s.height-1,0),width:clamp(win.width,1,s.width,40),height:clamp(win.height,1,s.height,25)};
  area={x:clamp(area.x,0,s.width-1,0),y:clamp(area.y,0,s.height-1,0),width:clamp(area.width,1,s.width,40),height:clamp(area.height,1,s.height,25)};
  if(win.x!==0||win.width!==40||(win.height!==24&&win.height!==25))throw new Error("Para TEST84 usa Window X=0, ancho 40 y alto 24 o 25.");
  if(area.x!==0||area.width!==40||area.height<25)throw new Error('Para TEST84 usa Scroll Area X=0, ancho 40 y alto de al menos 25 filas (por ejemplo 40x50).');
  if(area.y+area.height>s.height)throw new Error('Scroll Area sale fuera del Screen.');
  if(win.y<area.y||win.y>=area.y+area.height)throw new Error('El inicio de Window debe caer dentro del Scroll Area.');
  var initialRow=win.y-area.y;
  var duration=12;try{duration=ed.graphic.getFrameDuration(0);}catch(e){var fr=ed.graphic.frames&&ed.graphic.frames[0];duration=fr&&fr.duration;}duration=clamp(duration,1,1024,12);
  var bg=0,border=0;try{bg=colorIndex(layer.getBackgroundColor(0),0);}catch(e){}try{border=colorIndex(layer.getBorderColor(0),bg);}catch(e){border=bg;}
  var bank=1;try{bank=parseInt(ed.graphic.frames[0].charsetBank,10)===2?2:1;}catch(e){}
  var b2=getBank2(ts),bank1=charsetBytes(ts.tileData,ts.tileData),bank2=b2?charsetBytes(b2,ts.tileData):bank1;
  var data=mapData(layer,0,s.width,s.height),colors=mapColorData(layer,0,s.width,s.height);
  if(MAP_DATA_BASE+data.length>=COLOR_DATA_BASE)throw new Error('Mapa demasiado grande: invade el banco de color de TEST84.');
  if(COLOR_DATA_BASE+colors.length>=0xd000)throw new Error('Mapa de colores demasiado grande para el banco RAM seguro de TEST84.');
  return{editor:ed,width:s.width,height:s.height,type:type,typeCode:type==='up'?1:2,ticks:clamp(cfg&&cfg.ticksPerStep,1,255,6),pixels:clamp(cfg&&cfg.pixelsPerStep,1,8,1),duration:duration,bg:bg,border:border,bank:bank,window:win,area:area,initialRow:initialRow,bank1:bank1,bank2:bank2,map:data,colors:colors,anim175:collectAnimations175(ts,data)};
}


function blankCharTable(d){
  var cs=d.bank===2?d.bank2:d.bank1,out=new Uint8Array(256);
  for(var c=0;c<256;c++){
    var blank=1;
    for(var y=0;y<8;y++)if(cs[c*8+y]){blank=0;break;}
    out[c]=blank;
  }
  return out;
}
function dominantVisibleColor(d,blank){
  var h=[];for(var i=0;i<16;i++)h[i]=0;
  for(var p=0;p<d.map.length;p++)if(!blank[d.map[p]&255])h[d.colors[p]&15]++;
  var best=14,n=-1;for(var c=0;c<16;c++)if(h[c]>n){n=h[c];best=c;}
  return best;
}
function sparseColorRows(d,blank){
  var rows=[],total=0,max=0;
  for(var cam=0;cam<d.area.height;cam++){
    var a=[];
    for(var sy=0;sy<25;sy++){
      var srcRow=d.area.y+((cam+sy)%d.area.height);
      for(var x=0;x<40;x++){
        var idx=srcRow*40+x,ch=d.map[idx]&255;
        if(blank[ch])continue;
        var addr=0xd800+sy*40+x;
        a.push(addr&255,(addr>>8)&255,d.colors[idx]&15);
      }
    }
    // TEST168: 1000 visible cells are valid; choose an adaptive color strategy.
    rows.push(a);total+=a.length;max=Math.max(max,a.length/3);
  }
  return{rows:rows,totalBytes:total,maxUpdates:max};
}

function buildSource(d){
  var out=[],areaBase=MAP_DATA_BASE+d.area.y*40,areaLo=areaBase&255,areaHi=(areaBase>>8)&255;
  var blank=blankCharTable(d),fallbackColor=dominantVisibleColor(d,blank),sparse=sparseColorRows(d,blank);
  var sparseBase=(COLOR_DATA_BASE+d.colors.length+255)&0xff00;
  var sparseStoredBytes=0;for(var sb=0;sb<sparse.rows.length;sb++)sparseStoredBytes+=sparse.rows[sb].length?sparse.rows[sb].length:1;
  // TEST168: sparse tables were a *performance optimization*, not a limit on art.
  // When the table would not fit, calculate color from the source map at run time.
  // Uniform color scenes use no per-step color writes at all.
  var uniformVisible=true,visibleColor=-1;
  for(var sc=0;sc<d.map.length;sc++)if(!blank[d.map[sc]&255]){
    if(visibleColor<0)visibleColor=d.colors[sc]&15;
    else if(visibleColor!==(d.colors[sc]&15)){uniformVisible=false;break;}
  }
  var sparseFits=sparse.maxUpdates<=255 && sparseBase+(sparse.rows.length*3)+sparseStoredBytes<0xd000;
  var colorMode=uniformVisible?'uniform':(sparseFits?'sparse':'dynamic');
  if(colorMode==='uniform'&&visibleColor>=0)fallbackColor=visibleColor;
  console.log('[RICO TEST168] color mode: '+colorMode+', max visible: '+sparse.maxUpdates+', sparse bytes '+sparseStoredBytes);

  var colorAreaBase=COLOR_DATA_BASE+d.area.y*40,colorAreaLo=colorAreaBase&255,colorAreaHi=(colorAreaBase>>8)&255;
  var durationLo=d.duration&255,durationHi=(d.duration>>8)&255;
  var d011base=d.window.height<=24?0x10:0x18;
  var charsetBits=d.bank===2?0x0e:0x0c;
  out.push('; RICO TEST168 - LARGE MAP ADAPTIVE COLOR PIPELINE');
  out.push('; Screen '+d.width+'x'+d.height+' source map; VIC viewport 40x'+d.window.height+'; Scroll Area 40x'+d.area.height+'.');
  out.push('; Source map stays at $4000+. Per-cell colors stay at $7000+. VIC buffers remain at $0400/$0800.');
  out.push('*=$0801');
  out.push('!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00 ; 10 SYS8192');
  out.push('*=$2000');
  out.push('frame_remaining=$02');
  out.push('frame_remaining_hi=$03');
  out.push('step_counter=$04');
  out.push('ticks_per_step=$05');
  out.push('pixels_per_step=$06');
  out.push('scroll_type=$07');
  out.push('fine_pos=$08');
  out.push('pixel_count=$09');
  out.push('src_lo=$0a');
  out.push('src_hi=$0b');
  out.push('dst_lo=$0c');
  out.push('dst_hi=$0d');
  out.push('front_hi=$0e');
  out.push('back_hi=$0f');
  out.push('charset_bits=$10');
  out.push('camera_row=$11');
  out.push('source_row=$12');
  out.push('prep_request=$13');
  out.push('prep_ready=$14');
  out.push('prep_target_fine=$15');
  out.push('deferred_pixels=$16');
  out.push('main_busy=$17');
  out.push('color_tbl_lo=$18');
  out.push('color_tbl_hi=$19');
  out.push('color_updates=$1a');
  if(colorMode==='dynamic')out.push('color_row=$1b');
  if(d.anim175&&d.anim175.records.length){
    out.push('anim175_ptr_lo=$30');
    out.push('anim175_ptr_hi=$31');
    out.push('anim175_dest_lo=$32');
    out.push('anim175_dest_hi=$33');
    out.push('anim175_temp=$34');
  }
  out.push('');
  out.push('start');
  out.push(' sei');
  out.push(' lda #$35');
  out.push(' sta $01');
  out.push(' lda $dd00');
  out.push(' ora #$03');
  out.push(' sta $dd00');
  out.push(' lda #$7f');
  out.push(' sta $dc0d');
  out.push(' sta $dd0d');
  out.push(' lda $dc0d');
  out.push(' lda $dd0d');
  out.push(' lda #$04');
  out.push(' sta front_hi');
  out.push(' lda #$08');
  out.push(' sta back_hi');
  out.push(' lda #$'+hex2(charsetBits));
  out.push(' sta charset_bits');
  out.push(' lda #$'+hex2(d.initialRow));
  out.push(' sta camera_row');
  out.push(' lda #$'+hex2(d.typeCode));
  out.push(' sta scroll_type');
  out.push(' lda #$'+hex2(d.ticks));
  out.push(' sta ticks_per_step');
  out.push(' sta step_counter');
  out.push(' lda #$'+hex2(d.pixels));
  out.push(' sta pixels_per_step');
  out.push(' lda #$'+hex2(durationLo));
  out.push(' sta frame_remaining');
  out.push(' lda #$'+hex2(durationHi));
  out.push(' sta frame_remaining_hi');
  out.push(' lda #$00');
  out.push(' sta prep_request');
  out.push(' sta prep_ready');
  out.push(' sta deferred_pixels');
  out.push(' sta main_busy');
  out.push(' jsr render_front');
  out.push(' jsr render_back');
  out.push(' jsr init_sparse_colors');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' bne start_no_fast8_prime');
  out.push(' lda #$01');
  out.push(' sta prep_request');
  out.push('start_no_fast8_prime');
  out.push(' lda #$'+hex2(d.bg));
  out.push(' sta $d021');
  out.push(' lda #$'+hex2(d.border));
  out.push(' sta $d020');
  if(d.type==='up')out.push(' lda #$07');else out.push(' lda #$00');
  out.push(' sta fine_pos');
  out.push(' jsr update_d018');
  out.push(' jsr apply_scroll_regs');
  out.push(' lda #$01');
  out.push(' sta $d01a');
  out.push(' lda #$fa');
  out.push(' sta $d012');
  out.push(' lda #<irq');
  out.push(' sta $fffe');
  out.push(' lda #>irq');
  out.push(' sta $ffff');
  out.push(' cli');
  out.push('main_loop');
  out.push(' lda prep_request');
  out.push(d.anim175&&(d.anim175.records.length||d.anim175.group)?' beq main182_background':' beq main_loop');
  out.push(' lda prep_ready');
  out.push(d.anim175&&(d.anim175.records.length||d.anim175.group)?' bne main182_background':' bne main_loop');
  out.push(' lda #$01');
  out.push(' sta main_busy');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' bne main_prepare_shift');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' bne main_prepare_fast8_down');
  out.push(' jsr camera_next');
  out.push(' jmp main_prepare_shift');
  out.push('main_prepare_fast8_down');
  out.push(' jsr camera_prev');
  out.push('main_prepare_shift');
  out.push(' jsr prepare_back_shift');
  out.push(' lda #$00');
  out.push(' sta main_busy');
  out.push(' lda #$01');
  out.push(' sta prep_ready');
  out.push(' jmp main_loop');
  if(d.anim175&&(d.anim175.records.length||d.anim175.group)){
    out.push('main182_background');
    if(d.anim175&&d.anim175.group){
      out.push(' lda group182_pending');
      out.push(' beq main182_try_individual');
      out.push(' jsr group182_step'); // one column / iteration; map has priority
      out.push(' jmp main_loop');
      out.push('main182_try_individual');
    }
    if(d.anim175&&d.anim175.records.length){
      out.push(' lda anim175_pending');
      out.push(' beq main_loop');
      out.push(' jsr anim175_tick');
      out.push(' jmp main_loop');
    }else out.push(' jmp main_loop');
  }
  out.push('');
  out.push('irq');
  out.push(' pha');out.push(' txa');out.push(' pha');out.push(' tya');out.push(' pha');
  out.push(' lda #$01');out.push(' sta $d019');
  // TEST176: Map Scroll always has first priority inside the raster IRQ.
  // Character animation is serviced incrementally by main_loop, not inside
  // an unbounded IRQ loop that could starve Map Scroll and cause ghost fetches.
  out.push(' lda main_busy');out.push(' bne irq_done_tick');out.push(' jsr frame_tick');
  out.push('irq_done_tick');
  if(d.anim175&&d.anim175.switchTicks)out.push(' jsr anim175_switch_tick');
  if(d.anim175&&d.anim175.group)out.push(' jsr group182_irq_tick');
  if(d.anim175&&d.anim175.records.length){
    out.push(' lda anim175_pending');
    out.push(' cmp #$ff');
    out.push(' beq anim176_pending_full');
    out.push(' inc anim175_pending');
    out.push('anim176_pending_full');
  }
  out.push(' pla');out.push(' tay');out.push(' pla');out.push(' tax');out.push(' pla');out.push(' rti');
  out.push('');
  out.push('frame_tick');
  out.push(' lda pixels_per_step');
  out.push(' cmp #$08');
  out.push(' beq frame_tick_fast8');
  out.push(' lda prep_request');
  out.push(' beq frame_tick_timer');
  out.push(' lda prep_ready');
  out.push(' beq frame_tick_done');
  out.push(' jsr commit_prepared');
  out.push(' rts');
  out.push('frame_tick_fast8');
  out.push(' lda prep_ready');
  out.push(' beq frame_tick_done');
  out.push(' dec step_counter');
  out.push(' bne frame_tick_done');
  out.push(' lda ticks_per_step');
  out.push(' sta step_counter');
  out.push(' jsr commit_fast8');
  out.push(' rts');
  out.push('frame_tick_timer');
  out.push(' lda frame_remaining');
  out.push(' bne frame_tick_dec_low');
  out.push(' lda frame_remaining_hi');
  out.push(' beq frame_tick_reload');
  out.push(' dec frame_remaining_hi');
  out.push('frame_tick_dec_low');
  out.push(' dec frame_remaining');
  out.push(' lda frame_remaining');
  out.push(' ora frame_remaining_hi');
  out.push(' bne frame_tick_scroll');
  out.push('frame_tick_reload');
  out.push(' lda #$'+hex2(durationLo));out.push(' sta frame_remaining');
  out.push(' lda #$'+hex2(durationHi));out.push(' sta frame_remaining_hi');
  out.push('frame_tick_scroll');
  out.push(' dec step_counter');
  out.push(' bne frame_tick_done');
  out.push(' lda ticks_per_step');out.push(' sta step_counter');
  out.push(' lda pixels_per_step');out.push(' sta pixel_count');
  out.push('frame_pixel_loop');
  out.push(' jsr step_dispatch');
  out.push(' dec pixel_count');
  out.push(' lda prep_request');
  out.push(' beq frame_pixel_continue');
  out.push(' lda pixel_count');out.push(' sta deferred_pixels');
  out.push(' rts');
  out.push('frame_pixel_continue');
  out.push(' lda pixel_count');out.push(' bne frame_pixel_loop');
  out.push('frame_tick_done');out.push(' rts');
  out.push('');
  out.push('step_dispatch');
  out.push(' lda scroll_type');out.push(' cmp #$01');out.push(' beq step_up');out.push(' jmp step_down');
  out.push('step_up');
  out.push(' lda fine_pos');out.push(' beq step_done');out.push(' dec fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' bne step_done');out.push(' jsr camera_next');out.push(' lda #$01');out.push(' ldx #$07');out.push(' jsr request_prepare');
  out.push('step_done');out.push(' rts');
  out.push('step_down');
  out.push(' lda fine_pos');out.push(' cmp #$07');out.push(' beq step_down_done');out.push(' inc fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' cmp #$07');out.push(' bne step_down_done');out.push(' jsr camera_prev');out.push(' lda #$01');out.push(' ldx #$00');out.push(' jsr request_prepare');
  out.push('step_down_done');out.push(' rts');
  out.push('');
  out.push('request_prepare');
  out.push(' stx prep_target_fine');out.push(' lda #$01');out.push(' sta prep_request');out.push(' lda #$00');out.push(' sta prep_ready');out.push(' rts');
  out.push('');
  out.push('commit_prepared');
  out.push(' jsr apply_sparse_colors');
  out.push(' jsr swap_screens');
  out.push(' lda prep_target_fine');out.push(' sta fine_pos');out.push(' jsr apply_scroll_regs');
  out.push(' lda #$00');out.push(' sta prep_request');out.push(' sta prep_ready');
  out.push(' lda deferred_pixels');out.push(' beq commit_done');out.push(' sta pixel_count');out.push(' lda #$00');out.push(' sta deferred_pixels');
  out.push('commit_deferred_loop');out.push(' jsr step_dispatch');out.push(' dec pixel_count');out.push(' lda prep_request');out.push(' bne commit_done');out.push(' lda pixel_count');out.push(' bne commit_deferred_loop');
  out.push('commit_done');out.push(' rts');
  out.push('');
  out.push('commit_fast8');
  out.push(' jsr apply_sparse_colors');
  out.push(' jsr swap_screens');
  out.push(' lda scroll_type');
  out.push(' cmp #$01');
  out.push(' bne commit_fast8_down');
  out.push(' lda #$07');
  out.push(' jmp commit_fast8_fine');
  out.push('commit_fast8_down');
  out.push(' lda #$00');
  out.push('commit_fast8_fine');
  out.push(' sta fine_pos');
  out.push(' jsr apply_scroll_regs');
  out.push(' lda #$00');
  out.push(' sta prep_ready');
  out.push(' lda #$01');
  out.push(' sta prep_request');
  out.push(' rts');
  out.push('');
  out.push('camera_next');
  out.push(' inc camera_row');out.push(' lda camera_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc camera_next_done');out.push(' lda #$00');out.push(' sta camera_row');out.push('camera_next_done');out.push(' rts');
  out.push('camera_prev');
  out.push(' lda camera_row');out.push(' bne camera_prev_dec');out.push(' lda #$'+hex2(d.area.height-1));out.push(' sta camera_row');out.push(' rts');out.push('camera_prev_dec');out.push(' dec camera_row');out.push(' rts');
  out.push('');
  out.push('prepare_back_shift');
  out.push(' lda scroll_type');out.push(' cmp #$01');out.push(' beq prepare_fast_up');out.push(' jmp prepare_fast_down');
  out.push('prepare_fast_up');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' beq fast_up_04');
  out.push(' jsr copy960_up_08_to_04');out.push(' jmp fast_up_newrow');
  out.push('fast_up_04');out.push(' jsr copy960_up_04_to_08');
  out.push('fast_up_newrow');
  out.push(' jsr set_src_camera');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$18');
  out.push('fast_up_seek');out.push(' jsr advance_map_src');out.push(' dex');out.push(' bne fast_up_seek');
  out.push(' jsr set_dst_back');out.push(' ldx #$18');out.push('fast_up_dst_seek');out.push(' jsr add40_dst');out.push(' dex');out.push(' bne fast_up_dst_seek');out.push(' jsr copy40');out.push(' rts');
  out.push('prepare_fast_down');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' beq fast_down_04');
  out.push(' jsr copy960_down_08_to_04');out.push(' jmp fast_down_newrow');
  out.push('fast_down_04');out.push(' jsr copy960_down_04_to_08');
  out.push('fast_down_newrow');out.push(' jsr set_src_camera');out.push(' jsr set_dst_back');out.push(' jsr copy40');out.push(' rts');
  out.push('copy960_up_04_to_08');out.push(' ldy #$00');out.push('cu408_loop');
  out.push(' lda $0428,y');out.push(' sta $0800,y');out.push(' lda $0528,y');out.push(' sta $0900,y');out.push(' lda $0628,y');out.push(' sta $0a00,y');out.push(' iny');out.push(' bne cu408_loop');
  out.push(' ldy #$00');out.push('cu408_tail');out.push(' lda $0728,y');out.push(' sta $0b00,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cu408_tail');out.push(' rts');
  out.push('copy960_up_08_to_04');out.push(' ldy #$00');out.push('cu804_loop');
  out.push(' lda $0828,y');out.push(' sta $0400,y');out.push(' lda $0928,y');out.push(' sta $0500,y');out.push(' lda $0a28,y');out.push(' sta $0600,y');out.push(' iny');out.push(' bne cu804_loop');
  out.push(' ldy #$00');out.push('cu804_tail');out.push(' lda $0b28,y');out.push(' sta $0700,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cu804_tail');out.push(' rts');
  out.push('copy960_down_04_to_08');out.push(' ldy #$00');out.push('cd408_loop');
  out.push(' lda $0400,y');out.push(' sta $0828,y');out.push(' lda $0500,y');out.push(' sta $0928,y');out.push(' lda $0600,y');out.push(' sta $0a28,y');out.push(' iny');out.push(' bne cd408_loop');
  out.push(' ldy #$00');out.push('cd408_tail');out.push(' lda $0700,y');out.push(' sta $0b28,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cd408_tail');out.push(' rts');
  out.push('copy960_down_08_to_04');out.push(' ldy #$00');out.push('cd804_loop');
  out.push(' lda $0800,y');out.push(' sta $0428,y');out.push(' lda $0900,y');out.push(' sta $0528,y');out.push(' lda $0a00,y');out.push(' sta $0628,y');out.push(' iny');out.push(' bne cd804_loop');
  out.push(' ldy #$00');out.push('cd804_tail');out.push(' lda $0b00,y');out.push(' sta $0728,y');out.push(' iny');out.push(' cpy #$c0');out.push(' bne cd804_tail');out.push(' rts');
  out.push('');
  out.push('set_src_front');out.push(' lda #$00');out.push(' sta src_lo');out.push(' lda front_hi');out.push(' sta src_hi');out.push(' rts');
  out.push('set_dst_back');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda back_hi');out.push(' sta dst_hi');out.push(' rts');
  out.push('copy40');out.push(' ldy #$00');out.push('copy40_loop');out.push(' lda (src_lo),y');out.push(' sta (dst_lo),y');out.push(' iny');out.push(' cpy #$28');out.push(' bne copy40_loop');out.push(' rts');
  out.push('advance_map_src');out.push(' inc source_row');out.push(' lda source_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc advance_map_src_next');out.push(' lda #$00');out.push(' sta source_row');out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');out.push(' rts');out.push('advance_map_src_next');out.push(' jmp add40_src');
  out.push('');
  out.push('render_front');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda front_hi');out.push(' sta dst_hi');out.push(' jmp render_to_dst');
  out.push('render_back');out.push(' lda #$00');out.push(' sta dst_lo');out.push(' lda back_hi');out.push(' sta dst_hi');out.push(' jmp render_to_dst');
  out.push('');
  out.push('set_src_camera');
  out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');
  out.push(' ldx camera_row');out.push(' beq set_src_camera_done');
  out.push('set_src_camera_loop');out.push(' jsr add40_src');out.push(' dex');out.push(' bne set_src_camera_loop');
  out.push('set_src_camera_done');out.push(' rts');
  out.push('');
  out.push('set_color_src_camera');
  out.push(' lda #$'+hex2(colorAreaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(colorAreaHi));out.push(' sta src_hi');
  out.push(' ldx camera_row');out.push(' beq set_color_src_camera_done');
  out.push('set_color_src_camera_loop');out.push(' jsr add40_src');out.push(' dex');out.push(' bne set_color_src_camera_loop');
  out.push('set_color_src_camera_done');out.push(' rts');
  out.push('');
  out.push('init_sparse_colors');
  out.push(' lda #$'+hex2(fallbackColor));out.push(' ldx #$00');
  out.push('init_sparse_color_loop');out.push(' sta $d800,x');out.push(' sta $d900,x');out.push(' sta $da00,x');out.push(' sta $db00,x');out.push(' inx');out.push(' bne init_sparse_color_loop');
  out.push(' jmp apply_sparse_colors');
  out.push('');
  out.push('apply_sparse_colors');
  if(colorMode==='uniform'){
    out.push(' rts');
  }else if(colorMode==='dynamic'){
    // Decode the color of the visible 25x40 map region on demand.
    // No precomputed 8-bit count/table; handles 0..1000 visible cells.
    // This costs extra CPU on fully multicolored maps and requires a VICE test.
    out.push(' jsr set_color_src_camera');
    out.push(' lda #$00');out.push(' sta dst_lo');
    out.push(' lda #$d8');out.push(' sta dst_hi');
    out.push(' lda camera_row');out.push(' sta color_row');
    out.push(' ldx #$19');
    out.push('dynamic_color_row_loop');out.push(' ldy #$00');
    out.push('dynamic_color_col_loop');
    out.push(' lda (src_lo),y');out.push(' and #$0f');out.push(' sta (dst_lo),y');
    out.push(' iny');out.push(' cpy #$28');out.push(' bne dynamic_color_col_loop');
    out.push(' jsr add40_dst');
    out.push(' inc color_row');out.push(' lda color_row');
    out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc dynamic_color_next_src');
    out.push(' lda #$00');out.push(' sta color_row');
    out.push(' lda #$'+hex2(colorAreaLo));out.push(' sta src_lo');
    out.push(' lda #$'+hex2(colorAreaHi));out.push(' sta src_hi');
    out.push(' jmp dynamic_color_advance');
    out.push('dynamic_color_next_src');out.push(' jsr add40_src');
    out.push('dynamic_color_advance');out.push(' dex');out.push(' bne dynamic_color_row_loop');
    out.push(' rts');
  }else{
    out.push(' ldx camera_row');out.push(' lda color_update_count,x');out.push(' sta color_updates');out.push(' beq sparse_color_done');
    out.push(' lda color_update_ptr_lo,x');out.push(' sta color_tbl_lo');out.push(' lda color_update_ptr_hi,x');out.push(' sta color_tbl_hi');
    out.push('sparse_color_loop');out.push(' ldy #$00');out.push(' lda (color_tbl_lo),y');out.push(' sta sparse_color_store+1');out.push(' iny');out.push(' lda (color_tbl_lo),y');out.push(' sta sparse_color_store+2');out.push(' iny');out.push(' lda (color_tbl_lo),y');
    out.push('sparse_color_store');out.push(' sta $d800');
    out.push(' clc');out.push(' lda color_tbl_lo');out.push(' adc #$03');out.push(' sta color_tbl_lo');out.push(' lda color_tbl_hi');out.push(' adc #$00');out.push(' sta color_tbl_hi');
    out.push(' dec color_updates');out.push(' bne sparse_color_loop');
    out.push('sparse_color_done');out.push(' rts');
  }
  out.push('');
  out.push('render_to_dst');
  out.push(' jsr set_src_camera');out.push(' lda camera_row');out.push(' sta source_row');out.push(' ldx #$19');
  out.push('render_row_loop');out.push(' ldy #$00');
  out.push('render_col_loop');out.push(' lda (src_lo),y');out.push(' sta (dst_lo),y');out.push(' iny');out.push(' cpy #$28');out.push(' bne render_col_loop');
  out.push(' jsr add40_dst');out.push(' inc source_row');out.push(' lda source_row');out.push(' cmp #$'+hex2(d.area.height));out.push(' bcc render_source_next');
  out.push(' lda #$00');out.push(' sta source_row');out.push(' lda #$'+hex2(areaLo));out.push(' sta src_lo');out.push(' lda #$'+hex2(areaHi));out.push(' sta src_hi');out.push(' jmp render_row_advance_done');
  out.push('render_source_next');out.push(' jsr add40_src');
  out.push('render_row_advance_done');out.push(' dex');out.push(' bne render_row_loop');out.push(' rts');
  out.push('');
  out.push('add40_src');out.push(' clc');out.push(' lda src_lo');out.push(' adc #$28');out.push(' sta src_lo');out.push(' lda src_hi');out.push(' adc #$00');out.push(' sta src_hi');out.push(' rts');
  out.push('add40_dst');out.push(' clc');out.push(' lda dst_lo');out.push(' adc #$28');out.push(' sta dst_lo');out.push(' lda dst_hi');out.push(' adc #$00');out.push(' sta dst_hi');out.push(' rts');
  out.push('');
  out.push('swap_screens');
  out.push(' lda front_hi');out.push(' pha');out.push(' lda back_hi');out.push(' sta front_hi');out.push(' pla');out.push(' sta back_hi');out.push(' jsr update_d018');out.push(' rts');
  out.push('update_d018');
  out.push(' lda front_hi');out.push(' cmp #$04');out.push(' bne d018_screen_0800');out.push(' lda #$10');out.push(' jmp d018_charset');out.push('d018_screen_0800');out.push(' lda #$20');out.push('d018_charset');out.push(' ora charset_bits');out.push(' sta $d018');out.push(' rts');
  out.push('apply_scroll_regs');
  out.push(' lda fine_pos');out.push(' and #$07');out.push(' ora #$'+hex2(d011base));out.push(' sta $d011');out.push(' lda #$08');out.push(' sta $d016');out.push(' rts');
  // TEST175: a single PAL IRQ schedules Map Scroll, independent native
  // character scroll in BOTH charsets, and global hardware Bank Switch.
  // Routines and their mutable countdowns stay below $3000 so $3000/$3800
  // charsets remain the exact user artwork, never a temporary frame copy.
  if(d.anim175&&d.anim175.switchTicks){
    out.push('anim175_switch_tick');
    out.push(' dec anim175_switch_counter');
    out.push(' beq anim175_do_switch');
    out.push(' rts');
    out.push('anim175_do_switch');
    out.push(' lda #$'+hex2(d.anim175.switchTicks));
    out.push(' sta anim175_switch_counter');
    out.push(' lda charset_bits');
    out.push(' eor #$02');
    out.push(' sta charset_bits');
    out.push(' jmp update_d018');
    out.push('anim175_switch_counter');
    out.push('!byte $'+hex2(d.anim175.switchTicks));
    out.push('');
  }
  if(d.anim175&&d.anim175.records.length){
    out.push('anim175_tick');
    out.push(' lda anim175_active');
    out.push(' bne anim175_loop');
    out.push(' lda #<anim175_table');
    out.push(' sta anim175_ptr_lo');
    out.push(' lda #>anim175_table');
    out.push(' sta anim175_ptr_hi');
    out.push(' lda #$01');
    out.push(' sta anim175_active');
    out.push('anim175_loop');
    out.push(' ldy #$00');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' bne anim175_next_record');
    out.push(' dec anim175_pending');
    out.push(' lda #$00');
    out.push(' sta anim175_active');
    out.push(' rts');
    out.push('anim175_next_record');
    out.push(' ldy #$01');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' sec');
    out.push(' sbc #$01');
    out.push(' sta (anim175_ptr_lo),y');
    out.push(' beq anim175_run');
    out.push(' jmp anim175_advance');
    out.push('anim175_run');
    out.push(' ldy #$00');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' iny');
    out.push(' sta (anim175_ptr_lo),y');
    out.push(' iny');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' sta anim175_dest_lo');
    out.push(' iny');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' sta anim175_dest_hi');
    out.push(' iny');
    out.push(' lda (anim175_ptr_lo),y');
    out.push(' cmp #$00');
    out.push(' bne anim175_type_right');
    out.push(' jsr anim175_left');
    out.push(' jmp anim175_advance');
    out.push('anim175_type_right');
    out.push(' cmp #$01');
    out.push(' bne anim175_type_up');
    out.push(' jsr anim175_right');
    out.push(' jmp anim175_advance');
    out.push('anim175_type_up');
    out.push(' cmp #$02');
    out.push(' bne anim175_type_down');
    out.push(' jsr anim175_up');
    out.push(' jmp anim175_advance');
    out.push('anim175_type_down');
    out.push(' cmp #$03');
    out.push(' bne anim175_type_blink');
    out.push(' jsr anim175_down');
    out.push(' jmp anim175_advance');
    out.push('anim175_type_blink');
    out.push(' jsr anim175_blink');
    out.push('anim175_advance');
    out.push(' clc');
    out.push(' lda anim175_ptr_lo');
    out.push(' adc #$05');
    out.push(' sta anim175_ptr_lo');
    out.push(' lda anim175_ptr_hi');
    out.push(' adc #$00');
    out.push(' sta anim175_ptr_hi');
    out.push(' rts'); // one glyph at a time; main_loop prioritizes map preparation
    out.push('');
    out.push('anim175_left');
    out.push(' ldy #$07');
    out.push('anim175_left_loop');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' asl');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' rol');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' dey');
    out.push(' bpl anim175_left_loop');
    out.push(' rts');
    out.push('anim175_right');
    out.push(' ldy #$07');
    out.push('anim175_right_loop');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' lsr');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' ror');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' dey');
    out.push(' bpl anim175_right_loop');
    out.push(' rts');
    out.push('anim175_up');
    out.push(' ldy #$00');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' sta anim175_temp');
    out.push(' ldx #$07');
    out.push('anim175_up_loop');
    out.push(' iny');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' dey');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' iny');
    out.push(' dex');
    out.push(' bne anim175_up_loop');
    out.push(' lda anim175_temp');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' rts');
    out.push('anim175_down');
    out.push(' ldy #$07');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' sta anim175_temp');
    out.push(' ldx #$07');
    out.push('anim175_down_loop');
    out.push(' dey');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' iny');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' dey');
    out.push(' dex');
    out.push(' bne anim175_down_loop');
    out.push(' lda anim175_temp');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' rts');
    out.push('anim175_blink');
    out.push(' ldy #$07');
    out.push('anim175_blink_loop');
    out.push(' lda (anim175_dest_lo),y');
    out.push(' eor #$ff');
    out.push(' sta (anim175_dest_lo),y');
    out.push(' dey');
    out.push(' bpl anim175_blink_loop');
    out.push(' rts');
    out.push('anim175_table');
    for(var a175=0;a175<d.anim175.records.length;a175++){
      var g175=d.anim175.records[a175];
      emitBytes(out,[g175.ticks,g175.ticks,g175.address&255,(g175.address>>8)&255,g175.type]);
    }
    out.push('!byte $00');
    out.push('anim175_pending');
    out.push('!byte $00');
    out.push('anim175_active');
    out.push('!byte $00');
    out.push('');
  }
  out.push('*=$3000');out.push('charset_bank1');emitBytes(out,d.bank1);
  out.push('*=$3800');out.push('charset_bank2');emitBytes(out,d.bank2);
  out.push('*=$4000');out.push('large_map_data');emitBytes(out,d.map);
  out.push('*=$7000');out.push('large_color_data');emitBytes(out,d.colors);
  if(colorMode==='sparse'){
  out.push('*=$'+('0000'+sparseBase.toString(16)).slice(-4));
  out.push('color_update_count');
  var counts=[];for(var ci=0;ci<sparse.rows.length;ci++)counts.push((sparse.rows[ci].length/3)&255);emitBytes(out,counts);
  // LVLLVL's in-browser assembler does not reliably resolve <label / >label
  // expressions inside !byte tables. Build the sparse-row pointer table numerically.
  var rowDataBase=sparseBase+(sparse.rows.length*3),rowAddr=rowDataBase,lo=[],hi=[],rowSizes=[];
  for(var pi=0;pi<sparse.rows.length;pi++){
    lo.push(rowAddr&255);hi.push((rowAddr>>8)&255);
    var rowSize=sparse.rows[pi].length?sparse.rows[pi].length:1;
    rowSizes.push(rowSize);rowAddr+=rowSize;
  }
  out.push('color_update_ptr_lo');emitBytes(out,lo);
  out.push('color_update_ptr_hi');emitBytes(out,hi);
  for(var ri=0;ri<sparse.rows.length;ri++){
    if(sparse.rows[ri].length)emitBytes(out,sparse.rows[ri]);else out.push('!byte $00');
  }
  }
  // TEST182: group's immutable double-length source is placed after color
  // tables, NEVER over the map, charsets, or dynamic raster screen buffers.
  if(d.anim175&&d.anim175.group&&d.anim175.group.type==='up'){
    var gg=d.anim175.group, rows=gg.h*8, sourceSize=gg.w*rows*2;
    var upper=colorMode==='sparse'?sparseBase+d.area.height*3+sparseStoredBytes:COLOR_DATA_BASE+d.colors.length;
    var groupBase=Math.max(0xa000,(upper+255)&0xff00),groupApprox=sourceSize+gg.w*gg.h*3+700;
    if(groupBase+groupApprox>0xd000)throw new Error('TEST182: Map Scroll + Group Animate requieren mas RAM segura. No se pisara el color ni el charset.');
    out.push('*=$'+('0000'+groupBase.toString(16)).slice(-4));
    out.push('; TEST182: standalone group scroll outside raster IRQ; map-first scheduling.');
    // IRQ only increments due ticks; full charset copy NEVER runs inside IRQ.
    out.push('group182_irq_tick');
    out.push(' dec group182_timer');
    out.push(' bne group182_irq_done');
    out.push(' lda #$'+hex2(gg.ticks));
    out.push(' sta group182_timer');
    out.push(' lda group182_pending');
    out.push(' cmp #$ff');
    out.push(' beq group182_irq_done');
    out.push(' inc group182_pending');
    out.push('group182_irq_done');out.push(' rts');
    out.push('group182_timer');out.push('!byte $'+hex2(gg.ticks));
    out.push('group182_pending');out.push('!byte $00');
    out.push('group182_active');out.push('!byte $00');
    out.push('group182_phase');out.push('!byte $00');
    out.push('group182_column');out.push('!byte $00');
    out.push('group182_tile_index');out.push('!byte $00');
    out.push('group182_col_src_lo');out.push('!byte $00');
    out.push('group182_col_src_hi');out.push('!byte $00');
    // 6502 (zp),Y requires pointers in ZERO PAGE: reserve $35-$38.
    out.push('group182_src_lo=$35');
    out.push('group182_src_hi=$36');
    out.push('group182_dest_lo=$37');
    out.push('group182_dest_hi=$38');
    out.push('group182_step');
    out.push(' lda group182_active');out.push(' bne group182_continue');
    out.push(' inc group182_phase');
    if(!(gg.w===2&&gg.h===8&&gg.ticks===1))out.push(' inc group182_phase'); // TEST155 legacy 1px/tick
    if(rows!==256){
      out.push(' lda group182_phase');out.push(' cmp #$'+hex2(rows));
      out.push(' bcc group182_phase_done');out.push(' sec');
      out.push(' sbc #$'+hex2(rows));out.push(' sta group182_phase');
      out.push('group182_phase_done');
    }
    out.push(' lda #$01');out.push(' sta group182_active');
    out.push(' lda #$00');out.push(' sta group182_column');
    out.push('group182_continue');
    out.push(' ldx group182_column');
    out.push(' lda group182_sources_lo,x');out.push(' clc');out.push(' adc group182_phase');out.push(' sta group182_src_lo');
    out.push(' lda group182_sources_hi,x');out.push(' adc #$00');out.push(' sta group182_src_hi');
    // multiply column index by group height (const), at most 256 total tiles
    out.push(' lda #$00');out.push(' sta group182_tile_index');
    out.push(' txa');out.push(' tax');
    out.push(' beq group182_col_base_ready');
    out.push('group182_col_base_loop');out.push(' clc');out.push(' lda group182_tile_index');
    out.push(' adc #$'+hex2(gg.h));out.push(' sta group182_tile_index');
    out.push(' dex');out.push(' bne group182_col_base_loop');
    out.push('group182_col_base_ready');
    out.push(' ldx #$'+hex2(gg.h));
    out.push('group182_each_tile');
    out.push(' ldy group182_tile_index');
    out.push(' lda group182_protected,y');
    out.push(' bne group182_tile_advance');
    out.push(' lda group182_dest_los,y');out.push(' sta group182_dest_lo');
    out.push(' lda group182_dest_his,y');out.push(' sta group182_dest_hi');
    out.push(' ldy #$00');
    out.push('group182_copy8');
    out.push(' lda (group182_src_lo),y');out.push(' sta (group182_dest_lo),y');
    out.push(' iny');out.push(' cpy #$08');out.push(' bne group182_copy8');
    out.push('group182_tile_advance');
    out.push(' clc');out.push(' lda group182_src_lo');out.push(' adc #$08');out.push(' sta group182_src_lo');
    out.push(' lda group182_src_hi');out.push(' adc #$00');out.push(' sta group182_src_hi');
    out.push(' inc group182_tile_index');
    out.push(' dex');out.push(' bne group182_each_tile');
    out.push(' inc group182_column');
    out.push(' lda group182_column');out.push(' cmp #$'+hex2(gg.w));
    out.push(' bne group182_step_done');
    out.push(' lda #$00');out.push(' sta group182_active');
    out.push(' dec group182_pending');
    out.push('group182_step_done');out.push(' rts');
    out.push('group182_sources_lo');
    // Symbolic low/high tables are NOT supported in LVLLVL !byte; calculate exact
    // sources from the concrete code-size address later? Instead use absolute
    // numeric labels with ACME <label syntax in LDA immediates, not !byte.
    // Source addresses calculated from the fixed-size group source block.
    // Emit numerical source table using a reserved constant base, independent
    // of varying assembler instruction lengths via a second * directive.
    var sourceBase=(groupBase+0x0800+255)&0xff00;
    var pos=sourceBase,los=[],his=[];
    for(var col=0;col<gg.w;col++){los.push(pos&255);his.push((pos>>8)&255);pos+=rows*2;}
    emitBytes(out,los);
    out.push('group182_sources_hi');emitBytes(out,his);
    out.push('group182_dest_los');emitBytes(out,gg.addresses.map(function(addr){return addr&255}));
    out.push('group182_dest_his');emitBytes(out,gg.addresses.map(function(addr){return (addr>>8)&255}));
    out.push('group182_protected');emitBytes(out,gg.protection);
    out.push('*=$'+('0000'+sourceBase.toString(16)).slice(-4));
    out.push('group182_original_sources');
    gg.columns.forEach(function(col){emitBytes(out,col)});
    if(pos>0xd000)throw new Error('TEST182: datos del Group Scroll invaden memoria de I/O; reducir el grupo o area de mapa.');
  }
  // TEST183 horizontal group compositor: pixels wrap across glyph boundaries.
  // Unlike Map Scroll, the pointers target only charset RAM (BANK1 or BANK2).
  // Work is one 8x8 tile per main-loop iteration, allowing the map to prepare
  // its next screen before any further animation work is scheduled.
  if(d.anim175&&d.anim175.group&&/^(left|right)$/.test(d.anim175.group.type)){
    var hgrp=d.anim175.group, gw=hgrp.w, gh=hgrp.h, total=gw*gh;
    var sbaseRaw=(colorMode==='sparse'?sparseBase+d.area.height*3+sparseStoredBytes:COLOR_DATA_BASE+d.colors.length);
    var hcodeBase=Math.max(0xa000,(sbaseRaw+255)&0xff00),hdataBase=(hcodeBase+0x0800+255)&0xff00;
    var dataLength=gw*gh*16; // each horizontal scanline is two copies of w chars
    if(hdataBase+dataLength>0xd000)throw new Error('TEST183: Group Scroll horizontal excede RAM segura; no se exportara parcialmente.');
    out.push('*=$'+('0000'+hcodeBase.toString(16)).slice(-4));
    out.push('; TEST183 independent horizontal group scroll '+hgrp.type+' with pixel wrap');
    out.push('group182_irq_tick');
    out.push(' dec group182_timer');out.push(' bne group182_irq_done');
    out.push(' lda #$'+hex2(hgrp.ticks));out.push(' sta group182_timer');
    out.push(' lda group182_pending');out.push(' cmp #$ff');out.push(' beq group182_irq_done');
    out.push(' inc group182_pending');
    out.push('group182_irq_done');out.push(' rts');
    out.push('group182_timer');out.push('!byte $'+hex2(hgrp.ticks));
    out.push('group182_pending');out.push('!byte $00');
    out.push('group182_active');out.push('!byte $00');
    out.push('group182_tile_index');out.push('!byte $00');
    out.push('group183_byte_phase');out.push('!byte $00');
    out.push('group183_bit_phase');out.push('!byte $00');
    out.push('group183_shift_count');out.push('!byte $00');
    out.push('group183_high');out.push('!byte $00');
    out.push('group183_low');out.push('!byte $00');
    out.push('group183_raster_left');out.push('!byte $00');
    // The grouped source/destination pointers occupy dedicated zero page
    // previously reserved by TEST182, never the map's source/dest pointers.
    out.push('group182_src_lo=$35');out.push('group182_src_hi=$36');
    out.push('group182_dest_lo=$37');out.push('group182_dest_hi=$38');
    out.push('group182_step');
    out.push(' lda group182_active');out.push(' bne group183_copy_next');
    // TEST185: 4px group phase step for horizontal Left/Right, to compare
    // against TEST184 2px and document the emergent Waves effect.
    // Only the immediate step differs in the generated PRG; one tile per
    // main-loop iteration still limits how fast a complete phase appears.
    var step=4;
    if(hgrp.type==='left'){
      out.push(' lda group183_bit_phase');out.push(' clc');out.push(' adc #$'+hex2(step));
      out.push(' cmp #$08');out.push(' bcc group183_left_no_carry');
      out.push(' sbc #$08');out.push(' pha');
      out.push(' inc group183_byte_phase');
      if(gw!==256){out.push(' lda group183_byte_phase');out.push(' cmp #$'+hex2(gw));out.push(' bne group183_left_keep_byte');out.push(' lda #$00');out.push(' sta group183_byte_phase');out.push('group183_left_keep_byte');}
      out.push(' pla');out.push('group183_left_no_carry');out.push(' sta group183_bit_phase');
    }else{
      out.push(' lda group183_bit_phase');out.push(' sec');out.push(' sbc #$'+hex2(step));
      out.push(' bcs group183_right_no_borrow');
      out.push(' clc');out.push(' adc #$08');out.push(' pha');
      out.push(' lda group183_byte_phase');out.push(' bne group183_right_dec_byte');
      out.push(' lda #$'+hex2(gw-1));out.push(' sta group183_byte_phase');out.push(' jmp group183_right_byte_done');
      out.push('group183_right_dec_byte');out.push(' dec group183_byte_phase');
      out.push('group183_right_byte_done');out.push(' pla');
      out.push('group183_right_no_borrow');out.push(' sta group183_bit_phase');
    }
    out.push(' lda #$01');out.push(' sta group182_active');
    out.push(' lda #$00');out.push(' sta group182_tile_index');
    out.push('group183_copy_next');
    out.push(' ldx group182_tile_index');
    out.push(' lda group182_protected,x');out.push(' bne group183_next_tile');
    out.push(' lda group182_dest_los,x');out.push(' sta group182_dest_lo');
    out.push(' lda group182_dest_his,x');out.push(' sta group182_dest_hi');
    out.push(' lda group183_source_los,x');out.push(' clc');out.push(' adc group183_byte_phase');out.push(' sta group182_src_lo');
    out.push(' lda group183_source_his,x');out.push(' adc #$00');out.push(' sta group182_src_hi');
    out.push(' lda #$08');out.push(' sta group183_raster_left');
    out.push('group183_raster_loop');
    out.push(' ldy #$00');out.push(' lda (group182_src_lo),y');out.push(' sta group183_high');
    out.push(' iny');out.push(' lda (group182_src_lo),y');out.push(' sta group183_low');
    out.push(' lda group183_bit_phase');out.push(' sta group183_shift_count');
    out.push(' beq group183_no_shift');
    out.push('group183_bit_loop');
    out.push(' asl group183_low');out.push(' rol group183_high');
    out.push(' dec group183_shift_count');out.push(' bne group183_bit_loop');
    out.push('group183_no_shift');
    out.push(' ldy #$00');out.push(' lda group183_high');out.push(' sta (group182_dest_lo),y');
    // Next raster row begins 2*width source bytes later (each row repeated
    // horizontally for wraparound). Destination charset advances one byte.
    out.push(' clc');out.push(' lda group182_src_lo');out.push(' adc #$'+hex2((2*gw)&255));out.push(' sta group182_src_lo');
    out.push(' lda group182_src_hi');out.push(' adc #$'+hex2((2*gw)>>8));out.push(' sta group182_src_hi');
    out.push(' inc group182_dest_lo');out.push(' bne group183_dest_advanced');out.push(' inc group182_dest_hi');out.push('group183_dest_advanced');
    out.push(' dec group183_raster_left');out.push(' bne group183_raster_loop');
    out.push('group183_next_tile');
    out.push(' inc group182_tile_index');
    out.push(' lda group182_tile_index');out.push(' cmp #$'+hex2(total&255));
    out.push(' bne group183_step_done');
    out.push(' lda #$00');out.push(' sta group182_active');
    out.push(' dec group182_pending');
    out.push('group183_step_done');out.push(' rts');
    // Source pointers point into the immutable doubled raster data.
    var sourceLos=[],sourceHis=[];
    for(var cx2=0;cx2<gw;cx2++)for(var cy2=0;cy2<gh;cy2++){
      var address183=hdataBase+cy2*8*(gw*2)+cx2;
      sourceLos.push(address183&255);sourceHis.push((address183>>8)&255);
    }
    out.push('group183_source_los');emitBytes(out,sourceLos);
    out.push('group183_source_his');emitBytes(out,sourceHis);
    out.push('group182_dest_los');emitBytes(out,hgrp.addresses.map(function(a){return a&255}));
    out.push('group182_dest_his');emitBytes(out,hgrp.addresses.map(function(a){return a>>8}));
    out.push('group182_protected');emitBytes(out,hgrp.protection);
    out.push('*=$'+('0000'+hdataBase.toString(16)).slice(-4));
    out.push('group183_original_sources');
    for(var ry=0;ry<gh*8;ry++){
      var rowBytes=[];
      for(var rx=0;rx<gw;rx++){
        var tileCode=hgrp.cells[rx][Math.floor(ry/8)];
        var px=hgrp.tiles[tileCode].data[0],mask=0;
        for(var bit=0;bit<8;bit++)if(px[(ry%8)*8+bit])mask|=1<<(7-bit);
        rowBytes.push(mask);
      }
      emitBytes(out,rowBytes.concat(rowBytes));
    }
  }
  return out.join('\n');
}

function assemblePRG(self,source){
  var assembler=g_app&&g_app.assembler;if(!assembler)throw new Error('Assembler de LVLLVL no disponible.');
  var result=assembler.assemble(source,0x0801);
  if(!result||!result.success){var msgs=[];if(result&&result.errors)for(var i=0;i<result.errors.length;i++)msgs.push(result.errors[i].message||String(result.errors[i]));throw new Error('Error ensamblando TEST86'+(msgs.length?': '+msgs.join(' | '):'.'));}
  var mem=assembler.getMemory(),start=result.start,end=result.end,prg=new Uint8Array(2+(end-start));prg[0]=start&255;prg[1]=(start>>8)&255;for(var a=start,p=2;a<end;a++,p++)prg[p]=mem[a]&255;self.prg=prg;return prg;
}

// TEST173: A large Screen is NOT evidence that Map Scroll is active.
// Rico's Window selects a still-image viewport when ALL Map Scroll types are OFF.
// Project ONLY for export; never mutate the artwork or the real frame rectangles.
function hasActiveMapScroll(self){
  var ed=self&&self.editor,fc=ed?frameCount(ed):0;
  for(var n=0;n<fc;n++) {
    var cfg=getCfg(ed,n);
    if(cfg&&cfg.type&&String(cfg.type).trim()!=='')return true;
  }
  return false;
}
function exportRicoWindowOnly(self,args){
  var ed=self.editor,oldGraphic=ed.graphic,oldLayer=ed.layers.getSelectedLayerObject();
  if(!oldLayer||typeof oldLayer.getCell!=='function')throw new Error('No se encontro la capa Grid para exportar Rico\'s Window.');
  var oldSize=gridSize(ed),originalFrames=oldGraphic.frames||[];
  // Read effective Window coordinates BEFORE constructing the virtual graphic.
  // Capture a separate geometry for each frame (does not change original data).
  var windows=originalFrames.map(function(fr,n){
    var w=getWindowCfg(ed,n)||{};
    var x=clamp(w.x,0,oldSize.width-1,0),y=clamp(w.y,0,oldSize.height-1,0);
    return {x:x,y:y,width:clamp(w.width,1,Math.min(40,oldSize.width-x),Math.min(40,oldSize.width-x)),
                 height:clamp(w.height,1,Math.min(25,oldSize.height-y),Math.min(25,oldSize.height-y))};
  });
  var virtualFrames=originalFrames.map(function(fr,n){
    var w=windows[n],f=Object.assign({},fr);
    f.ricoWindowDimensionV1={version:1,x:0,y:0,width:w.width,height:w.height,clearOutside:false};
    f.ricoScrollAreaV1={version:1,x:0,y:0,width:40,height:25,clearOutside:false};
    return f;
  });
  var graphic=Object.create(oldGraphic);
  graphic.frames=virtualFrames;
  graphic.getGridWidth=function(){return 40;};
  graphic.getGridHeight=function(){return 25;};
  var layer=Object.create(oldLayer);
  layer.getCell=function(pos){
    var n=Number(pos.frame)||0,w=windows[n]||windows[0];
    if(!w || pos.x<0||pos.y<0||pos.x>=w.width||pos.y>=w.height) {
      // Empty out-of-Window positions in the temporary export only; this is
      // distinct from modifying the original Screen or its tileset.
      return {t:0,fc:0,bc:0};
    }
    var point=Object.assign({},pos,{x:pos.x+w.x,y:pos.y+w.y});
    return oldLayer.getCell.call(oldLayer,point);
  };
  var layers=Object.create(ed.layers);
  layers.getSelectedLayerObject=function(){return layer;};
  var editor=Object.create(ed);
  editor.graphic=graphic;editor.layers=layers;
  var orig=self.editor,nativeExport=window.RICO_TEST168_NATIVE_EXPORT;
  if(typeof nativeExport!=='function')throw new Error('No se encontro el exportador nativo TEST77.');
  var opts=Object.assign({},args,{gridWidth:40,gridHeight:25});
  self.editor=editor;
  try{
    console.log('[RICO TEST173] Screen '+oldSize.width+'x'+oldSize.height+' -> static Rico Window '+windows.map(function(w){return w.width+'x'+w.height+' @ '+w.x+','+w.y;}).join(' / '));
    return nativeExport.call(self,opts);
  }finally{self.editor=orig;}
}

// TEST181: Vertical Map Scroll is a 40-character VIC viewport, not a
// requirement that the *editable source Screen* be exactly 40 columns wide.
// Translate only the 40 columns selected by Rico's Window into the existing,
// byte-tested 40xN vertical player. Keep all source rows for scroll and all
// original artwork/Window/Scroll Area metadata unchanged after exporting.
function exportWideVerticalWindow(self,args){
  var originalEditor=self.editor,graphic0=originalEditor.graphic;
  var size=gridSize(originalEditor),numFrames=frameCount(originalEditor);
  if(numFrames!==1)throw new Error('Map Scroll vertical de Screen ancho requiere un solo frame hasta implementar transiciones multiframe.');
  var cfg=getCfg(originalEditor,0)||{};
  if(cfg.type!=='up'&&cfg.type!=='down')throw new Error('Solo Up/Down tienen hoy un motor vertical para Screen ancho. No se exportara un PRG clasico sin scroll.');
  var window0=getWindowCfg(originalEditor,0)||{},area0=getScrollAreaCfg(originalEditor,0)||{};
  var wx=Number(window0.x)||0,wy=Number(window0.y)||0;
  var ww=Number(window0.width)||0,wh=Number(window0.height)||0;
  var ax=Number(area0.x)||0,ay=Number(area0.y)||0;
  var aw=Number(area0.width)||0,ah=Number(area0.height)||0;
  if(!Number.isInteger(wx)||!Number.isInteger(wy)||!Number.isInteger(ax)||!Number.isInteger(ay)||
     !Number.isInteger(ww)||!Number.isInteger(wh)||!Number.isInteger(aw)||!Number.isInteger(ah))
    throw new Error('Window y Scroll Area necesitan coordenadas enteras de caracteres.');
  if(ww!==40||(wh!==24&&wh!==25))
    throw new Error("Para Map Scroll vertical, Rico's Window debe medir 40x24 o 40x25. El Screen original no se modifica.");
  if(wx<0||wy<0||wx+40>size.width||wy+wh>size.height)
    throw new Error("La Rico's Window esta fuera del Screen "+size.width+'x'+size.height+'.');
  if(ax<0||ay<0||aw<40||ah<25||ax+aw>size.width||ay+ah>size.height ||
     wx<ax||wx+40>ax+aw || wy<ay||wy+wh>ay+ah)
    throw new Error("La Rico's Window debe estar completamente contenida en Rico's Scroll Area.");
  var originalLayer=originalEditor.layers&&originalEditor.layers.getSelectedLayerObject&&originalEditor.layers.getSelectedLayerObject();
  if(!originalLayer||typeof originalLayer.getCell!=='function')throw new Error('No se encontro la capa Grid del mapa grande.');
  var virtualGraphic=Object.create(graphic0);
  virtualGraphic.frames=[Object.assign({},graphic0.frames[0],{
    ricoWindowDimensionV1:{version:1,x:0,y:wy,width:40,height:wh,clearOutside:false},
    ricoScrollAreaV1:{version:1,x:0,y:ay,width:40,height:ah,clearOutside:false}
  })];
  virtualGraphic.getGridWidth=function(){return 40;};
  virtualGraphic.getGridHeight=function(){return size.height;};
  var virtualLayer=Object.create(originalLayer);
  virtualLayer.getCell=function(pos){
    // 0..39 in PRG source is Window X..X+39 in the real 45/50/... Screen.
    return originalLayer.getCell.call(originalLayer,Object.assign({},pos,{x:pos.x+wx}));
  };
  var virtualLayers=Object.create(originalEditor.layers);
  virtualLayers.getSelectedLayerObject=function(){return virtualLayer;};
  var virtualEditor=Object.create(originalEditor);
  virtualEditor.graphic=virtualGraphic;
  virtualEditor.layers=virtualLayers;
  var opts=Object.assign({},args,{gridWidth:40,gridHeight:size.height});
  self.editor=virtualEditor;
  try{
    console.log('[RICO TEST181] Vertical Up/Down: Screen '+size.width+'x'+size.height+
      ' -> temporary 40x'+size.height+' source at Window X='+wx+', Y='+wy+
      '; Scroll Area Y='+ay+', H='+ah+' (source unchanged)');
    // The existing TEST168 40xN path now owns compilation, color tables,
    // double buffering, both charsets and switch bank; never copy the old map.
    return ToPRGAdv.prototype.createPRG.call(self,opts);
  }finally{
    self.editor=originalEditor;
  }
}

// TEST168 lateral maps: export the requested 25-row viewport using the existing
// tested 40x25 horizontal player. No changed editor state or user artwork.
function isHorizontalProject(self){
  var e=self&&self.editor;if(!e)return false;
  var n=frameCount(e);
  if(n<1||n>32)return false;
  var anyLateral=false;
  for(var f=0;f<n;f++){
    var t=(getCfg(e,f)||{}).type||'';
    if(!/^(|left|right|pingpong-left|pingpong-right|move-left|move-right|movein-left|movein-right)$/.test(t))return false;
    if(t)anyLateral=true;
  }
  return anyLateral;
}
function exportHorizontalProject(self,args){
  var ed=self.editor,oldGraphic=ed.graphic,oldLayer=ed.layers.getSelectedLayerObject();
  var originalFrames=oldGraphic.frames||[];
  var rows=[];
  var virtualFrames=originalFrames.map(function(fr,n){
    var w=getWindowCfg(ed,n),y=clamp(w.y,0,gridSize(ed).height-25,0);
    rows.push(y);
    var f=Object.assign({},fr);
    f.ricoWindowDimensionV1={version:1,x:0,y:0,width:40,height:Math.min(25,w.height||25)};
    f.ricoScrollAreaV1={version:1,x:0,y:0,width:40,height:25};
    return f;
  });
  var graphic=Object.create(oldGraphic);
  graphic.frames=virtualFrames;
  graphic.getGridWidth=function(){return 40;};
  graphic.getGridHeight=function(){return 25;};
  var layer=Object.create(oldLayer);
  layer.getCell=function(pos){
    return oldLayer.getCell.call(oldLayer,{x:pos.x,y:pos.y+rows[pos.frame||0],frame:pos.frame});
  };
  var layers=Object.create(ed.layers);
  layers.getSelectedLayerObject=function(){return layer;};
  var editor=Object.create(ed);
  editor.graphic=graphic;
  editor.layers=layers;
  var orig=self.editor;
  var nativeExport=window.RICO_TEST168_NATIVE_EXPORT;
  if(typeof nativeExport!=='function')throw new Error('Motor horizontal TEST77 no disponible.');
  var opts=Object.assign({},args,{gridWidth:40,gridHeight:25});
  self.editor=editor;
  try{return nativeExport.call(self,opts);}finally{self.editor=orig;}
}
var prev=ToPRGAdv.prototype.createPRG;
ToPRGAdv.prototype.createPRG=function(args){
  args=args||{};
  if(!isLargeCandidate(this))return prev.apply(this,arguments);
  try{
    // TEST173: no Map Scroll selected => export the configured Rico's Window
    // through the native character-animation/bank-switch runtime.
    if(!hasActiveMapScroll(this))return exportRicoWindowOnly(this,args);
    // TEST181: never silently export an old 40x25 PRG for wide maps.
    // For vertical motion the original Window selects a non-destructive
    // 40-column source; for horizontal motion a full-width scroller is needed.
    var originalSize=gridSize(this.editor);
    if(originalSize.width!==40){
      if(isHorizontalProject(this))throw new Error('Map Scroll horizontal sobre un Screen de '+originalSize.width+' columnas necesita un motor de ancho variable. TEST181 no recorta el mapa ni genera un PRG sin scroll.');
      return exportWideVerticalWindow(this,args);
    }
    if(isHorizontalProject(this))return exportHorizontalProject(this,args);
    var d=collect(this),source=buildSource(d),bytes=assemblePRG(this,source),fn=args.filename||'rico-large-map-40x'+d.height+'.prg';if(!/\.prg$/i.test(fn))fn+='.prg';
    console.log('[RICO TEST168 LARGE MAP] LARGE MAP exported: Screen 40x'+d.height+' | Window 40x'+d.window.height+' | Scroll Area 40x'+d.area.height+' | '+d.type+' | '+d.pixels+'px/'+d.ticks+'t');
    if(args.download===false)return bytes;if(typeof window.download==='function'){window.download(bytes,fn,'application/prg');return bytes;}throw new Error('download() missing');
  }catch(e){console.error('[RICO TEST168 LARGE MAP]',e);alert('No se pudo exportar el mapa: '+e.message);return false;}
};

window.RICO_TEST173_WINDOW_STATIC_EXPORT={hasActiveMapScroll:hasActiveMapScroll,exportRicoWindowOnly:exportRicoWindowOnly};
window.RICO_TEST168_PRG_LARGE_MAP={buildSource:buildSource,vertical:true,screenWidth:40,maxMapHeight:MAX_MAP_HEIGHT,windowHeights:[24,25],types:['up','down'],sourceMapSeparateFromVIC:true,colorMapBase:COLOR_DATA_BASE,perCellColors:true,sparseColorCommit:true,blankCellsUseDominantVisibleColor:true,doubleBuffer:true,pipelined8px:true,maxPalSpeed:'8px/frame'};
console.log('[RICO TEST181] 40-column viewport export from wide source Screen, no classic fallback.');
})();
