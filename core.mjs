export const CAPACITY=4;
export const copy=b=>b.map(x=>[...x]);
export const completeBottle=b=>b.length===CAPACITY&&b.every(c=>c===b[0]);
export const legalTargets=(board,from)=>board.flatMap((_,to)=>pour(board,from,to)?[to]:[]);
export const won=b=>b.every(x=>!x.length||(x.length===4&&x.every(c=>c===x[0])));
export function pour(board,from,to){
 if(from===to||!board[from]?.length||!board[to]||board[to].length===4)return null;
 const a=board[from],b=board[to],c=a.at(-1);if(b.length&&b.at(-1)!==c)return null;
 let run=0;for(let i=a.length-1;i>=0&&a[i]===c;i--)run++;
 const n=Math.min(run,4-b.length),next=copy(board);next[from].splice(-n);next[to].push(...Array(n).fill(c));return next;
}
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function level(index){
 const random=rng(795+index*1337),colors=Math.min(6,2+Math.floor(index/4));
 let board=Array.from({length:colors},(_,i)=>Array(4).fill(i));board.push([],[]);let reverse=[];
 for(let step=0;step<45+index*7;step++){
  const options=[];
  board.forEach((a,i)=>{if(!a.length)return;let run=0;for(let k=a.length-1;k>=0&&a[k]===a.at(-1);k--)run++;
   board.forEach((b,j)=>{if(i===j||b.length===4||(b.length&&b.at(-1)===a.at(-1)))return;
    for(let n=1;n<=Math.min(run,4-b.length);n++)if(a.length===n||a[a.length-n-1]===a.at(-1))options.push([i,j,n]);
   });});
  if(!options.length)break;
  const [i,j,n]=options[Math.floor(random()*options.length)];board[j].push(...board[i].splice(-n));reverse.unshift([j,i]);
 }
 return {board,solution:reverse,colors};
}
export function solve(start,limit=150000){
 const visited=new Set();let nodes=0;
 function dfs(b,path){if(won(b))return path;if(++nodes>limit)return null;
  const key=b.map(x=>x.join('')).sort().join('|');if(visited.has(key))return null;visited.add(key);
  const moves=[];
  for(let i=0;i<b.length;i++){const a=b[i];if(!a.length||a.length===4&&a.every(x=>x===a[0]))continue;let empty=false;
   for(let j=0;j<b.length;j++){if(i===j)continue;const dest=b[j];if(!dest.length){if(empty||a.every(x=>x===a[0]))continue;empty=true;}
    const next=pour(b,i,j);if(next)moves.push({i,j,next,rank:dest.length?10+dest.length:0});
   }}
  moves.sort((a,b)=>b.rank-a.rank);
  for(const m of moves){const result=dfs(m.next,[...path,[m.i,m.j]]);if(result)return result;if(nodes>limit)return null;}
  return null;
 }
 return dfs(start,[]);
}
