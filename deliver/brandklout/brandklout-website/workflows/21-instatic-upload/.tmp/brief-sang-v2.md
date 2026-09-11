# Brief: publish Sang's second version (2026-09-11)

You are working in the worktree `bk-brandklout-website`
(`C:\Users\ACER\orca\workspaces\Brandklout Website System\bk-brandklout-website`). Stay in it, and
never edit the main checkout.

## What happened before you

Sang (Brandklout CEO) sent a ChatGPT-built page for Brandklout's own site. There is a compliance
emergency on the current site, so phase 1 is to get his page onto Instatic **as he wrote it**, as a
review link. The first version (`preview (1).html`) was published on 2026-09-11 (`c789ce8b`).
Sang wasn't happy with it and has now sent a new version as a zip:

`deliver/brandklout/brandklout-website/workflows/00-client-delivery-initialization/.tmp/client-handoff/BrandKlout-Preview1-Website-Package (1).zip`

## Read first, in this order

1. `deliver/brandklout/brandklout-website/docs/RUNBOOK.md`
2. `deliver/brandklout/brandklout-website/docs/runbook/INDEX.md`, then
   `2026-09-11-sangs-page-published.md` (its Gotchas especially)
3. `deliver/brandklout/brandklout-website/workflows/21-instatic-upload/21-instatic-upload.md`: the
   Brandklout box and the "Brandklout: the one-page run" section (steps, traps 35–38). The rest of
   that file is Stone Med Spa's text. Read a trap when the section points you at it.

## The task

1. **Unpack without touching the zip.** Extract it to a sibling folder in client-handoff (for
   example `package-v2/`). Keep the zip and `preview (1).html` as received.
2. **Read the package before changing any tooling.** Record the page count and filenames, then
   list every `<script>`, form, font, image (and its format), external embed, and inter-page link.
   Each of those is a known way an Instatic import fails silently. Diff the copy against v1 and
   note what Sang changed, especially anything touching the flagged items (see step 6).
3. **Adapt `21-instatic-upload`** to the package:
   - `prepare-source.mjs` refuses anything other than exactly one `.html` in client-handoff.
     Point it at the extracted package instead, and handle more than one page and external
     CSS/JS if the package has them.
   - Pages: add one line per page to `PAGES` in `build-import-input.mjs`, and to the page lists
     in `verify-live.mjs` / `compare-live.mjs` / `visual-diff.mjs`. **Replace mode deletes any
     stored slug missing from `PAGES`** (trap 8). `index` stays.
   - Images: run `upload-media.mjs` then `set-alt.mjs --apply` (traps 5 and 28: no AVIF, and alt
     text lives only in the media library). CSS `url()`s go through the media map (trap 14).
   - Fonts: install any new family with `install-fonts.mjs --apply`. DM Sans and Manrope are
     already installed.
   - Links: `x.html` becomes `/x` (trap 4).
4. **Run the chain.** Build → `ship.sh` → `inspect-import.mjs` → `push-site.mjs` dry run →
   `--apply --force` → publish.
   - `ship.sh` needs `RAILWAY_LINK_DIR`: a directory you link yourself by ID with
     `railway link -p 550ebd58-0e74-444e-96d5-2b836a2db98a -e production -s Brandklout`, run with
     `env -u RAILWAY_TOKEN -u RAILWAY_PROJECT_ID`.
   - `puppeteer-core` is already installed at the worktree root.
   - Redirect Node output to a file, never a pipe.
5. **Gates, all of them:** `verify-live`, `css-parity`, `visual-diff` at 1440 and 390,
   `compare-live`, `form-probe`. Look at the diff and live PNGs yourself. Fix every real defect and
   write it up as a new trap (39+). Only benign findings may remain, and each one needs a stated
   reason.
6. **Do not change Sang's copy or claims.** Re-check last round's flagged list and report which
   items v2 fixed and which remain:
   - the form captures nothing
   - visible prototype text
   - Privacy, Terms and HIPAA linking to `#`
   - strategy notes written as copy
   - unverified claims (60-day guarantee, 5.0★, Henry Schein One, the case-study figures)
7. **Stay off the domain.** No DNS, no domain changes, nothing outside this Railway instance.
8. **Close out:** a new run file under `docs/runbook/` plus its INDEX row, a refreshed
   `RUNBOOK.md`, the directive updated with anything reusable, then a commit on
   `bk-brandklout-website`. **Do not push.**

## Report back

In a few lines:
- the review link
- the gate numbers
- what v2 changed
- what is still flagged for Sang
- the commit SHA
