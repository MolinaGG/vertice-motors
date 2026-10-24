import { normalizeFipePayload, parseFipeQuery } from './fipe.mjs';

const accountActions = new Set(['accountState', 'setFavorite', 'importFavorites', 'deleteHistory', 'clearHistory', 'saveFipeHistory']);
const mutationActions = new Set(['setFavorite', 'importFavorites', 'deleteHistory', 'clearHistory']);
const vehicleId = /^[a-z0-9-]{3,80}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AccountError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function invalid() { throw new AccountError(400, 'Solicitação inválida.'); }
function fields(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) invalid();
  return value;
}

function requireActor(actor) {
  if (typeof actor?.userId !== 'string' || !actor.userId.trim() || actor.userId.length > 512 || /[\u0000-\u001f\u007f]/.test(actor.userId)) throw new AccountError(401, 'Entre com sua conta para acessar sua garagem.');
  return actor.userId;
}

function quoteQuery(value) {
  fields(value, ['brand', 'model', 'year']);
  if (!['brand', 'model', 'year'].every(key => typeof value[key] === 'string')) invalid();
  const query = { brand: value.brand, model: value.model, year: value.year };
  try { if (parseFipeQuery(new URLSearchParams(query)).stage !== 'price') invalid(); }
  catch { invalid(); }
  return query;
}

function accountPayload(action, payload) {
  if (action === 'setFavorite') {
    fields(payload, ['vehicle_id', 'favorite']);
    if (typeof payload.vehicle_id !== 'string' || !vehicleId.test(payload.vehicle_id) || typeof payload.favorite !== 'boolean') invalid();
    return { vehicle_id: payload.vehicle_id, favorite: payload.favorite };
  }
  if (action === 'importFavorites') {
    fields(payload, ['vehicle_ids']);
    if (!Array.isArray(payload.vehicle_ids) || payload.vehicle_ids.length > 50 || payload.vehicle_ids.some(id => typeof id !== 'string' || !vehicleId.test(id))) invalid();
    return { vehicle_ids: [...new Set(payload.vehicle_ids)] };
  }
  if (action === 'deleteHistory') {
    fields(payload, ['id']);
    if (typeof payload.id !== 'string' || !uuid.test(payload.id)) invalid();
    return { id: payload.id };
  }
  if (action === 'accountState' || action === 'clearHistory') { fields(payload, []); return {}; }
  if (action === 'saveFipeHistory') {
    fields(payload, ['query', 'result']);
    const query = quoteQuery(payload.query);
    let result;
    try { result = normalizeFipePayload('price', payload.result); } catch { invalid(); }
    return { query, result };
  }
  invalid();
}

function privateReply(body, status = 200, extraHeaders = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders } });
}

function failure(error) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599 ? error.status : 503;
  return privateReply({ error: status < 500 && typeof error?.message === 'string' ? error.message : 'Não foi possível concluir. Tente novamente.' }, status);
}

export function createAccountHandlers({ getUser, gateway, checkOrigin, readJson, loginUrl, logoutUrl }) {
  const anonymous = () => privateReply({ authenticated: false, loginUrl }, 401);
  return {
    async GET() {
      try {
        const user = await getUser();
        if (!user) return anonymous();
        requireActor(user);
        const state = await gateway('accountState', {}, user);
        return privateReply({ authenticated: true, user: { displayName: user.displayName, userId: user.userId }, favoriteIds: state.favoriteIds, favoriteVehicles: state.favoriteVehicles, history: state.history, loginUrl, logoutUrl });
      } catch (error) { return failure(error); }
    },
    async POST(request) {
      try {
        checkOrigin(request);
        const user = await getUser();
        if (!user) return anonymous();
        requireActor(user);
        const input = await readJson(request);
        if (!input || Array.isArray(input) || typeof input !== 'object' || !mutationActions.has(input.action)) invalid();
        const { action, ...rawPayload } = input;
        const payload = accountPayload(action, rawPayload);
        return privateReply(await gateway(action, payload, user));
      } catch (error) { return failure(error); }
    },
  };
}

