# Niche Research Tool Comparison

Tools referenced in KDP Kings Playbook (175 episodes distilled). Our stack uses DataForSEO + Apify to replicate what KDSPY and Book Beam do manually.

## Our Stack (Automated via Claude Code)

| Tool | What It Does | Cost | Notes |
|------|-------------|------|-------|
| **DataForSEO Amazon Labs** | Amazon keyword volume + related keywords | ~$0.01/query | `bulk_search_volume` + `related_keywords` endpoints |
| **Apify `curious_coder~amazon-scraper`** | BSR, publisher, categories, prices, ratings | ~$0.01/run | Two-pass: search results → product details |

**Combined cost per niche analysis: ~$0.02**

## What We Replace

| Manual Tool | What It Did | Our Replacement | Coverage |
|-------------|-------------|-----------------|----------|
| **KDSPY** ($47) | Chrome extension — BSR scrape of search results page | Apify actor | ~80% (missing: review count display, total search results count) |
| **Book Beam** ($17-47/mo) | Niche Finder with BSR/review/self-pub filters | bsr-scraper.py + scoring logic | ~90% |
| **DS Amazon Quick View** (free) | Inline BSR on search results | Apify search pass | 100% |
| **Publisher Rocket** ($97) | Keyword suggestions + competition score | DataForSEO related keywords | ~70% (no proprietary competition score) |

## Manual Tools (Still Useful)

| Tool | Cost | Best For |
|------|------|----------|
| **DS Amazon Quick View** | Free Chrome extension | Quick visual scan of BSR on search pages |
| **KDSPY** | $47 one-time | Visual confirmation, word frequency in titles, cover thumbnails |
| **Book Beam** | $17-47/mo | Self-published filter, category browsing, bulk niche scanning |
| **Publisher Rocket** | $97 one-time | Google + Amazon keyword suggestions, AMS ad keyword ideas |
| **Google Trends** | Free | Seasonality patterns, hot vs evergreen classification |

## API Details

### DataForSEO Amazon Labs
- **Bulk Search Volume**: `/v3/dataforseo_labs/amazon/bulk_search_volume/live` — up to 1000 keywords per request
- **Related Keywords**: `/v3/dataforseo_labs/amazon/related_keywords/live` — returns related keywords with volume
- **Auth**: Basic auth with login/password (credentials in `~/.zshrc`)
- **Location**: `2840` (US), Language: `en`

### Apify Actor: `curious_coder~amazon-scraper`
- **Search pass**: `{"urls": [{"url": "https://www.amazon.com/s?k=KEYWORD&i=stripbooks"}], "maxResults": 20}`
- **Detail pass**: `{"urls": [{"url": "https://www.amazon.com/dp/ASIN"}], "scrapeProductDetails": true}`
- **Auth**: Bearer token via `APIFY_TOKEN` env var
- **BSR field**: `bestSellersRank` array (each entry has `rank` + `categoryName`)
- **Publisher field**: In `productDetails` array, look for `name` containing "Publisher"
- **Run time**: 30-90 seconds per pass

### Amazon PA-API v5 (Deprecated April 2026)
- Was the "official" way to get product data
- Being sunset — Apify is the more durable path
- Not used in our stack
