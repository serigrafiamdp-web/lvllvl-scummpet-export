/* TEST352: nonblocking standard-text (256 glyphs) fixed frames + selected PSID.
 * The EBCM+PSID route remains TEST351; normal/scroll/export paths unchanged.
 * Uses the TEST351 memory-safe audio graft on a minimal 40x25 static-frame
 * text source; no TEST206/TEST207 exact IRQ anchor patching.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined'||!window.RICO_TEST351_ECM_SID||
   !window.RICO_TEST207_ORIGINAL_SID)return;
var previous=ToPRGAdv.prototype.createPRG,
    bridge=window.RICO_TEST351_ECM_SID,
    audio=window.RICO_TEST207_ORIGINAL_SID,
    last={version:352,status:'READY',error:null,result:null};
function h2(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function h4(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function lines(arr,label,values){
 arr.push(label);
 for(var i=0;i<values.length;i+=16)arr.push('!byte '+values.slice(i,i+16).map(h2).join(','));
}
function selected(args){
 var state=audio.getState&&audio.getState();
 return !!(args&&(args.sidData||args.music==='sid')||state&&state.enabled);
}
function route(self,args){
 var ed=self&&self.editor,graphic=ed&&ed.graphic,
     frames=graphic&&graphic.frames||[],
     layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
     mode=layer&&layer.getScreenMode&&layer.getScreenMode();
 if(mode!=='textmode'&&mode!=='standard'&&mode!=='text')
  return 'other screen mode';
 if(frames.length<2||frames.length>255||!graphic||!graphic.getGridWidth||!graphic.getGridHeight||
   graphic.getGridWidth()!==40||graphic.getGridHeight()!==25)
  return 'other size or frame count';
 if(frames.some(function(f){var t=String(f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type||'').toLowerCase();
   return t&&t!=='off'&&t!=='none'&&t!=='false'&&t!=='disabled';}))
  return 'Map Scroll';
 if(frames.some(function(f){return f&&Number(f.charsetBank)===2;}))return 'BANK2';
 var ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!ts)return 'no charset';
 var record=ts.getDocRecord&&ts.getDocRecord(),data=record&&record.data||{},groups=data.ricoGroupAnimationsV1||{};
 if((groups.bank1||[]).some(function(x){return x&&x.type;})||
    (groups.bank2||[]).some(function(x){return x&&x.type;}))return 'Group Animate';
 if([ts.tileData,data.ricoCharsetBank2&&data.ricoCharsetBank2.tileData].some(function(tiles){
   return tiles&&tiles.some(function(t){var a=t&&t.props&&t.props.animated;return a&&a!=='none';});
 }))return 'animated characters';
 return null;
}
function foreground(v,frame,x,y){
 v=Number(v);if(!Number.isInteger(v)||v<0||v>15)
  throw Error('TEST352: foreground C64 inválido en frame '+frame+' X'+x+' Y'+y);
 return v;
}
function collect(self){
 var ed=self.editor,g=ed.graphic,layer=ed.layers.getSelectedLayerObject(),
     ts=layer.getTileSet(),frames=g.frames||[],gly=[];
 if(!ts.tileData||ts.tileData.length<256||ts.getTileWidth()!==8||ts.getTileHeight()!==8)
  throw Error('TEST352: charset estándar incompleto; dejará actuar al exportador anterior.');
 for(var id=0;id<256;id++){
  var glyph=ts.tileData[id]&&ts.tileData[id].data&&ts.tileData[id].data[0];
  if(!glyph||glyph.length!==64)throw Error('TEST352: datos de glifo '+id+' incompletos.');
  for(var row=0;row<8;row++){
   var b=0;
   for(var x=0;x<8;x++)if(glyph[row*8+x])b|=128>>>x;
   gly.push(b);
  }
 }
 var plans=[];
 for(var fi=0;fi<frames.length;fi++){
  var f=frames[fi],dur;
  try{dur=g.getFrameDuration(fi);}catch(e){}
  if(dur===undefined||dur===null)dur=f.duration;
  dur=Number(dur);
  if(!Number.isInteger(dur)||dur<1||dur>65535)
   throw Error('TEST352: duración de frame '+(fi+1)+' no representable en 16 bits.');
  var bg=Number(layer.getBackgroundColor(fi)),border=Number(layer.getBorderColor(fi));
  if(!Number.isInteger(bg)||bg<0||bg>15||!Number.isInteger(border)||border<0||border>15)
   throw Error('TEST352: color global fuera de paleta C64.');
  var screen=[],colors=[];
  for(var y=0;y<25;y++)for(var x=0;x<40;x++){
   var cell=layer.getCell({x:x,y:y,frame:fi})||{},tile=Number(cell.t);
   if(!Number.isInteger(tile)||tile<0||tile>255)
    throw Error('TEST352: índice de glifo fuera de 0..255 frame '+(fi+1)+' X'+x+' Y'+y);
   screen.push(tile);colors.push(foreground(cell.fc,fi+1,x,y));
  }
  plans.push({screen:screen,colors:colors,duration:dur,bg:bg,border:border,changes:0,changedChars:0,changedColors:0});
 }
 var patch=[],patchBytes=0;
 for(var i=0;i<plans.length;i++){
  var before=plans[(i+plans.length-1)%plans.length],after=plans[i],lineset=['patch_frame_'+i],count=0,changed=0,cc=0,fc=0;
  for(var pos=0;pos<1000;pos++){
   var ch=before.screen[pos]!==after.screen[pos],co=before.colors[pos]!==after.colors[pos];
   if(!ch&&!co)continue;
   changed++;
   if(ch){lineset.push(' lda #'+h2(after.screen[pos]),' sta '+h4(0x0400+pos));count++;cc++;}
   if(co){lineset.push(' lda #'+h2(after.colors[pos]),' sta '+h4(0xd800+pos));count++;fc++;}
  }
  lineset.push(' rts');patchBytes+=5*count+1;
  after.changes=changed;after.changedChars=cc;after.changedColors=fc;
  if(count*6+240>5500)throw Error('TEST352: transición '+(i+1)+' excede VBlank; requiere otro motor.');
  patch.push(lineset.join('\n'));
 }
 if(patchBytes>0x2000)throw Error('TEST352: los parches no caben en $4000-$5FFF; otro exportador decidirá.');
 return {frames:plans,glyphs:gly,patch:patch,patchBytes:patchBytes};
}
function build(plan){
 var fs=plan.frames,n=fs.length,v=[
 '; TEST352 native standard text 256 chars + fixed multiframe; SID graft comes from TEST351',
 '*=$0801','!byte $0b,$08,$0a,$00,$9e,$38,$31,$39,$32,$00,$00,$00',
 '*=$2000','frame_idx=$02','duration_lo=$03','duration_hi=$04',
 'start',
 ' sei',' lda #$35',' sta $01',
 ' lda #$0b',' sta $d011',
 ' lda #$7f',' sta $dc0d',' sta $dd0d',
 ' lda $dc0d',' lda $dd0d',
 ' lda $dd00',' and #$fc',' ora #$03',' sta $dd00',
 ' lda #$00',' sta frame_idx',
 ' lda #'+h2(fs[0].duration&255),' sta duration_lo',
 ' lda #'+h2(fs[0].duration>>8),' sta duration_hi',
 ' ldx #$00',
 'frame350_initialize',
 ' lda $6000,x',' sta $0400,x',
 ' lda $6100,x',' sta $0500,x',
 ' lda $6200,x',' sta $0600,x',
 ' lda $6300,x',' sta $0700,x',
 ' lda $6400,x',' sta $d800,x',
 ' lda $6500,x',' sta $d900,x',
 ' lda $6600,x',' sta $da00,x',
 ' lda $6700,x',' sta $db00,x',
 ' inx',' bne frame350_initialize',
 ' lda #'+h2(fs[0].bg),' sta $d021',
 ' lda #'+h2(fs[0].border),' sta $d020',
 ' lda #$00',' sta $d015',
 ' lda #$08',' sta $d016',
 ' lda #$1e',' sta $d018',
 ' lda #$1b',' sta $d011',
 ' lda #$fc',' sta $d012',
 ' lda #<frame350_irq',' sta $fffe',
 ' lda #>frame350_irq',' sta $ffff',
 ' lda #$01',' sta $d019',' sta $d01a',
 ' cli',
 'frame350_idle',' jmp frame350_idle',
 'frame350_irq',
 ' pha',' txa',' pha',' tya',' pha',
 ' lda #$01',' sta $d019',
 'frame350_vblank',
 ' ldx frame_idx',
 ' lda frame350_bg,x',' sta $d021',
 ' lda #$00',' sta $d022',' sta $d023',' sta $d024',
 ' lda duration_lo',' bne frame350_decrease_lo',
 ' dec duration_hi',
 'frame350_decrease_lo',' dec duration_lo',
 ' lda duration_lo',' ora duration_hi',' bne frame350_exit',
 ' inc frame_idx',' lda frame_idx',' cmp #'+h2(n),' bcc frame350_next_frame',
 ' lda #$00',' sta frame_idx',
 'frame350_next_frame',
 ' ldx frame_idx',
 ' lda frame350_dur_lo,x',' sta duration_lo',
 ' lda frame350_dur_hi,x',' sta duration_hi',
 ' lda frame350_border,x',' sta $d020',
 ' lda frame350_bg,x',' sta $d021',
 ' jsr frame350_patch',
 'frame350_exit',
 ' pla',' tay',' pla',' tax',' pla',' rti',
 'frame350_patch',
 ' ldx frame_idx'
 ];
 for(var i=0;i<n-1;i++)v.push(' cpx #'+h2(i),' bne frame350_try_'+(i+1),' jmp patch_frame_'+i,'frame350_try_'+(i+1));
 v.push(' jmp patch_frame_'+(n-1));
 lines(v,'frame350_dur_lo',fs.map(function(f){return f.duration&255;}));
 lines(v,'frame350_dur_hi',fs.map(function(f){return f.duration>>8;}));
 lines(v,'frame350_bg',fs.map(function(f){return f.bg;}));
 lines(v,'frame350_border',fs.map(function(f){return f.border;}));
 v.push('*=$3800');
 lines(v,'frame350_charset',plan.glyphs);
 v.push('*=$4000');
 plan.patch.forEach(function(p){v.push(p);});
 v.push('*=$6000');
 var map=fs[0].screen.slice(),fg=fs[0].colors.slice();
 while(map.length<1024)map.push(0);
 while(fg.length<1024)fg.push(0);
 lines(v,'frame350_screen',map);
 v.push('*=$6400');lines(v,'frame350_color',fg);
 return v.join('\n')+'\n';
}
function export352(self,args,raw){
 var data=audio.parseSID(raw),timing=bridge.speedInfo(data,args||{}),
     plan=collect(self),source=bridge.build(plan,data,timing,build(plan)),
     bytes=bridge.assemble(source,plan,data);
 self.prg=bytes;
 last.result={mode:'STANDARD TEXT + PSID',frames:plan.frames.length,
  sidLoad:h4(data.load),sidPlay:h4(data.play),rateHz:timing.hz,clock:timing.note,
  changed:plan.frames.map(function(f){return{chars:f.changedChars,colors:f.changedColors};}),bytes:bytes.length};
 last.error=null;last.status='ASSEMBLED';
 window.RICO_TEST352_LAST_EXPORT=last.result;
 var status=typeof document!=='undefined'&&document.getElementById('ricoSid207Status');
 if(status)status.textContent='TEST352 STANDARD '+plan.frames.length+' frames + PSID · '+timing.hz.toFixed(1)+'Hz';
 if(args&&args.download===false)return bytes;
 var name=(args&&args.filename||'C64_FRAMES').replace(/\.prg$/i,'')+'_TEST352_SID.prg';
 if(typeof window.download!=='function')throw Error('TEST352: descarga no disponible.');
 window.download(bytes,name,'application/prg');
 return bytes;
}
ToPRGAdv.prototype.createPRG=function(args){
 if(!selected(args))return previous.apply(this,arguments);
 var reason=route(this,args||{});
 if(reason){last.status='DELEGATED '+reason;return previous.apply(this,arguments);}
 try{collect(this);}catch(e){last.status='DELEGATED static code: '+String(e&&e.message||e);return previous.apply(this,arguments);}
 var self=this;
 if(args&&args.sidData){
  try{return export352(self,args,args.sidData);}
  catch(e){last.error=String(e&&e.message||e);last.status='ERROR';
   console.error('[TEST352 STANDARD SID]',e);if(typeof window.alert==='function')window.alert('TEST352: '+last.error);return false;}
 }
 last.status='READING SID';
 bridge.readSID(args||{}).then(function(bytes){
  try{export352(self,args,bytes);}
  catch(e){last.error=String(e&&e.message||e);last.status='ERROR';
   console.error('[TEST352 STANDARD SID]',e);
   if(typeof window.alert==='function')window.alert('TEST352: '+last.error);}
 }).catch(function(e){last.error=String(e&&e.message||e);last.status='ERROR';
  if(typeof window.alert==='function')window.alert('TEST352: '+last.error);});
 return true;
};
window.RICO_TEST352_STANDARD_SID={version:352,route:route,collect:collect,build:build,export:export352,last:last};
console.log('[TEST352] Standard 256-char frames + selected PSID; no new Map Scroll restrictions.');
})();