export function createFipeQuoteHandler({ getUser, gateway, checkOrigin, handleFipeRequest }) {
  return async function POST(request) {
    try {
      checkOrigin(request);
      const url = new URL(request.url);
      if (request.body !== null) invalid();
      try { if (parseFipeQuery(url.searchParams).stage !== 'price') invalid(); } catch { invalid(); }
      const query = quoteQuery(Object.fromEntries(url.searchParams));
      url.search = new URLSearchParams(query).toString();
      // Reuse the existing validated provider handler and its per-isolate cache.
      const response = await handleFipeRequest(new Request(url, { method: 'GET' }));
      const body = await response.json();
      const extraHeaders = {};
      for (const key of ['retry-after', 'x-fipe-cache']) if (response.headers.has(key)) extraHeaders[key] = response.headers.get(key);
      if (!response.ok) return privateReply({ ...body, saved_to_history: false }, response.status, extraHeaders);
      let data;
      try { data = normalizeFipePayload('price', body.data); }
      catch { return privateReply({ error: { code: 'INVALID_UPSTREAM', message: 'O serviço de consulta retornou dados incompletos. Tente novamente mais tarde.' }, saved_to_history: false }, 502); }
      try {
        const user = await getUser();
        if (!user) return privateReply({ data, saved_to_history: false, login_required: true }, 200, extraHeaders);
        requireActor(user);
        await gateway('saveFipeHistory', { query, result: data }, user);
        return privateReply({ data, saved_to_history: true }, 200, extraHeaders);
      } catch {
        return privateReply({ data, saved_to_history: false, history_error: 'Não foi possível salvar esta consulta no histórico. Tente novamente mais tarde.' }, 200, extraHeaders);
      }
    } catch (error) { return failure(error); }
  };
}

export const isAccountAction = action => accountActions.has(action);

// Quoting plus URLSearchParams keeps opaque Sites ids inside one PostgREST value.
function ownerFilter(userId) {
  const value = /^[a-zA-Z0-9_-]+$/.test(userId) ? userId : `"${userId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return new URLSearchParams({ user_id: `eq.${value}` });
}

export async function handleAccountAction(action, rawPayload, actor, { rest }) {
  const userId = requireActor(actor);
  const payload = accountPayload(action, rawPayload);
  const owner = ownerFilter(userId);
  if (action === 'accountState') {
    const [favorites, history] = await Promise.all([
      rest(`vertice_user_favorites?${owner}&select=vehicle_id&order=created_at.desc`),
      rest(`vertice_fipe_history?${owner}&select=id,query_key,result,created_at&order=created_at.desc,id.desc&limit=50`),
    ]);
    const favoriteIds = favorites.map(row => row.vehicle_id).filter(id => typeof id === 'string' && vehicleId.test(id));
    const vehicles = favoriteIds.length ? await rest(`vertice_vehicles?id=in.(${favoriteIds.join(',')})&archived=eq.false&status=in.(available,reserved)&select=id,payload,status,archived`) : [];
    return {
      favoriteIds,
      favoriteVehicles: vehicles.filter(row => !row.archived && ['available', 'reserved'].includes(row.status)).map(row => ({ ...row.payload, id: row.id, status: row.status, archived: row.archived })),
      history: history.map(row => ({ id: row.id, query_key: row.query_key, result: normalizeFipePayload('price', row.result), created_at: row.created_at })),
    };
  }
  if (action === 'setFavorite' || action === 'importFavorites') {
    const rows = await rest('rpc/vertice_set_user_favorites', 'POST', { p_user_id: userId, p_vehicle_ids: action === 'setFavorite' ? [payload.vehicle_id] : payload.vehicle_ids, p_favorite: action === 'setFavorite' ? payload.favorite : true });
    return { favoriteIds: rows.map(row => row.vehicle_id) };
  }
  if (action === 'deleteHistory' || action === 'clearHistory') {
    if (action === 'deleteHistory') owner.set('id', `eq.${payload.id}`);
    await rest(`vertice_fipe_history?${owner}`, 'DELETE');
    return { ok: true };
  }
  if (action === 'saveFipeHistory') {
    await rest('rpc/vertice_save_fipe_history', 'POST', { p_user_id: userId, p_query_key: `${payload.query.brand}/${payload.query.model}/${payload.query.year}`, p_reference_month: payload.result.referenceMonth, p_result: payload.result });
    return { ok: true };
  }
  invalid();
}
