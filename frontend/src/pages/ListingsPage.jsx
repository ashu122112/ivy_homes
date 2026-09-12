import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import FilterBar from '../components/FilterBar';
import PropertyCard from '../components/PropertyCard';
import { normalizeFurnishing } from '../utils';

const EMPTY_FILTERS = {
  locality: '',
  bedroom: '',
  minPrice: '',
  maxPrice: '',
  furnishing: '',
};

export default function ListingsPage() {
  const { listings, loading, error } = useData();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Show active listings by default; API wrongly includes inactive ones
  const active = useMemo(() => listings.filter((l) => l.is_live !== false), [listings]);

  const filtered = useMemo(() => {
    return active.filter((l) => {
      if (
        filters.locality &&
        !l.locality?.toLowerCase().includes(filters.locality.toLowerCase())
      ) {
        return false;
      }
      if (filters.bedroom && String(l.bedroom) !== String(filters.bedroom)) return false;
      if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
      if (
        filters.furnishing &&
        normalizeFurnishing(l.furnishing) !== normalizeFurnishing(filters.furnishing)
      ) {
        return false;
      }
      return true;
    });
  }, [active, filters]);

  return (
    <>
      {!loading && !error && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
          totalCount={active.length}
        />
      )}

      <main className="page-main container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Fetching all listings (offset pagination)…</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <h1 className="page-title">Sale listings</h1>
            <p className="page-subtitle">
              Client-side filters — server ignores price/furnishing params. Inactive rows hidden.
            </p>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <h3>No properties found</h3>
                <p>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="property-grid">
                {filtered.map((listing) => (
                  <PropertyCard key={listing.listing_id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
