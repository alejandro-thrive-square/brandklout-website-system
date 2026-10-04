# 2026-10-04 — Google reviews widget brought to the in-section standard

## Done
- Elfsight widget **`d359c3c4-40bc-4c66-87ae-714ed666eb01`** (pediatric #104B, 4.9 / 97) restyled in
  the Elfsight editor by Codex; no site change (same embed on `/` and `/patient-reviews`).
- Standard: `deliver/process/tools/elfsight-reviews/README.md` on main, "In-section widget standard".
  Widget title "What Our Customers Say" **off** (the sections carry "What parents have to say." and
  "A few reviews, all unedited."), header layout 1 (Google logo, 4.9, (97), *Review us on Google*),
  button `#93644A` pill 999px weight 800, cards cream `#F6F3EE` 14px radius on the white sections,
  outline body at 12%, Read more / badge / arrows in the button brown, review photos off,
  Custom CSS with `!important`.
- Gate `check-widget.mjs d359c3c4… --style … --render <page>`: **ok** on www `/` and `/patient-reviews`
  (before: 17 problems).

## Next
- Nothing open. The widget is the reference for the standard.

## Gotchas
- Edits in the Elfsight editor are live on every page that embeds the widget the moment they are
  published: there is no staging for a widget.
- The editor's font "Default (Apply from Website)" is stored as `font: {}`; the padding controls are
  hidden while the widget background is transparent.
