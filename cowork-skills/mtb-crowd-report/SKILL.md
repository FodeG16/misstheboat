---
name: mtb-crowd-report
description: Generate the weekly "Med Crowd Report" for misstheboat.app — the 5 worst and 5 best Mediterranean destinations for the week ahead, plus social post drafts and an email issue draft. Runs every Monday or when the user says "run the crowd report."
---

# MTB Weekly Crowd Report

## What this does
Scores all destinations for the 7 days ahead using the app's scoring model (same headless-load pattern as build/generate.js), ranks by average pressure, and produces a report page + distribution drafts. NOTHING auto-publishes — all outputs go to a review queue.

## Steps
1. Load DESTS/PORTS/scoreStop headlessly from site/index.html.
2. For each destination, average pressureScore across the next 7 days. Rank.
3. Generate /reports/[YYYY-WW]/index.html using the shared pages.css chrome: top-5 avoid (with worst day + est. ships), top-5 clear, 3 "surprise" picks (normally busy places with a quiet window this week). Label every figure "seasonal estimate."
4. Add the new report URL to sitemap.xml.
5. Draft: (a) one X post (<280 chars, lead with the single most striking number), (b) one Instagram caption, (c) one Pinterest pin description, (d) one email issue (subject + 150-word body + link).
6. Output everything to the review queue folder. Do not post, do not send, do not push without approval.

## Voice rules
Short declarative sentences. Specific numbers over adjectives. No hashtag spam (max 2). No AI-sounding language ("delve," "vibrant," "hidden gem" are banned).
