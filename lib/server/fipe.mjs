import { normalizeFipePayload, parseFipeQuery } from '../domain/fipe.mjs';

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';
const messages = {
  INVALID_QUERY: 'Confira a marca, o modelo e o ano da consulta.',
  INVALID_UPSTREAM: 'O serviço de consulta retornou dados incompletos. Tente novamente mais tarde.',
  RATE_LIMITED: 'O serviço atingiu seu limite de consultas gratuitas. Aguarde antes de tentar novamente.',
  NOT_FOUND: 'Não encontramos uma referência para esta seleção. Confira o modelo e o ano.',
  UNAVAILABLE: 'O serviço de consulta está indisponível no momento. Tente novamente mais tarde.',
  TIMEOUT: 'O serviço demorou para responder. Tente novamente.',
};

function failure(code, status, retryAfter) {
  return { status, body: { error: { code, message: messages[code], ...(retryAfter ? { retryAfter } : {}) } }, retryAfter };
}

function response(result, cache = 'miss') {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': result.status === 200 ? 'public, max-age=300, s-maxage=3600' : 'no-store',
      'x-content-type-options': 'nosniff',
      'x-fipe-cache': cache,
      ...(result.retryAfter ? { 'retry-after': String(result.retryAfter) } : {}),
    },
  });
}

// This bounded, per-isolate cache avoids repeated provider calls without storing user data.
export function createFipeHandler({ fetchImpl = fetch, now = Date.now, ttlMs = 6 * 60 * 60 * 1000, maxEntries = 200, maxInflight = 24, timeoutMs = 9000 } = {}) {
  const cache = new Map(), inflight = new Map();
  let retryAt = 0;

  async function load(query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const upstream = await fetchImpl(BASE_URL + query.path, { headers: { accept: 'application/json' }, signal: controller.signal, redirect: 'error' });
      if (upstream.status === 429) {
        const hint = upstream.headers.get('retry-after');
        const seconds = /^\d+$/.test(hint || '') ? Number(hint) : Math.ceil((Date.parse(hint || '') - now()) / 1000);
        const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.min(86400, Math.max(30, seconds)) : 300;
        retryAt = now() + retryAfter * 1000;
        return failure('RATE_LIMITED', 429, retryAfter);
      }
      if (upstream.status === 404) return failure('NOT_FOUND', 404);
      if (!upstream.ok) return failure('UNAVAILABLE', 503);
      let data;
      try {
        const body = await upstream.text();
        if (body.length > 1024 * 1024) return failure('INVALID_UPSTREAM', 502);
        data = normalizeFipePayload(query.stage, JSON.parse(body));
      } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') return failure('TIMEOUT', 504);
        return failure('INVALID_UPSTREAM', 502);
      }
      const result = { status: 200, body: { data } };
      // Expiry also stops at the month boundary, when the current reference can change.
      const current = now(), date = new Date(current);
      const nextMonth = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
      cache.set(query.path, { result, expires: Math.min(current + ttlMs, nextMonth) });
      while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
      return result;
    } catch (error) {
      return controller.signal.aborted || error?.name === 'AbortError' ? failure('TIMEOUT', 504) : failure('UNAVAILABLE', 503);
    } finally {
      clearTimeout(timer);
    }
  }

  return async function handleFipe(request) {
    let query;
    try { query = parseFipeQuery(new URL(request.url).searchParams); }
    catch { return response(failure('INVALID_QUERY', 400)); }
    const entry = cache.get(query.path);
    if (entry && entry.expires > now()) {
      cache.delete(query.path); cache.set(query.path, entry);
      return response(entry.result, 'hit');
    }
    if (entry) cache.delete(query.path);
    if (retryAt > now()) return response(failure('RATE_LIMITED', 429, Math.ceil((retryAt - now()) / 1000)));
    let pending = inflight.get(query.path);
    const shared = Boolean(pending);
    if (!pending) {
      if (inflight.size >= maxInflight) return response(failure('UNAVAILABLE', 503));
      pending = load(query).finally(() => inflight.delete(query.path));
      inflight.set(query.path, pending);
    }
    return response(await pending, shared ? 'coalesced' : 'miss');
  };
}

export const handleFipeRequest = createFipeHandler();
