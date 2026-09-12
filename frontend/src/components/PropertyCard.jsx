import { Link } from 'react-router-dom';
import { formatINR, formatArea, titleCase, isCorruptListing, isFakeListing } from '../utils';
import { useFavourites } from '../context/FavouritesContext';
import './PropertyCard.css';

const FURNISHING_BADGE = {
  'fully-furnished': { label: 'Furnished', cls: 'badge-green' },
  furnished: { label: 'Furnished', cls: 'badge-green' },
  'semi-furnished': { label: 'Semi-Furnished', cls: 'badge-yellow' },
  semifurnished: { label: 'Semi-Furnished', cls: 'badge-yellow' },
  unfurnished: { label: 'Unfurnished', cls: 'badge-gray' },
};

export default function PropertyCard({ listing, to }) {
  const { isFavourite, toggle } = useFavourites();
  const href = to || `/listing/${listing.listing_id}`;
  const furnishing = FURNISHING_BADGE[listing.furnishing] || {
    label: listing.furnishing || 'N/A',
    cls: 'badge-gray',
  };
  const saved = isFavourite(listing.listing_id);
  const corrupt = isCorruptListing(listing);
  const fake = isFakeListing(listing);

  return (
    <article className="property-card fade-in">
      <Link to={href} className="card-link">
        <div className="card-header">
          <div className="card-header-left">
            <h3 className="card-title">
              {listing.apartment_name || listing.project_name || listing.title || 'Unnamed Property'}
            </h3>
            <p className="card-location">
              {titleCase(listing.locality)}
              {listing.city ? `, ${titleCase(listing.city)}` : ''}
            </p>
          </div>
          <div className="card-price">{formatINR(listing.price)}</div>
        </div>

        <div className="card-badges">
          {listing.bedroom != null && (
            <span className="badge badge-primary">{listing.bedroom} BHK</span>
          )}
          {listing.property_type && (
            <span className="badge badge-secondary">{titleCase(listing.property_type)}</span>
          )}
          <span className={`badge ${furnishing.cls}`}>{furnishing.label}</span>
          {listing.is_live === false && <span className="badge badge-red">Inactive</span>}
          {corrupt && <span className="badge badge-red">Corrupt</span>}
          {fake && <span className="badge badge-red">Fake</span>}
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">Carpet</span>
            <span className="stat-value">{formatArea(listing.carpet_area)}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-label">Floor</span>
            <span className="stat-value">
              {listing.floor ?? 'G'} / {listing.total_floors ?? '—'}
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-label">Bath</span>
            <span className="stat-value">{listing.bathroom ?? '—'}</span>
          </div>
        </div>
      </Link>

      <div className="card-footer">
        <span className="listing-id">#{listing.listing_id}</span>
        <button
          type="button"
          className={`btn btn-outline fav-btn ${saved ? 'is-saved' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggle(listing.listing_id);
          }}
        >
          {saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    </article>
  );
}
