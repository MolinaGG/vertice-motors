'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createGarageStore } from './useGarageState.mjs';

export default function useGarage() {
  const [store] = useState(() => createGarageStore());
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    store.load();
    const refresh = () => { if (document.visibilityState === 'visible') store.load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      store.invalidate();
    };
  }, [store]);

  return {
    ...snapshot,
    favoriteIds: snapshot.account?.favoriteIds || [],
    favoritePending: id => snapshot.phase === 'loading' || snapshot.pendingKeys.includes(`favorite:${id}`) || snapshot.pendingKeys.includes('import'),
    retry: store.load,
    toggleFavorite: store.toggleFavorite,
    removeFavorite: store.removeFavorite,
    importFavorites: store.importFavorites,
    deleteHistory: store.deleteHistory,
    clearHistory: store.clearHistory,
  };
}
