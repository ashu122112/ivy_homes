# Ivy Homes Internship Assignment

**Candidate:** Ashutosh Singh  
**Email:** ashutosh.s@example.com  
**City:** Pune · **Assigned locality:** Magarpatta

---

## How to run locally

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

### Demo accounts

| Email | Password |
|---|---|
| demo1@ivy.homes | ff2c8e2787 |
| demo2@ivy.homes | ff2c8e2787 |
| demo3@ivy.homes | ff2c8e2787 |

---

## What the app does

1. **Login** — `POST /auth/login` with `X-API-Key`; stores `access_token` in `localStorage` (survives refresh).
2. **Listings browser** — full crawl via `offset` + `has_more` (not `page`/`total`); client-side locality / BHK / price / furnishing filters; inactive rows hidden.
3. **Listing detail** — `/listing/:id` using working path `GET /v1/listings/{id}`.
4. **Saved listings** — per-user favourites in `localStorage` (`/v1/favourites` is 404).
5. **Rentals & projects** — browsable; project prices normalised from mixed lakh/crore floats to INR; listing-count mismatches flagged.
6. **Insights** — client-computed aggregates (analytics endpoint is 404) plus visible warnings about doc lies / corrupt / fake data.

---

## How we decided what to distrust

Started from the docs’ own warning, then treated every claim as a hypothesis:

1. Hit `/health`, login, and one page of `/v1/listings`.
2. Diff response shape vs docs (`access_token`, `offset`/`has_more`, no `page`).
3. Probe documented paths that returned 404 (`/v1/favourites`, `/v1/analytics/summary`, `/v1/listing/{id}`).
4. A/B test query params (change one at a time).
5. Full crawl trusting `has_more`, then form data-quality hypotheses and count hits.

### Hypotheses that were **wrong / fine** (docs or data OK)

These matter as much as the lies:

- **Timestamps are honest UTC `Z`** — `posted_at` parses cleanly; `/health` even exposes `reference_date`.
- **`locality` and `bhk` filters work** — only price/furnishing (and the alias `bedroom`) are ignored. Early assumption that “all filters are broken” was too broad.
- **`sort_by=price` appears to sort** — ascending returned the negative-price corrupt rows first; sorting itself is not a documented lie.
- **Auth Bearer flow works** for 24h as documented once you use the right header + `access_token` field.
- **`GET /v1/listings/{id}`, `/v1/projects/{id}`, `/v1/rentals/{id}` exist** — only the singular `/v1/listing/{id}` path is wrong.
- **No duplicate physical properties found** among 3800 listing records (fingerprints on apt/locality/BHK/floor/area/price and numeric id suffixes were unique).
- **Rental prices are already INR integers** — the unit bug is on **projects**, not rentals/listings.
- **Planted amenity text on P30004** claiming it is the costliest project is a trap — after unit normalisation the costliest is **P30288** at ₹4.47 Cr.

### Hypotheses that held (documented in `submission.json` → `findings`)

- API key must be `X-API-Key`, not `?api_key=`.
- Pagination is `offset` (max useful `limit` 50); `page` ignored; `total` is unreliable — use `has_more`.
- Listings include `is_live: false`.
- Price/furnishing filters ignored; favourites + analytics summary missing.
- Project `price_min`/`price_max` are mixed lakh/crore floats.
- Impossible listings (neg price / carpet &gt; SBA / floor &gt; floors / 0 BHK non-plot).
- Bait fakes with price &lt; ₹50k.
- `total_listings` disagrees with real listing counts on hundreds of projects.

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

**Important crawl note:** requesting `limit=100` returns only 50 rows. Advancing `offset` by 100 skips half the dataset. Always advance by the returned `count` / page length and stop on `has_more=false`.

---

## What I’d do with two more days

- Persist favourites on a tiny backend if Ivy ever ships the route; until then sync across devices.
- Harden unit detection with listing price/area cross-checks per project.
- Add virtualized infinite scroll instead of loading the full city upfront.
- Expand fraud signals beyond bait price (repeated templates / contact patterns).
- Deploy + wire real `repo_url` / `demo_url` in `submission.json`.

---

## Deploy

```bash
cd frontend
npm run build
# then deploy `frontend/dist` to Vercel / Netlify / Cloudflare Pages
```

After deploy and pushing a public GitHub repo, replace the placeholders in `submission.json`:

- `candidate.repo_url`
- `candidate.demo_url`

Submit the form: https://forms.gle/e8L79HaN3MbJJact7
