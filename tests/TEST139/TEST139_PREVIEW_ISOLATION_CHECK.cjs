'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base=__dirname;
let ms=1000,draws=[],mapRedraws=0,canvasCalls=0,rawCalls=0;
class TileSet {
  constructor(){this.tileData=Array.from({length:256},()=>({data:[new Array(64).fill(0)],props:{animated:false}}));
    this.currentTileData=this.tileData.map(t=>t.data[0].slice());
    this.bank2=Array.from({length:256},()=>({data:[new Array(64).fill(0)],props:{animated:false}}));
    this.editor=null;
  }
  getDocRecord(){return {data:{ricoCharsetBank2:{version:1,tileData:this.bank2}}};}
  getTileWidth(){return 8;}getTileHeight(){return 8;}
  update(tick){ // native tick may request global rendering; TEST120 must silence it
    rawCalls++;
    this.currentTileData[0]=new Array(64).fill(0);
    if(this.editor){this.editor.currentTile.canvasDrawCharacters();this.editor.graphic.redraw({allCells:true});}
    return true;
  }
}
class Graphic {constructor(){this.frames=[{charsetBank:1}];this.currentFrame=0;}getCurrentFrame(){return this.currentFrame;}invalidateAllCells(){mapRedraws++;}redraw(){mapRedraws++;}}
class TilePaletteDisplay {
  constructor(id,editor){this.canvasElementId=id;this.editor=editor;}
  drawTilePalette(args){let state=this.editor.tileSetManager.getCurrentTileSet();draws.push({id:this.canvasElementId,codes:args.tiles.slice(),bank1:state.tileData[0].data[0].slice(),bank2:state.bank2[0].data[0].slice()});}
  draw(args){this.drawTilePalette(args);}
}
let timers=[];const ctx={TileSet,Graphic,TilePaletteDisplay,window:{},console,Date:{now:()=>ms},UI:{on:(type,fn)=>{if(type==='ready')timers.push(fn)}},setTimeout:()=>{},g_tick:0};
vm.createContext(ctx);
for(const file of ['RICO_ANIMATED_PALETTE_PREVIEW_TEST33.js','RICO_ISOLATED_CHAR_RENDER_TEST120.js','RICO_PALETTE_ANIM_UNMUTE_TEST139.js']) {
 const path=base+'/js/'+file;
 vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:file});
}
let ts=new TileSet();ts.tileData[0].data[0][0]=1;ts.tileData[0].props={animated:'right',ticksPerFrame:1};ts.bank2[0].data[0][1]=1;ts.bank2[0].props={animated:'down',ticksPerFrame:1};
let g=new Graphic();const editor={graphic:g,currentTile:{canvasDrawCharacters(){canvasCalls++;}},layers:{layers:[]},tileSetManager:{getCurrentTileSet:()=>ts}};
const main=new TilePaletteDisplay('mainTilePalette',editor),side=new TilePaletteDisplay('sidecharPaletteCanvas',editor);
editor.sideTilePalette={tilePaletteDisplay:side};editor.tools={drawTools:{tilePalette:{tilePaletteDisplay:main}}};ts.editor=editor;
const saved=ts.tileData[0].data[0];
function run(t){ctx.g_tick=t;ts.update(t);}
run(0);
assert.strictEqual(draws.length,2,'index refreshed after first tick');
assert.strictEqual(mapRedraws,0,'background never redrawn');
assert.strictEqual(canvasCalls,0,'no entire current-tile redraw');
assert.strictEqual(ts.tileData[0].data[0],saved,'no mutation to persistent charset');
const oldDraws=draws.length;
ms+=10;run(1);assert.strictEqual(draws.length,oldDraws,'palette throttle at 10ms');
ms+=100;run(2);assert.strictEqual(draws.length,oldDraws+2,'palette restored after throttle');
assert.strictEqual(mapRedraws,0,'main map isolated');
const sideCall=draws.filter(x=>x.id==='sidecharPaletteCanvas').at(-1);
assert(sideCall.codes.includes(0)&&sideCall.codes.includes(256),'both charset banks get palette redraw indices');
assert(sideCall.bank1[2]===1,'preview shows right-shifted Bank1 char at phase2');
assert(sideCall.bank2[17]===1,'preview shows down-shifted Bank2 char at phase2');
assert.strictEqual(ts.tileData[0].data[0][0],1,'Bank1 source pixels restored');
assert.strictEqual(ts.bank2[0].data[0][1],1,'Bank2 source pixels restored');
const snap=draws.length;
ms+=100;run(2);assert.strictEqual(draws.length,snap,'no spurious redraw on unchanged phase');
ts.tileData[0].props.animated=false;
ms+=100;run(3);assert(draws.length>snap,'unanimated glyph restored in palette');
assert.strictEqual(ts.currentTileData.length,256,'no virtual tiles left in native model');
console.log('TEST139 PASS: 10/10 preview-only checks, Bank1/Bank2, throttled, source pixels intact, background/editor redraw silenced');
