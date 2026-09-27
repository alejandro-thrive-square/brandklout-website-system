# 2026-09-10 — Homepage pushed into Instatic and published, with five live gates

**Live:** <https://west-la-implants-production.up.railway.app/>
**Admin:** <https://west-la-implants-production.up.railway.app/admin>
**Worktree:** `bk-west-la-implants` · branch `bk-west-la-implants`

The eight-chapter homepage built earlier today is now the published Instatic site. Nine publishes
were needed to get there and each one was driven by a defect that had answered 200.

## Done

- **Retargeted the whole upload toolkit** from the Stone Med Spa copy to this build, and renamed
  its directive `05-instatic-upload.md` → **`21-instatic-upload.md`**. Every path moved from
  `04-design/.tmp/med-spa/final-site` to `04-design/.tmp/site-src/dist`; `PAGES`, `ROUTES` and the
  gates' page lists reduced to the single `index`. Wrote `site-src/seo.json` (origin, title,
  description read straight out of `index.html`).
- **52 media assets uploaded** — 44 images, **5 mp4 videos** (1.0–4.7 MB) and **3 variable woff2**.
  `video/mp4` and `font/woff2` are accepted mimes and `MAX_MEDIA_BYTES` is 50 MB, so nothing needed
  chunking or a workaround. Alt text written onto 19 photographs (`set-alt.mjs`; alt lives only on
  the media asset — trap 28).
- **Fonts as media, not as Instatic fonts.** `install-fonts.mjs` is NOT run on this client:
  Instatic's installer creates static instances and ignores `font-variation-settings`, and all
  three faces here are variable. The three `@font-face` blocks ride in the token code asset with
  their `url()` rewritten to `/uploads/...`; `verify-live.mjs` now HEADs each one.
- **Published:** `{"publishedPages":1}`, 560 nodes, 272 style rules, 9 conditions, 0 import
  warnings. `<title>` and meta description correct, favicon set to the practice's own icon.
- **Added a fifth gate, `verify-motion-live.mjs`** — the only one that drives the live page. It
  found the worst defect of the day after four other gates had passed clean.
- Directive rewritten: new header, "What is different about West LA Implants", instance table,
  execution steps, output artifacts, "What is NOT done" — **traps 1–34 kept verbatim**, traps
  **35–40** added.

## Gate results (final run)

| Gate | Result |
| :--- | :--- |
| `verify-live.mjs` | **FAIL none** — 1 route, 33 URLs, 36 asset references, 1/1 distinct title |
| `css-parity.mjs` | **FAIL none** — every declared property reached the live CSS (338 local rules vs 357 live) |
| `compare-live.mjs` | **2–4 findings**, all the trap-37 `margin-inline` artifact (geometry pass silent, `x` identical on both sides) |
| `visual-diff.mjs` | 2.3% at 390, 4–6% at 1440 — every band a video frame, the marquee phase, or JPEG→WebP re-encoding (trap 38) |
| `verify-motion-live.mjs` | **FAIL none — the published page moves.** Smoother at 1440; four pins at 1440 and three at 390 (the answer rail is native swipe below 768, by design); reality words 0→9→19; precision iris 6→64→78; transformation story 0→2; Bodoni Moda + Manrope both LOADED; hero film 200 / `readyState 4` / 1920×1080 at 1440 and the 960 encode at 390; `scrollWidth 390 === clientWidth`; console clean at both widths |

36 screenshots in `workflows/08-qa/.tmp/screenshots/live/`.

## Gotchas

1. **`base.video` keeps nine props and throws the rest of the tag away** (trap 35). Both films
   published as bare `<video>` — no src, poster, id, `data-src` or `aria-label` — and nothing
   failed, because `verify-live.mjs` checks the assets the markup references and the markup
   referenced none. Fixed by re-pointing the nodes at `base.container` with `customTag: 'video'` and
   restoring every attribute. **The general rule: after an import that introduces a new KIND of
   element, read `import-out.json` for what its node actually carries.**
2. **The script asset is bundled as CommonJS and served as `type="module"`, so a UMD never reaches
   `window`** (trap 36). `SplitText` and `Observer` were undefined live while gsap, ScrollTrigger,
   ScrollToPlugin and ScrollSmoother were fine — the four that self-register with gsap survived by
   accident. Every split headline published unsplit while the pins scrubbed perfectly. Fixed with a
   per-file wrapper that shadows `exports`/`module`/`define`/`globalThis`/`self`. **The shim must
   NOT be `window` itself** — the UMD writes `window.window`, which throws in a module's strict
   mode and killed the whole bundle on the first attempt.
3. **`!important` and `svh` are dropped by the conversion** (trap 39), so the reduced-motion
   animation kill switch and `.pr-pin{height:100svh}` both vanished. `min-height:100svh` in the same
   stylesheet survived. Always run `css-parity.mjs` after any stylesheet change; it is the cheapest
   gate and it names what to add to `harvestLossy()`.
4. **`css-parity.mjs` was not really checking `@media` conditions** (trap 40) — the platform
   normalises at-rule preludes and the gate keyed on the raw text, so every conditional rule fell
   through to a much weaker selector-wide fallback. Fixed; it now pairs conditions properly.
5. **`MSYS_NO_PATHCONV=1` goes on the `railway ssh` call and nowhere else.** Exported for the whole
   of `ship.sh` it breaks `node "$HERE/check-link.mjs"` with a MODULE_NOT_FOUND on a file that is
   plainly there. Scoped to `rs()` in `ship.sh` now.
6. **The `compare-live.mjs` auto-margin finding is an artifact** (trap 37). Chrome returns the
   computed rather than the used value for `margin-inline: auto`, non-deterministically. Check
   `getBoundingClientRect().x`: if the geometry pass is silent, the box has not moved. Do not
   suppress it.
7. **`visual-diff.mjs`'s percentage is meaningless here** (trap 38) — two autoplaying videos can
   never agree frame for frame. Read the bands, and crop any new one with `.tmp/crop.mjs`.
8. **`puppeteer-core` is not installed in this worktree.** The browser gates resolve it out of
   `bk-stone/node_modules`, through a `node_modules` directory junction at this worktree's root
   (`cmd /c mklink /J`) plus an explicit `createRequire` path in `verify-motion-live.mjs`. If
   `bk-stone` is ever removed, `npm i puppeteer-core` here.
9. `new URL(import.meta.url).pathname` percent-encodes the space in "Brandklout Website System" and
   every `readFileSync` then fails. Use `fileURLToPath`.

## Design changes made (all locally neutral, forced by a trap)

- `02-base.css` `.frame{min-width:0}` — trap 24 hardening for grid tracks floored by Instatic's
  `<img width height srcset>`.
- `30-chapters.css` `.tr-media` → `.tr-media.tr-media` inside `@media (max-width:1023px)` — trap 20:
  source order is not a contract across the import, and the reduced-motion rule won instead,
  publishing the transformation pin 149px too tall on a phone.

Both keep `node build.mjs` and the local page identical.

## Next

1. Send the link for review. **`20-instatic-domain-origins/sites.json` does not yet carry this
   instance** — register it before anyone is given the admin URL.
2. Canonical / Open Graph / JSON-LD are still absent from the published `<head>` (trap 31). Fine for
   review, not for launch; the route is a runtime module in `site-src/js/`.
3. The consultation form posts nowhere.
4. Client questions from the previous run are still open (implant count, amenities, photo consent,
   vector logo, blog scope).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
