# 2026-09-10 — Rebuild the current-site scrape

## Why

The 2026-09-04 scrape of ifadentistry.com (commit `e931becc`) committed only its scripts, manifests and page extracts. The bulk output (`site/`, `raw-html/`, `screenshots/`, `media-library/`) is gitignored, and the worktree cleanup on main deleted it. No copy survived in any other checkout.

## Done

Commit `d5a26932` on `bk-ifa-dentistry`, not pushed. Re-ran the committed scrapers in `workflows/01-content-intake/.tmp/current-site-scrape/scrapers/`:

| Step | Result |
| :--- | :--- |
| `node mirror.mjs` | `site/` 63 MB, opens from `file://`. 55 of 57 URLs mirrored; the other 2 are redirects (`/contact/`, `/about/`). 777 assets. |
| media-library pass | 237 of 237 WordPress originals, 36 MB, in `media-library/`. |
| `node screenshots.mjs --shard 0/2` and `--shard 1/2` | 56 full-page desktop PNGs at 1440 px in `screenshots/desktop/`, 0 failures. |
| `node vimeo.mjs` | 3 of 10 clips in `media-library/vimeo/`, the same 3 as the original run. |
| `node inventory.mjs` | Regenerated `current-site-inventory.md`. |

Script fixes: `mirror.mjs` now skips wildcard URLs, so the 5 fake "failed assets" (`/wp-content/uploads/*` and similar, from the speculation-rules script) are gone. `inventory.mjs` words that line to match. The intake directive now covers the local-only output and how to rebuild it.

## Next

- Get the 7 locked Vimeo clips from the outgoing agency (Gilleard Marketing). The 4 patient testimonials (Helen, Mark, Lisa, Philip, about 2 min each) are the ones that matter. The other 3 are stock procedure animations (crowns, implants + crowns, TMJ).
- Or retry `node vimeo.mjs` with NordVPN off. The locked player returns 401 to this IP.

## Gotchas

- The bulk scrape output is local-only and not synced to the VPS, so any worktree cleanup deletes it again. Rebuilding takes about 15 minutes; the commands are in the intake directive under Version Control.
- Re-running `screenshots.mjs` rewrites the committed `pages/*.md` and `page-extracts-*.json`. Their diffs are Trustindex review rotation and small word-count shifts, not copy changes.
- `/category/uncategorized/page/2/` is still live (200), but this run's crawl did not reach it, so it has no local copy in `site/`. It does have a screenshot and an extract, because `screenshots.mjs` read the old page list. Every post it lists is mirrored on its own.
- The screenshot job reports exit 1 when there are 0 failures. That comes from the `grep -c FAIL` summary line, not from the screenshots; read the logs.
- The Vimeo `oembed` endpoint answers 200 for the locked clips (title, length), but the player page answers 401 even with the site as referrer.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
