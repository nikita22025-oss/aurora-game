import {WATER_START,WATER_END,waterEnvelope,DROP_EVENTS,DROP_PEAK_SECONDS} from './pour-audio.mjs?v=3';
let context,master,waterBuffer,tailBuffer,preparing,audioEpoch=0;
const waterFile=fetch(new URL('./assets/water-stream-soft-v3.wav',import.meta.url)).then(r=>{if(!r.ok)throw Error('Water audio unavailable');return r.arrayBuffer();}).catch(()=>null);
const tailFile=fetch(new URL('./assets/water-drop-soft-v3.wav',import.meta.url)).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);
function decodedWater(c){
 preparing??=Promise.all([waterFile,tailFile].map(f=>f.then(data=>data?c.decodeAudioData(data.slice(0)):null).catch(()=>null))).then(([water,tail])=>{waterBuffer=water;tailBuffer=tail;return water;});
 return preparing;
}
export function prepareAudio(){
 const c=ctx();if(!c)return Promise.resolve(null);
 return Promise.all([decodedWater(c),c.resume().catch(()=>{})]).then(([buffer])=>buffer);
}
const active=new Set();
function ctx(resume=true){
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
 if(!context){context=new C({latencyHint:'interactive'});master=context.createGain();master.gain.value=.8;master.connect(context.destination);}
 if(resume)context.resume().catch(()=>{});return context;
}
function tone(c,t,f,volume,duration=.1){
 const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f,t);
 o.frequency.exponentialRampToValueAtTime(f*.96,t+duration);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.003);
 g.gain.exponentialRampToValueAtTime(.0001,t+duration);
 o.connect(g).connect(master);active.add(o);o.start(t);o.stop(t+duration+.01);
 o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();};
}
// Allocate and connect the complete graph before the animation clock starts.
export async function prepareLiquidSound(reduced=false,options={}){
 const c=ctx();if(!c)return null;
 const epoch=audioEpoch,buffer=await prepareAudio();
 if(!buffer||epoch!==audioEpoch||document.hidden)return null;
 if(reduced)return {start(){tone(c,c.currentTime,900,.018,.08);},cancel(){}};
 const lastEnd=DROP_EVENTS.at(-1).time+(tailBuffer?.duration||0)/DROP_EVENTS.at(-1).rate;
 if(options.startedAt!==undefined&&(performance.now()-options.startedAt)/1000>=lastEnd)return null;
 const make=(buffer,rate=1)=>{
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;source.playbackRate.value=rate;
  source.connect(gain).connect(master);
  const node={source,gain,dispose(){active.delete(source);source.disconnect();gain.disconnect();}};
  source.onended=()=>node.dispose();return node;
 };
 const stream=make(buffer),drops=DROP_EVENTS.map(d=>tailBuffer?make(tailBuffer,d.rate):null);
 const envelope=waterEnvelope(WATER_START,options.amount||1);
 let used=false;
 const cancel=()=>{if(used)return;used=true;stream.dispose();drops.forEach(n=>n?.dispose());};
 return {cancel,start(startedAt=performance.now()){
  if(used)return;if(epoch!==audioEpoch||document.hidden){cancel();return;}used=true;
  // Map to the hardware output clock; do not add output latency a second time.
  const stamp=c.getOutputTimestamp?.();
  const zero=stamp?.performanceTime>0&&Math.abs(performance.now()-stamp.performanceTime)<1000
   ?stamp.contextTime+(startedAt-stamp.performanceTime)/1000
   :c.currentTime+(startedAt-performance.now())/1000-(c.outputLatency||c.baseLatency||0);
  const nominalStart=zero+WATER_START,end=zero+WATER_END,when=Math.max(c.currentTime,nominalStart),missed=Math.max(0,when-nominalStart);
  if(when<end&&missed<buffer.duration){
   stream.gain.gain.setValueCurveAtTime(missed?waterEnvelope(WATER_START+missed,options.amount||1):envelope,when,end-when);
   active.add(stream.source);stream.source.start(when,missed);stream.source.stop(Math.min(end,when+buffer.duration-missed));
  }else stream.dispose();
  DROP_EVENTS.forEach((drop,i)=>{
   const node=drops[i];if(!node)return;
   const start=zero+drop.time-DROP_PEAK_SECONDS/drop.rate,end=start+tailBuffer.duration/drop.rate,when=Math.max(c.currentTime,start);
   if(when>=end){node.dispose();return;}
   node.gain.gain.value=drop.gain;active.add(node.source);
   node.source.start(when,Math.max(0,when-start)*drop.rate);node.source.stop(end);
  });
 }};
}
export async function liquidSound(reduced=false,options={}){
 const playback=await prepareLiquidSound(reduced,options);playback?.start(options.startedAt);
}
export function stopSounds(){audioEpoch++;for(const source of active){try{source.stop();}catch{}}active.clear();}
export function interfaceSound(name){
 const c=ctx();if(!c)return;const t=c.currentTime;
 if(name==='select'){tone(c,t,1450,.012,.075);tone(c,t,2310,.004,.045);}
 else if(name==='invalid')tone(c,t,170,.012,.09);
 else if(name==='complete'){tone(c,t,784,.014,.18);tone(c,t+.08,1046,.012,.22);}
 else if(name==='win')[523.25,659.25,783.99].forEach((f,i)=>tone(c,t+i*.12,f,.023,.38));
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSounds();});

// Decode during loading; output remains suspended until the first user gesture.
const preloadContext=ctx(false);if(preloadContext)decodedWater(preloadContext);
