# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **THE WHOLE REDESIGNED SITE IS ON STAGING since 2026-10-01** (seq 12, published): 57 pages at their WordPress URLs, built from `scenario-0-new-site/03-design-build/output/code/site-src/` (read `KIT.md` there) and pushed with `.../output/code/push/` (README; staging-locked). Pages are stored with **flat slugs** and served nested by the zone-wide Cloudflare rewrites. The home source of truth moved from `workflows/04-design/.tmp/prototypes/home/` to `site-src/pages/index.html` + the css/js layers; the old `21-instatic-upload/home/` pipeline is retired (a push from it would replace the whole site with the home). Next: team review on BugHerd, WebKit pass, the open questions, then SEO and launch. Run: [runbook/2026-10-01-full-site-on-staging.md](runbook/2026-10-01-full-site-on-staging.md).
- **LIGHT GROUNDS ONLY since 2026-09-21** (Brandklout: dark-theme sites do not convert). Graphite is
  the ink, gold is fills and rules, gold text is `#74560f`. Every new template uses the ground-aware
  tokens in `home.css`; the rule for all Brandklout sites is in `deliver/brandklout/docs/DESIGN-STANDARD.md`.
- **REDESIGN, home page canary, local only since 2026-09-21**: `workflows/04-design/.tmp/prototypes/home/`.
  Run `node workflows/04-design/.tmp/prototypes/serve.mjs` (from this client folder) and open
  `http://localhost:4173/home/`; `?motion=off` for the reduced-motion page. Eight-chapter GSAP
  journey, gates in `workflows/04-design/.tmp/qa/` (`gate.mjs` 50/50 local, 52/52 on staging, `walk.mjs` for frames).
  **Published to staging 2026-09-21** (gate 50/50 on the published page); not yet shown to Brandklout.
  Identity comes from the Drive's logo colour guide (gold `#C3972B` + greys, no navy). Its media is
  gitignored: `prototypes/build-media.py` rebuilds it from Drive. Run:
  [runbook/2026-09-21-home-redesign-canary.md](runbook/2026-09-21-home-redesign-canary.md).
- ~~**STAGING HOLDS ONLY THE REDESIGNED HOME PAGE since 2026-09-21.**~~ Superseded 2026-10-01: staging holds the whole rebuilt site. The 58 other cloned pages were
  deleted on request; every old staging URL is a 404. Push pipeline: `workflows/21-instatic-upload/home/`
  (refuses any host but staging). **Do NOT promote staging to production as it stands** — it would
  replace production's `site.css`/`site.js` and unstyle its 58 other pages. Backups and the way back:
  [runbook/2026-09-21-home-redesign-on-staging.md](runbook/2026-09-21-home-redesign-on-staging.md).
- **2026-10-04: the reviews widget `7febe92d` is on the in-section standard** (Elfsight editor only, live at once on staging): no widget title, Google-logo header with the count, gold `#C3972B` uppercase button, sand `#EBE5D8` cards, Read more in text gold `#74560F`. Gate `deliver/process/tools/elfsight-reviews/check-widget.mjs 7febe92d-b5da-447f-b53f-9593eec9da53 --render https://staging.ifadentistry.com/` ok.
- **Live Google reviews on staging since 2026-09-30**: the home page's `#proof` rotator is the
  Elfsight Google Reviews widget (app `7febe92d-…`, the Peoria listing, 5.0 / 96) in an
  `embed-origins` Embed, class `.rv-embed`, placed by `21-instatic-upload/home/add-elfsight-reviews.mjs`
  (staging-locked, re-runnable). ~~**A `push-home.mjs` drops it**~~ Since 2026-10-01 the widget is in the site source (`data-embed`) and survives every push — re-run the script after every
  push, before publishing. Production has no widget and gets it with the rebuilt site. Widget
  registry and ownership: `deliver/process/tools/elfsight-reviews/review-widgets.json`. Run:
  [runbook/2026-09-30-elfsight-google-reviews-on-staging.md](runbook/2026-09-30-elfsight-google-reviews-on-staging.md).
- **Pipeline scripts import `insta-api.mjs` from `deliver/process/tools/instatic-api-sync/`**
  since 2026-09-30 (the pre-v2 `process/22-instatic-api-sync/` is gone). This worktree needs
  `deliver/process` in its sparse cone (`git sparse-checkout add deliver/process`).
- **Share card on staging since 2026-09-23**: the `brandklout.open-graph` plugin (copied from
  Dr. Nahlah's into `workflows/16-instatic-plugins/open-graph/`) is installed on **staging only**;
  the home page's `og:image` is the colour logo on white (`home/og-card.mjs` makes it,
  `home/set-og.mjs` uploads, configures and publishes). siteUrl is the staging host, canonical off.
  **Production still has no Open Graph plugin**, so its links unfurl with whatever photo comes first:
  [runbook/2026-09-23-og-logo-card.md](runbook/2026-09-23-og-logo-card.md).
