# 2026-09-24 — BugHerd #15 (the client's treatment-room photo) on staging; #9/#10 still blocked

BugHerd project `540569` re-read by id: still the same **41 tasks, all `todo`, zero comments** —
nothing new since the 2026-09-23 pass ([run](./2026-09-23-bugherd-pass-on-staging.md)). Drive
sign-in renewed (`node scripts/drive.mjs auth`), so the three photo tasks were retried.

## Done

**Staging `https://staging.westlaketxmedspa.com` — 24 pages published** (commit `10d59fc0`) (was seq 16; snapshot
`05-instatic-upload/.tmp/backup-staging-2026-09-24-bugherd-15`). Production untouched.

| BugHerd | Change |
| :-- | :-- |
| #15 | /team "Inside the office" strip, "Treatment room" frame → Drive `Stone-Treatment-Room.webp` (id `1shPBExqRWu3bqrcPIIuRY6IxL0aQ76eK`, stone drive root). Only 696×371, so `site-src/upscale-treatment-room.mjs` enlarges it 2× with Freepik's **precision** upscaler → `assets/stone-treatment-room.webp` 1308×736. The /team cover, home and /about keep the equipment shot (`ssa-treatment-room.webp`); the task named only the strip frame. |

**Still blocked — #9, #10 (Abby's portrait, Brooke's IMG_5299).** Neither is on Google Drive:
searched `Abby`, `Gentry`, `IMG_5299`, `IMG_52`, `headshot`, `staff`, `team`; the stone drive's
`our-team.jpg` is the Surgical Arts team (no Abby), `2026 Team Photo` and `Team/` belong to another
practice. The reviewer's screenshot shows them in **Canva**, which we cannot reach. Ask the client
(or a teammate with Canva) to export both to the Stone shared drive. Brooke's `brooke.jpg` on Drive
is the source of the portrait already live.

## Gates

- Local: `audit` FAIL none; `all-pages` 24 × 5 widths, 480 assertions clean; `drag-test` 3/3.
- Staging: `verify-live` FAIL none (24/24 titles); `css-parity` FAIL none; `compare-live` 11
  findings, all the known ones (/treatments trap-30, /book embed, the 390 cover-fact wrap on
  /hydrafacial and /hair-restoration); /team clean. Screenshot of the strip at 1440 checked by eye
  (`05-instatic-upload/.tmp/strip-shot.mjs`): serves the `-w1024` variant into a 749px frame.
- `media-map.json` put back to production's after the push.

## Production, when approved

Same procedure as the 2026-09-23 run's "Production, when approved" — it now also carries #15.
`upload-media.mjs` against production will mint the new asset there.

## Gotchas

1. **Magnific's creative upscaler hallucinates scenery too, not only faces.** At 4×, creativity 0,
   resemblance 3, `magnific_sharpy` it repainted the surgical light as a patterned dome and turned
   the face in the client's wall art into an abstract splash. `image-upscaler-precision` (no
   prompt, 2×) stayed faithful. Use precision for a client's own photograph of a real room.
2. The precision task can report `COMPLETED` with an empty `generated` array for one poll; wait
   for a URL (the script does).
3. Staging has **no Termly** (never had); production does. `grep -c termly` = 0 on staging is not
   a regression.

## Next

1. Go-ahead for production (38 + #15), then the sitemap redeploy.
2. Abby's and Brooke's Canva photos → Drive → #9, #10.
3. **BugHerd: 39 tasks marked `done`** (2026-09-24, on request, via `PUT /tasks/<id>.json {task:{status:"done"}}`, read back). Only #9 and #10 stay `todo`. The fixes are on STAGING; production still needs the go.
