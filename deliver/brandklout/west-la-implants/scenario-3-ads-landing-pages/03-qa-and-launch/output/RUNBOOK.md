# scenario-3-ads-landing-pages · 03-qa-and-launch · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-07 (later) · DNI live, form notifications on, 3-on-6 consent; published seq 30

**Done**
- **GHL (Codex):** the 3-on-6 form's marketing consent ends with "Consent is not a condition of
  purchase." too (both forms now). **Email notification turned on** for both campaign forms. It was
  off, so campaign leads reached no one. The recipients copy the WordPress Contact Form
  (`BAZZebJdjQAdGkda1fEE`): noreply@westlaimplants.com, westlaimplants@gmail.com,
  jessica@thrivesquare.com. Subject is "Website Form Submission". Redirects unchanged.
- **DNI.** The sub-account has one pool, *West LA Implants Tracking Pool* (`AOlbqr2yJc0FxkJ9yUFR`,
  4 numbers, active). It swaps the MAIN line (310) 481-0111. The ads showed the new-patient line
  (310) 692-9316, which no pool swaps. **User's choice: the ads show 481-0111.**
  1. embed-origins 1.6.0 → 1.8.0 (`tools/instatic-plugins/plugins.mjs rollout … --no-staging-ok
     --apply --publish`, all six settings kept). The republish left all 87 pages byte-identical.
  2. `workflows/21-instatic-upload/apply-lp-dni.mjs --apply --publish` patched the six ad pages:
     every `(310) 692-9316`, `tel:+13106929316` and the JSON-LD telephone now carry 481-0111. It
     added two `siteScripts` lines, the pool and `user_session.js`, both
     `#pages=ads-landing-pages/*`. It added `services.leadconnectorhq.com` and
     `services.msgsndr.com` to `connectOrigins`. Source in step: `SITE.phoneAds`, `build.mjs`.
- `combo.json`: phone, tags and `pools` filled in.

| Gate | Result |
| :-- | :-- |
| `scripts/check-pool-scope.mjs --combo` | 7 URLs, 0 failing |
| all 87 pages, raw HTML | pool tag on exactly the six ad pages; the 81 others differ only in CSP `connect-src` (+2 GHL hosts) |
| `dni-proof.mjs --relay` (all-on-6 → consultation → thank-you → 3-on-6, one visitor) | **swapping**: every `(310) 481-0111` and `tel:+13104810111` → `(424) 766-4171`, sticky across pages, thank-you page (strict CSP) included |

**Next**
1. Vimeo: the three films are downloaded; Vimeo asked for a human verification, so the upload
   (into a "West LA Implants" folder in the agency team account) and the in-page player
   (`js/75-films.js`, IDs still placeholders) wait on it.
2. One real test lead per campaign to confirm the notification email arrives.
3. Conversion tags (no GTM on the instance).

**Gotchas**
- Three GHL tabs from earlier Codex runs stay locked to their dead sessions and no later run can
  close them (form builder 3-on-6, workflows "3. Appt No Show" and "6. Stale Leads"). Close them
  by hand. The wrapper on main now also closes tabs that a click opened (`8fd80d12`).
