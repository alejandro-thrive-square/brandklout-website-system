# 10 — Landing pages: Webflow → Instatic

**Status: LIVE, 2026-08-28.** All six paid-traffic landing pages are published on the Instatic
site and answer on the same URLs the ads already point at, **with their GoHighLevel forms embedded
inline and call tracking working**. `verify-live.mjs`, `verify-form.mjs`, `verify-tracking.mjs` and
`verify-faq.mjs`: **0 problems each.**

This site now carries the four Webzite plugins that belong on every new site — see
[Plugins](#plugins-required-on-every-site).

| Live URL | Campaign | Role |
| :--- | :--- | :--- |
| [/invisalign](https://www.masonparkdental.com/invisalign) | Invisalign | landing |
| [/invisalign-consultation](https://www.masonparkdental.com/invisalign-consultation) | Invisalign | consultation |
| [/invisalign-thank-you](https://www.masonparkdental.com/invisalign-thank-you) | Invisalign | thank-you |
| [/new-patient-special](https://www.masonparkdental.com/new-patient-special) | $189 New Patient | landing |
| [/new-patient-special-consultation](https://www.masonparkdental.com/new-patient-special-consultation) | $189 New Patient | consultation |
| [/new-patient-thank-you](https://www.masonparkdental.com/new-patient-thank-you) | $189 New Patient | thank-you |

## Plugins required on every site

This site now carries the four Webzite plugins that Dr Nahlah's does. **They belong on every new
Instatic site**, and without `embed-origins` no third-party embed is possible at all.

| Plugin | Version | What it is for |
| :--- | :--- | :--- |
| `brandklout.embed-origins` | 1.3.0 | the Embed block + the per-page CSP widening that lets a vendor widget load |
| `brandklout.aeo-schema` | 1.2.0 | JSON-LD written into `<head>` at publish |
| `brandklout.open-graph` | 1.1.2 | Open Graph tags written into `<head>` at publish |
| `brandklout.link-editor` | 1.0.2 | editor-only link fixing; never runs on a published page |

Installed with the shared toolkit, which is the canonical route:

```bash
cd deliver/process/18-instatic-embeds
node test-embed-origins.mjs && node test-embed-module.mjs     # 54 + 44 offline assertions
node pack-plugin.mjs embed-origins .tmp/embed-origins.zip
node install-plugin.mjs .tmp/embed-origins.zip --apply
node set-origins.mjs                                          # embedPolicy=compatible, autoTrust=on
```

`embedPolicy` is left at **compatible** and `autoTrust` on — the defaults. In that mode a page that
*contains* an Embed block may load over `https`, and a page that does not is byte-for-byte
untouched. That is why `/about-us` still publishes `frame-src 'none'; script-src 'none'` while
`/invisalign` publishes `frame-src 'self' https:`.

> [!IMPORTANT]
> Only `embed-origins` lives in `deliver/process/`. The other three are still only in the
> `bk-dr-nahlah` worktree under `deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/`, and
> they were packed from there. **They should be promoted to `deliver/process/` too** if they are
> genuinely required on every site — see Open items.

`install-plugin.mjs` now grants per plugin id (`GRANTS`) rather than from one list, so each of the
four gets exactly the permissions its own manifest declares, and a package that is unknown or asks
for more than its entry allows is refused rather than installed.

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
node place-embeds.mjs                              # GATE: form + tracking Embed blocks
node import.mjs --publish                          # pages + classes + lp.css, then publish
node verify-live.mjs                               # GATE: must be 0 problems
node verify-form.mjs                               # GATE: forms load, per campaign
node verify-tracking.mjs                           # GATE: the number actually swaps
node register-script.mjs lp-faq.js --publish       # FAQ accordions (once per instance)
node verify-faq.mjs                                # GATE: every FAQ opens and closes
```

Local preview and reference diffing, neither of which touches Instatic:

```bash
node preview.mjs            # :4320, serves lp.css UNDER the live site's own stylesheet
node compare.mjs --vw 1440  # full-page captures, rebuilt vs mason-park-dental.webflow.io
node hero-shot.mjs invisalign --live --y 0
node net-check.mjs invisalign
```

`verify-form.mjs` and `verify-tracking.mjs` default to production, but accept
`TARGET_ORIGIN=https://staging.masonparkdental.com` for a read-only check of the redesigned staging
routes against the same Webflow references. The tracking verifier reuses one browser session for
its comparison; use workflow 09's `verify-ad-tracking-isolated.mjs` as the final staging gate so
vendor session state cannot create an early-page false negative.

## What the port changes, and why only this

The pages carry **zero Webflow interactions** — no `data-w-id`, no inline `opacity:0` — so they
render correctly as static HTML. That is what made a faithful port possible at all. Five
deliberate changes, all in `build.mjs`:

1. **Scope.** Everything is wrapped in `.lp-page` and the stylesheet is namespaced to match.
2. **Media.** Webflow CDN URLs become Instatic upload paths; `srcset`/`sizes` are dropped because
   Instatic regenerates its own variants. 114 URLs collapse to 27 files.
3. **Scripts.** Stripped from the markup, then the ones that matter are put back as Embed
   blocks — see the GoHighLevel section below.
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

## The GoHighLevel forms — embedded, one per campaign

The forms are embedded inline, exactly as on Webflow, via the **`brandklout.embed-origins`**
plugin (`deliver/process/18-instatic-embeds/`). Instatic's own publisher strips `<iframe>` and
`<script>` and its base CSP carries `frame-src 'none'`; the plugin closes both halves — an Embed
block module for the node graph, and a `publish.html` filter that rewrites the published page's
CSP meta. The widening is **per page**: `/invisalign` publishes `frame-src 'self' https:` while
`/about-us` still publishes `frame-src 'none'`.

**Two campaigns, two forms, and they must never cross:**

| Campaign | GoHighLevel form | Pages |
| :--- | :--- | :--- |
| Invisalign | `YbX91GhEDKkCN4GH4gka` — "Contact Form Google Ads (Invisalign)" | `/invisalign`, `/invisalign-consultation` |
| $189 New Patient | `AFu5BpJpMjgSnSf8yybc` — "Contact Form Google Ads (NP)" | `/new-patient-special`, `/new-patient-special-consultation` |
| — | none (post-submission) | `/invisalign-thank-you`, `/new-patient-thank-you` |

The id is read from the page being built, never assumed. `place-embeds.mjs` asserts each page ends
up with the id its own Webflow original carried, that the two campaigns resolve to one id each, and
that those two ids differ — a crossed mapping would put Invisalign leads in the New Patient
pipeline. `verify-form.mjs` then re-checks it against the live pages.

The vendor snippet is carried **verbatim** — the iframe *and* GoHighLevel's `form_embed.js`, which
is what resizes the iframe to the form. Verified live: iframe 200, loader 200, and the rendered
size matches the Webflow reference exactly (514x749 on the landing pages, 485x721 on the
consultations).

### Call tracking and reviews are restored too

The same mechanism carries the scripts the port had stripped, as a second Embed block per page
(`fit: 'auto'`, so it adds no visible box):

- **`number_pool.js` + `user_session.js`** — the call-tracking number pool, on all six pages.
  Verified live: every page now renders **(281) 645-5375** in place of the markup's public
  (281) 769-8878, matching the Webflow reference on all six. Without this every ad call attributes
  to the main site.
- **Elfsight `platform.js`** — the review widget on the four non-thank-you pages.

`tracking.json` is built from what each page actually loaded on Webflow, filtered to an explicit
host allowlist, so this cannot silently start shipping some other vendor's script.
`link.msgsndr.com/js/form_embed.js` is deliberately not in that list — it travels inside the form
snippet, with the form it belongs to.

> [!NOTE]
> **Headless Chrome is not proof here.** The form card renders blank in headless on our page *and*
> on the Webflow original, because the widget lazy-loads. Confirmed in a normal browser instead:
> the form renders its Name / Phone / Email / Treatment Type / Message fields, and the header shows
> the swapped tracking number. `verify-form.mjs` is comparative for this reason — same iframe, same
> id, same network result on ours and the reference.

## The FAQ accordions — fixed here, broken on Webflow

The FAQ items are Webflow **Dropdown** components:

```html
<div class="… w-dropdown">
  <div class="… w-dropdown-toggle">question<span class="…_icon">+</span></div>
  <nav  class="… w-dropdown-list">answer</nav>
</div>
```

The stylesheet hides every answer with `.w-dropdown-list{display:none}` and reveals it only via
`.w-dropdown-list.w--open{display:block}`. That class is added by `webflow.js` — which the port
strips — so on the imported pages every answer was permanently hidden and clicking did nothing.
**26 answers across 4 pages** (7 on `/invisalign`, 5 on `/new-patient-special`, 7 on each
thank-you page; the consultation pages have none).

> [!IMPORTANT]
> **They do not work on the Webflow original either.** Verified with a real trusted click on
> `mason-park-dental.webflow.io`: `webflow.js` initialises the toggles — it adds `role`,
> `aria-expanded` and `tabindex` — but the click never opens them; `aria-expanded` stays `"false"`
> and the answer stays `display:none`. This is a pre-existing defect in the v2 Webflow build, not
> something the port lost, and there was no working reference behaviour to copy. Those answers have
> never been readable by a visitor on either site.

`lp-faq.js` adds back the one thing the CSS is waiting for — the `w--open` class — so the reveal
needs no new styling. It ships as an Instatic **runtime script asset**, served same-origin from
`/_instatic/assets/`, so it runs under `script-src 'self'` and needs no CSP widening of its own:

```bash
node register-script.mjs lp-faq.js --publish
```

Three deliberate choices, since there was no reference to match:

- **Items toggle independently.** Webflow's dropdown would also close on an outside click; that
  makes sense for a menu, not for a FAQ someone is reading.
- **Keyboard and screen-reader support is set up in the script** (`role="button"`, `tabindex`,
  `aria-expanded`, `aria-controls`, Enter/Space) because `webflow.js` is not there to do it.
- **The `+` rotates 45° into an `×` when open** — the only new CSS, purely visual, so no copy
  changes.

## Open items

1. **The apex domain does not resolve.** `masonparkdental.com` has no A/AAAA record, so only `www`
   works and any ad, GBP link or citation on the bare domain is dead. Needs Cloudflare dashboard
   access — the token in `bk-dr-nahlah/.env` reads zones but is not authorised for `dns_records`.
2. **Promote the other three plugins to `deliver/process/`.** `aeo-schema`, `open-graph` and
   `link-editor` are required on every site but live only in the `bk-dr-nahlah` worktree, the way
   `embed-origins` did before it was promoted. Until then every new site has to reach across
   worktrees for them, which is exactly the fragility SYSTEM_RULES §3 warns about.
3. **`noindex` is not set.** Four of the six Webflow originals carried `noindex, nofollow`, and the
   v2 build report flagged the other two as needing it. Instatic's page rows support only
   `title`/`slug`/`body` — no per-page robots or meta-description field — so the port could not
   carry it. `build.mjs` records the intended value on each page JSON for whenever a mechanism
   exists. `brandklout.open-graph` writes `<head>` tags at publish and may be the right home for it.
4. **Meta descriptions are not published** either, for the same reason. Pre-existing for all 77
   pages, not new here.
5. **No favicon** is served on any page of this site (site-wide, not introduced here).
6. **The security bargain of `compatible` mode should be said out loud at handover**, as the
   18-instatic-embeds directive instructs: on a page carrying an embed, what stands between the
   site and a maliciously injected script is `default-src`. What stood between it and a *pasted*
   one was always the person pasting. It is per page, never site-wide.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The scripts, this
README and the lightweight JSON artifacts are committed. Excluded: `.tmp/capture/assets/`
(8.8 MB of images), `.tmp/compare/` (18 MB of screenshots), `.tmp/converted-pages.json`
(regenerated by `ship-convert-fetch.mjs`) and `.tmp/.session`.
