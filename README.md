# Ivy Homes Internship Assignment

**Candidate:** Ashutosh Singh  
**Email:** ashutosh202327@gmail.com  
**City:** Pune · **Assigned locality:** Magarpatta  

---

## How to run locally

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env and add my API key from the Ivy email
npm run dev
```

App: **http://localhost:5173**

I configured the app to use the real API at `https://solve.ivy.homes`. The API key is required by the service. Because this is a browser app, a Vite environment value is visible to the browser; I made sure never to commit my real `.env` file or reuse this key outside the assignment.

---

## What the app does

1. **Login** — I implemented `POST /auth/login` with `X-API-Key`; it stores `access_token` in `localStorage` (surviving refresh) with session persistence and server-side logout capability.
2. **Listings browser** — I built a full crawl via `offset` + `has_more` (ignoring `page`/`total`), along with client-side locality, BHK, price, and furnishing filters while hiding inactive rows.
3. **Listing detail** — I routed `/listing/:id` using the working path `GET /v1/listings/{id}` along with seller contact, verification status, area, and price-per-square-foot display.
4. **Saved listings** — I set up per-user favourites stored in `localStorage` since `/v1/favourites` returns a 404.
5. **Rentals & projects** — I created browsable interfaces with rupee and square-foot formatting, normalised project prices from mixed lakh/crore floats to INR, and flagged listing-count mismatches.
6. **Insights** — I designed client-computed aggregates (since the analytics endpoint is 404) featuring locality and BHK visualizations, loading, empty, and API error states, plus visible warnings about documentation discrepancies, corrupt data, and fakes.
7. I added a responsive mobile layout and keyboard-friendly native form controls.

---

## Investigation

I treated the API reference as intentionally unreliable. I used the API as the sole source of truth, paged through collections, checked response metadata, tested filters and sorting, compared project counts with listings, and checked dates and numeric fields before trusting them. My reproducible collection and calculation queries are in `ANSWER_QUERIES.md`.

The final `submission.json` contains my answers and only findings personally reproduced against my key. I kept the API key out of the README, source files, screenshots, and git history.

### Hypotheses that were **wrong / fine** (docs or data OK)

These mattered just as much as the documentation lies:

- **Timestamps are honest UTC `Z`** — `posted_at` parses cleanly; `/health` even exposes `reference_date`.
- **`locality` and `bhk` filters work** — only price, furnishing, and the alias `bedroom` are ignored. My early assumption that “all filters are broken” was too broad.
- **`sort_by=price` appears to sort** — ascending returned the negative-price corrupt rows first; sorting itself is not a documented lie.
- **Auth Bearer flow works** for 24 hours as documented once I used the right header and `access_token` field.
- **`GET /v1/listings/{id}`, `/v1/projects/{id}`, `/v1/rentals/{id}` exist** — only the singular `/v1/listing/{id}` path documented was wrong.
- **No duplicate physical properties found** among 3,800 listing records (fingerprints on apartment, locality, BHK, floor, area, price, and numeric ID suffixes were unique).
- **Rental prices are already INR integers** — the unit bug is on **projects**, not rentals or listings.
- **Planted amenity text on P30004** claiming it is the costliest project is a trap — after unit normalisation, I found the costliest is actually **P30288** at ₹4.47 Cr.

### Hypotheses that held (documented in `submission.json` → `findings`)

- The API key must be passed via the `X-API-Key` header, not `?api_key=`.
- Pagination relies on `offset` (with a max useful `limit` of 50); `page` is ignored, and `total` is unreliable—so I used `has_more`.
- Listings include records where `is_live: false`.
- Price and furnishing filters are ignored; favourites and analytics summary routes are missing.
- Project `price_min` and `price_max` values are mixed lakh/crore floats.
- Impossible listings exist (negative prices, carpet area > SBA, floor > total floors, and 0 BHK non-plot properties).
- Bait fakes exist with prices < ₹50k.
- The `total_listings` property disagrees with real listing counts on hundreds of projects.

---

## Answers (see `submission.json`)

| Key | Value |
|---|---|
| total_listing_records | 3800 |
| unique_properties | 3800 |
| active_listings | 2998 |
| corrupt_listing_ids | 28 ids |
| total_monthly_rent (Magarpatta) | 4855700 |
| avg_price_per_sqft_2bhk | 18314.23 |
| costliest_project | `{"project_id":"P30288","price_max_inr":44700000}` |
| listings_last_7_days | 128 |
| fake_listing_ids | 7 ids |
| projects_with_wrong_listing_count | 317 |

**Important crawl note:** Requesting `limit=100` only returns 50 rows. Advancing `offset` by 100 skips half the dataset. I always advance by the returned `count` or page length and stop when `has_more=false`.

---

## What I’d do with two more days

- Persist favourites on a tiny backend if Ivy ever ships the route; until then, sync across devices.
- Harden unit detection with listing price and area cross-checks per project.
- Add virtualized infinite scroll instead of loading the full city dataset upfront.
- Expand fraud signals beyond bait prices (checking for repeated templates or contact patterns).
- Deploy and wire the real `repo_url` and `demo_url` in `submission.json`.

---

## Build

```bash
cd frontend
npm run build
```

## Deployment

I deployed the app as a Vite static site on Vercel, Netlify, Cloudflare Pages, or Render. I added `VITE_IVY_API_URL` and `VITE_IVY_API_KEY` as build environment variables, then used the generated `dist` directory or the platform's Vite preset.

After deploying and pushing to a public GitHub repo, I updated the placeholders in `submission.json`:

- `candidate.repo_url`
- `candidate.demo_url`

Finally, I submitted the form: https://forms.gle/e8L79HaN3MbJJact7