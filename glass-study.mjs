import * as T from './vendor/node_modules/three/build/three.module.js';
import {BoardRenderer} from './renderer3d.mjs?v=12';
const tintOptions=['#45c8c5','#eca46e','#b69adf'];
export class GlassStudy{
 constructor(host,{reduced=false}={}){
  this.host=host;this.reduced=reduced;this.live=true;this.mode='after';this.angle=0;this.targetAngle=0;this.wave=0;this.last=performance.now();this.resources=[];
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(33,1,.1,80);this.camera.position.set(0,2.35,6.4);this.camera.lookAt(0,1.38,0);
  this.gl=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.gl.setPixelRatio(Math.min(devicePixelRatio||1,3));this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.05;this.gl.localClippingEnabled=true;this.gl.shadowMap.enabled=true;this.gl.shadowMap.type=T.PCFSoftShadowMap;host.appendChild(this.gl.domElement);this.gl.domElement.setAttribute('aria-label','Образец стеклянной колбы в лаборатории');this.gl.domElement.setAttribute('role','img');
  this.scene.background=new T.Color('#15333b');this.scene.add(new T.HemisphereLight('#d9eeef','#524331',1.6));
  const light=new T.DirectionalLight('#fff0d7',3);light.position.set(-3,6,5);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-4,right:4,top:5,bottom:-4,near:.1,far:20});light.shadow.bias=-.00015;light.shadow.normalBias=.025;light.shadow.radius=4;this.scene.add(light);
  const fill=new T.DirectionalLight('#9ce7ef',1.4);fill.position.set(3,3,-2);this.scene.add(fill);
  const studio=new T.Scene();studio.background=new T.Color('#233942');
  const panel=(x,y,z,w,h,color,power)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(power),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,1,0);studio.add(m);};
  panel(-3,3,3,2,5,'#fff2dd',5);panel(3,2,1,1,4,'#bdeeff',3);panel(0,6,0,4,3,'#fff5de',3);panel(-.8,1,-3,2,2,'#77c8ce',1.5);
  const pmrem=new T.PMREMGenerator(this.gl);this.environment=pmrem.fromScene(studio,.06);this.scene.environment=this.environment.texture;pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:'#637b78',roughness:.32,metalness:.24,envMapIntensity:.6}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;this.scene.add(floor);
  // Soft contact and transmitted turquoise light anchor the clear base to the bench.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d'),g=q.createRadialGradient(128,128,10,128,128,125);g.addColorStop(0,'#041a1c99');g.addColorStop(.5,'#06212c35');g.addColorStop(1,'#00000000');q.fillStyle=g;q.fillRect(0,0,256,256);const tex=new T.CanvasTexture(canvas);this.resources.push(tex);const contact=new T.Mesh(new T.PlaneGeometry(2.5,2.5),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.003;this.scene.add(contact);
  this.background=new T.Mesh(new T.PlaneGeometry(11,14),new T.MeshBasicMaterial({color:'#244347'}));this.background.position.set(0,3,-4);this.scene.add(this.background);
  new T.TextureLoader().load('assets/menu-laboratory-v2.png',map=>{if(!this.live){map.dispose();return;}const c=document.createElement('canvas');c.width=512;c.height=900;const ctx=c.getContext('2d');ctx.filter='blur(12px)';ctx.drawImage(map.image,-20,-30,552,960);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;this.background.material.map=texture;this.background.material.color.set('#879c96');this.background.material.needsUpdate=true;this.resources.push(texture);map.dispose();});
  this.bottle=new T.Group();this.scene.add(this.bottle);
  const knots=[[0,.075],[.40,.075],[.70,.14],[.88,.32],[.94,.62],[.94,1.38],[.86,1.75],[.55,2.03],[.36,2.22],[.36,2.78]];
  const curve=new T.SplineCurve(knots.map(p=>new T.Vector2(...p))),outer=curve.getPoints(100).map(p=>new T.Vector2(Math.max(0,p.x),p.y));
  const inner=outer.map(p=>new T.Vector2(Math.max(0,p.x-.042),p.y+.045));inner.at(-1).y=2.78;
  const glassGeo=new T.LatheGeometry([...outer,new T.Vector2(.318,2.78),...inner.slice().reverse()],128);
  this.glass=new T.Mesh(glassGeo,new T.MeshPhysicalMaterial({color:'#f3ffff',metalness:0,roughness:.045,transmission:1,thickness:.055,ior:1.46,envMapIntensity:1.1,clearcoat:1,clearcoatRoughness:.04,side:T.DoubleSide}));this.bottle.add(this.glass);
  const rim=new T.Mesh(new T.TorusGeometry(.34,.035,16,128),new T.MeshPhysicalMaterial({color:'#f5ffff',roughness:.04,transmission:1,thickness:.04,ior:1.46,envMapIntensity:1.25}));rim.rotation.x=Math.PI/2;rim.position.y=2.78;this.bottle.add(rim);this.rim=rim;
  const brass=new T.MeshStandardMaterial({color:'#d2a16a',metalness:.88,roughness:.24,envMapIntensity:1.2});const collar=new T.Mesh(new T.CylinderGeometry(.366,.366,.035,128,1,true),brass);collar.position.y=2.62;this.bottle.add(collar);
  for(const y of [2.60,2.64]){const ring=new T.Mesh(new T.TorusGeometry(.365,.008,8,128),brass);ring.rotation.x=Math.PI/2;ring.position.y=y;this.bottle.add(ring);}
  this.liquidLevel=1.30;this.clipPlane=new T.Plane(new T.Vector3(0,-1,0),this.liquidLevel);
  this.backgroundTarget=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});
  this.waterUniforms={behind:{value:this.backgroundTarget.texture},viewportSize:{value:new T.Vector2(1,1)},waterTint:{value:new T.Color(tintOptions[0])}};
  const waterMaterial=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.055,metalness:0,ior:1.333,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1,clippingPlanes:[this.clipPlane],side:T.DoubleSide});
  waterMaterial.onBeforeCompile=s=>{Object.assign(s.uniforms,this.waterUniforms);s.fragmentShader='uniform sampler2D behind;uniform vec2 viewportSize;uniform vec3 waterTint;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 uv=gl_FragCoord.xy/viewportSize;
   vec3 n=normalize(normal);float opticalPath=.18+1.7*pow(abs(dot(n,normalize(vViewPosition))),.7);
   vec3 bg=texture2D(behind,clamp(uv+n.xy*.018,vec2(.001),vec2(.999))).rgb;
   vec3 absorption=exp(-(vec3(1.)-waterTint)*opticalPath*.85);
   diffuseColor.rgb=mix(bg*absorption,waterTint*.95,.32);
  `);};
  this.water=new T.Mesh(new T.LatheGeometry(inner,128),waterMaterial);this.bottle.add(this.water);
  this.cap=new T.Mesh(new T.CircleGeometry(.895,128),new T.MeshPhysicalMaterial({color:tintOptions[0],roughness:.075,metalness:.04,clearcoat:1,envMapIntensity:1.25,transparent:true,opacity:.78,side:T.DoubleSide}));this.cap.rotation.x=-Math.PI/2;this.cap.position.y=this.liquidLevel;this.scene.add(this.cap);
  this.meniscus=new T.Mesh(new T.TorusGeometry(.895,.009,8,128),new T.MeshPhysicalMaterial({color:'#bcefed',roughness:.06,metalness:.1,envMapIntensity:1.5,transparent:true,opacity:.7}));this.meniscus.rotation.x=Math.PI/2;this.meniscus.position.y=this.liquidLevel+.003;this.scene.add(this.meniscus);
  // Fine graduation marks are wrapped around the front of the actual mesh.
  const marks=document.createElement('canvas');marks.width=256;marks.height=512;const mq=marks.getContext('2d');mq.fillStyle='#f7f3d5aa';mq.font='18px sans-serif';for(let i=0;i<4;i++){const y=120+i*75;mq.fillRect(175,y,30,2);mq.fillText(String((4-i)*50),128,y+6);}const mt=new T.CanvasTexture(marks);this.resources.push(mt);const decal=new T.Mesh(new T.CylinderGeometry(.949,.949,1.4,128,1,true,-.7,1.4),new T.MeshBasicMaterial({map:mt,transparent:true,depthWrite:false,side:T.DoubleSide,opacity:.65}));decal.position.y=1.1;this.bottle.add(decal);
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(host);this.resize();this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.gl.setSize(w,h,false);this.camera.aspect=w/h;this.camera.position.z=this.camera.aspect<.7?6.5:6.0;this.camera.updateProjectionMatrix();const size=this.gl.getDrawingBufferSize(new T.Vector2());this.backgroundTarget.setSize(size.x,size.y);this.waterUniforms.viewportSize.value.copy(size);this.old?.resize();}
 color(index){this.waterUniforms.waterTint.value.set(tintOptions[index]);this.cap.material.color.set(tintOptions[index]);}
 tilt(){this.tiltStart=performance.now();}
 compare(before){this.mode=before?'before':'after';this.gl.domElement.style.display=before?'none':'';if(before&&!this.old){const canvas=document.createElement('canvas'),targets=document.createElement('div');canvas.className='study-old';this.host.append(canvas,targets);this.oldCanvas=canvas;this.oldTargets=targets;this.old=new BoardRenderer(canvas,targets,()=>{},true);this.old.layout=()=>{this.old.bw=190;this.old.bh=285;this.old.slots=[{x:this.old.w/2,y:this.old.h*.51,w:190,h:285}];targets.innerHTML='';};this.old.update([[1,1]]);this.old.resize();}if(this.old){this.oldCanvas.style.display=before?'':'none';this.old.gl.domElement.style.display=before?'':'none';}}
 loop(now){if(!this.live)return;const dt=Math.min(.04,(now-this.last)/1000);this.last=now;
  if(this.mode==='after'&&!document.hidden){const elapsed=this.tiltStart?(now-this.tiltStart)/1000:5;const a=elapsed<2?Math.sin(elapsed/2*Math.PI)*.14:0;this.bottle.rotation.z=a;this.bottle.position.y=Math.abs(a)*.48;this.clipPlane.constant=this.liquidLevel+this.bottle.position.y;
   this.cap.position.x=-this.liquidLevel*Math.sin(a);this.meniscus.position.x=this.cap.position.x;this.cap.position.y=this.clipPlane.constant;this.meniscus.position.y=this.clipPlane.constant+.004;const wobble=this.reduced?0:(elapsed<3?Math.sin(elapsed*9)*.018*Math.exp(-Math.max(0,elapsed-1)*2):0);this.cap.rotation.y=wobble;this.meniscus.rotation.y=wobble;
   // Render background first, then opaque refracted liquid, then the outer transmissive glass.
   this.bottle.visible=false;this.cap.visible=false;this.meniscus.visible=false;this.gl.setRenderTarget(this.backgroundTarget);this.gl.render(this.scene,this.camera);this.gl.setRenderTarget(null);this.bottle.visible=true;this.cap.visible=true;this.meniscus.visible=true;this.gl.render(this.scene,this.camera);
  }this.frame=requestAnimationFrame(this.loop);
 }
 destroy(){this.live=false;cancelAnimationFrame(this.frame);this.ro.disconnect();this.old?.destroy();this.oldCanvas?.remove();this.oldTargets?.remove();this.backgroundTarget.dispose();this.environment.dispose();this.resources.forEach(t=>t.dispose());const mats=new Set();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});mats.forEach(m=>m.dispose());this.gl.dispose();this.gl.forceContextLoss();this.gl.domElement.remove();}
}
