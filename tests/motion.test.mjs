import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneState,brandSequence} from '../lib/domain/motion.mjs';
test('scroll scene clamps progress and changes chapters in order',()=>{
 assert.equal(sceneState(-100,1000).progress,0);assert.equal(sceneState(1500,1000).progress,1);
 assert.equal(sceneState(0,1000).chapter,0);assert.equal(sceneState(500,1000).chapter,1);assert.equal(sceneState(900,1000).chapter,2);
 assert.ok(Number.isFinite(sceneState(10,0).scale));assert.equal(sceneState(10,0).progress,0);
});
test('reduced motion keeps a readable static scene',()=>{
 const s=sceneState(800,1000,true);assert.equal(s.progress,0);assert.equal(s.chapter,0);assert.equal(s.scale,1);assert.equal(s.shift,0);
});
test('brand carousel repeats the same accessible brand order once',()=>{
 const list=['Volkswagen','Chevrolet','Fiat','Hyundai','Nissan','Renault'];const sequence=brandSequence(list);
 assert.equal(sequence.length,12);assert.deepEqual(sequence.slice(0,6).map(x=>x.name),list);assert.deepEqual(sequence.slice(6).map(x=>x.name),list);assert.ok(sequence.slice(0,6).every(x=>!x.duplicate));assert.ok(sequence.slice(6).every(x=>x.duplicate));
});
test('3D camera path is bounded, continuous and reversible',async()=>{
 const {carPose}=await import('../lib/domain/motion.mjs');
 assert.deepEqual(carPose(-1),carPose(0));assert.deepEqual(carPose(2),carPose(1));assert.deepEqual(carPose(NaN),carPose(0));
 const start=carPose(0),middle=carPose(.5),end=carPose(1);
 assert.ok(end.rotation-start.rotation>Math.PI/2);assert.ok(middle.scale>start.scale);
 for(let i=0;i<=100;i++){
  const a=carPose(i/100),b=carPose((i+.001)/100);
  assert.ok(Object.values(a).every(Number.isFinite));assert.ok(a.scale>=.9&&a.scale<=1.2);
  assert.ok(Math.abs(a.rotation-b.rotation)<.01);
 }
 assert.deepEqual(carPose(.25),carPose(.25));
});
