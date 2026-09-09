# 2026-09-09, evening — Where the fees come from, and the list to get them confirmed

## What was asked

> Where do we pull the pricing on the services? I need to know where that is from.

## The answer

**The practice's own archived price page.** Nothing on the site was priced by us. Two independent
copies of `stonesurgicalarts.com/patient-resources/pricing/` agree figure for figure:

- the Wayback capture used at intake, timestamp **20260316182842**, screenshot
  `105-patient-resources-pricing.png` in `01-content-intake/.tmp/wayback-screenshots/`;
- the client's **own site backup**, supplied 2026-09-09, at
  `01-content-intake/.tmp/website-files/patient-resources/pricing/index.html` (files dated
  September 2025).

They were transcribed into `SURGICAL-ARTS-BRIEF.md` under the heading **"Treatment pricing —
UNVERIFIED … must be re-confirmed before publishing"**, and hand-placed from there into the page
markup. There is **no pricing data file and no CMS field**: each figure lives in
`site-src/pages/*.body.html` as `spec_fee`, `matrix_fee`, `mbar_fee`, `dhero_chip`, FAQ answers and
related-card copy, and the memberships calculator does arithmetic on the same numbers.

**They were never re-confirmed, and the site published anyway.** No runbook entry records a price
check. `treatments.html` carries a hedge in its own footer — "a guide while they are reconfirmed
for 2026" — which is mitigation, not a fix.

## Done

- Extracted every price from the built site: **140 occurrences across 9 pages**, resolving to
  **44 published fees plus 6 items quoted at consultation**. `treatments.html` is the only page
  carrying the whole schedule; the rest repeat a subset, so a single correction can touch seven
  pages (the consultation fees) or five (blepharoplasty).
- Wrote [`docs/PRICING-CONFIRMATION.md`](../PRICING-CONFIRMATION.md) — the list, its provenance,
  and the three items that need a decision rather than a tick.
- Published the client-facing version as an artifact:
  <https://claude.ai/code/artifact/e54a7c1f-a0f2-444d-82d4-801b4e0ac3a3>. Fifty rows, Confirm /
  Correct on each, and a "Build the summary" button that emits the edit list.
- Added the standing risk to [`docs/RUNBOOK.md`](../RUNBOOK.md) under Next.

## The three that are not simple confirmations

1. **Blepharoplasty $3,400** — the site says "upper or lower", and the two snapshots disagree on the
   figure itself: the later says $3,400, the earlier $3,200–3,600. The open question about whether
   $3,400 buys upper OR lower has been in `blepharoplasty.body.html` since 2026-09-04 and has never
   been answered.
2. **Cosmelan peel** — the archived page lists it **twice at different prices**, $800 in the skin
   table and $872 in the nurse-injector table. We published $800.
3. **Membership tiers** — $125 / $250 / $500 a month at a 0% / 10% / 15% banking uplift are **our
   proposal**. The practice never published tiers, so nothing about them is archived fact.

## Gotchas

- **A `db`-backed artifact could not have been used here.** Declaring the `db` capability makes an
  artifact organization-internal: every reader and writer must be a signed-in member of the owner's
  organization. Dr. Stone is a client, not an org member, so a page that saves her answers
  server-side would be one she cannot open. The published page therefore declares **no
  capabilities**, keeps marks in the reader's own `localStorage`, and closes the loop with a
  "Build the summary" button she copies back. If she is ever added to the workspace, the same page
  can be republished with `db` and the answers read straight out of the store.
- **The repo rule against recording prices is about OUR rates, not the client's fees.**
  `CLAUDE.md` says never record a price, rate, quote or cost under `deliver/brandklout/`, and the
  stated reason is that Brandklout is a partner engagement rather than a per-page client. The
  practice's own published service fees are site content, already stored throughout `site-src/` and
  the intake brief, and `PRICING-CONFIRMATION.md` says so in its own Version Control section.
- **Do not "fix" a fee from the archive again.** Both archived copies are already reflected. The
  next change to any figure comes from Dr. Stone.

## Next

- Send the artifact to Dr. Stone, apply the answers to `site-src/pages/*.body.html`, rebuild,
  republish, and take the "reconfirmed for 2026" hedge out of the treatments footer.
- Unrelated and unchanged: the journal (39 articles) has had no client review pass.

## Version Control

Tracked. Committed with the work it describes.
