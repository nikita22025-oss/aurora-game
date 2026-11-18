import {bounds} from './pour-layout.mjs';
import {rotate} from './fluid.mjs';
// Screen-space clearance for the real glass silhouette, including a small air gap.
function polygon(p){const r=p.w*.385+1,top=-p.h/2+3,depth=r*.24+2,bottom=p.h/2+1,poly=[[-r-2,top-depth],[r+2,top-depth],[r+2,top+depth],[r,bottom-r]];for(let k=1;k<=8;k++){const a=k*Math.PI/8;poly.push([Math.cos(a)*r,bottom-r+Math.sin(a)*r]);}poly.push([-r-2,top+depth]);return poly.map(v=>rotate(v,p.x,p.y,p.a||0));}
const boxCache=new WeakMap(),obstacleCache=new WeakMap(),expandedCache=new WeakMap();
function box(poly){let b=boxCache.get(poly);if(!b){b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};for(const [x,y] of poly){b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);}boxCache.set(poly,b);}return b;}
function obstacle(o){let poly=obstacleCache.get(o);if(!poly){poly=polygon({...o,w:o.w+7,h:o.h+7});obstacleCache.set(o,poly);}return poly;}
function overlap(a,b){const aa=box(a),bb=box(b);if(aa.right<bb.left||bb.right<aa.left||aa.bottom<bb.top||bb.bottom<aa.top)return false;for(const shape of [a,b])for(let i=0;i<shape.length;i++){const j=(i+1)%shape.length,nx=shape[j][1]-shape[i][1],ny=shape[i][0]-shape[j][0];let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(const v of a){const d=v[0]*nx+v[1]*ny;amin=Math.min(amin,d);amax=Math.max(amax,d);}for(const v of b){const d=v[0]*nx+v[1]*ny;bmin=Math.min(bmin,d);bmax=Math.max(bmax,d);}if(amax<bmin||bmax<amin)return false;}return true;}
export function routeClear(p,obstacles,width,height){const poly=polygon(p),box=bounds(p);if(box.left<7.99||box.right>width-7.99||box.top<7.99||box.bottom>height-7.99)return false;return !obstacles.some(o=>overlap(poly,obstacle(o)));}
const lerp=(a,b,t)=>({...a,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,a:(a.a||0)+((b.a||0)-(a.a||0))*t});
function clearLine(a,b,obs,w,h){let inflated=expandedCache.get(obs);if(!inflated){inflated=obs.map(p=>({...p,w:p.w+2,h:p.h+2}));expandedCache.set(obs,inflated);}obs=inflated;const steps=Math.ceil(Math.max(Math.hypot(a.x-b.x,a.y-b.y)/2,Math.abs((a.a||0)-(b.a||0))/.02));for(let i=1;i<=steps;i++)if(!routeClear(lerp(a,b,i/steps),obs,w,h))return false;return true;}
// Ease into the tilt after lifting; validate every curved segment with the same clearance as the planner.
function arcBetween(start, goal, obstacles, width, height) {
 const arc = [start];
 for (let step=1; step<=16; step++) {
  const t=step/16;
  const pose=lerp(start,goal,t);
  pose.y-=Math.sin(Math.PI*t)*Math.min(22,start.h*.13);
  const roll=t*t*t*(10+t*(6*t-15));
  pose.a=start.a+(goal.a-start.a)*roll;
  if (!clearLine(arc.at(-1),pose,obstacles,width,height)) return [start,goal];
  arc.push(pose);
 }
 return arc;
}

export function planRoute(start,goal,obs,width,height){
 start={...start,a:start.a||0};if(!routeClear(goal,obs,width,height))return null;
 if(clearLine(start,goal,obs,width,height))return arcBetween(start,goal,obs,width,height);
 const step=18,turn=Math.PI/12,key=(x,y,a)=>`${x},${y},${a}`,heap=[],seen=new Map(),validity=new Map();
 const score=p=>Math.hypot(p.x-goal.x,p.y-goal.y)/step+Math.abs(p.a-goal.a)/turn;
 function push(v){heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=v.f)break;heap[i]=heap[p];i=p;}heap[i]=v;}
 function pop(){const first=heap[0],v=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=v.f)break;heap[i]=heap[c];i=c;}heap[i]=v;}return first;}
 const root={ix:0,iy:0,ia:0,p:start,g:0,f:score(start)};push(root);seen.set('0,0,0',0);let count=0;
 while(heap.length&&count++<16000){const cur=pop();if(score(cur.p)<3&&clearLine(cur.p,goal,obs,width,height)){const path=[goal];let node=cur;while(node){path.unshift(node.p);node=node.parent;}const short=[path[0]];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clearLine(path[i],path[j],obs,width,height))j--;short.push(path[j]);i=j;}return short.flatMap((point,index)=>index?arcBetween(short[index-1],point,obs,width,height).slice(1):[point]);}
 for(const [dx,dy,da] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[0,0,1],[0,0,-1]]){const ix=cur.ix+dx,iy=cur.iy+dy,ia=cur.ia+da;if(Math.abs(ia)>8)continue;const p={...start,x:start.x+ix*step,y:start.y+iy*step,a:ia*turn},g=cur.g+(da?1:Math.hypot(dx,dy)),k=key(ix,iy,ia);if((seen.get(k)??Infinity)<=g)continue;let valid=validity.get(k);if(valid===undefined){valid=routeClear(p,obs,width,height);validity.set(k,valid);}if(!valid||!clearLine(cur.p,p,obs,width,height))continue;seen.set(k,g);push({ix,iy,ia,p,g,f:g+score(p)*1.15,parent:cur});}
 }return null;
}
export function compileRoute(points){const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)+Math.abs(p.a-points[i].a)*p.h*.4);return {points,lengths,total:lengths.reduce((a,b)=>a+b,0)};}
export function sampleRoute(route,t){const {points,lengths,total}=Array.isArray(route)?compileRoute(route):route;let d=Math.max(0,Math.min(1,t))*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1)return lerp(points[i],points[i+1],lengths[i]?d/lengths[i]:1);d-=lengths[i];}return points.at(-1);}
