import * as T from './vendor/node_modules/three/build/three.module.js';
export function createLaboratory(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);camera.position.set(9,7.5,11);camera.lookAt(0,1.15,0);
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.setClearColor(0,0);renderer.domElement.setAttribute('aria-label','Интерактивная лаборатория Аврора');renderer.domElement.setAttribute('role','img');
 const root=new T.Group();scene.add(root);const mats={};
 function mat(color,rough=.55,metal=.05){const key=color+rough+metal;return mats[key]??(mats[key]=new T.MeshStandardMaterial({color,roughness:rough,metalness:metal}));}
 function mesh(g,m,x=0,y=0,z=0,parent=root){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,color,x,y,z,r=.045,parent=root){r=Math.min(r,w/4,h/4,d/4);const s=new T.Shape();const a=w/2-r,b=h/2-r;s.moveTo(-a,-h/2);s.lineTo(a,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-b);s.lineTo(w/2,b);s.quadraticCurveTo(w/2,h/2,a,h/2);s.lineTo(-a,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,b);s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-h/2,-a,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r/2,bevelSegments:2,steps:1,curveSegments:5});g.translate(0,0,-d/2+r);return mesh(g,typeof color==='string'?mat(color):color,x,y,z,parent);}
 function cyl(radius,height,color,x,y,z,parent=root){return mesh(new T.CylinderGeometry(radius,radius,height,40),typeof color==='string'?mat(color):color,x,y,z,parent);}
 function ball(w,h,d,color,x,y,z,parent=root){const o=mesh(new T.SphereGeometry(1,24,16),typeof color==='string'?mat(color):color,x,y,z,parent);o.scale.set(w/2,h/2,d/2);return o;}
 function ring(radius,tube,color,x,y,z,parent=root){return mesh(new T.TorusGeometry(radius,tube,12,64),typeof color==='string'?mat(color):color,x,y,z,parent);}
 function label(text,w,h,x,y,z,bg='#163a45',fg='#cae5cc',parent=root){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,512,128);q.fillStyle=fg;q.font='600 49px sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillText(text,256,66);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),x,y,z,parent);o.castShadow=false;return o;}
 const hemi=new T.HemisphereLight('#d9ede9','#294c53',1.35);scene.add(hemi);
 const key=new T.DirectionalLight('#ffe5b6',3.0);key.position.set(-3,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.03;key.shadow.bias=-.0001;scene.add(key);
 const rimLight=new T.DirectionalLight('#68cfe9',1.25);rimLight.position.set(5,4,-3);scene.add(rimLight);
 box(8.2,.35,6.3,'#274e59',0,-.23,0,.12);box(7.9,.13,6,'#417878',0,0,0,.06);
 for(let x=-3.3;x<=3.5;x+=1.1)box(.012,.005,5.9,'#355f61',x,.07,0,0);
 for(let z=-2.4;z<2.8;z+=1.05)box(7.75,.005,.012,'#355f61',0,.071,z,0);
 box(8,4,.19,'#d9d1b9',0,2.04,-3,.04);box(.19,4,5.95,'#b9b6a3',-4,2.04,-.05,.04);
 box(7.9,.11,.15,'#d2d9b6',0,4.06,-2.9,.025);box(.16,.1,5.9,'#a1c5b7',-3.9,4.06,0,.02);
 box(7.9,.15,.15,'#244a58',0,.25,-2.84,.025);box(.15,.15,5.9,'#244a58',-3.85,.25,0,.025);
 for(let x of [-3.3,-2,2.7,3.5])box(.018,3.5,.02,'#c1bba6',x,2.15,-2.885,.001);
 // Copper service pipes with visible collars and rounded joints.
 const copper=mat('#b47f56',.3,.7);
 function pipe(points,r=.045){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,40,r,9,false),copper);}
 pipe([[-3.7,.5,-2.65],[-3.7,3.65,-2.65],[-3.5,3.84,-2.65],[3.45,3.84,-2.65],[3.65,3.6,-2.65],[3.65,.5,-2.65]]);
 for(const x of [-3.2,-1.6,0,1.6,3.2]){const collar=cyl(.07,.12,copper,x,3.84,-2.65);collar.rotation.z=Math.PI/2;}
 for(const x of [-2.6,2.8]){pipe([[x,3.84,-2.65],[x,3.35,-2.65],[x,3.25,-2.35]]);const shade=mesh(new T.ConeGeometry(.23,.15,32,1,true),copper,x,3.22,-2.3);const bulb=ball(.17,.08,.17,new T.MeshStandardMaterial({color:'#fff0bd',emissive:'#ffd28c',emissiveIntensity:2}),x,3.14,-2.3);const lamp=new T.PointLight('#ffcf8a',3.2,4,2);lamp.position.set(x,3.03,-2.15);root.add(lamp);}
 // Cream wall cabinetry, inset doors and brass handles.
 box(2.25,.95,.62,'#cfc6ac',-2.55,2.75,-2.5,.09);
 for(const x of [-3.12,-2]){box(1.03,.82,.08,'#e8dfc5',x,2.75,-2.14,.055);box(.25,.035,.07,copper,x+.20,2.44,-2.08,.01);}
 box(2.2,1.05,.9,'#d2cab3',-2.65,.61,-2.35,.07);box(2.35,.12,1.02,'#e8e0c8',-2.65,1.19,-2.3,.05);
 for(const x of [-3.19,-2.11]){box(.98,.86,.06,'#e4dbc1',x,.64,-1.86,.04);box(.25,.035,.06,copper,x,.98,-1.81,.01);}
 // Porthole and the water behind it.
 const oceanMat=new T.MeshStandardMaterial({color:'#13566c',roughness:.25,metalness:.2,emissive:'#0e3444',emissiveIntensity:.4});
 const seaCanvas=document.createElement('canvas');seaCanvas.width=seaCanvas.height=512;
 const q=seaCanvas.getContext('2d'),seaGradient=q.createLinearGradient(0,0,0,512);seaGradient.addColorStop(0,'#247d95');seaGradient.addColorStop(.55,'#164c68');seaGradient.addColorStop(1,'#071f3b');q.fillStyle=seaGradient;q.fillRect(0,0,512,512);
 for(let i=0;i<9;i++){q.fillStyle='rgba(121,230,225,.035)';q.beginPath();q.moveTo(i*83-120,0);q.lineTo(i*83-85,0);q.lineTo(i*83+105,512);q.lineTo(i*83+20,512);q.fill();}
 const seaTexture=new T.CanvasTexture(seaCanvas);seaTexture.colorSpace=T.SRGBColorSpace;oceanMat.map=seaTexture;oceanMat.emissiveMap=seaTexture;oceanMat.color.set('#ffffff');oceanMat.emissive.set('#8acdde');oceanMat.emissiveIntensity=.6;
 const sea=cyl(1.44,.07,oceanMat,.8,2.44,-2.83);sea.rotation.x=Math.PI/2;
 ring(1.52,.11,mat('#abc8ba',.3,.65),.8,2.44,-2.73);ring(1.36,.028,'#9ee4dd',.8,2.44,-2.69);
 for(let i=0;i<12;i++){let a=i*Math.PI/6;ball(.08,.08,.04,'#56737a',.8+Math.cos(a)*1.52,2.44+Math.sin(a)*1.52,-2.60);}
 const shine=mesh(new T.CircleGeometry(1.31,64),new T.MeshBasicMaterial({color:'#a9edf0',transparent:true,opacity:.05}),.8,2.44,-2.58);shine.castShadow=false;
 label('A U R O R A   /   0 7',1.65,.23,-2.5,3.55,-2.86,'#2e626d','#cce5cb');
 // Wall conduit and switch cabinet.
 for(let z of [-1.4,-1.1]){const p=cyl(.045,2.7,mat('#b1c2b5',.35,.5),-3.78,1.65,z);p.rotation.z=0;}
 box(.65,.8,.22,'#b2c2b1',-3.5,2.1,-1.3,.07).rotation.y=Math.PI/2;
 // Workbench, drawers, instruments.
 box(3.65,.10,1.55,'#d6e9dc',-1.35,1.47,.35,.06);box(3.58,.035,1.48,mat('#b5d5cf',.16,.35),-1.35,1.54,.35,.02);
 box(1.1,1.3,1.22,'#ded6bb',-2.4,.73,.3,.04);box(.14,1.3,1.2,'#d8cfb4',.14,.73,.3,.025);box(2.55,.08,1.15,'#d4cbb2',-1.25,.2,.3,.02);
 for(let i=0;i<3;i++){box(.96,.34,.07,'#e5dcc1',-2.4,.34+i*.37,.96,.035);box(.28,.025,.055,'#a77a4b',-2.4,.36+i*.37,1.02,.009);}
 const monitor=box(.9,.65,.09,'#163c4a',-2.3,1.98,-.1,.07);monitor.rotation.x=-.14;
 const screenMat=new T.MeshStandardMaterial({color:'#244b50',emissive:'#4ed9ac',emissiveIntensity:0});const screen=box(.74,.49,.02,screenMat,-2.3,1.99,-.035,.035);screen.rotation.x=-.14;
 box(.13,.3,.12,'#345663',-2.3,1.68,-.14,.02);box(.55,.04,.36,'#52717a',-2.3,1.56,-.1,.02);
 for(let i=0;i<4;i++)box(.43-i*.045,.018,.01,'#acdcb5',-2.3,2.1-i*.075,.025,.002);
 box(.65,.035,.3,'#739a9a',-2.3,1.58,.55,.03);
 for(let i=0;i<5;i++)box(.025,.003,.2,'#bfcebb',-2.52+i*.11,1.60,.55,0);
 const glass=new T.MeshPhysicalMaterial({color:'#d8f9ee',transparent:true,opacity:.22,roughness:.12,metalness:.05,depthWrite:false});
 const liquidCols=['#73d5cf','#efb381','#c598d5'];
 for(let i=0;i<3;i++){const x=-1.3+i*.37;box(.3,.06,.3,'#32535a',x,1.59,.35,.04);cyl(.115,.65,glass,x,1.97,.35);cyl(.09,.43-i*.06,liquidCols[i],x,1.84-i*.03,.35);const lip=ring(.12,.017,'#d0eadc',x,2.31,.35);lip.rotation.x=Math.PI/2;}
 // Energy generator with rotating copper rotor.
 const machine=new T.Group();machine.position.set(2.45,0,1.35);root.add(machine);
 box(1.3,1.2,1.2,'#d4cba3',0,.73,0,.15,machine);box(1.1,.13,1.35,'#315460',0,.15,0,.05,machine);
 const face=cyl(.43,.08,'#204752',0,.75,.64,machine);face.rotation.x=Math.PI/2;
 ring(.41,.055,'#d6ab64',0,.75,.71,machine);
 const rotor=new T.Group();rotor.position.set(0,.75,.74);machine.add(rotor);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;const blade=box(.31,.075,.045,'#c9d7b0',Math.cos(a)*.2,Math.sin(a)*.2,0,.02,rotor);blade.rotation.z=a+.7;}
 ball(.14,.14,.06,'#bd985c',0,0,.03,rotor);
 const statusMat=new T.MeshStandardMaterial({color:'#c27754',emissive:'#a94923',emissiveIntensity:.3});ball(.09,.09,.04,statusMat,.43,1.17,.62,machine);label('ENERGY',.65,.13,0,.28,.67,'#244c56','#c9d6af',machine);
 // Glazed greenhouse at the left: clear structure even before planting.
 const garden=new T.Group();root.add(garden);
 const gx=-3.2,gz=.05;
 box(1.0,.16,1.05,'#dfd6bc',gx,.16,gz,.05);box(1.0,.14,1.05,'#dfd6bc',gx,2.65,gz,.05);
 for(const dx of [-.46,.46])for(const dz of [-.46,.46])box(.055,2.4,.055,'#c1b795',gx+dx,1.4,gz+dz,.01);
 box(.015,2.3,.92,glass,gx-.45,1.4,gz,.002);box(.92,2.3,.015,glass,gx,1.4,gz+.46,.002);
 for(const y of [.35,1.25]){box(.88,.04,.9,'#9ea88b',gx,y,gz,.01);for(let i=0;i<2;i++){const xx=gx-.23+i*.46;cyl(.16,.22,'#c89767',xx,y+.13,gz);for(let j=0;j<5;j++){const a=j*2.4;const leaf=ball(.17,.52,.08,j%2?'#a2c77d':'#528971',xx+Math.sin(a)*.11,y+.49+(j%2)*.12,gz+Math.cos(a)*.11,garden);leaf.rotation.z=Math.sin(a)*.55;leaf.rotation.x=Math.cos(a)*.3;}}}
 // Glowing coral silhouettes live within the round window, not on the room walls.
 const coralMaterials=[],coral=new T.Group();root.add(coral);
 function branch(x,y,z,length,angle,depth,m){const end=new T.Vector3(x+Math.sin(angle)*length,y+Math.cos(angle)*length,z);const curve=new T.LineCurve3(new T.Vector3(x,y,z),end);mesh(new T.TubeGeometry(curve,1,.012+depth*.006,7,false),m,0,0,0,coral);if(depth>0){branch(end.x,end.y,z+.004,length*.66,angle-.52,depth-1,m);branch(end.x,end.y,z+.004,length*.7,angle+.46,depth-1,m);}else ball(.055,.07,.04,m,end.x,end.y,z,coral);}
 for(let i=0;i<7;i++){const x=.8+(i-3)*.27,baseY=2.44-Math.sqrt(1.22**2-(x-.8)**2)+.05;const m=new T.MeshStandardMaterial({color:i%3?'#85e4dd':'#b4a5ef',emissive:i%3?'#38c8ce':'#8a6fdf',emissiveIntensity:1.1,roughness:.5});coralMaterials.push(m);branch(x,baseY,-2.66,.21+(i%3)*.06,(i-3)*.12,3,m);}
 const oceanLight=new T.PointLight('#62dedf',2,5,2);oceanLight.position.set(.8,2.3,-2.15);root.add(oceanLight);
 const jellyfish=[];for(let i=0;i<3;i++){const g=new T.Group();root.add(g);const jellyMat=new T.MeshStandardMaterial({color:'#c5b5ec',emissive:'#9378d1',emissiveIntensity:.65,transparent:true,opacity:.66,roughness:.2});ball(.21,.12,.055,jellyMat,0,0,0,g);for(let j=0;j<3;j++){const curve=new T.CatmullRomCurve3([new T.Vector3((j-1)*.045,-.03,0),new T.Vector3((j-1)*.04+.018,-.12,0),new T.Vector3((j-1)*.04-.01,-.22,0)]);mesh(new T.TubeGeometry(curve,8,.004,4,false),jellyMat,0,0,0,g);}g.position.set(.2+i*.55,2.75+(i%2)*.3,-2.62);jellyfish.push(g);}
 // Robot Milo.
 const milo=new T.Group();milo.position.set(.15,.12,2.15);root.add(milo);milo.scale.setScalar(1.35);
 ball(.65,.54,.5,'#eee4c6',0,.49,0,milo);box(.5,.23,.06,'#163e50',0,.52,.25,.09,milo);
 const eyes=[];for(let x of [-.12,.12])eyes.push(ball(.065,.085,.025,'#a4f1dd',x,.54,.29,milo));
 for(let x of [-.21,.21])ball(.19,.14,.3,'#426b75',x,.13,.04,milo);
 cyl(.02,.16,'#779c9f',0,.84,0,milo);ball(.08,.08,.08,'#eac478',0,.94,0,milo);
 // Lamps, plants, fish respond to earned upgrades.
 const lightMaterial=new T.MeshStandardMaterial({color:'#fff0c4',emissive:'#ffd994',emissiveIntensity:0});
 for(let i=0;i<3;i++){box(1.1,.08,.25,'#284c56',-2.5+i*2.5,3.86,-2.65,.03);box(.94,.025,.18,lightMaterial,-2.5+i*2.5,3.8,-2.65,.02);}
 const labLight=new T.PointLight('#ffdaa5',0,7,2);labLight.position.set(0,3.8,-.7);root.add(labLight);
 const fishes=[];for(let i=0;i<6;i++){const g=new T.Group();root.add(g);ball(.23,.11,.045,i%2?'#eac586':'#91d9c9',0,0,0,g);const tail=mesh(new T.ConeGeometry(.07,.12,3),mat(i%2?'#eac586':'#91d9c9'),-.16,0,0,g);tail.rotation.z=Math.PI/2;ball(.018,.018,.012,'#143e50',.065,.012,.025,g);fishes.push(g);}
 // Small lab details give the scene a useful scale.
 box(.72,.08,.45,'#dbce9f',.6,.13,2.35,.035);box(.63,.1,.37,'#7ea29c',.62,.22,2.35,.03);
 for(let i=0;i<9;i++){const stripe=box(.21,.008,.045,'#d3c688',-2+i*.43,.08,2.7,.001);stripe.rotation.y=-.65;}
 let host=null,active=false,raf=0,last=0,time=0,power=0,growth=0,life=0,target={power:0,garden:0,ocean:0},reduced=false,px=0,desiredPx=0;
 const ro=new ResizeObserver(()=>resize());
 function resize(){if(!host)return;const w=renderer.domElement.clientWidth||host.clientWidth,h=host.clientHeight;if(w<10||h<10)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const distance=camera.aspect<1.2?16.2:13.6;camera.position.set(distance*.48,distance*.34,distance*.85);camera.lookAt(0,1.7,0);}
 function tick(now){if(!active)return;const dt=Math.min((now-last)/1000,.04);last=now;if(!document.hidden){time+=dt;const k=1-Math.exp(-dt*3);power+=(target.power-power)*k;growth+=(target.garden-growth)*k;life+=(target.ocean-life)*k;px+=(desiredPx-px)*k;root.rotation.y=px*.1;
  lightMaterial.emissiveIntensity=power*1.1;screenMat.emissiveIntensity=power*.8;statusMat.color.set(power>.5?'#bfef8c':'#c27754');statusMat.emissive.set(power>.5?'#87c66c':'#a94923');labLight.intensity=power*2;
  garden.visible=growth>.01;garden.scale.y=Math.max(.001,growth);garden.position.y=(1-growth)*.4;
  if(!reduced)rotor.rotation.z-=dt*(.05+power*1.8);
  oceanMat.emissiveIntensity=.5+life*.35;oceanLight.intensity=1.8+life*2;coralMaterials.forEach((m,i)=>m.emissiveIntensity=.8+life*.7+(reduced?0:Math.sin(time*.65+i)*.12));jellyfish.forEach((j,i)=>{j.position.y=2.75+(i%2)*.3+(reduced?0:Math.sin(time*.55+i)*.05);});
  fishes.forEach((f,i)=>{f.visible=life>.02;const phase=time*.2+i*1.1;f.position.set(.8+Math.sin(phase)*(.45+i*.06),2.5+Math.cos(i*2.4)*.55+Math.sin(time*.6+i)*.035,-2.61);f.scale.setScalar(Math.max(.001,life));f.rotation.y=Math.cos(phase)>0?0:Math.PI;});
  milo.rotation.y=reduced?0:Math.sin(time*.4)*.12; if(!reduced)milo.position.y=.12+Math.sin(time*1.3)*.018;
  renderer.render(scene,camera);
 }raf=requestAnimationFrame(tick);}
 return {mount(el){if(host!==el){ro.disconnect();host=el;host.appendChild(renderer.domElement);ro.observe(host);host.onpointermove=e=>{desiredPx=(e.clientX-host.getBoundingClientRect().left)/host.clientWidth-.5;};host.onpointerleave=()=>desiredPx=0;}resize();if(!active){active=true;last=performance.now();raf=requestAnimationFrame(tick);}},setState(s){target={power:+s.upgrades.includes('power'),garden:+s.upgrades.includes('garden'),ocean:+s.upgrades.includes('ocean')};reduced=s.reduced;},pause(){active=false;cancelAnimationFrame(raf);},dispose(){active=false;cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();});}};
}
