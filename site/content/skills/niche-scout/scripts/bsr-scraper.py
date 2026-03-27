#!/usr/bin/env python3
"""
Niche Scout — Step 2: Amazon BSR Scraper via Apify
Usage: python3 bsr-scraper.py "beekeeping for beginners"

Runs two passes:
1. Search results — gets titles, prices, ratings, ASINs for top 20 books
2. Product details — gets BSR, publisher, categories for top 10

Requires APIFY_TOKEN in environment.
"""

import os
import sys
import json
import time
import requests

APIFY_TOKEN = os.environ.get("APIFY_TOKEN", "")
ACTOR_ID = "curious_coder~amazon-scraper"
BASE_URL = "https://api.apify.com/v2"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {APIFY_TOKEN}"
}


def run_actor(payload, label=""):
    """Start an Apify actor run and wait for completion."""
    url = f"{BASE_URL}/acts/{ACTOR_ID}/runs"
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code != 201:
        print(f"Failed to start actor ({label}): {resp.status_code}")
        print(resp.text[:500])
        return None

    run_data = resp.json().get("data", {})
    run_id = run_data.get("id")
    dataset_id = run_data.get("defaultDatasetId")
    print(f"  Run ID: {run_id} | Dataset: {dataset_id} | {label}")

    # Poll for completion (max 5 minutes)
    status_url = f"{BASE_URL}/actor-runs/{run_id}"
    for i in range(30):
        time.sleep(10)
        status_resp = requests.get(status_url, headers={"Authorization": f"Bearer {APIFY_TOKEN}"})
        status = status_resp.json().get("data", {}).get("status")
        print(f"  [{label}] polling... {status}")
        if status in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
            break

    if status != "SUCCEEDED":
        print(f"  [{label}] finished with status: {status}")
        return None

    # Get results
    items_url = f"{BASE_URL}/datasets/{dataset_id}/items?limit=25"
    items_resp = requests.get(items_url, headers={"Authorization": f"Bearer {APIFY_TOKEN}"})
    return items_resp.json()


def search_amazon(keyword):
    """Pass 1: Search Amazon for books matching the keyword."""
    search_url = f"https://www.amazon.com/s?k={keyword.replace(' ', '+')}&i=stripbooks"
    payload = {
        "urls": [{"url": search_url}],
        "maxResults": 20
    }
    print(f"\nPass 1: Searching Amazon for '{keyword}'...")
    return run_actor(payload, label="search")


def get_product_details(asins):
    """Pass 2: Get BSR, publisher, categories for individual products."""
    urls = [{"url": f"https://www.amazon.com/dp/{asin}"} for asin in asins[:10]]
    payload = {
        "urls": urls,
        "scrapeProductDetails": True
    }
    print(f"\nPass 2: Getting product details for {len(urls)} books...")
    return run_actor(payload, label="details")


def extract_bsr(item):
    """Extract BSR from a product detail item.

    Returns (books_bsr, category_bsr, category_name) where:
    - books_bsr is the overall Books rank (broadest)
    - category_bsr is the best sub-category rank
    The API returns rank as strings, so we convert to int.
    """
    bsr_list = item.get("bestSellersRank", [])
    if not bsr_list:
        return None, None
    # Convert string ranks to int
    for entry in bsr_list:
        try:
            entry["_rank_int"] = int(str(entry.get("rank", "0")).replace(",", ""))
        except (ValueError, TypeError):
            entry["_rank_int"] = 999999999
    # Find the "Books" or "Kindle Store" rank (broadest category)
    books_entry = None
    for entry in bsr_list:
        cat = entry.get("categoryName", "").lower()
        if cat in ("books", "kindle store", "kindle ebooks"):
            books_entry = entry
            break
    # If no broad category found, use the highest (worst) rank as the overall
    if not books_entry:
        books_entry = max(bsr_list, key=lambda x: x["_rank_int"])
    return books_entry["_rank_int"], books_entry.get("categoryName", "")


def extract_publisher(item):
    """Extract publisher from product details array.

    Note: Amazon field names often contain unicode markers (e.g. \u200f).
    We strip non-ASCII before matching.
    """
    details = item.get("productDetails", [])
    for d in details:
        # Strip unicode control chars for matching
        name = d.get("name", "").encode("ascii", "ignore").decode().strip().lower()
        if "publisher" in name:
            return d.get("value", "").strip()
    return ""


def is_self_published(publisher, price=None):
    """Detect if a book is self-published."""
    if not publisher:
        return False
    sp_signals = ["independently published", "independently publish", "createspace", "kindle direct"]
    pub_lower = publisher.lower()
    return any(signal in pub_lower for signal in sp_signals)


