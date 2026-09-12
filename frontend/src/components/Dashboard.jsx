import { useState, useEffect, useMemo } from 'react';
import { fetchAllPages } from '../api';
import FilterBar from './FilterBar';
import PropertyCard from './PropertyCard';
import './Dashboard.css';

const EMPTY_FILTERS = { locality: '', bedroom: '', minPrice: '', maxPrice: '', furnishing: '' };

export default function Dashboard({ token, userEmail, onLogout }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    setLoading(true);
    fetchAllPages('/v1/listings', token)
      .then(data => {
        // API returns inactive listings too — only keep active ones
        setListings(data.filter(l => l.is_live !== false));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Client-side filtering (API ignores filter params)
  const filtered = useMemo(() => {
    return listings.filter(l => {
      if (filters.locality && !l.locality?.toLowerCase().includes(filters.locality.toLowerCase())) return false;
      if (filters.bedroom && String(l.bedroom) !== String(filters.bedroom)) return false;
      if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
      if (filters.furnishing && l.furnishing !== filters.furnishing) return false;
      return true;
    });
  }, [listings, filters]);

  return (
    <div className="dashboard">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-inner container">
          <div className="navbar-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5"/>
              <path d="M16 6L26 14V26H20V20H12V26H6V14L16 6Z" fill="white"/>
            </svg>
            <span>Ivy Homes</span>
          </div>
          <div className="navbar-right">
            <span className="navbar-user">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              {userEmail}
            </span>
            <button className="btn btn-danger" id="logout-btn" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      {!loading && !error && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
          totalCount={listings.length}
        />
      )}

      {/* Content */}
      <main className="dashboard-main container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Fetching properties from Pune…</p>
            <p className="text-muted" style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>
              Fetching all pages (this may take a moment)
            </p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <h3>No properties found</h3>
                <p>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="property-grid">
                {filtered.map(listing => (
                  <PropertyCard key={listing.listing_id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
