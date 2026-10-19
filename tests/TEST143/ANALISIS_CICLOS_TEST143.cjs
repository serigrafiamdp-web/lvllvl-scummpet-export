'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname, main=fs.readFileSync(path.join(root,'js/main.js'),'utf8');let ia=main.indexOf('var Assembler=function()'),ib=main.indexOf('};var AssemblerEditor=function()',ia);vm.runInThisContext(main.slice(ia,ib+2));
global.window={};global.ToPRGAdv=function(){};vm.runInThisContext(fs.readFileSync(path.join(root,'js/RICO_PRG_MAP_SCROLL_SINGLE_FRAME_TEST77.js'),'utf8'));
const charset=new Uint8Array(2048).fill(0x81),colors=new Uint8Array(1000).fill(14);
function build(n,typ=1){const screen=new Uint8Array(1000);for(let i=0;i<1000;i++)screen[i]=i%n;
 const f={typeCode:0,duration:12,ticks:1,pixels:1,bg:0,border:0,fg:14,bank:1,screen,colors,window:{x:0,y:0,width:40,height:25},scrollArea:{x:0,y:0,width:40,height:25}};
 const source=window.RICO_TEST77_PRG_MAP_SCROLL.buildSource({frames:[f],bank1:charset,bank2:charset,blankChar:255,nativeAnimations:Array.from({length:256},(_,charCode)=>({charCode,ticks:1,type:typ}))});const ass=new Assembler();ass.init();const r=ass.assemble(source,0x801);if(!r.success)throw Error(JSON.stringify(r.errors.slice(0,2)));let labels=Object.fromEntries(Object.entries(ass.labels).map(([k,v])=>[k,v.value]));return {m:Uint8Array.from(ass.memory), labels};}
