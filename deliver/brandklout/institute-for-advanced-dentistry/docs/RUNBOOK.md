# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **REDESIGN, home page canary, local only since 2026-09-21**: `workflows/04-design/.tmp/prototypes/home/`.
  Run `node workflows/04-design/.tmp/prototypes/serve.mjs` (from this client folder) and open
  `http://localhost:4173/home/`; `?motion=off` for the reduced-motion page. Eight-chapter GSAP
  journey, gates in `workflows/04-design/.tmp/qa/` (`gate.mjs` 50/50, `walk.mjs` for frames).
  **Published to staging 2026-09-21** (gate 50/50 on the published page); not yet shown to Brandklout.
  Identity comes from the Drive's logo colour guide (gold `#C3972B` + greys, no navy). Its media is
  gitignored: `prototypes/build-media.py` rebuilds it from Drive. Run:
  [runbook/2026-09-21-home-redesign-canary.md](runbook/2026-09-21-home-redesign-canary.md).
- **STAGING HOLDS ONLY THE REDESIGNED HOME PAGE since 2026-09-21.** The 58 other cloned pages were
  deleted on request; every old staging URL is a 404. Push pipeline: `workflows/21-instatic-upload/home/`
  (refuses any host but staging). **Do NOT promote staging to production as it stands** — it would
  replace production's `site.css`/`site.js` and unstyle its 58 other pages. Backups and the way back:
  [runbook/2026-09-21-home-redesign-on-staging.md](runbook/2026-09-21-home-redesign-on-staging.md).
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
  Source `workflows/21-instatic-upload/legal/`; the originals the client sent are in
  `workflows/00-client-delivery-initialization/.tmp/`. See
  [runbook/2026-09-18-a2p-policies-gtm-ghl-pool.md](runbook/2026-09-18-a2p-policies-gtm-ghl-pool.md).
- **Site-wide tags**: Google Tag Manager `GTM-5XR78DN7` and the GoHighLevel number pool, in the
  code asset `src/scripts/000-brandklout-tags.js` (source `workflows/21-instatic-upload/tags/`),
  gated to `*.ifadentistry.com` **and excluded on `staging.*`** since 2026-09-18 — the staging
  clone is a subdomain of the production zone and would otherwise fire both. Gate
  `tags/verify-tags.mjs`. Production's published copy is deliberately one line behind the source
  (the line is a no-op there; a publish bakes all 59 pages, so it waits for the next real one).
- **Accessibility widget**: since 2026-09-12 this is Sienna, injected on every page by `brandklout.embed-origins` `siteScripts`, the same as every other Instatic site. The WordPress site's UserWay is gone: its registry item in `site.js` is blanked and `prepare-wp.mjs` skips it. The statement no longer names UserWay. See [runbook/2026-09-12-userway-replaced-by-sienna.md](runbook/2026-09-12-userway-replaced-by-sienna.md).
- **Scrape**: `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`, which is now the only copy of the WordPress site we control.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/`, `media-library/` (237 WP originals plus `vimeo/`, `vimeo-instatic/` re-encodes, `vimeo-posters/`), and `21-instatic-upload/.tmp/` except the media map. If they are missing, rebuild them; see the intake directive's Version Control section.

## Open

- **The GoHighLevel contact form shows its hidden consent fields** (`privacy_*_consent` and nine
  more, visible inputs under Submit) on production and staging alike. It is in the form itself;
  fix it in GoHighLevel.
- **Home redesign, before the client sees it:** 2,500+ or 2,800+ implants (the brief says both);
  whether the complimentary exam + CBCT + smile preview is still the offer; consent for the
  chapter 03 before/after on a home page; a WebKit pass at 1512×735. The Asana Style Guide task is
  still open.
- **Refer a Patient** (`patient-referrals`, Fluent #3) still posts to WordPress `admin-ajax.php`, which no longer exists at this domain. It needs its own GHL form, or a decision to drop it.
- **Two GTM containers are on every page.** `GTM-K8N3JK3Q` and Site Kit's `GT-NBJ3HCBV` /
  `G-STF00595` come from the WordPress clone; `GTM-5XR78DN7` is ours. Decide which owns
  measurement before trusting either.
- **The GHL form's SMS consent wording contradicts itself** ("non-marketing … special offers,
  discounts"), which is what A2P vetting reads. It is fixed in GoHighLevel, not here.
- **After WordPress is retired**: drop `a:bill.wordkeeper.net`, `mx` and `a` from SPF. Cancel the agency's hosting only once the client confirms nothing else lives there.
- `verify-live-wp.mjs` compares against www.ifadentistry.com, which is Instatic now. Retarget it or retire it.
- Checks to re-run after any change: `verify-wp-urls.mjs https://www.ifadentistry.com`, `verify-ghl-form.mjs https://www.ifadentistry.com`, `tags/verify-tags.mjs https://www.ifadentistry.com`, and `20-instatic-domain-origins/check-origins.mjs --all`.
- Checks to re-run after any change **on staging**, or to either Cloudflare zone:
  `MSYS_NO_PATHCONV=1 node deliver/process/21-instatic-staging-clone/verify-staging-clean.mjs --staging https://staging.ifadentistry.com --production https://www.ifadentistry.com --paths "/,/contact-us/"`.
  It renders the page, so it sees what a raw-HTML check cannot. `verify-tags.mjs` deliberately
  skips a staging host — on staging the tags are supposed to be absent.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
