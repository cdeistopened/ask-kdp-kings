#!/usr/bin/env python3
"""
Niche Scout — Step 1: Amazon Keyword Volume via DataForSEO
Usage: python3 keyword-volume.py "beekeeping for beginners"
       python3 keyword-volume.py --bulk "keyword1" "keyword2" "keyword3"
       python3 keyword-volume.py --related "beekeeping"

Three modes:
  Default:  Generate variations of the seed keyword + get related keywords
  --bulk:   Check exact volume for a custom list of keywords (up to 1000)
  --related: Get related keywords with volume for a single seed
"""

import os
import sys
import json
import requests
from base64 import b64encode

# DataForSEO credentials
LOGIN = os.environ.get("DATAFORSEO_LOGIN", "")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD", "")
AUTH = b64encode("{}:{}".format(LOGIN, PASSWORD).encode()).decode()
HEADERS = {
    "Authorization": "Basic {}".format(AUTH),
    "Content-Type": "application/json"
}


def get_bulk_volume(keywords):
    """Get Amazon search volume for a list of keywords (up to 1000)."""
    url = "https://api.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live"
    data = [{
        "keywords": keywords,
        "location_code": 2840,  # US
        "language_code": "en"
    }]
    resp = requests.post(url, headers=HEADERS, json=data)
    result = resp.json()
    if result.get("status_code") != 20000:
        print("Error: {}".format(result.get('status_message')))
        return [], result.get("cost", 0)
    # Response structure: tasks[0].result[0].items[]
    task = result["tasks"][0]
    task_result = task.get("result") or []
    cost = result.get("cost", 0)
    if task_result and task_result[0]:
        return task_result[0].get("items") or [], cost
    return [], cost


def get_related_keywords(keyword, limit=20):
    """Get related Amazon keywords with volume."""
    url = "https://api.dataforseo.com/v3/dataforseo_labs/amazon/related_keywords/live"
    data = [{
        "keyword": keyword,
        "location_code": 2840,
        "language_code": "en",
        "limit": limit
    }]
    resp = requests.post(url, headers=HEADERS, json=data)
    result = resp.json()
    if result.get("status_code") != 20000:
        print("Error: {}".format(result.get('status_message')))
        return [], None, result.get("cost", 0)
    task = result["tasks"][0]
    cost = result.get("cost", 0)
    if not task.get("result") or not task["result"][0]:
        return [], None, cost
    seed_data = task["result"][0].get("seed_keyword_data")
    seed_vol = None
    if seed_data:
        seed_vol = seed_data.get("keyword_info", {}).get("search_volume")
    items = task["result"][0].get("items") or []
    return items, seed_vol, cost


def generate_variations(keyword):
    """Generate keyword variations to check volume for.

    Uses the full phrase plus common book-buying modifiers.
    Also includes individual significant words and sub-phrases.
    """
    words = keyword.lower().split()
    variations = set()
    variations.add(keyword.lower())

    # The full phrase with book modifiers
    for suffix in ["book", "guide", "for dummies", "for beginners", "handbook", "101"]:
        variations.add("{} {}".format(keyword.lower(), suffix))

    # Each individual word (if multi-word phrase)
    for word in words:
        if len(word) > 3:  # skip short words like "for", "the", "and"
            variations.add(word)
            variations.add("{} book".format(word))

    # Two-word sub-phrases from the original
    if len(words) >= 3:
        for i in range(len(words) - 1):
            pair = "{} {}".format(words[i], words[i + 1])
            variations.add(pair)

    # "vs" / "versus" patterns for comparison keywords
    if "vs" in words or "versus" in words:
        # Already included via the full keyword
        pass

    return list(variations)[:20]  # API handles up to 1000, but keep costs down


def print_volume_table(items, title="KEYWORD VOLUME"):
    """Print a formatted volume table from bulk volume items."""
    print("\n{}".format("=" * 65))
    print("  {}".format(title))
    print("{}".format("=" * 65))
    print("{:<45} {:>12}".format("Keyword", "Volume"))
    print("-" * 59)

    sorted_items = sorted(items, key=lambda x: x.get("search_volume") or 0, reverse=True)
    for item in sorted_items:
        kw = item.get("keyword", "")
        vol = item.get("search_volume")
        if vol is not None and vol > 0:
            print("{:<45} {:>12,}".format(kw, vol))
        else:
            print("{:<45} {:>12}".format(kw, "N/A"))


