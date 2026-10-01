# 2026-10-01 — BugHerd round seven: eleven notes on the ad pages, ten closed

gauge@ left eleven notes (#254–#264) on the six `/ads-landing-pages/` pages on 2026-09-28. Ten
are fixed on staging and production and moved to done, each with a reply. **#256 stays in todo**:
it asks for a GoHighLevel form's Submit label, which is set in GHL. BugHerd now shows **1 open
note out of 262**.

## Done

Implementation commit `c010d10f` on `bk-mason-park` (not pushed, not merged).

Tools are in `workflows/09-static-rebuild/.tmp/bugherd/`. The pull is `open-2026-10-01.mjs`, which
fetches only the open notes. Its first run is in `open-pull-2026-10-01.log`, untracked like the
other exports; the recount overwrote `tasks-open-2026-10-01.json`. The checks are in `r7/`, the
chain is `push-r7-2026-10-01.sh`, and the replies are `reply-2026-10-01.mjs`.

| Note | Fix |
| :--- | :--- |
| #254 | Invisalign thank-you step 01 replaced with the reviewer's text ("Dr. Dave Cho" in full). |
| #255 | `scroll-margin-top: 7rem` on `.lp-form-card` and `.ch-call`. **The scroll margin alone did not fix it** (see the Gotchas). `journey.js` no longer lifts and fades a hero that holds the form, and it re-scrolls to an anchor's target after a ScrollTrigger refresh within 4 s of the click. |
| #257 | No better photo exists. The practice's headshot is 750px, and Magnific changed his face on 09-24. CSS caps the portrait at 480px under 900 wide (framed in ink) and the ink column at 560px above. **These caps are in px on purpose**: the fluid root made 36rem 668px. Ask the practice for a 2000px+ headshot. |
| #258 | "The $189 visit is the same either way" removed. `terms` ("New patients • self-pay • periodontal cases excluded") under the hero buttons and in the form card on both $189 pages (`.lp-terms`). |
| #259 | Badge label is now "Practice affiliations and credentials". Dr. Cho's Tufts DMD is correct per the practice's own Our Doctors bio. Dr. Nguyen's degree is from Boston University. |
| #260 | `body:has([class*="termly-styles-termly-banner"]) .lp-rail` hides the rail while Termly's banner is up. Termly removes that node on Accept, Decline or Preferences. |
| #261, #262 | Copy replaced with the reviewer's text. |
| #263 | **Site-wide.** Every `<img>` had two alts. `base.image` always writes `alt="<media asset altText>"`, and `apply-image-alt.mjs` added one through `htmlAttributes`. Alts now live on the media assets (`set-media-alt.mjs`, a new chain step; 273 assets per instance), and the nodes carry none. The README chain section is updated. |
| #264 | Two causes. (1) `src/styles/mason-park-lp.css`, from the retired Webflow ad ports, was bundled into every page, and its webflow-icons `data:` font broke strict CSP. It is removed along with `lp-faq.js` (`r7/remove-lp-assets.mjs`). (2) The Cloudflare Insights beacon is now allowed: `scriptOrigins += static.cloudflareinsights.com`, `connectOrigins += cloudflareinsights.com` (`r7/set-csp-insights.mjs`). Both affected every page without an Embed, not only the thank-you pages. |
| #256 | Open. Suggested "Claim My $189 Visit" on the New Patient Special form and "Book My Free Consultation" on the Invisalign form. Someone with GHL access has to make the change. |

Order per instance: `backup-site.mjs` → `r7/remove-lp-assets.mjs --apply` → `r7/set-csp-insights.mjs
--apply` → `TARGET=… bash bugherd/push-r7-2026-10-01.sh` → `import-scripts.mjs --publish` (the
anchor fix came after the chain). Backups: `backup-staging…2026-10-01T17-42-59.json` and
`backup-www…2026-10-01T17-59-35.json`.

## Verified

- Local: `check.mjs` 231 pages, 0 errors. `doctor-names.py --check` 0. The generator reproduced
  the committed pages byte for byte before the edits.
- `r7/compare.mjs` compared snapshots of every URL taken before and after:
  - Staging: 224/224 return 200. 0 of 1,748 `<img>` lack exactly one alt. The only differences
    outside the ad pages are the blog loop id, re-minted by the template re-import, and three
    `&nbsp;` → space on `/hipaa-disclosure` (local twin vs. the injected row).
  - Production: 254/254 return 200. 0 of 1,988 images fail the alt check. 241 non-ad pages are
    identical, and `/hipaa-disclosure` differs by the same three spaces.
  - 14 alts changed value: a decorative copy of a described file now carries the description
    (aria-hidden), and the two-phrasing files use their most common text. On production, 168 more
    images on old pages went from `alt=""` to a real description: logos and credential marks.
- `r7/csp-probe.mjs`: 0 CSP violations on all six ad pages, on both instances.
- `r7/live-check.mjs`: all 15 checks pass on both instances, including the real Termly banner on www.
  `r7/anchor-repeat.mjs` passes 9/9 on each instance (864, 390 and 1440; clicks 0.8–3.5 s after load).
- The production code assets still include the two consent scripts.

## Gotchas

- **A ScrollTrigger refresh cancels a smooth anchor jump.** `refresh()` scrolls to 0 to measure
  and then back. The GHL form iframe resizes 3–4 times in the first ~10 s, and each resize fires
  `journey.js`'s height watcher. "Form" bounced back to the top about one time in three on
  production, and never in the first staging tests. The fix is the re-scroll on `refresh`.
- **The hero's departure tween moves the form.** `.ar-in` lifts −14% and fades to 0.15 opacity
  on scroll, so an anchor in the hero lands short, and the form fades while it is being filled
  in. It is now skipped when the hero holds `.lp-form-card`.
- **`base.image` alt is the media asset's altText, full stop.** Neither `props.alt` nor
  `htmlAttributes.alt` replaces it. Media is per instance: `set-media-alt.mjs` must run in the
  same chain run as `upload-media.mjs` / `apply-image-alt.mjs`, because the srcs in
  `media-alt.json` belong to that instance.
- A "scoped" code asset is not scoped for styles: `mason-park-lp.css` was meant for six page ids
  and was in every page's userStyles bundle.
- `open-2026-10-01.mjs` rewrites `tasks-open-2026-10-01.json` on each run, so a recount replaces
  the pull.

## Next

- #256: the GHL Submit labels (in GHL, by someone with access), then close the note.
- Ask the practice for a high-resolution headshot of Dr. Dave Cho (#257).

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
