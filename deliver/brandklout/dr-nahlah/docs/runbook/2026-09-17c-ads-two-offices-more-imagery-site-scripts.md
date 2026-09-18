# 2026-09-17c — ads landing pages: two offices, more imagery on more grounds, the four site tags

Third pass on the ads landing pages, on three asks from Brandklout: more photography in
sections of different colours without the pages getting less efficient at converting; one
set of pages per office (Alexandria and Tysons Corner), each with its own LeadConnector
forms; and the scripts they supplied in
`workflows/00-client-delivery-initialization/.tmp/iframes.html` (six form embeds, Google Tag
Manager, the LeadConnector number pool and Termly). Still local, still not on Instatic.

## Done (`{{SHA}}`)

### Eighteen pages from nine bodies

The nine page bodies are now templates. `build-site.mjs` carries a `LOCATIONS` table (both
offices: name, address, both telephone lines, maps link, and the three campaign form ids
per office) and every ads entry in `PAGES` names a `body`, a `loc` and a `campaign`. The
slug carries the office, because the GHL redirect and the Ads conversion have to name it:

| Campaign | Alexandria | Tysons Corner |
| :--- | :--- | :--- |
| All-on-4 | `ads-alexandria-all-on-4`, `-consultation`, `-thank-you` | `ads-tysons-all-on-4`, `-consultation`, `-thank-you` |
| Dental implants | `ads-alexandria-dental-implants`, … | `ads-tysons-dental-implants`, … |
| Porcelain veneers | `ads-alexandria-veneers`, … | `ads-tysons-veneers`, … |

