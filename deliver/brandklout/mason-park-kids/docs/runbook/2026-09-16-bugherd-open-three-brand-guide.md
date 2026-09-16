# 2026-09-16 - BugHerd round one, the last three: brand guide, hospital claim, edited photo

BugHerd project **540564 "Mason Park Kids"** had three notes left open on 09-15 (#4, #11, #28).
Google Drive access landed today (`scripts/drive.mjs`, see `deliver/brandklout/docs/GOOGLE_DRIVE.md`
on main), so all three were resolved, published to staging and moved to done. Nothing was
written to Asana, and `masonparkpediatricdental.com` (the WordPress mirror) was not touched.

The re-fetch also showed **no new comments on the kids project**. The new activity was on the
**adult Mason Park project (539151)**: 28 unanswered notes, #50-#77, left 09-15 20:26-21:22 UTC.
They belong to `bk-mason-park` and were not handled here.

### Done

| # | Note | What was done |
| :-- | :-- | :-- |
| 4 | Approved colours and fonts? Brand guide in the Drive | `Mason Park_Brand Guide.pdf` (shared drive "Mason Park", `0AEGRwjQtecY9Uk9PVA`) covers BOTH practices, including the "Dental for kids" logo. `site.css` now uses its exact palette and the nearest open fonts (Marcellus for Collier, Figtree for Avenir Next). Details in the 03 README, section on the look. |
| 11 | Not a hospital setting | Removed from all 9 pages that said it, and from the recipes that generate them (`.tmp/fix-hospital.cjs`). "Four levels, from a mask to a hospital." became "...to deep sleep."; the GA card now opens "Your child is fully asleep." No new location was invented. |
| 28 | "I've updated this image" (black slacks) | Their file exists nowhere: Drive was searched by name and by every file modified since 09-08, and nothing turned up. We made the edit ourselves: Freepik `gemini-2-5-flash-image-preview` recoloured the trousers, then `edit/composite.py` pasted back ONLY the trousers onto the 2400px original, using a closed mask. `gumball-2` (169 blog pages) had the same floral print and got the same edit. Originals are kept in `03-core-pages/.tmp/_album/originals/`. |

- Published with `03-core-pages/.tmp/publish-0916.sh` (the full README sequence, minus
  `import-fonts`/`import-scripts`). Backup first. 215 pages published, draft matches published.
  A second `import-styles.mjs --publish` shipped the crop fix below.
- `populate-seo.mjs` and `configure-seo.mjs` still called `webzite.open-graph`, which 404s since the 09-10
  plugin rename. Now `brandklout.*`. 215 overrides rewritten, then `publish.mjs`. The Sedation
  page's live meta description no longer says "hospital".
- **Verified on staging:** `userStyles` carries `Marcellus MP`, `#b78668` and the Figtree files. Home, Sedation,
  Our Services and About show 0 "hospital setting"/"HCA West". The hero uses the new
  `pYa_…-gumball-1440.webp`. `section-shots.mjs live` at 1440 and 390 shows no page errors, the
  quote writes 68/68 words, and the rail drifts and holds on hover.
- **Gates:** `check.mjs` 215 pages, 0 errors (the 6 prose-length warnings were already there).
  `crop-all.mjs` found one new crop and it is fixed: `/services/early-intervention` h2 "Why the recommendation is seven."
  overran the `.lf-split` column (Marcellus is wider). `.lf-split .lf-head h2` is now `f-d2 * .78`, with
  `hyphens: auto`. It is clean at 920/1024/1280/1440, locally and live. The `our-services @390` rail crop and
  a one-off blog crop were already there: the first appears with the old CSS too, and the second did not
  reproduce.
- Commits: `d586d471` (the fix), `38c6a9b3` (this runbook).
- Replies sent with `bugherd/reply.mjs --send` (plan `replies.json`; 09-15's plan kept as
  `replies-0915.json`). #4, #11 and #28 are all **done**. The project has 0 open tasks.

### Next

- If the practice sends an **Adobe Fonts web project id**, swap `--font-display`/`--font-body` to
  Collier / Avenir Next (and FreightNeo Pro for the labels). The reply to #4 asks for it.
- #28: if the reviewer attaches their own edit, run it through `prep-images` as `gumball` in place of ours.
- #11: if they want a sentence on where general anesthesia is done, it goes on `/services/sedation-dentistry/`.
- `diff-all.mjs` and `audit-live.mjs` were not re-run over all 215 pages this round. The change was CSS
  tokens, text and two images, with no structure changes. Run them before production.
- Adult site: 28 unanswered notes in project 539151 are for `bk-mason-park`.

### Gotchas

- **The brand guide PDF misprints the light grey as `EAE936`.** Its RGB (234/233/230) is `#EAE9E6`.
- **The guide's copper `#B78668` fails AA with both ink and white text.** Use it for dots, bars and
  rules only. For fills behind text use `--sun-fill`, and on dark grounds `--sun-glow`.
- **Marcellus has one weight and no italic.** Without `font-synthesis: none`, every `font-weight: 500`
  heading and every `<em>` renders a browser-faked bold or oblique.
- **`drive.mjs search` matches file NAMES only.** To find "the file they updated", list by
  `modifiedTime` across all drives. The scratch copy with a `recent` command was in the session
  scratchpad; add it to `drive.mjs` if it is needed again.
- **The Gemini edit comes back at 1184x864**, a slightly different aspect from the 2400x1802 original.
  Resizing it back lines up well enough (mean diff ~9 on untouched areas). A mask built from
  "pixels that changed" is full of holes and leaves a ghost of the old print. Close it (max then min filter)
  so it is one solid region.
- **`crop-all.mjs` is timing-sensitive under load.** A blog page reported three line-mask crops that
  did not reproduce on a solo run. Re-probe with `crop-probe.mjs <page> --width <w>` before fixing.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
