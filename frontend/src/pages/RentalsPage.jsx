import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { formatINR, titleCase } from '../utils';
import '../components/FilterBar.css';
import '../components/PropertyCard.css';

export default function RentalsPage() {
  const { rentals, loading, error } = useData();
  const [locality, setLocality] = useState('');
  const [bedroom, setBedroom] = useState('');

  const filtered = useMemo(() => {
    return rentals.filter((r) => {
      if (locality && !r.locality?.toLowerCase().includes(locality.toLowerCase())) return false;
      if (bedroom && String(r.bedroom) !== String(bedroom)) return false;
      return true;
    });
  }, [rentals, locality, bedroom]);

  return (
    <main className="page-main container">
      <h1 className="page-title">Rentals</h1>
      <p className="page-subtitle">
        Monthly rent shown in INR. {rentals.length} records loaded via offset pagination.
      </p>

      <div className="filter-bar" style={{ position: 'static', marginBottom: '1rem' }}>
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Locality</label>
            <input
              className="form-control filter-input"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Magarpatta"
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">BHK</label>
            <select
              className="form-control filter-select"
              value={bedroom}
              onChange={(e) => setBedroom(e.target.value)}
            >
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} BHK
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-results-count">
          Showing <strong>{filtered.length}</strong> rentals · Magarpatta sum is computed on Insights
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading rentals…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h3>Failed</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="property-grid">
          {filtered.map((rental) => (
            <article key={rental.listing_id} className="property-card fade-in">
              <div className="card-header">
                <div className="card-header-left">
                  <h3 className="card-title">
                    {rental.title || rental.apartment_name || 'Rental'}
                  </h3>
                  <p className="card-location">{titleCase(rental.locality)}</p>
                </div>
                <div className="card-price">{formatINR(rental.price)}/mo</div>
              </div>
              <div className="card-badges">
                <span className="badge badge-primary">{rental.bedroom} BHK</span>
                <span className="badge badge-secondary">{titleCase(rental.property_type)}</span>
                <span className="badge badge-gray">{titleCase(rental.furnishing)}</span>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Deposit</span>
                  <span className="stat-value">{formatINR(rental.deposit)}</span>
                </div>
                <div className="stat-divider" />
                <div className="stat">
                  <span className="stat-label">Carpet</span>
                  <span className="stat-value">{rental.carpet_area} sq.ft</span>
                </div>
                <div className="stat-divider" />
                <div className="stat">
                  <span className="stat-label">Maint.</span>
                  <span className="stat-value">{formatINR(rental.maintenance)}</span>
                </div>
              </div>
              <div className="card-footer">
                <span className="listing-id">#{rental.listing_id}</span>
                <span className="posted-by">{rental.posted_by_name}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
