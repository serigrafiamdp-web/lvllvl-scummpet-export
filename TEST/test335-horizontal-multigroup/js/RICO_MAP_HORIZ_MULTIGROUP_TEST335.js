/* TEST335: Map Scroll horizontal + multiple Group Animate engines.
 * Experimental. Preserves the TEST334 standalone PASS and current root.
 * Does not claim to solve vertical/diagonal or multiframe paths.
 */
(function(){
'use strict';
if(typeof ToPRGAdv==='undefined')return;
var H=window.RICO_TEST186_HORIZONTAL;
var stand=window.RICO_TEST247_STANDALONE;
if(!H||!H.collect||!H.build||!H.groupASM||!stand||!stand.readGroup)return;
var previousCollect=H.collect,previousBuild=H.build;
function hex(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function b16(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function groupsOf(self){
 var ed=self&&self.editor,layer=ed&&ed.layers&&ed.layers.getSelectedLayerObject&&ed.layers.getSelectedLayerObject(),
     ts=layer&&layer.getTileSet&&layer.getTileSet();
 if(!ts)return null;
 var doc=ts.getDocRecord&&ts.getDocRecord(),store=doc&&doc.data||{},cfg=store.ricoGroupAnimationsV1||{},groups=[];
 [1,2].forEach(function(bank){(cfg['bank'+bank]||[]).forEach(function(g){if(g&&g.type)groups.push({bank:bank,g:g});});});
 return {ts:ts,store:store,cfg:cfg,groups:groups};
}
function replaceExactly(src,needle,next,name){
 var a=src.indexOf(needle);
 if(a<0||src.indexOf(needle,a+1)>=0)throw Error('TEST335: ancla '+name+' ausente o duplicada; el PRG no se exporta parcialmente.');
 return src.slice(0,a)+next+src.slice(a+needle.length);
}
H.collect=function(self){
 var d=previousCollect(self);
 var info=groupsOf(self);
 if(!info||info.groups.length<2||d.type!=='left'&&d.type!=='right')return d;
 var groups=info.groups.map(function(item){
  var parsed=stand.readGroup(info.ts,{groups:[item],store:info.store,config:info.cfg});
  parsed.selectedType=item.g.type;
  return parsed;
 });
 var owns={};
 groups.forEach(function(g,i){
  Object.keys(g.codes).forEach(function(code){
   var key=g.bank+':'+code;
   if(owns[key]!==undefined)throw Error('TEST335: BANK '+g.bank+' glifo '+code+' pertenece a dos grupos; falta composición.');
   owns[key]=i;
  });
 });
 var individuals=d.__ricoIndividual327||[];
 individuals.forEach(function(rec){if(owns[rec.bank+':'+rec.code]!==undefined)
  throw Error('TEST335: BANK '+rec.bank+' glifo '+rec.code+' tiene grupo e individual simultáneos; falta composición.');});
 d.__groups335=groups;
 d.group=null; // prevent the first-group-only ASM and stub collisions
 return d;
};
function buildMultiSource(d,src,groups){
 var bank1=d.bank1,bank2=d.bank2,plans=[],chunks=[];
 var oldMain='main_try_group\n lda group182_pending\n beq main_loop\n jsr group182_step\n jmp main_loop';
 var oldIndividual='main_try_group\n lda group182_pending\n beq rico327_try_individual\n jsr group182_step\n jmp main_loop';
 var hasIndividuals=src.indexOf(oldIndividual)>=0;
 var before=hasIndividuals?oldIndividual:oldMain;
 var main=['main_try_group'];
 groups.forEach(function(g,i){
  main.push(' lda group330_'+i+'_pending',' beq group335_next_'+i,
   ' jsr group330_'+i+'_step','group335_next_'+i);
 });
 main.push(hasIndividuals?' jmp rico327_try_individual':' jmp main_loop');
 src=replaceExactly(src,before,main.join('\n'),'main scheduling');
 src=replaceExactly(src,' jsr group182_irq_tick\n',' jsr group335_tick_all\n','group IRQ scheduler');
 var tick=['group335_tick_all'];
 groups.forEach(function(g,i){tick.push(' jsr group330_'+i+'_irq_tick');});
 tick.push(' rts');
 src=replaceExactly(src,'\n*=$3000\ncharset_bank1','\n'+tick.join('\n')+'\n*=$3000\ncharset_bank1','tick routine');
 var stub='*=$a000\ngroup182_pending\n!byte $00\ngroup182_irq_tick\n rts\ngroup182_step\n rts';
 if(src.indexOf(stub)<0)throw Error('TEST335: stub ASM de un solo grupo no localizado.');
   var cursor=0xa000,plans=[],chunks=[];
  groups.forEach(function(group,i){
    var raw=window.RICO_TEST186_HORIZONTAL.groupASM(group,bank1,bank2);
    if(!/\*\=\$a000\b/i.test(raw))throw new Error('TEST335: origen ASM inesperado para grupo '+(i+1));
    var horizontal=/^(left|right|pingpong-left|pingpong-right)$/.test(group.type);
    var tableName=horizontal?'group183_source_his':'group182_sources_hi';
    if(raw.indexOf(tableName)<0||raw.indexOf('group182_step')<0)
      throw new Error('TEST335: formato ASM no reconocido para grupo '+(i+1)+' ('+group.type+').');
    var sourceLength=horizontal?group.w*group.h*(group.type==='pingpong-right'?24:16):group.columns.reduce(function(sum,col){return sum+col.length;},0);
    var sourceOrigins=Array.from(raw.matchAll(/\*=\$([a-f0-9]{4})/gi)).map(function(m){return parseInt(m[1],16);});
    var sourceBase=Math.max.apply(null,sourceOrigins);
    if(sourceBase<0xa800||sourceBase>=0xd000)throw new Error('TEST335: origen de datos inesperado en grupo '+(i+1));
    var required=(sourceBase-0xa000)+sourceLength;
    var segmentBytes=(required+255)&~255;
    if(cursor+segmentBytes>0xd000)
      throw new Error('TEST335: RAM insuficiente para todos los grupos: el grupo '+(i+1)+' requiere '+segmentBytes+' bytes. No se descarta ningún grupo.');
    var delta=cursor-0xa000,hiDelta=delta>>8;
    // Reubicar tablas HIGH absolutas calculadas durante la generación del grupo.
    // Ambas variantes tienen LOW inalterado porque delta es múltiplo de 256.
    var tabRe=new RegExp('('+tableName+'\\s*\\n)((?:!byte[^\\n]*\\n?)+)');
    var updated=false;
    raw=raw.replace(tabRe,function(_,head,data){
      updated=true;
      return head+data.replace(/\$[0-9a-f]{2}/gi,function(v){return hex(parseInt(v.slice(1),16)+hiDelta);});
    });
    if(!updated)throw new Error('TEST335: no se pudo reubicar la tabla de fuentes del grupo '+(i+1));
    raw=raw.replace(/\*=\$([0-9a-f]{4})/gi,function(_,addr){
      var n=parseInt(addr,16);
      return n>=0xa000&&n<0xd000?'*='+b16(n+delta):'*='+b16(n);
    });
    raw=raw.replace(/\bgroup(182|183|239)_([a-z0-9_]+)/gi,function(_,engine,name){return 'group330_'+i+'_'+engine+'_'+name;});
    // El scheduler llama a las entradas de grupo182, que ahora están aisladas.
    // Sustituir referencias para conservar el contrato previsto.
    raw=raw.replace(/group330_([0-9]+)_182_(irq_tick|step|pending)/g,'group330_$1_$2');
    chunks.push(raw);
    plans.push({bank:group.bank,tiles:group.w*group.h,type:group.type,base:b16(cursor),bytes:segmentBytes});
    cursor+=segmentBytes;
  });

 window.RICO_TEST335_LAST_PLAN={groups:plans,groupCount:groups.length,mode:'MAP-HORIZONTAL-MULTIGROUP',direction:d.type};
 return replaceExactly(src,stub,chunks.join('\n'),'group kernel');
}
H.build=function(d){
 var src=previousBuild(d);
 if(!d.__groups335||d.__groups335.length<2)return src;
 return buildMultiSource(d,src,d.__groups335);
};
window.RICO_TEST335={version:335,previousCollect:previousCollect,previousBuild:previousBuild};
console.log('[RICO TEST335] Experimental horizontal map + independent multigroup generator installed');
})();