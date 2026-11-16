export const FILL=.84;
export const LIP=.35;
export const rotate=(p,x=0,y=0,a=0)=>[x+p[0]*Math.cos(a)-p[1]*Math.sin(a),y+p[0]*Math.sin(a)+p[1]*Math.cos(a)];
export const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
export function below(poly,y){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],aa=a[1]>=y,bb=b[1]>=y;if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+t*(b[0]-a[0]),y]);}}return out;}
// Shoelace accumulation of a clipped polygon without allocating a new array per iteration.
export function submergedArea(poly,y){let firstX=0,firstY=0,lastX=0,lastY=0,count=0,sum=0;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],aa=a[1]>=y,bb=b[1]>=y;
  if(aa){const x=a[0],z=a[1];if(count)sum+=lastX*z-x*lastY;else{firstX=x;firstY=z;}lastX=x;lastY=z;count++;}
  if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]),x=a[0]+t*(b[0]-a[0]);if(count)sum+=lastX*y-x*lastY;else{firstX=x;firstY=y;}lastX=x;lastY=y;count++;}
 }
 return count?Math.abs(sum+lastX*firstY-firstX*lastY)/2:0;
}
export function surface(poly,f){let lo=Infinity,hi=-Infinity;for(let j=0;j<poly.length;j++){const y=poly[j][1];if(y<lo)lo=y;if(y>hi)hi=y;}const target=area(poly)*f;for(let i=0;i<26;i++){const m=(lo+hi)/2;if(submergedArea(poly,m)>target)lo=m;else hi=m;}return (lo+hi)/2;}
export function interior(w,h){const r=w*.35,top=-h/2+5,bottom=h/2-8,p=[[-r,top],[r,top],[r,bottom-r]];for(let i=0;i<=32;i++){const a=i*Math.PI/32;p.push([Math.cos(a)*r,bottom-r+Math.sin(a)*r]);}return p;}
const tiltShapes=new Map();
export function tilt(w,h,units){const key=w+':'+h;let shape=tiltShapes.get(key);if(!shape){const p=interior(w,h);shape={p,q:p.map(()=>[0,0]),volume:area(p)};if(tiltShapes.size>30)tiltShapes.clear();tiltShapes.set(key,shape);}
 const {p,q,volume}=shape,target=volume*Math.max(.0001,units)*FILL/4;let lo=0,hi=Math.PI*.94;
 for(let i=0;i<28;i++){const a=(lo+hi)/2,c=Math.cos(a),s=Math.sin(a);for(let j=0;j<p.length;j++){q[j][0]=p[j][0]*c-p[j][1]*s;q[j][1]=p[j][0]*s+p[j][1]*c;}const lipY=w*LIP*s+(-h/2+5)*c;if(submergedArea(q,lipY)>target)lo=a;else hi=a;}
 return (lo+hi)/2;
}
