---
name: "Amazon Ads Setup & Optimization"
description: "Build the 4-campaign system with bidding strategy, keyword harvesting, and ACOS troubleshooting"
type: framework
domain: kdp
source_chapter: ch-12
source_speakers:
  - Sean Dollwet
  - Dale L Roberts
  - Dave Chesson
  - Rick Wong
---

## When to Use

Use this framework when setting up Amazon Ads for any KDP title. Follow the 4-campaign architecture, use the step-by-step setup guide for your first campaign, and reference the troubleshooting matrix when ads underperform.

## The Framework

### The Core Principle

"Ads do not sell books, it only shows your books to more people. If the book is fundamentally bad... no matter how many people you show the book to, if nobody wants it then you're not going to get sales." -- Sean Dollwet

Every ad-driven sale also improves your organic ranking. Amazon's algorithm does not distinguish between organic and ad-driven purchases.

### Which Ad Type to Use

| Ad Type | Verdict | Why |
|---|---|---|
| **Sponsored Products** | Use this | Search results, product pages, "also bought" carousels |
| **Lock Screen Ads** | Avoid | Interest-based only, ACOS "well over 400 percent" |
| **Sponsored Brand Ads** | Advanced only | Requires 3+ titles, higher investment |

Advertise the **paperback** over the ebook when you publish both -- higher sale price means wider margin and more forgiving ACOS.

### The 4-Campaign System

| Campaign | Type | Timing | Targeting | Starting Bid |
|---|---|---|---|---|
| 1. Manual Keyword | Sponsored Product, manual | Day 1 | Broad match | $0.30 (low content) / $0.65 (high content) |
| 2. Manual Product | Sponsored Product, manual | Day 1 | ASIN targeting, expanded | $0.30 / $0.65 |
| 3. Automatic | Sponsored Product, auto | Week 3 | Amazon-chosen | $0.30 |
| 4. Scale (Exact) | Sponsored Product, manual | Week 3+ | Exact match, proven winners | $0.60+ |

**Why manual first:** "When you initially publish a book, Amazon has very limited data on what your book is about... we want to train Amazon what your book is about by manually choosing keywords." -- Sean Dollwet

After 2 weeks of manual data, automatic campaigns target far more relevant audiences.

**Nonfiction vs. Fiction targeting:**
- Nonfiction: weight toward keyword campaigns (readers search for topics)
- Fiction: weight toward product/ASIN campaigns (readers browse similar titles)

### Step-by-Step Setup

**1. Find Keywords and ASINs**
- Amazon autocomplete + AMZ Suggestion Expander (free Chrome plugin)
- ASIN Fetcher (free Chrome plugin) for competitor ASINs
- Publisher Rocket ($97) for comprehensive keyword discovery

Aim for 15-30 targets per campaign. Never exceed 30 per campaign.

**2. Choose Bid Strategy**

| Strategy | Best For |
|---|---|
| Dynamic Bids Down Only | Beginners, conservative budgets |
| Dynamic Bids Up and Down | Experienced advertisers with proven books |
| Fixed Bids | Steady impressions without limiting reach |

"We're always going to do down only. Dynamic bids down only. This is the most conservative and you won't overspend by doing this." -- Sean Dollwet

**3. Set Bid Amount**

Use Dave Chesson's penny trick: "Never go with a number like that, those that end with zero or five... I like to go 1 cent or 2 cent above this. So say I want to select 50 cents then I'll make it 51 cents." -- Dave Chesson

**4. Set Daily Budget**

| Level | Amount |
|---|---|
| Minimum viable | $3/day |
| Recommended start | $5-$10/day |
| For significant data | $10+/day |

**5. Add Negative Keywords**
- "free," "free book," "free ebook" (freebie seekers)
- Misleading topic associations
- Your own author name (exact match negative)
- Your own book titles

"If people are typing into Amazon 'free anything' and Amazon shows my book, they may click on it costing me the money, but are going to be harder to convince to buy." -- Dave Chesson

**6. Name Campaigns Clearly**

Format: `[Book] [Type] [Targeting] [Bid Strategy] [Format] [Date]`
Example: `Keto Cookbook Manual Keyword Down PB 022026`

### Match Types

| Type | Behavior | Use Case |
|---|---|---|
| Broad | Any word order, includes synonyms | Discovery -- maximum reach |
| Phrase | Exact sequence preserved, additions allowed | Mid-funnel, moderate control |
| Exact | Only this phrase plus plurals | Scale campaigns -- proven converters |

### Keyword Harvesting

Every 2 weeks, pull your Search Term Report from Advertising > Reports. Look for search terms that produced sales at acceptable ACOS. Graduate those terms into your Scale (Exact) campaign at higher bids.

Add search terms that wasted budget (clicks but no sales) as negative keywords.

### ACOS Benchmarks

| ACOS | What It Means |
|---|---|
| Below 30% | Profitable for most books |
| 30-50% | Break-even zone depending on royalty |
| 50-70% | Acceptable during launch (investing in ranking) |
| Above 70% | Losing money -- optimize or pause |

### Troubleshooting Matrix

| Problem | Likely Cause | Fix |
|---|---|---|
| No impressions | Bid too low or keywords too narrow | Increase bid by $0.10-$0.20; add broader keywords |
| Impressions but no clicks | Cover or title not compelling | Thumbnail test; update cover; revise title |
| Clicks but no sales | Description or reviews weak | Rewrite description (5-part framework); collect reviews |
| High ACOS | Wrong audience or price too low | Add negative keywords; raise price; narrow to exact match |

## Example

New nonfiction book, $12.99 paperback:

**Week 1-2:**
- Campaign 1 (Manual Keyword): 25 broad-match keywords, $0.66 bid, $5/day, down-only
- Campaign 2 (Manual Product): 20 competitor ASINs, $0.66 bid, $5/day, down-only

**Week 3:**
- Campaign 3 (Automatic): $0.31 bid, $5/day -- Amazon discovers keywords you missed
- Pull first Search Term Report from campaigns 1-2

**Week 4+:**
- Campaign 4 (Scale): Graduate top 10 converting keywords to exact match at $0.61 bid
- Add non-converting search terms as negatives across all campaigns
- Target ACOS below 40%

## Output

A fully operational Amazon Ads system includes:
- 4 campaigns running per title (manual keyword, manual product, automatic, scale)
- Keyword and ASIN target lists documented
- Bid strategy and daily budget set per campaign
- Negative keyword list maintained
- Biweekly Search Term Report review scheduled
- ACOS tracked and benchmarked

## Source

Chapter 12: Amazon Ads -- *Kings of Kindle: The Complete KDP Tactical Manual*
