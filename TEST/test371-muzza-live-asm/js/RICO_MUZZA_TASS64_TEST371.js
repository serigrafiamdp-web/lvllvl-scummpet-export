/* TEST371 — Muzza 64tass export of genuine LVLLVL Export C64 (NEW) sources.
 * No fabricated ASM or false completeness. All old exports remain intact.
 */
(function(){
'use strict';
var LABEL='Muzza'+String.fromCharCode(96)+'s Export Tass 64';
var state={version:371,menu:false,dialog:false,status:'INITIALIZING',lastError:null,fileCount:0};
var menuObserver=null,dialogObserver=null;
function fail(message){
 state.lastError=message;state.status='ERROR';
 console.error('[TEST370]',message);
 if(typeof window.alert==='function')window.alert('Muzza 64tass: '+message);
 return false;
}
function safePath(p){
 p=String(p||'').replace(/\\/g,'/');
 if(!p||p[0]==='/'||p.split('/').some(function(x){return !x||x==='.'||x==='..';}))throw Error('Invalid archive path '+p);
 return p;
}
function bytes(data,path){
 if(data instanceof Uint8Array)return data;
 if(ArrayBuffer.isView(data))return new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
 if(Array.isArray(data))return new Uint8Array(data);
 if(typeof data==='string'&&/^[A-Za-z0-9+/\s]*={0,2}$/.test(data)){
  var raw=atob(data.replace(/\s/g,'')),out=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
 }
 throw Error('Invalid binary content '+path);
}
function dataBinary(path,source){
 if(!/^data\/[^/]+\.asm$/i.test(path)||/frametable/i.test(path))return null;
 var lines=source.replace(/\r\n?/g,'\n').split('\n'),prefix=[],buf=[],hasData=false;
 for(var i=0;i<lines.length;i++){
  var row=lines[i].trim();
  if(!row||row[0]===';'){if(!hasData&&row)prefix.push(lines[i]);continue;}
  if(/^[A-Za-z_][A-Za-z_0-9]*:?$/.test(row)){if(hasData)return null;prefix.push(lines[i]);continue;}
  var m=/^!byte\s+([^;]+)/i.exec(row);
  if(!m)return null;
  hasData=true;
  var cells=m[1].split(',');
  for(var j=0;j<cells.length;j++){
   var value=cells[j].trim(),n;
   if(/^\$[0-9a-f]+$/i.test(value))n=parseInt(value.slice(1),16);
   else if(/^%[01]+$/.test(value))n=parseInt(value.slice(1),2);
   else if(/^[0-9]+$/.test(value))n=parseInt(value,10);
   else return null;
   if(n>255||n<0)return null;
   buf.push(n);
  }
 }
 if(!hasData)return null;
 return {asm:prefix.join('\n')+(prefix.length?'\n':'')+
    '  .binary "'+path.split('/').pop().replace(/\.asm$/i,'.bin')+'"\n',
  payload:new Uint8Array(buf)};
}
function convertASM(s,path){
 var text=s.replace(/\r\n?/g,'\n').split('\n').map(function(line){
  if(/^\s*;/.test(line))return line;
  return line.replace(/^(\s*)!(source|binary|byte|word)\b/i,function(_,a,b){
   return a+'.'+({source:'include',binary:'binary',byte:'byte',word:'word'})[b.toLowerCase()];
  });
 }).join('\n'),issues=[];
 text.split('\n').forEach(function(line,n){
  if(/^\s*;/.test(line))return;
  var m=/^\s*!([a-z_][a-z_0-9]*)\b/i.exec(line);
  if(m)issues.push(path+':'+(n+1)+' '+m[0].trim());
 });
 if(issues.length)throw Error('Unconverted ACME directives:\n'+issues.slice(0,12).join('\n'));
 return path==='main.asm'?'.cpu "6502"\n'+text:text;
}
function resolve(from,relative){
 var parts=from.split('/');parts.pop();
 relative.replace(/\\/g,'/').split('/').forEach(function(x){
  if(x==='..'){if(!parts.length)throw Error('Unsafe include '+relative);parts.pop();}
  else if(x&&x!=='.')parts.push(x);
 });
 return safePath(parts.join('/'));
}
function convertFiles(input){
 if(!Array.isArray(input))throw Error('Source file list is unavailable.');
 var out=Object.create(null),seen=Object.create(null),bad=[];
 input.forEach(function(f){
  if(!f||f.type==='folder')return;
  var path=safePath(f.filePath);
  if(seen[path])throw Error('Duplicate source file '+path);
  seen[path]=true;
  if(/\.asm$/i.test(path)){
   if(typeof f.content!=='string'||/^\s*<(?:!doctype\s+html|html|head|body)\b/i.test(f.content)||
    /<title>\s*Page not found\b/i.test(f.content)){bad.push(path);return;}
   var data=dataBinary(path,f.content);
   if(data){out[path]=convertASM(data.asm,path);out[path.replace(/\.asm$/i,'.bin')]=data.payload;}
   else out[path]=convertASM(f.content,path);
  }else if(/\.(?:bin|prg)$/i.test(path))out[path]=bytes(f.content,path);
  else if(typeof f.content==='string')out[path]=f.content;
  else throw Error('Unsupported content '+path);
 });
 if(bad.length)throw Error('Missing executable ASM: HTML/404 files detected\n'+bad.join('\n')+
   '\nThe original Export C64 (NEW) returned pages, not 6502 source. ZIP not created.');
 if(typeof out['main.asm']!=='string')throw Error('main.asm missing.');
 Object.keys(out).forEach(function(path){
  if(!/\.asm$/i.test(path))return;
  var re=/^\s*\.(include|binary)\s+"([^"]+)"/gim,match;
  while((match=re.exec(out[path]))){
   var target=resolve(path,match[2]);
   if(!Object.prototype.hasOwnProperty.call(out,target))throw Error('Missing dependency '+path+' -> '+target);
   if(match[1].toLowerCase()==='binary'&&typeof out[target]==='string')throw Error('Binary expected at '+target);
  }
 });
 return out;
}
function equalPrg(a,b){
 if(!(a instanceof Uint8Array)||!(b instanceof Uint8Array)||a.length!==b.length)return false;
 for(var i=0;i<a.length;i++){if(a[i]!==b[i])return false;}
 return true;
}
function prgBytes(data){
 if(data instanceof Uint8Array)return data;
 if(ArrayBuffer.isView(data))return new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
 if(Array.isArray(data))return new Uint8Array(data);
 return null;
}
// Use only exact literal byte streams. Expressions, dynamic labels and executable
// code stay in main.asm. A binary include occupies the same number of bytes.
function extractLiteralBinaries(source,files){
 var lines=source.replace(/\r\n?/g,'\n').split('\n'),out=[],count=0,total=0;
 function literal(line){
  var match=/^\s*\.byte\s+([^;]+?)(?:\s*;.*)?$/i.exec(line);
  if(!match)return null;
  var cells=match[1].split(','),list=[];
  for(var i=0;i<cells.length;i++){
   var v=cells[i].trim(),n;
   if(/^\$[a-f0-9]{1,2}$/i.test(v))n=parseInt(v.slice(1),16);
   else if(/^%[01]{1,8}$/.test(v))n=parseInt(v.slice(1),2);
   else if(/^\d{1,3}$/.test(v))n=parseInt(v,10);
   else return null;
   if(n>255)return null;
   list.push(n);
  }
  return list;
 }
 for(var i=0;i<lines.length;){
  var j=i,data=[];
  while(j<lines.length){
   var p=literal(lines[j]);if(!p)break;
   Array.prototype.push.apply(data,p);j++;
  }
  if(data.length>=128){
   count++;total+=data.length;
   var path='data/bytes_'+('0000'+count).slice(-4)+'.bin';
   files[path]=new Uint8Array(data);
   out.push('  .binary "'+path+'" ; '+data.length+' original bytes');
   i=j;
  }else {out.push(lines[i]);i++;}
 }
 return {source:out.join('\n'),blocks:count,bytes:total};
}
function makeZIP(list,name){
 var files=convertFiles(list);
 var extracted=extractLiteralBinaries(files['main.asm'],files);
 files['main.asm']=extracted.source;
 var zip=new JSZip(),names=Object.keys(files).sort();
 names.forEach(function(path){
  var value=files[path];zip.file(path,value,value instanceof Uint8Array?{binary:true}:{});
 });
 zip.file('manifest.json',JSON.stringify({
  generator:LABEL,version:371,
  source:'Active RICO ToPRGAdv PRG assembly (captured)',
  format:'64tass',verification:'MATCHED_TO_ASSEMBLER_OUTPUT_NOT_REBUILT_BY_64TASS',
  extractedBinaryBlocks:extracted.blocks,extractedBytes:extracted.bytes,
  files:names.map(function(n){return {path:n,size:files[n].length};})
 },null,2)+'\n');
 zip.file('README.md','# Muzza 64tass source export — TEST371\n\n'+
  'main.asm is the ACTUAL source passed to LVLLVL assembler by the active PRG route.\n'+
  'reference.prg is matched byte-for-byte against that assembler output.\n'+
  'Literal .byte sequences >=128 bytes become actual binary files in data/.\n\n'+
  'Build with: 64tass -a --cbm-prg -o output.prg main.asm\n'+
  'Then compare output.prg with reference.prg in binary mode.\n'+
  'A successful rebuild in real 64tass and a VICE playback test are still required.\n'+
  'Some RICO routes may need 64tass-specific source adjustments or extra runtime data.\n'+
  'No existing export modes were removed or disabled by this TEST.\n');
 zip.file('build.bat','@echo off\r\n64tass -a --cbm-prg -o output.prg main.asm\r\nif errorlevel 1 exit /b 1\r\nfc /b output.prg reference.prg\r\n');
 zip.file('build.sh','#!/bin/sh\nset -eu\n64tass -a --cbm-prg -o output.prg main.asm\ncmp output.prg reference.prg\n');
 state.fileCount=names.length;state.status='PACKAGING';
 return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:9}}).then(function(blob){
  if(typeof window.download!=='function')throw Error('download() unavailable');
  var base=String(name||'source').replace(/\.(prg|zip)$/i,'').replace(/[^a-z0-9_-]/gi,'_')||'source';
  window.download(blob,base+'_MUZZA_TASS64_TEST371.zip','application/zip');
  state.status='ZIP GENERATED';return true;
 }).catch(function(e){return fail(e.message||String(e));});
}

