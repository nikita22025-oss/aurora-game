import {pourGap} from './pour-layout.mjs';
import {planRoute,compileRoute} from './pour-route.mjs';
import {tilt,rotate,LIP} from './fluid.mjs';
import {fitPair} from './pour-layout.mjs';
const cache=new Map();
self.onmessage=({data})=>{
 const {id,slots,from,to,before,after,width,height}=data;
 try{
 const s=slots[from],d=slots[to],sign=d.x<width/2?-1:1;
 const goal=units=>{const a=sign*tilt(s.w,s.h,units),rim=rotate([sign*s.w*LIP,-s.h/2+5],0,0,a),p={...s,x:d.x-rim[0],y:d.y-d.h/2-pourGap(slots.length,a)-rim[1],a},shift=fitPair(p,{...d,a:0},width,height);return {...p,x:p.x+shift.x,y:p.y+shift.y};};
 const route=(units,lift)=>{const key=[width,height,slots.length,from,to,units,lift].join(':');if(cache.has(key))return cache.get(key);const path=planRoute({...s,y:s.y-lift,a:0},goal(units),slots.filter((_,i)=>i!==from&&(slots.length>=7||i!==to)),width,height);const result=path?compileRoute(path):null;cache.set(key,result);if(cache.size>500)cache.delete(cache.keys().next().value);return result;};
 self.postMessage({id,routes:{from,to,approach:route(before,15),returning:route(after,0)}});
 }catch(e){self.postMessage({id,error:String(e)});}
};
