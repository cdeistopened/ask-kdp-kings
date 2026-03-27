# KDP Kings Plugin — Enrichment Report

**Date:** 2026-03-26
**Principle:** Every reference article must serve a skill. No orphans.

---

## 1. Pre-Audit Inventory

### Skills (12)
| Skill | Type | Status |
|-------|------|--------|
| amazon-ads | Decision | OK |
| ask-kdp | Router | OK |
| book-architect | Decision | OK |
| competitor-reverse-engineer | Decision | OK |
| cover-brief | Decision | OK |
| keyword-fill | Decision | OK |
| launch-sequence | Decision | OK |
| listing-optimizer | Decision | OK |
| manuscript-drafter | Decision | OK |
| niche-scout | Decision | OK |
| pricing-strategist | Decision | OK |
| upload-checklist | Decision | OK |

**Composition:** 10 Decision, 1 Utility, 1 Router, **0 Tutor** (biggest quality gap per audit docs)

### Reference Articles (16, including niche-scout's local refs)
| Article | Wired To | Status |
|---------|----------|--------|
| 30-day-launch-sequence.md | launch-sequence | OK |
| amazon-ads-setup.md | amazon-ads | OK |
| cover-creation-workflow.md | cover-brief | OK |
| freelancer-hiring-workflow.md | launch-sequence, ask-kdp, cover-brief | OK |
| kdp-revenue-map.md | niche-scout, ask-kdp | OK |
| keyword-research-pipeline.md | keyword-fill | OK |
| listing-optimization-checklist.md | listing-optimizer | OK |
| low-content-creation-pipelines.md | ask-kdp, book-architect | OK |
| manuscript-formatting-workflow.md | ask-kdp, manuscript-drafter | OK |
| niche-validation-pipeline.md | niche-scout, competitor-reverse-engineer | OK |
| pricing-decision-matrix.md | pricing-strategist | OK |
| **pricing-psychology-hormozi.md** | **NONE** | **ORPHAN** |
| publishing-business-blueprint.md | ask-kdp | OK |
| safe-ai-publishing-workflow.md | ask-kdp, manuscript-drafter | OK |
| upload-checklist.md | upload-checklist | OK |
| wide-vs-exclusive.md | ask-kdp, pricing-strategist | OK |

---

## 2. Orphan Resolution

### pricing-psychology-hormozi.md (Hormozi Value Equation)
- **Problem:** Written by enrichment agent but never wired to any skill
- **Fix:** Added to `pricing-strategist` Related Frameworks section
- **Also wired to:** `book-architect` (title pricing relationship)

**Status: RESOLVED**

---

## 3. Cross-Pollination Enrichment

### 3a. Hormozi Offer Naming -> Book Titling
- **Article:** `offer-naming-for-book-titles-hormozi.md`
- **Thesis:** The book title IS the offer name. Hormozi's 5 naming criteria applied to KDP title/subtitle decisions.
- **Wired to:** `pricing-strategist`, `book-architect`
- **Cross-references:** hormozi-wiki offer naming methodology

### 3b. GaryVee Content Pyramid -> Book Launches
- **Article:** `content-pyramid-book-launches-garyvee.md`
- **Thesis:** The book is pillar content. Extract 64 micro pieces (8 chapters x 8 formats) for a 30-day social content calendar that maps directly to the KDP Kings launch window.
- **Wired to:** `launch-sequence`, `launch-bootcamp`
- **Integration:** Maps GaryVee's 3-layer pyramid onto Sean Dollwet's 7 video formats

### 3c. Neil Patel SEO -> Amazon Listing Optimization
- **Article:** `amazon-listing-seo-neil-patel.md`
- **Thesis:** Amazon A9 responds to the same principles as Google SEO — search intent, semantic clusters, title-tag hierarchy, content depth — but with purchase signals replacing backlinks.
- **Wired to:** `listing-optimizer`, `keyword-fill`
- **Cross-references:** neil-patel-wiki transcripts, Dave Chesson's Amazon indexing research

---

