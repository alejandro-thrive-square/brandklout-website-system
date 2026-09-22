# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Where it stands

Fifty-two routes are built and published to Instatic, served from Railway at
**`https://www.dfwsurgicalarts.com`** (apex also serves) since 2026-09-10. The old
`stone-surgical-arts-production.up.railway.app` host was **detached** by that cutover and 404s —
any command below that still names it needs `INSTATIC_BASE_URL=https://www.dfwsurgicalarts.com`
instead.

**Admin:** `https://www.dfwsurgicalarts.com/admin`. Users: the owner account and **Sang**
(`sang@thrivesquare.com`, admin, same password as on Mason Park) —
[2026-09-10 run](./runbook/2026-09-10-domain-cutover-admin-origin-and-sang.md).

**Staging is ahead of production** since 2026-09-17: it carries 54 pages — the 52 published ones plus
`privacy-policy` and `terms-of-service` — and the booking page's request form is now the practice's
**Go High Level form**, placed as an Embed block by `21-instatic-upload/place-embeds.mjs`. That
script is a required step after every `push-site.mjs --apply`; without it the form publishes as an
empty div and no gate says so.

**Staging:** `https://staging.dfwsurgicalarts.com` (admin at `/admin`, same owner login, no Sang).
It is a Railway environment `staging` in the same project, seeded from production on
2026-09-15, and `noindex` at the edge. Work there, then promote with the staging-clone module;
never publish half-finished work on production, where one publish replaces every page —
[2026-09-15 run](./runbook/2026-09-15-301-map-built-and-staging-created.md).

**Old domain:** `stonesurgicalarts.com` still sends every URL to the new home page. The page-level
301 map is built and dry-run in `workflows/14-migration-seo-redirects/` but **not deployed**.

| | |
| :--- | :--- |
| Twelve practice pages | `/`, `/neck-lift`, `/blepharoplasty`, `/treatments`, `/meet-the-doctor`, `/about`, `/team`, `/memberships`, `/results`, `/book`, `/myellevate-neck-lift`, `/face-and-neck-lift` |
| The journal | `/blog` plus **39 articles**: 3 from the Wayback recovery on 2026-09-08, 36 more from the client's own site backup on 2026-09-09 |
| Eight retired routes | checked gone on every `verify-live` run |

The journal is the whole of the old site's archive. Content provenance, and the substantial list of
what was removed from the originals on the way in, is in
[`BLOG-CONTENT.md`](../workflows/04-design/.tmp/surgical-arts/BLOG-CONTENT.md). Read it before
editing any article: several of the removals are there for medico-legal reasons, not stylistic
ones.

The build lives in `workflows/04-design/.tmp/surgical-arts/` — author in `site-src/`, never in
`final-site/`, which `build-site.mjs` regenerates. The publish lives in
`workflows/21-instatic-upload/`.

## The gates

All three pass as of the 2026-09-09 BugHerd round. Run them in this order.

```bash
# 0. the journal data is sound, before anything is built from it
cd workflows/04-design/.tmp/surgical-arts/site-src
node blog-validate.mjs                 # add --check-refs to request every cited URL

# 1. the local build is internally sound
node build-site.mjs && node audit.mjs && node check-copy.mjs
node all-pages.mjs                     # 52 pages x 3 widths
node blog-test.mjs                     # 243 checks

# 2. the published routes are healthy and every asset resolves
cd workflows/21-instatic-upload && node verify-live.mjs                       # ends "FAIL  none"

# 3. the published pages still LOOK like the local build
INSTATIC_BASE_URL=https://www.dfwsurgicalarts.com \
  COMPARE_PORT=8851 node compare-live.mjs                                     # "no differences"
```

Point `INSTATIC_BASE_URL` at `https://staging.dfwsurgicalarts.com` to run gates 2 and 3 against
staging instead.

`verify-live.mjs` ends with the literal line `FAIL  none` when it passes. That is the footer, not a
failure — do not read the tail of the report and panic, as a previous session did.

`compare-live.mjs` **with scripts off is the gate.** `--runtime-layout` measures geometry with
scripts on and reports a known platform condition on every prose-heavy page: it is a diagnostic.
See trap 27. **`--shots` survives a full run now** — `capture()` closes both pages in a `finally`,
so one slow screenshot no longer leaks its pair and compounds into `Page.captureScreenshot timed
out`. A full 52-page run takes well over ten minutes; background it.

**One finding on `index` naming `is-* classes` / `is-current` is a race, not a defect.** It is the
IntersectionObserver in `surgeon()` picking a different `.surgeon_step` in the local and live
captures. `.surgeon_step` is the only `is-current` owner on the home page; re-run
`compare-live.mjs index` and it comes back clean. A finding naming any other class there is real.

## Traps

