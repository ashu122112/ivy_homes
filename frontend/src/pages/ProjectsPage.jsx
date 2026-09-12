import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { formatArea, formatINR, projectPriceToInr, titleCase } from '../utils';
import '../components/FilterBar.css';
import '../components/PropertyCard.css';

export default function ProjectsPage() {
  const { listings, projects, loading, error } = useData();
  const [locality, setLocality] = useState('');

  const actualCounts = useMemo(() => {
    const map = new Map();
    for (const l of listings) {
      if (!l.project_id) continue;
      map.set(l.project_id, (map.get(l.project_id) || 0) + 1);
    }
    return map;
  }, [listings]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (locality && !p.locality?.toLowerCase().includes(locality.toLowerCase())) return false;
      return true;
    });
  }, [projects, locality]);

  return (
    <main className="page-main container">
      <h1 className="page-title">Projects</h1>
      <p className="page-subtitle">
        Prices normalised from mixed lakh/crore floats to INR. Wrong{' '}
        <code>total_listings</code> values are flagged.
      </p>

      <div className="filter-bar" style={{ position: 'static', marginBottom: '1rem' }}>
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Locality</label>
            <input
              className="form-control filter-input"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Hadapsar"
            />
          </div>
        </div>
        <div className="filter-results-count">
          Showing <strong>{filtered.length}</strong> of {projects.length} projects
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading projects…</p>
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
          {filtered.map((project) => {
            const minInr = projectPriceToInr(project.price_min);
            const maxInr = projectPriceToInr(project.price_max);
            const actual = actualCounts.get(project.project_id) || 0;
            const reported = project.total_listings;
            const mismatch = actual !== reported;

            return (
              <article key={project.project_id} className="property-card fade-in">
                <div className="card-header">
                  <div className="card-header-left">
                    <h3 className="card-title">{project.apartment_name}</h3>
                    <p className="card-location">
                      {titleCase(project.locality)} · {project.developer_name}
                    </p>
                  </div>
                  <div className="card-price">{formatINR(maxInr)}</div>
                </div>

                <div className="card-badges">
                  <span className="badge badge-primary">{titleCase(project.project_status)}</span>
                  <span className="badge badge-secondary">{project.project_id}</span>
                  {mismatch && <span className="badge badge-red">Count mismatch</span>}
                </div>

                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">Price range</span>
                    <span className="stat-value">
                      {formatINR(minInr)} – {formatINR(maxInr)}
                    </span>
                  </div>
                </div>
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">Area</span>
                    <span className="stat-value">
                      {formatArea(project.min_area_sqft)} – {formatArea(project.max_area_sqft)}
                    </span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat">
                    <span className="stat-label">Listings</span>
                    <span className="stat-value">
                      API {reported} / real {actual}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="listing-id">raw max {project.price_max}</span>
                  <span className="posted-by">{project.total_units} units</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
