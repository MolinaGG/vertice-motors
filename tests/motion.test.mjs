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
test('car travels across the stage as scroll advances, with depth in the middle',async()=>{
 const {carPose}=await import('../lib/domain/motion.mjs');
 assert.ok(carPose(0).x>.8);assert.ok(carPose(1).x<-.8);assert.ok(Math.abs(carPose(.5).x)<.1);
 assert.equal(carPose(0).z,0);assert.ok(carPose(.5).z>.2);assert.ok(Math.abs(carPose(1).z)<.0001);
});
test('callout connectors reach their label and reject an invalid projection',async()=>{
 const {calloutGeometry}=await import('../lib/domain/motion.mjs');
 const label={left:60,right:230,top:450,height:50},point={x:550,y:510};
 const line=calloutGeometry(point,label,'left',1200,900);
 assert.ok(line.visible);assert.ok(line.path.startsWith('M550,510'));assert.ok(line.path.endsWith('244,475'));
 assert.equal(calloutGeometry({x:NaN,y:100},label,'left',1200,900).visible,false);
 assert.equal(calloutGeometry({x:-100,y:100},label,'left',1200,900).visible,false);
});

test('transparent poster anchors preserve contain letterboxing',async()=>{
 const {posterPoint}=await import('../lib/domain/motion.mjs');const rect={left:20,top:30,width:400,height:400};
 assert.deepEqual(posterPoint(rect,800,400,{x:0,y:0}),{x:20,y:130});
 assert.deepEqual(posterPoint(rect,800,400,{x:1,y:1}),{x:420,y:330});
});
test('labels follow projected anchors and retrace their starting position',async()=>{
 const {followCallouts}=await import('../lib/domain/motion.mjs');
 const base=[{left:260,top:540,width:180,height:100},{left:1020,top:520,width:180,height:100}],reference=[{x:800,y:600},{x:700,y:500}],bounds={left:20,right:1320,top:420,bottom:850};
 const start=followCallouts(reference,reference,base,bounds),moved=followCallouts(reference.map(p=>({x:p.x-140,y:p.y+20})),reference,base,bounds);
 assert.equal(moved[0].left-start[0].left,-140);assert.equal(moved[1].left-start[1].left,-140);assert.equal(moved[0].top-start[0].top,20);
 assert.deepEqual(followCallouts(reference,reference,base,bounds),start);
});
test('following labels stay inside a compact viewport without colliding',async()=>{
 const {followCallouts}=await import('../lib/domain/motion.mjs');
 const base=[{left:120,top:350,width:160,height:100},{left:200,top:610,width:160,height:100}],reference=[{x:220,y:520},{x:175,y:460}],bounds={left:16,right:374,top:340,bottom:714};
 const placed=followCallouts([{x:-100,y:650},{x:900,y:200}],reference,base,bounds);
 for(const box of placed){assert.ok(box.left>=bounds.left&&box.left+box.width<=bounds.right);assert.ok(box.top>=bounds.top&&box.top+box.height<=bounds.bottom);}
 const [a,b]=placed;assert.ok(a.left+a.width+12<=b.left||b.left+b.width+12<=a.left||a.top+a.height+12<=b.top||b.top+b.height+12<=a.top);
});

test('overlapping callouts separate vertically within their reading area',async()=>{
 const {followCallouts}=await import('../lib/domain/motion.mjs');const base=[{left:80,top:350,width:160,height:100},{left:120,top:610,width:160,height:100}],reference=[{x:220,y:520},{x:175,y:460}];
 const [a,b]=followCallouts(reference.map(p=>({x:p.x,y:p.y-600})),reference,base,{left:16,right:374,top:340,bottom:714});
 assert.ok(a.top+a.height+12<=b.top);assert.ok(b.top+b.height<=714);
});