The long list — 29 of them, each one a defect that shipped or nearly shipped — is in
[`workflows/21-instatic-upload/21-instatic-upload.md`](../workflows/21-instatic-upload/21-instatic-upload.md).
Read it before any publish. The three that bite hardest:

- **Trap 26 — a `compare-live` finding can mean the LOCAL build is wrong.** If live looks *more*
  correct than local, check whether the losing rule is inside an `@media`; appending a base rule to
  the bottom of a stylesheet is the habit that causes it.
- **Trap 27 — the published page picks a different font instance once scripts run.** Prose sets
  ~0.6px narrower a line, which flips a paragraph that sits on a line-break boundary. Not fixable
  from this repository, and not a regression. `node font-instance-probe.mjs <slug>` confirms it.
- **Trap 16 — fonts have to go into Instatic's own library.** Instatic ignores `assets/fonts`
  entirely and serves `/uploads/fonts/...`. Never "fix" a font difference by overwriting the local
  files: `*.woff2` is gitignored, so there is no undo. Regenerate with
  `node site-src/get-fonts.mjs --force`.

More broadly: **a lot of `.tmp/` is untracked or gitignored** (`*.woff2`, `*.png`, `*.jpg`,
`*.webp`, `*.avif`). Run `git check-ignore -v <path>` before overwriting anything there.

## Next

- **Deploy the 301 map** once approved: `deploy-redirects.mjs --apply` with a scoped, short-lived
  token, then `verify-redirects.mjs` must end `FAIL  none`. The 19 skin and non-surgical URLs are
  `provisional` (they go to `/treatments`; nobody has decided otherwise). See
  [the directive](../workflows/14-migration-seo-redirects/14-migration-seo-redirects.md).
- **Promote the legal pages to production.** `privacy-policy` and `terms-of-service` (the SMS terms
  are its `#sms` section) are **published on staging** and gated clean there, and production still
  links its footer at the sister practice's policies. Promote once the text is approved —
  [2026-09-17 run](./runbook/2026-09-17-privacy-policy-and-terms-pages.md).
- **Production has no canonical tag and no `/sitemap.xml`**, and apex and www
  both answer 200. Each is a separate fix; none blocks the redirects.
- **BugHerd is GONE, removed 2026-09-09, and must not be re-added as a script.** It could never
  have worked: Instatic publishes `script-src 'self'; frame-src 'none'`, which blocks both the
  bugherd.com script and the sidebar's iframe, whether the tag sits in the head or is injected at
  runtime from `site.js`. The other client sites run an older Instatic that emits no CSP, which is
  why the same tag works there and is not evidence it will work here. Trap 29 has the diagnosis;
  it applies to **any** third-party script proposed next — analytics, chat, heatmaps.
- The journal has had no client review pass, and cannot have one through an in-page review tool on
  this instance. Use the BugHerd browser extension, or have Instatic relax the CSP.
- **EVERY FEE ON THE PUBLISHED SITE IS UNCONFIRMED.** Forty-four published fees across nine pages
  — consultation, surgical, skin, injectables, anaesthesia — all transcribed from the practice's
  own archived `/patient-resources/pricing` page, and **never re-confirmed by Dr. Stone**. Two
  independent copies of that page agree (a Wayback capture of 2026-03-16, and the client's own site
  backup), so the transcription is sound; what is unknown is whether the prices are still current.
  `SURGICAL-ARTS-BRIEF.md` has said "UNVERIFIED … must be re-confirmed before publishing" since
  intake, and the site published anyway. `treatments.html` carries the hedge in its own footer
  ("a guide while they are reconfirmed for 2026"), which is mitigation, not a fix. The list to send
  her is [`PRICING-CONFIRMATION.md`](./PRICING-CONFIRMATION.md); three items on it are conflicts
  rather than simple confirmations, and the membership tiers on it are our proposal, never a
  published price. **Nothing about fees should be edited from the archive again — the next change
  comes from Dr. Stone.**
- **The BugHerd board is alive and readable even though the widget is gone.** The client pins
  through the browser extension; read the board over the API with the `BUGHERD` key in
  `~/.webzite/.env` (a personal API key, Basic `<key>:x`), project **539158**. The first round —
  four photographs off the home page — was applied and published on 2026-09-09. The mechanics, and
  the two things that waste an hour the first time, are in trap 29.


## Cookie consent (Termly) — 2026-09-22

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Nothing fires before a visitor chooses. Account `stonesurgicalarts@thrivesquare.com`, website UUID
`0962fd2c-70b8-432a-b540-e9bb6ce46a5c`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_STONE_SURGICAL`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control

Tracked, and committed with the work it describes. Add a dated run file under
[`runbook/`](./runbook/INDEX.md) for each session and refresh this file when the standing state
changes.
