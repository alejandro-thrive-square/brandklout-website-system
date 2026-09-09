## DONE 2026-08-24 (session 10): the contact page is split one-per-office — DRAFT ONLY, NOT PUBLISHED

The Webflow build (`www.drnahlah.com`) grew a **second contact page** and Instatic
still had one. This brings Instatic to the same shape. **Everything below is on the
Instatic DRAFT at `seq 66`. Nothing has been published.**

### Why there are two pages at all

The practice runs a **separate LeadConnector form per office**, and a form cannot be
chosen at submit time. Webflow's two pages are byte-identical apart from that embed:

| Page | Form id | Form name |
|---|---|---|
| `/contact-maclean` | `axgcdqEPUFoHF8Dt5Nji` | Tyson Corner Office - Contact form Website |
| `/contact-alexandria` | `g7FeioS7e7quSCxIQHRw` | Alexandria - Wordpress contact page |

### What Instatic now has

- **`/contact` is a CHOOSER** (308 nodes) — the two offices, each card linking to its
  own page. It is kept rather than replaced because the nav, footer, drawer and **26
  page bodies** link to `contact.html#book`, and Instatic has no redirect tool.
  `#book` is now on the office grid, so every one of those 26 CTAs means "choose your
  office" **without one of them being rewritten**. Same pattern as
  `privacy-policy` / `terms-conditions`.
- **`/contact-maclean`, `/contact-alexandria`** (331 nodes each) — each carries its
  own form as a real `webzite.embed-origins.embed` node, `source: snippet`,
  `fit: auto`.
- **The home page's closing CTA now carries both offices.** It used to be one button,
  "Book Your Free Consult", pointing at `https://flexbook.me/drnahlah` — **the
  ALEXANDRIA calendar**. Every visitor who took the page's main call to action was
  booked into Alexandria. Each `.iv-loc` card now has its own Book now button and the
  gold band goes to `/contact#book`.
- **`src/scripts/seo-head.js` republished** — 80 routes (was 78), titles/descriptions
  /JSON-LD for both new pages.

### The trap that decides whether the form works at all

`to-instatic.mjs` strips **every** `<script>` from a page body — correctly, since the
package's scripts are code assets. That also strips the vendor's `form_embed.js`. So
the form **cannot travel as markup**:

1. the body is pushed with an empty `[data-wz-embed-slot]` marker where the form goes;
2. `push-contact-embeds.mjs` then writes the real module node over REST.

The module is what renders `<div class="wz-embed" data-wz-embed="auto">`, and the
plugin's publish filter switches a page to `compatible` CSP mode **only** on seeing
that attribute. Push the markup verbatim instead and you get an iframe that is
CSP-refused, a vendor script that never loads, and a page that looks fine in the
editor and renders an empty box live.

### The MCP editor bridge dropped mid-push, and that is normal

`site_add_page` runs headlessly. **`site_insert_html` and `site_replace_node_html` do
not** — they answer *"This tool runs in the Instatic Site editor"* unless
`encorercm.com/_instatic` is open in a browser as the connector owner. `get_context`
reported `siteConnected: true`, a page was created, and the next call reported the
editor closed.

It dropped during `contact-alexandria`, leaving it created but empty. **The fix was
not to wait for a browser**: `push-contact-embeds.mjs` deep-clones the McLean tree
under fresh nanoids over REST. That is not a shortcut — the two pages are *supposed*
to be identical apart from the form, so exactly two things differ and both are
asserted: the breadcrumb leaf and the embed snippet.

**Prefer REST for anything that must be reliable here.** The scripts are:

```bash
cd deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync
node push-contact-split.mjs           # bodies — NEEDS the editor open
node push-contact-embeds.mjs --apply  # forms + the Alexandria clone — headless
node patch-home-office-ctas.mjs --apply  # home CTAs — headless, idempotent
```

`.tmp/backups/pre-contact-split-{site,pages}.json` is the pre-session draft (seq 61).

### Two defects on the Webflow source, deliberately NOT copied

- `/contact-alexandria` prints the Alexandria current-patients number as
  **`(703) 940-541`** — one digit short. It is `(703) 940-5410` everywhere else.
- The same page links the Alexandria new-patients number to `href="#"`, not a `tel:`.

Both are still wrong **on Webflow** and a patient reads that number there too.

### Also found, and not caused by this session

- **`/contact` 404s on the live Webflow site** while the nav's "Contact & Locations"
  links to it on every page. The CTAs go to `/contact-alexandria`. Webflow's own
  contact link is broken in production.
- **The home page has ZERO `.rv-card` review fallbacks again** (third time). They were
  restored 2026-08-22; the client's pasted review widget has replaced that block
  since. Verified against the pre-session backup — it was already 0 before any write
  here. With the widget slow or blocked there is now no review copy and no no-JS copy
  for a crawler. `node restore-review-wall.mjs --apply` puts them back.
- **`seo.json`'s contact JSON-LD carried the pre-August phone numbers**
  (`571-619-9442`, `571-410-3430`) while the page body published the current ones.
  Fixed to `571-702-9900` / `571-253-7790`.

### Gates

- `site-test.mjs` **637/637** (was 603; the two new pages add 34 checks).
- `interaction-test-gsap.mjs` **62/64** — the same two pre-existing failures.
- **Both gates need a server**: `node serve.mjs final-site 8902`, then
  `node site-test.mjs` and `node interaction-test-gsap.mjs http://127.0.0.1:8902/index.html`.
  Without it every check fails with a title of `127.0.0.1` and the harness throws
  `Uncaught` on `#burger` — which reads like a code fault and is not one.

### One gate was changed, and why it is not weaker

`site-test.mjs`'s "no CSS or JS inlined into the page" counted `<style>` in the LIVE
DOM. LeadConnector's `form_embed.js` injects a 2.8 KB `.ep-*` `<style>` into `<head>`,
so both new pages failed for a stylesheet this repo does not write and cannot remove.
It now counts the **shipped document** instead, with comments stripped first (the page
bodies discuss their own markup — `"One <style> + one <script>"` is a real comment).
A `<style>` or inline `<script>` we author still fails, on every page, embed or not —
**verified non-vacuously** by injecting both into a built page and watching it fail,
then rebuilding and watching it pass.

### What is left

1. **NOT PUBLISHED.** `POST /publish` bakes all 35 pages. Audit before and after:
   `node ../08-qa/.tmp/audit-site.mjs --base https://encorercm.com --only index` then
   `git diff ../08-qa/.tmp/audit-out/`.
2. **Nothing is committed yet** — the working tree holds the whole change.
3. The `.rv-card` decision above.
4. The `ogImage` / `seo-head.js` DRAFT work from session 7 still has no sign-off.
