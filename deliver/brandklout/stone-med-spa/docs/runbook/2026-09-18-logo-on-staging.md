# 2026-09-18 — The practice's logo, background removed, on staging

The site had no logo file. It carried a **text wordmark** — WESTLAKE in wide-tracked Cormorant over
a hairline, MEDICAL AESTHETICS beneath — because none existed when it was built, and
`css/23-brand.css` said in its own comment: *"If a logo file does arrive, swap `.brand_component`
for an `<img>` in the three partials — navbar, drawer and footer — and delete this file."*

One arrived. This run does that swap.

## Where the logo came from

Asana task [`1218408530306234` "Update logo"](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1218408530306234),
opened by Gabby Reyes 2026-09-11 and **assigned to us**. Description: "Update logo on website,
please". One attachment, gid `1218401388192948`, `Westlake logo.png`, **1254 × 1254**.

Re-fetch it with:

```bash
node deliver/brandklout/scripts/asana-context.mjs --task 1218408530306234 --out <dir>
```

> [!WARNING]
> **`asana-context.mjs stone-med-spa` does not find it.** That slug pulls the root build task
> `1217160668112180`, whose whole tree reports "attachments: none anywhere". The logo hangs off a
> *sibling* task in the same project that is not in `CLIENT_TASKS`. It was found with
> `search_tasks` for "logo" across the workspace.

