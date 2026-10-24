import { handleFipeRequest } from '@/lib/server/fipe.mjs';

export async function GET(request: Request) {
  return handleFipeRequest(request);
}
