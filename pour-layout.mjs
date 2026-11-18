import {rotate} from './fluid.mjs';
export function bounds(p){const pad=p.w*.12;const q=[[-p.w*.47,-p.h/2-pad],[p.w*.47,-p.h/2-pad],[-p.w*.47,p.h/2+pad],[p.w*.47,p.h/2+pad]].map(v=>rotate(v,p.x,p.y,p.a||0));return {left:Math.min(...q.map(v=>v[0])),right:Math.max(...q.map(v=>v[0])),top:Math.min(...q.map(v=>v[1])),bottom:Math.max(...q.map(v=>v[1]))};}
export function fitPair(source,receiver,width,height,margin=8){const a=bounds(source),b=bounds(receiver);const left=Math.min(a.left,b.left),right=Math.max(a.right,b.right),top=Math.min(a.top,b.top),bottom=Math.max(a.bottom,b.bottom);return {x:Math.max(margin-left,Math.min(0,width-margin-right)),y:Math.max(margin-top,Math.min(0,height-margin-bottom))};}
export function fitVessel(p,width,height,margin=8){const shift=fitPair(p,p,width,height,margin);return {...p,x:p.x+shift.x,y:p.y+shift.y};}

// Leave a dedicated headroom strip and gaps for lifting and turning a vessel.
export function boardLayout(width,height,n){
 const cols=n<=4?2:3,rows=Math.ceil(n/cols),head=Math.min(n>=7?108:88,height*.18),pitch=(height-head-26)/rows;
 const h=n>=7?Math.min(100,width*.31,pitch*.58):Math.min(210,width*.57,pitch*.70,(width-32)*.59),w=n>=7?Math.min(36,h*.30,width*.105):Math.min(64,h*.30,(width-32)/cols*.80),gap=cols===2?width*.66:n>=7?width*.36:(width-28)/cols;
 return Array.from({length:n},(_,i)=>{const row=Math.floor(i/cols),count=Math.min(cols,n-row*cols);return {x:width/2+(i%cols-(count-1)/2)*gap,y:head+h/2+row*pitch,w,h};});
}

export const pourGap=(count,angle=0)=>count>=7?24+45*Math.cos(angle)**2:24;
