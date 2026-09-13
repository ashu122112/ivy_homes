import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  formatINR,
  isCorruptListing,
  isFakeListing,
  projectPriceToInr,
} from '../utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './DetailPages.css';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const PROJECT_COLORS = ['#3B82F6', '#EF4444'];

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
      
    const localityData = topLocalities.map(([name, value]) => ({ name, value }));

    const qualityData = [
      { name: 'Active', value: active.length },
      { name: 'Inactive', value: inactive },
      { name: 'Corrupt', value: corrupt.length },
      { name: 'Fake (Bait)', value: fake.length },
    ];
    
    const projectAccuracyData = [
      { name: 'Accurate Count', value: projects.length - wrong },
      { name: 'Wrong Count', value: wrong },
    ];

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
      localityData,
      qualityData,
      projectAccuracyData,
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

      {/* Visual Charts Section */}
      <div className="chart-grid">
        <div className="chart-card">
          <h3>Active Listings by Locality</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.localityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} />
                <Bar dataKey="value" fill="var(--primary-color)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Listing Data Quality</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.qualityData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insight-grid">
        <div className="insight-card">
          <div className="label">Listings retrieved</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="insight-card">
          <div className="label">Active (is_live)</div>
          <div className="value" style={{ color: 'var(--success-color)' }}>{stats.active}</div>
        </div>
        <div className="insight-card">
          <div className="label">Inactive (should be hidden)</div>
          <div className="value" style={{ color: 'var(--text-muted)' }}>{stats.inactive}</div>
        </div>
        <div className="insight-card">
          <div className="label">Corrupt listings</div>
          <div className="value" style={{ color: 'var(--danger-color)' }}>{stats.corrupt}</div>
        </div>
        <div className="insight-card">
          <div className="label">Fake bait listings</div>
          <div className="value" style={{ color: '#8B5CF6' }}>{stats.fake}</div>
        </div>
        <div className="insight-card">
          <div className="label">Magarpatta monthly rent</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatINR(stats.magRent)}
          </div>
        </div>
        <div className="insight-card">
          <div className="label">Avg ₹/sqft active 2BHK</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatINR(stats.avg)}
          </div>
        </div>
        <div className="insight-card">
          <div className="label">Projects w/ wrong count</div>
          <div className="value">{stats.wrong}</div>
        </div>
        <div className="insight-card" style={{ gridColumn: 'span 2' }}>
          <div className="label">Costliest project</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {stats.costliest?.name || stats.costliest?.project_id}
            <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: 4, color: 'var(--primary-color)' }}>
              {formatINR(stats.costliest?.price_max_inr)}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem', marginTop: '2rem', fontSize: '1.25rem' }}>Documentation lies (surfaced)</h2>
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
