import {gateway,reply,failure,checkOrigin,readJson,rateKey,ApiError} from '@/lib/server';
import {validateLead} from '@/lib/domain/validation.mjs';
export async function POST(request:Request){try{checkOrigin(request);const input=await readJson(request);let lead;try{lead=validateLead(input,new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}));}catch(e){throw new ApiError(400,(e as Error).message);}const result=await gateway('createLead',{...lead,request_id:input.request_id,rate_key:await rateKey(request)});return reply(result,201);}catch(e){return failure(e);}}
