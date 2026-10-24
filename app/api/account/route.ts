import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { checkOrigin, gateway, readJson } from '@/lib/server';
import { createAccountHandlers } from '@/lib/domain/account.mjs';

const handlers = createAccountHandlers({
  getUser: getChatGPTUser,
  gateway,
  checkOrigin,
  readJson,
  loginUrl: chatGPTSignInPath('/minha-garagem'),
  logoutUrl: chatGPTSignOutPath('/'),
});

export async function GET() { return handlers.GET(); }
export async function POST(request: Request) { return handlers.POST(request); }
