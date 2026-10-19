'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=__dirname;
const code=fs.readFileSync(path.join(root,'js/main.js'),'utf8');
const a=code.indexOf('var Assembler=function()'),b=code.indexOf('};var AssemblerEditor=function()',a);
assert(a>=0 && b>a,'LVLLVL original assembler source');
vm.runInThisContext(code.slice(a,b+2));
global.window={RICO_TEST57_MAP_SCROLL:{getConfig:()=>global.cfg},RICO_TEST75_WINDOW_DIMENSION:{getConfig:()=>({x:0,y:0,width:40,height:25}),getScrollArea:()=>({x:0,y:0,width:40,height:25})}};
global.ToPRGAdv=function(){this.prg=null;};
global.g_app={assembler:null};
const exportJS=fs.readFileSync(path.join(root,'js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js'),'utf8');
// Test-only access to internal collector; never appears in the actual web module.
vm.runInThisContext(exportJS.replace('function supports(self,args){','window.__test140_collect=collect;\nfunction supports(self,args){'));
const checks=[];let errors=[];
function scenario({usedAll=true,blankCode=-1,animatedCode=-1,mode='up',fullBank2=true}={}){
 const b1=Array.from({length:256},(_,c)=>({data:[Array.from({length:64},(_,i)=>(c+i)%2===0?1:0)]}));
 const b2=Array.from({length:256},(_,c)=>({data:[Array.from({length:64},(_,i)=>(c+i)%2===0?0:1)]}));
 if(blankCode>=0){b1[blankCode].data[0].fill(0);b2[blankCode].data[0].fill(0);}
 if(!fullBank2&&blankCode>=0)b2[blankCode].data[0][1]=1;
 const ts={tileData:b1,getDocRecord:()=>({data:{ricoCharsetBank2:{tileData:b2}}}),getAnimatedType:c=>c===animatedCode?'right':false,getTileProperties:()=>({ticksPerFrame:1})};
 const rows=Array.from({length:1000},(_,i)=>usedAll?i%256:i%5);
 const layer={getType:()=> 'grid',getTileSet:()=>ts,getCell:({x,y})=>({t:rows[y*40+x],fc:14}),getBackgroundColor:()=>0,getBorderColor:()=>0};
 const graphic={frames:[{charsetBank:1}],getFrameCount:()=>1,getFrameDuration:()=>12};
 const ed={graphic,layers:{getSelectedLayerObject:()=>layer},tileSetManager:{getCurrentTileSet:()=>ts}};
 global.cfg={type:mode,ticksPerStep:1,pixelsPerStep:1};
 return {self:{editor:ed},ts,rows};
}
function run(s){return window.__test140_collect(s.self,{});}
function assemble(d){const compiler=new Assembler();compiler.init();const asm=window.RICO_TEST77_PRG_MAP_SCROLL.buildSource(d),res=compiler.assemble(asm,0x0801);if(!res.success)throw Error('6502 compilation failed '+JSON.stringify(res.errors.slice(0,4)));return {asm,res,compiler};}
function check(n,fn){try{fn();checks.push(n)}catch(e){errors.push(n+': '+e.message)}}
check('01 full tileset 256 indices cardinal wraps with no blank',()=>{let s=scenario();let d=run(s);assert.equal(d.blankChar,255);let out=assemble(d);assert.equal(out.compiler.memory[0x3000+255*8],s.ts.tileData[255].data[0][0]?0xaa:0x55);fs.writeFileSync(path.join(root,'TEST140_CUSTOM_FULL256_WRAP_UP_1T.prg'),Buffer.from([1,8,...out.compiler.memory.slice(out.res.start,out.res.end)]));});
check('02 use already blank code even if all 256 are occupied',()=>{let d=run(scenario({blankCode:32}));assert.equal(d.blankChar,32);assert([...d.bank1.slice(32*8,32*8+8)].every(v=>v===0));assemble(d);});
check('03 bank2 nonblank forbids reusing blank of bank1',()=>{let d=run(scenario({blankCode:32,fullBank2:false}));assert.equal(d.blankChar,255);});
check('04 same full 256 with Move In needs a real blank',()=>{assert.throws(()=>run(scenario({mode:'movein-left'})),/No hay codigo libre/);});
check('05 blank used in both banks enables Move In',()=>{let d=run(scenario({mode:'movein-left',blankCode:5}));assert.equal(d.blankChar,5);assemble(d);});
check('06 full 256 no blank with Ping Pong fails rather than corrupt charset',()=>{assert.throws(()=>run(scenario({mode:'pingpong-up'})),/No hay codigo libre/);});
check('07 full 256 no blank supports down/left/right wrap without erasing',()=>{for(let dir of ['down','left','right']){let s=scenario({mode:dir});let d=run(s);assert.equal(d.blankChar,255);assemble(d);}});
check('08 unused code preserves exact TEST138 selection and blank glyph bytes',()=>{let d=run(scenario({usedAll:false}));assert.equal(d.blankChar,255);assert([...d.bank1.slice(255*8,255*8+8)].every(v=>v===0));});
check('09 animations cannot be selected as blank code',()=>{let d=run(scenario({blankCode:32,animatedCode:32}));assert.equal(d.blankChar,255);});
check('10 no changes to SCUMM pixel gear source code',()=>{assert(exportJS.includes('gear_previous_fine=$47'));assert(exportJS.includes('uniform_fast_step'));assert(exportJS.includes('TEST139')===false);});
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('TEST140 PASS:',checks.length+'/'+checks.length,'regression cases; actual LVLLVL assembler compiled full-256 circular scroll for 4 directions and Move In with blank glyph');
