# Livewell Dental — implant eligibility quiz + thank-you page, pasteable payloads

**Generated**: 2026-08-07 · **Status**: converted, QA-passed, behaviour-verified, **not yet pasted, not published**

Two pages cloned from Smart Arches Dental and rebuilt on the Livewell design system:

| Reference | Livewell page | Payload |
|:---|:---|:---|
| `https://smartarchesdental.com/quiz/` | `livewell-implant-quiz.html` | `.tmp/page-quiz/paste_01_page_quiz.html` |
| `https://start.smartarchesdental.com/thank-you` | `livewell-thank-you.html` | `.tmp/page-ty/paste_01_page_ty.html` |

Reference captures (desktop + mobile) are in
`../04-design/.tmp/smartarches/refs/`. Design rationale, the content deviations and the
open questions for Dr. Chris are in `../04-design/.tmp/design-notes.md`.

## One paste per page

Each payload has **exactly one root node** (`.page_quiz`, `.page_ty`), so each page is a
single paste. A multi-root payload is what crashes the Designer (Giovanni precedent), not
size.

| | Quiz | Thank you |
|:---|---:|---:|
| Nodes | 463 | 277 |
| Styles | 99 | 93 |
| Roots | **1** | **1** |
| HtmlEmbeds in the payload | 1 (the contact form) | 0 |
| Bare tag-named classes (`p`, `div`, `span`) | 0 | 0 |
| Class names with more than one *definition* | 0 | 0 |
| Assets needing binding after paste | 0 | 0 |

Every image is referenced by its existing Livewell CDN URL, so unlike the veneers and
cosmetic pastes there is **no image-binding pass** to run afterwards.

## Paste procedure

```bash
cd deliver/brandklout/livewell-dental/workflows/07-webflow-build
python .tmp/prep_source_quiz.py
python html_to_webflow.py --html ".tmp/page-quiz/source.html" \
  --page-prefix qz --split .tmp/page-quiz
python .tmp/prep_source_ty.py
python html_to_webflow.py --html ".tmp/page-ty/source.html" \
  --page-prefix ty --split .tmp/page-ty

python wf_tools.py qa .tmp/page-quiz --against .tmp/page-cosmetic,.tmp/page-veneers
python wf_tools.py qa .tmp/page-ty  --against .tmp/page-quiz,.tmp/page-cosmetic,.tmp/page-veneers
```

`--page-prefix` is **not optional**. Without it the payload ships classes named literally
`p`, `div`, `span`, and Webflow merges classes by name site-wide, so they collide with
Livewell's existing Relume-derived classes.

Then, per `html-to-webflow-clipboard.md`: open the payload HTML in the logged-in Chrome
profile, click the copy button standalone, `Ctrl+0` on the Designer canvas to reset zoom,
and paste into an empty page body. Re-copy fresh if the first paste misses.

### Page Settings

Install `webflow-runtime-states.css` from each split folder into the page's **head code**.
These are JS-applied states that cannot be Designer classes; the file carries the `.in.in.in`
specificity boost. The Google Fonts `@import` at the top of that file is **discardable** —
Marcellus and Lato are already the site's own brand fonts (`--_typography---font-styles--heading`
and `--body`, confirmed live through the `webflow-brandklout` MCP).

Nothing else goes in Page Settings. There is no `webflow-custom-code.js`.

## Verified before handoff

| Check | Quiz | Thank you |
|:---|:---|:---|
| `wf_tools.py qa` | ALL CHECKS PASSED | ALL CHECKS PASSED |
| Cross-page collisions vs veneers + cosmetic | 0 | 0 |
| Single root | yes | yes |
| Brand tokens resolved to concrete values | yes | yes |
| Behaviour probe, motion enabled, JS errors | 0 | 0 |
| Reveals resolved / stuck | 6 / 0 | 22 / 0 |

Quiz behaviour, verified headlessly with motion on (`../04-design/.tmp/smartarches/behave-quiz.mjs`):
Next with no answer holds at `1 / 11` and shows the error; all eleven steps advance with the
meter tracking 9 → 100%; step 2 takes multiple selections; the contact step validates email,
phone length and consent; the result screen appears with the nav hidden and 15 captured answers;
Back returns to the previous step and is hidden on step 1; keyboard Enter and Space activate the
`role="button"` options; the story rail drifts and a click injects exactly one player into a
stage that shipped with zero `<video>`/`<iframe>` tags; the credential marquee advances.

Thank-you behaviour: the call-steps rail scrubs progressively (14 → 40 → 65 → 91 → 100%) and
lights steps 1, 2, 3 in order; the FAQ keeps exactly one item open and toggles `aria-expanded`;
the credential marquee advances; 22 of 22 reveals resolve.

