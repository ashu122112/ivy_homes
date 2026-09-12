import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useFavourites } from '../context/FavouritesContext';
import PropertyCard from '../components/PropertyCard';
import './DetailPages.css';

export default function FavouritesPage() {
  const { listings, loading, error } = useData();
  const { ids, count } = useFavourites();

  const saved = useMemo(() => {
    const map = new Map(listings.map((l) => [l.listing_id, l]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [listings, ids]);

  const missing = count - saved.length;

  return (
    <main className="page-main container">
      <h1 className="page-title">Saved listings</h1>
      <p className="page-subtitle">
        Per-user favourites in localStorage — <code>/v1/favourites</code> returns 404.
      </p>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h3>Could not load listings</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="empty-state">
          <h3>No saved listings yet</h3>
          <p>
            Open a listing and hit Save, or use ★ on a card.{' '}
            <Link to="/">Browse listings</Link>
          </p>
        </div>
      )}

      {!loading && !error && count > 0 && (
        <>
          {missing > 0 && (
            <div className="warn-banner" style={{ marginBottom: '1rem' }}>
              {missing} saved id(s) are not in the current listings payload.
            </div>
          )}
          <div className="property-grid">
            {saved.map((listing) => (
              <PropertyCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
