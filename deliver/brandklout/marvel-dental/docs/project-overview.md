# Marvel Dental (Brandklout)

White-label client of Brandklout. Live Webflow site: **Marvel Dental Main**,
`69aedbc6b0c7e78051fd6a2c`, serving `marveldentaldds.com`.

Four other sites in the workspace carry the name (`Marvel Dental`, `… v2`, `… v3`, `Copy of … v2`).
They sit in the scratch and archive folders and are old design iterations. **Marvel Dental Main is
the only deliverable site** — it is the one with the live domain, in the same folder as every other
live Brandklout client.

## Current work: the dental emergency funnel

A three-page paid-traffic funnel, per
[the Brandklout funnel shape](../../docs/DESIGN-STANDARD.md) and the Arvada v2 precedent:

| Page | Slug | Webflow page id |
| :--- | :--- | :--- |
| Landing | `/ads-landing-pages/emergency-dentist` | `6a875326a493a891fd87d30a` |
| Consultation | `/ads-landing-pages/emergency-dentist-consult` | `6a87561bee07bd22cd8998cb` |
| Thank you | `/ads-landing-pages/emergency-dentist-thank-you` | `6a875664e0d205ff3cbd0121` |

**Those three pages already existed when this work started** (created 2026-08-20, ~19:20 UTC).
They hold a copy of the Arvada Dental Center campaign structure, with Arvada's `camp_` classes,
Arvada's Colorado copy, and Arvada's photography. They are unpublished. Nothing in this build has
touched them yet.

### What is built

Everything local, in `workflows/04-design/.tmp/v1/`:

- `_shared/camp.css` + `camp-convert.css` + `camp-sections.css` — the campaign class layer, taken
  from Arvada's proven structure and re-themed onto Marvel by `_shared/theme.mjs`. Re-runnable and
  auditable: the colour and font mapping is declared in one table.
- `_shared/*.tokens.html` — three slotted templates (landing, consult, thank you).
- `content/_base.json` — the practice-wide facts. Phone, address, hours, credentials, images, the
  GHL embed. Written once so three pages cannot drift.
- `content/emergency*.json` — the page copy.
- `emergency/`, `emergency-consult/`, `emergency-ty/` — rendered `index.html` (reviewable offline)
  and `body.html` (what the Webflow builder inserts).

Render with `node workflows/07-webflow-build/.tmp/native/render-page.mjs emergency [consult|ty]`.
It fails loudly on an unfilled slot.

QA: `node workflows/08-qa/.tmp/shots.mjs` (full pages at 1440 and 390, with a horizontal-overflow
assertion) and `slices.mjs <page> <width> <y…>` for 1:1 detail.

### What is on the site now

All three pages are **built and published to the Webflow subdomain**:
`https://marvel-dental-main.webflow.io/ads-landing-pages/…`. Nothing has gone to
`marveldentaldds.com` — every publish was `publishToWebflowSubdomain: true, customDomains: []`.

- **Class layer**: 1224 declarations match the stylesheet, 0 pending
  (`node diff-classes.mjs`). The cloned layer carried Arvada's values, so it was *updated*, not
  created: `apply-classes.mjs` handles the five shapes that each fail silently otherwise.
- **Pages**: 630 / 174 / 185 elements, 147 / 72 / 66 classes, 22 / 3 / 3 images, all bound to real
  Marvel assets.
- **Gate**: `node verify-v2.mjs` → **3/3 pass** against the served pages, and
  `node ../../08-qa/.tmp/mobile-bar-check.mjs` proves the sticky call bar is reachable at 390.

Three things only the SERVED page could reveal, all fixed:

1. **Webflow serves no global anchor reset on this site.** A bare `<a>` renders browser-blue and
   underlined, so the header phone number shipped as a 1996 hyperlink. Every link class now states
   its own colour and `text-decoration`.
2. **`display: none` on `.camp_announce`**, inherited from the clone. A value diff cannot see it:
   the stylesheet never mentioned `display`, so there was nothing to compare. `extras.mjs` reports
   this class of leftover.
3. **The site's Google-review badge covered the mobile call bar.** The bar now sits at z-index
   99999 and the hit test passes on both halves.

### The footer pass, 2026-08-21

The same footer was authored three separate times, once per template, and the three copies had
drifted. Two of them split the address across a link and a following `<p>`, which in a flex column
put a 16px row gap between "1113 Main Avenue, Suite A" and "Clifton, NJ 07011" — the city read as
an unrelated line rather than as part of the address. Two of them also carried `camp_header_cta` on
the footer button, a copy-paste leftover from a header those pages do not even have; below 767px
that class shrinks the button to 9px text with 14px padding, so the same footer button was two
different sizes across the funnel.

Fixed on the canvas and in the templates, and gated on the staging subdomain: all three footers now
measure identically (heading 0→20, first item at 48, address 84→124, column height 124 at 1440) and
the button is `358x55` at 14px on all three at 390.

`.camp_footer_col`'s 16px gap is now **declared** in `camp.css`. The site had been serving
`grid-row-gap: 1rem` since the Arvada clone while the local stylesheet said nothing about a gap, so
`diff-classes.mjs` reported the class clean — it can only compare properties we declare.

> [!IMPORTANT]
> **The client edits and publishes this site too.** By 2026-08-21 the served pages carried Designer
> edits that the local build did not: the office hours had been merged into one text node, and the
> GHL form embed had been replaced with the real one. Read the published HTML before assuming local
> is live, and never re-render a whole page over live edits.

### Still to do

- **Office hours contradict the client's own site.** The funnel says *Monday to Friday, 9:00 AM to
  5:00 PM · Saturday 9:00 AM to 2:00 PM*. `marveldentaldds.com`, [brand.md](./brand.md) and the
  local content all say *Tuesday to Friday, 9:00 AM to 5:00 PM · Saturday 8:00 AM to 4:00 PM*.
  Wrong hours on a live paid emergency page. **Needs the client's answer**, then one of the two
  has to change.
- **A duplicate Elfsight Google Reviews widget ships site-wide.** `elfsight-app-dd6f5ce5-…` sits in
  Site Settings → Custom Code → Footer, on all 77 pages, and duplicates the in-page widget on the
  consultation page (`5b4f0a1d`). Every page therefore loads Elfsight's `platform.js` twice.
  Removing it is a site-wide change to the client's production site, so it is theirs to approve.
- Three real review quotes, if the client can supply them.
- Publish to `marveldentaldds.com` — **not done, and the user's call.** The footer fix is live on
  the staging subdomain only; the custom domain still serves the split address.

### Decisions taken with the user

| | |
| :--- | :--- |
| Campaign phone | (973) 264-0928, the existing tracking line |
| Hook | Same-day relief, no discount offer |
| Lead capture | LeadConnector (GHL) embed, form `jCl4STYpcyNUkavVj58F` ("Marvel Dental Google Ads"), read off the served page 2026-08-21 and now in `_base.json` |

## Version Control

Per [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). See also [brand.md](./brand.md) for the measured
brand basis, and `../docs/mcp-access.md` for the Webflow grant this work uses.
