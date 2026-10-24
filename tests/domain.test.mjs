import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateFinance } from '../lib/domain/finance.mjs';
import { filterVehicles, toggleSelection, parseFilters } from '../lib/domain/catalog.mjs';
import { validateLead, validateVehicle, validateSettings } from '../lib/domain/validation.mjs';
import { seedVehicles } from '../lib/seed.mjs';

test('Price with positive rate matches independent calculation',()=>{
 const r=simulateFinance(60000,10000,48,1.5);
 assert.ok(Math.abs(r.payment-1468.75)<0.02);
 assert.equal(r.financed,50000);assert.ok(Math.abs(r.total-r.payment*48-10000)<0.01);
});
test('zero interest and full down payment',()=>{
 assert.equal(simulateFinance(60000,12000,48,0).payment,1000);
 assert.equal(simulateFinance(60000,60000,48,1.5).payment,0);
});
test('invalid and unbounded finance inputs rejected',()=>{
 for(const a of [[-1,0,48,1],[50000,60000,48,1],[50000,0,0,1],[50000,0,48,-1],[NaN,0,48,1],[50000,0,3.2,1],[50000,0,241,1]])assert.throws(()=>simulateFinance(...a));
});
test('blank, missing and nonnumeric types are not a zero-interest quote',()=>{
 for(const a of [[60000,'',48,1],[60000,0,48,''],[60000,0,48,' '],[60000,null,48,1],[60000,0,48,false],[60000,0,48,'-']])assert.throws(()=>simulateFinance(...a));
 assert.equal(simulateFinance('60000','12000','48','0').payment,1000);
});
test('12 unique complete illustrative listings',()=>{
 assert.equal(seedVehicles.length,12);assert.equal(new Set(seedVehicles.map(v=>v.id)).size,12);
 for(const v of seedVehicles){assert.ok(v.photos.length>=1);assert.ok(v.equipment.length>=4);assert.doesNotThrow(()=>validateVehicle(v));}
});
test('combined catalog filters and accent-insensitive query',()=>{
 const list=[{id:'a',brand:'Citroën',model:'C3',version:'Feel',price:50000,year:2022,km:20000,category:'Hatch',transmission:'Manual',fuel:'Flex',status:'available'},{id:'b',brand:'Fiat',model:'Argo',price:60000,year:2020,km:50000,category:'Hatch',transmission:'Manual',fuel:'Flex',status:'available'}];
 assert.deepEqual(filterVehicles(list,{query:'citroen',maxPrice:'55000',minYear:'2021',maxKm:'30000'}).map(v=>v.id),['a']);
 assert.equal(filterVehicles(list,{brand:'Ford'}).length,0);
 assert.equal(filterVehicles(list,{maxPrice:'invalid'}).length,2);
 assert.deepEqual(filterVehicles(list,{sort:'price-desc'}).map(v=>v.id),['b','a']);
});
test('URL parsing ignores malicious/invalid filter values',()=>{
 const f=parseFilters(new URLSearchParams('maxPrice=-1&minYear=oops&sort=evil&brand=Fiat'));
 assert.equal(f.brand,'Fiat');assert.equal(f.maxPrice,'');assert.equal(f.minYear,'');assert.equal(f.sort,'featured');
});
test('comparison is unique and limited to three',()=>{
 assert.deepEqual(toggleSelection(['a','b','c'],'d',3),['a','b','c']);
 assert.deepEqual(toggleSelection(['a','b'],'a',3),['b']);
});
const lead={name:'Pessoa Teste',email:'teste@example.com',phone:'11999999999',kind:'contact',consent:true,message:'Olá',website:''};
test('lead requires consent, a usable contact, and no honeypot',()=>{
 assert.equal(validateLead(lead,'2026-10-24').name,'Pessoa Teste');
 for(const x of [{...lead,consent:false},{...lead,email:'bad'},{...lead,phone:'12'},{...lead,website:'spam'},{...lead,name:'a'}])assert.throws(()=>validateLead(x,'2026-10-24'));
 assert.throws(()=>validateLead({...lead,kind:'test-drive',date:'2026-10-23',period:'Manhã'},'2026-10-24'));
 assert.throws(()=>validateLead({...lead,kind:'test-drive',date:'2026-10-28',period:'Manhã'},'2026-10-24'));
});
test('test-drive requires valid vehicle and date',()=>{
 assert.equal(validateLead({...lead,kind:'test-drive',vehicle_id:'onix-2022',date:'2026-10-25',period:'Manhã'},'2026-10-24').date,'2026-10-25');
 assert.throws(()=>validateLead({...lead,kind:'test-drive',vehicle_id:'onix',date:'2026-02-31',period:'Manhã'},'2026-02-01'));
});
test('vehicle validation rejects mass assignment, unsafe assets, malformed numbers',()=>{
 const v=validateVehicle({...seedVehicles[0],is_admin:true});assert.equal(v.is_admin,undefined);
 for(const x of [{...v,price:'abc'},{...v,km:-1},{...v,photos:['javascript:alert(1)']},{...v,status:'admin'},{...v,year:9999}])assert.throws(()=>validateVehicle(x));
});
test('store settings whitelist valid contact destinations',()=>{
 assert.equal(validateSettings({name:'Vértice Motors',address:'Endereço demonstrativo',hours:'Seg a sáb',email:'contato@example.com',whatsapp:'',story:'História fictícia'}).whatsapp,'');
 assert.throws(()=>validateSettings({name:'Loja',email:'bad',whatsapp:'abc'}));
});
test('highlights use available marked listings and recover when none are eligible',async()=>{
 const {selectHighlights}=await import('../lib/domain/catalog.mjs');
 const vehicles=Array.from({length:6},(_,index)=>({id:String(index),featured:true,status:'available',archived:false}));
 vehicles[1].status='reserved';vehicles[2].archived=true;
 assert.deepEqual(selectHighlights(vehicles).map(vehicle=>vehicle.id),['0','3','4']);
 assert.deepEqual(selectHighlights(vehicles.map(vehicle=>({...vehicle,featured:false}))),[]);
 assert.equal(vehicles.length,6);
});