function bench(n,typ=1){const {m,labels}=build(n,typ);let cpu={a:0,x:0,y:0,s:0xfd,pc:labels.animate_chars_fast_groups||labels.animate_chars_native,z:false,n:false,c:false},cycles=0,ins=0,depth=0;const prior=m.slice(0x3000,0x3000+n*8);
function get(){return m[cpu.pc++];}function word(){return get()|(get()<<8);}function zp16(a){return m[a]|(m[(a+1)&255]<<8);}function flags(n){n&=255;cpu.z=n===0;cpu.n=!!(n&128);return n;}
function push(v){m[0x100+cpu.s]=v&255;cpu.s=(cpu.s-1)&255;}function pop(){cpu.s=(cpu.s+1)&255;return m[0x100+cpu.s]};function branch(cond){const val=get();if(cond){const old=cpu.pc;cpu.pc=(cpu.pc+(val<128?val:val-256))&65535;cycles+=1+(old>>8!==cpu.pc>>8?1:0);}};
while(ins++<1000000){let op=get();switch(op){
case 0xa9:cpu.a=flags(get());cycles+=2;break;
case 0xa5:cpu.a=flags(m[get()]);cycles+=3;break;
case 0xb1:{let at=(zp16(get())+cpu.y)&65535;cpu.a=flags(m[at]);cycles+=5+(at>>8!==zp16((cpu.pc-1)&&255)>>8?1:0);break;}
case 0x91:{const zp=get();m[(zp16(zp)+cpu.y)&65535]=cpu.a;cycles+=6;break;}
case 0x9d:{const ad=word();m[(ad+cpu.x)&65535]=cpu.a;cycles+=5;break;}
case 0x8d:m[word()]=cpu.a;cycles+=4;break;
case 0xce:{const ad=word();m[ad]=flags(m[ad]-1);cycles+=6;break;}
case 0xe8:cpu.x=flags(cpu.x+1);cycles+=2;break;
case 0xe0:{const v=get();cpu.c=cpu.x>=v;flags(cpu.x-v);cycles+=2;break;}
case 0x09:cpu.a=flags(cpu.a|get());cycles+=2;break;
case 0x85:m[get()]=cpu.a;cycles+=3;break;
case 0xc9:{const v=get();cpu.c=cpu.a>=v;flags(cpu.a-v);cycles+=2;break;}
case 0xc6:{const ad=get();m[ad]=flags(m[ad]-1);cycles+=5;break;}
case 0xe6:{const ad=get();m[ad]=flags(m[ad]+1);cycles+=5;break;}
case 0xc0:{const v=get();cpu.c=cpu.y>=v;flags(cpu.y-v);cycles+=2;break;}
case 0x38:cpu.c=true;cycles+=2;break;
case 0x18:cpu.c=false;cycles+=2;break;
case 0xe9:{const v=get();const r=cpu.a-v-(cpu.c?0:1);cpu.c=r>=0;cpu.a=flags(r);cycles+=2;break;}
case 0x69:{const v=get();const r=cpu.a+v+(cpu.c?1:0);cpu.c=r>255;cpu.a=flags(r);cycles+=2;break;}
case 0xa0:cpu.y=flags(get());cycles+=2;break;
case 0xc8:cpu.y=flags(cpu.y+1);cycles+=2;break;
case 0x88:cpu.y=flags(cpu.y-1);cycles+=2;break;
case 0xa2:cpu.x=flags(get());cycles+=2;break;
case 0xca:cpu.x=flags(cpu.x-1);cycles+=2;break;
case 0xb6:{const zp=get();cpu.x=flags(m[(zp+cpu.y)&255]);cycles+=4;break;}
case 0xbd:{const base=word();cpu.a=flags(m[(base+cpu.x)&65535]);cycles+=4+((base>>8)!==((base+cpu.x)&65535)>>8?1:0);break;}
case 0xa6:cpu.x=flags(m[get()]);cycles+=3;break;
case 0x86:m[get()]=cpu.x;cycles+=3;break;
case 0xaa:cpu.x=flags(cpu.a);cycles+=2;break;
case 0x8a:cpu.a=flags(cpu.x);cycles+=2;break;
case 0x0a:cpu.c=!!(cpu.a&128);cpu.a=flags(cpu.a<<1);cycles+=2;break;
case 0x4a:cpu.c=!!(cpu.a&1);cpu.a=flags(cpu.a>>1);cycles+=2;break;
case 0x2a:{const c=cpu.c?1:0;cpu.c=!!(cpu.a&128);cpu.a=flags((cpu.a<<1)|c);cycles+=2;break;}
case 0x6a:{const c=cpu.c?128:0;cpu.c=!!(cpu.a&1);cpu.a=flags((cpu.a>>1)|c);cycles+=2;break;}
case 0x49:cpu.a=flags(cpu.a^get());cycles+=2;break;
case 0xd0:branch(!cpu.z);cycles+=2;break;
case 0xf0:branch(cpu.z);cycles+=2;break;
case 0x10:branch(!cpu.n);cycles+=2;break;
case 0x30:branch(cpu.n);cycles+=2;break;
case 0x90:branch(!cpu.c);cycles+=2;break;
case 0xb0:branch(cpu.c);cycles+=2;break;
case 0x20:{const at=word(),ret=(cpu.pc-1)&65535;push(ret>>8);push(ret);depth++;cpu.pc=at;cycles+=6;break;}
case 0x4c:cpu.pc=word();cycles+=3;break;
case 0x60:{cycles+=6;if(!depth){for(let j=0;j<prior.length;j++){const orig=prior[j],expect=typ===0?((orig<<1)|(orig>>7))&255:typ===1?((orig>>>1)|((orig&1)<<7)):typ===2?(j%8===7?prior[j-7]:prior[j+1]):typ===3?(j%8===0?prior[j+7]:prior[j-1]):orig^255;if(m[0x3000+j]!==expect)throw Error('PIXEL MISMATCH char '+n+' type '+typ+' byte '+j+' expected '+expect+' got '+m[0x3000+j]);}return {n,type:typ,cycles,instructions:ins,pixels:'EQUAL'};}const l=pop(),h=pop();cpu.pc=((h<<8)|l)+1;depth--;break;}
default:throw Error('unknown opcode '+op.toString(16)+' at '+(cpu.pc-1).toString(16)+' glyph '+n+' type '+typ);
}}throw Error('budget exceeded');}
for(let t of [0,1,2,3,4])for(let n of [1,16,32,64,128,256])console.log(JSON.stringify(bench(n,t)));
