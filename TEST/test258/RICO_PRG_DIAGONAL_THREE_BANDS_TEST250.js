(function(){
'use strict';
/* TEST250: three real raster bands on TEST249 in-place chars+Color RAM.
   PAL scanlines $56/$96/$f8; rows 0..3 / 4..11 / 12..23. */
var E=window.RICO_TEST196_DIAGONAL;if(!E||!E.build)return;
var old=E.build,N='\n';
function rep(s,a,b){if(s.split(a).length!==2)throw Error('TEST250 anchor '+a.slice(0,70));return s.replace(a,b);}
E.build=function(d){
 var s=old(d),prev=window.RICO_TEST249_LAST_BUILD||{};
 var stat={version:250,selected:false,reason:'TEST249 inactive'};
 if(!d||!prev.selected||prev.mode!=='single-screen-in-place-char-color'){
  window.RICO_TEST250_LAST_BUILD=stat;return s;
 }
 var origin=s.indexOf(N+'char_color_top249'+N);
 if(origin<0)throw Error('TEST250 top ASM absent');
 var sx=d.dir.x===-1?1:-1,edge=sx===1?39:0;
 var at=0x0400+4*40+(edge===0?1:0)+40+sx;
 var marker=' lda $'+('0000'+at.toString(16)).slice(-4);
 var cut=s.indexOf(N+marker,origin);
 if(cut<0)throw Error('TEST250 row 4 split absent');
 var writes=(s.slice(origin,cut).match(/ sta \$d[0-9a-f]{3}/g)||[]).length;
 if(writes!==156)throw Error('TEST250 row 4 geometry '+writes);
 s=s.slice(0,cut)+N+' rts'+N+'char_color_midtop250'+s.slice(cut);
 s=rep(s,' jmp char_color_tail249'+N+'*=$2000',' rts'+N+'*=$2000');
 s=rep(s,'char_color_tail249=$e000','char_color_tail249=$e000'+N+'char_color_bottom250=$e751');
 var rowEnd=['t249_end_row',' dec rows_left',' beq t249_builder_done',' jmp t249_build_row'].join(N);
 var rowSplit=['t249_end_row',' dec rows_left',' beq t249_builder_done',
 ' lda rows_left',' cmp #$0c',' bne t250_continue',
 ' ldy #$00',' lda #$60',' sta (color_src_lo),y',
 ' inc color_src_lo',' bne t250_continue',' inc color_src_hi',
 't250_continue',' jmp t249_build_row'].join(N);
 s=rep(s,rowEnd,rowSplit);
 for(var k=0;k<2;k++){
  var r=k===0?4:12,label=k===0?'apply_edges_mid250':'apply_edges_bottom250';
  s=rep(s,' lda buf_colchar249+'+r,' rts'+N+label+N+' lda buf_colchar249+'+r);
 }
 var irq=['irq',' pha',' txa',' pha',' tya',' pha',
  ' lda #$01',' sta $d019',' inc t250_irq_count',
  ' lda t250_phase',' beq t250_first',
  ' cmp #$01',' beq t250_middle_branch',
  ' jmp t250_last',
  't250_middle_branch',' jmp t250_middle',
  't250_first',
  ' lda main_busy',' bne t250_busy',
  ' lda prep_request',' beq irq_tick',
  ' lda prep_ready',' beq t250_not_ready',
  ' lda #$96',' sta $d012',
  ' jsr char_color_top249',' jsr apply_edges249',
  ' lda #$01',' sta t250_phase',
  ' jmp irq_group',
  't250_busy',' inc t250_busy_count',' jmp irq_group',
  't250_not_ready',' inc t250_wait_count',' jmp irq_group',
  't250_middle',
  ' lda #$f8',' sta $d012',
  ' jsr char_color_midtop250',
  ' jsr char_color_tail249',
  ' jsr apply_edges_mid250',
  ' lda #$02',' sta t250_phase',
  ' jmp irq_group',
  't250_last',
  ' lda #$56',' sta $d012',
  ' jsr char_color_bottom250',' jsr apply_edges_bottom250',
  ' lda pending_x',' sta camera_x',
  ' lda pending_y',' sta camera_y',
  ' lda next_fx',' sta fine_x',
  ' lda next_fy',' sta fine_y',' jsr apply_fine',
  ' lda #$00',' sta prep_request',' sta prep_ready',' sta t250_phase',
  ' inc t250_commits',
  ' lda $d012',' sta t250_end_lo',
  ' lda $d011',' and #$80',' sta t250_end_hi',
  ' jmp irq_tick'].join(N);
 var a=N+'irq'+N,z=N+'irq_tick'+N,i=s.indexOf(a),j=i<0?-1:s.indexOf(z,i+a.length);
 if(i<0||j<0||s.split(a).length!==2||s.split(z).length!==2)
  throw Error('TEST250 IRQ anchors');
 s=s.slice(0,i)+N+irq+s.slice(j);
 s=rep(s,' lda #$01'+N+' sta $d01a'+N+' lda #$60'+N+' sta $d012',
 ' lda #$01'+N+' sta $d01a'+N+' lda #$56'+N+' sta $d012');
 var counters=['*=$a020','t250_phase','!byte $00',
 't250_irq_count','!byte $00','t250_commits','!byte $00',
 't250_busy_count','!byte $00','t250_wait_count','!byte $00',
 't250_end_lo','!byte $00','t250_end_hi','!byte $00',
 't250_magic','!byte $50','t250_version','!byte $01'].join(N)+N;
 s=rep(s,'*=$a100'+N+'color_upper244',counters+'*=$a100'+N+'color_upper244');
 stat={version:250,selected:true,mode:'three-raster-bands',
  rasterLines:[86,150,248],bands:[[0,3],[4,11],[12,23]],
  screen:'$0400',color:'$d800',buffer:'$1f00-$1f81',
  builtMiddle:'$e000-$e750',builtBottom:'$e751-$fd41',
  copies:936,colorCopies:936,edgeBytes:130,
  monitor:'m a020 a028',status:'experimental; VICE validation needed'};
 window.RICO_TEST250_LAST_BUILD=stat;
 console.log('[TEST250 THREE BANDS]',stat);
 return s;
};
})();