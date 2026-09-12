#!/usr/bin/env python3
"""Rebuild submission.json from cached datasets + verified findings."""
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
listings = json.loads((ROOT / "data_listings.json").read_text(encoding="utf8"))
rentals = json.loads((ROOT / "data_rentals.json").read_text(encoding="utf8"))
projects = json.loads((ROOT / "data_projects.json").read_text(encoding="utf8"))

corrupt = set()
for l in listings:
    if (l.get("price") or 0) < 0:
        corrupt.add(l["listing_id"])
    if (
        l.get("carpet_area")
        and l.get("super_built_up_area")
        and l["carpet_area"] > l["super_built_up_area"]
    ):
        corrupt.add(l["listing_id"])
    if (
        l.get("floor") is not None
        and l.get("total_floors") is not None
        and l["floor"] > l["total_floors"]
    ):
        corrupt.add(l["listing_id"])
    if l.get("property_type") != "plot" and (l.get("bedroom") or 0) <= 0:
        corrupt.add(l["listing_id"])
corrupt_ids = sorted(corrupt)

fake_ids = sorted(
    l["listing_id"]
    for l in listings
    if l.get("price") is not None and 0 < l["price"] < 50_000
)

excl = set(corrupt_ids) | set(fake_ids)
pps = [
    l["price"] / l["carpet_area"]
    for l in listings
    if l.get("is_live")
    and l.get("bedroom") == 2
    and l["listing_id"] not in excl
    and (l.get("carpet_area") or 0) > 0
]
avg_pps = round(sum(pps) / len(pps), 2)

mag_rent = sum(
    r.get("price") or 0
    for r in rentals
    if (r.get("locality") or "").lower() == "magarpatta"
)

