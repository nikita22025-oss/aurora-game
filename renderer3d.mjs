import {pourState,jetSection,stepSlosh,waterOffset,POUR,FINAL_DROPS,smooth,dropShape} from './pour-motion.mjs?v=4';
import * as T from './vendor/node_modules/three/build/three.module.js';
import {BoardRenderer as CanvasBoard,COLORS} from './renderer.mjs?v=14';
import {completeBottle} from './core.mjs';
import {POUR_TIMING} from './water-foley.mjs';
import {interior,rotate,surface,FILL,LIP} from './fluid.mjs?v=4';
const CAMERA_SLOPE=.24,COS=1/Math.sqrt(1+CAMERA_SLOPE**2);
// The canvas underneath retains accessible labels, contact shadows and the stream.
// Vessels and liquid are true lit meshes, not pre-rendered sprites.
export class BoardRenderer extends CanvasBoard{
 constructor(canvas,targets,onSelect,reduced=false){
  super(canvas,targets,onSelect,reduced);
  this.scene3=new T.Scene();this.scene3.background=new T.Color("#142b35");this.meshes=[];
  this.gl=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  this.gl.setPixelRatio(Math.min(devicePixelRatio||1,2.5));this.gl.setClearColor(0,0);this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.12;
  this.gl.domElement.className='glass-webgl';this.gl.domElement.setAttribute('aria-hidden','true');canvas.parentElement.insertBefore(this.gl.domElement,targets);
  this.camera=new T.OrthographicCamera(-200,200,200,-200,.1,3000);this.camera.position.set(0,1000*CAMERA_SLOPE,1000);this.camera.lookAt(0,0,0);
  const env=document.createElement('canvas');env.width=1024;env.height=512;const q=env.getContext('2d');q.fillStyle='#253847';q.fillRect(0,0,1024,512);
  const grad=q.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#7894a1');grad.addColorStop(.5,'#182d39');grad.addColorStop(1,'#07121e');q.fillStyle=grad;q.fillRect(0,0,1024,512);
  q.fillStyle='#fff5db';q.fillRect(125,100,105,300);q.fillStyle='#a5e5ff';q.fillRect(700,80,36,330);q.fillStyle='#e3cba6';q.fillRect(430,40,160,45);q.fillStyle='#fff9ed';q.fillRect(255,125,10,265);
  const texture=new T.CanvasTexture(env);texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.SRGBColorSpace;const pmrem=new T.PMREMGenerator(this.gl);this.envTarget=pmrem.fromEquirectangular(texture);this.scene3.environment=this.envTarget.texture;texture.dispose();pmrem.dispose();
  this.scene3.add(new T.HemisphereLight('#d9f5ff','#314654',1.35));const key=new T.DirectionalLight('#fff1ce',3.0);key.position.set(-250,400,600);this.scene3.add(key);const rim=new T.DirectionalLight('#a4e6ff',1.7);rim.position.set(300,80,-100);this.scene3.add(rim);
  // Reflection sample from the unobstructed liquid in the upright Vector tube.
  const pixels = Uint8Array.from(atob("DLXBIcrWItjhA7nCGZSTGpaUIpKMHo2IHoN8Gn94HH5zH4F1J4h2Lo99MJaDNZqIOp+LOp+LOpuFN5mDM49+LIh3LYF0LH9zDLXBH8jTJtfhBLXAF5KRGZSTIpaRI5eSJZGKHoqDHIF3HIF3I4N6KIh+LIp8LYt9MY1+M49/NI1+MIp7L4Z7LYR4KYN2LIV4DLfCHMjSJ9jiA7S+FJCPGJOSIZeRI5mTJ5iSJpeRJpKLH4uEIIF8IYJ9J4R6KIV7LYl8Lop9LYh+KoV8KIN8KIN8JYl/LpKJC7rFG8rWJtfhA7S+FI2NGZKSH5SRIZeTJZiWJpmXKZmWKZmWKJSQIo+KIYqCIImBI4V9JYZ+JYZ+JYZ+I4mCLJGKMJ2WNaGaCrvFGsvWJtffAbK6EouNGZKUH5SRIZeTI5mYJZqZJp2XJ56YKJ+bKJ+bKJ6aJ52ZKZmWKZmWKZmWKpqXLZ2ZMKCdM6KfM6KfC73IGszXJtjdALK2EYyNGJOUG5aTHpiWIJqYIJqYIp2aJZ+dKJ+eKaCfKqGeLaSgLqWhLqWhLqWfLqWfL6WfLaKdLqKbL6SdD8DIH9DYLNjfA6+2EouLGZKSHpSTIJeWIpmYIpmYIZuZI56bJqCeJ6GfKKKgKqWiLaSgLaSgLqSgLqSgLqSgLaKfLqGdLqGdEMPIItbaL9nhA621EouLGZKSHpSTIJeWIZiXIpmYIZuZIp2aJZ+dJ6GfKKGhKqSkLaSgLaSgLqSgLqSgLqSgLaKfLqGfLaCeDcDKH9HbLNbeAauzE4yMGZKSGpSSHJeUHJaWH5iYIJqYIp2aJZ+dJqCeKKKgKaShLqSeLqSeLqSgLqSgLqSgLaKfLaKfLaKfDL7JH9HbKNLZAKivEYqKF5CQGZORG5aTHJaWH5iYIJqYIZuZI56bJqCeJ6GfKaShLaKdLqSeLqSeLaKdLaKfLaKfLqGfLqGfC73KHM/bJ8rUAJ+pDYOEF4yNGZORG5aTHJaWH5iYIZeYIpiZJZuaJ56dJqCeKKKgKqCaLaKdL6KeL6KeLqGdLqGdMKCdL5+bCrvKFMXUILnLAJKlD3x/G4mMG5KRH5aUIZiXIZiXI5mYI5mYJpuYKJ6aKZ+bLKGeLaCbLqGdMaGgMaGgMaCfMaCfMJ+bL56aCbrLC7zNE6e8AImeCnB4GX+IG4+PIZSUIpiXIpiXJZiYJpmZJ5qYKZ2aLZ2bLp6dLaCbLaCbMKCfMKCfNJ+fM56eMZ6ZMJ2YDL3PCbrLEqa7AIidBmdxEnN9G4qLJZOUIpaWIpaWJpaUJ5eWKJiUKZmWKpqXLJuYLp6YLp6YLZ2ZLZ2ZLp2bLp2bMZ2aMJuZEMbbDMPYGrDGAI2kBmdvDW52GoWIJZCSIpaWI5eXJpaUJpaUJ5eTJ5eTKZiUKpmWLJuWLJuWLJuaLZ2bLp6dLp6dMJ+eMaCfE83hE83hH7nQAJGoBmlwDG92GIOFI4+RIZeWIpiXI5mYJZqZJpmZJ5qaKJuZKZ2aKZ2aKZ2aKZ+bKqCdKqGeKqGeL5+bMaGeF83iF83iG7bJAI+hBmVuDGt0F3+DIouPIZSUI5eXJZiYJpmZI5mYJZqZJp2bJ56dKJ+eKJ+eKqCdKqCdKqCdKqCdLaCeLqGfGcreFsbaF6vAAIidC251E3Z9HIiKJpGTI5eXJZiYJZiYJZiYJZqZJpuaJZuaJp2bKJ6dKJ6dJ56aKJ+bKZ+bKqCdLaKfLaKf"), ch => ch.charCodeAt(0));
  this.waterStudy = new T.DataTexture(pixels,24,18,T.RGBFormat);
  this.waterStudy.magFilter = this.waterStudy.minFilter = T.LinearFilter;
  this.waterStudy.needsUpdate = true;
  this.renderStream3d=true;
  const positions=new Float32Array(33*10*3),indices=[];for(let j=0;j<32;j++)for(let k=0;k<10;k++){const a=j*10+k,b=j*10+(k+1)%10;indices.push(a,b,a+10,b,b+10,a+10);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();geo.attributes.position.setUsage(T.DynamicDrawUsage);geo.attributes.normal.setUsage(T.DynamicDrawUsage);
  this.stream=new T.Mesh(geo,new T.MeshPhysicalMaterial({color:'#62cddd',roughness:.035,metalness:0,transmission:0,thickness:2,ior:1.333,clearcoat:1,envMapIntensity:1.15,toneMapped:false,transparent:true,opacity:.88,emissive:'#ffffff',emissiveIntensity:.025}));this.stream.frustumCulled=false;this.scene3.add(this.stream);
  this.drops=[];for(let i=0;i<6;i++){const d=new T.Mesh(new T.SphereGeometry(1,10,8),this.stream.material);this.scene3.add(d);this.drops.push(d);}
  this.ripples=Array.from({length:3},()=>{const ring=new T.Mesh(new T.TorusGeometry(1,.035,6,48),new T.MeshBasicMaterial({color:'#d5f8ec',transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;this.scene3.add(ring);return ring;});
  this.snapshot=new T.Mesh(new T.PlaneGeometry(2,2),new T.RawShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{picture:{value:null},alpha:{value:1},holeA:{value:new T.Vector4()},holeB:{value:new T.Vector4()}},vertexShader:`precision highp float;attribute vec3 position;varying vec2 uvScreen;void main(){uvScreen=position.xy*.5+.5;gl_Position=vec4(position.xy,.99,1.);}`,fragmentShader:`precision highp float;varying vec2 uvScreen;uniform sampler2D picture;uniform float alpha;uniform vec4 holeA,holeB;bool inside(vec4 r){return uvScreen.x>r.x&&uvScreen.x<r.z&&uvScreen.y>r.y&&uvScreen.y<r.w;}void main(){if(inside(holeA)||inside(holeB))discard;gl_FragColor=vec4(texture2D(picture,uvScreen).rgb,alpha);}`}));
  this.snapshot.frustumCulled=false;this.snapshot.renderOrder=-100;this.snapshot.visible=false;this.scene3.add(this.snapshot);
  this.resize();
 }
 resize(){super.resize();if(!this.gl)return;this.gl.setSize(this.w,this.h,false);Object.assign(this.camera,{left:-this.w/2,right:this.w/2,top:this.h/2,bottom:-this.h/2});this.camera.updateProjectionMatrix();this.clearMeshes();if(this.snapshot){this.snapshotTexture?.dispose();const size=this.gl.getDrawingBufferSize(new T.Vector2());this.snapshotTexture=new T.FramebufferTexture(size.x,size.y);this.snapshot.material.uniforms.picture.value=this.snapshotTexture;this.snapshotReady=false;this.snapshotDirty=true;}}
 update(...args){super.update(...args);if(this.selected>=0)this.settle=null;this.snapshotDirty=true;}
 clearMeshes(){if(!this.meshes)return;for(const b of this.meshes){this.scene3.remove(b.root);for(const cap of b.caps)this.scene3.remove(cap);b.root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});b.caps.forEach(o=>{o.geometry.dispose();o.material.dispose();});}this.meshes=[];this.warmed=false;this.preparedPour=false;}
 makeVessel(w,h){
  const r=w*.35,outer=w*.385,top=h/2-5,bottom=-h/2,innerBottom=bottom+8;
  const profile=(radius,base,ceiling)=>{const p=[];for(let k=0;k<=16;k++){const a=k*Math.PI/32;p.push(new T.Vector2(Math.sin(a)*radius,base+radius*(1-Math.cos(a))));}p.push(new T.Vector2(radius,ceiling));return p;};
  const outside=profile(outer,bottom,top);const inside=profile(r,innerBottom,top);const closed=[...outside,new T.Vector2(r,top),...inside.slice().reverse()];
  const root=new T.Group();this.scene3.add(root);
  const shell=new T.Mesh(new T.LatheGeometry(outside,48),new T.MeshPhysicalMaterial({color:'#fffaf2',metalness:0,roughness:.075,transmission:0,thickness:2.0,ior:1.46,envMapIntensity:1.1,clearcoat:1,clearcoatRoughness:.08,side:T.DoubleSide,transparent:true,opacity:.095,depthWrite:false}));shell.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.a *= .32 + .68 * pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.0);');};root.add(shell);shell.renderOrder=4;
  const lip=new T.Mesh(new T.TorusGeometry(outer,.85,12,64),new T.MeshStandardMaterial({color:'#f7ead6',roughness:.10,metalness:.08,envMapIntensity:1.3}));lip.rotation.x=Math.PI/2;lip.position.y=top;root.add(lip);
  const collar=new T.Mesh(new T.TorusGeometry(outer-.45,.38,8,64),new T.MeshBasicMaterial({color:'#fff4df',transparent:true,opacity:.45,depthWrite:false}));collar.rotation.x=Math.PI/2;collar.position.y=top-1.8;root.add(collar);

