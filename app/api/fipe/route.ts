import { handleFipeRequest } from '@/lib/server/fipe.mjs';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { checkOrigin, gateway } from '@/lib/server';
import { createFipeQuoteHandler } from '@/lib/domain/account.mjs';

export async function GET(request: Request) {
  return handleFipeRequest(request);
}

const saveQuote = createFipeQuoteHandler({ getUser: getChatGPTUser, gateway, checkOrigin, handleFipeRequest });

export async function POST(request: Request) { return saveQuote(request); }
