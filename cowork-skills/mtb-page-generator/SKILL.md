---
name: mtb-page-generator
description: Regenerate misstheboat.app's static SEO pages (destinations, ports, methodology, sitemap, robots.txt, llms.txt) from the app's DESTS/PORTS dataset. Use monthly, after any dataset edit, or when the user says "refresh the pages," "rebuild the site pages," or "update the sitemap."
---

# MTB Page Generator

## What this does
Runs `node build/generate.js` in the misstheboat repo. The script reads DESTS/PORTS/scoreStop directly from site/index.html (single source of truth) and regenerates ~294 static pages + sitemap.xml + robots.txt + llms.txt.

## Steps
1. Pull latest repo state.
2. Run `node build/generate.js`. Confirm the output line reports expected counts (~224 destinations, ~66 ports).
3. Spot-check 2 random destination pages: canonical present, JSON-LD parses, answer block reads sensibly, "seasonal estimates" labeling present.
4. Verify sitemap.xml is valid XML and URL count matches page count + 4.
5. Commit with message "chore: regenerate static pages [date]" and push. Vercel auto-deploys.
6. Report: pages generated, any destinations that failed scoring, deploy status.

## URL conventions (settled July 9 — do not change)
- Destination pages: /destinations/[slug]/ (directory + index.html), NOT [slug].html. Live in sitemap; changing breaks 294 indexed URLs.
- Port pages: /ports/[slug]/. Weekly reports: /report/[week]/.
- Per-page OG chart images: planned upgrade, not yet built — pages use /og-image.png.
- For future TEMPLATE changes (not data refreshes): generate a 15-20 page pilot batch as a PR for Greg to spot-check before regenerating the full set.

## Rules
- Never edit DESTS/PORTS data inside this skill — data changes are a separate, human-reviewed task.
- If the generator errors, do NOT push. Report the error and stop.
- Do not modify robots.txt policy (crawler allow/block list) without explicit approval — flag proposed changes instead.
