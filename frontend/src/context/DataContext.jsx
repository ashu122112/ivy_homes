import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAllPages } from '../api';

const DataContext = createContext(null);

export function DataProvider({ token, children }) {
  const [listings, setListings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      fetchAllPages('/v1/listings', token),
      fetchAllPages('/v1/rentals', token),
      fetchAllPages('/v1/projects', token),
    ])
      .then(([L, R, P]) => {
        if (cancelled) return;
        setListings(L);
        setRentals(R);
        setProjects(P);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({ listings, rentals, projects, loading, error }),
    [listings, rentals, projects, loading, error]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
