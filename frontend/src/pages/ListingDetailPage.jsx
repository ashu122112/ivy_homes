import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchListingById } from '../api';
import { useData } from '../context/DataContext';
import { useFavourites } from '../context/FavouritesContext';
import {
  formatArea,
  formatINR,
  isCorruptListing,
  isFakeListing,
  titleCase,
} from '../utils';
import './DetailPages.css';

export default function ListingDetailPage({ token }) {
  const { id } = useParams();
  const { listings } = useData();
  const { isFavourite, toggle } = useFavourites();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = listings.find((l) => l.listing_id === id);
    if (cached) {
      setListing(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchListingById(id, token)
      .then(setListing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, listings]);

  if (loading) {
    return (
      <main className="page-main container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading listing…</p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="page-main container">
        <div className="error-state">
          <h3>Listing not found</h3>
          <p>{error || 'No data'}</p>
          <Link to="/" className="btn btn-primary">
            Back to listings
          </Link>
        </div>
      </main>
    );
  }

  const saved = isFavourite(listing.listing_id);
  const corrupt = isCorruptListing(listing);
  const fake = isFakeListing(listing);

  return (
    <main className="page-main container detail-page fade-in">
      <Link to="/" className="back-link">
        ← Back to listings
      </Link>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{listing.apartment_name || 'Property'}</h1>
          <p className="page-subtitle">
            {titleCase(listing.locality)} · #{listing.listing_id}
          </p>
        </div>
        <div className="detail-actions">
          <div className="detail-price">{formatINR(listing.price)}</div>
          <button
            type="button"
            className={`btn ${saved ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => toggle(listing.listing_id)}
          >
            {saved ? '★ Saved' : '☆ Save listing'}
          </button>
        </div>
      </div>

      {(corrupt || fake || listing.is_live === false) && (
        <div className="warn-banner">
          {listing.is_live === false && <span>Inactive listing (API returned is_live=false). </span>}
          {corrupt && <span>Marked corrupt (impossible fields). </span>}
          {fake && <span>Suspected fake bait price (&lt; ₹50,000). </span>}
        </div>
      )}

      <div className="detail-grid">
        <section className="detail-card">
          <h2>Basics</h2>
          <dl>
            <div>
              <dt>BHK</dt>
              <dd>{listing.bedroom}</dd>
            </div>
            <div>
              <dt>Bathrooms</dt>
              <dd>{listing.bathroom}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{titleCase(listing.property_type)}</dd>
            </div>
            <div>
              <dt>Furnishing</dt>
              <dd>{titleCase(listing.furnishing)}</dd>
            </div>
            <div>
              <dt>Floor</dt>
              <dd>
                {listing.floor ?? 'G'} / {listing.total_floors}
              </dd>
            </div>
            <div>
              <dt>Facing</dt>
              <dd>{titleCase(listing.facing_direction) || 'N/A'}</dd>
            </div>
          </dl>
        </section>

        <section className="detail-card">
          <h2>Area & price</h2>
          <dl>
            <div>
              <dt>Carpet</dt>
              <dd>{formatArea(listing.carpet_area)}</dd>
            </div>
            <div>
              <dt>Super built-up</dt>
              <dd>{formatArea(listing.super_built_up_area)}</dd>
            </div>
            <div>
              <dt>Price / sq.ft</dt>
              <dd>
                {listing.carpet_area
                  ? formatINR(Math.round(listing.price / listing.carpet_area))
                  : 'N/A'}
              </dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                {listing.project_id ? (
                  <Link to={`/projects`}>{listing.project_id}</Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="detail-card detail-wide">
          <h2>Description</h2>
          <p>{listing.description || 'No description provided.'}</p>
          <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Posted by {listing.posted_by_name || 'Unknown'} · {listing.posted_by_contact || '—'} ·{' '}
            {listing.posted_at || '—'}
          </p>
        </section>
      </div>
    </main>
  );
}
