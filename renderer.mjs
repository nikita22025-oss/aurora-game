import {pourGap} from './pour-layout.mjs';
import {sampleRoute} from './pour-route.mjs';
import {fitPair,fitVessel,boardLayout} from './pour-layout.mjs';
import {pourState,POUR} from './pour-motion.mjs?v=3';
import {legalTargets,completeBottle} from './core.mjs';
import {drawGlass} from './glass.mjs?v=3';
import {POUR_TIMING} from './water-foley.mjs';
export const COLORS=['#ff688a','#34cbd2','#ffd35b','#aa7af0','#8bdb89','#ff9654'];
const mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
import {FILL,LIP,rotate,surface,interior,tilt} from './fluid.mjs?v=4';
function path(ctx,poly){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
export class BoardRenderer{
 constructor(canvas,targets,onSelect,reduced=false){this.reduced=reduced;this.routeRequests=new Map();this.routeId=0;this.routeWorker=new Worker(new URL("./route-worker.mjs",import.meta.url),{type:"module"});this.routeWorker.onmessage=({data})=>{const pending=this.routeRequests.get(data.id);if(pending){this.routeRequests.delete(data.id);data.error?pending.reject(new Error(data.error)):pending.resolve(data.routes);}};this.routeWorker.onerror=e=>{for(const pending of this.routeRequests.values())pending.reject(new Error(e.message));this.routeRequests.clear();};this.possible=[];this.completedAt=new Map();this.canvas=canvas;this.ctx=canvas.getContext('2d');this.targets=targets;this.onSelect=onSelect;this.board=[];this.selected=-1;this.hint=[];this.active=true;this.motion=null;this.waves=[];this.frame=0;this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(canvas);this.resize();this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);}
 destroy(){this.routeWorker.terminate();for(const p of this.routeRequests.values())p.resolve(null);this.routeRequests.clear();this.active=false;cancelAnimationFrame(this.frame);this.ro.disconnect();if(this.motion){this.motion.resolve();this.motion=null;}}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.w=rect.width||400;this.h=rect.height||380;this.canvas.width=this.w*dpr;this.canvas.height=this.h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.layout();}
 layout(){const n=this.board.length,cols=n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols);this.slots=boardLayout(this.w,this.h,n);this.bh=this.slots[0]?.h||0;this.bw=this.slots[0]?.w||0;this.targets.innerHTML=this.slots.map((p,i)=>`<button data-i="${i}" aria-label="Колба ${i+1}" style="left:${p.x-p.w*.525}px;top:${p.y-p.h/2-10}px;width:${p.w*1.05}px;height:${Math.max(44,Math.min(p.h+28,rows>1?(this.h-85)/rows-4:p.h+28))}px"></button>`).join('');this.targets.querySelectorAll('button').forEach(b=>b.onclick=()=>this.onSelect(+b.dataset.i));}
 update(board,selected=-1,hint=[]){this.board=board.map(x=>[...x]);this.possible=selected>=0?legalTargets(board,selected):[];this.selected=selected;this.hint=hint;if(this.slots?.length!==board.length)this.layout();this.targets.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-label',`Колба ${i+1}, ${board[i].length} слоя`);b.setAttribute('aria-pressed',String(i===selected));b.classList.toggle('can-pour',this.possible.includes(i));b.setAttribute('aria-label',`Колба ${i+1}, ${board[i].length} слоя${completeBottle(board[i])?', собрана':this.possible.includes(i)?', можно перелить сюда':''}`);});}
 async prepareRoutes(from,to,next){
  this.preparedRoutes=null;
  if(this.board.length>4&&this.board.length<7)return;
  const id=++this.routeId;
  const routes=await new Promise((resolve,reject)=>{this.routeRequests.set(id,{resolve,reject});this.routeWorker.postMessage({id,slots:this.slots,from,to,before:this.board[from].length,after:next[from].length,width:this.w,height:this.h});});
  if(this.active){if(!routes?.approach||!routes?.returning)throw new Error("No collision-free pouring route");this.preparedRoutes=routes;}
 }
 animatePour(from,to,next,reduced,startedAt=performance.now()){if(reduced){this.update(next);return Promise.resolve();}return new Promise(resolve=>{this.motion={routes:this.preparedRoutes?.from===from&&this.preparedRoutes?.to===to?this.preparedRoutes:null,from,to,sign:this.slots[to].x<this.w/2?-1:1,next,original:this.board.map(x=>[...x]),n:next[to].length-this.board[to].length,start:startedAt,duration:POUR_TIMING.duration,resolve};});}
 loop(now){if(!this.active)return;this.draw(now);this.frame=requestAnimationFrame(this.loop);}
 draw(now){const c=this.ctx;
 // WebGL draws the pouring pair; its empty annotation layer only needs clearing once.
 if(!this.renderStream3d||!this.motion||this.overlayMotion!==this.motion)c.clearRect(0,0,this.w,this.h);
 this.overlayMotion=this.motion;if(!this.slots)return;
 const m=this.motion,t=m?Math.min(1,(now-m.start)/m.duration):0;
 const flowState=pourState(t),transfer=m?flowState.emitted:0,received=m?flowState.received:0;
 const source=m?this.slots[m.from]:null,dest=m?{...this.slots[m.to]}:null;
 const poses=this.slots.map((p,i)=>({...p,a:0,y:p.y-(i===this.selected?15:0)}));
 if(m){const s=source,d=dest,sign=m.sign;
  // The downward rim must meet the free surface at the remaining volume.
  const angle=sign*tilt(s.w,s.h,m.original[m.from].length-m.n*transfer);
  const lipLocal=[sign*s.w*LIP,-s.h/2+5];
  const rim=rotate(lipLocal,0,0,angle);
  const target={x:d.x-rim[0],y:d.y-d.h/2-pourGap(this.board.length,angle)-rim[1]};
  const go=t<.30?ease(t/.30):t>POUR.returnAt?1-ease((t-POUR.returnAt)/(1-POUR.returnAt)):1;
  const shift=fitPair({...s,...target,a:angle},{...d,a:0},this.w,this.h);
  target.x+=shift.x;target.y+=shift.y;dest.x+=shift.x*go;dest.y+=shift.y*go;poses[m.to]={...dest,a:0};
  const pose={...s,x:mix(s.x,target.x,go),y:mix(s.y-15,target.y,go)-Math.sin(go*Math.PI)*Math.min(40,s.h*.2),a:angle*go};
  if(t<.30&&m.routes?.approach){const p=sampleRoute(m.routes.approach,ease(t/.30));Object.assign(pose,p);}
  if(t>POUR.returnAt&&m.routes?.returning){const p=sampleRoute(m.routes.returning,1-ease((t-POUR.returnAt)/(1-POUR.returnAt)));Object.assign(pose,p);}
  poses[m.from]=fitVessel(pose,this.w,this.h);

 }

 const drawOne=i=>{if(this.renderStream3d&&this.renderFocus&&this.snapshotReady&&i!==this.renderFocus.from&&i!==this.renderFocus.to){this.bottle(poses[i],[],i,now);return;}let layers=this.board[i].map(color=>({color,amount:1}));if(m&&i===m.from){let remaining=m.n*transfer;for(let j=layers.length-1;j>=0&&remaining>0;j--){let n=Math.min(remaining,layers[j].amount);layers[j].amount-=n;remaining-=n;}}if(m&&i===m.to)layers.push({color:m.original[m.from].at(-1),amount:m.n*received});const bands=[];for(const layer of layers){if(layer.amount<.001)continue;const last=bands.at(-1);if(last?.color===layer.color)last.amount+=layer.amount;else bands.push({...layer});}this.bottle(poses[i],bands,i,now);};
 for(let i=0;i<this.board.length;i++)if(!m||i!==m.from)drawOne(i);
 if(m){drawOne(m.from);if(t>.30&&t<.76&&!this.renderStream3d){const p=poses[m.from],sign=m.sign,lip=rotate([sign*p.w*LIP,-p.h/2+5],p.x,p.y,p.a);
 const poly=interior(dest.w,dest.h).map(q=>rotate(q,dest.x,dest.y,0));
 const end=[dest.x,surface(poly,(m.original[m.to].length+m.n*transfer)*FILL/4)];
 const flow=Math.min(1,(t-.30)/.035,(.76-t)/.04),width=Math.max(.5,(4.8+Math.min(m.n,3)*.45)*flow);
 c.save();
 const points=[];for(let j=0;j<=28;j++){const u=j/28,yy=mix(lip[1],end[1],u);const xx=mix(lip[0],end[0],u)+sign*Math.sin(u*Math.PI)*2.5+Math.sin(u*13-now*.024)*.35*Math.sin(u*Math.PI);const radius=width*.5/Math.sqrt(1+u*1.8)*(1+.13*Math.sin(u*29-now*.033));points.push({x:xx,y:yy,r:radius});}
 path(c,[...points.map(p=>[p.x-p.r,p.y]),...points.slice().reverse().map(p=>[p.x+p.r,p.y])]);
 c.shadowColor=COLORS[m.original[m.from].at(-1)]+'55';c.shadowBlur=4;
 const water=c.createLinearGradient(lip[0]-3,0,lip[0]+3,0);water.addColorStop(0,COLORS[m.original[m.from].at(-1)]+'99');water.addColorStop(.35,'#dfffffe6');water.addColorStop(.6,COLORS[m.original[m.from].at(-1)]+'dd');water.addColorStop(1,'#ffffff88');c.fillStyle=water;c.fill();c.shadowBlur=0;
 c.strokeStyle='#ffffffaa';c.lineWidth=.65;c.beginPath();points.forEach((p,k)=>k?c.lineTo(p.x-p.r*.3,p.y):c.moveTo(p.x,p.y));c.stroke();
 c.strokeStyle=COLORS[m.original[m.from].at(-1)]+'99';c.lineWidth=1;for(let k=0;k<3;k++){const q=(now/450+k/3)%1;c.globalAlpha=(1-q)*flow;c.beginPath();c.ellipse(end[0],end[1]+1,q*dest.w*.27,1+q*3,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
 for(let k=0;k<5;k++){const q=(now/210+k*.2)%1;c.fillStyle=COLORS[m.original[m.from].at(-1)]+'bb';c.beginPath();c.arc(end[0]+Math.sin(k*2.5)*q*9,end[1]-Math.sin(q*Math.PI)*9,1.3*(1-q)*flow,0,Math.PI*2);c.fill();}c.restore();}if(t===1){m.next.forEach((b,i)=>{if(completeBottle(b)&&!completeBottle(m.original[i]))this.completedAt.set(i,now);});this.board=m.next.map(x=>[...x]);this.motion=null;this.settle={index:m.to,start:now};m.resolve();}}
 }
 bottle(p,layers,index,now){const c=this.ctx,{x,y,w,h,a}=p;const poly=interior(w,h).map(q=>rotate(q,x,y,a));
 c.save();c.translate(x,this.slots[index].y+h/2+12);c.scale(1,.16);const shadow=c.createRadialGradient(0,0,0,0,0,w*.8);shadow.addColorStop(0,'#00151b88');shadow.addColorStop(1,'#00151b00');c.fillStyle=shadow;c.beginPath();c.arc(0,0,w*.8,0,Math.PI*2);c.fill();c.restore();
 c.save();path(c,poly);c.clip();const base=c.createLinearGradient(x-w/2,0,x+w/2,0);base.addColorStop(0,'#9adbd214');base.addColorStop(.45,'#183d421a');base.addColorStop(1,'#a9e6e126');c.fillStyle=base;c.fillRect(x-h-w,y-h,h*2+w*2,h*3);
 // A damped oscillator responds to actual bottle movement, then settles.
 const previous=this.waves[index]||{x,y,a,time:now,v:0,q:0};
 const dt=Math.min(.033,Math.max(.001,(now-previous.time)/1000));
 const impulse=(x-previous.x)*.035+(a-previous.a)*7;
 previous.v+=impulse*10;previous.v+=(-60*previous.q-6*previous.v)*dt;
 previous.q=Math.max(-7,Math.min(7,previous.q+previous.v*dt));
 Object.assign(previous,{x,y,a,time:now});this.waves[index]=previous;
 const receiving=this.motion?.to===index;
 const settling=this.settle?.index===index?Math.exp(-(now-this.settle.start)/450):0;
 const amp=this.reduced?0:receiving?1.35:settling*2; if(this.reduced){previous.q=0;previous.v=0;}
 const xs=poly.map(v=>v[0]),left=Math.min(...xs),right=Math.max(...xs),span=right-left;
 const boundary=(height,fraction)=>{const points=[];for(let k=0;k<=40;k++){const u=k/40,xx=left+span*u;
 const wave=(previous.q*Math.cos(u*Math.PI)+amp*Math.sin(u*Math.PI*4-now*.018))*Math.min(1,fraction*3);
 points.push([xx,height+wave]);}return points;};
 let amount=0;
 for(const l of layers){if(l.amount<.001)continue;
 const low=surface(poly,amount*FILL/4),high=surface(poly,(amount+l.amount)*FILL/4);
 const upper=boundary(high,(amount+l.amount)/4),lower=boundary(low,amount/4);
 c.save();path(c,[...upper,...lower.reverse()]);c.clip();
 c.fillStyle=COLORS[l.color];c.fillRect(left,y-h*2,span,h*4);
 const depth=c.createLinearGradient(0,high,0,low);depth.addColorStop(0,'#ffffff18');depth.addColorStop(.2,'#ffffff00');depth.addColorStop(1,'#04102545');c.fillStyle=depth;c.fillRect(left,high-8,span,low-high+16);
 const shine=c.createLinearGradient(left,0,right,0);shine.addColorStop(0,'#05132466');shine.addColorStop(.09,'#ffffff20');shine.addColorStop(.23,'#ffffff30');shine.addColorStop(.5,'#ffffff04');shine.addColorStop(.84,'#02162e44');shine.addColorStop(1,'#cefbff40');c.fillStyle=shine;c.fillRect(left,y-h*2,span,h*4);c.restore();
 // A curved meniscus gives each liquid band a rounded, optical surface.
 if(Math.abs(a)<.12&&high<low-3){c.save();c.globalAlpha=.32;c.fillStyle='#dfffff';c.beginPath();c.ellipse(x,high+1,w*.345,Math.min(3,w*.045),0,0,Math.PI*2);c.fill();c.restore();}
 c.strokeStyle='#e8ffff80';c.lineWidth=1;c.beginPath();upper.forEach((v,k)=>k?c.lineTo(...v):c.moveTo(...v));c.stroke();
 if(receiving&&l===layers.at(-1)){for(let k=0;k<5;k++){const phase=(now*.0015+k*.21)%1;c.strokeStyle='#eaffff77';c.lineWidth=.7;c.beginPath();c.arc(x+Math.sin(k*7+phase*3)*w*.13,high+3+(1-phase)*Math.min(18,low-high),.8+phase,0,Math.PI*2);c.stroke();}}
 amount+=l.amount;
 }c.restore();

 const available=!this.motion&&this.possible.includes(index);
 drawGlass(c,p,this.hint.includes(index)?'#e7ce80':index===this.selected?'#f2cc8d':available?'#8ed6df':null);
 if(available){c.save();c.fillStyle='#b5e7df';c.font='16px sans-serif';c.textAlign='center';c.fillText('↓',x,y-h/2-13);c.restore();}
 const completed=this.completedAt.get(index),age=completed===undefined?2:(now-completed)/1000;
 if(!this.reduced&&age<.85){c.save();c.globalAlpha=1-age/.85;c.strokeStyle='#d8edb4';c.lineWidth=1.4;c.beginPath();c.ellipse(x,y+h/2+7,w*(.48+age*.35),4+age*9,0,0,Math.PI*2);c.stroke();for(let k=0;k<6;k++){const angle=k*Math.PI/3;c.fillStyle='#e5efb8';c.beginPath();c.arc(x+Math.cos(angle)*(w*.48+age*16),y-h/2+Math.sin(angle)*12-age*20,1.7,0,Math.PI*2);c.fill();}c.restore();}
 c.fillStyle='#bca887';c.font='9px Manrope, sans-serif';c.textAlign='center';c.fillText(String(index+1).padStart(2,'0'),this.slots[index].x,this.slots[index].y+h/2+32);
 if(!this.motion&&completeBottle(this.board[index])){c.fillStyle='#c9e6a5';c.font='15px sans-serif';c.fillText('✓',x,y-h/2-14);}
 }
}