- The "West LA Implants - Contact (new site)" form (`DCNQTSgl14CNZ93H7Fi3`, another session's) has
  email notification **off** too.

## 2026-10-07 · Brandklout review round 1 (Gauge, 2026-10-06): fixes live, published seq 29

Review notes: Asana `1219174341490192` (3-on-6) and `1219174341490190` / parent `1218513737115127`
(All-on-6). Screenshots were pulled with `deliver/scripts/asana-context.mjs --task <gid>`.

**Done, live** (`workflows/21-instatic-upload/apply-lp-review.mjs --apply --publish`, a surgical
edit of the live draft: two new shell code assets + six ad pages, written against each row's seq;
backup `21-instatic-upload/.tmp/backup-2026-10-07-pre-lp-review/`):

| Note | Cause | Fix |
| :-- | :-- | :-- |
| "Super hard to read" (journey beats, option cards) | Bodoni Moda at opsz 28 below 2rem: hairlines; option rows 14px muted | `.is-lp` small serifs take opsz 11 / 600; option rows body size, full ink (`css/60-lp.css` readability block, shipped as `src/styles/wla-lp-review.css`) |
| Blurry images | Instatic's `sizes="auto, 100vw"` asks for a variant as wide as the BOX; landscape photos cropped into portrait boxes were upscaled 2–2.6x. The case photos were 300px files | `js/70-sizes.js` (shipped as `src/scripts/wla-sharp-crops.js`) sets `sizes` to the width the cover crop needs; Leslie / Emily / Michael before-after now the WordPress `_large` 600px originals; thank-you 3-on-6 hero 800px → 2000px `front-desk-emily.jpg` |
| Accessibility widget covers the mobile call bar | Sienna's button sits at bottom 20px | `css/03-runtime.css`: above the bar wherever `.mobile-bar` shows (button 733–775px, bar from 783px at 390) |
| Social-preview image 404 | `data-seo` is base64, never rewritten `/media/` → `/uploads/` | `build-import-input.mjs` step 1a; the six ad pages patched live; `og:image` now 200 |
| Thank-you page must confirm an All-on-6 request | generic "Let's talk about your new smile" | kicker, h1 and lead name the campaign (3-on-6 too) |
| "Consent is not a condition of purchase" | not in the standard | added to the All-on-6 form's marketing box (Codex, verified in the public payload) and to the standard on main (`0aae2c3d`) |

Proof: all 87 pages snapshotted before and after (masked asset ids): the 81 untouched pages differ by
exactly one line, the new `wla-sharp-crops.js` tag. Live probe (real-pixel check, 1440 + 390@3x): no
soft image at 1440 on any of the six pages.

**Gotchas**
- `upload-media.mjs` has no dry run: any argument (even `--help`) uploads whatever is missing. Here
  it was harmless (six new photos), but never "check its flags" by running it.
- There is no `GET /admin/api/cms/media/:id` (405). Read an asset's alt from the media list (newest
  100 only) or from the published HTML.
- The thank-you pages carry the strict CSP (no Embed block): an inline test script is refused there,
  so a puppeteer probe that injects code needs `page.setBypassCSP(true)`. The shipped site.js loads
  from `'self'` and is unaffected.
- `naturalWidth` lies under `srcset` + `sizes` (density-corrected). Decode `currentSrc` in a fresh
  `Image()` to measure real pixels.

## 2026-10-05 · the campaign forms restyled for the dark site (client: "they are white")

**Done**: on the live pages the first styling showed white single-line inputs (cream text on
white), a white 8px frame with a shadow, light text on the gold button, invisible asterisks, Inter
links. Causes: GHL's `!important` input rule out-ranks `#_builder-form input`; the Styles panel's
inline border/shadow on `#_builder-form`; a blanket `p` colour reaching the button's `<p>`. New block
[`code/ghl-form-dark.css`](./code/ghl-form-dark.css) (matches the site's `.in-fields`: 11px uppercase
`#B5AFA4` labels, transparent inputs with a hairline border, gold focus, gold asterisks and
checkboxes, 13px muted consent, near-black uppercase button), previewed by injecting it into the
public form on `#0B0B0A` at 554 and 312px, then pasted by Codex in place of the old block on both
forms. Checked in the live cards: `3-on-6` at 1440 and `all-on-6-consultation` at 390. Gate
`--standard --landing` ok on both. The contact form's WordPress block is
[`code/ghl-form-contact-wordpress.css`](./code/ghl-form-contact-wordpress.css). Redirects left on the
Railway host (client, 2026-10-05: early in the build).

**Gotcha**: `site-style --compare` printed "style ok" while the form was white on the page. Look at a
screenshot of the form in its card; the process note is in the ghl-forms README on main (`75391062`).

## 2026-10-05 · the campaign forms placed on the pages

**Done**: `workflows/21-instatic-upload/add-ghl-forms.mjs --apply --publish` swapped the `.lp-slot`
prototype on `all-on-6`, `all-on-6-consultation`, `3-on-6`, `3-on-6-consultation` for one Embed
block each (GHL vendor snippet, `.lp-slot .lp-form`, min-height 50rem), shell seq 25 → 28,
published 87 pages. Backup first: `21-instatic-upload/.tmp/backup-2026-10-05-pre-ghl-forms/`.