REF = datetime(2026, 9, 10, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
start = REF - timedelta(days=7)
last7 = 0
for l in listings:
    ts = l.get("posted_at")
    if not ts:
        continue
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(REF.tzinfo)
    if start <= dt < REF:
        last7 += 1


def to_inr(v):
    v = float(v)
    return round(v * 10_000_000) if v < 15 else round(v * 100_000)


costliest = max(projects, key=lambda p: to_inr(p["price_max"]))
counts = Counter(l.get("project_id") for l in listings if l.get("project_id"))
wrong_projects = [
    p["project_id"]
    for p in projects
    if counts.get(p["project_id"], 0) != p.get("total_listings")
]
wrong_evidence = []
for pid in wrong_projects[:20]:
    p = next(x for x in projects if x["project_id"] == pid)
    wrong_evidence.append(pid)

inactive = [l["listing_id"] for l in listings if not l.get("is_live")][:20]
unit_evidence = [
    p["project_id"]
    for p in projects
    if float(p["price_max"]) < float(p["price_min"])
][:20]

findings = [
    {
        "endpoint": "*",
        "category": "auth",
        "documented": "Every request must carry the API key as a query parameter ?api_key=...",
        "actual": "Query param api_key is rejected; requests require the X-API-Key header.",
        "how_found": "Called GET /v1/listings?api_key=... and got 401; same call succeeded with X-API-Key.",
        "impact": "Any client built from the docs cannot authenticate.",
        "evidence": [],
    },
    {
        "endpoint": "/auth/login",
        "category": "auth",
        "documented": "Response field is token.",
        "actual": "Response field is access_token (also returns refresh_token and refresh_url, which are undocumented).",
        "how_found": "Logged in as demo1@ivy.homes and inspected the JSON keys.",
        "impact": "Frontend code that reads data.token stores undefined and every later call 401s.",
        "evidence": [],
    },
    {
        "endpoint": "*",
        "category": "pagination",
        "documented": "Collection endpoints take page (1-indexed) and limit (max 200); response includes page and page_size.",
        "actual": "page is silently ignored. Pagination uses offset. Effective max limit is 50. Response fields are offset, limit, count, total, has_more.",
        "how_found": "Requested page=5&limit=2 and still received offset=0; requested limit=100 and server returned limit=50.",
        "impact": "Clients that advance by page or by requested limit skip records or loop forever.",
        "evidence": [],
    },
    {
        "endpoint": "/v1/listings",
        "category": "completeness",
        "documented": "total is the exact number of matching records.",
        "actual": "total is inflated (e.g. 3576) while paging with has_more until exhaustion returns 3800 unique listing_ids. Trust has_more/count/offset, not total.",
        "how_found": "Compared response.total against a full offset crawl that stopped only when has_more became false.",
        "impact": "Stopping at total under-fetches; trusting total alone miscounts the city.",
        "evidence": [],
    },
    {
        "endpoint": "/v1/listings",
        "category": "completeness",
        "documented": "Returns only active sale listings; inactive/expired/withdrawn are excluded server side.",
        "actual": "Returns inactive listings with is_live=false as well (802 of 3800).",
        "how_found": "Fetched all pages and counted is_live values.",
        "impact": "UI will show withdrawn inventory unless the client filters is_live.",
        "evidence": inactive,
    },
    {
        "endpoint": "/v1/listings",
        "category": "filters",
        "documented": "min_price, max_price and furnishing filter the result set.",
        "actual": "Those parameters are accepted and ignored. locality and bhk do filter; bedroom does not.",
        "how_found": "Compared result bedrooms/prices/furnishing with and without each param; min_price=50000000 still returned cheap listings.",
        "impact": "Price and furnishing filters must be applied client-side.",
        "evidence": [],
    },
    {
        "endpoint": "/v1/listing/{id}",
        "category": "missing_endpoint",
        "documented": "GET /v1/listing/{listing_id} returns a single listing.",
        "actual": "That path 404s. The working path is GET /v1/listings/{listing_id}.",
        "how_found": "Requested both paths for DWE-3002501.",
        "impact": "Detail pages built from the docs fail; must use the plural path.",
        "evidence": ["DWE-3002501"],
    },
    {
        "endpoint": "/v1/favourites",
        "category": "missing_endpoint",
        "documented": "GET/POST/DELETE /v1/favourites manage saved listings.",
        "actual": "All favourites routes return 404.",
        "how_found": "Called GET /v1/favourites with a valid Bearer token after login.",
        "impact": "Saved listings must be persisted client-side (e.g. localStorage per user).",
        "evidence": [],
    },
    {
        "endpoint": "/v1/analytics/summary",
        "category": "missing_endpoint",
        "documented": "Returns pre-computed city aggregates for a dashboard.",
        "actual": "Returns 404. Aggregates must be computed from /v1/listings, /v1/rentals, /v1/projects.",
        "how_found": "Called the documented path with API key + Bearer token.",
        "impact": "Insights screen has to derive stats locally and surface data-quality warnings itself.",
        "evidence": [],
    },
    {
        "endpoint": "/v1/projects",
        "category": "units",
        "documented": "price_min and price_max are integer rupees.",
        "actual": "Values are mixed lakh/crore floats. Values < 15 are crores; values >= 34 are lakhs (clear gap, no values in between).",
        "how_found": "Inspected raw project prices, found pairs like price_min=80.0 / price_max=3.22, and normalised using the gap.",
        "impact": "Displaying raw numbers as INR understates or overstates project prices by 100x–10000x.",
        "evidence": unit_evidence,
    },
    {
        "endpoint": "/v1/listings",
        "category": "data_quality",
        "documented": "Listing records describe real, physically possible properties.",
        "actual": "Some records are impossible: negative price, carpet_area > super_built_up_area, floor > total_floors, or non-plot 0 BHK.",
        "how_found": "Scanned every listing for physical contradictions.",
        "impact": "Corrupt rows skew averages and must be excluded from analytics.",
        "evidence": corrupt_ids[:20],
    },
    {
        "endpoint": "/v1/listings",
        "category": "fraud",
        "documented": "Listings are genuine sale inventory.",
        "actual": "A handful of listings use impossibly low bait prices (< ₹50,000) for multi-BHK homes to generate enquiries.",
        "how_found": "Sorted by price and inspected sub-₹50k records against carpet area and BHK.",
        "impact": "Must be excluded from price/sqft metrics and flagged in the UI.",
        "evidence": fake_ids,
    },
    {
        "endpoint": "/v1/projects",
        "category": "consistency",
        "documented": "total_listings always agrees with listings for that project_id.",
        "actual": f"{len(wrong_projects)} projects report a total_listings that does not match the count of /v1/listings rows with that project_id.",
        "how_found": "Grouped all listings by project_id and compared to each project's total_listings field.",
        "impact": "Project cards that trust total_listings misstate inventory.",
        "evidence": wrong_evidence,
    },
]

submission = {
    "api_key": "IVY26-B5E34B131F2B",
    "candidate": {
        "name": "Ashutosh Singh",
        "email": "ashutosh.s@example.com",
        "repo_url": "REPLACE_WITH_PUBLIC_GITHUB_REPO_URL",
        "demo_url": "REPLACE_WITH_DEPLOYED_FRONTEND_URL",
    },
    "answers": {
        "total_listing_records": len(listings),
        "unique_properties": len({l["listing_id"] for l in listings}),
        "active_listings": sum(1 for l in listings if l.get("is_live")),
        "corrupt_listing_ids": corrupt_ids,
        "total_monthly_rent": mag_rent,
        "avg_price_per_sqft_2bhk": avg_pps,
        "costliest_project": {
            "project_id": costliest["project_id"],
            "price_max_inr": to_inr(costliest["price_max"]),
        },
        "listings_last_7_days": last7,
        "fake_listing_ids": fake_ids,
        "projects_with_wrong_listing_count": len(wrong_projects),
    },
    "findings": findings,
}

out = ROOT / "submission.json"
out.write_text(json.dumps(submission, indent=2) + "\n", encoding="utf8")
print("wrote", out)
print(json.dumps(submission["answers"], indent=2))
print("findings", len(findings))