def print_related_table(items, seed_vol=None, seed_keyword=None):
    """Print a formatted related keywords table."""
    print("\n{}".format("=" * 65))
    print("  RELATED AMAZON KEYWORDS")
    print("{}".format("=" * 65))

    if seed_vol and seed_keyword:
        print("  Seed: \"{}\" = {:,} monthly searches".format(seed_keyword, seed_vol))
        print()

    print("{:<45} {:>12}".format("Keyword", "Volume"))
    print("-" * 59)

    sorted_related = sorted(
        items,
        key=lambda x: (x.get("keyword_data", {}).get("keyword_info", {}).get("search_volume") or 0),
        reverse=True
    )
    series_candidates = []
    for item in sorted_related[:20]:
        kd = item.get("keyword_data", {})
        kw = kd.get("keyword", "")
        ki = kd.get("keyword_info", {})
        vol = ki.get("search_volume", 0)
        if vol and vol > 0:
            print("{:<45} {:>12,}".format(kw, vol))
            series_candidates.append({"keyword": kw, "volume": vol})
        else:
            print("{:<45} {:>12}".format(kw, "N/A"))

    if series_candidates:
        print("\n{}".format("=" * 65))
        print("  SERIES POTENTIAL")
        print("{}".format("=" * 65))
        print("  Keywords with volume > 0: {}".format(len(series_candidates)))
        if len(series_candidates) >= 5:
            print("  SERIES VIABLE - enough related keywords for a 5-10 book series")
        elif len(series_candidates) >= 3:
            print("  POSSIBLE - narrow series (3-5 books)")
        else:
            print("  LIMITED - may not support a full series")

    return series_candidates


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 keyword-volume.py \"keyword phrase\"")
        print("  python3 keyword-volume.py --bulk \"kw1\" \"kw2\" \"kw3\"")
        print("  python3 keyword-volume.py --related \"keyword\"")
        sys.exit(1)

    total_cost = 0

    # Mode: --bulk
    if sys.argv[1] == "--bulk":
        keywords = sys.argv[2:]
        if not keywords:
            print("Provide keywords after --bulk")
            sys.exit(1)
        print("\nChecking bulk volume for {} keywords...".format(len(keywords)))
        items, cost = get_bulk_volume(keywords)
        total_cost += cost
        if items:
            print_volume_table(items, "BULK VOLUME ({} keywords)".format(len(keywords)))
        else:
            print("No volume data returned.")
        print("\n[API cost: ${:.4f}]".format(total_cost))
        # Save JSON
        with open("/tmp/niche-scout-keywords.json", "w") as f:
            json.dump({"mode": "bulk", "keywords": keywords, "results": items}, f, indent=2)
        print("[Data saved to /tmp/niche-scout-keywords.json]")
        return

    # Mode: --related
    if sys.argv[1] == "--related":
        keyword = " ".join(sys.argv[2:])
        if not keyword:
            print("Provide a keyword after --related")
            sys.exit(1)
        print("\nGetting related keywords for \"{}\"...".format(keyword))
        items, seed_vol, cost = get_related_keywords(keyword, limit=30)
        total_cost += cost
        if items:
            candidates = print_related_table(items, seed_vol, keyword)
        else:
            print("No related keywords found.")
            candidates = []
        print("\n[API cost: ${:.4f}]".format(total_cost))
        with open("/tmp/niche-scout-keywords.json", "w") as f:
            json.dump({"mode": "related", "seed": keyword, "seed_volume": seed_vol, "related": candidates}, f, indent=2)
        print("[Data saved to /tmp/niche-scout-keywords.json]")
        return

    # Default mode: variations + related
    keyword = " ".join(sys.argv[1:])
    print("\n{}".format("=" * 65))
    print("  AMAZON KEYWORD VOLUME: {}".format(keyword))
    print("{}".format("=" * 65))

    # Step 1: Bulk volume for seed + variations
    variations = generate_variations(keyword)
    print("\nChecking volume for {} keyword variations...".format(len(variations)))

    volume_data, cost = get_bulk_volume(variations)
    total_cost += cost

    if volume_data:
        print_volume_table(volume_data, "VARIATIONS ({} checked)".format(len(variations)))
    else:
        print("No volume data returned for variations.")

    # Step 2: Related keywords
    related, seed_vol, cost = get_related_keywords(keyword)
    total_cost += cost

    if related:
        series_candidates = print_related_table(related, seed_vol, keyword)
    else:
        print("\nNo related keywords found for \"{}\".".format(keyword))
        series_candidates = []

    # Output JSON for piping to other scripts
    output = {
        "seed_keyword": keyword,
        "variations": [
            {"keyword": item.get("keyword", ""), "volume": item.get("search_volume")}
            for item in (volume_data or [])
        ],
        "related": series_candidates,
        "seed_volume": seed_vol,
    }

    json_path = "/tmp/niche-scout-keywords.json"
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)
    print("\n[API cost: ${:.4f}]".format(total_cost))
    print("[Data saved to {}]".format(json_path))


if __name__ == "__main__":
    main()
