import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, canBootstrap, digestToken, verifyToken, validOrigin, inspectImage, authorizedAction } from '../lib/domain/access.mjs';
test('admin requires an exact stable identity',()=>{
 assert.equal(isAdmin(null,{user_id:'owner'}),false);assert.equal(isAdmin({userId:'other'},{user_id:'owner'}),false);assert.equal(isAdmin({userId:'owner'},{user_id:'owner'}),true);
});
test('bootstrap needs confirmed private setup, identity and empty singleton',()=>{
 assert.equal(canBootstrap(null,null,true),false);assert.equal(canBootstrap({userId:'owner'},null,false),false);assert.equal(canBootstrap({userId:'owner'},{user_id:'other'},true),false);assert.equal(canBootstrap({userId:'owner'},null,true),true);
});
test('machine token verified by hash, missing and mismatched denied',async()=>{
 const token='a'.repeat(64),hash=await digestToken(token);
 assert.equal(await verifyToken(token,hash),true);assert.equal(await verifyToken('b'.repeat(64),hash),false);assert.equal(await verifyToken('',hash),false);
});
test('public cannot dispatch admin actions or arbitrary actions',()=>{
 assert.equal(authorizedAction('catalog',false),true);assert.equal(authorizedAction('saveVehicle',false),false);assert.equal(authorizedAction('saveVehicle',true),true);assert.equal(authorizedAction('executeSql',true),false);
});
test('mutations only same origin; missing origin denied',()=>{
 assert.equal(validOrigin('https://example.com','https://example.com/api/admin'),true);assert.equal(validOrigin('https://evil.test','https://example.com/api/admin'),false);assert.equal(validOrigin(null,'https://example.com/api/admin'),false);
});
test('uploads require supported type, signature and size',()=>{
 assert.equal(inspectImage(new Uint8Array([255,216,255,224]),'image/jpeg'), 'jpg');
 assert.throws(()=>inspectImage(new Uint8Array([60,115,118,103]),'image/jpeg'));
 assert.throws(()=>inspectImage(new Uint8Array(5*1024*1024+1),'image/png'));
 assert.throws(()=>inspectImage(new Uint8Array([255,216,255]),'image/svg+xml'));
});
