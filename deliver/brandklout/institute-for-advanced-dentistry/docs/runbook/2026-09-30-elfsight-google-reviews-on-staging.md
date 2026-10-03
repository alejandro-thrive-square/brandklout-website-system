# 2026-09-30 - Elfsight Google Reviews on the staging home page

Task brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../tasks/2026-09-30-google-reviews-widget.md).
Commit `c7b2d708`.

## Done

- **Widget:** Elfsight Google Reviews app `7febe92d-b5da-447f-b53f-9593eec9da53`, connected to
  the listing "Institute for Advanced Dentistry and Implants", 13360 N 94th Dr B, Peoria, AZ 85381
  (5.0 from 96). Created by the main-repo session; nothing on Elfsight was touched here. Registry:
  `deliver/process/tools/elfsight-reviews/review-widgets.json` (its row still says
  `created-not-placed`; it lives in the main checkout, not this worktree).
- **Staging only** (`staging.ifadentistry.com`, the only page there), draft seq 8 -> 9, published:
  - `/` `#proof`: the `.voices` rotator (gold stars, "**85** five-star reviews", "5 / 5 average
    patient rating", three rotating quotes and the arrows; 36 nodes) is replaced, at the same
    position, by one `brandklout.embed-origins.embed` node in snippet mode, class `.rv-embed`.
    The chapter heading, the lede and the four story cards stay; "See the smile gallery" and
    "Read more patient stories" stay below it.
  - A new shell class rule `.rv-embed`: `display:block; width:100%; min-height:420px;
    margin-top:6rem; padding-top:3.5rem; border-top:1px solid var(--rule)` (what `.voices` gave
    the block).
  - The "85" was a fixed count; the listing already had 96. The widget carries the live rating and
    count in its own header, so no static figure is left in the chapter.
- **Script:** `workflows/21-instatic-upload/home/add-elfsight-reviews.mjs`. Dry run by default,
  `--apply`, `--publish`; staging-locked through `staging-only.mjs`; re-runnable (an embed already
  there gets its snippet refreshed, nothing else moves). Snippet = Elfsight's install code with
  `data-elfsight-app-lazy` removed. Logs: `21-instatic-upload/.tmp/home/elfsight-{dry,apply}.log`.
- **Backup before the write:** `21-instatic-upload/.tmp/home/staging-snapshot-pre-elfsight-seq8.json.gz`
  (`snapshot-home.mjs pre-elfsight`; shell + the page row, gitignored). The way back is the
  2026-09-21 run's: `push-home.mjs --apply --force` from the prototype rebuilds the page without
  the widget.
- **Verified in real Chrome on a fresh load** (`/?rv=2`, Claude in Chrome): the widget renders
  at 441 px, header "Google Reviews 5.0 (96)", cards from the Peoria listing (John Boyer, Harman
  Salh, Kunal Thapar...), `.voices` gone, `readyState complete`, no console errors of ours (only
  BugHerd's own "Not Found").
- **Gates:** `qa/gate.mjs` on staging **64/64** (was 67: the four rotator checks became one
  widget check, which reads the reviews through the widget's shadow root);
  `verify-staging-clean.mjs --paths /` exit 0 (noindex kept, no host leak, no tags on staging).
- **Housekeeping found on the way:** every pipeline script imported `insta-api.mjs` from
  `process/22-instatic-api-sync/`, which the system-v2 merge (2026-09-27) moved to
  `process/tools/instatic-api-sync/`; 14 files repointed. `deliver/process` was outside this
  worktree's sparse cone (`git sparse-checkout add deliver/process`). `push-home.mjs` now ends
  with a reminder to re-run the reviews script; `21-instatic-upload.md` carries the step.

## Next

- **Production has nothing.** Production is the WordPress clone with its own review markup
  (`/testimonials/` and whatever the clone's home shows); this widget is part of the redesign
  and reaches production only when the rebuilt site is promoted. What production would need
  then: the `brandklout.embed-origins` plugin (already installed there for Sienna), the same
  Embed node in whichever review sections the rebuilt pages have, and a run of the script with
  its staging lock lifted or a production twin of it. Do not place it on the clone's pages now:
  every write there ships at the next publish, and the clone is not being edited.
- Design: the widget brings its own "What Our Customers Say" title, Google-grey cards and its
  own font under our chapter heading "Brighter smiles and brighter days." If Brandklout asks,
  turn the widget's header title off and match the colours in Elfsight's editor (main-repo
  session owns the widget).
- Update the registry row (`onSite: ["staging /"]`, state placed on staging) from the main
  checkout.
- The local prototype (`04-design/.tmp/prototypes/home/index.html`) still has the rotator, on
  purpose: it has no Instatic Embed. See the gotcha.

## Gotchas

- **A re-push drops the widget.** `push-home.mjs` rebuilds the page from the prototype in
  `replace` mode; the Embed exists only on Instatic. After any push: `node
  home/add-elfsight-reviews.mjs --apply`, then `publish-home.mjs`. The push now prints this.
- **`data-elfsight-app-lazy` never boots on Instatic** (Mason Park Kids, 2026-09-29): platform.js
  loads, `window.eapps` exists, the widget stays at 0 px with no error. The snippet here has no
  such attribute; keep it out.
- **The widget's reviews are not in `innerText`.** The host element's `innerText` shows only the
  owner panel ("Panel only seen by widget owner", visible to anyone logged in to Elfsight); the
  reviews sit in a shadow root on a descendant, and "Google" in the header is an image, so the
  readable text is `What Our Customers Say Reviews 5.0 (96) ...`. The gate walks the shadow roots
  and matches `Reviews 5.0 (96)`, not "Google Reviews".
- **The page takes 20-35 s to reach DOMContentLoaded through this workstation**, and Claude in
  Chrome reports the renderer "frozen" while it does; the local A/B (prototype vs prototype with
  the swap, both under 2 s) showed the widget is not the cause. Third-party stalls are (the
  BugHerd sidebar iframe sat 23 s, GoHighLevel preview bundles). Give the tab 10 s before the
  first injection and do not `scrollIntoView` from an injected script while it loads.
- **Junctions from Git Bash fail** (`cmd //c mklink /J` mangles the flag). `New-Item -ItemType
  Junction` from PowerShell works.
- Removing `[data-voices]` is safe for `home.js`: its rotator block is behind `if (voices)`, and
  the one reference outside it, `gsap.from('.voices > *', {scrollTrigger: {trigger: voices}})`,
  only warns (no targets) and falls back to `<body>` for a null trigger.

## Version Control

Tracked with the client runbook on `bk-ifa-dentistry`; see the repository's SYSTEM_RULES.md §4.
Ids and hostnames only; no secrets.
