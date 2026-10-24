import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createRollingWheels,rollWheels} from '../lib/hero/rolling-wheels.js';

test('all four real model wheels roll while the body and complete geometry stay intact',async()=>{
 const bytes=await readFile(new URL('../public/models/showroom-car.glb',import.meta.url)),loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const root=new THREE.Group(),model=gltf.scene;model.updateMatrixWorld(true);const initial=new THREE.Box3().setFromObject(model),size=initial.getSize(new THREE.Vector3()),center=initial.getCenter(new THREE.Vector3()),scale=4.6/Math.max(size.x,size.z);model.scale.multiplyScalar(scale);model.position.sub(new THREE.Vector3(center.x,initial.min.y,center.z).multiplyScalar(scale));root.add(model);root.updateWorldMatrix(true,true);
 const count=()=>{let triangles=0;root.traverse(node=>{if(node.isMesh)triangles+=(node.geometry.index?.count||node.geometry.attributes.position.count)/3;});return triangles;};
 const before=count(),body=[];root.traverse(node=>{if(node.isMesh&&[].concat(node.material).some(material=>material.name.endsWith('_Pintura')))body.push({node,matrix:node.matrixWorld.clone()});});
 const boundsBefore=new THREE.Box3().setFromObject(root),wheels=createRollingWheels(root,gltf.scene);
 assert.equal(wheels.length,4);assert.equal(count(),before);
 const boundsAfter=new THREE.Box3().setFromObject(root);assert.ok(boundsBefore.min.distanceTo(boundsAfter.min)<.002);assert.ok(boundsBefore.max.distanceTo(boundsAfter.max)<.002);
 rollWheels(wheels,1.5);root.updateWorldMatrix(true,true);
 for(const wheel of wheels){assert.ok(wheel.pivot.rotation.x>1);assert.ok(wheel.pivot.children.some(child=>child.name.startsWith('rim-')));}
 for(const item of body)assert.ok(item.matrix.equals(item.node.matrixWorld));
 rollWheels(wheels,0);assert.ok(wheels.every(wheel=>wheel.pivot.rotation.x===0));
});
