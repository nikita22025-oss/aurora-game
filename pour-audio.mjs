import {POUR,flowRate,pourState,FINAL_DROPS} from './pour-motion.mjs?v=3';
import {POUR_TIMING} from './water-foley.mjs';
export const AUDIO_DURATION=POUR_TIMING.duration/1000;
export const WATER_START=POUR.start*AUDIO_DURATION;
export const WATER_END=(POUR.end+POUR.flight)*AUDIO_DURATION;
export function waterGainAt(seconds,amount=1){
 if(seconds<=WATER_START||seconds>=WATER_END)return 0;
 const t=seconds/AUDIO_DURATION;
 return (.62+.055*Math.max(1,Math.min(4,amount)))*(.035*Math.pow(flowRate(t),.52)+.965*Math.pow(pourState(t).impact,.52));
}
export function waterEnvelope(fromSeconds,amount=1,count=128){
 return Float32Array.from({length:count},(_,i)=>waterGainAt(fromSeconds+(WATER_END-fromSeconds)*i/(count-1),amount));
}

export const TAIL_START=FINAL_DROPS[0].impact*AUDIO_DURATION;
export const TAIL_DURATION=.36;

// Measured attack peak in water-drop-soft-v3.wav, aligned to visible contact.
export const DROP_PEAK_SECONDS=270/44100;
export const DROP_EVENTS=FINAL_DROPS.map((d,i)=>({time:d.impact*AUDIO_DURATION,gain:.52*d.gain,rate:[1,.97,1.05][i]}));
