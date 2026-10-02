## 2026-10-02: QA report of 2026-09-28 — every Web Dev item fixed. PUBLISHED AND VERIFIED (production + staging)

QA's website-qa package for drnahlah.com (crawl of 2026-09-28, 78 pages, 15 device profiles) is in
`01-content-intake/.tmp/website-qa-drnahlah.com-2026-09-28-export/`. It is QA's file, **left exactly
as received** (it was edited by mistake first and restored byte-for-byte: report.html sha256
`7d1490961900…`). This run fixed everything in it that needed no client decision.

**Result:** `22-instatic-api-sync/audit-qa-fixes.cjs` renders every sitemap page in Chrome and
re-measures QA's checks: **81/81 clean**. axe 4.10 (`axe-live.cjs`), after the animations settle: the
15 pages checked are clean at desktop and mobile. `check-pool-scope`: 99 URLs, 0 failing.
`audit-live-sedation`: 0 hits.

### Done (commits on bk-dr-nahlah)

| Commit | What |
| :--- | :--- |
| `8e0bb121` | Template, all 59 rows + `cta-offices`: footer titles h4→h2, drawer titles h4→p, `#drawer` **inert** while closed (site.js toggles it), footer addresses = Google Maps **directions** links, every Directions button `maps/search`→`maps/dir`, `/contact` gets its h1, home credentials h4→h3. `push-qa-template-fixes.mjs`, `verify-qa-template-fixes.mjs` (computed styles identical to before). |
| `606f162d` `db924306` | sitemap + `/five-year-warranty`, `/hipaa-disclosure` (worker script re-upload); **apple-touch-icon** 180×180 declared from seo-head.js (`push-touch-icon.mjs`); Cloudflare Web Analytics switched off (`disable-cf-web-analytics.mjs`; needs `enabled:false`, see gotchas). |
| `d150b25b` | `push-copy-fixes.mjs` (all seven copy stores, text only) + `copy-fixes-qa-1`: US spelling, Jones Branch Drive / Duke Street, Dr. Esam Nahlah, All-on-4 (11 variants), financing numbers as `(800) 677-0718`, /veneers FAQ heading, /doctor-referral + /emergency-dentistry sentences, "our doctors," in 16 posts. `copy-fixes-qa-2`: 16 page + 42 post titles ≤60, 13 descriptions ≤160, own descriptions for /five-year-warranty and /our-team. |
| `8770b5f9` | `copy-fixes-qa-3`: 95 grammar fixes in 31 posts, 11 broken headings, 4 headlines, 2 search descriptions, both `[contact-form-7]` shortcodes → "Request a consultation" link. |
| `284c37e3` | axe: SplitText `aria:'none'`; unwritten "reality" words .2→.66 ink; `.sv-no` → `--accent`; review iframe titled; gallery count opacity .9; whitening table th→td + focusable region; post template inner `<main>`/`<aside>` → div; `.lc-head p a` underlined. `push-qa-a11y-fixes.mjs`. |
| `079d7bbe` | /posts grid: `.bl-grid::after` filler closes the last row (no grey block). |
| `c96a11dc` | Home hero film 9.2 MB → 2.8 MB (1600px CRF 28 faststart), `push-hero-video.mjs`. |
| `f647e56e` | `/contact-maclean`, `/privacy-policy-maclean`, `/terms-of-service-maclean` → `-mclean`; links, seo-head keys, OG + aeo re-keyed (`push-mclean-rename.mjs`); 6 rows appended to the `drnahlah_301` Bulk Redirect list + sitemap (`14-…/add-mclean-redirects.mjs`). Old → 301 → new, query kept. |
| `6e432b76` | A 1200×630 share image for all 81 pages (`make-og-images.py` face-aware crops, `push-og-images.mjs`); **open-graph 1.1.2 → 1.2.3** on both hosts via `plugins.mjs rollout` (posts no longer unfurl as the template: `og:url /post`, "Article \| …"). |
| `202ccf42` | Local source in step: `04-design/.tmp/retarget-qa-copy.mjs` (page HTML text, seo.json values in place, posts.json from the live rows). |
| `a3f87b20` | seo-head.js no longer overwrites the plugin's og:image (`push-seo-head-ogimage.mjs`); `copy-fixes-qa-4` (last two descriptions, /thank-you title); `audit-qa-fixes.cjs`. |

QA's tool was wrong about three things (tell QA/CS, do not "fix"): the **home Vimeo error** is Vimeo's
bot check on automated browsers (the film plays; public; agency account); the **home header
"differs"** is the chapter read-out by design; the **home "broken image"** is the service-hover
preview. Its screenshot-join artefacts and cookie-banner overlaps are not site defects either.

### Next — waiting on CS / the client (QA's decisions, untouched here)

1. McLean phone: Google shows (571) 702-9900, the site (703) 448-3312.
2. Legal pages: entity name, Virginia not Texas (incl. Fort Bend County courts), SMS marketing or
   not, Grand Mission's phone/email/domain still in the four office pages, duplicated SMS paragraph,
   stray "=". Regenerate all four once CS answers.
3. GA/GTM + Facebook pixel HIPAA sign-off.
4. "Dental Group of Tysons" in 14 posts (+ 2 post descriptions kept it).
5. `/video-library`: keep or drop.
6. "&" vs "and" in the practice name (29 pages).
7. Repeated photos; "Six people sat down on camera" (seven named).

### Gotchas

- **Cloudflare Web Analytics: `auto_install:false` does not stop injection.** The beacon kept
  arriving for 25 min. Off = `auto_install:true` + `enabled:false`. Curl never shows it: the edge
  injects only for browser-like requests.
- **The Cloudflare token now 403s on zone Workers Routes.** Script upload, Bulk Redirect lists and
  RUM still work. `deploy-worker.mjs --script-only`. A new route is a dashboard job.
- **`deploy-worker.mjs` used to list `/robots.txt`**, the route that once replaced Cloudflare's
  content-signals robots. Removed from the list.
- **A renamed Instatic page gets no redirect** (404, tested). 301s go in `drnahlah_301`.
- **seo-head.js writes og:image at runtime** from "the largest image". Anything that runs scripts
  saw that instead of the plugin's card until `push-seo-head-ogimage.mjs`.
- **Posts' static OG needed open-graph ≥1.2.2**: entries are matched by document title, and ours
  render the SEO title.
- **The rendered CSS is the style registry**, not `site.css` (not linked). Change both.
- **seo.json has mixed indentation** — edit values in place; posts.json is Python-written (1-space,
  `\uXXXX`). `retarget-qa-copy.mjs` does both.
- **Token guard in push-copy-fixes**: a word with trailing punctuation ("All-On-Four.") once read
  as a slug; fixed. Rules are text-only; `raw:true` for post-body HTML; `only(store, where, key)`.
- Git Bash turns a `/` argument into `C:/Program Files/Git/`: `MSYS_NO_PATHCONV=1`.
- `assets.mjs push --from .` scans all 19 checkouts (2.8 GB). The new hero is in
  `site-src/assets/hero.mp4` and the live media library, **not yet in R2**.

## Version Control

Tracked with the repo; see [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
