import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {carPose,wheelTrailLength} from '../domain/motion.mjs';
import {createRollingWheels,rollWheels} from './rolling-wheels.js';

function freeObject(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of [].concat(node.material||[])){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
 geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>{value.source?.data?.close?.();value.dispose();});
}

export function mountCarScene(host,{onReady,onError,onProject}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:devicePixelRatio<2,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.appendChild(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,60),car=new THREE.Group();scene.add(car);
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
 const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(-3,5,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0xffd9d9,3);rim.position.set(4,3,-4);scene.add(rim);
 scene.add(new THREE.HemisphereLight(0xe9efff,0x161014,1.5));
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x0a0b0d,roughness:.6,metalness:.2,transparent:true,opacity:.035}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;scene.add(floor);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.95)');gradient.addColorStop(.5,'rgba(0,0,0,.6)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6,3.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.003;scene.add(shadow);

 const anchors=[new THREE.Vector3(.85,.6,1.35),new THREE.Vector3(-.7,1.25,.6)],referenceCamera=camera.clone();let referencePoints=[],referenceCarBounds=null,localCorners=[];
 function projectPoint(point,view){point.project(view);return {x:(point.x+1)/2,y:(1-point.y)/2};}
 function projectBounds(matrix,view){if(!localCorners.length)return null;const p=localCorners.map(corner=>projectPoint(corner.clone().applyMatrix4(matrix),view));return {left:Math.min(...p.map(v=>v.x)),right:Math.max(...p.map(v=>v.x)),top:Math.min(...p.map(v=>v.y)),bottom:Math.max(...p.map(v=>v.y))};}
 let disposed=false,active=true,loaded=false,frame=null,current=0,target=0,dirty=true,last=0,wheels=[];const abort=new AbortController();
 function render(time){frame=null;if(disposed||!active||!loaded||document.hidden)return;const delta=Math.min(64,last?time-last:16);last=time;current+= (target-current)*(1-Math.exp(-delta/120));if(Math.abs(target-current)<.0001)current=target;const pose=carPose(current);car.rotation.y=pose.rotation;car.position.set(pose.x*(camera.aspect<1?.55:1),0,pose.z);car.scale.setScalar(pose.scale);rollWheels(wheels,(carPose(0).x-pose.x)*(camera.aspect<1?.55:1));shadow.position.x=car.position.x;shadow.position.z=car.position.z;shadow.rotation.z=-pose.rotation;camera.position.set(0,pose.cameraHeight,pose.cameraDistance);camera.lookAt(0,.8,0);renderer.render(scene,camera);car.updateMatrixWorld(true);onProject?.({points:anchors.map(anchor=>{const point=anchor.clone().applyMatrix4(car.matrixWorld).project(camera);return {x:(point.x+1)/2,y:(1-point.y)/2};}),reference:referencePoints,carBounds:projectBounds(car.matrixWorld,camera),referenceCarBounds,trails:[.85,-.85].map(x=>{const start=new THREE.Vector3(x,.025,-1.6).applyMatrix4(car.matrixWorld);return {start:projectPoint(start.clone(),camera),end:projectPoint(start.clone().add(new THREE.Vector3(wheelTrailLength(current),0,0)),camera)};})});if(!loaded)return;if(dirty){dirty=false;onReady();}if(current!==target)request();}
 function request(){if(!disposed&&active&&loaded&&!document.hidden&&frame===null)frame=requestAnimationFrame(render);}
 function resize(){if(disposed)return;const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(36)/2)/Math.min(camera.aspect/1.35,1)));camera.updateProjectionMatrix();referenceCamera.copy(camera);const initial=carPose(0);referenceCamera.position.set(0,initial.cameraHeight,initial.cameraDistance);referenceCamera.lookAt(0,.8,0);referenceCamera.updateMatrixWorld(true);const matrix=new THREE.Matrix4().compose(new THREE.Vector3(initial.x*(camera.aspect<1?.55:1),0,initial.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,initial.rotation,0)),new THREE.Vector3(initial.scale,initial.scale,initial.scale));referencePoints=anchors.map(anchor=>{const p=anchor.clone().applyMatrix4(matrix).project(referenceCamera);return {x:(p.x+1)/2,y:(1-p.y)/2};});referenceCarBounds=projectBounds(matrix,referenceCamera);request();}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function visibility(){last=0;request();}document.addEventListener('visibilitychange',visibility);
 function contextLost(event){event.preventDefault();onError();}canvas.addEventListener('webglcontextlost',contextLost);
 const timeout=setTimeout(()=>abort.abort(),20000);
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 fetch('/models/showroom-car.glb',{signal:abort.signal}).then(response=>{if(!response.ok)throw new Error('Model unavailable');return response.arrayBuffer();}).then(bytes=>{if(disposed)return;return loader.parseAsync(bytes,'');}).then(gltf=>{
  clearTimeout(timeout);if(!gltf)return;if(disposed){freeObject(gltf.scene);return;}
  const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=4.6/Math.max(size.x,size.z);model.scale.multiplyScalar(scale);model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z).multiplyScalar(scale));
  model.traverse(node=>{if(!node.isMesh)return;node.frustumCulled=false;const materials=[].concat(node.material);node.material=materials.map(material=>{if(!material.name.endsWith('_Pintura'))return material;const paint=new THREE.MeshPhysicalMaterial({name:'Vértice red',color:0xb80d21,metalness:.65,roughness:.24,clearcoat:1,clearcoatRoughness:.12});material.dispose();return paint;});if(!Array.isArray(node.material)||node.material.length===1)node.material=node.material[0];});
  car.add(model);wheels=createRollingWheels(car,model);const box=new THREE.Box3().setFromObject(car);localCorners=[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new THREE.Vector3(x,y,z))));loaded=true;resize();request();
 }).catch(()=>{clearTimeout(timeout);if(!disposed)onError();});
 return {update(progress){target=progress;if(!loaded)current=progress;request();},setActive(value){active=value;last=0;if(!active&&frame!==null){cancelAnimationFrame(frame);frame=null;}request();},dispose(){if(disposed)return;disposed=true;abort.abort();clearTimeout(timeout);if(frame!==null)cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);freeObject(scene);environment.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}
