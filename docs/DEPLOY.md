# MissTheBoat — Deployment Package

## What's in this zip

| Path | What it is |
|---|---|
| site/ | The complete deployable site: app (index.html) + 294 generated static pages |
| site/index.html | Your app, with the `own_trip` GA4 activation event added |
| site/destinations/ | 224 destination crowd-calendar pages + index |
| site/ports/ | 66 port pattern pages + index |
| site/methodology/ | Methodology page (Dataset schema, estimate disclosure) |
| site/sitemap.xml | 294 URLs |
| site/robots.txt | Split policy: search/user-fetch crawlers allowed, training crawlers blocked |
| site/llms.txt | AI-engine site summary |
| site/assets/pages.css | Shared stylesheet for generated pages |
| build/generate.js | The page generator — rerun any time data changes |
| cowork-skills/ | 5 SKILL.md files for the MTB-Growth Cowork project |

## Deploy (10 minutes)

1. Replace your repo contents with the `site/` folder contents (site/ becomes the repo root).
2. Add `build/generate.js` to the repo under `build/`.
3. Push. Vercel auto-deploys. Directory URLs (/destinations/santorini/) work on Vercel by default via index.html files — no config needed.
4. Verify live: misstheboat.app/destinations/santorini/, /sitemap.xml, /robots.txt, /methodology/.

## Post-deploy (Phase 0 — do the same day)

1. Google Search Console: verify misstheboat.app, submit https://misstheboat.app/sitemap.xml.
2. Bing Webmaster Tools: same (Copilot grounds on Bing).
3. GA4: create the custom AI channel group (regex: chatgpt\.com|claude\.ai|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com), ordered above Referral.
4. GA4: confirm the own_trip event appears after you run an analysis on the live site.

## Regenerating pages

Any time you edit DESTS/PORTS in site/index.html:

    node build/generate.js

Then commit + push. The generator reads the data from index.html directly — one source of truth. This is the mtb-page-generator Cowork skill.

## Cowork setup

Create project "MTB-Growth", add the 5 skills from cowork-skills/, connect the repo folder, then schedule:
- Daily: mtb-thread-scout
- Mon: mtb-crowd-report
- Fri: mtb-growth-report (needs GSC + GA4 access connected)
- Monthly: mtb-page-generator
- Quarterly: mtb-data-story

## Known follow-ups (not blockers)

- OG images: generated pages use the site's default og-image.png. Per-page crowd-chart cards are the next upgrade (matters for social sharing and Pinterest, not for indexing).
- share_click / affiliate_click GA4 events are referenced in the growth report skill but not yet instrumented in the app — 15-minute add when ready.
- The email capture block on the homepage is not built yet (needs a Buttondown/Beehiiv account first).