function exportNow(){
 var dlg=window.g_app&&g_app.textModeEditor&&g_app.textModeEditor.exportC64;
 if(!dlg||!dlg.exportC64||typeof dlg.doExportC64!=='function')
  return fail('Export C64 dialog is not initialized.');
 var engine=dlg.exportC64,oldDoExport=engine.doExport;
 engine.doExport=function(options){
  var editor=dlg.editor,adv=editor&&editor.toPrgAdv;
  var assembler=window.g_app&&g_app.assembler;
  if(!adv||typeof adv.createPRG!=='function'||!assembler||
     typeof assembler.assemble!=='function'||typeof assembler.getMemory!=='function')
    return fail('Current C64 PRG exporter or assembler unavailable.');
  var captures=[],downloaded=[],oldAsm=assembler.assemble,oldDownload=window.download,output;
  state.status='CAPTURING LIVE ASM';state.lastError=null;
  assembler.assemble=function(src){
   var result=oldAsm.apply(this,arguments);
   if(typeof src==='string'&&result&&result.success&&
      Number.isInteger(result.start)&&Number.isInteger(result.end)&&
      result.end>result.start&&result.start>=0&&result.end<=65536){
    var memory=this.getMemory(),data=new Uint8Array(result.end-result.start+2);
    data[0]=result.start&255;data[1]=result.start>>>8;
    for(var i=result.start;i<result.end;i++)data[i-result.start+2]=memory[i]&255;
    captures.push({source:src,prg:data});
   }
   return result;
  };
  // Some older RICO routes ignore args.download=false. Capture instead of
  // opening a second PRG download; this interception is synchronous and local.
  window.download=function(value,filename){
   var data=prgBytes(value);
   if(data&&/\.prg$/i.test(filename||''))downloaded.push(data);
  };
  try {
   output=adv.createPRG(Object.assign({},options,{type:'prg',download:false}));
  }catch(e){return fail('Active PRG exporter: '+(e.message||String(e)));}
  finally{assembler.assemble=oldAsm;window.download=oldDownload;}
  if(output===false)return fail('Active PRG exporter reported failure.');
  var candidate=prgBytes(output)||prgBytes(adv.prg)||downloaded[downloaded.length-1];
  if(!candidate||candidate.length<3)
   return fail('Active PRG exporter did not produce PRG bytes.');
  var match=null;
  for(var c=0;c<captures.length;c++)if(equalPrg(captures[c].prg,candidate))match=captures[c];
  if(!match) return fail('PRG generated, but source does not match byte-for-byte. '+
   'The current route needs a dedicated assembler adapter. ASM captures: '+captures.length);
  var filename=document.getElementById('exportC64As');
  var files=[
   {filePath:'main.asm',type:'asm',content:match.source},
   {filePath:'reference.prg',type:'bin',content:candidate}
  ];
  try{
   state.status='BUILDING 64TASS ZIP';
   makeZIP(files,filename&&filename.value||'source');
  }catch(e){fail(e.message||String(e));}
  return candidate;
 };
 try{dlg.doExportC64({type:'source'});}
 catch(e){fail(e.message||String(e));}
 finally{engine.doExport=oldDoExport;}
}

