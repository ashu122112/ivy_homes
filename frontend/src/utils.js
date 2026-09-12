/**
 * Formats a number as Indian currency (₹ with lakh/crore notation)
 */
export function formatINR(price) {
  if (price == null || Number.isNaN(Number(price))) return 'N/A';
  const n = Number(price);
  const abs = Math.abs(n);
  if (abs >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  if (abs > 0) {
    return `₹${n.toLocaleString('en-IN')}`;
  }
  return '₹0';
}

export function formatArea(area) {
  if (area == null) return 'N/A';
  return `${Number(area).toLocaleString('en-IN')} sq.ft`;
}

export function titleCase(str) {
  if (!str) return '';
  return String(str).replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Project prices are mixed lakh/crore floats, not INR integers.
 * Observed gap: values < 15 → crores; values >= 34 → lakhs.
 */
export function projectPriceToInr(value) {
  if (value == null) return null;
  const v = Number(value);
  if (Number.isNaN(v)) return null;
  return Math.round(v < 15 ? v * 10_000_000 : v * 100_000);
}

export function isCorruptListing(l) {
  if (!l) return false;
  if ((l.price ?? 0) < 0) return true;
  if (l.carpet_area && l.super_built_up_area && l.carpet_area > l.super_built_up_area) return true;
  if (l.floor != null && l.total_floors != null && l.floor > l.total_floors) return true;
  if (l.property_type !== 'plot' && (l.bedroom ?? 0) <= 0) return true;
  return false;
}

export function isFakeListing(l) {
  return l?.price != null && l.price > 0 && l.price < 50_000;
}

export function normalizeFurnishing(value) {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (v.includes('semi')) return 'semi-furnished';
  if (v.includes('fully') || v === 'furnished') return 'fully-furnished';
  if (v.includes('unfurnish')) return 'unfurnished';
  return v;
}
