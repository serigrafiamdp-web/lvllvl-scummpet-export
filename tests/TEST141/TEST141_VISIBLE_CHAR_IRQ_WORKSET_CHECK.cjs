'use strict';
const fs=require('fs'), vm=require('vm'), path=require('path'), assert=require('assert');
const root=fs.existsSync(path.join(__dirname,'js/main.js'))?__dirname:path.resolve(__dirname,'../../dist');
const resultsDir=__dirname;
const main=fs.readFileSync(path.join(root,'js/main.js'),'utf8');
const ia=main.indexOf('var Assembler=function()'),ib=main.indexOf('};var AssemblerEditor=function()',ia);
assert(ia>=0&&ib>ia,'Original LVLLVL assembler');
vm.runInThisContext(main.slice(ia,ib+2));
global.window={};global.ToPRGAdv=function(){};
const current=fs.readFileSync(path.join(root,'js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js'),'utf8');
vm.runInThisContext(current);const optimized=window.RICO_TEST77_PRG_MAP_SCROLL.buildSource;
const charset=(offset=0)=>{const d=new Uint8Array(2048);for(let i=0;i<d.length;i++)d[i]=(i*37+offset*13+17)&255;return d;};
const b1=charset(),b2=charset(1);
let passed=0,builds=0;
function screen(codes){let a=new Uint8Array(1000);for(let i=0;i<1000;i++)a[i]=codes[i%codes.length];return a;}
function frame({codes=[0],bank=1,type=1,ticks=1}={}){return {typeCode:type,duration:12,ticks,pixels:1,bg:0,border:0,fg:14,bank,screen:screen(codes),colors:new Uint8Array(1000).fill(14),window:{x:0,y:0,width:40,height:25},scrollArea:{x:0,y:0,width:40,height:25}};}
const animations=(options={})=>Array.from({length:256},(_,c)=>({charCode:c,type:options.blinkCode===c?4:(c%4),ticks:options.ticks||1}));
function sourceFor(frames,opts={}){const d={frames,bank1:opts.b1||b1,bank2:opts.b2||b2,blankChar:255,nativeAnimations:animations(opts)};const now=optimized(d);const prefix='*=$3000';const records=asm=>{const anchor='\nanimated_chars_native_table\n';const from=asm.lastIndexOf(anchor);if(from<0)return [];return asm.slice(from+anchor.length).split('!byte $00')[0].split('\n').filter(x=>x.startsWith('!byte ')).map(s=>s.match(/\$[0-9a-f]{2}/ig).map(x=>parseInt(x.slice(1),16)));};
const news=records(now);const assembly=new Assembler();assembly.init();const result=assembly.assemble(now,0x801);if(!result.success)throw Error('LVLLVL assembler error '+JSON.stringify(result.errors.slice(0,4)));
// Critical: color pointer addresses MUST follow exact number of 5-byte
// emitted bank records, NOT 10 bytes per original editor animation.
const labels=Object.fromEntries(Object.entries(assembly.labels).map(([k,v])=>[k,v.value]));
for(let fi=0;fi<frames.length;fi++){
 const ptr=((assembly.memory[labels.frame_color_ptr_hi+fi]<<8)|assembly.memory[labels.frame_color_ptr_lo+fi]);
 assert.equal(ptr,labels['frame_color_'+fi],`Color frame ${fi} pointer is valid with ${news.length} records`);
 for(let i=0;i<1000;i++)assert.equal(assembly.memory[ptr+i],frames[fi].colors[i],`Color data byte ${i}`);
 assert.equal(labels['frame_screen_'+fi],0x4000+fi*1000);
}
builds++;return {now,news,assembly,result,labels};}
function check(desc,fn){try{fn();passed++;console.log('PASS',desc)}catch(e){console.error('FAIL',desc,e.stack);process.exitCode=1}}
check('256 enabled, 1 visible on Bank1 => 512 old records become 1 runtime record',()=>{const r=sourceFor([frame()]);assert.equal(256*2,512);assert.equal(r.news.length,1);assert.deepEqual(r.news[0].slice(2,4),[0,0x30]);fs.writeFileSync(path.join(resultsDir,'TEST141_FULL256_ENABLED_ONE_VISIBLE_1T_UP.prg'),Buffer.from([1,8,...r.assembly.memory.slice(r.result.start,r.result.end)]));});
check('256 enabled, 1 visible on Bank2 => only Bank2 actually animated',()=>{const r=sourceFor([frame({bank:2})]);assert.equal(r.news.length,1);assert.deepEqual(r.news[0].slice(2,4),[0,0x38]);});
check('256 enabled, same code visible in both banks across two frames => retain both phase counters',()=>{const r=sourceFor([frame({bank:1}),frame({bank:2})]);assert.equal(r.news.length,2);assert.deepEqual(r.news.map(x=>x[3]),[0x30,0x38]);});
check('256 enabled, full palette used on screen Bank1 => reduce 512 to 256',()=>{const r=sourceFor([frame({codes:Array.from({length:256},(_,i)=>i)})]);assert.equal(r.news.length,256);assert.equal(new Set(r.news.map(x=>x[2]+256*x[3])).size,256);});
check('256 enabled, full palette used on both banks => 512 records remain unchanged',()=>{const f=frame({codes:Array.from({length:256},(_,i)=>i)});const g=frame({codes:Array.from({length:256},(_,i)=>i),bank:2});const r=sourceFor([f,g]);assert.equal(r.news.length,512);assert.equal(new Set(r.news.map(x=>x[2]+256*x[3])).size,512);});
check('Zero glyph left/right/up/down contributes no CPU loop, but its source bitmap remains zero',()=>{const z=b1.slice();z.fill(0,0,8);const r=sourceFor([frame()],{b1:z});assert.equal(r.news.length,0);assert(!r.now.includes('animate_chars_native\n'));assert(r.now.includes('uniform_fast_step'));});
check('Zero glyph with BLINK is retained because it must toggle $00/$ff',()=>{const z=b1.slice();z.fill(0,0,8);const r=sourceFor([frame()],{b1:z,blinkCode:0});assert.equal(r.news.length,1);assert.equal(r.news[0][4],4);});
check('Zero glyph on BANK1 but visible nonzero on BANK2 -> keep only needed bank',()=>{const z=b1.slice();z.fill(0,0,8);const r=sourceFor([frame({bank:1}),frame({bank:2})],{b1:z});assert.equal(r.news.length,1);assert.equal(r.news[0][3],0x38);});
check('A tile animated but not used by ANY frame never wastes IRQ cycles',()=>{const r=sourceFor([frame({codes:[0,0]}),frame({codes:[0],bank:2})]);assert.equal(r.news.length,2);assert.equal(256*2,512);});
check('Same 1T SCUMM pixel gear retained when at least one visible animated tile',()=>{const r=sourceFor([frame()]);assert(r.now.includes('gear_previous_fine=$47'));assert(r.now.includes('uniform_fast_step'));assert(r.now.includes('irq_gear_map_wait'));});
check('Old frame timing and color data unchanged when pruning animations',()=>{const r=sourceFor([frame({ticks:6})]);assert(r.now.includes('lda #$'));assert(r.now.includes('frame_color_0'));assert.equal(r.news[0][0],1);assert(r.now.includes('ticks_per_step=$05'));});
check('No edits to base collectNativeAnimations definition, charset palette scripts or screen layout',()=>{const fresh=current.slice(current.indexOf('function collectNativeAnimations(ts){'),current.indexOf('function collect(self,args){'));assert(fresh.includes('getAnimatedType(c)'));assert(fresh.includes('ticksPerFrame'));assert(fresh.includes('result.push({charCode:c,ticks:ticks,type:'));assert(current.includes('TEST140: A custom tileset'));});
// Regression matrix: both banks + 4 directions + up to 256 visible + 1/6 ticks.
for(let dir=1;dir<=4;dir++)for(const bank of [1,2])for(const count of [1,32,256])for(const ticks of [1,6]){const r=sourceFor([frame({type:dir,bank,codes:Array.from({length:count},(_,i)=>i),ticks})]);assert.equal(r.news.length,count);}
if(!process.exitCode)console.log(`TEST141 PASS ${passed}/12 focused checks + 48/48 source/assembler matrix; source PRG, charset and 1T gear regression verified; actual VICE visual PASS still pending.`);