## 4. Tutor Skills Built

The audit docs identified KDP Kings as having **zero tutor skills** — the biggest quality gap across all 7 plugins. Target plugin composition calls for 2-4 tutors.

### 4a. first-book-walkthrough (Tutor)
- **What it teaches:** Complete first-book process in 7 phases: business model, niche validation, keywords/title, outline/manuscript, cover/formatting, upload/listing, launch
- **How it teaches:** Each phase explains the concept, applies it to the user's actual book using decision skills, and produces a deliverable before advancing
- **References used:** 10 framework articles, all 10 decision skills
- **Why it matters:** First-time publishers are the largest audience segment. This skill turns "where do I start?" into a structured learning path that uses the existing skills as tools.

### 4b. pricing-masterclass (Tutor)
- **What it teaches:** Complete pricing system in 5 lessons: royalty math, pricing psychology (Hormozi), format anchoring, tactical pricing (pulsing/hotshotting/countdown), platform strategy (exclusive vs. wide)
- **How it teaches:** Each lesson explains one concept, applies it to the user's book with calculations, then checks understanding before advancing
- **References used:** pricing-decision-matrix.md, pricing-psychology-hormozi.md, offer-naming-for-book-titles-hormozi.md, wide-vs-exclusive.md
- **Why it matters:** pricing-strategist gives you a number. This skill teaches you why that number is right, so you can make pricing decisions independently.

### 4c. launch-bootcamp (Tutor)
- **What it teaches:** Launch strategy in 4 lessons: review engine, free promo + 99-cent economics, Amazon Ads basics, content amplification (GaryVee pyramid)
- **How it teaches:** Each lesson teaches strategic logic (not just checklist steps), applies to the user's timeline, and includes "check understanding" questions
- **References used:** 30-day-launch-sequence.md, amazon-ads-setup.md, content-pyramid-book-launches-garyvee.md, pricing-decision-matrix.md
- **Why it matters:** launch-sequence gives you a checklist. This skill teaches you to diagnose when the checklist isn't working.

---

## 5. Router Updated

Added tutor skills to `ask-kdp` routing table:

| User Intent | Route To |
|-------------|----------|
| "I want to publish my first book" / total beginner | `first-book-walkthrough` |
| "Teach me pricing" / deep pricing understanding | `pricing-masterclass` |
| "Teach me how to launch" / launch strategy | `launch-bootcamp` |

---

## 6. Post-Audit State

### Skills: 12 -> 15
| Type | Before | After |
|------|--------|-------|
| Decision | 10 | 10 |
| Tutor | **0** | **3** |
| Utility | 1 | 1 |
| Router | 1 | 1 |
| **Total** | **12** | **15** |

### Framework Articles: 16 -> 19
| Category | Before | After |
|----------|--------|-------|
| KDP-native | 16 | 16 |
| Cross-pollination (Hormozi) | 0 | 1 (offer naming) |
| Cross-pollination (GaryVee) | 0 | 1 (content pyramid) |
| Cross-pollination (Neil Patel) | 0 | 1 (Amazon SEO) |
| **Total** | **16** | **19** |

Note: `pricing-psychology-hormozi.md` was already in the count (written by enrichment agent) but was an orphan. Now wired.

### Orphans: 1 -> 0
- `pricing-psychology-hormozi.md`: RESOLVED (wired to pricing-strategist + book-architect)

### Plugin CLAUDE.md Updated
- Skill count: 12 -> 15
- Article count: 15 -> 18 (CLAUDE.md counted 15 before; actual was 16 with the Hormozi orphan; now 19 including 3 new)
- Tutor skill section added to Quick Start

---

## 7. Remaining Gaps (Future Work)

1. **Indexes not built** — topic index, technique index, guest index would improve ask-kdp routing
2. **No coaching skills** — could build a "KDP business review" coaching skill that diagnoses underperforming catalogs
3. **Companion book not updated** — the book references 12 skills; should reference 15
4. **Plugin.json missing** — no `.claude-plugin/plugin.json` manifest (needed for marketplace)