There is a **second** logo task — [`1218567330165026` "Get Westlake Logos for website and Marketing
Materials"](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1218567330165026),
Jessica's, due 2026-09-22, "Details sent to Diana". Its attachment is the same lockup at 500 × 334,
already reduced (no leaf, no strapline) and visibly softer. **Ours is the better file** — 1254px and
complete — so that is the one this build uses. Jessica's task is still open and may yet produce a
vector; see *Open* below.

## Taking the background off

The supplied file is the artwork composited onto **pure black** — 90.9% of its pixels are `#000` —
with an additive glow around the monogram. Keying the black out chews that glow into a grey halo
and leaves a fringe on every letter. The exact inverse of "drawn over black" is an unpremultiply:

```
alpha  = max(R,G,B) / 255       how much ink is at this pixel
colour = pixel / alpha          what that ink actually is
```

which returns white as white, lime as lime, and the glow as a soft alpha ramp.
**Recompositing the result over black reproduces the original to within 1/255** — the script
asserts this.

`site-src/make-logo.py` (Pillow + numpy) does it and cuts four files. Its header carries the full
reasoning; the short version is two shapes and two grounds.

**Two SHAPES.** The supplied lockup is a square stack — monogram, WESTLAKE, MEDICAL AESTHETICS,
then a leaf and SKIN · WELLNESS · IV BAR. In the 5.5rem navbar that stack can only be ~60px tall,
which puts WESTLAKE at an **8px cap height**: unreadable. So the navbar and drawer get a **row**
lockup, the monogram set beside the name block, both lifted from the supplied art and not redrawn.
The tier boundaries are read off the alpha channel, not hardcoded. The footer has room and gets the
full **stack**, strapline and all.

**Two GROUNDS.** The artwork is white type on black, and the navbar is transparent over the hero
photograph but solid ivory everywhere else, with the drawer ivory too — so a white wordmark
disappears on two of the three. The light-ground variant remaps the two inks off the blue channel,
which separates them cleanly (white B=250, lime B=17) and so carries every anti-aliased blend and
the whole glow with it:

| | dark grounds | light grounds |
| :--- | :--- | :--- |
| type | `#fafafa` white | `--charcoal` `#272727` |
| mark | `#aaf011` lime | `--green-ink` `#55731F` |

Charcoal because that is what the text wordmark it replaces was. Green-ink because
`01-tokens.css` already rules that brand green at text size goes dark enough to clear AA —
**lime on ivory is 1.2:1**.

### The four files

| File | Where | Size |
| :--- | :--- | :--- |
| `logo-row-on-dark.webp` | navbar, over the hero photo | 690 × 138, 29KB |
| `logo-row-on-light.webp` | navbar once solid; drawer head | 690 × 138, 22KB |
| `logo-stack-on-dark.webp` | footer | 432 × 390, 56KB |
| `logo-stack-on-light.webp` | **not on the site** — `assets/_logo-variants/` | 432 × 390, 47KB |

Lossless WebP: the alpha channel is lossless in WebP either way, so lossy saved only 10% and
would fringe the hard edges. Each is exported at 3x its display height.

The fourth is built because the practice will want it for anything that is *not* this site, and
kept out of `assets/` — which ships whole — because `build-site.mjs` skips a leading underscore and
`audit.mjs` would otherwise warn every run that an uploaded asset is referenced by nothing. It got
uploaded to staging once by mistake (a stale copy left in `final-site/assets/`, which the build
copies into but never prunes) and was deleted from the media library.

## The size is a measured number, not a tasteful one

`.brand_logo.is-row` is **11.5rem × 2.3rem** (184 × 37px). The first pass was 17.5rem because it
looked better, and it **pushed "Book a consultation" 114px off the right edge at 1280**.

The bar was laid out around the text wordmark's ~190px and has two pinch points:

| Width | Why it is tight | Slack for the logo |
| :--- | :--- | :--- |
| **1280** | menu gaps widen 1.4→2.4rem *and* the phone is still shown | **166px** |
| **992–1007** | the menu is back but the viewport is not | **136px** |

`site-src/_measure.mjs` prints that slack at every width in a range and names anything clipped.
**Run it before growing the logo.** 184px clears every width from 320 to 1456 with nothing clipped.

### It also fixed a bug older than the logo

At **992–1007** the *old* wordmark clipped that same button by 7–15px on all thirteen pages, and
had done since the 2026-09-01 "992-to-1150 squeeze" fix in `20-navbar.css` landed its last step at
**991 rather than 1023**. Proven by rebuilding the pre-logo partials from `HEAD` and running the
gate: identical 13 failures. The window is **sixteen pixels wide**, and `all-pages.mjs` sampled
390/1024/1440, so nothing ever saw it.

`all-pages.mjs` now runs **five widths — 390, 992, 1024, 1280, 1440**. The two new ones are both
the *tight side of a breakpoint*, which is exactly what a gate that samples round numbers steps
over.

## The navbar's two logos are stacked, not toggled

`display: none` was the obvious way to show one of the pair and it was **wrong on the published
site**. Instatic's image module rewrites every `<img>` with `loading="lazy"` and
`sizes="auto, 100vw"`, whatever the source markup said — a `fetchpriority="high"` does not survive.
So:

- the hidden logo **was never fetched**, and began downloading at the instant the bar flipped —
  which is the flash that shipping two files was meant to prevent;
- `auto` resolves against the **rendered** width, which is 0 for a hidden element, so it fell back
  to `100vw` and took the 690px variant for a 184px box.

Stacked and cross-faded on opacity, both images have a real 184px box: both load at once, both
resolve `auto` to 184px and take the **640px** variant, and the swap has nothing left to fetch.
New gate `.tmp/logo-swap-check.mjs` asserts it against the live site.

> [!WARNING]
> **Do not test this with `naturalWidth`.** With `w` descriptors and a `sizes` value Chrome
> density-corrects it, so a 640px variant in a 184px box reports `184` and every image looks like
> it is exactly 1x. The first version of that gate failed the site for this reason and the site was
> fine. Read the `-w<NNN>` out of `currentSrc` instead.

## Done

Commit `5ff18cd6`. Live on **staging only** — `https://staging.westlaketxmedspa.com`, **seq 10, 13 pages, 76 media**.
Production is untouched and still shows the text wordmark.

- `site-src/make-logo.py` — new. Cuts the four files from the Asana PNG
- `css/23-brand.css` — rewritten from a text wordmark to the logo's stylesheet
- `css/20-navbar.css` — the two now-dead `.brand_component` invert rules removed
- `partials/navbar.html` — the stacked pair; `partials/drawer.html`, `partials/footer.html` — one image each
- `all-pages.mjs` — 992 and 1280 added
- `site-src/_measure.mjs`, `.tmp/logo-swap-check.mjs` — new tools
- `.tmp/probe-sel.mjs`, `.tmp/probe-key.mjs` — **were pinned to production**; they now follow
  `INSTATIC_BASE_URL`, so a probe run during a staging push no longer measures the wrong site
- `05-instatic-upload.md` — traps 39 and 40, the media-map note, the new artifacts

### Gates

| Gate | Result |
| :--- | :--- |
| `audit.mjs` | FAIL none |
| `all-pages.mjs` | 13 pages × **5 widths**, 260 assertions, all clean |
| `menu-test.mjs` | 9 passed, 0 failed |
| `.tmp/logo-swap-check.mjs` | FAIL none — both states load a 640px variant |
| `verify-live.mjs` | FAIL none, 13 routes, 13/13 distinct titles |
| `css-parity.mjs` | FAIL none |
| `compare-live.mjs` | 7 findings, **all known** — 4 trap-30 margins, 2 the GHL embed on /book, 1 the class-index shift that embed causes |
| `visual-diff.mjs` 1440 / 390 | every page at its baseline except the three below |

Backups: `.tmp/backup-staging-2026-09-18-logo/` (seq 8, before) and `-logo-after/` (seq 10).

## Gotchas

1. **`asana-context.mjs stone-med-spa` reports "attachments: none anywhere" and that is true and
   useless.** The logo is on a sibling task outside `CLIENT_TASKS`. Search the workspace with
   `search_tasks` before believing a client sent nothing. Consider adding `1218408530306234` to
   `CLIENT_TASKS`.
2. **`search_objects` needs a `resource_type`**; without one it 400s with the valid list in the
   error. `get_attachments` takes **`parent`**, not `object_id`, and returns `download_url` only
   with `include_download_urls: true`.
3. **A NEW media asset does not get the same URL on both instances.** `clone-site` preserved the
   URLs of the 73 that existed when staging was seeded, which is why one payload served both until
   now; a fresh upload mints `/uploads/<nanoid>-<name>` independently on each side.
   `build-import-input.mjs` reads **only** `.tmp/media-map.json`, so **check its `base` before
   building a payload.** The two stable copies are `.tmp/media-map.production.json` (73) and
   `.tmp/media-map.staging.json` (76).
4. **Instatic makes every image lazy and `sizes="auto"` measures the rendered box** — trap 39. A
   `display:none` image is never fetched and picks the 100vw variant. Stack and fade instead.
5. **`naturalWidth` is density-corrected** when `sizes` is set. It is not a sharpness test.
6. **`max-width: 68ch` is 686.375px local and exactly 680px live** — trap 40. On `/privacy-policy`
   that rewraps enough paragraphs to finish **26px taller**, which reads as visual-diff **6.97%**
   against a 3.6% baseline. It is cosmetic and predates this run: `/terms-of-service` has the
   identical column on the same template and stays at baseline, because its text does not sit near
   a wrap boundary. Probe the column before chasing the number.
7. **`visual-diff.mjs` in a batch is not reproducible page-by-page.** `team` read 2.443% at 1440
   and 5.473% at 390 in the batch; re-run alone they are 0.743% and 2.739%, both baseline. `about`
   at 390 flips between 7.9% and 23.2% across runs *with no change at all*. **Re-run a single page
   before believing a spike.**
8. **`node -e` with a pipe dies** with a libuv assertion on Node 24 here. Write a `.mjs` in `.tmp/`
   and redirect to a file. A `.tmp/*.mjs` needs **five** `../` to reach `deliver/process/`, not
   four.
9. `build-site.mjs` copies into `final-site/assets/` and **never prunes it**. A file deleted from
   `site-src/assets/` stays in the build output and gets uploaded. Delete it from both.

## Next

1. **The client reviews the logo on staging**, at `https://staging.westlaketxmedspa.com`.
2. **Then production**, which is *not* a re-push of the staging payload:
   ```bash
   unset INSTATIC_BASE_URL                 # back to production from .env
   node upload-media.mjs                   # the 3 logo files -> PRODUCTION's library, new URLs
   node set-alt.mjs --apply
   node build-import-input.mjs             # now reads production's map
   RAILWAY_LINK_DIR=<production link> bash ship.sh
   node push-site.mjs --apply --force
   ```
   then publish and run the gates. Snapshot production first — it is seq 13.
3. **Ask the practice for the vector original** and for their own horizontal lockup. This is a
   raster of a mark with a glow, and the row geometry is ours, not theirs. Jessica's task
   `1218567330165026` ("Details sent to Diana", due 2026-09-22) is where that would come from.
   If either arrives it replaces `make-logo.py`'s output.
4. **Flag the green.** The logo's lime is `#aaf011`; the site's brand green is `#8fbc46`, from the
   Sculpted Ivory board, which predates the rename to Westlake Medical Aesthetics. They are
   genuinely different greens and the site was not re-paletted in this run. Worth asking whether
   the palette should follow the logo.
5. Everything still open from the 2026-09-17 runs — the legal pages' review, the legal entity name
   and contact email, the Cherry link, the "Dr. Stone injects" contradiction, the two GHL fixes
   (the consent text names **Stone Surgical PLLC**, and the form's Privacy/Terms links point at
   `example.com`), and submitting the sitemap in Search Console.
