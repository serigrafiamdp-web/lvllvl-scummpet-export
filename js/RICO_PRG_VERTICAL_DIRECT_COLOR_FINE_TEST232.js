(function(){
'use strict';
// TEST232: use the TEST227 precomputed direct Color RAM changes on Up/Down
// with fine scrolling (1..7 pixels). Change only commit_prepared's color
// writer; the movement scheduler, 25-row VIC-II, char buffer, and music
// remain byte-identical. 8px continues using verified TEST227.
var E=window.RICO_TEST168_PRG_LARGE_MAP;
var T=window.RICO_TEST226_VERTICAL_DIRECT_COLOR;
if(!E||!T)return;
var old=E.buildSource,NL=String.fromCharCode(10);
function byte(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function word(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function rows(a){var x=[];for(var i=0;i<a.length;i+=16)
 x.push('!byte '+a.slice(i,i+16).map(byte).join(','));return x.join(NL);}
function codeAndTables(p){
 var out=['*='+word(p.origin),'color232_ptrlo',rows(p.pointer.map(function(v){return v&255;})),
  'color232_ptrhi',rows(p.pointer.map(function(v){return v>>8;}))];
 for(var f=0;f<p.blocks.length;f++){
  out.push('color232_frame_'+f);
  Array.prototype.push.apply(out,p.blocks[f]);
 }
 return out.join(NL)+NL;
}
function dispatcher(){
 return [
 'commit_direct_color232',
 ' ldx camera_row',
 ' lda color232_ptrlo,x',' sta color232_jump+1',
 ' lda color232_ptrhi,x',' sta color232_jump+2',
 'color232_jump',' jmp color232_frame_0'
 ].join(NL)+NL;
}
E.buildSource=function(d){
 var source=old(d);
 window.RICO_TEST232_LAST_BUILD={selected:false,direction:d&&d.type,pixels:d&&d.pixels,reason:'original'};
 if(!d||(d.type!=='up'&&d.type!=='down')||d.pixels<1||d.pixels>7)return source;
 if(!d.area||d.area.width!==40)return source;
 // Call the exact TEST227 planner with a virtual 8px descriptor.
 // It computes colors for one camera-row change. The fine-scroll code
 // already advances camera_row only when preparing that next character.
 var virtual=Object.assign({},d,{pixels:8});
 var p=T.plan(virtual,source);
 if(!p){
  window.RICO_TEST232_LAST_BUILD.reason='no safe direct color layout; keep existing';
  return source;
 }
 var label='commit_prepared'+NL+' inc meter_commit223'+NL;
 if(source.split(label).length!==2)throw Error('TEST232: fine scroll commit changed');
 var pos=source.indexOf(label)+label.length;
 var choices=[' jsr apply_vertical_color221'+NL,' jsr vertical_color_commit222'+NL,' jsr apply_sparse_colors'+NL];
 var selected=choices.filter(function(x){return source.slice(pos,pos+x.length)===x;});
 if(selected.length!==1)throw Error('TEST232: no unique Color RAM call at fine commit');
 source=source.slice(0,pos)+' jsr commit_direct_color232'+NL+
   source.slice(pos+selected[0].length);
 var charset='*=$3000'+NL;
 if(source.split(charset).length!==2)throw Error('TEST232: charset boundary changed');
 source=source.replace(charset,dispatcher()+charset);
 // Keep code/tables separate from the known pre-existing $A100+ RLE area.
 var original='*=$a100'+NL,compiled=codeAndTables(p);
 if(source.includes(original))source=source.replace(original,compiled+original);
 else source+=NL+compiled;
 window.RICO_TEST232_LAST_BUILD={
  selected:true,direction:d.type,pixels:d.pixels,
  maxWrites:Math.max.apply(null,p.totals),tableBytes:p.end-p.origin,
  renderer:'TEST227 direct color on fine-scroll character commits'
 };
 console.log('[RICO TEST232 FINE COLOR]',window.RICO_TEST232_LAST_BUILD);
 return source;
};
window.RICO_TEST232_DIRECT_FINE={version:232,previous:old};
})();