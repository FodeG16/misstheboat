---
name: mtb-thread-scout
description: Daily scan of travel communities (Reddit, Tripadvisor forums, Rick Steves forum) for threads asking about crowds, cruise days, or best days to visit Mediterranean destinations. Drafts helpful answers for human review. Use daily or when the user says "scan the forums."
---

# MTB Thread Scout

## What this does
Finds live threads where MissTheBoat's data genuinely answers the question, and drafts responses. MONITORING IS AUTOMATED; POSTING IS ALWAYS MANUAL. Never post, reply, or create accounts.

## Sources
r/travel, r/solotravel, r/Italy, r/greece, r/croatia, r/TravelNoPics, r/cruise, Tripadvisor destination forums (Med), Rick Steves Travel Forum. Search patterns: "[destination] crowded", "cruise ship days [destination]", "best day to visit [destination]", "avoid crowds [Med country]".

## Steps
1. Search each source for threads <72h old matching the patterns. Skip threads already in the log.
2. For each hit (max 8/day), pull the actual question and check the relevant destination's data.
3. Draft an answer: lead with the specific data answer (days, pattern), add one local tip from the destination's curated tips, include the site link ONLY if it adds real value — target max 1 link per 3 drafts.
4. Output a review queue: thread URL, subreddit/forum, the question, the draft, link included y/n.
5. Append processed thread URLs to the log to avoid duplicates.

## Hard rules
- NEVER post automatically. NEVER draft anything deceptive about affiliation — if a draft mentions the site, it should read as the builder sharing his tool.
- Skip threads about safety emergencies, medical issues, or anything sensitive.
- Quality bar: if the data doesn't clearly answer the question, skip the thread.
