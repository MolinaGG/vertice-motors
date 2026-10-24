const LOGIN_URL = '/signin-with-chatgpt?return_to=%2Fminha-garagem';

const errorMessage = (body, fallback) => typeof body?.error === 'string'
  ? body.error : body?.error?.message || fallback;
const stringIds = value => Array.isArray(value) && value.every(id => typeof id === 'string');

// Account data lives only in this page instance. It is never cached between users.
export function createGarageStore(fetcher = (...args) => fetch(...args)) {
  let state = { phase: 'loading', account: null, error: null, mutationError: null, pendingKeys: [], loginUrl: LOGIN_URL };
  let generation = 0;
  let queue = Promise.resolve();
  const listeners = new Set(), controllers = new Set(), pending = new Set();
  const publish = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  const invalidate = () => {
    generation += 1;
    controllers.forEach(controller => controller.abort());
    controllers.clear();
    pending.clear();
    queue = Promise.resolve();
  };

  async function load() {
    invalidate();
    const current = generation, controller = new AbortController();
    controllers.add(controller);
    publish({ phase: 'loading', account: null, error: null, mutationError: null, pendingKeys: [] });
    try {
      const response = await fetcher('/api/account', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      const body = await response.json();
      if (current !== generation) return;
      if (response.status === 401) {
        publish({ phase: 'anonymous', account: null, loginUrl: body.loginUrl || LOGIN_URL });
        return;
      }
      if (!response.ok) throw new Error(errorMessage(body, 'Sua garagem está indisponível. Tente novamente.'));
      if (!body.authenticated || typeof body.user?.userId !== 'string' || !stringIds(body.favoriteIds) || !Array.isArray(body.favoriteVehicles) || !Array.isArray(body.history)) {
        throw new Error('Não foi possível carregar os dados da sua garagem.');
      }
      publish({ phase: 'success', account: body, loginUrl: body.loginUrl || LOGIN_URL });
    } catch (error) {
      if (current === generation && error.name !== 'AbortError') publish({ phase: 'error', account: null, error: error.message });
    } finally { controllers.delete(controller); }
  }

  function mutate(key, actionForAccount, apply, confirm) {
    if (state.phase === 'anonymous') return Promise.resolve({ ok: false, loginRequired: true });
    if (state.phase !== 'success') return Promise.resolve({ ok: false, error: 'Aguarde sua garagem carregar ou tente novamente.' });
    if (pending.has(key)) return Promise.resolve({ ok: false, pending: true });
    const current = generation, userId = state.account.user.userId;
    pending.add(key);
    publish({ pendingKeys: [...pending], mutationError: null });
    const stillCurrent = () => current === generation && state.phase === 'success' && state.account?.user.userId === userId;
    const operation = queue.then(async () => {
      if (!stillCurrent()) {
        if (current === generation) { pending.delete(key); publish({ pendingKeys: [...pending] }); }
        return { ok: false, stale: true };
      }
      const controller = new AbortController();
      controllers.add(controller);
      try {
        const action = actionForAccount(state.account);
        const response = await fetcher('/api/account', {
          method: 'POST', cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action),
        });
        const body = await response.json();
        if (!stillCurrent()) return { ok: false, stale: true };
        if (response.status === 401) {
          publish({ phase: 'anonymous', account: null, loginUrl: body.loginUrl || LOGIN_URL });
          return { ok: false, loginRequired: true };
        }
        if (!response.ok) throw new Error(errorMessage(body, 'A alteração não foi salva. Tente novamente.'));
        const nextAccount = apply(state.account, body);
        publish({ account: nextAccount });
        confirm?.(nextAccount, action);
        return { ok: true };
      } catch (error) {
        if (!stillCurrent() || error.name === 'AbortError') return { ok: false, stale: true };
        publish({ mutationError: error.message });
        return { ok: false, error: error.message };
      } finally {
        controllers.delete(controller);
        if (current === generation) { pending.delete(key); publish({ pendingKeys: [...pending] }); }
      }
    });
    // Serialize server snapshots so two distinct favorite responses cannot overwrite each other.
    queue = operation.catch(() => {});
    return operation;
  }

  const applyFavorites = (account, body) => {
    if (!stringIds(body.favoriteIds)) throw new Error('Não foi possível confirmar seus favoritos. Tente novamente.');
    return { ...account, favoriteIds: body.favoriteIds, favoriteVehicles: account.favoriteVehicles.filter(vehicle => body.favoriteIds.includes(vehicle.id)) };
  };
  const confirmFavorites = (account, action) => {
    if (action.action === 'setFavorite' && account.favoriteIds.includes(action.vehicle_id) !== action.favorite) {
      throw new Error(action.favorite ? 'Este veículo não está mais disponível para favoritar.' : 'A remoção deste favorito não foi confirmada. Tente novamente.');
    }
  };

  return {
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    load,
    invalidate,
    toggleFavorite: id => mutate(`favorite:${id}`, account => ({ action: 'setFavorite', vehicle_id: id, favorite: !account.favoriteIds.includes(id) }), applyFavorites, confirmFavorites),
    removeFavorite: id => mutate(`favorite:${id}`, () => ({ action: 'setFavorite', vehicle_id: id, favorite: false }), applyFavorites, confirmFavorites),
    importFavorites: ids => mutate('import', () => ({ action: 'importFavorites', vehicle_ids: ids.slice(0, 50) }), applyFavorites),
    deleteHistory: id => mutate(`history:${id}`, () => ({ action: 'deleteHistory', id }), (account, body) => {
      if (body.ok !== true) throw new Error('Não foi possível confirmar a exclusão.');
      return { ...account, history: account.history.filter(item => item.id !== id) };
    }),
    clearHistory: () => mutate('history:clear', () => ({ action: 'clearHistory' }), (account, body) => {
      if (body.ok !== true) throw new Error('Não foi possível confirmar a exclusão.');
      return { ...account, history: [] };
    }),
  };
}

export function legacyFavoriteCandidates(raw, vehicles, favoriteIds = []) {
  let ids;
  try { ids = JSON.parse(raw || '[]'); } catch { return []; }
  if (!Array.isArray(ids)) return [];
  const selected = new Set(ids.filter(id => typeof id === 'string'));
  return vehicles.filter(vehicle => selected.has(vehicle.id) && !favoriteIds.includes(vehicle.id)).slice(0, 50);
}
