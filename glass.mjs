// Hand-polished borosilicate with a copper neck. Drawn over the simulated liquid.
export function drawGlass(c,{x,y,w,h,a},highlight){
 c.save();c.translate(x,y);c.rotate(a);const r=w*.43,top=-h/2+5,bottom=h/2;
 const outline=()=>{c.beginPath();c.moveTo(-r,top);c.lineTo(-r,bottom-r);c.quadraticCurveTo(-r,bottom,0,bottom);c.quadraticCurveTo(r,bottom,r,bottom-r);c.lineTo(r,top);};
 if(highlight){c.shadowColor=highlight;c.shadowBlur=18;outline();c.strokeStyle=highlight+'99';c.lineWidth=2;c.stroke();c.shadowBlur=0;}
 const edge=c.createLinearGradient(-r,0,r,0);
 [[0,'#6a9ba8'],[.055,'#d6f5f4'],[.13,'#edfaff'],[.23,'#71939e'],[.48,'#263d4d'],[.72,'#567886'],[.92,'#b5d5db'],[1,'#3f6675']].forEach(([p,v])=>edge.addColorStop(p,v));
 outline();c.strokeStyle='#020d18';c.lineWidth=7;c.stroke();outline();c.strokeStyle=edge;c.lineWidth=3.8;c.stroke();
 c.save();outline();c.closePath();c.clip();
 const body=c.createLinearGradient(-r,0,r,0);[[0,'#e3faff28'],[.14,'#ffffff24'],[.28,'#f0faff05'],[.66,'#1e2c4800'],[.88,'#12213255'],[.96,'#c6eaff30'],[1,'#d4edff10']].forEach(([p,v])=>body.addColorStop(p,v));c.fillStyle=body;c.fillRect(-r,top,r*2,h);
 // Soft, tapered lamp reflection instead of a solid white stripe.
 const glint=c.createLinearGradient(0,top+12,0,bottom-14);glint.addColorStop(0,'#fff5dc00');glint.addColorStop(.14,'#fff5dcaa');glint.addColorStop(.46,'#efffff44');glint.addColorStop(1,'#efffff00');c.fillStyle=glint;c.beginPath();c.moveTo(-r+5,top+12);c.bezierCurveTo(-r+3,top+h*.4,-r+7,bottom-13,-r+10,bottom-12);c.lineTo(-r+10,top+12);c.closePath();c.fill();
 c.strokeStyle='#daf6ff35';c.lineWidth=1;c.beginPath();c.moveTo(r-5,top+14);c.lineTo(r-5,bottom-r);c.stroke();c.restore();
 // Thick optical base and a warm caustic at its centre.
 c.beginPath();c.moveTo(-r+4,bottom-r*.78);c.quadraticCurveTo(-r+3,bottom-3,0,bottom-3);c.quadraticCurveTo(r-3,bottom-3,r-4,bottom-r*.78);c.strokeStyle='#b8dfe5aa';c.lineWidth=2;c.stroke();
 c.beginPath();c.ellipse(0,bottom-4,r*.38,1.3,0,0,Math.PI*2);c.fillStyle='#ffdfa15c';c.fill();
 const brass=c.createLinearGradient(-r,0,r,0);[[0,'#543524'],[.12,'#a77349'],[.27,'#f2d09a'],[.4,'#d7a263'],[.63,'#9d653c'],[.84,'#f2ce92'],[1,'#624329']].forEach(([p,v])=>brass.addColorStop(p,v));
 c.fillStyle=brass;c.beginPath();c.roundRect(-r-1,top+2,r*2+2,7,2.4);c.fill();c.strokeStyle='#fff1ca66';c.lineWidth=.7;c.beginPath();c.moveTo(-r+2,top+3);c.lineTo(r-2,top+3);c.stroke();
 c.fillStyle='#05131e';c.beginPath();c.ellipse(0,top,r+1,5,0,0,Math.PI*2);c.fill();c.strokeStyle=edge;c.lineWidth=2.4;c.stroke();
 c.beginPath();c.ellipse(0,top,r-3,2.7,0,0,Math.PI*2);c.strokeStyle='#aacbd099';c.lineWidth=.9;c.stroke();
 c.beginPath();c.ellipse(0,top,r,4.5,0,Math.PI,Math.PI*1.8);c.strokeStyle='#fff0cfb0';c.lineWidth=1;c.stroke();
 for(let j=0;j<3;j++){const yy=h*.23-j*h*.19;c.strokeStyle='#d9d7bb70';c.lineWidth=.7;c.beginPath();c.moveTo(r-11,yy);c.lineTo(r-5,yy);c.stroke();}
 c.restore();
}
