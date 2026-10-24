import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountHandlers, createFipeQuoteHandler, handleAccountAction, isAccountAction } from '../lib/domain/account.mjs';
import { createFipeHandler } from '../lib/server/fipe.mjs';
import { validOrigin } from '../lib/domain/access.mjs';

const alice = { userId: 'site-user-alice', displayName: 'Alice', email: 'private@example.com' };
const bob = { userId: 'site-user-bob', displayName: 'Bob' };
const quote = { vehicleType: 1, price: 'R$ 29.800,00', brand: 'FIAT', model: 'Uno 1.0', modelYear: 2013, fuel: 'Gasolina', codeFipe: '001267-0', referenceMonth: 'outubro de 2026', fuelAcronym: 'G' };
const query = { brand: '21', model: '4828', year: '2013-1' };
const historyId = '00000000-0000-4000-8000-000000000001';
const otherHistoryId = '00000000-0000-4000-8000-000000000002';
const request = (body, origin = 'https://vertice.example') => new Request('https://vertice.example/api/account', { method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
const fipeRequest = (values = query, origin = 'https://vertice.example') => new Request(`https://vertice.example/api/fipe?${new URLSearchParams(values)}`, { method: 'POST', headers: origin ? { origin } : {} });
const checkOrigin = req => { if (!validOrigin(req.headers.get('origin'), req.url)) throw Object.assign(new Error('Origem inválida.'), { status: 403 }); };
const dependencies = (extra = {}) => ({ getUser: async () => alice, gateway: async () => ({}), checkOrigin, readJson: req => req.json(), loginUrl: '/signin-with-chatgpt?return_to=%2Fgaragem', logoutUrl: '/signout-with-chatgpt?return_to=%2F', ...extra });

test('account reads require a Sites identity and never return public cache headers', async () => {
  const handlers = createAccountHandlers(dependencies({ getUser: async () => null, gateway: () => { throw new Error('must not call'); } }));
  const response = await handlers.GET();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { authenticated: false, loginUrl: '/signin-with-chatgpt?return_to=%2Fgaragem' });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('account response exposes the current identity with private owner-bound state only', async () => {
  const calls = [];
  const handlers = createAccountHandlers(dependencies({ gateway: async (...args) => { calls.push(args); return { favoriteIds: ['uno-2013'], favoriteVehicles: [], history: [] }; } }));
  const response = await handlers.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: true, user: { displayName: 'Alice', userId: 'site-user-alice' }, favoriteIds: ['uno-2013'], favoriteVehicles: [], history: [], loginUrl: '/signin-with-chatgpt?return_to=%2Fgaragem', logoutUrl: '/signout-with-chatgpt?return_to=%2F' });
  assert.equal(calls[0][0], 'accountState');
  assert.equal(calls[0][2], alice);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('anonymous or cross-origin account mutations cannot reach persistence', async () => {
  let calls = 0;
  for (const [getUser, origin, expected] of [[async () => null, 'https://vertice.example', 401], [async () => alice, 'https://evil.example', 403], [async () => alice, null, 403]]) {
    const handlers = createAccountHandlers(dependencies({ getUser, gateway: async () => { calls++; } }));
    assert.equal((await handlers.POST(request({ action: 'clearHistory' }, origin))).status, expected);
  }
  assert.equal(calls, 0);
});

test('account mutations whitelist action fields and reject foreign ownership or admin operations', async () => {
  let calls = 0;
  const handlers = createAccountHandlers(dependencies({ gateway: async () => { calls++; return {}; } }));
  for (const body of [null, [], { action: 'saveSettings' }, { action: 'saveFipeHistory', result: quote }, { action: 'setFavorite', vehicle_id: 123, favorite: true }, { action: 'setFavorite', vehicle_id: 'uno-2013', favorite: 'true' }, { action: 'setFavorite', vehicle_id: 'uno-2013', favorite: true, user_id: bob.userId }, { action: 'importFavorites', vehicle_ids: Array(51).fill('uno-2013') }, { action: 'deleteHistory', id: 'bad-id' }, { action: 'clearHistory', payload: { user_id: bob.userId } }]) {
    assert.equal((await handlers.POST(request(body))).status, 400);
  }
  assert.equal(calls, 0);
});

test('all supported mutations use the authenticated actor and a normalized payload', async () => {
  const calls = [];
  const handlers = createAccountHandlers(dependencies({ gateway: async (...args) => { calls.push(args); return { ok: true }; } }));
  for (const body of [{ action: 'setFavorite', vehicle_id: 'uno-2013', favorite: false }, { action: 'importFavorites', vehicle_ids: ['uno-2013', 'uno-2013'] }, { action: 'deleteHistory', id: historyId }, { action: 'clearHistory' }]) {
    assert.equal((await handlers.POST(request(body))).status, 200);
  }
  assert.deepEqual(calls.map(call => call[0]), ['setFavorite', 'importFavorites', 'deleteHistory', 'clearHistory']);
  assert.deepEqual(calls[1][1], { vehicle_ids: ['uno-2013'] });
  assert.ok(calls.every(call => call[2] === alice));
});

// This double models only the external REST boundary. Account authorization and
// request construction are the real production functions under test.
function database() {
  const favorites = [{ user_id: alice.userId, vehicle_id: 'uno-2013' }, { user_id: alice.userId, vehicle_id: 'archived-car' }, { user_id: bob.userId, vehicle_id: 'bob-car' }];
  const history = [{ id: historyId, user_id: alice.userId, query_key: '21/4828/2013-1', result: quote, created_at: '2026-10-24T12:00:00Z' }, { id: otherHistoryId, user_id: bob.userId, query_key: '1/1/2014-1', result: { ...quote, model: 'Private Bob' }, created_at: '2026-10-24T11:00:00Z' }];
  const vehicles = [{ id: 'uno-2013', payload: { model: 'Uno' }, archived: false, status: 'available' }, { id: 'archived-car', payload: { model: 'Private archived' }, archived: true, status: 'available' }, { id: 'sold-car', payload: { model: 'Sold' }, archived: false, status: 'sold' }, { id: 'bob-car', payload: { model: 'Bob car' }, archived: false, status: 'reserved' }];
  const calls = [];
  const rest = async (path, method = 'GET', body) => {
    calls.push({ path, method, body });
    const url = new URL(path, 'https://database.example/'), owner = url.searchParams.get('user_id')?.slice(3);
    if (url.pathname === '/rpc/vertice_set_user_favorites') {
      const eligible = vehicles.filter(v => !v.archived && ['available', 'reserved'].includes(v.status)).map(v => v.id);
      if (body.p_favorite) for (const id of body.p_vehicle_ids) { if (eligible.includes(id) && !favorites.some(f => f.user_id === body.p_user_id && f.vehicle_id === id)) favorites.push({ user_id: body.p_user_id, vehicle_id: id }); }
      else for (let i = favorites.length - 1; i >= 0; i--) if (favorites[i].user_id === body.p_user_id && body.p_vehicle_ids.includes(favorites[i].vehicle_id)) favorites.splice(i, 1);
      return favorites.filter(f => f.user_id === body.p_user_id).map(f => ({ vehicle_id: f.vehicle_id }));
    }
    if (url.pathname === '/rpc/vertice_save_fipe_history') return historyId;
    if (url.pathname === '/vertice_user_favorites') return favorites.filter(f => f.user_id === owner);
    if (url.pathname === '/vertice_fipe_history') {
      const id = url.searchParams.get('id')?.slice(3);
      if (method === 'DELETE') { for (let i = history.length - 1; i >= 0; i--) if (history[i].user_id === owner && (!id || history[i].id === id)) history.splice(i, 1); return []; }
      return history.filter(h => h.user_id === owner);
    }
    if (url.pathname === '/vertice_vehicles') {
      const ids = url.searchParams.get('id')?.slice(4, -1).split(',') || [];
      return vehicles.filter(v => ids.includes(v.id) && !v.archived && ['available', 'reserved'].includes(v.status));
    }
    throw new Error(`Unexpected external operation ${path}`);
  };
  return { rest, favorites, history, calls };
}

test('Edge account state isolates two users and suppresses archived favorite vehicle payloads', async () => {
  const db = database();
  const a = await handleAccountAction('accountState', {}, alice, db);
  const b = await handleAccountAction('accountState', {}, bob, db);
  assert.deepEqual(a.favoriteIds, ['uno-2013', 'archived-car']);
  assert.deepEqual(a.favoriteVehicles.map(v => v.id), ['uno-2013']);
  assert.deepEqual(a.history.map(h => h.id), [historyId]);
  assert.deepEqual(b.favoriteIds, ['bob-car']);
  assert.deepEqual(b.history.map(h => h.id), [otherHistoryId]);
  assert.equal(JSON.stringify(a).includes('site-user-bob'), false);
  assert.equal(JSON.stringify(a).includes('user_id'), false);
  assert.equal(JSON.stringify(a).includes('Private archived'), false);
});

test('Edge denies account access without a trusted identity and rejects payload ownership fields', async () => {
  const db = database();
  for (const actor of [null, {}, { userId: '' }, { userId: 10 }, { userId: 'bad\nidentity' }]) await assert.rejects(handleAccountAction('accountState', {}, actor, db), error => error.status === 401);
  await assert.rejects(handleAccountAction('clearHistory', { user_id: bob.userId }, alice, db), error => error.status === 400);
  assert.equal(db.calls.length, 0);
  assert.equal(isAccountAction('saveSettings'), false);
  assert.equal(isAccountAction('saveFipeHistory'), true);
});

test('Edge favorite import only retains public eligible vehicles and never mutates another owner', async () => {
  const db = database();
  const imported = await handleAccountAction('importFavorites', { vehicle_ids: ['bob-car', 'sold-car', 'archived-car', 'missing-car'] }, alice, db);
  assert.deepEqual(imported.favoriteIds, ['uno-2013', 'archived-car', 'bob-car']);
  await handleAccountAction('setFavorite', { vehicle_id: 'archived-car', favorite: false }, alice, db);
  await handleAccountAction('setFavorite', { vehicle_id: 'bob-car', favorite: false }, alice, db);
  assert.deepEqual(db.favorites.filter(f => f.user_id === bob.userId).map(f => f.vehicle_id), ['bob-car']);
  assert.equal(db.favorites.some(f => f.user_id === alice.userId && f.vehicle_id === 'archived-car'), false);
});

test('history delete and clear include the actor owner even when given another user row id', async () => {
  const db = database();
  await handleAccountAction('deleteHistory', { id: otherHistoryId }, alice, db);
  assert.equal(db.history.length, 2);
  await handleAccountAction('clearHistory', {}, alice, db);
  assert.deepEqual(db.history.map(h => h.id), [otherHistoryId]);
});

test('opaque Sites owner ids are escaped as a single PostgREST filter value', async () => {
  const calls = [];
  await handleAccountAction('clearHistory', {}, { userId: 'site&user_id=eq.other,odd' }, { rest: async path => { calls.push(path); return []; } });
  const url = new URL(calls[0], 'https://database.example');
  assert.deepEqual(url.searchParams.getAll('user_id'), ['eq."site&user_id=eq.other,odd"']);
});

test('history saving normalizes the quote and sends only the current actor to the atomic RPC', async () => {
  const db = database();
  await handleAccountAction('saveFipeHistory', { query, result: { ...quote, user_id: bob.userId, arbitrary: 'secret' } }, alice, db);
  assert.deepEqual(db.calls[0].body, { p_user_id: alice.userId, p_query_key: '21/4828/2013-1', p_reference_month: 'outubro de 2026', p_result: quote });
  for (const invalid of [{ query, result: { ...quote, price: null } }, { query: { brand: '21' }, result: quote }, { query, result: quote, user_id: bob.userId }]) await assert.rejects(handleAccountAction('saveFipeHistory', invalid, alice, db), error => error.status === 400);
  assert.equal(db.calls.length, 1);
});

test('FIPE POST rejects non-price or forged queries before any provider or history operation', async () => {
  let calls = 0;
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: async () => { calls++; }, gateway: async () => { calls++; } }));
  for (const body of [{ brand: '21' }, { ...query, user_id: bob.userId }, { ...query, result: quote }, { ...query, year: '../private' }]) assert.equal((await handler(fipeRequest(body))).status, 400);
  assert.equal(calls, 0);
});

