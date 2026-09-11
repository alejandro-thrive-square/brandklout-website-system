## 2026-09-11 (evening): "Why us" cards stacked, video plays in place; brandklout.com flow reviewed

Asked (design feedback on `/`, `div.operator-grid`): "this card should be stacked one on top of the
other and the video should be playable from here. Also analyze the current Brandklout site
https://brandklout.com/ to see if we have the right flow for the user to take action."

### Done: the card change

- **New mechanism, `21-instatic-upload/patches/`** (`patches.mjs`): `{why, find, replace}` edits
  applied by `prepare-source.mjs` on top of a package page. Each `find` must match exactly once or
  the build refuses, so Sang's next package either takes the patch cleanly or fails loudly. His
  file stays as received. `visual-diff --source` applies the same patches.
- `patches/index.html.mjs` (11 edits, copy untouched):
  - `.operator-grid` is one column, so the two cards stack.
  - The operator card is the player (wider, left) beside the quote.
  - The thumbnail that linked out to YouTube is an embedded player (`youtube-nocookie`), imported
    as `base.video`, which lifts the home page's `frame-src 'none'` for YouTube. The label becomes
    a caption under the player.
  - The dark `::after` overlay is removed: it covered the whole media column and would have
    swallowed clicks on the player.
  - The territory card is text | map on desktop, single column (source order) at ≤980px.
- The Sang thumbnail (`yt-qxXc1GruLLY-maxresdefault.jpg`) is no longer used by any page; it stays
  in the media library, harmless.
- Published `{"publishedPages":7}`, seq 8. The home CSP is now `frame-src youtube-nocookie + youtube`
  (lifted by `base.video`), still `connect-src 'self' https://sheetdb.io`.
- **Gates:** `verify-live` FAIL none (7/7) · `css-parity` FAIL none · `visual-diff --source` home
  0.000% at 1440 and 390 (patches applied on both sides) · `visual-diff` home **0.015%** at 1440
  (the flattened submit arrow, trap 38, and YouTube's own player controls) · **0.030%** at 390,
  unchanged from before (the same arrow, the player's controls, and a band at y≈4390 that was in
  the earlier 390 runs too) ·
  `compare-live` home 11 findings, the same benign set as before (trap 38's arrow, trap 30's
  auto-margin reading, the `.js` bootstrap), none from this change.
- **Live click check** (`elementFromPoint` at the player's centre, 1440 and 390): the hit is the
  YouTube `<iframe>`, so nothing overlays it. The cards are stacked: operator card at y 5221,
  territory card at y 5727, both 1180px wide; on a phone both are 364px wide, one above the other.

### Review: how brandklout.com gets a visitor to act (read 2026-09-11, headless Chrome + its bundle)

brandklout.com is a React single-page app on Netlify: one 10,800px page, no forms of its own.

| where | CTA | goes to | works? |
| :--- | :--- | :--- | :--- |
| sticky header, every screen | Book a Demo | `calendly.com/mrhuynher/30min?month=2025-10` | yes (opens on a past month) |
| sticky header | Login | `app.brandklout.com` | yes |
| hero | Prequalify Your Practice | `bk21question.netlify.app` (the 21-point assessment) | yes, off-site |
| guarantee block | Get Started Today | **`calendly.com/your-calendly-link`** | **no, a placeholder** |
| "Ready to Become the #1…" | Prequalify Your Practice | the assessment | yes, off-site |
| closing band | Book a Demo | Calendly | yes |
| footer | Terms / Privacy / HIPAA | `#` | no |

Two intents, both captured: **qualify** (the assessment → SheetDB → Calendly on the thank-you) and
**book** (Calendly). Plus a way in for existing clients (Login).

### The new site's flow, against that

| intent | brandklout.com | review link |
| :--- | :--- | :--- |
| Qualify | hero + mid-page, off-site | every primary CTA ("Check My Market", "See If My Market Is Available", the sticky mobile bar, each story's CTA) goes to the **home `#apply` form, which captures nothing** and shows "Prototype form submitted…". The assessment that does capture (`/survey`) is linked **only from the footer** ("Growth Survey") |
| Book | sticky header + closing band | **nowhere on the home page.** Calendly appears only on the survey's thank-you panel |
| Existing clients | Login in the header | **no Login link** |

**So no: as published, the new site's main path is a dead end.** Every "Check My Market" leads to a
form that loses the lead. The two things that work on the current site (the assessment and the
Calendly booking) are either buried in the footer or absent. The copy is Sang's; the destinations
are the decision. Options, for Sang/Alejandro to pick:

1. **Point "Check My Market" / "See If My Market Is Available" at `/survey`**, the same move the
   current site makes with "Prequalify". Zero new plumbing: it already posts to SheetDB and ends
   on Calendly.
2. Or **wire the home `#apply` form** (name, email, practice, city, service, budget, bottleneck)
   to a destination. The SheetDB sheet has the assessment's columns, not these, so it needs its
   own sheet/tab or a CRM webhook.
3. Either way, **add "Book a Demo" (Calendly) and "Login"** to the header, as the current site has.
4. Carried over from the current site: the Calendly link's `month=2025-10` (past month) and the
   Terms/Privacy/HIPAA `#` links. The current site's placeholder Calendly link should not be
   copied anywhere.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