| Gate | Result |
| :-- | :-- |
| `scripts/verify-form.mjs --widths 1440,390` | **clean**: right form id on each of the four pages, full width (491/554px at 1440, 312px at 390), nothing clipped, thank-you pages have no form |
| `scripts/verify-combo-live.mjs` | forms and redirects ok; the 6 known "not noindex" lines only (runtime meta, see 2026-09-30 gotchas) |
| `check-ghl-form.mjs --combo` | ok, both |
| homepage reviews widget, `/hipaa-disclosure` | still there, 200 |

**Next**: a human look at each form inside its card on the live page, and one test lead per
campaign once the host is final; conversion tags; the ads host.

**Gotchas**
- `verify-form.mjs` reported 500–1,400px "clipped by div" on every page: the ancestor was GSAP
  ScrollSmoother's `#smooth-wrapper` (`position:fixed`, viewport-high, `overflow:hidden`), which the
  page scrolls inside. Fixed on main (`f5214c3f`): fixed ancestors are skipped.

## 2026-10-05 · the GHL forms: two campaign forms built, the contact form brought to standard

Built with Codex computer use (`codex_cu.mjs --allow-writes --model gpt-6.1-sol`) to the
standard in `deliver/process/tools/ghl-forms/README.md`, all in West LA's sub-account
`0iwrVBEYONV6VlSHSGH6`. Legal name in both consent boxes: **Tony Barriere Dental Corp DBA West LA
Implants** (first line of westlaimplants.com/privacy-policy/). Privacy | Terms link to
**westlaimplants.com** (`/privacy-policy/`, `/terms-of-service/`): the Railway instance has no
terms page and its privacy page is a draft that defers to the WordPress one.

| Form | Id | What it is | Gates |
| :-- | :-- | :-- | :-- |
| West LA Implants - All-on-6 (ChatGPT Ads) | `XaCEV96A0QuF9ufEmkSc` | new, from scratch. First / Last / Phone (required), Email, Message, 2 consent boxes, captcha, *Request Consultation*, links, 11 hidden consent fields last, no-shift CSS. Redirect `…/ads-landing-pages/thank-you-all-on-6` | `--standard --landing` ok, `--combo` ok, `site-style --compare` (all-on-6-consultation) **style ok** |
| West LA Implants - 3-on-6 (Google Search) | `P15UYHonJj8oH5G8xwKX` | same, redirect `…/thank-you-3-on-6` | same, style ok |
| Contact Form (live on westlaimplants.com/contact) | `BAZZebJdjQAdGkda1fEE` | existing, updated: new required **Service** dropdown (Dental Implants, All-on-4® Full-Arch Implants, Implant-Supported Dentures, Failing Dental Implants, Bone Grafting, Tooth Extractions, Porcelain Veneers, Invisalign, Teeth Whitening, General Dentistry, Periodontics, Other), save-and-exit off, 2 consent boxes, captcha, hide script deleted, no-shift CSS, on-submit message kept | `--standard` ok, `site-style --compare` (westlaimplants.com/contact/) **style ok**: Prompt, `#E4E436` button, transparent, 0px radii, both consent boxes 14px |

Campaign forms are styled to the dark ads pages (Manrope, cream on transparent, `#C4A36A` square
button): they look right only inside the page's dark card, not on the bare public form URL.
`combo.json` carries both form ids.

**Next**
1. Embed each campaign form on its landing and consultation page in place of the `lp-proto`
   prototype (Instatic Embed block, reserved height), push, publish; then `verify-form.mjs` at
   1440 and 390 and `verify-combo-live.mjs`.
2. A human look at each form on the live page (Turnstile hides it from automation) and one test lead
   per campaign once the host is final.
3. The redirects point at the Railway host. If the ads go to another host, change both redirects
   (and `productionOrigin`) first.
4. When the Instatic site replaces WordPress on westlaimplants.com, restyle the contact form to the
   dark site (it is styled for the white WordPress page now) and embed it on `/contact`.

