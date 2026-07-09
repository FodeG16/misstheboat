# MissTheBoat — CLAUDE.md (Session State)
Last updated: July 9, 2026 — SEO/GEO launch push (via direct git push from Claude sandbox)

## What this project is
misstheboat.app — cruise-crowd forecasts for the Mediterranean. Single-page app (index.html) + 294 static SEO pages, deployed on Vercel via GitHub auto-deploy (repo: FodeG16/misstheboat, domain attached).

## Repo layout
| Path | What it is |
|---|---|
| index.html | The app. Contains DESTS (~224 destinations), PORTS (~66), scoreStop() engine. SINGLE SOURCE OF TRUTH for data. |
| destinations/, ports/, methodology/ | 294 generated static SEO pages. NEVER edit by hand — regenerate. |
| build/generate.js | Page generator. Reads DESTS/PORTS/scoreStop headlessly from index.html. Run `node build/generate.js` from repo root after any data change, then commit. |
| assets/pages.css | Shared stylesheet for generated pages (DM Serif/DM Sans, white/green — matches app). |
| sitemap.xml, robots.txt, llms.txt | SEO/GEO plumbing. robots.txt = split policy: search/user-fetch crawlers allowed, training crawlers (GPTBot, CCBot, Google-Extended, ClaudeBot) blocked. Don't change policy without Greg's approval. |
| og-image.png | 1200x630 social share card (hero + live board). Regenerate if hero design changes. |
| api/ (parse.js, schedule.js, value.js) | Vercel serverless functions (AI itinerary parsing etc.). Untouched this session. |
| cowork-skills/ | 5 SKILL.md files for the MTB-Growth Cowork project (page-generator, crowd-report, thread-scout, data-story, growth-report). |
| docs/DEPLOY.md | Deploy + post-deploy runbook. |

## CRITICAL: DESTS insertion rule (from prior sessions)
Always insert new DESTS entries **before** the `};` closing DESTS. Never insert after the REGIONS comment — breaks syntax every time.

## CRITICAL: vercel.json
The old catch-all rewrite `/(.*) -> /index.html` was REMOVED July 9, 2026 — it made all static pages unreachable. Do not re-add it. Share links use URL hash (#) so the app never needed it. api/ functions serve natively.

## Completed (this session, July 9)
- ✅ Landing redesign: live "cruise pressure" hero board (6 marquee spots, real scoreStop data, sorted worst-first, tappable), 4 one-tap sample trip chips, input demoted below divider. Original DM Serif/DM Sans white/green design language retained.
- ✅ GA4 events: sample_trip, board_tap, own_trip (activation event, fires in runAnalysis). Property G-LCQ0RJ1LR6 on all pages.
- ✅ 294 static pages generated: 224 destination crowd calendars, 66 port patterns, 2 country-grouped indexes, methodology, all with FAQ/Breadcrumb schema, answer-first blocks, "seasonal estimates" labeling, internal linking.
- ✅ sitemap.xml (294 URLs), robots.txt (split crawler policy), llms.txt, canonical tags.
- ✅ og-image.png generated (was missing since April P0 list — meta tags referenced a nonexistent file).
- ✅ OG/twitter meta fixed to misstheboat.app (was vercel.app).
- ✅ Growth plan finalized: programmatic SEO + GEO + weekly crowd report + quarterly PR data story (PRIMARY SOURCES ONLY — port authority/MedCruise throughput ÷ census; never pitch modeled figures to press) + community thread scouting (monitoring automated, posting ALWAYS manual).

## NEXT STEPS — priority order
1. **[GREG — same day as deploy]** GSC: verify misstheboat.app (Google Analytics method = one click), submit sitemap.xml, Request Indexing on 5 key URLs. Bing Webmaster: Import from GSC. GA4: create "AI Assistants" channel group (regex chatgpt\.com|claude\.ai|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com, ordered above Referral); mark own_trip as key event.
2. **[GREG]** Set up MTB-Growth Cowork project with the 5 skills in cowork-skills/. Schedule: daily thread-scout, Mon crowd-report, Fri growth-report, monthly page-generator, quarterly data-story.
3. **[NEXT SESSION]** Run mtb-data-story within 2 weeks — peak Med season + overtourism news cycle now.
4. **[NEXT]** Weekly crowd report page template (/reports/) — first run creates the pattern.
5. **[NEXT]** share_click + affiliate_click GA4 events (15 min).
6. **[NEXT]** Email capture block on homepage (needs Buttondown/Beehiiv account first).
7. **[LATER]** Per-page OG chart images; Tier 2 best-time pages; Tier 3 month pages only after Tier 1 shows GSC impressions.
8. **[LATER]** V2 live AIS data via server-side API (first genuinely proprietary layer); Discover Cars ID still PENDING; GYG API token still pending.

## Known bugs / watchlist (carried from prior sessions)
- Bug 4 (phantom Kotor card) — unconfirmed, needs re-test
- Hotels/VRBO links static, not city-specific

## Cross-chat reconciliation (July 9, second push)
- A parallel chat ("MTB growth plan execution") produced llms.txt, methodology copy, and a Cowork skills spec. Reconciled here: methodology page now carries the verified model documentation (asymptotic curve 100x(1-e^(-ratio/40)), 70/30 blend, 99 cap, day-trip boost tiers, CruiseDig same-day supplement via api/schedule.js, population-placeholder disclosure) — all claims checked against scoreStop/calcPressureScore before publishing. llms.txt upgraded to the richer version.
- SETTLED CONVENTIONS: /destinations/[slug]/ directories (not .html); weekly report at /report/[week]/. The other chat's spec used [slug].html — superseded.
- DISCREPANCY FLAG: other chat's spec says ~236 destinations; live repo has 224. If that chat holds unpushed data additions, it must PULL this repo before pushing — never push an older index.html over this deploy.
- RULE: one chat pushes at a time. This repo's CLAUDE.md is the coordination point — every session reads it first.
- generate.js ROOT path fixed (was pointing at a site/ subfolder that only existed in the build sandbox — would have broken the first monthly Cowork regeneration).

## Session notes
- Greg now has a direct-push workflow: Claude sandbox clones with a fine-grained PAT (Contents: R/W, misstheboat only), commits, pushes; Vercel auto-deploys. Old manual-upload workflow retired. Rotate/revoke the PAT after each session batch; issue fresh for monthly regeneration.
- Greg is non-technical: explain every terminal step explicitly.
- SEO expectations set: near-zero organic movement for 8–12 weeks post-indexing; impressions before clicks; ~30–100 pages indexed in week 1, full set 2–6 weeks.
- Update this file at the end of each session.