The old nine `ads-<campaign>` outputs are removed. What changes per office: the trust-strip
location line, the header and rail telephone, the hero chapter tag, the form and its note,
every "Call" button, the office panels (the campaign's office first, flagged "The office this
campaign books at"), the footer columns, and the seo title. Tokens are `{{LOC_*}}`,
`{{OTHER_*}}`, `{{LOC_FORM}}` and `{{LOC_OFFICES}}`; the build throws on any token left
unfilled. New partials: `lp-form.html` (the vendor embed, once), `lp-office.html` (one panel,
rendered twice per page) and `site-scripts.html`.

### The real forms, per office and per campaign

| | All-on-4 | Dental implants | Veneers |
| :--- | :--- | :--- | :--- |
| Alexandria | `8jq7yzSeCzZrIkuA3sSG` | `9i1Vz7wQjmn7v4NPwp3o` | `if9TqDr0uPYPs2Hiz3vr` |
| Tysons Corner | `d1IIoFqitmgu2zBvvmfw` | `ecngxD8mVLN8RZQBuzfm` | `o3KMlkYo1PxmoPpzZqwz` |

Each landing page and its consultation page carry the same form. The placeholder McLean
contact form is gone from every page, and so is the placeholder warning in the page comments.
**The redirect is still a LeadConnector setting**: each form has to send its visitor to
`/ads-<office>-<campaign>-thank-you`, and nothing in this repository can prove it does.

### More imagery, more grounds, no new sections

Every photograph was dropped INTO a section that already existed; the CTA count and the page
order are unchanged. On each landing page:

- **Stakes** gained a photograph between the two lists (`.lp-stakes.has-fig`): Stephen with
  his own before-photograph on All-on-4, Yolanda with hers on implants, a finished case on
  veneers.
- **CTA 1** is the ink band with a photograph behind it (`.lp-cta.has-fig`); **CTA 2** is
  deep gold (`.lp-cta.is-gold`), so the two bands on a page are not the same block twice.
- **Films** (and the veneers "closer" mosaic) sit on black via `data-theme="dark"`.
- **The process rail** has a photograph per step (`.lp-step-fig`).
- **Money** carries the team photograph as a wide figure above the lenders (`.lp-wide`).
- **The FAQ** sits beside a portrait of Dr. Nahlah (`.lp-faq-grid`), also on the
  consultation pages.
- **The closer** is photo-backed and dark (`.lp-final`, `data-theme="dark"`), with the office
  panels re-tokened for the dark ground.

A landing page now cycles cream, white, gold-wash, black, ink-with-photo, deep gold and the
photo-backed closer. Local image counts per landing page went 26 / 28 / 25 → 35 / 37 / 33,
with no byte-level repeat on any of the eighteen pages (logo excluded). All new CSS is in
`css/70-landing.css` under `lp-` names; nothing was restated from another stylesheet.

### The four site tags, on every page

`partials/site-scripts.html` is injected into `head.html` on all 55 pages, in the house
order: **Termly first (`autoBlock=off`)**, then GTM `GTM-MR7K64XD`, then the LeadConnector
number pool and session script. The GTM `<noscript>` goes straight after `<body>`. Termly
runs with autoBlock off because on these pages the blocker would hold back the GHL form and
the YouTube films until consent, which is the whole page. All four URLs answered 200 on
2026-09-17; none of the four was on the live site before this.

The inline-script gate in `site-test.mjs` now exempts a `<script>` carrying
`data-site-script`, and only that. An inline script in a page body still fails.

## Verified

| Gate | Result |
| :--- | :--- |
| `site-test.mjs`, all 55 pages, alone | **927/930.** Zero failures on any of the eighteen ads pages, and zero new failures on the 37 editorial pages now carrying the four site tags (no console errors from Termly, GTM or LeadConnector). |
| `fluid-qa.mjs`, the eighteen at 360/390/768/991/1280/1440/1920 | **270/270**, run in three batches (2 + 8 + 8) |
| `css-vocab.mjs` | 10 problems, all pre-existing, none naming `landing` |
| `check-page-lists.mjs` | all three page lists agree, 55 pages |
| per-page image repeats (bytes hashed, logo excluded) | 0 on all eighteen |
| tokens left unfilled in any built page | 0 (the build throws on one) |
| the four script URLs | all 200 from curl on 2026-09-17 |
| visual review, 1440, the three Alexandria landing pages | done by eye; two wrong photographs caught and swapped (see Gotchas) |

The same three pre-existing failures survive on `index` and `our-facility`; both files are
unmodified. **Run the browser gates one at a time.** Two fluid-qa batches and a site-test
in parallel starved each other: one batch timed out and site-test died on
`timeout Runtime.evaluate` at page 50; alone, both passed.

## Next

1. Review with Brandklout: the design, the office split, and which of the two variants each
   campaign points at.
2. **In LeadConnector**, set each of the six forms to redirect to its own thank-you page
   (`/ads-<office>-<campaign>-thank-you`). Cannot be verified from here.
3. In Google Ads, one destination-URL conversion per thank-you path (six), or GTM page-view
   triggers on `/ads-` + `-thank-you`.
4. Import the eighteen to Instatic (workflow 22). The four tags go into `siteScripts` there,
   not into page bodies, and the Instatic CSP has to allow `app.termly.io`,
   `www.googletagmanager.com` and `backend.leadconnectorhq.com` (see memory:
   Termly via siteScripts).
5. Ask the client for one filmed veneer patient and one photograph of the Alexandria office.

## Gotchas

- **The asset library's file names lie.** `Untitled-3.jpg` is the Tysons reception desk, not
  a patient; `Untitled-4.jpg` is a front-desk handshake, not sedation; `pt-hero-2.jpg` is
  Stephen with his before-photograph; `dr-and-yolanda.jpg` is Dr. Nahlah with Barbara. Two
  captions on the first build were wrong because of this. Look at the file before
  captioning it, every time.
- **No photograph in the library is identifiably the Alexandria office.** `homepage_hero.jpg`
  and `Untitled-3.jpg` show the "Dental Group of Tysons" sign; the practice-space AVIFs are
  unlabelled. The Alexandria variants therefore caption the mosaic "the same standard at
  both offices" and never name Tysons.
- **`site-test.mjs` with a page subset reports the footer's legal links as broken.** Its set
  of real pages is built from the subset, so `privacy-policy.html` and
  `terms-conditions.html` are "missing". Run it over the full site for the link check to
  mean anything.
- **`site-test.mjs` and `check-page-lists.mjs` read `PAGES` as text.** Generating the
  eighteen entries in a loop would have made them invisible to both gates; they are written
  out.
- **The stakes figure needs its own rule between 800 and 1039px**, where `.lp-stakes` is
  two columns: without `order:3; grid-column:span 2` the figure takes the second column and
  the after-list drops alone onto a second row.
- **`position:sticky` does nothing inside `#smooth-content`.** ScrollSmoother transforms it,
  and a sticky child sticks to the transformed ancestor. The FAQ portrait is plain
  `align-items:start`.
- **Bash heredocs halve backslashes here, even quoted.** A Python patch with `\\b` in a regex
  arrived as `\b` and the assertion failed silently on the wrong file. Write the patch to a
  `.py` file with the Write tool and run that.
- **The GHL forms render under headless Chrome on localhost this time** (the veneers form
  showed six fields and a submit in the `--nojs` capture). Do not rely on it; the Turnstile
  behaviour in the 2026-09-17 run is still the documented one.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
