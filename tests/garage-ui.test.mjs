import test from 'node:test';
import assert from 'node:assert/strict';
import { createGarageStore, legacyFavoriteCandidates } from '../app/components/useGarageState.mjs';

const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const account = (userId = 'user-a', favoriteIds = []) => ({ authenticated: true, user: { userId, displayName: userId }, favoriteIds, favoriteVehicles: [], history: [] });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('favorites wait for confirmation and duplicate clicks share a per-vehicle lock', async () => {
  const pending = deferred(), writes = [];
  const store = createGarageStore(async (url, options) => {
    if (options.method !== 'POST') return response(account());
    writes.push(JSON.parse(options.body));
    return pending.promise;
  });
  await store.load();
  const write = store.toggleFavorite('car-one');
  assert.equal((await store.toggleFavorite('car-one')).pending, true);
  await tick();
  assert.equal(writes.length, 1);
  assert.deepEqual(store.getSnapshot().account.favoriteIds, []);
  assert.deepEqual(store.getSnapshot().pendingKeys, ['favorite:car-one']);
  pending.resolve(response({ error: 'Serviço indisponível' }, 503));
  assert.equal((await write).ok, false);
  assert.deepEqual(store.getSnapshot().account.favoriteIds, []);
  assert.equal(store.getSnapshot().mutationError, 'Serviço indisponível');
  assert.deepEqual(store.getSnapshot().pendingKeys, []);
});

test('a successful response that omits a newly unavailable vehicle does not claim it was saved', async () => {
  const initial = { ...account('user-a', ['previous']), favoriteVehicles: [{ id: 'previous' }] };
  const store = createGarageStore(async (url, options) => options.method === 'POST'
    ? response({ favoriteIds: [] })
    : response(initial));
  await store.load();
  const result = await store.toggleFavorite('newly-unavailable');
  assert.equal(result.ok, false);
  assert.match(result.error, /não está mais disponível/);
  assert.equal(store.getSnapshot().mutationError, result.error);
  assert.deepEqual(store.getSnapshot().account.favoriteIds, []);
  assert.deepEqual(store.getSnapshot().account.favoriteVehicles, []);
  assert.deepEqual(store.getSnapshot().pendingKeys, []);
});

test('favorite removal requires the confirmed server snapshot to exclude that vehicle', async () => {
  const store = createGarageStore(async (url, options) => options.method === 'POST'
    ? response({ favoriteIds: ['one'] })
    : response(account('user-a', ['one'])));
  await store.load();
  const result = await store.removeFavorite('one');
  assert.equal(result.ok, false);
  assert.match(result.error, /remoção.*não foi confirmada/);
  assert.deepEqual(store.getSnapshot().account.favoriteIds, ['one']);
});

test('distinct favorite writes are serialized so later snapshots preserve both changes', async () => {
  const first = deferred(), second = deferred(), writes = [];
  const store = createGarageStore(async (url, options) => {
    if (options.method !== 'POST') return response(account());
    writes.push(JSON.parse(options.body));
    return writes.length === 1 ? first.promise : second.promise;
  });
  await store.load();
  const one = store.toggleFavorite('one'), two = store.toggleFavorite('two');
  await tick();
  assert.equal(writes.length, 1);
  first.resolve(response({ favoriteIds: ['one'] }));
  await one;
  await tick();
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[1], { action: 'setFavorite', vehicle_id: 'two', favorite: true });
  second.resolve(response({ favoriteIds: ['one', 'two'] }));
  await two;
  assert.deepEqual(store.getSnapshot().account.favoriteIds, ['one', 'two']);
});

test('late account and mutation responses cannot restore a previous identity', async () => {
  const oldLoad = deferred(), oldWrite = deferred();
  let loads = 0;
  const store = createGarageStore(async (url, options) => {
    if (options.method === 'POST') return oldWrite.promise;
    loads += 1;
    return loads === 1 ? oldLoad.promise : response(account(loads === 2 ? 'user-b' : 'user-c'));
  });
  const first = store.load();
  await store.load();
  oldLoad.resolve(response(account('user-a', ['private-a'])));
  await first;
  assert.equal(store.getSnapshot().account.user.userId, 'user-b');
  assert.deepEqual(store.getSnapshot().account.favoriteIds, []);
  const write = store.toggleFavorite('private-b');
  await tick();
  await store.load();
  oldWrite.resolve(response({ favoriteIds: ['private-b'] }));
  assert.equal((await write).stale, true);
  assert.equal(store.getSnapshot().account.user.userId, 'user-c');
  assert.deepEqual(store.getSnapshot().account.favoriteIds, []);
});

test('expired identity removes private account data and exposes the native sign-in path', async () => {
  const store = createGarageStore(async (url, options) => options.method === 'POST'
    ? response({ authenticated: false, loginUrl: '/signin-with-chatgpt?return_to=%2Fminha-garagem' }, 401)
    : response(account('signed-in', ['one'])));
  await store.load();
  assert.equal((await store.toggleFavorite('one')).loginRequired, true);
  assert.equal(store.getSnapshot().phase, 'anonymous');
  assert.equal(store.getSnapshot().account, null);
});

test('history stays visible when deletion fails and changes only after confirmation', async () => {
  let shouldFail = true;
  const body = { ...account(), history: [{ id: 'one', result: { model: 'Original' } }, { id: 'two' }] };
  const store = createGarageStore(async (url, options) => options.method === 'POST'
    ? response(shouldFail ? { error: 'Não excluído' } : { ok: true }, shouldFail ? 503 : 200)
    : response(body));
  await store.load();
  await store.deleteHistory('one');
  assert.equal(store.getSnapshot().account.history.length, 2);
  shouldFail = false;
  await store.deleteHistory('one');
  assert.deepEqual(store.getSnapshot().account.history, [{ id: 'two' }]);
  await store.clearHistory();
  assert.deepEqual(store.getSnapshot().account.history, []);
});

test('explicit legacy import only includes unique available unsaved catalog vehicles', () => {
  const cars = [{ id: 'one', model: 'One' }, { id: 'two', model: 'Two' }, { id: 'three', model: 'Three' }];
  assert.deepEqual(legacyFavoriteCandidates('["one","one","two","missing",33]', cars, ['two']), [cars[0]]);
  assert.deepEqual(legacyFavoriteCandidates('malformed', cars), []);
  assert.deepEqual(legacyFavoriteCandidates('{"id":"one"}', cars), []);
});
