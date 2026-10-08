# scenario-7-seo-aeo · 03-office-pages · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-08 — both office pages on their current URLs, STAGING only

URLs unchanged (`/contact-mclean`, `/contact-alexandria`) until the team answers the URL question;
no office service pages yet (new URLs = sitemap change, held for the same review).

**Done**
- **Photos:** the practice's Drive folders "Office pics" are the **Alexandria** office (matched to the
  Alexandria Google profile cover, IMG_3090; same 2025-09-24 shoot). Eight resized by
  `output/code/prep-photos.py` into `output/assets/alexandria/` (gitignored, R2), uploaded with alt text.
- **`output/code/push-office-pages.mjs`** (both pages, one incremental save, full read-back):
  hero headline/lead per office, "Get directions" to the office's Maps listing (Alexandria hero photo
  = its own reception); the empty `#offices` section filled with the office's address, phones, hours
  and photo; Alexandria `#inside` gallery (5 interior photos); `#local-faq` (5 questions each, FAQPage
  on the next schema build); `#next` = six treatments, described differently per office.
- **`output/code/push-office-twins.mjs`:** the two pages shared 58.2%. Each `#book` now lists only
  its own office's phones; Alexandria's booking and "before you come" blocks and McLean's new FAQ and
  bullets reworded (same facts). **Overlap 23.0%: CLEAN** (`twins.txt`; production 98.2%, untouched).
- Schema rebuilt and pushed (departments' `url` already the office pages; towns per department).
  Keyword gate: both office rows pass. Screenshots: `output/assets/review/` (1440, some 390).

**Next**
1. Team: URLs (keep or move to `/<city>/` with 301s), then the office service pages (sitemap change).
2. McLean interior photos from the practice (McLean has only the lounge and the building); McLean's
   "Before you come" uses a stock consultation photo until then.
3. Business Profiles' website links → the office pages (needs profile access and the user's yes).
4. Production after the review: `push-office-pages.mjs`, then `push-office-twins.mjs`, then schema.
   The photos upload to production on that run (staging upload paths differ).

**Gotchas**
- The overlap gate counts the site-wide menu drawer (a `div#drawer`, not `nav`/`header`/`footer`):
  107 shared shingles on every pair, ~20% of a 530-word page. Twins have to differ nearly everywhere
  else; `#book` and "before you come" were the big shared blocks.
- Landmarks need a source: the first draft named nearby buildings from general knowledge; they were
  cut. Only the site, the practice and its Google profiles are sources.
- The Alexandria `#visiting` image was McLean's building; the contact pages had swapped photos.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
