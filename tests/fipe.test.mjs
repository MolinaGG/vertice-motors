import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFipeQuery, normalizeFipePayload, filterFipeModels, changeFipeSelection, fipeResourceForKey } from '../lib/domain/fipe.mjs';
import { createFipeHandler } from '../lib/server/fipe.mjs';

const brands = [{ code: '21', name: 'Fiat' }];
const detail = { vehicleType: 1, price: 'R$ 35.470,00', brand: 'Fiat', model: 'Uno Mille 1.0', modelYear: 2013, fuel: 'Gasolina', codeFipe: '001161-4', referenceMonth: 'outubro de 2026', fuelAcronym: 'G' };
const request = query => new Request(`https://vertice.example/api/fipe${query ? `?${query}` : ''}`);
const json = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });

test('only the car hierarchy can become an upstream path', () => {
  assert.deepEqual(parseFipeQuery(new URLSearchParams()), { stage: 'brands', path: '/cars/brands' });
  assert.deepEqual(parseFipeQuery(new URLSearchParams('brand=21&model=4828&year=2013-1')), { stage: 'price', path: '/cars/brands/21/models/4828/years/2013-1' });
  assert.equal(parseFipeQuery(new URLSearchParams('brand=21&model=4828&year=32000-1')).stage, 'price');
  for (const query of ['url=https://evil.example', 'brand=../21', 'brand=0', 'brand=21&brand=22', 'model=12', 'brand=21&year=2020-1', 'brand=21&model=1&year=2020-1/other', 'brand=21&model=1&year=1890-1']) {
    assert.throws(() => parseFipeQuery(new URLSearchParams(query)), /consulta/i, query);
  }
});

test('provider data is normalized to verified choices and reference fields', () => {
  assert.deepEqual(normalizeFipePayload('brands', brands), brands);
  assert.deepEqual(normalizeFipePayload('years', [{ code: '32000-1', name: '32000 Gasolina' }]), [{ code: '32000-1', name: '0 km Gasolina' }]);
  assert.deepEqual(normalizeFipePayload('price', { ...detail, unexpected: 'discard' }), detail);
  assert.throws(() => normalizeFipePayload('brands', [{ code: 'https://evil.example', name: 'bad' }]), /resposta/i);
  assert.throws(() => normalizeFipePayload('price', { ...detail, price: 'unavailable' }), /resposta/i);
  assert.throws(() => normalizeFipePayload('price', { ...detail, referenceMonth: '' }), /resposta/i);
});

test('model filtering handles accents and all search terms', () => {
  const models = [{ code: '1', name: 'C4 Lounge 1.6 Automático' }, { code: '2', name: 'C4 Cactus 1.6 Manual' }];
  assert.deepEqual(filterFipeModels(models, 'automatico c4'), [models[0]]);
  assert.deepEqual(filterFipeModels(models, '  '), models);
  assert.deepEqual(filterFipeModels(models, 'sedan'), []);
});

test('selection changes immediately clear every dependent choice', () => {
  const selection = { brand: '21', model: '4828', year: '2013-1', filter: 'uno' };
  assert.deepEqual(changeFipeSelection(selection, 'brand', '22'), { brand: '22', model: '', year: '', filter: '' });
  assert.deepEqual(changeFipeSelection(selection, 'model', '4829'), { brand: '21', model: '4829', year: '', filter: 'uno' });
  assert.deepEqual(changeFipeSelection(selection, 'year', '2014-1'), { ...selection, year: '2014-1' });
});

test('a changed selection hides old results and ignores stale request state', () => {
  const old = { key: 'old-request', phase: 'success', data: detail, error: null };
  assert.deepEqual(fipeResourceForKey(old, 'new-request'), { phase: 'loading', data: null, error: null });
  assert.deepEqual(fipeResourceForKey(old, null), { phase: 'idle', data: null, error: null });
  assert.equal(fipeResourceForKey(old, 'old-request').data, detail);
});

test('proxy rejects malformed queries before contacting the provider', async () => {
  const handler = createFipeHandler({ fetchImpl: () => { throw new Error('must not fetch'); } });
  const response = await handler(request('brand=21&model=..'));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_QUERY');
});

test('proxy coalesces concurrent requests and serves normalized cached data', async () => {
  let release, calls = 0;
  const pending = new Promise(resolve => { release = resolve; });
  const handler = createFipeHandler({ fetchImpl: async url => {
    calls += 1;
    assert.equal(url, 'https://fipe.parallelum.com.br/api/v2/cars/brands');
    await pending;
    return json(brands);
  } });
  const first = handler(request()), second = handler(request());
  release();
  assert.deepEqual(await (await first).json(), { data: brands });
  assert.deepEqual(await (await second).json(), { data: brands });
  assert.equal((await handler(request())).headers.get('x-fipe-cache'), 'hit');
  assert.equal(calls, 1);
});

test('expired and evicted cache entries request fresh data', async () => {
  let time = 0, calls = 0;
  const handler = createFipeHandler({ now: () => time, ttlMs: 100, maxEntries: 1, fetchImpl: async url => {
    calls += 1;
    return json([{ code: '21', name: `${url.endsWith('/models') ? 'Modelo' : 'Marca'} ${calls}` }]);
  } });
  assert.equal((await (await handler(request())).json()).data[0].name, 'Marca 1');
  time = 101;
  assert.equal((await (await handler(request())).json()).data[0].name, 'Marca 2');
  await handler(request('brand=21'));
  assert.equal((await (await handler(request())).json()).data[0].name, 'Marca 4');
});

test('provider rate limits have a retry hint and a shared cooldown', async () => {
  let calls = 0;
  const handler = createFipeHandler({ fetchImpl: async () => { calls += 1; return new Response('', { status: 429, headers: { 'retry-after': '90' } }); } });
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '90');
  assert.equal((await response.json()).error.code, 'RATE_LIMITED');
  assert.equal((await handler(request('brand=21'))).status, 429);
  assert.equal(calls, 1);
});

test('provider failures never become invented prices and are not cached', async () => {
  let count = 0;
  const handler = createFipeHandler({ fetchImpl: async () => count++ === 0 ? json({ ...detail, price: null }) : json(detail) });
  const query = 'brand=21&model=4828&year=2013-1';
  const failed = await handler(request(query));
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).error.code, 'INVALID_UPSTREAM');
  assert.deepEqual(await (await handler(request(query))).json(), { data: detail });
});

test('provider missing, server and network errors return controlled responses', async () => {
  for (const [upstream, expectedStatus, expectedCode] of [[404,404,'NOT_FOUND'],[500,503,'UNAVAILABLE']]) {
    const handler = createFipeHandler({ fetchImpl: async () => new Response('private upstream detail', { status: upstream }) });
    const response = await handler(request());
    assert.equal(response.status, expectedStatus);
    const body = await response.json();
    assert.equal(body.error.code, expectedCode);
    assert.equal(JSON.stringify(body).includes('private upstream detail'), false);
  }
  const handler = createFipeHandler({ fetchImpl: async () => { throw new Error('connection secret'); } });
  assert.equal((await handler(request())).status, 503);
});

test('slow provider requests are aborted within the configured timeout', async () => {
  const handler = createFipeHandler({ timeoutMs: 10, fetchImpl: (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }) });
  const response = await handler(request());
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.code, 'TIMEOUT');
});
