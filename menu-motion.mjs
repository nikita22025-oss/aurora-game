// Decorative menu only. All work is disposed before the gameplay renderer starts.
export function mountMenuMotion(host,{reduced=false,paused=false}={}){
 const art=host.querySelector('.home-art');
 art.innerHTML=`<div class="menu-water"><i class="menu-fish fish-a"></i><i class="menu-fish fish-b"></i><i class="menu-fish fish-c"></i><i class="menu-ray"></i></div>`;
 art.querySelectorAll('.menu-fish').forEach(fish=>{fish.innerHTML='<img src="assets/menu-fish-single-v2.png" alt="" draggable="false">';});
 const stage=document.createElement('div');stage.className='robot-performance';stage.setAttribute('role','img');stage.setAttribute('aria-label','Робот Аврора переливает светящийся реагент и ловит подброшенную колбу');
 stage.innerHTML=`<svg viewBox="0 0 320 340" aria-hidden="true">
 <defs><linearGradient id="bot-shell" x2=".8" y2="1"><stop stop-color="#fff9dc"/><stop offset=".5" stop-color="#e8d9b1"/><stop offset="1" stop-color="#ad9878"/></linearGradient><linearGradient id="bot-mint" x2="1" y2="1"><stop stop-color="#bcffe5"/><stop offset="1" stop-color="#39b5a5"/></linearGradient><linearGradient id="bot-glass"><stop stop-color="#eaffff" stop-opacity=".7"/><stop offset=".25" stop-color="#caffff" stop-opacity=".1"/><stop offset=".8" stop-color="#84e9ff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".8"/></linearGradient><linearGradient id="bot-liquid"><stop stop-color="#abffec"/><stop offset=".4" stop-color="#4ee8d6"/><stop offset="1" stop-color="#15b7bd"/></linearGradient><clipPath id="source-clip"><path d="M-15-65V0Q-15 17 0 17Q15 17 15 0V-65Z"/></clipPath><clipPath id="target-clip"><path d="M-15-65V0Q-15 17 0 17Q15 17 15 0V-65Z"/></clipPath></defs>
 <ellipse cx="160" cy="319" rx="66" ry="8" fill="#104e61" opacity=".22"/>
 <g class="robot-head"><svg x="65" y="6" width="195" height="326" viewBox="0 0 750 1254"><image href="assets/robot-rig-v1.png" width="1254" height="1254"/></svg></g>
 <g class="robot-arm-left"><svg x="-95" y="-31" width="105" height="58" viewBox="780 300 420 232"><image href="assets/robot-rig-v1.png" width="1254" height="1254"/></svg></g>
 <g transform="translate(195 188) rotate(40)"><svg x="-10" y="-17" width="105" height="58" viewBox="780 780 420 232"><image href="assets/robot-rig-v1.png" width="1254" height="1254"/></svg></g>
 <g transform="translate(237 247) scale(.65)"><path d="M-16-65V0Q-16 18 0 18Q16 18 16 0V-65" fill="url(#bot-glass)" stroke="#dffffb" stroke-width="2.5"/><g clip-path="url(#target-clip)"><path class="robot-fill-target" fill="url(#bot-liquid)"/></g><path d="M-21-65H21" stroke="#ecfff3" stroke-width="5" stroke-linecap="round"/><path d="M-10-54V-4" stroke="#fff" opacity=".65" stroke-width="3" stroke-linecap="round"/></g>
 <path class="robot-stream" fill="none" stroke="#7affdf" stroke-width="4" stroke-linecap="round"/><circle class="robot-drop" r="2.7" fill="#c1fff0"/>
 <g class="robot-source"><path d="M-16-65V0Q-16 18 0 18Q16 18 16 0V-65" fill="url(#bot-glass)" stroke="#e8fff8" stroke-width="2.5"/><g clip-path="url(#source-clip)"><path class="robot-fill-source" fill="url(#bot-liquid)"/></g><path d="M-21-65H21" stroke="#ecfff3" stroke-width="5" stroke-linecap="round"/><path d="M-10-54V-4" stroke="#fff" opacity=".7" stroke-width="3" stroke-linecap="round"/></g>
 </svg>`;
 host.append(stage);
 const q=s=>stage.querySelector(s),source=q('.robot-source'),fill=q('.robot-fill-source'),target=q('.robot-fill-target'),stream=q('.robot-stream'),drop=q('.robot-drop'),arm=q('.robot-arm-left'),head=q('.robot-head');
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 let raf=0,elapsed=0,last=0,disposed=false;
 function draw(t){
  const phase=t%18,tilt=smooth((phase-2)/1.3)*(1-smooth((phase-6.2)/1.2));
  const amount=smooth((phase-3.3)/2.8),reset=smooth((phase-15.5)/1.5),level=amount*(1-reset);
  const toss=phase>10&&phase<11.6?(phase-10)/1.6:0;
  const armAngle=-55-135*tilt,ar=armAngle*Math.PI/180;
  const x=118-78*Math.cos(ar)+7*Math.sin(ar),y=188-78*Math.sin(ar)-7*Math.cos(ar),angle=tilt*65+(toss?360*toss:0),rad=angle*Math.PI/180;
  const flight=toss?Math.sin(Math.PI*toss)*104:0;
  source.setAttribute('transform',`translate(${x} ${y-flight}) rotate(${angle}) scale(.65)`);
  // Counter-slope keeps the liquid surface horizontal during the pouring tilt.
  const h=-45+64*level,slope=Math.tan(tilt*65*Math.PI/180),wave=Math.sin(t*5)*1.4;
  fill.setAttribute('d',`M-40 ${h+40*slope+wave}L40 ${h-40*slope-wave}V30H-40Z`);
  target.setAttribute('d',`M-20 ${3-46*level}Q0 ${1-46*level+Math.sin(t*7)} 20 ${3-46*level}V25H-20Z`);
  const lx=x+.65*(16*Math.cos(rad)+65*Math.sin(rad)),ly=y+.65*(16*Math.sin(rad)-65*Math.cos(rad));
  const pouring=phase>=3.3&&phase<6.1;
  stream.style.opacity=pouring?'1':'0';stream.setAttribute('d',`M${lx} ${ly}Q${lx+2} ${(ly+205)/2}237 205`);
  const d=(phase-6.1)/.18,fall=d>=0&&d<3?d%1:-1;drop.style.opacity=fall>=0?'1':'0';drop.setAttribute('cx',lx+(237-lx)*Math.max(0,fall));drop.setAttribute('cy',ly+(205-ly)*Math.max(0,fall)**2);
  arm.setAttribute('transform',`translate(118 188) rotate(${armAngle})`);
  head.setAttribute('transform',`rotate(${tilt*-1.5+(toss?-1*Math.sin(toss*Math.PI):Math.sin(t*.8)*.6)} 160 155)`);
 }
 function frame(now){if(disposed)return;if(last)elapsed+=(now-last)/1000;last=now;draw(elapsed);raf=requestAnimationFrame(frame);}
 function visibility(){cancelAnimationFrame(raf);last=0;const stop=document.hidden||paused||reduced;host.classList.toggle('motion-paused',stop);if(!stop&&!disposed)raf=requestAnimationFrame(frame);}
 draw(0);visibility();document.addEventListener('visibilitychange',visibility);
 return ()=>{disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);stage.remove();};
}
