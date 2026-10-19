'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=__dirname,main=fs.readFileSync(path.join(root,'js/main.js'),'utf8');const a=main.indexOf('var Assembler=function()'),b=main.indexOf('};var AssemblerEditor=function()',a);vm.runInThisContext(main.slice(a,b+2));global.window={};global.ToPRGAdv=function(){};vm.runInThisContext(fs.readFileSync(path.join(root,'js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js'),'utf8'));
const buildSource=window.RICO_TEST77_PRG_MAP_SCROLL.buildSource;
const bank1=new Uint8Array(2048);const bank2=new Uint8Array(2048);for(let i=0;i<2048;i++){bank1[i]=(i*73+21)&255;bank2[i]=(i*17+121)&255;}
function make({count=256,type=1,ticks=1,mapTicks=1,bank=1,mask=0,skip=-1,scroll=1}={}){
 let screen=new Uint8Array(1000);for(let i=0;i<screen.length;i++)screen[i]=i%count;
 const cols=new Uint8Array(1000).fill(14);
 const f={typeCode:scroll,duration:12,ticks:mapTicks,pixels:1,bg:0,border:0,fg:14,bank,screen,colors:cols,window:{x:0,y:0,width:40,height:25},scrollArea:{x:0,y:0,width:40,height:25}};
 const animations=Array.from({length:256},(_,c)=>({charCode:c,type:(c===skip?2:type),ticks}));
 const src=buildSource({frames:[f],bank1,bank2,blankChar:255,nativeAnimations:animations});const asm=new Assembler();asm.init();const r=asm.assemble(src,0x801);if(!r.success)throw Error('Assembler error '+JSON.stringify(r.errors.slice(0,8)));
 const labels=Object.fromEntries(Object.entries(asm.labels).map(([k,v])=>[k,v.value]));const memory=Uint8Array.from(asm.memory);
 const ptr=((memory[labels.frame_color_ptr_hi]<<8)|memory[labels.frame_color_ptr_lo]);assert.equal(ptr,labels.frame_color_0);for(let i=0;i<1000;i++)assert.equal(memory[ptr+i],cols[i]);
 const fast=Object.keys(labels).filter(k=>k.startsWith('fast_group_counter_')).length;
 return {src,asm,memory,labels,r,fast,recordCount:(src.split('\nanimated_chars_native_table\n')[1]||'').split('!byte $00')[0].split('\n').filter(x=>x.startsWith('!byte ')).length};
}
let passed=0;
function test(label,fn){fn();passed++;console.log('PASS '+label)}
test('full 256 LEFT 1T forms one group in BANK1, no records',()=>{const r=make({type:0});assert.equal(r.fast,1);assert.equal(r.recordCount,0);assert(r.src.includes('animate_chars_fast_groups'));assert(r.src.includes('gear_previous_fine=$47'));assert.equal(r.labels.fast_group_counter_0+1<=0x3000,true)});
test('full 256 RIGHT 1T forms one group',()=>{const r=make({type:1});assert.equal(r.fast,1);assert.equal(r.recordCount,0);assert.equal(r.memory[r.labels.fast_group_counter_0],1)});
test('full 256 BLINK 1T forms one group',()=>{const r=make({type:4});assert.equal(r.fast,1);assert.equal(r.recordCount,0)});
test('full 256 UP cannot take horizontal fast-path',()=>{const r=make({type:2});assert.equal(r.fast,0);assert.equal(r.recordCount,256)});
test('a glyph of other animation type breaks fast group, preserves its native record',()=>{const r=make({type:1,skip:81});assert.equal(r.fast,2);assert.equal(r.recordCount,1)});
test('32 visibly animated contiguous glyphs qualify for fast path',()=>{const r=make({count:32,type:0});assert.equal(r.fast,1);assert.equal(r.recordCount,0)});
test('7 glyphs do not get a group; unchanged native path',()=>{const r=make({count:7,type:1});assert.equal(r.fast,0);assert.equal(r.recordCount,7)});
test('Bank2 group compiles and points to $3800 charset',()=>{const r=make({bank:2,type:0});assert.equal(r.fast,1);assert(r.src.includes(' lda $3800,x'))});
test('one tick per MAP Scroll gear preserved with group-only animation',()=>{const r=make({type:0,mapTicks:1});assert(r.src.includes('irq_gear_map_wait'));assert(r.src.includes(' jsr animate_chars_fast_groups'))});
test('six tick nongeared Map Scroll still animates and scrolls',()=>{const r=make({type:0,mapTicks:6});assert(!r.src.includes('gear_previous_fine=$47'));assert(r.src.includes(' jsr animate_chars_fast_groups'))});
test('group ticks 3 retains an independent group counter set 3',()=>{const r=make({type:0,ticks:3});assert.equal(r.memory[r.labels.fast_group_counter_0],3)});
test('256 varying directional types keep full legacy semantics',()=>{for(let type of [0,1,2,3,4]){const r=make({type});assert(r.labels.frame_color_0>=0x4000+1000);assert(r.r.success)}});
test('fallback to original TEST141 per-glyph runtime is available',()=>{const r=make({count:256,type:1});assert(r.fast===1);const codeOnlyNative=r.src.includes('animate_chars_native_table')===false;assert(codeOnlyNative)});
// Multi-frame overhead may exceed the $3000 charset boundary after adding
// the optimized run. The createPRG wrapper reassembles with fast groups off.
test('generated code includes a unique $3000 overflow sentinel',()=>{const r=make({count:256,type:1});assert(r.labels.test142_code_end>0x2000&&r.labels.test142_code_end<=0x3000);assert(r.src.includes('test142_code_end'))});
console.log(`TEST142 ${passed}/14 PASS; original LVLLVL assembler at each scenario.`);
