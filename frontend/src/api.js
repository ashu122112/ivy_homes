const API_KEY = 'IVY26-B5E34B131F2B';
const BASE_URL = 'https://solve.ivy.homes';

export { API_KEY, BASE_URL };

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Login failed (${res.status})`);
  }

  const data = await res.json();
  // Docs say `token`; API returns `access_token`
  return data.access_token;
}

export function getAuthHeaders(token) {
  return {
    'X-API-Key': API_KEY,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Page through a collection endpoint.
 * Docs lie: use `offset` (not `page`), max useful limit is 50,
 * and stop on `has_more` — do not trust `total`.
 */
export async function fetchAllPages(endpoint, token) {
  const results = [];
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${BASE_URL}${endpoint}?limit=50&offset=${offset}`,
      { headers: getAuthHeaders(token) }
    );

    if (!res.ok) throw new Error(`Failed to fetch ${endpoint} (${res.status})`);

    const data = await res.json();
    const page = data.results || [];
    results.push(...page);

    if (!page.length || data.has_more === false) break;
    offset = (data.offset ?? offset) + page.length;
  }

  return results;
}

export async function fetchListingById(listingId, token) {
  const res = await fetch(`${BASE_URL}/v1/listings/${encodeURIComponent(listingId)}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error(`Listing not found (${res.status})`);
  return res.json();
}

export async function fetchProjectById(projectId, token) {
  const res = await fetch(`${BASE_URL}/v1/projects/${encodeURIComponent(projectId)}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error(`Project not found (${res.status})`);
  return res.json();
}

export async function fetchRentalById(listingId, token) {
  const res = await fetch(`${BASE_URL}/v1/rentals/${encodeURIComponent(listingId)}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error(`Rental not found (${res.status})`);
  return res.json();
}
