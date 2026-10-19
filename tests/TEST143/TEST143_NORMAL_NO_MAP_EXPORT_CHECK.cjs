'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname, main=fs.readFileSync(path.join(root,'js/main.js'),'utf8');
const start=main.indexOf('var Assembler=function()'),end=main.indexOf('};var AssemblerEditor=function()',start);assert(start>=0&&end>start);
vm.runInThisContext(main.slice(start,end+2));
global.window={};global.ToPRGAdv=function(){};
ToPRGAdv.prototype.createPRG=function(){throw Error('BUG: stock exporter selected for NORMAL 8x8 no Map Scroll');};
vm.runInThisContext(fs.readFileSync(path.join(root,'js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js'),'utf8'));
let count=0;
function run(n,ticks,typ,generate=false){
 const assembler=new Assembler();assembler.init();global.g_app={assembler};
 const pixelData=new Array(256);
 for(let i=0;i<256;i++){let v=new Array(64);for(let j=0;j<64;j++)v[j]=((i*7+j*3)%11)<5?1:0;pixelData[i]={data:[v]};}
 const ts={tileData:pixelData,getTileWidth:()=>8,getTileHeight:()=>8,getAnimatedType:i=>typ,getTileProperties:i=>({ticksPerFrame:ticks}),getDocRecord:()=>({data:{}})};
 const layer={getType:()=> 'grid',getTileSet:()=>ts,getBackgroundColor:()=>0,getBorderColor:()=>0,getCell:({x,y})=>({t:(x+y*40)%n,fc:14})};
 const editor={layers:{getSelectedLayerObject:()=>layer},graphic:{getFrameCount:()=>1,getFrameDuration:()=>12,frames:[{charsetBank:1,ricoMapScrollV1:{type:'',ticksPerStep:1,pixelsPerStep:1}}]},tileSetManager:{getCurrentTileSet:()=>ts}};
 const exporter=new ToPRGAdv();exporter.editor=editor;
 const oldLog=console.log;console.log=()=>{};
 let prg;try{prg=exporter.createPRG({gridWidth:40,gridHeight:25,download:false,filename:'tick'+ticks+'.prg'});}finally{console.log=oldLog;}
 assert(prg instanceof Uint8Array,'No PRG bytes returned');
 assert.equal(prg[0]+256*prg[1],0x0801); // BASIC loader for SYS8192
 const basic=Buffer.from(prg.slice(2,14)).toString('latin1');assert(basic.includes('8192'),'modern runtime SYS8192 must be used');
 assert(assembler.labels.animate_chars_fast_groups,'must export optimized NORMAL charset groups');
 assert(assembler.labels.test142_code_end.value<=0x3000,'runtime must not overlap charset');
 assert.equal(prg.length,2+(assembler.labels.frame_color_0.value+1000-0x801));
 if(generate){const filename=`TEST143_NORMAL_UP_${n}_VISIBLE_TICK${ticks}_NO_MAP.prg`;fs.writeFileSync(path.join(root,filename),Buffer.from(prg));}
 count++;console.log('PASS NORMAL no-map',`${n} chars`,`${ticks} tick(s)`,typ,`${prg.length} bytes`);
}
for(const n of [16,64,128,256])for(const tick of [1,2,3,4])run(n,tick,'up',n===64&&tick===1||n===256&&tick===1);
for(const typ of ['down','left','right','blink'])run(64,1,typ);
console.log('TEST143 PASS',count,'actual NORMAL no-MAP exports using original LVLLVL assembler');
