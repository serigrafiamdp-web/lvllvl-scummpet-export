/* TEST340 — diagonal Map Scroll + multi-group scheduler.
 * Independent experimental PRG route, only when 2+ actual groups are configured.
 * Keeps TEST339 side-preview and the existing 0/1-group exporters unchanged.
 */
(function(){
'use strict';
var TAG='[RICO TEST340]';
if(typeof ToPRGAdv==='undefined')return;
var M=window.RICO_TEST196_DIAGONAL;
var H=window.RICO_TEST186_HORIZONTAL;
var S=window.RICO_TEST247_STANDALONE;
if(!M||!M.collect||!M.build||!H||!H.groupASM||!S||!S.readGroup){
 console.warn(TAG,'Required diagonal / group-ASM modules unavailable.');return;
}
var previous=ToPRGAdv.prototype.createPRG;
var DIRECTIONS={'diag-up-left':1,'diag-up-right':1,'diag-down-left':1,'diag-down-right':1};
function hex(n){return '$'+('0'+(n&255).toString(16)).slice(-2);}
function word(n){return '$'+('0000'+(n&65535).toString(16)).slice(-4);}
function once(src,needle,replacement,name){
 var at=src.indexOf(needle);
 if(at<0||src.indexOf(needle,at+needle.length)!==-1)
   throw new Error('TEST340: ancla ASM '+name+' ausente o repetida. No se exporta parcialmente.');
 return src.slice(0,at)+replacement+src.slice(at+needle.length);
}
function groupInfo(self){
 var editor=self&&self.editor;
 var layer=editor&&editor.layers&&editor.layers.getSelectedLayerObject&&editor.layers.getSelectedLayerObject();
 var ts=layer&&layer.getTileSet&&layer.getTileSet();
 var record=ts&&ts.getDocRecord&&ts.getDocRecord(),store=record&&record.data||{};
 var cfg=store.ricoGroupAnimationsV1||{},groups=[],switchBanks=[];
 [1,2].forEach(function(bank){
  (cfg['bank'+bank]||[]).forEach(function(g){
   if(!g||!g.type)return;
   if(g.type==='switch-bank')switchBanks.push({bank:bank,g:g});
   else groups.push({bank:bank,g:g});
  });
 });
 return {editor:editor,layer:layer,ts:ts,store:store,cfg:cfg,groups:groups,switchBanks:switchBanks};
}
function validType(t){return /^(left|right|up|down|pingpong-(left|right|up|down)|ondas-(left|right|up|down))$/.test(t);}
function prepare(self,info){
 var fr=info.editor.graphic.frames||[];
 if(fr.length!==1)throw Error('TEST340: este motor diagonal multigrupo todavía no compone las animaciones de varios frames. Se conserva el proyecto sin exportar datos parciales.');
 if(info.switchBanks.length)throw Error('TEST340: Switch Bank configurado. Requiere enlace con el scheduler de cambio de charset; no se omite.');
 var sid=window.RICO_TEST207_ORIGINAL_SID&&window.RICO_TEST207_ORIGINAL_SID.getState&&window.RICO_TEST207_ORIGINAL_SID.getState();
 if(sid&&sid.enabled)throw Error('TEST340: SID habilitado. El compositor diagonal multigrupo todavía no enlaza SID; deshabilitalo solo para esta prueba.');
 var mode=info.layer&&info.layer.getScreenMode&&info.layer.getScreenMode();
 if(mode==='c64ecm'||mode==='c64multicolorbitmap'||mode==='c64hiresbitmap')
  throw Error('TEST340: modo '+mode+' requiere integrar su exportador especifico; no se genera un PRG de otro modo.');
 var bankUsed=Number(fr[0]&&fr[0].charsetBank)===2?2:1;
 var bankTiles=bankUsed===2
  ?info.store.ricoCharsetBank2&&info.store.ricoCharsetBank2.tileData
  :info.ts&&info.ts.tileData;
 if(bankTiles){
  var individual=bankTiles.some(function(t){return t&&t.props&&t.props.animated&&t.props.animated!=='none';});
  if(individual)throw Error('TEST340: hay animacion individual de glifos en BANK '+bankUsed+'. Falta componerla con el scheduler diagonal multigrupo; no se descarta.');
 }
 var groups=info.groups.map(function(g,index){
  if(!validType(g.g.type))throw Error('TEST340: efecto de grupo '+(index+1)+' ('+g.g.type+') sin rutina compatible.');
  var parsed=S.readGroup(info.ts,{groups:[g],store:info.store,config:info.cfg});
  parsed.originalType=g.g.type;
  return parsed;
 });
 var owners=Object.create(null);
 groups.forEach(function(g,i){
  Object.keys(g.codes||{}).forEach(function(id){
   var key=g.bank+':'+id;
   if(owners[key]!==undefined)
     throw Error('TEST340: BANK '+g.bank+' caracter '+id+' pertenece a los grupos '+(owners[key]+1)+' y '+(i+1)+'. Las escrituras requieren composicion.');
   owners[key]=i;
  });
 });
 return groups;
}
function buildKernels(d,groups){
 var chunks=[],cursor=0xa000,plans=[];
 groups.forEach(function(group,i){
  var raw=H.groupASM(group,d.bank1,d.bank2);
  if(!/\*=\$a000\b/i.test(raw))throw Error('TEST340: codigo ASM origen inesperado para grupo '+(i+1));
  var horizontal=/^(left|right|pingpong-left|pingpong-right)$/.test(group.type);
  var tableName=horizontal?'group183_source_his':'group182_sources_hi';
  if(raw.indexOf(tableName)<0||raw.indexOf('group182_step')<0)
   throw Error('TEST340: rutina ASM no reconocida para grupo '+(i+1)+' ('+group.originalType+').');
  var sourceLength=horizontal
   ?group.w*group.h*(group.type==='pingpong-right'?24:16)
   :group.columns.reduce(function(sum,col){return sum+col.length;},0);
  var origins=Array.from(raw.matchAll(/\*=\$([a-f0-9]{4})/gi)).map(function(m){return parseInt(m[1],16);});
  var sourceBase=Math.max.apply(null,origins);
  if(!Number.isInteger(sourceBase)||sourceBase<0xa800||sourceBase>=0xd000)
   throw Error('TEST340: origen de datos ASM no valido en grupo '+(i+1));
  var required=sourceBase-0xa000+sourceLength,bytes=(required+255)&~255;
  if(cursor+bytes>0xd000)
   throw Error('TEST340: RAM insuficiente para '+groups.length+' grupos. Grupo '+(i+1)+' necesita '+bytes+' bytes; area segura termina en $CFFF.');
  var delta=cursor-0xa000,hiDelta=delta>>8;
  var re=new RegExp('('+tableName+'\\s*\\n)((?:!byte[^\\n]*\\n?)+)');
  var updated=false;
  raw=raw.replace(re,function(_,head,data){
   updated=true;
   return head+data.replace(/\$[0-9a-f]{2}/gi,function(v){return hex(parseInt(v.slice(1),16)+hiDelta);});
  });
  if(!updated)throw Error('TEST340: no se pudo actualizar tabla de punteros del grupo '+(i+1));
  raw=raw.replace(/\*=\$([0-9a-f]{4})/gi,function(_,address){
   var n=parseInt(address,16);return n>=0xa000&&n<0xd000?'*='+word(n+delta):'*='+word(n);
  });
  raw=raw.replace(/\bgroup(182|183|239)_([a-z0-9_]+)/gi,function(_,engine,name){
   return 'group340_'+i+'_'+engine+'_'+name;
  });
  raw=raw.replace(/group340_([0-9]+)_182_(irq_tick|step|pending)/g,'group340_$1_$2');
  chunks.push(raw);
  plans.push({bank:group.bank,direction:group.originalType,tiles:group.w*group.h,ticks:group.ticks,pixels:group.pixels,start:word(cursor),size:bytes});
  cursor+=bytes;
 });
 return {asm:chunks.join('\n'),plans:plans,usedUntil:word(cursor)};
}
function build(d,groups){
 if(!d.group)throw Error('TEST340: el colector diagonal no genero el grupo de referencia; cancelado.');
 var legacy=H.groupASM(d.group,d.bank1,d.bank2);
 var src=M.build(d),next=buildKernels(d,groups);
 var main=['main_group'];
 groups.forEach(function(g,i){
  main.push(' lda group340_'+i+'_pending',' beq group340_next_'+i,' jsr group340_'+i+'_step','group340_next_'+i);
 });
 main.push(' jmp main_loop');
 src=once(src,'main_group\n lda group182_pending\n beq main_loop\n jsr group182_step\n jmp main_loop',
  main.join('\n'),'main-loop de grupos');
 src=once(src,'irq_group\n jsr group182_irq_tick\n','irq_group\n jsr group340_tick_all\n','IRQ de grupos');
 var tick=['group340_tick_all'];
 groups.forEach(function(g,i){tick.push(' jsr group340_'+i+'_irq_tick');});
 tick.push(' rts');
 src=once(src,'*=$3000\ncharset_bank1',tick.join('\n')+'\n*=$3000\ncharset_bank1','insercion del ticker');
 src=once(src,legacy,next.asm,'kernel de grupo original');
 if(/\bgroup182_(pending|irq_tick|step)\b/.test(src))throw Error('TEST340: quedan referencias al planificador de un solo grupo.');
 window.RICO_TEST340_LAST_PLAN={direction:d.direction,groupCount:groups.length,groups:next.plans,memoryUntil:next.usedUntil,scope:'1-frame diagonal only'};
 return src;
}
function assemble(self,src){
 var app=window.g_app,assembler=app&&app.assembler;
 if(!assembler)throw Error('TEST340: assembler de LVLLVL no disponible.');
 var result=assembler.assemble(src,0x0801);
 if(!result||!result.success){
  var errs=result&&result.errors||[];
  throw Error('TEST340 ASM: '+errs.map(function(e){return e.message||String(e)}).join(' | '));
 }
 var mem=assembler.getMemory(),end=result.end,start=result.start;
 if(!Number.isInteger(start)||!Number.isInteger(end)||end<=start)throw Error('TEST340: resultado de ensamblado sin rango de memoria valido.');
 var prg=new Uint8Array(2+end-start);prg[0]=start&255;prg[1]=start>>8;
 for(var i=start;i<end;i++)prg[2+i-start]=mem[i]&255;
 return prg;
}
ToPRGAdv.prototype.createPRG=function(args){
 var info=groupInfo(this),f=info.editor&&info.editor.graphic&&info.editor.graphic.frames&&info.editor.graphic.frames[0],
     dir=f&&f.ricoMapScrollV1&&f.ricoMapScrollV1.type;
 if(!DIRECTIONS[dir]||info.groups.length<2)return previous.apply(this,arguments);
 try{
  var groups=prepare(this,info);
  if(args&&((args.music==='sid')||args.sidData))throw Error('TEST340: SID solicitado en los argumentos de exportacion; integracion pendiente, no se omite.');
  var d=M.collect(this),src=build(d,groups),prg=assemble(this,src);
  this.prg=prg;
  window.RICO_TEST340_LAST_ERROR=null;
  if(args&&args.download===false)return prg;
  var name=args&&args.filename||'RICO_DIAGONAL_MULTIGROUP_TEST340.prg';
  if(!/\.prg$/i.test(name))name+='.prg';
  if(typeof window.download!=='function')throw Error('TEST340: funcion download() no disponible.');
  window.download(prg,name,'application/prg');
  return prg;
 }catch(e){
  window.RICO_TEST340_LAST_ERROR=String(e&&e.message||e);
  console.error(TAG,'Diagonal multi-group export failed',e);
  if(typeof window.alert==='function')window.alert('TEST340 diagonal multigrupo: '+window.RICO_TEST340_LAST_ERROR);
  return false;
 }
};
window.RICO_TEST340_DIAGONAL={version:340,getPlan:function(){return window.RICO_TEST340_LAST_PLAN||null;},getLastError:function(){return window.RICO_TEST340_LAST_ERROR||null;}};
console.log(TAG,'Diagonal Map Scroll + multi-group experimental export route loaded; 0/1-group path unchanged.');
})();