function attachButton(){
 var node=document.getElementById('rico-muzza-tass64-download');
 if(node){node.style.display='inline-block';return true;}
 var source=document.getElementById('exportC64DownloadSource');
 if(!source||!source.parentNode)return false;
 node=document.createElement('button');node.id='rico-muzza-tass64-download';
 node.type='button';node.className=source.className;node.textContent='Download 64tass ZIP';
 node.style.marginLeft='12px';node.style.display='inline-block';
 node.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();exportNow();});
 source.parentNode.insertBefore(node,source.nextSibling);
 state.dialog=true;if(dialogObserver){dialogObserver.disconnect();dialogObserver=null;}
 return true;
}
function launch(){
 var dialog=window.g_app&&g_app.textModeEditor&&g_app.textModeEditor.exportC64;
 if(!dialog||typeof dialog.start!=='function')return fail('Export C64 (NEW) not ready.');
 state.status='DIALOG OPEN';state.lastError=null;dialog.start();
 if(!attachButton()&&!dialogObserver){
  dialogObserver=new MutationObserver(function(){attachButton();});
  dialogObserver.observe(document.body,{childList:true,subtree:true});
 }
}
function addMenu(){
 if(typeof UI==='undefined'||typeof UI.get!=='function')return false;
 var bar=UI.get('menubar');if(!bar||!bar.menus)return false;
 var menu=bar.menus.filter(function(m){return m.label==='Interface';})[0];
 if(!menu)return false;
 var items=menu.getItems?menu.getItems():menu.menuItems;
 var anchor=items.filter(function(m){return m.uiID==='export-c64';})[0];
 if(!anchor)return false;
 if(items.some(function(m){return m.uiID==='rico-muzza-tass64';})){state.menu=true;return true;}
 var item=menu.addItem({id:'rico-muzza-tass64',label:'64tass Export'});
 item.on('click',launch);
 var oldIndex=items.indexOf(item);if(oldIndex>=0)items.splice(oldIndex,1);
 items.splice(items.indexOf(anchor)+1,0,item);
 var anchorElement=document.getElementById(anchor.id),element=document.getElementById(item.id);
 if(anchorElement&&element&&anchorElement.parentNode===element.parentNode)
  anchorElement.parentNode.insertBefore(element,anchorElement.nextSibling);
 state.menu=true;state.status='MENU READY';
 if(menuObserver){menuObserver.disconnect();menuObserver=null;}return true;
}
if(!addMenu()){
 if(typeof UI!=='undefined'&&typeof UI.on==='function')UI.on('ready',addMenu);
 menuObserver=new MutationObserver(function(){addMenu();});
 menuObserver.observe(document.documentElement,{childList:true,subtree:true});
}
window.RICO_TEST371_MUZZA_TASS64={state:state,convertFiles:convertFiles,convertASM:convertASM,dataBinary:dataBinary,addMenu:addMenu,launch:launch,exportNow:exportNow,extractLiteralBinaries:extractLiteralBinaries};
})();