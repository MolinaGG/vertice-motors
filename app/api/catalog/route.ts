import {gateway,reply,failure} from '@/lib/server';
export async function GET(){try{return reply(await gateway('catalog'));}catch(e){return failure(e);}}