- **BugHerd is on staging since 2026-09-21**: project `542527`, sidebar loaded through the
  `brandklout.embed-origins` plugin settings (`workflows/21-instatic-upload/home/bugherd.mjs`).
  Uninstall it before any promotion. **Round 1 (42 notes) was addressed and published on 2026-09-23 (seq 8)**. **Closed on the board 2026-10-01**: 40 done, #33 (Elfsight autoplay) and #38 (GHL procedure field) open with replies; [run](runbook/2026-10-01-bugherd-round-1-closed.md).
  The tasks are still `todo` on the board. The GoHighLevel form notes and four confirmations are open:
  [runbook/2026-09-23-bugherd-round-1.md](runbook/2026-09-23-bugherd-round-1.md).
- **STAGING since 2026-09-18**: `https://staging.ifadentistry.com` — a **separate Instatic
  instance** (same Railway project, environment `staging`, its own volume), seeded from production
  and byte-for-byte equivalent at 59/59 pages. **The redesign happens here, not on production**:
  Instatic's publish replaces every public page at once, so drafts on production would ship the
  moment anyone publishes anything. Admin: `https://staging.ifadentistry.com/admin`, same login as
  production. It is de-indexed at the Cloudflare edge (`X-Robots-Tag: noindex, nofollow` on that
  hostname only) and has no `.up.railway.app` door. GTM and the GoHighLevel number pool are
  excluded from this host, so reviewing does not pollute analytics or burn pool numbers.
  Procedure and promotion: [process/21-instatic-staging-clone](../../../process/21-instatic-staging-clone/21-instatic-staging-clone.md);
  run: [runbook/2026-09-18-staging-environment.md](runbook/2026-09-18-staging-environment.md).
  ~~Promote with `--strategy merge-overwrite` and never `--media`.~~ **Superseded 2026-09-21: no
  promotion until the whole site is rebuilt** (see the line above).
- **LIVE since 2026-09-11 ~22:20Z**: `https://www.ifadentistry.com` serves the Instatic clone of the WordPress site (Railway project `Institute for Advanced Dentistry`, fallback host `https://institute-for-advanced-dentistry-production.up.railway.app`). The apex 301s to `www`. Admin: `https://www.ifadentistry.com/admin`. The pipeline is at `workflows/21-instatic-upload/21-instatic-upload.md`; the top section is this client's, and the rest is sibling history kept for its traps.
- **DNS / email**: Cloudflare zone `223386e4…` on Brandklout's account, nameservers `ajay`/`ruth` set at Squarespace (whose own DNS records are now inactive; leave them). Email records are intact: Google Workspace plus Brevo. State and scripts: [`dns/DNS-CUTOVER.md`](dns/DNS-CUTOVER.md), [`dns/URL-RULES.md`](dns/URL-RULES.md), `dns/set-url-rules.mjs`, `dns/set-redirect-rules.mjs`. The latest run is [runbook/2026-09-11-cloudflare-conflicts.md](runbook/2026-09-11-cloudflare-conflicts.md).
- **Contact form**: the practice's GoHighLevel form on 58 pages (gate `verify-ghl-form.mjs`). Its
  SMS consent line names the legal entity **Institute for Advanced Dentistry PLLC** and is the
  opt-in the policies describe; the wording itself has an A2P problem, see the 2026-09-18 run.
- **Legal pages**: `/privacy-policy` and `/terms-of-service` carry the client's own A2P 10DLC
  documents since 2026-09-18, not the WordPress text, and every footer links Terms of Service.
  **Peoria is the only office since 2026-09-28** (Phoenix closed; its address block is gone from both):
  [runbook/2026-09-28-phoenix-closed-message-types.md](runbook/2026-09-28-phoenix-closed-message-types.md).
  Source `workflows/21-instatic-upload/legal/`; the originals the client sent are in
  `workflows/00-client-delivery-initialization/.tmp/`. See
  [runbook/2026-09-18-a2p-policies-gtm-ghl-pool.md](runbook/2026-09-18-a2p-policies-gtm-ghl-pool.md).
  **`/hipaa-disclosure` since 2026-10-01** (HHS model notice, Institute for Advanced Dentistry PLLC),
  production only, in every footer legal row after Privacy Policy (`legal/push-hipaa.mjs`,
  `legal/push-footer-hipaa.mjs`; the row wraps via `legal-footer-wrap.css`). Staging gets both from `site-src` with the
  next full push. Run: `scenario-0-new-site/06-post-launch/output/RUNBOOK.md`.
