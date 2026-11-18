// Dry mono liquid foley: damped bubble resonances only, no noise layer.
// Shared with the preview renderer; no downloads or runtime dependencies.
export const POUR_TIMING = Object.freeze({duration:2120, start:.30, end:.72});
export function waterSamples(rate,{amount=1,fill=0,random=Math.random}={}){
 const flow=(POUR_TIMING.end-POUR_TIMING.start)*POUR_TIMING.duration/1000;
 const out=new Float32Array(Math.ceil(rate*(flow+.24)));
 const volume=Math.min(1,Math.max(.25,amount/4));
 function bubble(t,frequency,gain,duration){
  const begin=Math.floor(t*rate);let phase=0;
  for(let k=0;k<duration*rate&&begin+k<out.length;k++){
   const s=k/rate,u=s/duration;
   phase+=2*Math.PI*frequency*(1+.38*(1-Math.exp(-u*5)))/rate;
   out[begin+k]+=Math.sin(phase)*gain*Math.min(1,s/.003)*Math.exp(-u*6)*(1-u);
  }
 }
 // Irregular bubbles, rising resonance as the receiving air cavity gets smaller.
 for(let t=.012;t<flow-.025;t+=.022+random()*.043){
  const p=t/flow,level=Math.min(1,(fill+amount*p)/4);
  bubble(t,300+level*670+random()*340,(.018+random()*.028)*(.65+.35*volume)*Math.pow(Math.sin(Math.PI*p),.55),.045+random()*.055);
 }
 bubble(flow+.025,850+fill*85,.024,.09);
 bubble(flow+.125,1100+fill*90,.012,.08);
 return out;
}
