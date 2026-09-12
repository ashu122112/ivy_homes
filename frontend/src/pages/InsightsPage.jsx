import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  formatINR,
  isCorruptListing,
  isFakeListing,
  projectPriceToInr,
} from '../utils';
import './DetailPages.css';

export default function InsightsPage() {
  const { listings, rentals, projects, loading, error } = useData();

  const stats = useMemo(() => {
    const active = listings.filter((l) => l.is_live);
    const inactive = listings.length - active.length;
    const corrupt = listings.filter(isCorruptListing);
    const fake = listings.filter(isFakeListing);
    const magRent = rentals
      .filter((r) => (r.locality || '').toLowerCase() === 'magarpatta')
      .reduce((s, r) => s + (r.price || 0), 0);

    const counts = new Map();
    for (const l of listings) {
      if (!l.project_id) continue;
      counts.set(l.project_id, (counts.get(l.project_id) || 0) + 1);
    }
    const wrong = projects.filter(
      (p) => (counts.get(p.project_id) || 0) !== p.total_listings
    ).length;

    const excl = new Set([...corrupt, ...fake].map((l) => l.listing_id));
    const pps = active
      .filter((l) => l.bedroom === 2 && !excl.has(l.listing_id) && l.carpet_area > 0)
      .map((l) => l.price / l.carpet_area);
    const avg =
      pps.length > 0 ? Math.round((pps.reduce((a, b) => a + b, 0) / pps.length) * 100) / 100 : 0;

    let costliest = null;
    for (const p of projects) {
      const maxInr = projectPriceToInr(p.price_max);
      if (!costliest || maxInr > costliest.price_max_inr) {
        costliest = { project_id: p.project_id, price_max_inr: maxInr, name: p.apartment_name };
      }
    }

    const byLocality = {};
    for (const l of active) {
      const key = l.locality || 'unknown';
      byLocality[key] = (byLocality[key] || 0) + 1;
    }
    const topLocalities = Object.entries(byLocality)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total: listings.length,
      active: active.length,
      inactive,
      corrupt: corrupt.length,
      fake: fake.length,
      magRent,
      wrong,
      avg,
      costliest,
      topLocalities,
      rentals: rentals.length,
      projects: projects.length,
    };
  }, [listings, rentals, projects]);

  if (loading) {
    return (
      <main className="page-main container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Computing insights from full dataset…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-main container">
        <div className="error-state">
          <h3>Failed</h3>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main container fade-in">
      <h1 className="page-title">Insights</h1>
      <p className="page-subtitle">
        <code>/v1/analytics/summary</code> is a 404 — these numbers are computed client-side from
        the real endpoints, with warnings for documentation lies.
      </p>

      <div className="insight-grid">
        <div className="insight-card">
          <div className="label">Listings retrieved</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="insight-card">
          <div className="label">Active (is_live)</div>
          <div className="value">{stats.active}</div>
        </div>
        <div className="insight-card">
          <div className="label">Inactive (should be hidden)</div>
          <div className="value">{stats.inactive}</div>
        </div>
        <div className="insight-card">
          <div className="label">Corrupt listings</div>
          <div className="value">{stats.corrupt}</div>
        </div>
        <div className="insight-card">
          <div className="label">Fake bait listings</div>
          <div className="value">{stats.fake}</div>
        </div>
        <div className="insight-card">
          <div className="label">Magarpatta monthly rent</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {formatINR(stats.magRent)}
          </div>
        </div>
        <div className="insight-card">
          <div className="label">Avg ₹/sqft active 2BHK</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {formatINR(stats.avg)}
          </div>
        </div>
        <div className="insight-card">
          <div className="label">Projects w/ wrong count</div>
          <div className="value">{stats.wrong}</div>
        </div>
        <div className="insight-card">
          <div className="label">Costliest project</div>
          <div className="value" style={{ fontSize: '1rem' }}>
            {stats.costliest?.project_id}
            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: 4 }}>
              {formatINR(stats.costliest?.price_max_inr)}
            </div>
          </div>
        </div>
        <div className="insight-card">
          <div className="label">Rentals / Projects</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {stats.rentals} / {stats.projects}
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Active listings by locality</h2>
      <div className="insight-grid" style={{ marginBottom: '2rem' }}>
        {stats.topLocalities.map(([loc, count]) => (
          <div className="insight-card" key={loc}>
            <div className="label">{loc}</div>
            <div className="value">{count}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Documentation lies (surfaced)</h2>
      <div className="lie-list">
        <div className="lie-item">
          <h3>Pagination</h3>
          <p>
            Docs say <code>page</code>; API uses <code>offset</code>. Max useful <code>limit</code>{' '}
            is 50. Trust <code>has_more</code>, not <code>total</code>.
          </p>
        </div>
        <div className="lie-item">
          <h3>Missing endpoints</h3>
          <p>
            <code>/v1/analytics/summary</code> and <code>/v1/favourites</code> 404. Detail path is{' '}
            <code>/v1/listings/&#123;id&#125;</code>, not singular <code>/v1/listing/&#123;id&#125;</code>.
          </p>
        </div>
        <div className="lie-item">
          <h3>Filters & inventory</h3>
          <p>
            Price/furnishing filters are ignored server-side. Listings include inactive rows.
            Project prices are lakh/crore floats, not INR ints — and {stats.wrong} projects disagree
            with their listing counts.
          </p>
        </div>
        <div className="lie-item">
          <h3>Data quality</h3>
          <p>
            {stats.corrupt} impossible listings and {stats.fake} bait-priced fakes are flagged in
            the UI and excluded from the 2BHK ₹/sqft average above.
          </p>
        </div>
      </div>
    </main>
  );
}
