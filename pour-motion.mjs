// One time model drives vessel volumes, the travelling jet, and impact ripples.
export const POUR={start:.30,end:.72,flight:.045,returnAt:.88};
const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function emission(t){return smooth((t-POUR.start)/(POUR.end-POUR.start));}
export function flowRate(t){const x=(t-POUR.start)/(POUR.end-POUR.start);return x<=0||x>=1?0:4*x*(1-x);}
export function pourState(t){const emitted=emission(t),received=emission(t-POUR.flight);return {emitted,received,inFlight:emitted-received,impact:flowRate(t-POUR.flight)};}
export function jetSection(t,fraction){
 // Travel time increases with sqrt(distance): a gravity-accelerated falling jet.
 const age=POUR.flight*Math.sqrt(clamp(fraction));
 return {rate:flowRate(t-age),radius:Math.sqrt(flowRate(t-age))/Math.sqrt(1+fraction*2.8)};
}
export function stepSlosh(previous,pose,now,reduced=false){
 const p=previous||{x:pose.x,a:pose.a,time:now,q:0,v:0,dx:0,da:0};
 const dt=Math.min(.04,Math.max(.001,(now-p.time)/1000));
 const velocity=(pose.x-p.x)/dt;
 // Changes of velocity and angle inject momentum; resting vessels receive no forcing.
 const angularVelocity=(pose.a-p.a)/dt;
 let v=p.v-(velocity-p.dx)*.012+(angularVelocity-(p.da||0))*.055+(pose.a-p.a)*8;
 let q=p.q;const steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
 for(let i=0;i<steps;i++){v+=(-48*q-5.3*v)*h;q+=v*h;}
 if(Math.abs(q)>3.2){q=Math.sign(q)*3.2;v*=.65;}
 if(reduced){q=0;v=0;}
 return {x:pose.x,a:pose.a,time:now,q,v,dx:velocity,da:angularVelocity};
}
export function waterOffset(x,z,radius,time,slope,ripple){
 const u=Math.max(-1,Math.min(1,x/radius)),d=Math.hypot(x,z)/radius;
 return slope*u*(1+.28*(1-u*u))+ripple*Math.sin(d*6-time*10)*Math.exp(-d*1.6);
}

// Residual water detaches before the vessel begins its return.
export const FINAL_DROPS=[{release:.72,impact:.765,gain:1},{release:.77,impact:.815,gain:.66},{release:.81,impact:.855,gain:.42}];

// A residual bead grows at the lip, detaches, accelerates and relaxes toward a sphere.
export function dropShape(phase,drop){
 const growth=.018,age=(phase-drop.release)/(drop.impact-drop.release);
 if(phase<drop.release-growth||age>1)return null;
 if(age<0){const size=smooth((phase-drop.release+growth)/growth);return {fall:0,scale:size,stretch:1+.5*size};}
 return {fall:age*age,scale:1,stretch:1+.5*Math.exp(-age*4)*Math.cos(age*9)+.22*age};
}
