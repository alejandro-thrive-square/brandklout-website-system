# Project Overview — Mason Park Dental

| Field | Value |
| :--- | :--- |
| **Client** | Mason Park Dental of Katy |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Mason Park Dental` |
| **Asana parent task** | `1217040406855582` — [Landing Page - Mason Park](https://app.asana.com/1/1210572425689866/task/1217040406855582) |
| **Scope** | 3 paid-traffic landing pages |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder scaffolded from Asana dispatch) |
| **Live site** | **https://bestdentistinkatytx.com/** (`masonparkdental.com` 302-redirects here) |

## Status

### 2026-08-25 — SCOPE CHANGED: full static rebuild of the main site

The client's WordPress install is compromised and SiteGround is taking it down, so the job is now
an **emergency rebuild of the whole main site as static HTML**, to be hosted on **Instatic**. That
supersedes the paid-landing-page work below as the active priority; the three landing pages are
unaffected and stay where they are.

**The main site is rebuilt: 71 pages + 404, on Client-First with a reusable component
library, and exports cleanly for Instatic import.** Four gates pass: content audit, layout at
three widths, page weight, and the export's own validation. Blog posts (~180) are deliberately
out of scope for this pass.

See [`workflows/09-static-rebuild/README.md`](../workflows/09-static-rebuild/README.md) — how to
build it, what was authored rather than copied, and the open items for the client. Three of those
matter beyond this rebuild:

- the old site published **four awards the practice has not won** (ThemeREX demo content, CSS-hidden
  but present in the HTML on every Elementor page);
- the smile gallery was **theme stock photography** presented as the practice's own results;
- the site publishes **two contradictory sets of office hours** (see Open Question 9, still open).

### 2026-08-06 — the three landing pages

**All three pages were rebuilt as journeys on 2026-08-06 and are awaiting review.** The client
rejected the first round as *"a plain card website design"* rather than *"an interactive journey"*.
That was an architecture problem, not a polish problem: the pages were a vertical stack of coloured
bands holding card grids, with the whole motion layer built from `IntersectionObserver`. They are
now 6–8 named chapters each, with scroll-driven pinned and scrubbed beats, per
[DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md). Content did not change — only how the pages
are built. Nothing has been sent to Webflow, and nothing has been written to Asana.

| Page | Package | Asana task GID |
| :--- | :--- | :--- |
| Invisalign<sup>&reg;</sup> — $1,000 off | [`workflows/04-design/.tmp/invisalign/`](../workflows/04-design/.tmp/invisalign/index.html) | `1217133289235652` |
| $189 New Patient Special | [`workflows/04-design/.tmp/new-patient-special/`](../workflows/04-design/.tmp/new-patient-special/index.html) | `1217162605683021` |
| Thank you | [`workflows/04-design/.tmp/thank-you/`](../workflows/04-design/.tmp/thank-you/index.html) | `1217040406855602` |

Start at [`workflows/04-design/.tmp/README.md`](../workflows/04-design/.tmp/README.md) — it covers the
chapter arcs, the two deliberate deviations from the standard, how to restore the gitignored images,
and what is deliberately not done.

Verification is functional rather than visual, and runs on a focused tab:

| Gate | Invisalign | New Patient | Thank you |
| :--- | :--- | :--- | :--- |
| [`journey-audit.mjs`](../../scripts/journey-audit.mjs) — static architecture | PASS | PASS | PASS |
| [`scrub-proof.mjs`](../workflows/08-qa/.tmp/scrub-proof.mjs) — motion actually scrubs | 20/20 | 20/20 | 20/20 |
| [`screens.mjs`](../workflows/08-qa/.tmp/screens.mjs) — six breakpoints | 18/18 | 18/18 | 18/18 |
| [`root-proof.mjs`](../workflows/08-qa/.tmp/root-proof.mjs) — fluid root is live | 46/46 | 46/46 | 37/37 |

All three pages now pass the static gate. The thank-you page was built at four chapters as a
documented deviation; that deviation was **overruled on 2026-08-07** and the page brought up to the
standard instead — six named chapters, three pinned and scrubbed. See Open Question 10, now closed.

## Resolved since scaffolding

**1. `mpd-invisalign-lp.html` — resolved. It is the previous ad company's page, not a deliverable.**
A static rebuild of the earlier agency's GoHighLevel landing page, carrying their GTM container,
their StatCounter project, GHL-hosted images and a lead form wired to nothing. It did **not** remove
any scope.

**Both** vendor originals have since been pulled from Asana into
[`.tmp/asana-context/attachments/`](../workflows/01-content-intake/.tmp/asana-context/attachments/),
GID-stamped — the Invisalign page *and* a New Patient Special page we did not previously have. That
folder is now the single source of truth; the loose root-level copy has been removed rather than
duplicated. Analysis of both lives in
[vendor-originals.md](../workflows/01-content-intake/.tmp/vendor-originals.md).

**2. Client website — found.** Not recorded anywhere in Asana; located by search and confirmed by
the redirect from `masonparkdental.com`. Recorded in [mcp-access.md](./mcp-access.md).

**3. Offers and pricing — resolved from the client's own `/special-offers/` page.** The Invisalign
figures now have a complete ladder: regular $4,800, special $3,800 ($1,000 off), a further $500 off
when prepaid in full, insurance payments reimbursed to the patient. The $189 New Patient Special is
exam + x-rays + cleaning + full treatment plan, stated by the client as $328 in savings.

**4. Content sourcing — resolved.** Ten real Google reviews, three doctors with photos confirmed
visually, real clinical copy and 21 real FAQ answers, all captured from the client's own site into
[content-intake-summary.md](../workflows/01-content-intake/.tmp/content-intake-summary.md).

**5. The tracking-number question — diagnosed, not closed.** See Open Questions 1.

## Task manifest

| Task | GID | Spec from Asana |
| :--- | :--- | :--- |
| [Invisalign Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235652) | `1217133289235652` | Inspiration: `tulipdent.com/Beautifulsmile/invisalign-treatment-in-redlands/` — captured, structure extracted |
| [New Patient Special Landing Page](https://app.asana.com/1/1210572425689866/task/1217162605683021) | `1217162605683021` | Inspiration: `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC` (captured), `greenspotcrossingsdentistry.com/lp/59-nps/` (Cloudflare-blocked, not needed) |
| [Thank you Page](https://app.asana.com/1/1210572425689866/task/1217040406855602) | `1217040406855602` | 4 sections, built verbatim + **GHL tracking number still outstanding** |

## Shared archetype — report back to main

The thank-you page is built as the **shared archetype for both Mason Park and Grand Mission**
(task `1217040406855578`), which carry an identical four-section spec. Structure and stylesheet are
shared; everything client-specific is isolated to the constants block at the top of
`shared/mpd.js` plus two marked blocks in the HTML. Grand Mission should clone rather than rebuild.

Also worth passing on: the GHL reference URL cited on the New Patient Special task **is a Grand
Mission page**, not a generic template. Its offer, insurance carriers, award and hours are Grand
Mission's and must not be copied into other clients. Details in
[structure-briefs.md](../workflows/01-content-intake/.tmp/reference-captures/structure-briefs.md).

Per [ORCHESTRATION.md](../../docs/ORCHESTRATION.md) these are cross-cutting, so they are recorded
here rather than edited into the shared `ASANA-DISPATCH.md` from this worktree.

## Open Questions

1. **Call-tracking numbers — now wired per page; ownership still needs confirming.** Both vendor
   originals are in hand and they carry **different** numbers, confirming per-page call tracking:
   **(281) 767-8698** on Invisalign, **(281) 688-1610** on the New Patient Special, against a public
   number of **(281) 769-8878**. Each page now renders its own. The thank-you page has no original
   and no GHL number, so it falls back to the public number unless the form's `?src=` carries a
   campaign number through.
   **Action needed: dial both tracking numbers before any spend starts.** The outgoing vendor
   provisioned them and they may no longer route to the practice. If either is dead, set its entry
   in `MPD.TRACKING` to `null` and it falls back to the public number immediately. A dedicated GHL
   number for the thank-you page is still outstanding, as the Asana task asks.

2. **GHL inbound webhook URL.** The lead forms post to `{{GHL_INBOUND_WEBHOOK_URL}}`. Until it is
   supplied the form states plainly that the endpoint is not connected and offers the phone number;
   it never fakes a success.

3. **Conversion tracking.** No tag is installed. The previous agency's GTM container `GTM-KWL239K7`
   and StatCounter project `12978118` are theirs and must not be reused. The practice's own
   container drops into the marked slot on the thank-you page.

4. **Cherry financing link points at the wrong practice.** The client's site links to
   `pay.withcherry.com/grand-mission-dentistry` — the sibling practice's account. Applications from
   Mason Park traffic may be attributed to Grand Mission. Flagged, not changed; the pages describe
   Cherry without linking to it.

5. **Dr. Sung's credentials need a source confirmation.** Tufts dental degree, 10+ years, AGD
   Fellowship (top 7% in Texas), 100+ CE hours a year — all taken from the GHL reference, which is a
   *Grand Mission* page. He practises at both and the credentials are personal rather than
   location-specific, but they are not published on Mason Park's own site.

6. **$189 offer exclusions.** The client's site states the offer and the $328 saving but publishes no
   exclusions. The reference page's fine print (periodontal disease, insurance combinability,
   Tricare, state-specific Delta clauses) belongs to a different practice and was **not** copied.
   The practice should confirm its own exclusions before the page runs on paid traffic.

7. **Dr. Sung's headshot is low resolution.** The only version on the client's site is 230×300, which
   is soft at landing-page scale. Request a high-resolution headshot; Dr. Cho's and Dr. Nguyen's are
   fine at 683×1024.

8. **What the $189 special actually includes — NEW, needs a decision.** The now-retrieved vendor
   original describes a **richer** offer than the client's own `/special-offers/` page: it adds a 3D
   mouth scan, bite analysis, soft tissue evaluation, gum/periodontal analysis and a CT scan, plus a
   *"Choose Your Exclusive Gift"* mechanic (free Sonicare or free KOR whitening kit, both PPO-only,
   or $250 off treatment of $750+). Our page uses the client's own narrower description, because
   under-describing is safer than over-promising and the gift tiers carry PPO eligibility conditions
   we cannot assert. **If the vendor's version is the offer as actually run, our page is
   under-selling it** and the gift choice is a strong conversion device worth adding. Detail in
   [vendor-originals.md](../workflows/01-content-intake/.tmp/vendor-originals.md).

9. **Office hours — three sources disagree; the pages follow the live site.** The Invisalign original
   flattens Tuesday and Thursday to 9am–6pm where the live site says 8am–5pm, and the New Patient
   original claims the practice is *"open on Saturdays as well, beyond regular hours"* where the live
   site says Friday, Saturday and Sunday closed. Our pages use the live site throughout. Worth one
   sanity check with the practice, since the thank-you page's open/closed indicator depends on it.

10. ~~**Thank-you page chapter count — needs a ruling.**~~ **CLOSED 2026-08-07: fix the page, not
    the standard.** Grand Mission's thank-you page passes at six chapters and three pins on the
    same Asana structure, so the bar is reachable on this page type and the exception was refused.
    Two beats were added from already-sourced material — **The Preparation** (pinned and scrubbed;
    insurance card, an existing treatment plan against the practice's standing free second opinion,
    and the questions to write down) and **The Team** (the three doctors and the five accreditation
    marks, all already used on the New Patient Special page). Asana's four sections all survive in
    order. **Still nothing invented**: no bio was written for Dr. Nguyen, because none exists on any
    client source.

## Reference material

House references cited on the parent task, captured to
`workflows/01-content-intake/.tmp/reference-captures/`:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/

## Build target

**Webflow** (confirmed 2026-08-05). GHL is the lead destination only.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page. The local
stage is complete. Webflow needs a per-client grant that does not exist yet — see
[mcp-access.md](./mcp-access.md).

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Done** | Client site, offers, doctors, real reviews, reference captures, vendor-original triage. |
| `04-design` | **Rebuilding** | Journey architecture — see [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md). |
| `07-webflow-build` | **Blocked** | Needs local approval and a Webflow grant. |
| `08-qa` | **Required after every change** | Scrub proof + responsive screenshots. |
| `09-static-rebuild` | **Built, awaiting review** | Whole main site as static HTML for Instatic. `node audit.mjs` is its gate. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/mason-park/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md
└── workflows/
    ├── 01-content-intake/.tmp/
    │   ├── content-intake-summary.md    # every sourced fact, with provenance
    │   ├── vendor-originals.md          # triage of the previous agency's two pages
    │   ├── capture.mjs                  # bot-wall-aware page capture
    │   ├── asana-context/               # task tree + GID-stamped attachments
    │   ├── client-site/                 # captures of the practice's own pages
    │   └── reference-captures/          # + structure-briefs.md
    ├── 04-design/.tmp/                  # the three packages + shared/
    └── 08-qa/.tmp/verify.mjs            # functional verification
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation, HTML,
CSS and JS are committed; images and screenshots are gitignored and regenerated with
`node shared/fetch-assets.mjs`.