def score_niche(details_data):
    """Apply Dollwet BSR benchmarks to the scraped data."""
    if not details_data:
        return {}

    bsr_values = []
    self_pub_count = 0

    for item in details_data:
        bsr, cat = extract_bsr(item)
        publisher = extract_publisher(item)
        if bsr:
            bsr_values.append(bsr)
        if is_self_published(publisher):
            self_pub_count += 1

    if not bsr_values:
        return {"error": "No BSR data found"}

    under_5k = sum(1 for b in bsr_values if b < 5000)
    under_30k = sum(1 for b in bsr_values if b < 30000)
    under_100k = sum(1 for b in bsr_values if b < 100000)
    total = len(bsr_values)

    return {
        "total_books": total,
        "under_5k": under_5k,
        "under_30k": under_30k,
        "under_100k": under_100k,
        "self_published": self_pub_count,
        "avg_bsr": int(sum(bsr_values) / len(bsr_values)),
        "min_bsr": min(bsr_values),
        "max_bsr": max(bsr_values),
        "benchmarks": {
            "not_overcrowded": under_5k <= 5,
            "demand_confirmed": under_100k >= 7,
            "sweet_spot": under_30k >= (total // 2),
            "indie_proof": self_pub_count >= 2
        }
    }


def bsr_to_sales(bsr):
    """Approximate daily sales from BSR (per Dale Roberts)."""
    if bsr is None:
        return "?"
    if bsr <= 1000:
        return "25+"
    elif bsr <= 5000:
        return "12-25"
    elif bsr <= 10000:
        return "5-12"
    elif bsr <= 30000:
        return "1-5"
    elif bsr <= 100000:
        return "<1"
    else:
        return "~0"


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 bsr-scraper.py \"keyword phrase\"")
        sys.exit(1)

    if not APIFY_TOKEN:
        print("Error: APIFY_TOKEN not set in environment")
        print("Set it with: export APIFY_TOKEN=your_token_here")
        sys.exit(1)

    keyword = " ".join(sys.argv[1:])
    print(f"\n{'='*60}")
    print(f"  AMAZON BSR ANALYSIS: {keyword}")
    print(f"{'='*60}")

    # Pass 1: Search
    search_results = search_amazon(keyword)
    if not search_results:
        print("No search results returned.")
        sys.exit(1)

    # Display search results
    print(f"\n{'#':>3} {'Title':<50} {'Price':>8} {'Rating':>6} {'ASIN':<12}")
    print("-" * 85)

    asins = []
    for i, item in enumerate(search_results[:20], 1):
        title = (item.get("title") or item.get("name") or "")[:48]
        price = item.get("price") or item.get("currentPrice") or "N/A"
        rating = item.get("rating") or item.get("stars") or "N/A"
        asin = item.get("asin") or ""
        print(f"{i:>3} {title:<50} {str(price):>8} {str(rating):>6} {asin:<12}")
        if asin:
            asins.append(asin)

    if not asins:
        print("\nNo ASINs found in search results.")
        sys.exit(1)

    # Pass 2: Product details (top 10)
    details_results = get_product_details(asins[:10])
    if not details_results:
        print("No product details returned.")
        sys.exit(1)

    # Display BSR table
    print(f"\n{'='*60}")
    print(f"  BSR DETAILS (Top {len(details_results)} Books)")
    print(f"{'='*60}\n")
    print(f"{'#':>3} {'Title':<40} {'BSR':>8} {'Sales/Day':>10} {'Publisher':<25} {'Self-Pub':>8}")
    print("-" * 100)

    all_details = []
    for i, item in enumerate(details_results, 1):
        title = (item.get("title") or "")[:38]
        bsr, cat = extract_bsr(item)
        publisher = extract_publisher(item)
        sp = is_self_published(publisher)
        sales = bsr_to_sales(bsr)

        detail = {
            "title": item.get("title", ""),
            "bsr": bsr,
            "category": cat,
            "publisher": publisher,
            "self_published": sp,
            "est_sales_day": sales
        }
        all_details.append(detail)

        bsr_str = str(bsr) if bsr else "N/A"
        pub_str = (publisher or "")[:23]
        sp_str = "YES" if sp else ""
        print(f"{i:>3} {title:<40} {bsr_str:>8} {sales:>10} {pub_str:<25} {sp_str:>8}")

    # Score the niche
    scores = score_niche(details_results)

    print(f"\n{'='*60}")
    print(f"  NICHE SCORECARD")
    print(f"{'='*60}\n")

    if "error" not in scores:
        benchmarks = scores["benchmarks"]
        print(f"  Books analyzed:        {scores['total_books']}")
        print(f"  Average BSR:           {scores['avg_bsr']:,}")
        print(f"  BSR range:             {scores['min_bsr']:,} — {scores['max_bsr']:,}")
        print(f"  Under 5,000 BSR:       {scores['under_5k']} {'(OK)' if benchmarks['not_overcrowded'] else '(TOO COMPETITIVE)'}")
        print(f"  Under 30,000 BSR:      {scores['under_30k']} {'(GOOD)' if benchmarks['sweet_spot'] else '(WEAK)'}")
        print(f"  Under 100,000 BSR:     {scores['under_100k']} {'(DEMAND OK)' if benchmarks['demand_confirmed'] else '(LOW DEMAND)'}")
        print(f"  Self-published:        {scores['self_published']} {'(INDIE PROOF)' if benchmarks['indie_proof'] else '(NO INDIE PROOF)'}")

        passed = sum(1 for v in benchmarks.values() if v)
        total_checks = len(benchmarks)
        print(f"\n  Score: {passed}/{total_checks} benchmarks passed")

        if passed == total_checks:
            verdict = "VIABLE"
        elif passed >= 3:
            verdict = "BORDERLINE"
        elif passed >= 2:
            verdict = "WEAK"
        else:
            verdict = "DEAD"

        print(f"  Verdict: {verdict}")
    else:
        print(f"  {scores['error']}")

    # Save JSON output
    output = {
        "seed_keyword": keyword,
        "search_results": [
            {
                "title": item.get("title", ""),
                "price": item.get("price"),
                "rating": item.get("rating"),
                "asin": item.get("asin", "")
            }
            for item in (search_results or [])[:20]
        ],
        "bsr_details": all_details,
        "scores": scores
    }

    json_path = "/tmp/niche-scout-bsr.json"
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n[Data saved to {json_path}]")


if __name__ == "__main__":
    main()