- **Site-wide tags**: Google Tag Manager `GTM-5XR78DN7` and the GoHighLevel number pool, in the
  code asset `src/scripts/000-brandklout-tags.js` (source `workflows/21-instatic-upload/tags/`),
  gated to `*.ifadentistry.com` **and excluded on `staging.*`** since 2026-09-18 — the staging
  clone is a subdomain of the production zone and would otherwise fire both. Gate
  `tags/verify-tags.mjs` (all passed 2026-09-28). **Production's only GTM container since
  2026-09-28**: the outgoing agency's `GTM-K8N3JK3Q` is blanked in `site.js` and skipped by
  `prepare-wp.mjs`. Asset `1.2.1` restores `ghl()`, which 1.2.0 deleted: **the number pool did not
  run on production from 2026-09-22 to 2026-09-28.** See
  [runbook/2026-09-28-old-gtm-removed-pool-restored.md](runbook/2026-09-28-old-gtm-removed-pool-restored.md).
- **Accessibility widget**: since 2026-09-12 this is Sienna, injected on every page by `brandklout.embed-origins` `siteScripts`, the same as every other Instatic site. The WordPress site's UserWay is gone: its registry item in `site.js` is blanked and `prepare-wp.mjs` skips it. The statement no longer names UserWay. See [runbook/2026-09-12-userway-replaced-by-sienna.md](runbook/2026-09-12-userway-replaced-by-sienna.md).
- **Scrape**: `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`, which is now the only copy of the WordPress site we control.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/`, `media-library/` (237 WP originals plus `vimeo/`, `vimeo-instatic/` re-encodes, `vimeo-posters/`), and `21-instatic-upload/.tmp/` except the media map. If they are missing, rebuild them; see the intake directive's Version Control section.

## Open

- **The GoHighLevel contact form says "Submission in progress" on a form nobody touched**, on
  production too. Cause: the form's save-and-exit setting (`enableSaveExitConfirmation`) plus the
  consent bridge's URL prefill. Fix it in GoHighLevel; `workflows/21-instatic-upload/check-ghl-form.mjs`
  checks any form. Detail and the list of affected clients: 2026-09-21 staging run, review round 2.
- **The GoHighLevel contact form shows its hidden consent fields** (`privacy_*_consent` and nine
  more, visible inputs under Submit) on production and staging alike. It is in the form itself;
  fix it in GoHighLevel.
- **Home redesign, before the client sees it:** 2,500+ or 2,800+ implants (the brief says both);
  whether the complimentary exam + CBCT + smile preview is still the offer; consent for the
  chapter 03 before/after on a home page; a WebKit pass at 1512×735. The Asana Style Guide task is
  still open.
- **Refer a Patient** (`patient-referrals`, Fluent #3) still posts to WordPress `admin-ajax.php`, which no longer exists at this domain. It needs its own GHL form, or a decision to drop it.
- **Site Kit's Google tag `GT-NBJ3HCBV` still loads beside `GTM-5XR78DN7`** (replayed from the
  WordPress clone by `site.js`, items `_xs27_EDLa` + three inline configs). The old container
  `GTM-K8N3JK3Q` went 2026-09-28. If `GTM-5XR78DN7` fires the same GA4 property, pageviews are
  counted twice; blank it the same way with `tags/remove-old-gtm.mjs` as the pattern.
- **The GHL form's SMS consent wording contradicts itself** and fails GHL's "Message type disclosure" check (2026-09-28; replacement wording in that run) ("non-marketing … special offers,
  discounts"), which is what A2P vetting reads. It is fixed in GoHighLevel, not here.
- **After WordPress is retired**: drop `a:bill.wordkeeper.net`, `mx` and `a` from SPF. Cancel the agency's hosting only once the client confirms nothing else lives there.
- `verify-live-wp.mjs` compares against www.ifadentistry.com, which is Instatic now. Retarget it or retire it.
- Checks to re-run after any change: `verify-wp-urls.mjs https://www.ifadentistry.com`, `verify-ghl-form.mjs https://www.ifadentistry.com`, `tags/verify-tags.mjs https://www.ifadentistry.com`, and `20-instatic-domain-origins/check-origins.mjs --all`.
- Checks to re-run after any change **on staging**, or to either Cloudflare zone:
  `MSYS_NO_PATHCONV=1 node deliver/process/21-instatic-staging-clone/verify-staging-clean.mjs --staging https://staging.ifadentistry.com --production https://www.ifadentistry.com --paths "/,/contact-us/"`.
  It renders the page, so it sees what a raw-HTML check cannot. `verify-tags.mjs` deliberately
  skips a staging host — on staging the tags are supposed to be absent.


## Cookie consent (Termly) — 2026-09-22

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Tagged analytics and ad pixels wait for consent; the **GoHighLevel call-tracking pool deliberately does not** (client instruction, 2026-09-22). Account `ifadentistry@thrivesquare.com`, website UUID
`8fd70023-515c-4230-bf39-f8ad2666f71c`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_IFA`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
