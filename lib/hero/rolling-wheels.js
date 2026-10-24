import * as THREE from 'three';

const materialsOf=mesh=>[].concat(mesh.material||[]);
const isTire=mesh=>materialsOf(mesh).some(material=>material.name.endsWith('_Pneu'));
const isRim=mesh=>materialsOf(mesh).some(material=>material.name.endsWith('_Roda'));
const component=(attribute,index,axis)=>[attribute.getX,attribute.getY,attribute.getZ,attribute.getW][axis].call(attribute,index);

// Separate only tire/rim meshes. The body retains its original geometry and pose.
export function createRollingWheels(root,model){
 root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert(),tires=[],rims=[];
 model.traverse(node=>{if(node.isMesh){if(isTire(node))tires.push(node);else if(isRim(node))rims.push(node);}});
 const groups=new Map();
 for(const mesh of tires){
  const box=new THREE.Box3().setFromObject(mesh),center=box.getCenter(new THREE.Vector3()).applyMatrix4(inverse),size=box.getSize(new THREE.Vector3());
  const key=`${center.x<0?'left':'right'}-${center.z<0?'rear':'front'}`;
  if(!groups.has(key))groups.set(key,{key,center:new THREE.Vector3(),radius:0,meshes:[]});
  const group=groups.get(key);group.center.add(center);group.radius+=Math.max(size.y,size.z)/2;group.meshes.push(mesh);
 }
 if(groups.size!==4)return [];
 const wheels=[...groups.values()];
 for(const wheel of wheels){wheel.center.multiplyScalar(1/wheel.meshes.length);wheel.radius/=wheel.meshes.length;wheel.pivot=new THREE.Group();wheel.pivot.name=`rolling-${wheel.key}`;wheel.pivot.position.copy(wheel.center);root.add(wheel.pivot);wheel.pivot.updateWorldMatrix(true,false);for(const mesh of wheel.meshes)wheel.pivot.attach(mesh);}
 for(const mesh of rims){
  mesh.updateWorldMatrix(true,false);const matrix=inverse.clone().multiply(mesh.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),geometry=mesh.geometry,position=geometry.attributes.position;
  const attributes=Object.entries(geometry.attributes),buckets=wheels.map(()=>Object.fromEntries(attributes.map(([name])=>[name,[]]))),indices=geometry.index,triangleCount=(indices?indices.count:position.count)/3;
  for(let triangle=0;triangle<triangleCount;triangle++){
   const ids=[0,1,2].map(i=>indices?indices.getX(triangle*3+i):triangle*3+i),vertices=ids.map(id=>new THREE.Vector3().fromBufferAttribute(position,id).applyMatrix4(matrix)),center=vertices.reduce((sum,point)=>sum.add(point),new THREE.Vector3()).multiplyScalar(1/3);
   let chosen=0,distance=Infinity;wheels.forEach((wheel,index)=>{const next=center.distanceToSquared(wheel.center);if(next<distance){chosen=index;distance=next;}});
   for(let corner=0;corner<3;corner++)for(const [name,attribute] of attributes){
    const values=buckets[chosen][name],id=ids[corner];
    if(name==='position'){values.push(...vertices[corner].clone().sub(wheels[chosen].center).toArray());}
    else if(name==='normal'){values.push(...new THREE.Vector3().fromBufferAttribute(attribute,id).applyNormalMatrix(normalMatrix).toArray());}
    else if(name==='tangent'){const tangent=new THREE.Vector3(attribute.getX(id),attribute.getY(id),attribute.getZ(id)).transformDirection(matrix);values.push(...tangent.toArray(),attribute.getW(id));}
    else for(let axis=0;axis<attribute.itemSize;axis++)values.push(component(attribute,id,axis));
   }
  }
  buckets.forEach((bucket,index)=>{if(!bucket.position.length)return;const split=new THREE.BufferGeometry();for(const [name,attribute] of attributes)split.setAttribute(name,new THREE.Float32BufferAttribute(bucket[name],attribute.itemSize));if(!split.attributes.normal)split.computeVertexNormals();split.computeBoundingBox();split.computeBoundingSphere();const rim=new THREE.Mesh(split,mesh.material);rim.name=`rim-${wheels[index].key}`;wheels[index].pivot.add(rim);});
  mesh.removeFromParent();geometry.dispose();
 }
 return wheels.map(wheel=>({pivot:wheel.pivot,radius:wheel.radius}));
}

export function rollWheels(wheels,distance){for(const wheel of wheels)wheel.pivot.rotation.x=distance/Math.max(.1,wheel.radius);}
