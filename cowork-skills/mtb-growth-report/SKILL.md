---
name: mtb-growth-report
description: Weekly one-page growth KPI memo for misstheboat.app pulling Google Search Console and GA4 data. Runs every Friday or when the user says "growth report" or "how's the site doing."
---

# MTB Weekly Growth Report

## KPIs (report all, week-over-week)
1. GSC: indexed pages, impressions, clicks, avg position, top 10 queries, top 10 pages.
2. GA4: sessions by channel — Organic, Direct, Referral, plus BOTH the native "AI Assistant" channel group (shipped May 2026, Admin > Attribution settings) AND the custom "AI Referrals" group. The custom group is the safety net: native misses Perplexity and doesn't reclassify history. Custom regex (session source, case-insensitive, ordered ABOVE Referral): ^(chatgpt\.com|chat\.openai\.com|claude\.ai|anthropic\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat|you\.com|poe\.com|character\.ai|meta\.ai|grok\.com|grok\.x\.ai) — review the list quarterly.
3. Funnel (same four numbers, same format, every week): Sessions by channel (flag AI Referrals separately); Activation rate = own_trip / sessions; Share rate = share_click / activations; Affiliate rate = affiliate_click / activations. Also report sample_trip and board_tap as leading indicators.
5. Bounce rate and avg engagement time.

## Format
One page, conclusions first: 3-bullet "what changed" up top, then the KPI table with WoW deltas, then one recommended action for next week. Short declarative sentences. Flag anything anomalous (indexing drops, a page suddenly ranking, an AI referral spike) with the likely cause.

## Rules
- If GSC/GA4 access isn't connected, say so explicitly and list what's missing — never estimate or fabricate metrics.
- 90-day targets for context: 250+ indexed pages, 2,000 organic sessions/mo, 40%+ activation rate, +10 referring domains.