  // Pale silhouette makes the transparent wall readable against the dark bench.
  const edgeMaterial=new T.MeshBasicMaterial({color:'#e9f6fa',transparent:true,opacity:.46,depthWrite:false});
  const contour=[];contour.push(new T.Vector3(-outer,top,0),new T.Vector3(-outer,bottom+outer,0));for(let k=1;k<=32;k++){const a=Math.PI+k*Math.PI/32;contour.push(new T.Vector3(Math.cos(a)*outer,bottom+outer+Math.sin(a)*outer,0));}contour.push(new T.Vector3(outer,top,0));
  const outlinePath=new T.CurvePath();for(let j=1;j<contour.length;j++)outlinePath.add(new T.LineCurve3(contour[j-1],contour[j]));const outline=new T.Mesh(new T.TubeGeometry(outlinePath,160,.43,8,false),edgeMaterial);root.add(outline);
  // Rounded soft light strips are geometry, so they follow the tilting glass.
  for(const [side,width,length,opacity] of [[-1,w*.011,h*.72,.58],[1,w*.006,h*.60,.31]]){
   const highlight=new T.Mesh(new T.CapsuleGeometry(width,length,8,12),new T.MeshBasicMaterial({color:'#fff9ed',transparent:true,opacity,depthWrite:false}));
   highlight.position.set(side*outer*.64,top-h*.34,outer*.78);highlight.renderOrder=5;root.add(highlight);
  }
  const uniforms={waterStudy:{value:this.waterStudy},heights:{value:new T.Vector4(-1000,-1000,-1000,-1000)},colors:{value:COLORS.slice(0,4).map(c=>new T.Color(c))},time:{value:0},wave:{value:0},slope:{value:0},anchor:{value:0},center:{value:new T.Vector2()},radius:{value:r},capSpan:{value:1},inverse:{value:new T.Matrix4()},bottom:{value:innerBottom},top:{value:top},vesselHeight:{value:h},neckRadius:{value:w*LIP}};
  // Physical lighting is shared by the outer liquid surface and its cut planes.
  function liquidMaterial(capIndex=-1){return new T.ShaderMaterial({transparent:true,side:T.DoubleSide,forceSinglePass:true,toneMapped:false,
   uniforms:{...uniforms,capIndex:{value:capIndex},opacity:{value:1}},
   vertexShader:`varying vec3 liquidWorld;varying vec3 litNormal;
    uniform float time,wave,slope,anchor,radius,capSpan;uniform int capIndex;
    float waterHeight(vec2 p){float d=length(p)/radius;float u=clamp(p.x/radius,-1.,1.);return slope*u*(1.+.28*(1.-u*u))+wave*sin(d*6.-time*10.)*exp(-d*1.6)-anchor;}
    void main(){vec3 p=position,n=normal;if(capIndex>=0){p.x*=capSpan;p.y+=waterHeight(p.xz);float e=.35;float dx=(waterHeight(p.xz+vec2(e,0.))-waterHeight(p.xz-vec2(e,0.)))/(2.*e);float dz=(waterHeight(p.xz+vec2(0.,e))-waterHeight(p.xz-vec2(0.,e)))/(2.*e);n=normalize(vec3(-dx,1.,-dz));}
     liquidWorld=(modelMatrix*vec4(p,1.)).xyz;litNormal=normalize(normalMatrix*n);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform sampler2D waterStudy;varying vec3 liquidWorld;varying vec3 litNormal;uniform vec4 heights;uniform vec3 colors[4];uniform float time,wave,slope,anchor,radius,bottom,top,opacity;uniform vec2 center;uniform mat4 inverse;uniform int capIndex;
    void main(){vec2 delta=vec2(liquidWorld.x-center.x,liquidWorld.z-center.y);float distance=length(delta)/radius;
     float u=clamp(delta.x/radius,-1.,1.);float ripple=slope*u*(1.+.28*(1.-u*u))+wave*sin(distance*6.-time*10.)*exp(-distance*1.6)-anchor;float yy=liquidWorld.y-ripple;
     vec3 local=(inverse*vec4(liquidWorld,1.)).xyz;int band=capIndex;
     if(capIndex<0){if(yy>heights.w)discard;band=0;if(yy>heights.x)band=1;if(yy>heights.y)band=2;if(yy>heights.z)band=3;}
     else{if(local.y<bottom||local.y>top)discard;float rr=radius;if(local.y<bottom+radius){float dy=local.y-bottom-radius;rr=sqrt(max(0.,radius*radius-dy*dy));}if(length(local.xz)>rr)discard;}
     vec3 color=colors[band];float across=clamp(local.x/radius,-1.,1.);float roundness=sqrt(max(0.,1.-across*across));float strip=exp(-pow((across+.48)/.23,2.));
     // Cylindrical optical depth: clear edges, saturated body, narrow studio reflections.
     float edge=pow(1.-roundness,2.);
     float key=exp(-pow((across+.62)/.075,2.));
     float rim=exp(-pow((across-.82)/.055,2.));
     // Optical path through a round column of dyed water. Studio lights stay
     // fixed in camera space as the bottle turns underneath them.
     vec3 n=normalize(litNormal);
     vec3 reflection=reflect(vec3(0.,0.,-1.),n);
     float opticalDepth=.55+1.65*abs(n.z);
     vec3 transmitted=exp(-opticalDepth*(1.-color)*2.4);
     // Use the reference's curved illumination, retaining the puzzle dye.
     vec2 studyUV=vec2(.5+.49*across,clamp((local.y-bottom)/(top-bottom),.02,.98));
     vec3 studio=texture2D(waterStudy,studyUV).rgb;
     float intensity=dot(studio,vec3(.15,.57,.28));
     float pearl=smoothstep(.25,.84,studio.r);
     vec3 light=color*(.16+intensity*intensity*1.22)+transmitted*.18;
     light=mix(light,vec3(.82,.94,.98),pearl*.62);
     float gloss=exp(-pow((reflection.x+.66)/.09,2.))*smoothstep(-.50,.60,reflection.z);
     light+=vec3(.43,.40,.32)*gloss;
     float heel=1.-smoothstep(0.,radius*.85,local.y-bottom);
     light+=heel*(color*.40+vec3(.035,.085,.10));
     if(capIndex>=0){
      float meniscus=smoothstep(.82,1.,length(local.xz)/radius);
      // Travelling highlights follow the actual slope of the disturbed surface.
      vec3 waterNormal=normalize(litNormal);
      float crest=clamp((waterNormal.x*.8+waterNormal.z-.23)*2.8,0.,1.);
      float impactLight=crest*min(1.,abs(wave)*.8);
      light=color*(.46+.24*n.y)+vec3(.13,.24,.25)*meniscus+vec3(.16,.26,.28)*impactLight;
      light+=vec3(.34,.39,.39)*exp(-pow((across+.50)/.20,2.))*.7;
     }
     gl_FragColor=vec4(light,opacity);
     #include <colorspace_fragment>
    }`});}
  const fluid=new T.Mesh(new T.LatheGeometry(profile(r,innerBottom,top),48),liquidMaterial());root.add(fluid);
  const caps=[];for(let i=0;i<4;i++){const g=new T.PlaneGeometry(r*2,r*2,64,12);g.rotateX(-Math.PI/2);const cap=new T.Mesh(g,liquidMaterial(i));cap.frustumCulled=false;this.scene3.add(cap);caps.push(cap);}
  const faded=[];root.traverse(o=>{if(o.material){o.material.transparent=true;o.material.forceSinglePass=true;faded.push({material:o.material,opacity:o.material.opacity,depthWrite:o.material.depthWrite});}});caps.forEach(o=>{o.material.forceSinglePass=true;faded.push({material:o.material,opacity:1,depthWrite:true});});
  const result={root,shell,lip,fluid,caps,uniforms,w,h,faded};this.meshes.push(result);return result;
 }
 bottle(p,layers,index,now){
  if(!this.gl)return;(this.currentPoses??=[])[index]=p;const c=this.ctx,{x,y,w,h,a}=p;let b=this.meshes[index];if(!b)b=this.makeVessel(w,h);
  // The cached image already contains stationary vessels. Do not update their
  // scene graphs, inverse matrices or materials on every animated frame.
  const focus=this.renderFocus,unrelated=focus&&index!==focus.from&&index!==focus.to;
  if(unrelated&&this.snapshotReady){b.root.visible=false;for(const cap of b.caps)cap.visible=false;this.waves[index]=undefined;return;}
  const depth=this.motion?.from===index?w*.85:0;b.depth=depth;
  b.root.position.set(x-this.w/2,(this.h/2-y)/COS+depth*CAMERA_SLOPE,depth);b.root.rotation.z=-a;b.root.updateMatrixWorld(true);b.uniforms.inverse.value.copy(b.root.matrixWorld).invert();b.uniforms.center.value.set(x-this.w/2,depth);b.uniforms.time.value=now/1000;
  const prev=stepSlosh(this.waves[index],p,now,this.reduced);this.waves[index]=prev;
  const phase=this.motion?(now-this.motion.start)/this.motion.duration:0;
  // Keep the whole board visible; cached vessels avoid redundant rendering.
  const visibility=1;
  b.root.visible=visibility>.001&&!(unrelated&&this.snapshotReady);
  for(const f of b.faded){f.material.opacity=f.opacity*visibility;if(f.material.uniforms?.opacity)f.material.uniforms.opacity.value=f.material.opacity;f.material.depthWrite=f.depthWrite&&visibility>.999;}
  if(visibility<=.001||(unrelated&&this.snapshotReady)){b.caps.forEach(cap=>cap.visible=false);return;}
  const impact=this.motion?.to===index?pourState(phase).impact:0;
  const settling=this.settle?.index===index?Math.exp(-(now-this.settle.start)/500):0;
  const dropRipple=this.motion?.to===index?FINAL_DROPS.reduce((sum,d)=>{const age=(phase-d.impact)*this.motion.duration/1000;return sum+(age>=0&&age<.6?Math.sin(age*24)*Math.exp(-age*7)*d.gain:0);},0):0;
  const wave=this.reduced?0:impact*1.9+settling*.9+dropRipple*1.5;
  const slope=prev.q*Math.min(1.8,w/55);
  let anchor=0;if(this.motion?.from===index&&phase>=POUR.start&&phase<=POUR.returnAt){const sign=this.motion.sign;const edge=rotate([sign*w*LIP,-h/2+5],0,0,a);anchor=waterOffset(edge[0],0,w*.35,now/1000,slope,wave);}
  b.uniforms.capSpan.value=Math.max(1,(Math.abs(Math.sin(a))*h/2+Math.abs(Math.cos(a))*w*.35)/(w*.35));
  b.uniforms.wave.value=wave;b.uniforms.slope.value=slope;b.uniforms.anchor.value=anchor;
  const shapeKey=a+':'+layers.map(l=>l.amount).join(',');
  if(b.shapeKey!==shapeKey){const poly=interior(w,h).map(q=>rotate(q,0,0,a));let amount=0;b.localHeights=layers.map(l=>{amount+=l.amount;return surface(poly,amount*FILL/4);});b.shapeKey=shapeKey;}
  let total=0,heights=[];
  for(let j=0;j<4;j++){const layer=layers[j];if(layer){total+=layer.amount;heights.push((this.h/2-y-b.localHeights[j])/COS+depth*CAMERA_SLOPE);b.uniforms.colors.value[j].set(COLORS[layer.color]);}else heights.push(heights.at(-1)??-10000);}
  b.uniforms.heights.value.set(...heights);b.fluid.visible=total>.001;
  b.caps.forEach((cap,j)=>{cap.visible=visibility>.001&&!!layers[j]&&j===layers.length-1;if(!cap.visible)return;cap.position.set(x-this.w/2,heights[j],depth);});
  // Soft contact shadows and small status marks stay in the lightweight canvas.
  const selected=index===this.selected||(!this.motion&&this.hint[0]===index),available=!this.motion&&(this.possible.includes(index)||this.hint[1]===index);b.lip.material.color.set(selected?'#ffe58a':available?'#b8ffb1':'#f7ead6');b.shell.material.emissive.set(selected?'#695026':available?'#225363':'#000000');b.shell.material.emissiveIntensity=.22;
  if(this.motion)return; // No annotation pixels change during a WebGL pour.
  c.textAlign='center';c.font='800 11px AuroraLab, sans-serif';c.fillStyle=selected?'#b7e354':'#b9d4cb';if(!this.motion&&this.hint.length)c.fillText(String(index+1).padStart(2,'0'),this.slots[index].x,this.slots[index].y+h/2+23);
  if(available||(!this.motion&&completeBottle(this.board[index]))){c.font='17px sans-serif';c.fillStyle='#e2c992';c.fillText(available?'↓':'✓',x+w*.42,y-h/2+12);}
 }
 // Finish GPU/UI setup before starting the shared animation/audio clock.
 async preparePour(from,to,next){
  if(this.reduced||!this.active)return;
  const routesReady=this.prepareRoutes(from,to,next);
  const saved={motion:this.motion,lastPour:this.lastPour,renderFocus:this.renderFocus,waves:this.waves};
  this.preparingPour=true;this.waves=[];const now=performance.now();
  this.motion={from,to,sign:this.slots[to].x<this.w/2?-1:1,next,original:this.board.map(b=>[...b]),n:next[to].length-this.board[to].length,start:now,duration:POUR_TIMING.duration,resolve(){}};
  this.draw(now);this.gl.getContext().finish();Object.assign(this,saved);this.preparingPour=false;this.snapshotDirty=false;
  await Promise.all([routesReady,new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))]);
 }
 draw(now){
  if(this.snapshotReady&&!this.snapshotDirty&&!this.motion&&(!this.settle||now-this.settle.start>1400))return;
  const cpuStart=performance.now(),m=this.motion;
  if(m&&!this.preparingPour&&!this.perfPour)this.perfPour={start:now,last:now,frames:0,cpu:0,worst:0,intervals:[],middle:[]};
  if(m)this.lastPour=m;this.renderFocus=m||(this.settle&&now-this.settle.start<1400?this.lastPour:null);const focus=this.renderFocus;
  if(this.snapshot){this.snapshot.visible=!!focus&&this.snapshotReady;if(this.snapshot.visible){const phase=m?(now-m.start)/m.duration:1;this.snapshot.material.uniforms.alpha.value=1;for(const [key,i] of [['holeA',focus.from],['holeB',focus.to]]){const p=this.slots[i];this.snapshot.material.uniforms[key].value.set((p.x-p.w*.55)/this.w,1-(p.y+p.h/2+35)/this.h,(p.x+p.w*.55)/this.w,1-(p.y-p.h/2-35)/this.h);}}}
  super.draw(now);if(!this.gl)return;
  this.stream.visible=false;this.drops.forEach(d=>d.visible=false);
  if(m){const t=Math.min(1,(now-m.start)/m.duration),flow=pourState(t);
   if(t>POUR.start&&t<POUR.end+POUR.flight){
    const p=this.currentPoses?.[m.from],dest=this.currentPoses?.[m.to]||this.slots[m.to];
    if(p){const sign=m.sign;
     const lip=rotate([sign*p.w*LIP,-p.h/2+5],p.x,p.y,p.a);
     const poly=interior(dest.w,dest.h).map(q=>rotate(q,dest.x,dest.y,0));
     const receiving=this.meshes[m.to];
     const endY=surface(poly,(m.original[m.to].length+m.n*flow.received)*FILL/4)-waterOffset(0,0,dest.w*.35,now/1000,receiving?.uniforms.slope.value||0,receiving?.uniforms.wave.value||0)*COS;
     this.stream.visible=true;this.stream.material.color.set(COLORS[m.original[m.from].at(-1)]);
     const pos=this.stream.geometry.attributes.position;
     // The front falls into the receiver; the tail follows it after the source stops.
     const front=Math.min(1,((t-POUR.start)/POUR.flight)**2);
     const tail=Math.min(1,Math.max(0,(t-POUR.end)/POUR.flight)**2);
     for(let j=0;j<=32;j++){
      const v=tail+(front-tail)*j/32,section=jetSection(t,v);
      const lateral = sign * Math.min(6, (endY-lip[1])*.085);
      const travel = Math.sqrt(v);
      const bow = lateral * travel * (1-travel) * 4;
      const xx=lip[0]+(dest.x-lip[0])*v+bow;
      const yy=lip[1]+(endY-lip[1])*v,zz=(this.meshes[m.from]?.depth||0)*(1-v);
      const r=(Math.min(p.w,dest.w)*.056+Math.min(m.n,3)*.16)*section.radius*(1+.012*Math.sin(v*14-now*.009));
      // Circular cross sections perpendicular to the jet tangent avoid flat ribbons.
      const dx=dest.x-lip[0]+lateral*(2/Math.max(.08,travel)-4),dy=(endY-lip[1])/COS,len=Math.hypot(dx,dy)||1;
      for(let k=0;k<10;k++){const a=k*Math.PI/5,offset=Math.cos(a)*r;pos.setXYZ(j*10+k,xx-this.w/2+offset*dy/len,(this.h/2-yy)/COS+offset*dx/len+zz*CAMERA_SLOPE,zz+Math.sin(a)*r);}
     }
     pos.needsUpdate=true;this.stream.geometry.computeVertexNormals();
     this.drops.slice(0,3).forEach((d,k)=>{const q=(now/440+k/6)%1;d.visible=flow.impact>.05;d.scale.set(.6*(1-q)*flow.impact,1.1*(1-q)*flow.impact,.6*(1-q)*flow.impact);d.position.set(dest.x-this.w/2+Math.sin(k*2.4)*q*6,(this.h/2-endY+Math.sin(q*Math.PI)*5)/COS,Math.cos(k*2.4)*q*4);});
    }
   }
  }
  if(m){const phase=(now-m.start)/m.duration,p=this.currentPoses?.[m.from],d=this.currentPoses?.[m.to];
   if(p&&d)FINAL_DROPS.forEach((drop,k)=>{const bead=dropShape(phase,drop);if(!bead)return;
    const particle=this.drops[k+3],sign=m.sign,lip=rotate([sign*p.w*LIP,-p.h/2+5],p.x,p.y,p.a);
    const poly=interior(d.w,d.h).map(q=>rotate(q,d.x,d.y,0)),endY=surface(poly,m.next[m.to].length*FILL/4),fall=bead.fall,z=(this.meshes[m.from]?.depth||0)*(1-fall);
    particle.visible=true;const size=(1.25+drop.gain*.95)*bead.scale,radial=size/Math.sqrt(bead.stretch);particle.scale.set(radial,size*bead.stretch,radial);particle.position.set(lip[0]+(d.x-lip[0])*fall-this.w/2,(this.h/2-(lip[1]+(endY-lip[1])*fall))/COS+z*CAMERA_SLOPE,z);
   });
  }
  const receiver=m?.to??this.settle?.index;
  this.ripples.forEach((ring,k)=>{ring.visible=false;if(receiver===undefined||this.reduced)return;const vessel=this.meshes[receiver];if(!vessel)return;const phase=m?(now-m.start)/m.duration:1;const strength=m?pourState(phase).impact:Math.exp(-(now-this.settle.start)/350);const finalStrength=m?FINAL_DROPS.reduce((v,d)=>{const age=(phase-d.impact)*m.duration;return v+(age>=0?Math.exp(-age/170)*d.gain:0);},0):0;const power=Math.min(1,strength+finalStrength);if(power<.03)return;const dropAge=m?(phase-FINAL_DROPS[k].impact)*m.duration:-1;const landing=dropAge>=0&&dropAge<420;const progress=landing?dropAge/420:((now-(m?.start??this.settle.start))/650+k/3)%1;const radius=(.08+progress*.7)*vessel.w*.35;ring.visible=true;ring.scale.setScalar(radius);ring.material.opacity=(1-progress)*(landing?FINAL_DROPS[k].gain:power)*.36;ring.position.set(vessel.root.position.x,vessel.uniforms.heights.value.w+.6,vessel.depth);});
  if(!this.warmed){
   const visibility=[];for(const o of [this.snapshot,...this.ripples]){visibility.push([o,o.visible]);o.visible=true;}for(const b of this.meshes)for(const cap of b.caps){visibility.push([cap,cap.visible]);cap.visible=true;}visibility.push([this.stream,this.stream.visible]);this.stream.visible=true;for(const d of this.drops){visibility.push([d,d.visible]);d.visible=true;}
   const warmTarget=new T.WebGLRenderTarget(1,1);this.gl.compile(this.scene3,this.camera);this.gl.setRenderTarget(warmTarget);this.gl.render(this.scene3,this.camera);this.gl.setRenderTarget(null);this.gl.getContext().finish();warmTarget.dispose();visibility.forEach(([o,v])=>o.visible=v);this.warmed=true;
  }
  this.gl.render(this.scene3,this.camera);
  if(!m&&this.snapshotDirty&&this.snapshotTexture){this.gl.copyFramebufferToTexture(this.snapshotTexture);this.snapshotReady=true;this.snapshotDirty=false;}
  // Exercise real framebuffer pipelines before the first interaction.
  // All preparation and restoration finish in this task, before presentation.
  if(!this.preparedPour&&!this.preparingPour&&this.board.length>1&&this.snapshotReady){
   this.preparedPour=true;this.preparingPour=true;
   const saved={board:this.board,motion:this.motion,lastPour:this.lastPour,renderFocus:this.renderFocus,waves:this.waves,settle:this.settle};
   const original=this.board.map(b=>[...b]);const from=original.findIndex(b=>b.length);const to=from===0?1:0;
   if(from>=0){
    original[to]=[];const next=original.map(b=>[...b]);next[to].push(next[from].pop());
    this.board=original;this.waves=[];
    for(const phase of [.04,.4,.8]){this.motion={from,to,sign:this.slots[to].x<this.w/2?-1:1,original,next,n:1,start:now-phase*POUR_TIMING.duration,duration:POUR_TIMING.duration,resolve(){}};this.draw(now);}
    this.gl.getContext().finish();
   }
   Object.assign(this,saved);this.preparingPour=false;this.snapshotDirty=true;this.draw(now);
  }
  if(this.perfPour){const p=this.perfPour;if(p.frames){p.intervals.push(now-p.last);if(m&&(now-m.start)/m.duration>.2&&(now-m.start)/m.duration<.85)p.middle.push(now-p.last);}p.frames++;p.cpu+=performance.now()-cpuStart;p.worst=Math.max(p.worst,now-p.last);p.last=now;if(!this.motion){console.info('AURORA_PERF '+JSON.stringify({fps:Math.round((p.frames-1)*1000/(now-p.start)),cpuMs:+(p.cpu/p.frames).toFixed(2),worstFrameMs:Math.round(p.worst),p95:p.intervals.slice().sort((a,b)=>a-b)[Math.floor(p.intervals.length*.95)],middleFPS:Math.round(p.middle.length*1000/p.middle.reduce((a,b)=>a+b,0)),bottles:this.board.length,triangles:this.gl.info.render.triangles}));this.perfPour=null;}}
 }
 destroy(){this.waterStudy?.dispose();this.snapshotTexture?.dispose();this.snapshot?.geometry.dispose();this.snapshot?.material.dispose();super.destroy();this.clearMeshes();this.envTarget?.dispose();this.ripples?.forEach(r=>{r.geometry.dispose();r.material.dispose();});this.stream?.geometry.dispose();this.stream?.material.dispose();this.drops?.forEach(d=>d.geometry.dispose());if(this.gl){this.gl.dispose();this.gl.forceContextLoss();this.gl.domElement.remove();}}
}