test('FIPE POST saves only a validated quote and awaits history persistence with the authenticated actor', async () => {
  let completed = false;
  const upstream = createFipeHandler({ fetchImpl: async () => Response.json({ ...quote, secret: 'must be discarded' }) });
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: upstream, gateway: async (action, payload, actor) => {
    assert.equal(action, 'saveFipeHistory'); assert.deepEqual(payload, { query, result: quote }); assert.equal(actor, alice);
    await new Promise(resolve => setImmediate(resolve)); completed = true; return { ok: true };
  } }));
  const response = await handler(fipeRequest(query));
  assert.equal(completed, true);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: quote, saved_to_history: true });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('FIPE POST preserves the real price when history storage fails without exposing service details', async () => {
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: createFipeHandler({ fetchImpl: async () => Response.json(quote) }), gateway: async () => { throw new Error('private Supabase credentials'); } }));
  const response = await handler(fipeRequest(query));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, quote);
  assert.equal(body.saved_to_history, false);
  assert.equal(typeof body.history_error, 'string');
  assert.equal(JSON.stringify(body).includes('credentials'), false);
});

test('anonymous FIPE POST can consult a real price but cannot save history', async () => {
  const handler = createFipeQuoteHandler(dependencies({ getUser: async () => null, handleFipeRequest: createFipeHandler({ fetchImpl: async () => Response.json(quote) }), gateway: async () => { throw new Error('must not persist'); } }));
  const response = await handler(fipeRequest(query));
  assert.deepEqual(await response.json(), { data: quote, saved_to_history: false, login_required: true });
});

