## 2026-09-04 — Mason Park's build images were missing; restored from their two sources

`09-static-rebuild/home/` rendered with every image broken: 215 referenced, 0 on disk.

**Not caused by the sparse narrowing.** `home/assets/uploads/` has never been tracked in any commit
on any branch (`git log --all` on that path is empty; `*.jpg` is ignored at `.gitignore:38`), and
sparse-checkout only removes TRACKED files. Proof in the same worktree: the 3,575 untracked, ignored
images under `01-content-intake/.tmp/site-scrape/assets/` all survived the same `--force` run. A
machine-wide `find` for `mp-*` returned zero hits, so no other copy existed anywhere.

**Actual cause: `core.hooksPath` is unset**, which kills BOTH mirror hooks — `post-checkout`
(main → worktree) and `post-commit` (worktree → main). A gitignored staging folder with no working
mirror lives only on the checkout that built it. `main` holds zero Mason Park media as a result.

### Restored

| Count | Source | How |
| ---: | :--- | :--- |
| 27 | the old-site scrape already in this worktree | straight copy — `site-scrape/.../wp-content/uploads/` uses the exact `uploads/YYYY/MM/` layout the build expects, no network |
| 188 | Google Photos "MARKETING PHOTOS" | `node .tmp/import-album.mjs` — 60 photographs × 4 srcset widths |

215 referenced, 215 present, and `node .tmp/check.mjs` is green: **11 pages, 0 errors, 0 warnings.**

### Local vs staging: they are the same build

Staging **does** hold all 60 photographs — only the local image FILES were missing, never the work.
After the restore, `diff-live.mjs ../home/index.html https://staging.masonparkdental.com/`:

- **structure identical** — 595 elements local, 595 live, signatures matching
- **visible text identical** — 7,919 chars
- 20 "differences", all import artifacts or measurement noise, none content drift

| Reported difference | What it actually is |
| :--- | :--- |
| ogDescription / ogUrl / themeColor / favicon / jsonLd empty on live | Instatic drops these on import — the known lossy-import class `diff-live.mjs` exists to catch |
| `imgWithSrcset` 41 local / 39 live | two images lost their srcset on import |
| geometry 959 vs 905 px | scrollbar width on the live render, not layout |

All 10 pages return 200 on staging. **Production is behind staging**: `/new-patients` and
`/patient-reviews` 404 there, and no `mp-*` photograph is published.

### Gotchas

- **`INSTATIC_BASE_URL` points at PRODUCTION and this folder must never default to it.**
  `list-site.mjs` says so in its header: production carries six paid-traffic landing pages
  (`workflows/10-lp-instatic`). The generated `.env` faithfully preserved production as
  `INSTATIC_BASE_URL`, which means any tool run here without an explicit URL hits the live site.
  Added `INSTATIC_STAGING_URL=https://staging.masonparkdental.com` to `[mason-park]` in the master;
  **pass it explicitly** to `list-site` / `diff-live` / `verify-live`.
- **`.tmp/` dev deps are gitignored too.** `diff-live.mjs` died with `Cannot find package
  'playwright-core'` until `cd .tmp && npm i`. Same class as the missing images: anything ignored
  does not survive a fresh worktree while the mirror hooks are dead.
- **Check the scrape before reaching for the network.** All 27 WordPress-era files, including every
  `-300x115` / `-1024x1536` derivative that neither the Instatic media map nor the album manifest
  covers, were already sitting in `01-content-intake`. The first coverage pass called those 17
  "orphans" purely because it never looked there.
- **`instatic-media-map.prod-2026-08-27.json` maps local path → live URL** and its entries still
  serve 200s, so anything published is recoverable from the live site even with no local copy. It
  covered 10 of the 147 index.html needed — useful, but the scrape covered more, faster.
- **The `mp-*` frames are not on the live site.** That build has not been published; the map is from
  2026-08-27 and the album import from 2026-09-02. Do not read their absence as data loss.
- Restored images are still gitignored and still not mirrored. **Until `bash scripts/bootstrap.sh`
  sets `core.hooksPath`, this will happen again to the next worktree.**