**Gotchas**
- A blank GHL form ("Start from Scratch") already carries a consent element and Privacy | Terms
  text. A brief that says "build exactly these elements" stops on them as a deletion; say "keep and
  set" them.
- The first styling save on All-on-6 reported success but the CSS block never persisted (no
  `Manrope` in the public payload). Have Codex read the CSS box back before Save and grep the
  public form after. **The fix that worked twice** (All-on-6, contact): after pasting, click the
  Custom CSS editor's own Save / Apply / Done button first, reopen it to confirm, then Save the form.
  A read-back alone was not enough (the contact form's first styling run read it back and still lost it).
- GoHighLevel's public form endpoint answered 500 "Server Error" for every form for about a minute
  mid-session (Grand Mission's model form excepted). Retry before assuming a form was broken.

## 2026-09-30 · first QA pass on the published pages; launch is blocked on the forms

**Done** (`b9b96a5c`), all against `https://west-la-implants-production.up.railway.app`

| Gate | Result |
| :-- | :-- |
| `21-instatic-upload/verify-live.mjs` | clean: 86 routes, 507 URLs, 1283 asset references |
| `21-instatic-upload/css-parity.mjs` | clean: every declared property published |
| `08-qa/.tmp/check-local.mjs --base` (six ad pages, plus index, all-on-4, results; 1440 and 390) | clean: runtime armed, three pins that scrub on each landing page, no overflow at 390, one h1 |
| `output/code/lp-click.mjs` (new) | clean: seven booking CTAs per landing page go to its consultation page, FAQ opens, slider follows the pointer, the prototype form reaches the right thank-you page, thank-you has no form and a `tel:` link |
| `output/code/lp-head.mjs` (new) | clean: rendered `robots` is `noindex, follow`, canonical is the page itself |
| `scripts/probe-adblock.mjs` | clean on a filtering network: 11 foreign sheets, 0 elements hit |
| `scripts/verify-combo-live.mjs` | **12 failures, all expected**: 6 "not noindex" (see gotchas), 4 "form not on the page", 2 form payloads |
| `scripts/check-conversion.mjs` | **fails**: no Google tag reaches either thank-you page |
| `scripts/verify-form.mjs`, `check-ghl-form.mjs`, `dni-proof.mjs`, `check-pool-scope.mjs` | not run: no GHL form, no pool |

Visual pass: `output/code/lp-slices.mjs` (viewport slices, local or `--base`), looked at for the
All-on-6 combo at 1440, 768 and 390 and the 3-on-6 combo at 1440 and 390, local and published.

**Next**
1. Send Brandklout `ADS-LANDING-COMMENT.md` (the client folder root) on both Asana tasks.
2. Forms in, then: `verify-form.mjs` at 1440 and 390, `check-ghl-form.mjs --combo`, `verify-combo-live.mjs`.
3. Tags in, then `check-conversion.mjs`; a pool, then `dni-proof.mjs --relay` as one visitor.
4. A human test lead on the final host. Not done, and cannot be until 2 and 3 are.
5. 1920 and 2560 by eye: the gates stop at 1440.
6. The 3-on-6 consultation and thank-you pages at 768, and Safari, were not looked at.

**Gotchas**
- `verify-combo-live.mjs` is fetch-only and looks for a robots meta in the raw HTML or a `seo-head`
  route entry. This instance has neither plugin: the meta is written at runtime by `js/80-seo.js`.
  The six "not noindex" lines are the gate's blind spot, and `lp-head.mjs` is the check that sees it.
  A raw-HTML noindex needs the SEO head plugin installed on the instance (a launch task, not done).
- The published meta description on every page of this instance is the site-level one (upload
  trap 31). The per-page descriptions are in `seo.json` and unread until the open-graph plugin is in.
- The Termly banner covers the lower half of a phone screen until it is answered, the mobile bar
  included. Slices of the published pages show it; it is the site's existing behaviour.
- There is no `/sitemap.xml` and no `/robots.txt` on this instance (both 404).
- Gate logs (`output/*.log`) and slices (`output/assets/slices/`) are gitignored; re-run to see them.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
