## 2026-09-04, evening — PUBLISHED to Instatic (`48a056b7`). Twelve pages, both gates clean

The standing "not published" note is finally cleared. `{"publishedPages":12}`, `12 written, 0
deleted`, seq 26, live at `https://stone-surgical-arts-production.up.railway.app`. Everything from
the last four commits is on it: the face crops, the doctor's stock, the eight feedback items and
the un-parallaxed arrival inset.

### Done

- **Media, 25 uploads.** 18 `ds-*`, `ssa-exterior`, and the six doctor photographs re-sent with
  `--only` — the Magnific upscales keep the originals' filenames, so the default run skips them and
  live had been serving `dr-stone-portrait` at 643x1020 against a 1200x1903 local file. Verified
  live at full resolution afterwards. The two marble textures also differ byte-wise and were left
  alone deliberately (see Gotchas).
- **Two cascade bugs fixed in the SOURCE, not the import** — `22-footer.css` and `58-breathe.css`.
  Full write-up as **trap 26** in `21-instatic-upload.md`. `compare-live.mjs` went 17 → 0.
- **Gates:** `verify-live` FAIL none (12 routes, 95 URLs, 205 asset refs, 8 retired routes 404,
  12/12 distinct titles); `compare-live` **no differences** at 1440 and 390 across all twelve pages.

### Next

1. **Nothing is blocked.** The site is live and matches the build exactly.
2. Ask Brandklout for the licence behind the doctor's stock before the domain goes live.
3. The peel clip (`site-src/video/`) still awaits a design decision — no video component exists.
4. The domain, the booking form and per-page meta descriptions are still open (HANDOFF §4/§5,
   trap 6). Run `deliver/process/20-instatic-domain-origins` before sending anyone the admin link.
5. The branch is still local-only — 38 commits ahead of `origin/main`, never pushed.

### Gotchas

- **A `compare-live` finding can mean the LOCAL build is wrong.** Both findings this round were,
  and "fixing" them the usual way would have shipped the bug to a correct live site. The shape is
  a top-level rule written BELOW an `@media` block overriding the same property at equal
  specificity: media queries add no specificity, so the later rule wins locally, but Instatic
  rebuilds the cascade and the media rule wins there. The tell is a finding where **live looks
  more correct than local**. Six of these stylesheets end in an `@media` block — a new base rule
  goes ABOVE it, never appended at the bottom.
- **Re-uploading an image is not always an improvement.** `tex-carrara.webp` and
  `tex-marble-dark.webp` differ from the library byte-for-byte but are the same 1800x900: the local
  copies are the `w1800` responsive VARIANTS re-downloaded from this instance during the 2026-09-04
  restore, so re-uploading them would replace the originals with a downsample. Compare dimensions,
  not just bytes, before adding a name to `--only`.
- **Finding changed images at all takes a sweep.** `upload-media.mjs` skips by filename, so an
  edited photograph with an unchanged name is invisible to it. HEAD each `media-map.json` URL and
  compare `content-length` against the local file; check dimensions on anything that differs.
- **This worktree's sparse checkout excludes the shared API client.** Every script in
  `21-instatic-upload/` imports `insta-api.mjs` from `dr-nahlah/workflows/15-instatic-api-sync/`,
  and it fails as `ERR_MODULE_NOT_FOUND` on a path `git ls-tree` shows plainly. Already fixed here
  via `git sparse-checkout add`, but sparse config is per-worktree, so the next worktree hits it
  again.
- **`compare-live.mjs` leaves its server on 8821 if it is interrupted**, and the next run dies on
  `EADDRINUSE` before comparing anything. It takes `COMPARE_PORT` now. Killing the listener and
  re-running immediately can still lose the race to a SECOND orphan — that happened here; check for
  more than one process before assuming the port is yours.
- **`ship.sh` needs `RAILWAY_LINK_DIR`** pointing at a directory linked with
  `railway link -w Brandklout -p "Stone Surgical Arts" -s "Stone Surgical Arts" -e production`. A
  scratch directory is fine; nothing in the repo is linked.
- **Read the ship report from a file, not `| tail`.** `grep -o '"warnings": [0-9]*' | sort | uniq -c`
  over all twelve pages is the check (trap 12).
