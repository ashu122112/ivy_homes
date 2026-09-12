import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FavouritesContext = createContext(null);

function storageKey(email) {
  return `ivy_favourites_${email || 'anon'}`;
}

export function FavouritesProvider({ userEmail, children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(userEmail)) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(storageKey(userEmail)) || '[]'));
    } catch {
      setIds([]);
    }
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem(storageKey(userEmail), JSON.stringify(ids));
  }, [ids, userEmail]);

  const toggle = useCallback((listingId) => {
    setIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  }, []);

  const remove = useCallback((listingId) => {
    setIds((prev) => prev.filter((id) => id !== listingId));
  }, []);

  const isFavourite = useCallback((listingId) => ids.includes(listingId), [ids]);

  const value = useMemo(
    () => ({ ids, toggle, remove, isFavourite, count: ids.length }),
    [ids, toggle, remove, isFavourite]
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
}
