# Runbook — bk-stone-med-spa

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Objective

**Stone Med Spa**, the third and last pillar of Dr. Mona Stone's practice. The other two are the
implant centre (live on Webflow) and Stone Surgical Arts (twelve pages, published to Instatic
2026-09-02, in the `bk-stone` worktree). This worktree owns the med spa and nothing else.

Start at [`docs/project-overview.md`](../deliver/brandklout/stone-med-spa/docs/project-overview.md).

## Status: PUBLISHED — 27 pages live at <https://westlaketxmedspa.com>

**2026-10-09, latest — phase 2 Client-First STRUCTURE on STAGING (seq 37 → 39), production untouched.** Every rem spacing value that equals a house step now reads its Framework token (`var(--space-*)`: 223 values, 10% → 41% of spacing on tokens; the 416 off-scale values wait for step C, a visible snap the user decides) and three contextual overrides of role classes became combo classes on the elements: `button is-navbar` (navbar CTA, hidden ≤767), `text-style-display-accent is-cover` (green accent in every cover title), `button is-doors` (the three door buttons on /treatments). Map `05-instatic-upload/class-standard/combo-map.json`. Proven: css parity 0 real at 1440/390/1920 after A and after B, runtime parity OK before → after, head 0 of 27. The local source and `final-site` carry the same tokens and combos (`class-sync-check` clean). **Mind:** 2 overrides stay (`.names_card.is-here .button.is-link`, refused: specificity), and the centred containers' auto margins read 0 in about one capture in three — [run](./runbook/2026-10-08-phase2-structure.md).

**2026-10-08 — the home "Our treatments" shelf shows every card whole on phones**, production published (staging draft only). Below 767px the accordion is gone: four open 4:3 cards in a grid (two columns from ~600px), a darker mobile scrim (name ≥4.3:1, meta ≥5.9:1), and the first tap follows the link. New `05-instatic-upload/fix-shelf-mobile.mjs` and gate `site-src/shelf-test.mjs` (FAIL none live; `verify-live` FAIL none). **Mind:** the first publish broke the home motion for ~5 minutes — `String.replace` rewrote `$$(` to `$(` (trap 43); string-level bundle patches use split/join — [run](./runbook/2026-10-08-shelf-cards-open-on-mobile.md).

**2026-10-01 — the footer links HIPAA Disclosure**, right after Privacy Policy, on all 27 pages of staging and production. It was written by the new `add-hipaa-footer-link.mjs` (the footer is inlined per page, and there is no component), and is also in `site-src/partials/footer.html`. Every page is otherwise identical, and the link is native at 1440 and 390. **Mind:** the source now links a page that is not in site-src, so after a full push, re-run `add-hipaa-page.mjs` — [run](./runbook/2026-10-01-hipaa-footer-link.md).

**2026-10-01 — `/hipaa-disclosure` is LIVE, staging and production.** The HHS model Notice of Privacy Practices, the same text as the Webflow sites, built by the new `05-instatic-upload/add-hipaa-page.mjs` as a clone of this instance's `/privacy-policy` (same hero, aside and classes). It was an injection, not a push: both `{"publishedPages":27}`, shell seqs unchanged, and the other 26 production pages are byte-identical apart from per-publish tokens. **Flagged:** no legal entity on the site, so it says "Westlake Medical Aesthetics"; no email; not in the sitemap; no footer link (the footer has a legal row). **Mind:** a full `push-site.mjs` deletes this page, so re-run `add-hipaa-page.mjs --apply --publish` after one — [run](./runbook/2026-10-01-hipaa-disclosure-page.md).

**2026-10-01 — the review panels have breathing room, and the site has a FAVICON, staging and production.** The white panels around the Google reviews widget (`.words_reviews`, `.wall_reviews`) get 48px of padding top and bottom (about 30px on phones). The tab icon is the WA monogram on charcoal, cut by `make-logo.py` and set through **`brandklout.open-graph` 1.2.3**, now installed on both instances (a house default it was missing). That plugin also brings og/twitter tags, a canonical and **per-page meta descriptions**. New `set-favicon.mjs`. Staging seq 24, production seq 28, `{"publishedPages":26}`; commit `b8a9a12d` (not pushed); plugin verify `ok`, `verify-live` and `sienna-test` `FAIL none`. Open: aeo-schema (JSON-LD) still not installed — [run](./runbook/2026-10-01-review-panel-padding-and-favicon.md).