test('rate limits and malformed FIPE responses never create history entries', async () => {
  let saves = 0;
  for (const response of [new Response('', { status: 429, headers: { 'retry-after': '90' } }), Response.json({ ...quote, price: null })]) {
    const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: createFipeHandler({ fetchImpl: async () => response }), gateway: async () => { saves++; } }));
    const result = await handler(fipeRequest(query));
    assert.ok([429, 502].includes(result.status));
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    if (result.status === 429) assert.equal(result.headers.get('retry-after'), '90');
    assert.equal((await result.json()).saved_to_history, false);
  }
  assert.equal(saves, 0);
});

test('FIPE POST rejects cross-origin requests without consuming the provider quota', async () => {
  let calls = 0;
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: async () => { calls++; } }));
  assert.equal((await handler(fipeRequest(query, 'https://evil.example'))).status, 403);
  assert.equal(calls, 0);
});

test('FIPE POST accepts the existing query URL without a body and rejects ambiguous query plus body', async () => {
  let saves = 0;
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: createFipeHandler({ fetchImpl: async () => Response.json(quote) }), gateway: async () => { saves++; return { ok: true }; } }));
  const url = 'https://vertice.example/api/fipe?brand=21&model=4828&year=2013-1';
  const response = await handler(new Request(url, { method: 'POST', headers: { origin: 'https://vertice.example' } }));
  assert.deepEqual(await response.json(), { data: quote, saved_to_history: true });
  assert.equal(saves, 1);
  assert.equal((await handler(new Request(url, { method: 'POST', headers: { origin: 'https://vertice.example' }, body: JSON.stringify(query) }))).status, 400);
  assert.equal(saves, 1);
});

test('FIPE POST requires canonical query parameters instead of a posted result or JSON body', async () => {
  let calls = 0;
  const handler = createFipeQuoteHandler(dependencies({ handleFipeRequest: async () => { calls++; return Response.json({ data: quote }); }, gateway: async () => { calls++; } }));
  assert.equal((await handler(request(query))).status, 400);
  assert.equal(calls, 0);
});
