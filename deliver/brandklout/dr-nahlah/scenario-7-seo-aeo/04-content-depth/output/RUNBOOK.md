# scenario-7-seo-aeo · 04-content-depth · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-08 — dentures hub FAQ on STAGING; the rest of step 04 waits on the team and the practice

**Done**
- Brief `output/briefs/implant-supported-dentures.md`, then a 7-question FAQ (`#faq`, after `#cost`)
  on `/implant-supported-dentures`: snap-in dentures named on the hub for the first time ("snap in
  dentures" 6.3K/month), Autocomplete's "cost" and "vs All-on-4" answered. Every answer uses facts
  the site already states (the brief lists where). `output/code/push-page-faq.mjs` + its spec
  `faq-implant-supported-dentures.json`; schema rebuilt (FAQPage 15 → 16), SCHEMA CLEAN; keyword gate
  unchanged (1016 / 1, the held `/our-facility`). Screenshots `output/assets/review/isd-faq-*.png`.

**Not done, and why**
- Gap pages (full-mouth implants, dentures, cost pages, full-mouth reconstruction, same-day teeth,
  explainers) and the office versions of the money pages are **new URLs**: held until the team has
  reviewed the sitemap proposal (the user's rule).
- Deeper money-page sections (candidacy, recovery, risks, alternatives) need facts the practice
  confirms; nothing medical is invented. Ask the practice, then brief each page as above.
- Same-day teeth: a page only if the practice confirms it offers it (gap #8).

**Next**
1. Practice sign-off on every staging copy change (office pages, FAQs, H1s, titles) before production.
2. After the sitemap review: gap pages in the gap report's order, a brief each.
3. The same FAQ treatment for pages with none, once their facts are listed: `/smile-makeover`,
   `/crowns-and-bridges`, `/cosmetic-dentistry` (spec + `push-page-faq.mjs`).

**Gotchas**
- `push-page-faq.mjs` refuses a page that already has a section with the spec's id: pick a new id
  (`faq` is free on most pages; the office pages and home use `local-faq`).

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
