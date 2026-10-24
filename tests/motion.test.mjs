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
