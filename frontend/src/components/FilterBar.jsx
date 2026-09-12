import './FilterBar.css';

const BHK_OPTIONS = [1, 2, 3, 4, 5];

export default function FilterBar({ filters, onChange, resultCount, totalCount }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({ locality: '', bedroom: '', minPrice: '', maxPrice: '', furnishing: '' });
  }

  const hasFilters = filters.locality || filters.bedroom || filters.minPrice || filters.maxPrice || filters.furnishing;

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-locality">Locality</label>
          <input
            id="filter-locality"
            type="text"
            className="form-control filter-input"
            placeholder="e.g. Wakad"
            value={filters.locality}
            onChange={e => set('locality', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-bhk">BHK</label>
          <select
            id="filter-bhk"
            className="form-control filter-select"
            value={filters.bedroom}
            onChange={e => set('bedroom', e.target.value)}
          >
            <option value="">Any</option>
            {BHK_OPTIONS.map(n => (
              <option key={n} value={n}>{n} BHK</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-min-price">Min Price (₹)</label>
          <input
            id="filter-min-price"
            type="number"
            className="form-control filter-input"
            placeholder="e.g. 5000000"
            value={filters.minPrice}
            onChange={e => set('minPrice', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-max-price">Max Price (₹)</label>
          <input
            id="filter-max-price"
            type="number"
            className="form-control filter-input"
            placeholder="e.g. 15000000"
            value={filters.maxPrice}
            onChange={e => set('maxPrice', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-furnishing">Furnishing</label>
          <select
            id="filter-furnishing"
            className="form-control filter-select"
            value={filters.furnishing}
            onChange={e => set('furnishing', e.target.value)}
          >
            <option value="">Any</option>
            <option value="fully-furnished">Furnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </div>

        {hasFilters && (
          <button className="btn btn-outline filter-reset" onClick={reset} id="filter-reset-btn">
            ✕ Clear
          </button>
        )}
      </div>

      <div className="filter-results-count">
        Showing <strong>{resultCount}</strong> of {totalCount} active listings
      </div>
    </div>
  );
}
