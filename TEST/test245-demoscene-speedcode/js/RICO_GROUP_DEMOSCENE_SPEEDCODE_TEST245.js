/* TEST245 — DemoScene-style offline phase compilation + direct speedcode.
 * Only standalone Group Ping Pong at 8px/tick. ONDAS and Map Scroll unchanged.
 * Whole frames are precomputed at export time; generated 6510 code writes them
 * directly into the hidden VIC-II charset and flips only after the last byte.
 */
(function(){
'use strict';
function h(v){return '$'+('0'+(v&255).toString(16)).slice(-2);}
function h16(v){return '$'+('0000'+(v&65535).toString(16)).slice(-4);}
function bytes(out,arr){
  for(var i=0;i<arr.length;i+=16)out.push('!byte '+arr.slice(i,i+16).map(h).join(','));
}
function gcd(a,b){while(b){var t=b;b=a%b;a=t;}return a;}
function frameBytes(group,stepIndex){
  var w=group.w,hgt=group.h,dim=(/-(left|right)$/.test(group.type)?w:hgt)*8;
  var limit=dim-1,period=2*limit,p=period?((stepIndex*8)%period):0;
  var delta=p>limit?period-p:p;
  var left=group.type==='pingpong-left',right=group.type==='pingpong-right',
      up=group.type==='pingpong-up',down=group.type==='pingpong-down';
  var out=[];
  for(var cx=0;cx<w;cx++)for(var cy=0;cy<hgt;cy++){
    var protectedTile=group.protection[cx*hgt+cy]===1;
    for(var y=0;y<8;y++){
      var bits=0;
      for(var x=0;x<8;x++){
        var px=cx*8+x+(left?delta:right?-delta:0),
            py=cy*8+y+(up?delta:down?-delta:0);
        if(!protectedTile&&px>=0&&py>=0&&px<w*8&&py<hgt*8){
          var tx=Math.floor(px/8),ty=Math.floor(py/8),code=group.cells[tx][ty];
          var glyph=group.tiles[code]&&group.tiles[code].data&&group.tiles[code].data[0];
          if(!glyph||glyph.length!==64)throw new Error('TEST245: bitmap incompleto de caracter '+code);
          if(glyph[(py%8)*8+(px%8)])bits|=(128>>x);
        }
      }
      out.push(bits);
    }
  }
  return out;
}
function compile(group){
 if(!/^pingpong-(left|right|up|down)$/.test(group.type)||group.pixels!==8)
   return {source:null,reason:'No corresponde al Speedcode de 8 pixeles'};
 var count=group.w*group.h,phasePixels=/-(left|right)$/.test(group.type)?group.w*8:group.h*8;
 if(count<1||count>256||phasePixels<=1)return {source:null,reason:'Geometría no compatible'};
 var phaseCycle=2*(phasePixels-1),num=phaseCycle/gcd(phaseCycle,8);
 var frameSize=count*8,frameStride=Math.ceil(frameSize/256)*256;
 var dataStart=0x4800,dataEnd=dataStart+num*frameStride;
 var codeEstimate=360+2*frameSize*6+32*Math.ceil(frameSize/256);
 if(num>255||dataEnd>0xa000||0xa000+codeEstimate>0xd000)
   return {source:null,reason:'Memoria insuficiente',frameCount:num,framesBytes:num*frameSize,memoryEnd:dataEnd};
 var out=['; TEST245 DemoScene — offline precomputed reflected phases',
          '; Each frame is a cache snapshot; no live per-character pixel shifts.',
          '*='+h16(dataStart)];
 var starts=[];
 for(var frame=1;frame<=num;frame++){
   starts.push(dataStart+(frame-1)*frameStride);
   out.push('group245_frame_'+frame);
   var content=frameBytes(group,frame);
   bytes(out,content);
   if(frameStride>content.length){
     for(var fill=content.length;fill<frameStride;fill+=16){
       var zeroes=Array(Math.min(16,frameStride-fill)).fill(0);
       bytes(out,zeroes);
     }
   }
 }
 out.push('*=$a000','group182_src_lo=$35','group182_src_hi=$36',
  'group182_irq_tick',
  ' dec group182_timer',
  ' bne group245_irq_done',
  ' lda #'+h(group.ticks),' sta group182_timer',
  ' lda group182_pending',' cmp #$ff',' beq group245_irq_done',
  ' inc group182_pending',
  'group245_irq_done',' rts',
  'group182_timer','!byte '+h(group.ticks),
  'group182_pending','!byte $00',
  'group182_active','!byte $00',
  'group245_step_index','!byte $00',
  'group182_step',
  ' ldx group245_step_index',
  ' lda group245_source_lo,x',' sta group182_src_lo',
  ' lda group245_source_hi,x',' sta group182_src_hi',
  ' inc group245_step_index',
  ' lda group245_step_index',' cmp #'+h(num),
  ' bne group245_step_index_ok',
  ' lda #$00',' sta group245_step_index',
  'group245_step_index_ok',
  // The target XOR is zero when physical charset == source group bank.
  ' lda group240_target_xor',' beq group245_native',
  ' jsr group245_copy_other',' jmp group245_copy_done',
  'group245_native',' jsr group245_copy_native',
  'group245_copy_done',
  ' dec group182_pending',' rts',
  'group245_source_lo');
 bytes(out,starts.map(v=>v&255));
 out.push('group245_source_hi');bytes(out,starts.map(v=>v>>8));
 function copyRoutine(label,bank){
   out.push(label,' ldy #$00');
   var k=0;
   for(var x=0;x<group.w;x++)for(var y=0;y<group.h;y++){
     var dest=(bank===2?0x3800:0x3000)+group.cells[x][y]*8;
     for(var row=0;row<8;row++){
       out.push(' lda (group182_src_lo),y',' sta '+h16(dest+row),' iny');
       k++;
       if(k%256===0&&k<frameSize)out.push(' inc group182_src_hi');
     }
   }
   out.push(' rts');
 }
 copyRoutine('group245_copy_native',group.bank);
 copyRoutine('group245_copy_other',group.bank===1?2:1);
 return {source:out.join('\n')+'\n',reason:'precomputed-speedcode',phaseFrames:num,frameSize:frameSize,
         frameCacheBytes:frameStride*num,estimatedCopyCycles:frameSize*11,
         dataEnd:dataEnd,codeEstimatedEnd:0xa000+codeEstimate};
}
window.RICO_TEST245_DEMO_SPEED={compile:compile,frameBytes:frameBytes};
})();