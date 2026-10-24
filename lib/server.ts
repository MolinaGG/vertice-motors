import { env } from 'cloudflare:workers';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import { validOrigin, digestToken, authorizedAction } from './domain/access.mjs';

export class ApiError extends Error {status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export const config=()=>env as unknown as Record<string,string>;
export function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(error:unknown){return reply({error:error instanceof ApiError?error.message:'Não foi possível concluir. Tente novamente.'},error instanceof ApiError?error.status:503);}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(!validOrigin(origin,request.url)&&!(config().VERTICE_SITE_ORIGIN&&validOrigin(origin,config().VERTICE_SITE_ORIGIN)))throw new ApiError(403,'Origem da solicitação inválida.');}
export async function readJson(request:Request,max=18000){if(Number(request.headers.get('content-length')||0)>max)throw new ApiError(413,'Solicitação muito grande.');const text=await request.text();if(new TextEncoder().encode(text).length>max)throw new ApiError(413,'Solicitação muito grande.');try{return JSON.parse(text);}catch{throw new ApiError(400,'Solicitação inválida.');}}
export async function gateway(action:string,payload:unknown={},actor:ChatGPTUser|null=null){
 const c=config();if(!c.VERTICE_GATEWAY_TOKEN||!c.VERTICE_GATEWAY_URL)throw new ApiError(503,'O serviço está temporariamente indisponível.');
 let r:Response;try{r=await fetch(c.VERTICE_GATEWAY_URL,{method:'POST',headers:{'Content-Type':'application/json','x-vertice-token':c.VERTICE_GATEWAY_TOKEN},body:JSON.stringify({action,payload,actor:actor?{userId:actor.userId}:null}),signal:AbortSignal.timeout(20000)});}catch{throw new ApiError(503,'O serviço não respondeu. Tente novamente.');}
 let data:any;try{data=await r.json();}catch{throw new ApiError(502,'Resposta temporariamente indisponível.');}if(!r.ok)throw new ApiError(r.status,data.error||'Não foi possível concluir a operação.');return data;
}
export async function adminIdentity(){const user=await getChatGPTUser();if(!user)throw new ApiError(401,'Entre com sua conta para acessar a administração.');const state=await gateway('authState',{},user);return {user,...state};}
export async function requireAdmin(){const state=await adminIdentity();if(!state.is_admin)throw new ApiError(403,'Esta conta não está autorizada para administrar a Vértice.');return state.user as ChatGPTUser;}
export async function adminAction(request:Request){
 checkOrigin(request);const {action,payload={}}=await readJson(request);const state=await adminIdentity();
 if(action==='bootstrapAdmin'){
  if(config().VERTICE_PRIVATE_OWNER_SETUP!=='true'||state.initialized&&!state.is_admin)throw new ApiError(403,'A ativação administrativa está indisponível.');
  return gateway(action,{private_setup:true},state.user);
 }
 if(!state.is_admin||!authorizedAction(action,true)||['catalog','createLead'].includes(action))throw new ApiError(403,'Operação administrativa não permitida.');
 return gateway(action,payload,state.user);
}
export async function rateKey(request:Request){const user=await getChatGPTUser();const address=request.headers.get('cf-connecting-ip')||user?.userId||'anonymous';return digestToken(`${config().VERTICE_GATEWAY_TOKEN}|leads|${address}`);}
