# 10 — Landing pages: Webflow → Instatic

**Status: LIVE, 2026-08-28.** All six paid-traffic landing pages are published on the Instatic
site and answer on the same URLs the ads already point at. `verify-live.mjs`: **0 problems.**

| Live URL | Campaign | Role |
| :--- | :--- | :--- |
| [/invisalign](https://www.masonparkdental.com/invisalign) | Invisalign | landing |
| [/invisalign-consultation](https://www.masonparkdental.com/invisalign-consultation) | Invisalign | consultation |
| [/invisalign-thank-you](https://www.masonparkdental.com/invisalign-thank-you) | Invisalign | thank-you |
| [/new-patient-special](https://www.masonparkdental.com/new-patient-special) | $189 New Patient | landing |
| [/new-patient-special-consultation](https://www.masonparkdental.com/new-patient-special-consultation) | $189 New Patient | consultation |
| [/new-patient-thank-you](https://www.masonparkdental.com/new-patient-thank-you) | $189 New Patient | thank-you |

## Why this workflow exists

The six pages were built natively in Webflow (workflow 07) and served on
`masonparkdental.com`, which Webflow held as a custom domain. **The domain was then cut over to
the Instatic site**, which took it off Webflow: `masonparkdental.com` is now an active zone in
our own Cloudflare account and `www` resolves to Railway/Instatic. Instatic had no such pages,
so every ad URL returned 404 while ad spend kept running.

The Webflow pages themselves were never broken — all six still answer 200 on
`mason-park-dental.webflow.io`, which is what this workflow captures from. Rebuilding them on
Instatic **at the same six slugs** restores the exact ad destinations with no change to any
campaign.

### Two things that are still wrong, and are not ours to fix here

1. **The apex `masonparkdental.com` has no DNS record at all** — it does not resolve, so only
   `www` works. Any ad, GBP link or citation pointing at the bare domain is dead. Fixing it needs
   Cloudflare dashboard access; the API token in `bk-dr-nahlah/.env` reads zones but is **not**
   authorised for `dns_records` (10000 Authentication error).
2. **Nothing redirects the old Webflow URLs**, because there is nothing left to redirect from.

## Run order

```bash
cd deliver/brandklout/mason-park/workflows/10-lp-instatic/.tmp

node fetch-assets.mjs                              # 27 images off the Webflow CDN
node build.mjs                                     # first pass, no media map yet
node upload-media.mjs                              # -> instatic-media-map.json
node build.mjs --media instatic-media-map.json     # final pass
node audit.mjs                                     # GATE: must be 0 blockers
node install-fonts.mjs --apply                     # Montserrat, once per instance
node ship-convert-fetch.mjs                        # HTML -> nodes, inside the container
node import.mjs --publish                          # pages + classes + lp.css, then publish
node verify-live.mjs                               # GATE: must be 0 problems
```

Local preview and reference diffing, neither of which touches Instatic:

```bash
node preview.mjs            # :4320, serves lp.css UNDER the live site's own stylesheet
node compare.mjs --vw 1440  # full-page captures, rebuilt vs mason-park-dental.webflow.io
node hero-shot.mjs invisalign --live --y 0
node net-check.mjs invisalign
```

## What the port changes, and why only this

The pages carry **zero Webflow interactions** — no `data-w-id`, no inline `opacity:0` — so they
render correctly as static HTML. That is what made a faithful port possible at all. Five
deliberate changes, all in `build.mjs`:

1. **Scope.** Everything is wrapped in `.lp-page` and the stylesheet is namespaced to match.
2. **Media.** Webflow CDN URLs become Instatic upload paths; `srcset`/`sizes` are dropped because
   Instatic regenerates its own variants. 114 URLs collapse to 27 files.
3. **Scripts.** All stripped. See the GoHighLevel section below for what that cost.
4. **Styles.** The head `<style>` blocks are hoisted into `lp.css`. The **fluid rem engine** is
   among them and is load-bearing.
5. **PDF.** The Patient Privacy Policy link is unwrapped to plain text — Instatic refuses
   `application/pdf`, so the alternative is a link that 404s.

## The four traps, in the order they bite

### 1. The landing-page CSS shares 44 class names with the live site

Both are Client-First vocabularies: `padding-global`, `container-large`, `heading-style-h1`,
`button`, `spacer-*`, `text-size-*`. Instatic serves **one site-wide stylesheet**, so shipping the
Webflow CSS as-is would have restyled all 71 live pages.

`scope-css.mjs` namespaces every selector to `.lp-page`. Root-element rules are the hard case: the
pages are sized by a fluid rem engine that sets `html{font-size:…}` from `:root` custom
properties, and `rem` always resolves against the root, so those cannot be pushed into a
descendant. They become **`html:has(.lp-page)`** — still the root element, matching only on a page
that contains a landing page.

`scope-css.test.mjs` covers 21 cases and asserts **no rule can match outside the scope**. `audit.mjs`
re-checks the built sheet the same way. Proof it worked: every one of the 26,780 bytes of the
pre-existing stylesheet is still present byte-for-byte in the published bundle.

### 2. Instatic's importer trims every text node — including NBSP

The Invisalign hero is three spans:
`<span>Straighter Teeth. </span><span>Nobody</span><span>&nbsp;Has To Know.</span>`.
It first published as **"Straighter Teeth.NobodyHas To Know."** in a 3.5rem headline.

Nothing structural catches this. Node count, class list and collapsed text all still match,
because the loss is exactly one character per boundary — and a tag-stripping text diff *inserts* a
space where the tag was, hiding it completely. It was found by putting the live render next to the
reference render.

`spaces.mjs` replaces a doomed space with an empty `<span class="lp-sp">` whose space lives in CSS
`content`, which the importer cannot trim. **36 of them** across the six pages. A plain space is
generated rather than an NBSP so the headline still wraps where the reference wraps it.

### 3. A media asset's public URL is NOT `/uploads/<id>-<name>`

The asset record's real field is **`publicPath`**, and its nanoid prefix is a *different* value
from the asset's `id`. Deriving the path from `id` produced 27 URLs that all 404, on a page that
otherwise looked completely correct in the HTML. Read `publicPath`; never construct the path.

### 4. Cloudflare 403s a plain HTTP client

`curl`/`urllib` without a browser user-agent gets 403 for every asset, so a scripted URL sweep
reports a perfect page as 100% broken. Only a real browser session tells the truth — that is why
`verify-live.mjs` and `net-check.mjs` drive Chrome over CDP rather than fetching URLs.

## The GoHighLevel form — the one real loss

**The embedded lead form could not be carried over.** It is an `<iframe>` to
`api.leadconnectorhq.com` plus a `form_embed.js` loader, and Instatic publishes pages under a CSP
it builds itself (`/app/src/core/publisher/cspPlan.ts`):

- `script-src` is `'none'`, relaxing to **exactly `'self'`** once the page has any script — never
  to a third-party origin.
- `frame-src` is `'none'`, and relaxes **only** for modules that declare CSP sources at render
  time. The only module that does is the YouTube/Vimeo one.
- The plugin SDK's `frontend.assets[]` ships assets **from the plugin zip**, so it cannot
  allowlist a third-party origin either.

Injecting the iframe from our own registered runtime script was tried and fails identically —
`frame-src 'none'` blocks a scripted iframe exactly as it blocks a static one. That experiment is
still in the repo (`lp-runtime.js`, `register-script.mjs`); the script was registered, proven to
relax `script-src` only to `'self'`, and then removed with `--remove` so the site does not carry
dead JS.

**What ships instead:** the form card now holds a prominent button linking to the *same*
GoHighLevel form, hosted by GoHighLevel (`https://api.leadconnectorhq.com/widget/form/<id>`,
verified to render standalone), plus a "Prefer to talk? Call (281) 769-8878." line. **The form ids
are unchanged**, so submissions land in the same pipeline and automations as before. What is lost
is that the visitor fills it on a GoHighLevel page instead of inline — a real conversion-rate cost.

Two smaller casualties of the same CSP:

- **Call-tracking numbers are gone.** The Webflow page loads a GoHighLevel `number_pool.js` that
  swaps the practice's public number for a per-campaign one — the reference page renders
  **(281) 645-5375** where the markup says (281) 769-8878. Every ad call now attributes to the
  main number. This matters for measuring the campaigns and should be raised with Brandklout.
- **The Elfsight review widget** (4 pages) does not load. The surrounding section still renders.

## Open items

1. **The apex domain does not resolve.** See above — needs Cloudflare dashboard access.
2. **Restore inline forms + call tracking.** Needs Instatic to allow third-party `frame-src`/
   `script-src`. The supported route is a first-party Instatic module or a change to `cspPlan.ts`
   upstream — **not** a patch of the vendor build in the container, which a redeploy erases.
3. **`noindex` is not set.** Four of the six Webflow originals carried `noindex, nofollow`, and
   the v2 build report flagged the other two as needing it. Instatic's page rows only support
   `title`/`slug`/`body` — there is no per-page robots or meta-description field — so the port
   could not carry it. These six thin pages are therefore indexable. `build.mjs` records the
   intended value on each page JSON for whenever a mechanism exists.
4. **Meta descriptions are not published** either, for the same reason. This is pre-existing
   behaviour for all 77 pages, not new.
5. **No favicon** is served on any page of this site (a site-wide gap, not introduced here).

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The scripts, this
README and the lightweight JSON artifacts are committed. Excluded: `.tmp/capture/assets/`
(8.8 MB of images), `.tmp/compare/` (18 MB of screenshots), `.tmp/converted-pages.json`
(regenerated by `ship-convert-fetch.mjs`) and `.tmp/.session`.
