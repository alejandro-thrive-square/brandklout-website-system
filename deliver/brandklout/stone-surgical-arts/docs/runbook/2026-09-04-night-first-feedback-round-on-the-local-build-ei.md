## 2026-09-04, night — First feedback round on the local build, eight items. Local, not published

Alejandro's design feedback on `index.html` (2425 wide) and `treatments.html` (1918). All eight
addressed; see the top block of `04-design/.tmp/surgical-arts/HANDOFF.md` for the list. Commit in
`git log`. Still **not pushed to Instatic** and the branch is still unpushed.

### Gotchas

- **The arrival inset (Dr. Stone at the desk) is deliberately NOT parallaxed.** Feedback item on
  2026-09-04: the photograph itself framed fine, but `data-parallax="6"` sized the image to 112%
  and drifted it, so the top of the head was cropped for the whole scroll. The attribute is off in
  `site-src/pages/home.body.html`; do not put it back. Parallax pulls the image taller than the
  frame by 2x its amount, so any frame whose subject touches an edge either needs
  `data-parallax-anchor="top"` or no parallax at all.
- **Magnific upscales from the restored assets are fine.** `upscale-doctor.mjs` now falls back to
  `assets/<file>.webp` when the Drive export file is missing (it copies it to
  `_upscaled/<stem>.source.webp` first). Six doctor photographs done this way; faces checked
  side by side. Cost: six jobs. `fix-steps.py` had the icon 28px off because the restored steps
  source is 646px wide, not 702; it is measured now.
- **The parallax was invisible to the crop probe.** `crop-probe.mjs` runs with reduced motion, so
  it never saw the 10% drift that `data-parallax` adds with motion on. A frame whose face is at
  the top of the source needs `data-parallax-anchor="top"` (the mechanism already existed for the
  consult room). `section-shot.mjs --motion --scroll=<px> --vh=<px>` renders as a reviewer sees
  it. **With motion on, document positions drift on the home page** (pinned chapters), so a
  section shot can land on the wrong band; if it does, shoot without `--motion`.
- **`--wide` is the one knob for text widths on big screens.** Seventy `max-width` caps in rem/ch
  multiply it. rem values above 52 were left alone as structural. If a column looks wrong at 2K,
  tune 1.15/1.3 in `59-wide.css` rather than any one rule.
- **The gutter is inside `.path_head`'s cap.** `--gutter` becomes `(100vw - 97.5rem)/2` above
  1560px. Any element that carries both `padding-inline: var(--gutter)` and a `max-width` will
  squeeze its content as the screen widens; `.path_head` was the one, fixed with
  `calc(cap + 2 * var(--gutter))`. Grep for the pattern before adding another.
- **The sister site's `office-exterior.webp` is the reception desk**, whatever its CDN filename
  says. The only exterior photograph of the building is Southlake Style's; it is on the site now
  on instruction and the permission ask is still owed.
- **`build-site.mjs` copies assets and never deletes.** A file removed from `site-src/assets/`
  lingers in `final-site/assets/` and the audit warns about it; delete it in both places.
