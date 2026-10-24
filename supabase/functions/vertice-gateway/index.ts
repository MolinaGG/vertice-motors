// Machine gateway: Sites checks visitor identity, this function repeats admin authorization.
// Supabase credentials are managed runtime variables, never copied into client/source.
import {verifyToken,isAdmin,canBootstrap,authorizedAction,inspectImage} from '../../../lib/domain/access.mjs';
import {validateVehicle,validateLead,validateSettings} from '../../../lib/domain/validation.mjs';
import {uploadAndAttachPhoto} from '../../../lib/domain/photos.mjs';
declare const Deno: any;
const origin=Deno.env.get('SUPABASE_URL');
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const baseHeaders={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
class HttpError extends Error {status:number;constructor(status:number,message:string){super(message);this.status=status;}}
async function rest(path:string,method='GET',body?:any):Promise<any>{
 const r=await fetch(`${origin}/rest/v1/${path}`,{method,headers:{...baseHeaders,Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok){if(r.status===409)throw new HttpError(409,'Este registro já existe ou foi atualizado. Recarregue a página.');throw new HttpError(502,'Não foi possível concluir a operação no banco.');}
 return r.status===204?null:r.json();
}
const json=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unwrap=(row:any)=>({...row.payload,id:row.id,status:row.status,archived:row.archived});
async function audit(actor:any,action:string,id?:string){await rest('vertice_audit','POST',{actor_id:actor.userId,action,object_id:id||null});}
async function adminState(){const [vehicles,leads,settings]=await Promise.all([rest('vertice_vehicles?order=updated_at.desc'),rest('vertice_leads?order=created_at.desc&limit=500'),rest('vertice_settings?id=eq.1')]);return {vehicles:vehicles.map(unwrap),leads:leads.map((r:any)=>({...r.payload,id:r.id,vehicle_id:r.vehicle_id,status:r.status,created_at:r.created_at})),settings:settings[0]?.payload};}
Deno.serve(async(req:Request)=>{
 try{
  if(req.method!=='POST')return json({error:'Método não permitido.'},405);
  if(Number(req.headers.get('content-length')||0)>7500000)return json({error:'Arquivo muito grande.'},413);
  const token=req.headers.get('x-vertice-token')||'';
  if(token.length<48)return json({error:'Acesso negado.'},401);
  const secrets=await rest('vertice_runtime_access?id=eq.1&select=token_hash');
  if(!await verifyToken(token,secrets[0]?.token_hash))return json({error:'Acesso negado.'},401);
  const raw=await req.text();if(raw.length>7500000)return json({error:'Arquivo muito grande.'},413);
  let body:any;try{body=JSON.parse(raw);}catch{return json({error:'Solicitação inválida.'},400);}
  const {action,payload={},actor=null}=body;
  const admins=await rest('vertice_admins?id=eq.1');const admin=admins[0];const allowed=isAdmin(actor,admin);
  if(action==='authState')return json({is_admin:allowed,initialized:!!admin});
  if(action==='bootstrapAdmin'){
   if(allowed)return json({ok:true});
   if(!canBootstrap(actor,admin,payload.private_setup===true))throw new HttpError(403,'Configuração administrativa indisponível.');
   await rest('vertice_admins','POST',{id:1,user_id:actor.userId});await audit(actor,'bootstrap');return json({ok:true});
  }
  if(action==='photo'){
   const path=String(payload.path||'');if(!/^[a-z0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/.test(path))throw new HttpError(404,'Imagem não encontrada.');
   if(!allowed){const rows=await rest(`vertice_vehicles?archived=eq.false&status=in.(available,reserved)&select=payload&payload=cs.${encodeURIComponent(JSON.stringify({photos:[`/api/media/${path}`]}))}`);if(!rows.length)throw new HttpError(404,'Imagem não encontrada.');}
   const r=await fetch(`${origin}/storage/v1/object/sign/vertice-vehicle-images/${path}`,{method:'POST',headers:baseHeaders,body:JSON.stringify({expiresIn:60})});
   if(!r.ok)throw new HttpError(404,'Imagem não encontrada.');const data:any=await r.json();return json({url:`${origin}/storage/v1${data.signedURL}`});
  }
  if(!authorizedAction(action,allowed))throw new HttpError(403,'Você não tem permissão para esta operação.');
  if(action==='catalog'){const [vehicles,settings]=await Promise.all([rest('vertice_vehicles?archived=eq.false&status=in.(available,reserved)&order=updated_at.desc'),rest('vertice_settings?id=eq.1')]);return json({vehicles:vehicles.map(unwrap),settings:settings[0]?.payload});}
  if(action==='createLead'){
   const lead=validateLead(payload,new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}));
   const requestId=String(payload.request_id||'');if(!/^[0-9a-f-]{36}$/.test(requestId))throw new HttpError(400,'Identificador de solicitação inválido.');
   const existing=await rest(`vertice_leads?request_id=eq.${requestId}&select=id`);if(existing.length)return json({id:existing[0].id});
   const rate=await rest('rpc/vertice_consume_rate_limit','POST',{p_key:payload.rate_key});if(!rate)throw new HttpError(429,'Muitas solicitações. Tente novamente em uma hora.');
   if(lead.vehicle_id){const v=await rest(`vertice_vehicles?id=eq.${encodeURIComponent(lead.vehicle_id)}&archived=eq.false&status=eq.available`);if(!v.length)throw new HttpError(400,'Este veículo não está disponível para novas solicitações.');}
   const saved=await rest('vertice_leads','POST',{vehicle_id:lead.vehicle_id,payload:lead,status:'new',request_id:requestId});return json({id:saved[0].id},201);
  }
  if(action==='adminState')return json(await adminState());
  if(action==='saveVehicle'){
   const vehicle:any=validateVehicle(payload);const existing=await rest(`vertice_vehicles?id=eq.${vehicle.id}`);
   if(payload.create===true&&existing.length)throw new HttpError(409,'Já existe um veículo com este identificador.');
   if(payload.create!==true&&!existing.length)throw new HttpError(404,'Veículo não encontrado.');
   const row={id:vehicle.id,payload:vehicle,status:vehicle.status,archived:vehicle.archived,updated_at:new Date().toISOString()};
   await rest(existing.length?`vertice_vehicles?id=eq.${vehicle.id}`:'vertice_vehicles',existing.length?'PATCH':'POST',row);await audit(actor,'saveVehicle',vehicle.id);return json({vehicle});
  }
  if(action==='archiveVehicle'){
   const id=String(payload.id||'');if(!/^[a-z0-9-]{3,80}$/.test(id))throw new HttpError(400,'Identificador inválido.');
   const rows=await rest(`vertice_vehicles?id=eq.${id}`,'PATCH',{archived:payload.archived!==false,updated_at:new Date().toISOString()});if(!rows.length)throw new HttpError(404,'Veículo não encontrado.');await audit(actor,'archiveVehicle',id);return json({ok:true});
  }
  if(action==='updateLead'){
   if(!/^[a-f0-9-]{36}$/.test(payload.id)||!['new','in_progress','completed','dismissed'].includes(payload.status))throw new HttpError(400,'Atualização inválida.');
   await rest(`vertice_leads?id=eq.${payload.id}`,'PATCH',{status:payload.status});await audit(actor,'updateLead',payload.id);return json({ok:true});
  }
  if(action==='saveSettings'){const settings=validateSettings(payload);await rest('vertice_settings?id=eq.1','PATCH',{payload:settings,updated_at:new Date().toISOString()});await audit(actor,'saveSettings');return json({settings});}
  if(action==='uploadPhoto'){
   const id=String(payload.vehicle_id||'');if(!/^[a-z0-9-]{3,80}$/.test(id))throw new HttpError(400,'Veículo inválido.');
   const bytes=Uint8Array.from(atob(payload.base64||''),c=>c.charCodeAt(0));
   const result=await uploadAndAttachPhoto({vehicleId:id,bytes,type:payload.type},{
    getVehicle:async(vehicleId:string)=>{const rows=await rest(`vertice_vehicles?id=eq.${vehicleId}`);return rows[0]?unwrap(rows[0]):null;},
    put:async(path:string,data:Uint8Array,type:string)=>{const r=await fetch(`${origin}/storage/v1/object/vertice-vehicle-images/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':type,'x-upsert':'true'},body:new Uint8Array(data).buffer});if(!r.ok)throw new HttpError(502,'Não foi possível enviar a imagem.');},
    attach:async(vehicleId:string,url:string)=>rest('rpc/vertice_attach_photo','POST',{p_vehicle_id:vehicleId,p_url:url})
   });await audit(actor,'uploadPhoto',id);return json(result);
  }
  if(action==='deletePhoto'){
   const path=String(payload.path||'').replace(/^\/api\/media\//,'');if(!/^[a-z0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/.test(path))throw new HttpError(400,'Arquivo fora do armazenamento da loja.');
   const r=await fetch(`${origin}/storage/v1/object/vertice-vehicle-images`,{method:'DELETE',headers:baseHeaders,body:JSON.stringify({prefixes:[path]})});if(!r.ok)throw new HttpError(502,'Não foi possível remover a imagem.');await audit(actor,'deletePhoto',path);return json({ok:true});
  }
  throw new HttpError(400,'Operação desconhecida.');
 }catch(e:any){const status=e instanceof HttpError?e.status:400;return json({error:e instanceof HttpError?e.message:typeof e?.message==='string'?e.message.slice(0,200):'Solicitação inválida.'},status);}
});
