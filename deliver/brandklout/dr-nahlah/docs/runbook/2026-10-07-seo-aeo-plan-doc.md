# 2026-10-07 — SEO & AEO plan doc (Trong's review), nothing changed on the site

## Done

- **Plan doc** "Dr. Nahlah — SEO & AEO Plan" (Claude Docs, private until shared):
  https://claude.ai/code/artifact/877a645f-bf8a-4797-bab0-31d6412b4cbf — three tabs: the plan,
  **Keyword map** (draft, no volumes), **Schema template** (Trong's example, valid JSON). It turns the
  2026-10-06 meeting with Trong Huynh (DriveRank) into ten sections: why, keywords + competitor gaps,
  keyword H1s (19 pages drafted), title/description/alt rules, AEO schema diff, content page by page,
  locations, a 4-phase rollout with 3 gates, process integration, open questions.
- **Live audit** (81 sitemap URLs): every page has a title (43–60 chars) and a description (126–160),
  no image lacks alt; 11/38 pages have a keyword H1; JSON-LD is 15–41 KB per page (home 32 KB, 93 nodes);
  service pages carry 500–1,100 words of body copy.
- **Trong's schema** came from the Teams chat "Trong Huynh" (2026-10-06 20:27). It is the live
  JSON-LD of lakenonadentist.com (Makris Dental, Orlando): 14.7 KB, 4 top-level nodes. Ours is already
  a superset; what it has that we lack: a home-page FAQPage of 7 local questions, 13 cities in
  `areaServed` (ours 6), answers naming office + city + phone, `email`, documented awards/memberships.
- **Competitor research** (16 location-set Google searches via Codex in Chrome, ~220 Autocomplete
  suggestions, 20 competitor crawls, page-overlap scores): drnahlah is **#1 for "prosthodontist mclean va"
  and "prosthodontist alexandria va", #4 for "prosthodontist northern virginia", and outside the top 7–9
  for every implant / All-on-4 / denture / veneer / full-mouth search checked** (Ads show on two of them).
  Winners write one page per office city; the best two-office competitor
  (dentalcareofalexandriaandmclean.com) shares 5.5% text between twins and ranks in both cities.
- Evidence saved in `workflows/06-content-seo/.tmp/2026-10-07-seo-aeo-research/` (schema template,
  live audit + script, Google SERP log, Autocomplete checks, page overlap, competitor summary).

## Next

1. The team reviews the doc; agree the keyword map (gate 1) before any copy changes.
2. Get search volumes: the Ahrefs key is a trial with 0 units; DriveRank tools, an Ahrefs upgrade, or
   Keyword Planner in the practice's Google Ads account.
3. Then phase 2 (keyword H1s on 19 pages, titles/descriptions/alts from the map, home local FAQ +
   wider `areaServed`), staging first.
4. Process change on `main` (keyword step + gates) only after the plan is agreed.

## Gotchas

- **"Chang" in the user's dictation is Trong.** No Chang chat exists in Teams.
- **A JSON-LD copied out of Teams does not parse:** Teams turns the closing quote of link-like URLs into
  `%22`. Use the live page (`trong-schema-template.json` here).
- **Codex cannot read Teams web**: its background tab stays blank on teams.cloud.microsoft. Claude in
  Chrome works (foreground tab, ~40 s to load). Its JS output is capped near 1 KB and blocks text with
  URL query strings, so verify long text by hash against a fetched copy instead of chunking it out.
- **Ahrefs API v3 returns 403 "Insufficient plan" on every data endpoint** with the shared key.
- Google blocked the IP after ~16 automated searches in Chrome (CAPTCHA, then 403): batch searches,
  don't loop.
- `/contact-alexandria` shows the McLean building (7901 Jones Branch Drive) photo; `/thank-you` is in
  the sitemap. Both flagged in the doc, not fixed.
