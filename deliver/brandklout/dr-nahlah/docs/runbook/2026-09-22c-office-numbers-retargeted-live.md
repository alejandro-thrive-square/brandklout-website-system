# 2026-09-22c — New-patient numbers retargeted per office, LIVE on 79 URLs

Client instruction: "Alexandria: 571-617-7245, Tyson: 703-448-3312 — these are the correct ones
for each location." Confirmed before touching anything that the new/current-patient split stays
and these two take the **new patients** slot.

| office | new patients | current patients |
| :--- | :--- | :--- |
| Tysons Corner · McLean | (571) 702-9900 -> **(703) 448-3312** | (703) 448-3312, unchanged |
| Alexandria | (571) 253-7790 -> **(571) 617-7245** | (703) 940-5410, unchanged |

**Tysons therefore shows the same number on both of its lines.** That is the client's call,
made with the duplication shown to them. Collapsing Tysons to a single line is a change to
`partials/drawer.html`, `partials/footer.html` and `partials/lp-office.html`.

## Done

Commit: `ede9b71a`. Published and audited: **79/79 URLs clean**, head and body.

- **`04-design/.tmp/retarget-office-numbers.mjs`** (new) — rewrites the source. 165
  replacements across 38 files, then refuses to exit 0 if any retired form survives.
  Rebuilt 56/56.
- **`22-instatic-api-sync/push-office-numbers.mjs`** (new) — rewrites the live document.
  **701 strings across all 57 pages.** Every string in a node's props, not just `href`/`text`,
  because the numbers are also in aria-labels.
- **`22-instatic-api-sync/push-component-numbers.mjs`** (new) — the shared `cta-offices`
  component, which the site-document write could not take (see gotchas). 4 strings.
- **`16-instatic-plugins/retarget-seo-numbers.mjs`** (new) — the head. The
  `brandklout.aeo-schema` `telephone` and its 3KB `organizationJson`, plus the two
  materialised Open Graph descriptions.
- **`22-instatic-api-sync/audit-live-numbers.mjs`** (new) — sweeps every sitemap URL for any
  retired form and says whether the hit is in the HEAD or the body, because the two have
  different fixes. **This is the check to run; the others only prove their own half.**

## Gotchas

- **Fixing the page nodes does NOT fix the head, and a body check passes while Google is
  still being told the old number.** After all 57 pages were clean, every page still published
  `+1-571-702-9900` in its JSON-LD and two pages still had the old number in
  `<meta name="description">` / `og:` / `twitter:`. None of that comes from the page tree:
  the schema is `brandklout.aeo-schema` plugin settings, and the descriptions are
  **materialised per page** in the `brandklout.open-graph` **runtime store**
  (`/plugins/brandklout.open-graph/runtime/pages`), not in the pages table.
- **Two numbers were in the structured data that were on no page at all** —
  `+1-571-619-9442` (McLean) and `+1-571-410-3430` (Alexandria), in `seo.json`'s `/#office-*`
  blocks and in `gen-gallery.mjs`. They never reached the live site, but they were in
  `final-site/index.html` and one republish of that block would have put them in front of a
  crawler. Retired into the same replacements.
- **`populate-seo.mjs` still points at the pre-migration `webzite.*` plugin ids** and would
  404 against the runtime routes. Same stale-id class as `restore-review-wall.mjs`. Use
  `retarget-seo-numbers.mjs`, or fix the ids first.
- **`changedComponents` on `PUT /site-document` rejects everything tried** — the raw component
  row and the flat `{id,name,slug,nodes,rootNodeId,params,classIds}` that mirrors
  `toChangedPage` both return a bare `400 Invalid request body`. The component goes in through
  `PATCH /admin/api/cms/data/rows/:id` instead. Safe here only because `cta-offices` has no
  slash in its slug and is not routable — that PATCH re-derives the route and would flatten a
  nested one.
- **The page write is site-document, so the 18 nested ads slugs survive.** It drops
  `seoTitle`/`seoDescription`, which costs nothing: those two cells are **inert at publish
  time** (see the header of `push-page-seo-cells.mjs`) and only the home page had them. Put
  that one back with `--only index`, which cannot be flattened.
- **The write is split into two calls on purpose** — pages first, component second — so a 400
  on the less certain shape cannot also lose 57 pages. It did 400, and the pages were fine.
- **A meta description named both lines.** Once Tysons' two numbers became the same, its
  description read "New patients (703) 448-3312, current patients (703) 448-3312". Collapsed
  to "Call (703) 448-3312." in `seo.json` and in the stored override.

## What is next — BOTH BLOCK CALL TRACKING

1. **The DNI pool forwards from `(571) 253-7790`, which is no longer on any page.** Proved
   after publishing: nothing swaps. Repoint the pool's forwarding numbers in LeadConnector to
   `(703) 448-3312` and `(571) 617-7245`. Not reachable from this repository, and there is no
   GoHighLevel credential in `.env`.
2. **The two LeadConnector tags are now consent-gated, and this was not us.** They publish as

   ```
   <script type="text/plain" data-categories="advertising" src="…number_pool.js" data-wz-site-script>
   ```

   Earlier the same day they were plain `<script src async>`. The cookie-consent run tagged
   them `advertising`, so `number_pool.js` does not execute at all until a visitor accepts
   advertising cookies — `window.numberPool` is undefined and no request fires. Whether call
   tracking should be consent-gated is a compliance decision, not a bug to quietly undo, but
   until it is settled DNI is off for everyone who has not consented. Note this is the same
   class of trap as the standing "Termly autoBlock=off" note: something that holds back a
   third party until consent.
3. Decide whether `(703) 940-5410` (Alexandria, current patients) is still right. It was not
   mentioned and has been left alone.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
