// Decorative menu only. All work is disposed before the gameplay renderer starts.
export function mountMenuMotion(host,{reduced=false,paused=false}={}){
 const art=host.querySelector('.home-art');
  host.classList.add('vector-menu');
  art.innerHTML='<video class="vector-robot-video" poster="assets/robot-poster.jpg" muted playsinline loop preload="metadata" aria-label="Робот Аврора переливает воду в колбу"><source src="assets/robot-vector-pour-v1.mp4" type="video/mp4"></video>';
  const video=art.querySelector('video');video.muted=true;
  function visibility(){if(document.hidden||paused||reduced)video.pause();else video.play().catch(()=>{});}
  visibility();document.addEventListener('visibilitychange',visibility);
  return ()=>{document.removeEventListener('visibilitychange',visibility);video.pause();video.removeAttribute('src');video.replaceChildren();video.load();};
}
