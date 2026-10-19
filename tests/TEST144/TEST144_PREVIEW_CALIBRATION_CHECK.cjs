'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/js/RICO_NORMAL_PREVIEW_LOAD_TEST144.js','utf8');
const passes=[];function ok(name,callback){callback();passes.push(name)}
const oldTicks=[];
function TileSet(){
 this.tileData=Array.from({length:256},()=>({props:{animated:false,ticksPerFrame:1}}));
 this.bank2=Array.from({length:256},()=>({props:{animated:false,ticksPerFrame:1}}));
 this.doc={data:{ricoCharsetBank2:{version:1,tileData:this.bank2}}};
 this.editor={graphic:{frames:[{charsetBank:1,ricoMapScrollV1:{type:''}}],getCurrentFrame:()=>0}};
}
TileSet.prototype.update=function(tick){oldTicks.push(tick);return tick};
TileSet.prototype.getTileWidth=function(){return 8};
TileSet.prototype.getTileHeight=function(){return 8};
TileSet.prototype.getDocRecord=function(){return this.doc};
let logs=[];const sandbox={TileSet,window:{},console:{log:(...x)=>logs.push(x.join(' '))}};
vm.runInNewContext(source,sandbox,{filename:'TEST144'});
function tiles(n){let ts=new TileSet();for(let i=0;i<n;i++)ts.tileData[i].props.animated='up';return ts}
function run(n){const ts=tiles(n);const frames=[];for(let raw=0;raw<=500;raw++){ts.update(raw);frames.push(oldTicks[oldTicks.length-1])}let changes=0;for(let i=1;i<frames.length;i++)if(frames[i]!==frames[i-1])changes++;return {frames, changes:changes/10,ts}}
ok('one character tracks 50Hz reference',()=>{let r=run(1);assert.equal(r.changes,50)});
ok('16 characters tracks 50Hz reference',()=>{let r=run(16);assert.equal(r.changes,50)});
ok('64 almost 50Hz',()=>{let r=run(64);assert(Math.abs(r.changes-46)<.2)});
ok('96 chars intermediate slower',()=>{let r=run(96);assert(Math.abs(r.changes-27)<.2)});
ok('128 chars roughly 15 changes/sec',()=>{let r=run(128);assert(Math.abs(r.changes-15)<.2)});
ok('192 chars intermediate ~10.5',()=>{let r=run(192);assert(Math.abs(r.changes-10.5)<.2)});
ok('256 chars roughly 8 changes/sec',()=>{let r=run(256);assert(Math.abs(r.changes-8)<.2)});
ok('each +16 characters monotonically slows or stays level',()=>{let last=Infinity;for(let n=0;n<=256;n+=16){let r=run(n);assert(r.changes<=last+.1,`${n} rose`);last=r.changes}});
ok('no group processing in calibration',()=>{let ts=tiles(256);ts.doc.data.ricoGroupAnimationsV1=[{type:'up'}];oldTicks.length=0;for(let i=0;i<20;i++)ts.update(i);assert.equal(oldTicks[18],18)});
ok('native group config is excluded',()=>{let ts=tiles(256);ts.doc.data.ricoGroupAnimationsV1={version:1,bank1:[{type:'up'}],bank2:[]};oldTicks.length=0;for(let i=0;i<20;i++)ts.update(i);assert.equal(oldTicks[18],18)});
ok('no map scroll calibration',()=>{let ts=tiles(256);ts.editor.graphic.frames[0].ricoMapScrollV1.type='up';oldTicks.length=0;for(let i=0;i<20;i++)ts.update(i);assert.equal(oldTicks[18],18)});
ok('bank2 controls rate when bank2 selected',()=>{let ts=tiles(1);for(let i=0;i<256;i++)ts.bank2[i].props.animated='up';ts.editor.graphic.frames[0].charsetBank=2;oldTicks.length=0;for(let i=0;i<51;i++)ts.update(i);assert(oldTicks.at(-1)<12)});
ok('no changes to saved tick settings / tiles',()=>{let ts=tiles(256);const before=JSON.stringify(ts.tileData);for(let i=0;i<20;i++)ts.update(i);assert.equal(before,JSON.stringify(ts.tileData))});
ok('repeated raw tick does not advance extra preview phase',()=>{let ts=tiles(128);oldTicks.length=0;ts.update(10);ts.update(10);assert.equal(oldTicks.at(-1),oldTicks.at(-2))});
ok('unchanged TEST143 export file is present',()=>{let js=fs.readFileSync(__dirname+'/js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js');assert(js.length>100000)});
ok('fast index redraw cap avoids 95ms aliasing',()=>{let s=fs.readFileSync(__dirname+'/js/RICO_PALETTE_ANIM_UNMUTE_TEST139.js','utf8');assert(s.includes('PREVIEW_INTERVAL_MS = 16'));assert(!s.includes('PREVIEW_INTERVAL_MS = 95'))});
console.log(`TEST144 PREVIEW CALIBRATION ${passes.length}/${passes.length} PASS`); passes.forEach((p,i)=>console.log(`${i+1}. ${p}`));
