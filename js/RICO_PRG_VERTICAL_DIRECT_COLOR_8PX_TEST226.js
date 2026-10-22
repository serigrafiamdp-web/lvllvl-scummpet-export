(function(){
'use strict';
// TEST227: fix TEST226 freeze by replacing wrongly encoded indirect JMP with self-modified absolute JMP.
// Only Up/Down, 8px, dynamic color, single-frame. All other paths unchanged.
var V=window.RICO_TEST168_PRG_LARGE_MAP;if(!V)return;
var previous=V.buildSource,NL=String.fromCharCode(10);
function hex(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function h8(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function emitBytes(out,arr){
 for(var i=0;i<arr.length;i+=16)out.push('!byte '+arr.slice(i,i+16).map(h8).join(','));
}
function plan(d,source){
 if(d.pixels!==8||(d.type!=='up'&&d.type!=='down')||!d.area||d.area.width!==40)return null;
 if(d.anim175&&(d.anim175.group||d.anim175.switchTicks||(d.anim175.records||[]).length))return null;
 // Original uniform and already-sparse color paths are kept verbatim.
 if(!source.includes('dynamic_color_row_loop'+NL))return null;
 var height=d.area.height,colors=d.colors;
 if(height<25||height>255||colors.length<(d.area.y+height)*40)return null;
 var origin=0x7000+((colors.length+255)&0xff00),cursor=origin+height*2;
 if(origin<0x7000||cursor>=0xa000)return null;
 var pointer=[],blocks=[],totals=[],costs=[];
 for(var camera=0;camera<height;camera++){
  var previousCamera=(camera+(d.type==='up'?height-1:1))%height;
  var instructions=[],count=0,groups=0;
  for(var color=0;color<16;color++){
   var addresses=[];
   for(var row=0;row<25;row++){
    var oldIndex=(d.area.y+(previousCamera+row)%height)*40,
        newIndex=(d.area.y+(camera+row)%height)*40;
    for(var x=0;x<40;x++)
     if((colors[newIndex+x]&15)===color&&(colors[oldIndex+x]&15)!==color)
      addresses.push(0xd800+row*40+x);
   }
   if(!addresses.length)continue;
   groups++;count+=addresses.length;
   instructions.push(' lda #'+h8(color));
   for(var k=0;k<addresses.length;k++)instructions.push(' sta '+hex(addresses[k]));
  }
  instructions.push(' rts');
  var size=2*groups+3*count+1;
  if(cursor+size>0xa000)return null; // byte-exact safe fallback
  pointer.push(cursor);cursor+=size;
  blocks.push(instructions);totals.push(count);costs.push(2*groups+5*count+6);
 }
 return{origin:origin,end:cursor,pointer:pointer,blocks:blocks,totals:totals,costs:costs};
}
function compiled(p){
 var result=['*='+hex(p.origin),'color226_ptrlo'];
 emitBytes(result,p.pointer.map(function(a){return a&255;}));
 result.push('color226_ptrhi');
 emitBytes(result,p.pointer.map(function(a){return a>>8;}));
 for(var i=0;i<p.blocks.length;i++){
  result.push('color226_frame_'+i);
  Array.prototype.push.apply(result,p.blocks[i]);
 }
 return result.join(NL)+NL;
}
function runtime(){
 return ['commit_direct_color226',
  ' ldx camera_row',
  // The LVLLVL assembler does NOT encode JMP ($0018) correctly;
  // TEST226 emitted $4C $00 $00 -> JMP $0000 and froze.
  // Use an absolute JMP whose two operand bytes are patched at runtime.
  ' lda color226_ptrlo,x',' sta color226_jump227+1',
  ' lda color226_ptrhi,x',' sta color226_jump227+2',
  'color226_jump227',' jmp color226_frame_0'].join(NL)+NL;
}
V.buildSource=function(d){
 var source=previous(d),p=plan(d,source);
 window.RICO_TEST226_LAST_BUILD={
  direction:d.type,pixels:d.pixels,direct:!!p,
  maxWrites:p?Math.max.apply(null,p.totals):null,
  totalWrites:p?p.totals.reduce(function(a,b){return a+b;},0):null,
  size:p?p.end-p.origin:null
 };
 if(d.pixels===8&&(d.type==='up'||d.type==='down'))
  console.log('[RICO TEST227 VERTICAL 8PX]',
   p?'DIRECT COLOR RAM':'LEGACY COLOR',p?'max '+window.RICO_TEST226_LAST_BUILD.maxWrites+' STA/frame':'');
 if(!p)return source;
 var from=NL+'commit_fast8'+NL;
 var begin=source.indexOf(from),end=source.indexOf(NL+'commit_fast8_down'+NL,begin+2);
 if(begin<0||end<0)throw Error('TEST226 changed fast8 commit');
 var head=source.slice(0,begin),body=source.slice(begin,end),tail=source.slice(end);
 var call=NL+' jsr apply_vertical_color221'+NL;
 if(!body.includes(call))call=NL+' jsr vertical_color_commit222'+NL;
 if(!body.includes(call))call=NL+' jsr apply_sparse_colors'+NL;
 if(body.split(call).length!==2)throw Error('TEST226 color commit changed');
 source=head+body.replace(call,NL+' jsr commit_direct_color226'+NL)+tail;
 var charset='*=$3000'+NL;
 if(source.split(charset).length!==2)throw Error('TEST226 charset segment changed');
 source=source.replace(charset,runtime()+charset);
 // Insert after color map and BEFORE old optional $A100+ RLE tables;
 // avoids writing across $D000-$DFFF, SID ABI, charset or map.
 var tableStart='*=$a100'+NL;
 if(source.includes(tableStart))source=source.replace(tableStart,compiled(p)+tableStart);
 else source+=NL+compiled(p);
 return source;
};
window.RICO_TEST226_VERTICAL_DIRECT_COLOR={version:227,plan:plan,previous:previous};
})();