# scenario-3-ads-landing-pages · 03-qa-and-launch · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-08 · the site contact form (new site) restyled for the dark site

**Done**: GHL **Contact (new site)** `DCNQTSgl14CNZ93H7Fi3` (in every Invitation chapter since seq 36) carried
only the no-shift block and GoHighLevel's default white styling. Its Custom CSS now holds the no-shift block
followed by [`code/ghl-form-contact-dark.css`](./code/ghl-form-contact-dark.css): the campaign block plus
rules for the Service dropdown (vue-multiselect: `.multi_select_form`, `__tags`, `__placeholder[class]`,
`__input`, the options list) and a higher-specificity placeholder rule. Previewed first by injecting the block
into the public form on `#0C0C0B` at 554 and 312 (headless Chrome), then pasted and saved.

| Gate | Result |
| :-- | :-- |
| `check-ghl-form.mjs --standard --origin --legal --location` | ok: save-exit off, redirect /thank-you, consent 11/11, location ok |
| public form rendered on the dark ground, 554 + 312 | inputs transparent / cream / Manrope 16px, labels 11px uppercase #B5AFA4, dropdown transparent, consent 13px, button text #11110F |
| embed on the live `/contact` at 1440 and 390 | one frame, 100% of its card (521/521, 310/310), no clipping ancestor, height 1106→1115 and 1267→1276 (≤9px settle) |