**2026-10-01 — the "different navigation size" on the home page is FIXED, staging and production.** The Sienna accessibility widget (async, unpinned) sometimes ran before the page CSS and pinned 131–516 text elements at the browser's 16px inline: nav links 16px instead of 12px, the home `h1` 32px instead of ~124px, on whichever page lost the race. The new `site-src/js/01-sienna.js` re-reads the true sizes once CSS applies and drops Sienna's inline sizes (a visitor's own scale is kept). Shipped with the new `swap-site-js.mjs`, which swaps only the bundle in the shell asset: staging seq 23, production seq 27, both `{"publishedPages":26}`. Commit `cff40aad` (not pushed). The new gate `sienna-test.mjs` reports `FAIL none` on both, and so does `verify-live`. BugHerd: no new tasks or comments; #10/#73 are still blocked. **Mind:** every other gate blocks Sienna (trap 42), and the other Sienna sites carry the same race; the root fix belongs in the plugin, on main — [run](./runbook/2026-10-01-sienna-pinned-nav-size.md).

**2026-09-30 — the practice's Google reviews are LIVE on `/` and `/results`, staging and production.** The Elfsight widget for the med spa's own listing (#110B, 5.0 from 15) replaced both static quote rails and their arrows; each sits in a white panel (`.words_reviews`, `.wall_reviews`) with a text link where the arrows were. Written by the new `05-instatic-upload/add-elfsight-reviews.mjs` (incremental, backed up, re-runnable); the source pages carry the slot and `push-site.mjs` knows the `google-reviews` key, so a full re-push keeps it. Commit `7ef14428` (not pushed). Staging seq 22, production seq 26, both `{"publishedPages":26}`; verified rendering at 442px with the listing's reviews in headless and real Chrome. **Mind:** production's validator wants `children: []` on every hand-made node (staging's does not); the pre-widget API snapshots were overwritten by the second run (nearest earlier: the 2026-09-29 utilities backups); the widget shows reviewer names and the owner's/family's reviews, which the 2026-09-15 hand-pick left out — [run](./runbook/2026-09-30-elfsight-google-reviews-live.md).

**2026-09-29, latest — PRODUCTION CAUGHT UP: 26 pages, 14 treatments, each with its own page.** Botox | Xeomin and Dysport & Jeuveau split into Botox, Xeomin, Dysport and Jeuveau pages; production (was 13 pages, 2026-09-18) now carries both BugHerd rounds, #15 and the split, with Termly, Sienna and the GHL pool intact; sitemap 25 URLs. Staging and production match. Open: BugHerd #10, #73 — [run](./runbook/2026-09-29-one-page-per-product-and-production.md).

**2026-09-29, latest — BugHerd round 2 on STAGING.** The client filed 45 more tasks (#43–#87) on production 2026-09-28. All on staging except **#10** (Abby/Brooke photos, Canva only) and **#73** (GHL form colours, a GHL setting): the client's AdobeStock photos, address **#110B** and new hours (Wed 9–3, Fri 9–4, weekends closed) site-wide, a Treatments dropdown, concern chips as links with hover descriptions, every FAQ question naming its subject, before-and-after placeholders and the doctor filmstrip hidden. **84 of 86 BugHerd tasks marked done** with a scope reply each. Production is still at 2026-09-18 and needs a go for rounds 1 + 2 — [run](./runbook/2026-09-29-bugherd-round-2-on-staging.md).

**2026-09-23, latest — phone is (817) 674-2061**, the display number, on production (seq 21) and
staging (seq 16). **The med spa's own GHL number pool (`vHDCe45MFTjdydJul0cd`) is live on production
since 2026-09-24** and swaps that number in the browser with no consent needed; staging has no pool
(`set-dni-pool.mjs --pool` refuses it) — [run](./runbook/2026-09-24-dni-pool-installed.md).

**2026-09-24, later — BugHerd #15 on staging:** the /team strip's treatment-room frame is the client's Drive photo (upscaled 2× with Freepik precision; the creative Magnific upscale invented detail and was rejected). BugHerd has no new tasks or comments. **39 of 41 now on staging and marked done in BugHerd**; #9/#10 need Abby's and Brooke's photos exported from Canva — they are not on Drive. Production still awaits a go — [run](./runbook/2026-09-24-bugherd-15-treatment-room.md).

**2026-09-23 — the client's BugHerd pass is on STAGING, not production.** 41 tasks on production
(BugHerd project 540569): 38 applied on `https://staging.westlaketxmedspa.com` (seq 13, **24
pages** — eleven new treatment pages generated from `treatment-pages.mjs`), 3 waiting on Drive
auth for photos (#9, #10, #15). Address is now **#110b**. Production still needs a go, then a
sitemap redeploy. **No JSON-LD reaches the live site** (pre-existing) —
[run](./runbook/2026-09-23-bugherd-pass-on-staging.md).

**2026-09-18, latest — the logo is LIVE on production.** `https://westlaketxmedspa.com` is
**seq 14, 13 pages, 76 media**. Promotion was not a re-push of the staging payload: a new media
asset mints its own `/uploads/<nanoid>-<name>` on each instance, so production got
`upload-media.mjs` against itself first and a payload rebuilt from its own map (checked: zero
staging ids in it). Gates all clean — and one of them lied on the way: **`form-test.mjs` said the
GHL frame never attached, three runs out of three, on a booking form that was working**. It read
`pg.frames()` straight after the `<iframe>` element appeared, and the vendor puts a Turnstile
challenge in front of the navigation; it polls for 45s now. **`seq` advancing is the push, not the
publish** — the publish silently no-op'd once on a bad relative path while seq had already moved,
so check the live HTML —
[run](./runbook/2026-09-18-logo-on-production.md).

**2026-09-18 — the practice has a logo.** The site had carried a
text wordmark since it was built, because no logo file existed. Asana `1218408530306234` ("Update
logo", assigned to us 2026-09-11) had one all along, attached to a task **outside** the slug
`asana-context.mjs stone-med-spa` pulls — which is why that command reports "attachments: none
anywhere" and means nothing. `site-src/make-logo.py` lifts the artwork off its black ground by
unpremultiplying rather than keying (the glow survives; recompositing matches the original to
1/255) and cuts four files: a **row** lockup for the navbar and drawer, a full **stack** for the
footer, each in a light-type and a dark-ink variant. Staging is **seq 10, 13 pages, 76 media**.
Two things worth carrying forward: the navbar's logo pair is **stacked and cross-faded, never
toggled with `display`** — Instatic makes every image lazy and `sizes="auto"` measures the rendered
box, so a hidden one is neither fetched nor sized (trap 39) — and `all-pages.mjs` now runs **five
widths**, which caught a navbar clip at 992–1007 that **predates the logo by two weeks** —
[run](./runbook/2026-09-18-logo-on-staging.md).

**2026-09-17 — the practice's Go High Level form is live on /book.** It replaced the inert
local form, travelling as a `brandklout.embed-origins` Embed block because Instatic's importer
publishes a third-party iframe as an empty div. Only /book gets the widened CSP. The production
consent bridge appends the visitor's `privacy_*` values to the frame URL. Both legal pages now
name LeadConnector and carry a **Text messages** section, because the form collects SMS consent.
New gate `form-test.mjs`. Production seq 13, staging seq 8. **Two things the client must fix inside
GHL:** the consent text names **Stone Surgical PLLC**, and the form's own Privacy/Terms links point
at `example.com` —
[run](./runbook/2026-09-17-ghl-form-embedded.md).

**2026-09-17 — the drag rails' arrows never worked, and now do.** A client report ("the
sliders buttons don't work") found that no arrow on the home reviews, /about's rooms or /results'
reviews had ever been bound: `data-drag-scope` sat on the section head, which is a *sibling* of the
rail, so the `closest()` lookup in `20-motion.js` found nothing. Fixed in the JS and the markup,
with a new click gate `site-src/drag-test.mjs` (3/3). Production is seq 12 and staging seq 6,
both `{"publishedPages":13}` and `verify-live` FAIL none. **Every existing gate had been green on
this for two weeks — none of them clicks anything** —
[run](./runbook/2026-09-17-drag-rail-arrows-never-bound.md).

**2026-09-17 — EVERYTHING WENT TO PRODUCTION.** Production was eleven pages behind and
the push is a whole-site replace, so the client's Asana feedback, the teammate's web dev brief pass
and the two new legal pages all went live together: 13 pages, seq 11, `{"publishedPages":13}`.
Gates: `verify-live` FAIL none (13 routes, **13/13 distinct titles** — the duplicate `<title>` from
the 2026-09-12 admin edit is gone), `css-parity` FAIL none, `compare-live` 4 trap-30 findings.
The sitemap was rebuilt and redeployed (12 URLs) and the Cloudflare token revoked. **Open:** the
legal pages still need the client's review, the legal entity name and a contact email; the Cherry
link, the "Dr. Stone injects" contradiction and the wallet question are now live unresolved; submit
the sitemap in Search Console —
[run](./runbook/2026-09-17-production-push.md).

**2026-09-17 — Privacy Policy and Terms of Service, built and first published to staging.** `/privacy-policy`
and `/terms-of-service` are adapted from the implant centre's pages, without its SMS program and
without its PLLC. The footer's legal links now point to them, and the SMS Terms link is gone.
Staging has 13 pages. **Open:** the client or their counsel reviews both pages, and supplies the
legal entity name and a contact email. Then production, and add both slugs to the sitemap —
[run](./runbook/2026-09-17-legal-pages-on-staging.md).

**2026-09-15, later — the teammate's web dev brief is on STAGING too.** The phone is back to
**(817) 383-8361**, a tracking number (so the "918-3666" below is superseded). The menu order is
Injectables, Skin Rejuvenation, Facials, Restoration, with Sculptra under Biostimulators, and
skin boosters are HydraFacial add-ons. "Same building" and the three-names stack are gone from
/about. The membership discloses its signed agreement. Two real Google reviews replaced the
placeholders. **Held for the client:** the brief's "Dr. Stone injects" rules, which contradict the
Asana pass. Also open: how the wallet works, reviewer names, suite #110 or #110b —
[run](./runbook/2026-09-15-web-dev-brief-on-staging.md).

**2026-09-15, later — the client's feedback is on STAGING, not production.** Asana task
`1218408530306236` (ten subtasks) is applied to every page and published to
`https://staging.westlaketxmedspa.com`. The practice is now **Westlake Medical Aesthetics**. The
menu has 12 treatments in 4 categories, and the team is two people (Brooke NP injector, Abby
esthetician). There is one $149/month membership with a 90-day commitment and 30 days' notice.
Cherry is the primary lender, CareCredit sits alongside it, and the phone is (817) 918-3666.
**Dr. Stone does not assess or inject here**, and the copy says so. **Open:** the practice's own
Cherry apply link (the button goes to Cherry's generic site), then the client's review on staging,
then the same push to production —
[run](./runbook/2026-09-15-client-feedback-on-staging.md). Staging had no fonts until this run
(upload directive trap 35).

**2026-09-15 — staging and the sitemap.** Staging is `https://staging.westlaketxmedspa.com`
(admin `/admin`, same login as production). It is the Railway environment `staging`, seeded from
production (11/11 content-equivalent) and noindex at the edge. `/sitemap.xml` is live on the apex
and www, served by the Cloudflare Worker `westlaketxmedspa-sitemap` from
`workflows/06-cloudflare-sitemap/`. **Open:** every production page now shares one `<title>` after
an admin edit on 2026-09-12. Submit the sitemap in Search Console. There is still no canonical or
`og:url` —
[2026-09-15 run](./runbook/2026-09-15-staging-and-sitemap.md).

**2026-09-10 — domain cutover.** `westlaketxmedspa.com` (+ `www`) is connected and the admin is
`https://westlaketxmedspa.com/admin`. The old `stone-med-spa-production.up.railway.app` host was
**detached** by the cutover and 404s everywhere; everything below that names it is historical.
Users: the owner account and **Sang** (`sang@thrivesquare.com`, admin, same password as on Mason
Park). Republished the same evening: every link to Stone Surgical Arts (the footer switch, the
about button, the treatments door) now goes to `https://www.dfwsurgicalarts.com/`. The upload
scripts import `insta-api.mjs` from `deliver/process/22-instatic-api-sync/` —
[2026-09-10 run](./runbook/2026-09-10-domain-cutover-admin-origin-and-sang.md). **Still open:**
neither Stone site serves a canonical or `og:url`, so `seo.json` reaches nothing live. (The med
spa's sitemap was added 2026-09-15.)

**2026-09-04.** The brand has an Instatic instance of its own, provisioned name-first so the
generated host already carries the business name, and the second build is on it. Gates:
`verify-live` FAIL none (11 routes, 81 URLs, 166 asset references, 11/11 distinct titles) ·
**`css-parity` FAIL none** · **`visual-diff` ≤1.6% at 1440, ≤4.4% at 390**, all of it text
antialiasing and image re-encoding · `compare-live` 36 → 12 → 10 → **2**, and those are the noise
whose direction flips between runs (trap 30) · `console-live` clean on all eleven routes except
`/favicon.ico` 404 · `check-origins --all` exit 0 · local `audit` FAIL none · `all-pages` 132 clean ·
`menu-test` 9/9.

**The one visible gap is the favicon**: there is no logo or identity for this brand, so
`settings.faviconUrl` is deliberately unset and the browser tab shows a generic mark. It is one
field pointing at one uploaded asset the day a mark exists — see gotcha 29.

**This is the link to send for review**, and the admin is the same URL + `/admin`. Anyone can confirm the admin link is safe to send with
`node deliver/process/20-instatic-domain-origins/check-origins.mjs --all`.

## Cookie consent (Termly) — 2026-09-22

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Nothing fires before a visitor chooses. Account `stonesurgicalarts@brandklout.com`, website UUID
`1f62293e-6b6c-4599-95fa-b975654b6a3a`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_STONE_MED`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
