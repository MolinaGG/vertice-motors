import {gateway,failure} from '@/lib/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function GET(_request:Request,{params}:{params:Promise<{path:string[]}>}){try{const {path}=await params;const data=await gateway('photo',{path:path.join('/')},await getChatGPTUser());return Response.redirect(data.url,302);}catch(e){return failure(e);}}