**Gotchas**
- **Codex lost the builder twice** ("Chrome's background connection disconnecting", then "repeated browser
  timeouts"): the GoHighLevel form builder is a cross-origin iframe whose renderer stalls under keystroke bursts.
  Done with Claude in Chrome (the house fallback) instead: a 7 KB `type` into the CSS editor froze the frame for
  good (every later click timed out, a fresh tab too until the page reloaded). **What works: put the block on the
  clipboard (`Set-Clipboard`) and paste it with ctrl+v as one edit**, then the form's own Save. GHL re-indents
  the paste; that is fine.
- **The Custom CSS is served BEFORE GHL's runtime styles**, so an injected-style preview (which lands last) can
  pass where the saved block loses: GHL's `#_builder-form .form-builder--item .multiselect .multiselect__placeholder
  { background-color:#fff }` out-ranked the dark placeholder rule and the "Select a service" text sat on a white
  box. Match GHL's specificity plus `[class]` for anything GHL styles with four compound parts.
- Turnstile shows "Please complete the challenge" on the bare public form in headless Chrome (automation only).

## 2026-10-07 (late) · BugHerd #29-#34 (Alejandro's QA): hero top-aligned, pins that fit; published seq 33-34

Tasks (project 541030, all on /ads-landing-pages/3-on-6, "apply to the rest of the landing pages"):
- #33 (hero text centred, below the fold);
- #29, #31, #32 (options / method / rooms: "the sticky animation cuts the actual content");
- #34 (scope note).

**Causes**
- Hero: `.lp-hero-in` centred the copy against the ~1,000px form column, so the kicker started at
  336-396px and the buttons sat below the fold at every desktop size.
- Pins (two stacked causes):
  1. the GHL iframe grows ~100px after ScrollTrigger measures the page, so every pin started late
     and sat ~100px down the screen (`ScrollTrigger.refresh()` moved the pin from 111px to 9px);
  2. the three panels were taller than the screen anyway: Options 250-480px over from 1366 to
     1920 wide, because the fluid root grows type above 1440.

**Done**
- `css/60-lp.css` "review round 2", ad pages only, desktop:
  - the landing and thank-you heroes hang from the top;
  - pinned panels are tighter (padding, h2 capped at 6.2svh, card spacing, method photo height);
  - rail cards are sized from the viewport height;
  - `.is-flow` rules for a chapter shown un-pinned.
- `js/72-lp-pins.js` (live as `src/scripts/wla-lp-pins.js`), `.is-lp` only: refreshes
  ScrollTrigger when the page height changes; a pinned panel whose content still exceeds the
  viewport is un-pinned (trigger killed, end state set, `.is-flow`).
- The thank-you copy no longer says "new-patient line" (the ads show the main line since DNI):
  note, closing CTA and SEO description, both thank-you pages (seq 34).

**Proof** (live, both landing pages, `pin-fit` at 1920x934, 1920x1080, 1680x945, 1536x864,
1440x900, 1366x768, 2560x1305):
- hero kicker at 127-163px, buttons above the fold at every size;
- every pinned chapter pins at the top and its content ends inside the screen;
- 1366x768 shows Options and/or Space un-pinned, complete.
- Every page diffed: seq 33 added one script tag; seq 34 changed only the two thank-you pages.

## 2026-10-07 (night) · every practice film on Vimeo, site-wide; published seq 32

**Done**
- Six more films were uploaded into the West LA Implants Vimeo folder through Codex. Titles,
  descriptions with the westlaimplants.com link, and privacy were set by API:
  - welcome `1233869447`
  - experience `1233869449`
  - guided `1233869448`
  - technology `1233869451`
  - cosmetic `1233869511`
  - wisdom `1233869516`
- The folder now holds nine films.
- **Not re-hosted:** `DKuc8WTQ3yM` "Straight Talk About Crooked Teeth" belongs to **Invisalign's**
  channel, not the practice's. It keeps its YouTube link on /results.
- `workflows/21-instatic-upload/apply-films-vimeo.mjs --apply --publish` made three changes:
  - 38 film links on 20 pages now point at Vimeo, written per node against each row's seq;
  - `wla-films.js` refreshed with the nine-film map;
  - embed-origins `frameOrigins += https://player.vimeo.com`, so the lightbox also works on pages
    without an Embed block.
- `insta-api` restored the `seoTitle`/`seoDescription` cells the save dropped on 19 pages. Compared
  with the backup, all 20 pages' non-body cells are identical.
- Source: `FILMS.*.vimeo` for all nine, `filmHref()` in `videos()` and the page actions, and the
  three hard-coded homepage links in `index.html`. The build now carries one YouTube watch link
  (Invisalign).
- Proof: all 87 pages diffed before/after. The only changes are film links and the CSP
  `frame-src`. The live lightbox opens on /our-practice (strict CSP) and /results with no CSP
  refusal; Esc closes it.

**Decided (user, 2026-10-07):** the GHL form redirects and conversion URLs stay on the Railway
host for now. Once the site is published to production and approved, change each campaign form's
redirect (and `combo.json` `productionOrigin`).

## 2026-10-07 (evening) · the patient films on Vimeo, played on the page; published seq 31

**Done**
- The three films (Leslie `nH1ST1jo8WQ`, Emily `4skcfz94ZS4`, Michael `SDVe8k_zQUE`) were
  downloaded from the practice's YouTube channel at 1080p (`yt-dlp`). They were uploaded into the
  agency team account (owner `user248712727`), new folder **West LA Implants**
  (`vimeo.com/user/248712727/folder/30817251`). Leslie is `1233866645`, Emily `1233866646`,
  Michael `1233866644`.
- Titles and descriptions were set by API, each description linking to https://westlaimplants.com/.
  Privacy copies Livewell: public, embed anywhere, no download.
- `js/75-films.js` (live as `src/scripts/wla-films.js`) opens any film link in a lightbox with the
  Vimeo player. It works on pages whose CSP frames Vimeo (the four with an Embed block); elsewhere
  the link opens Vimeo in a new tab. Its CSS is in `css/03-runtime.css` (refreshed into
  `wla-lp-review.css`).
- `apply-lp-review.mjs` pointed the 14 film links on the four film pages at Vimeo. The 81 other
  pages changed only by the new script tag.
- Source: `FILMS.<key>.vimeo` + `filmHref()` in `lib/site.mjs`, used by `stories()` and the journey
  link.
- Live test (puppeteer, 1440): click a film card → same URL, lightbox open, iframe 1120×630, no CSP
  refusal; Esc closes and removes the iframe. Vimeo API: Emily and Michael `available`,
  `is_playable`; Leslie was still `transcoding` at publish time.

**Gotchas**
- **The Vimeo API token cannot upload into the team account** ("This app can only upload to the
  app owner's account"), even with an Admin role. It CAN edit team videos (PATCH name,
  description, privacy). Upload goes through the browser.
- **Codex needs "Allow access to file URLs"** on the ChatGPT extension (`chrome://extensions`) to
  hand a local file to an upload input. Claude in Chrome's `file_upload` is capped at 10 MB and only
  takes files shared with the session.
- **The upload route has several stops:**
  - the Vimeo role had to be Admin (Contributor cannot make a top-level folder);
  - Vimeo must be signed in in Chrome;
  - an open extension popup on the page makes Chrome refuse automation;
  - Vimeo may show a human verification.
- The organic pages' other nine films (library, page links) are still on YouTube. The site-wide
  script retargets only the three it knows.

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
1. ~~Vimeo~~: done the same evening (seq 31, entry above).
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
