import test from 'node:test';
import assert from 'node:assert/strict';
import {uploadAndAttachPhoto} from '../lib/domain/photos.mjs';
const bytes=new Uint8Array([255,216,255,224,0,1,2]);
test('retry after attachment failure reuses the same object and preserves persisted vehicle fields',async()=>{
 const objects=new Map(),vehicle={model:'Onix',price:62900,photos:[]};let fail=true;
 const storage={getVehicle:async()=>vehicle,put:async(path,data)=>objects.set(path,data),attach:async(id,url)=>{if(fail){fail=false;throw new Error('temporarily unavailable');}if(!vehicle.photos.includes(url))vehicle.photos.push(url);return {...vehicle};}};
 await assert.rejects(()=>uploadAndAttachPhoto({vehicleId:'onix-2022',bytes,type:'image/jpeg'},storage));
 const result=await uploadAndAttachPhoto({vehicleId:'onix-2022',bytes,type:'image/jpeg'},storage);
 assert.equal(objects.size,1);assert.equal(result.photos.length,1);assert.equal(result.vehicle.price,62900);assert.match(result.url,/^\/api\/media\/onix-2022\/[a-f0-9]{64}\.jpg$/);
 await uploadAndAttachPhoto({vehicleId:'onix-2022',bytes,type:'image/jpeg'},storage);assert.equal(objects.size,1);assert.equal(vehicle.photos.length,1);
});
test('quota or invalid file fails before creating an object',async()=>{
 let puts=0;const storage={getVehicle:async()=>({photos:Array.from({length:12},(_,i)=>'/images/foto-'+i+'.webp')}),put:async()=>puts++,attach:async()=>{throw Error('unexpected');}};
 await assert.rejects(()=>uploadAndAttachPhoto({vehicleId:'onix-2022',bytes,type:'image/jpeg'},storage));
 await assert.rejects(()=>uploadAndAttachPhoto({vehicleId:'onix-2022',bytes:new Uint8Array([1,2]),type:'image/jpeg'},storage));assert.equal(puts,0);
});
test('storage failure does not attach a broken image',async()=>{
 let attaches=0;const storage={getVehicle:async()=>({photos:[]}),put:async()=>{throw Error('storage down');},attach:async()=>attaches++};
 await assert.rejects(()=>uploadAndAttachPhoto({vehicleId:'onix-2022',bytes,type:'image/jpeg'},storage));assert.equal(attaches,0);
});
