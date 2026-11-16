import {copy,CAPACITY,won} from './core.mjs';
// Save only completed actions. Closing during a pour restores its starting board.
export const HISTORY_LIMIT=200;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const signature=board=>board.flat().sort((a,b)=>a-b).join(',');
export function readRun(value,initial){
 if(!value||value.version!==1||!integer(value.moves)||typeof value.extra!=='boolean')return null;
 const expected=signature(initial);
 const validFrame=f=>f&&integer(f.moves)&&typeof f.extra==='boolean'&&Array.isArray(f.board)&&f.board.length===initial.length+(f.extra?1:0)&&f.board.every(b=>Array.isArray(b)&&b.length<=CAPACITY&&b.every(c=>integer(c)&&c<6))&&signature(f.board)===expected;
 if(!validFrame(value)||won(value.board)||!Array.isArray(value.history)||value.history.length>HISTORY_LIMIT||!value.history.every(validFrame))return null;
 return {version:1,board:copy(value.board),moves:value.moves,extra:value.extra,history:value.history.map(f=>({board:copy(f.board),moves:f.moves,extra:f.extra}))};
}
export function snapshotRun(board,moves,extra,history){
 return {version:1,board:copy(board),moves,extra,history:history.slice(-HISTORY_LIMIT).map(f=>({board:copy(f.board),moves:f.moves,extra:f.extra}))};
}
export function sanitizeRuns(runs,levels,done){
 const result={};if(!runs||typeof runs!=='object'||Array.isArray(runs))return result;
 for(let i=0;i<levels.length;i++){if(i&&!done[i-1])continue;const run=readRun(runs[i],levels[i].board);if(run)result[i]=run;}
 return result;
}
