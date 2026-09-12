#!/usr/bin/env python3
"""Fetch API data, normalize project prices, dump JSON caches."""
import json
import urllib.request
from pathlib import Path

BASE = "https://solve.ivy.homes"
API_KEY = "IVY26-B5E34B131F2B"
ROOT = Path(__file__).resolve().parents[1]


def req(path, token=None, method="GET", body=None):
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())


def fetch_all(endpoint, token):
    results, offset, limit = [], 0, 100
    while True:
        data = req(f"{endpoint}?limit={limit}&offset={offset}", token)
        page = data.get("results") or []
        results.extend(page)
        total = data.get("total") or 0
        if len(results) >= total or not page:
            break
        offset += limit
    return results


def normalize_project_price(price_min, price_max):
    """Docs claim INR ints; API returns mixed lakh/crore floats.

    Observed rule: when raw max < raw min, min is lakhs and max is crores.
    Otherwise both are lakhs. Values < ~15 with max>=min are still lakhs
    (e.g. 1.4 means 1.4L only when paired consistently — see inverted case).
    """
    if price_max is None or price_min is None:
        return None, None

    def as_lakhs(v):
        return round(float(v) * 100_000)

    def as_crores(v):
        return round(float(v) * 10_000_000)

    if float(price_max) < float(price_min):
        return as_lakhs(price_min), as_crores(price_max)
    return as_lakhs(price_min), as_lakhs(price_max)


def alt_threshold(price_min, price_max, threshold=15):
    """Alternative: value < threshold => crores else lakhs."""

    def one(v):
        v = float(v)
        return round(v * 10_000_000) if v < threshold else round(v * 100_000)

    return one(price_min), one(price_max)


def main():
    login = req("/auth/login", method="POST", body={"email": "demo1@ivy.homes", "password": "ff2c8e2787"})
    token = login["access_token"]
    print("logged in")

    listings = fetch_all("/v1/listings", token)
    rentals = fetch_all("/v1/rentals", token)
    projects = fetch_all("/v1/projects", token)
    print(f"listings={len(listings)} rentals={len(rentals)} projects={len(projects)}")

    (ROOT / "data_listings.json").write_text(json.dumps(listings), encoding="utf8")
    (ROOT / "data_rentals.json").write_text(json.dumps(rentals), encoding="utf8")
    (ROOT / "data_projects.json").write_text(json.dumps(projects), encoding="utf8")

    # Costliest under inverted-unit rule
    scored = []
    for p in projects:
        mn, mx = normalize_project_price(p["price_min"], p["price_max"])
        scored.append((mx, mn, p["project_id"], p["price_min"], p["price_max"], p.get("apartment_name")))
    scored.sort(reverse=True)
    print("TOP inverted-rule:")
    for row in scored[:10]:
        print(row)

    # Costliest under <15=crore rule
    scored2 = []
    for p in projects:
        mn, mx = alt_threshold(p["price_min"], p["price_max"])
        scored2.append((mx, mn, p["project_id"], p["price_min"], p["price_max"]))
    scored2.sort(reverse=True)
    print("TOP threshold-15:")
    for row in scored2[:10]:
        print(row)

    # Show P30004 planted note
    for p in projects:
        if p["project_id"] == "P30004":
            print("P30004 amenities:", p.get("amenities"))
            print("norm:", normalize_project_price(p["price_min"], p["price_max"]))
            print("alt:", alt_threshold(p["price_min"], p["price_max"]))

    # Probe endpoints
    for path in [
        "/v1/listings/DWE-3002501",
        "/v1/listing/DWE-3002501",
        "/v1/projects/P30015",
        "/v1/rentals/R3000001",
        "/health",
        "/v1/favourites",
        "/v1/analytics/summary",
    ]:
        try:
            data = req(path, token)
            print(path, "OK", type(data).__name__, list(data)[:5] if isinstance(data, dict) else "")
        except Exception as e:
            code = getattr(getattr(e, "code", None), "__str__", lambda: "?")()
            if hasattr(e, "code"):
                print(path, e.code)
            else:
                print(path, e)

    # Wrong listing counts
    from collections import Counter

    counts = Counter(l.get("project_id") for l in listings if l.get("project_id"))
    wrong = []
    for p in projects:
        actual = counts.get(p["project_id"], 0)
        if actual != p.get("total_listings"):
            wrong.append((p["project_id"], p.get("total_listings"), actual))
    print(f"projects_with_wrong_listing_count={len(wrong)} sample={wrong[:5]}")

    # Fake / corrupt quick checks using README rules
    corrupt = []
    for l in listings:
        reasons = []
        pt = (l.get("property_type") or "").lower()
        if pt in ("villa", "independent house", "builder floor") and (l.get("total_floors") or 0) > 5:
            reasons.append("lowrise_high_floors")
        if l.get("carpet_area") and l.get("super_built_up_area") and l["carpet_area"] > l["super_built_up_area"]:
            reasons.append("carpet_gt_sba")
        if l.get("floor") is not None and l.get("total_floors") is not None and l["floor"] > l["total_floors"]:
            reasons.append("floor_gt_total")
        if (l.get("price") or 0) < 0:
            reasons.append("neg_price")
        if reasons:
            corrupt.append(l["listing_id"])
    fake = sorted([l["listing_id"] for l in listings if l.get("price") is not None and 0 < l["price"] < 50000])
    print(f"corrupt={len(corrupt)} fake={len(fake)} fake_ids={fake}")


if __name__ == "__main__":
    main()