## Gotchas found on this build

These are new, they were all silent, and several of them exist in the already-pasted Livewell
payloads too.

1. **An `@import` at the top of `<style>` swallows the first rule block.** The converter reads
   everything before the first `{` as one selector group, so
   `@import url("...css2?family=...");` absorbed the entire `.page_quiz{ --navy: ... }` token
   block. Result: `parse_rules` returned **0 custom properties** and every `var()` in the payload
   resolved to an **empty value** — `background:`, `color:`, `padding-block:` with nothing after
   the colon. The payload still converted and still "passed" a casual look. Load fonts with a
   `<link>` in `<head>`, the way the cosmetic package does. Check with:
   `python -c "import html_to_webflow as H; print(len(H.parse_rules(css)[2]))"` — it must not be 0.
2. **Tag-derived resets out-specify every flat class.** `.page_x p{margin:0}` is specificity
   (0,1,1); `.qz-hero__lede{margin-top:26px}` is (0,1,0), so the reset wins and *every*
   paragraph and heading margin computes to 0. Same for `.page_x a{color:inherit}`, which made a
   white-on-white CTA button, and for the `h1,h2,h3` reset, which overrode a heading class that
   deliberately wanted Lato 900. Both pages now carry the margins and colours on the flat classes
   and the resets are gone, which is also what the 07 directive already asks for.
   **The veneers and cosmetic packages still have this reset and are still affected.**
3. **Native `<button>`, `<label>` and `<input>` have no Webflow equivalent.** The first quiz
   conversion embedded 44 buttons and 6 labels as HtmlEmbeds, losing every class style. Options
   and nav are now `role="button"` divs with hand-wired Enter/Space, and the six inputs are
   wrapped in one `<form>` that converts to a single embed, with that subtree's CSS moved into
   the `<style data-embed>` so the embed renders styled.
4. **A shared atom forks unless it appears in a combo stack at least once.** `lw-shell` was
   always alone on its element, so the thin-utility split never fired and the page base
   (`box-sizing`) was baked into the shared name, forking it from the veneers and cosmetic
   payloads. Fixed by merging the inner wrapper onto the shell div. Same failure mode the
   cosmetic notes recorded for `lw-eyebrow`; `qa --against` is what catches it.
5. **`is--` state names are global.** `is--on` already means "selected card" in the cosmetic
   payload; here it meant "visible step". Webflow merges by name and the first paste wins, so one
   of the two pages would have broken. Renamed to `is--visible`.
6. **`scrollLeft += 0.35` never accumulates.** Chrome rounds `scrollLeft` to integers, so a
   sub-pixel per-frame increment reads back as 0 every frame and the drift is completely dead
   while looking correct in code. Keep the offset in a JS variable and assign it whole.
7. **The credential SVGs are white artwork.** They load, lay out at the right size, report
   `naturalWidth > 0` and paint **nothing** on a light background. The thank-you credential strip
   is navy for this reason. **`section_csm-marks` on the already-pasted cosmetic landing page
   puts these same logos on `--bone`, so that marquee is invisible on the live page.** Worth a
   one-line fix on that page.
8. **A short block collapses a scroll-scrub denominator.** Deriving progress from the block's own
   height alone pinned the thank-you call-steps rail at 100% from the first frame. Add the
   viewport travel to the denominator, and assert progressive values across several scroll
   offsets rather than checking one position.

## Open before this goes live

1. **Neither page is wired to a backend.** The quiz's final step shows the confirmation screen
   and nothing else. It has to post to the practice CRM or booking system, or be replaced with a
   native Webflow Form. Same open item as the cosmetic landing page.
2. **Target slugs unconfirmed.** A `thank-you-for` page (`6a663eba98580dbc24a53f87`) already
   exists on the site. Confirm whether the new thank-you page replaces it or takes a new slug,
   and confirm the quiz slug.
3. **Three content questions for Dr. Chris**, all flagged in-page in the design package and
   stripped from the payload by the prep scripts: the payment-plan step carries no price because
   Livewell has published none; the reference's six-location question was replaced with a
   qualifier because Livewell has one location; and the first-responder/teacher/veteran question
   implies a discount programme that may not exist.
4. **Clinical copy needs sign-off**: the four "if treatment is delayed" consequences, the three
   call steps, and the `$1,900 to $2,800` single-implant range carried over from Livewell's own
   implants landing package.

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md). The payload HTML, the prep
scripts and this runbook are lightweight and committable. No secrets, no binary or media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
