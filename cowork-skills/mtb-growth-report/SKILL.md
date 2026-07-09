---
name: mtb-growth-report
description: Weekly one-page growth KPI memo for misstheboat.app pulling Google Search Console and GA4 data. Runs every Friday or when the user says "growth report" or "how's the site doing."
---

# MTB Weekly Growth Report

## KPIs (report all, week-over-week)
1. GSC: indexed pages, impressions, clicks, avg position, top 10 queries, top 10 pages.
2. GA4: sessions by channel — Organic, Direct, Referral, and the custom AI channel group (chatgpt.com, claude.ai, perplexity.ai, gemini.google.com, copilot.microsoft.com).
3. Activation: own_trip, sample_trip, board_tap event counts; activation rate = (own_trip + sample_trip) / sessions.
4. share_click and affiliate_click counts.
5. Bounce rate and avg engagement time.

## Format
One page, conclusions first: 3-bullet "what changed" up top, then the KPI table with WoW deltas, then one recommended action for next week. Short declarative sentences. Flag anything anomalous (indexing drops, a page suddenly ranking, an AI referral spike) with the likely cause.

## Rules
- If GSC/GA4 access isn't connected, say so explicitly and list what's missing — never estimate or fabricate metrics.
- 90-day targets for context: 250+ indexed pages, 2,000 organic sessions/mo, 40%+ activation rate, +10 referring domains.
