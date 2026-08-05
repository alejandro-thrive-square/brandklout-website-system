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

**All three pages are built, verified and awaiting review.** Nothing has been sent to Webflow, and
nothing has been written to Asana.

| Page | Package | Asana task GID |
| :--- | :--- | :--- |
| Invisalign<sup>&reg;</sup> — $1,000 off | [`workflows/04-design/.tmp/invisalign/`](../workflows/04-design/.tmp/invisalign/index.html) | `1217133289235652` |
| $189 New Patient Special | [`workflows/04-design/.tmp/new-patient-special/`](../workflows/04-design/.tmp/new-patient-special/index.html) | `1217162605683021` |
| Thank you | [`workflows/04-design/.tmp/thank-you/`](../workflows/04-design/.tmp/thank-you/index.html) | `1217040406855602` |

Start at [`workflows/04-design/.tmp/README.md`](../workflows/04-design/.tmp/README.md) — it covers the
design system, how to restore the gitignored images, and what is deliberately not done.

Verification is functional rather than visual: **50/50 checks pass** via
[`workflows/08-qa/.tmp/verify.mjs`](../workflows/08-qa/.tmp/verify.mjs).

## Resolved since scaffolding

**1. `mpd-invisalign-lp.html` — resolved. It is the previous ad company's page, not a deliverable.**
A static rebuild of the earlier agency's GoHighLevel landing page, carrying their GTM container,
their StatCounter project, GHL-hosted images and a lead form wired to nothing. It is the "originals
from the other Ad company" the parent task refers to. It did **not** remove any scope. It has been
moved out of the folder root to
[`workflows/01-content-intake/.tmp/prior-work/`](../workflows/01-content-intake/.tmp/prior-work/README.md)
with a full provenance write-up, and mined for the client copy that exists nowhere else.

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

1. **GHL call-tracking number — blocking launch, not build.** The previous agency's page hard-codes
   **(281) 767-8698**, which appears in no public listing for this practice and is on the evidence
   their tracking number. The practice's real public number is **(281) 769-8878**. All three pages
   currently render the public number and read it from one constant (`TRACKING_PHONE` in
   `shared/mpd.js`) so the swap is a one-line change. Needs GHL access, which this folder does not
   have. **Do not reuse (281) 767-8698** without confirming who owns it.

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

8. **Asana attachments still not retrieved.** The parent task's *"originals from the other Ad
   company"* attachments have not been downloaded. The loose HTML file appears to be exactly that
   material, so this is likely already covered, but `get_attachments` on `1217040406855582` would
   confirm and may surface the New Patient Special original too.

9. **Office hours conflict — resolved in favour of the live site.** The old page flattens Tuesday and
   Thursday to 9am–6pm; the live site says 8am–5pm. The pages use the live site. Worth a sanity check
   with the practice.

## Reference material

House references cited on the parent task, captured to
`workflows/01-content-intake/.tmp/reference-captures/`:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/

## Build target

**Webflow** (confirmed 2026-08-05). GHL is the lead destination only.

Sequence: build locally → review → Webflow. The local stage is complete. Webflow needs a per-client
grant that does not exist yet — see [mcp-access.md](./mcp-access.md).

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Done** | Client site, offers, doctors, real reviews, reference captures, prior-work triage. |
| `04-design` | **Done — awaiting review** | Three self-contained packages plus a shared design system. |
| `07-webflow-build` | **Blocked** | Needs local approval and a Webflow grant. |
| `08-qa` | **Done for the local build** | `verify.mjs`, 50/50. Re-run after any change. |

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
    │   ├── capture.mjs                  # bot-wall-aware page capture
    │   ├── client-site/                 # captures of the practice's own pages
    │   ├── reference-captures/          # + structure-briefs.md
    │   └── prior-work/                  # the previous agency's page + triage
    ├── 04-design/.tmp/                  # the three packages + shared/
    └── 08-qa/.tmp/verify.mjs            # functional verification
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation, HTML,
CSS and JS are committed; images and screenshots are gitignored and regenerated with
`node shared/fetch-assets.mjs`.
