# 2026-09-21 — Home page story film was clipped after the Vimeo swap; fixed

Follow-up to the same day's YouTube -> Vimeo swap. Client reported the homepage "not working
properly". It was a real regression from that swap, live for roughly an hour.

## What was wrong

`.ch-proof .pf-embed` — the slot holding the home page's filmed testimonial — carried
`padding-top:56.25%` to reserve a 16:9 box for a **bare** `<iframe>`. The comment in
`site.css` said exactly why: it "holds the shot's height before the frame loads, which is
what stops the pinned chapter jumping".

The Vimeo embed block brings its **own** `padding:56.25% 0 0 0` wrapper. So after the swap the
box was reserved twice:

- `.pf-embed` measured **721px** (361px of empty padding + the 360px film)
- inside `.pf-shot`, which is `aspect-ratio: 4/3` = **480px** with `overflow:hidden`
- so the film, pushed 361px down, was **clipped to its top ~120px** under a black band
  (`background:#0B0B0C`)

The iframe itself measured a correct 641x360 at ratio 1.78 the whole time, which is why the
node-count and ratio checks after the swap all passed. **The embed was right; its container
was twice too tall.** Nothing I measured on the swap run would have caught it — I checked the
embed box against its `.wz-embed` host, never the host against the clipping ancestor.

## Done

Commit: `<SHA>`

- Dropped `padding-top:56.25%` from `.ch-proof .pf-embed`, letting the snippet's own wrapper
  be the aspect box. `.ch-proof .pf-embed iframe` stays `position:absolute; inset:0` and now
  resolves against that wrapper (which is `position:relative`), so the geometry comes out
  **identical to the pre-swap YouTube layout**: 641x360 in the 480px slot, 0px clipped.
- The anti-jump guarantee survives — the snippet's wrapper reserves the height before the
  player loads exactly as the padding box did.
- Changed in **both** places that declare it, so no stale value can resurface:
  `src/styles/site.css` (code asset, served after the registry, so it wins) **and** the
  `.ch-proof .pf-embed` registry styleRule. `runtime-states.css` also declares the selector
  but sets no `padding-top`; left alone.
- Rewrote the now-wrong comment above the rule with a "do NOT re-add padding-top here" note
  and the reason.
- Staging first, verified, then production. Both republished.
- `fix-proof-embed-box.mjs` + `fix-proof-embed-note.mjs` (separate only because the comment is
  hard-wrapped and its anchor has to match the line breaks).

**Audited for the same bug elsewhere**: only two rules on the whole site reserve a percentage
aspect box. The other is `.vl-frame`, which holds the **bare** iframe that `site.js` builds on
a facade click — no snippet, no wrapper, so it cannot double up. Confirmed by the click test
measuring 450x254. `.pf-embed` was the only instance; exactly one node on the site uses it.

## Gotchas

- **A percentage `padding-top` aspect box and the Vimeo snippet are mutually exclusive.** Any
  slot that reserved its own ratio for a bare iframe will double when the iframe becomes a
  `brandklout.embed-origins.embed`. Before swapping a film, grep the CSS for
  `padding-top:<n>%` on the slot's selector chain.
- **Measuring the embed against its own `.wz-embed` host proves nothing.** Both were 360px
  and agreed perfectly while the film was being cut in half. The check that matters is the
  slot against its nearest `overflow:hidden` / `aspect-ratio` ancestor — here `.pf-shot`.
- **The ratio check passed too.** 1.78 was correct for the iframe throughout. A correct
  element inside a wrong box reads as healthy on every element-level assertion.
- **Mobile needed no separate fix, and that is provable rather than spot-checked**:
  `.pf-embed` has no `contextStyles` and appears in no media query, so its height is always
  56.25% of width while `.pf-shot` is always 75% (4/3). 56.25% < 75% at every width.
- **Screenshotting this section needs the reveal to have run.** `.pf-shot` sits at
  `clip-path: inset(0 0 100%)` until its ScrollTrigger fires; a jumped `scrollTop` leaves it
  closed and the screenshot shows an empty band that looks like a different bug. Walk the
  scroll down in steps and let it settle.
- **Driving this page's scroll from `javascript_tool` can wedge the renderer** — two
  `Runtime.evaluate` calls timed out at 45s mid-animation and left the page stuck. Real wheel
  input (`computer` scroll) was reliable where scripted scrolling was not.

## Next

Unchanged from the swap run: Vimeo folder privacy still `view=anybody` / `embed=public`;
no `VideoObject` JSON-LD; `04-design/.tmp/site-src/` still emits YouTube; #41/#42 still need a
veneers film.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
