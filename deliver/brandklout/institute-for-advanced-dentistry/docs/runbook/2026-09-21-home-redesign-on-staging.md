# 2026-09-21 — The redesigned home page is on staging, and staging holds nothing else

Alejandro: "push this to Instatic … in the staging instance … just the homepage, remove all of the
others." Staging already existed ([2026-09-18 run](2026-09-18-staging-environment.md)), so nothing
was provisioned.

## Done

- **`https://staging.ifadentistry.com/` serves the redesigned home page**, published. It is the only
  page stored on staging: the 58 other pages cloned from production were deleted by the push
  (`replace` mode), on request. Every old staging URL now answers 404.
- **Production was not touched.** `www.ifadentistry.com` `/` and `/contact-us/` still 200, still
  loading GTM and the GoHighLevel pool (`verify-staging-clean.mjs` exit 0).
- **Pipeline:** new side pipeline [`workflows/21-instatic-upload/home/`](../../workflows/21-instatic-upload/home/),
  documented in the 21 directive. prepare → upload media → build → `ship.sh` (Instatic's own
  `importHtml`, on the staging container) → push → publish. The source of truth stays the local
  prototype in `04-design/.tmp/prototypes/home/`; nothing is edited on the Instatic side.
- **Every script refuses any host but `staging.ifadentistry.com`** (`home/staging-only.mjs`). The
  worktree `.env` points at production, and this push deletes pages, so the host is passed per
  command: `INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/<script>.mjs`.
- **What went up:** 45 media files (`home-*` in the library: 23 images, 6 films, 8 woff2, logos),
  `site.css` 46 KB and `site.js` 165 KB as code assets (GSAP 3.15 wrapped for the module bundler +
  `home.js`), 734 nodes, 150 bare classes. The form slot is the practice's GoHighLevel form in an
  Embed block. `000-brandklout-tags.js` and the consent bridge were kept; both are inert on staging.
- **Gates on the published page:** `04-design/.tmp/qa/gate.mjs https://staging.ifadentistry.com/`
  **50/50** (pins, three states at 25/50/75 %, real clicks, patient film plays from the library,
  reduced motion, contrast, GoHighLevel frame fills its card), zero overflow at 1440 and 390,
  frames reviewed against the local build, `verify-staging-clean.mjs` exit 0.

Commit: `d3745f9c` feat(ifa): home redesign on staging, which now holds only that page.

## Backups taken before the delete — and how to go back

| What | Where |
| :--- | :--- |
| Database, consistent copy | on the staging volume: `/app/storage/backups/cms-2026-09-21-seq3-pre-home-redesign.db` (451 MB, `VACUUM INTO`) |
| API snapshot: shell + all 59 page rows | `workflows/21-instatic-upload/.tmp/home/staging-snapshot-2026-09-21-seq3-pre-home.json.gz` (gitignored, this worktree only) |
| Source | git tag `ifa-staging-pre-home-redesign-2026-09-21` |

Fastest way back to a 59-page staging is not a restore at all: re-seed from production with
[`21-instatic-staging-clone`](../../../../process/21-instatic-staging-clone/21-instatic-staging-clone.md)
(`clone-site.mjs --strategy replace`, 2.5 s), then re-run `patch-staging-runtime.mjs`. The media
library was not touched, so no media step is needed.

## Next

1. Alejandro / Brandklout review on staging. Anyone submitting the form is writing into the
   practice's real GoHighLevel inbox.
2. After any change to the prototype: `prepare-home` → `upload-media-home` (only if files changed) →
   `build-home` → `ship.sh` (only if `index.html` changed) → `push-home --apply --force` → publish →
   gate. A CSS- or JS-only change skips `prepare` and `ship`.
3. The remaining templates, built from the frozen system once the direction is approved.

## Open, for Brandklout

- **The GoHighLevel form shows its hidden consent fields.** `privacy_analytics_consent`,
  `privacy_advertising_consent` and nine more render as visible inputs under the Submit button.
  They are in the form itself: opening `api.leadconnectorhq.com/widget/form/cxtQ5q29TfUr3cYlMmDB`
  directly shows them with no site around it, and production's frame is 1,872 px tall for the same
  reason. It is fixed in GoHighLevel (mark the fields hidden), not here.
- **Every link on the page except `#invitation` and `tel:` is a 404 on staging**, because the pages
  they point at were removed. They are the production URLs and resolve once those pages exist.
- The five content questions from the [canary run](2026-09-21-home-redesign-canary.md) are still open.

## Gotchas

- **NEVER promote staging to production as it stands.** The 2026-09-18 note says "promote with
  `clone-site.mjs --strategy merge-overwrite`". That was written for a 59-page staging. Today it
  would overwrite production's `site.css` and `site.js` — the whole WordPress clone's cascade and
  script replay — with the home page's, and every one of production's 58 other pages would lose its
  styling and scripts at the next publish. Promotion waits until the full site is rebuilt.
- **`replace` mode is the delete.** `push-home.mjs` sends one page with `mode: 'replace'`; Instatic
  derives the deletions itself. `deletedPageIds` stays empty.
- **The script asset is served as a module, so there is no inline `<head>` bootstrap.** The hero's
  "wait for the entrance" state is pure CSS now (`html:not(.is-ready)` + a 3.5 s fallback animation);
  `home.js` adds `.is-ready`. If the script never loads, the hero still appears.
- **GSAP had to be wrapped** to reach `window` from a CJS-bundled module (`build-home.mjs` header).
  Proven before shipping by loading the built `site.js` as `type="module"` against the local page.
- **`base.svg` keeps the markup verbatim**, `class`, `data-draw` and `data-line` included, so the
  drawn smile guides survived untouched. `<img>`, `<video>`, `<button>` went in as `x-wz-*`
  containers and came back with every attribute; none reached a typed module.
- **The Sienna button sits exactly on "Call"** on phones. `home.css` lifts `.asw-menu-btn` above the
  call bar under 768 px. On desktop it still overlaps whatever is bottom-left, as on every site.
- **Two kinds of console noise on the published page are not ours**, and the gate now filters them:
  third-party frames' own errors, and Cloudflare's beacon "failing SRI" — the digest in that message
  is SHA-512 of an empty body, i.e. this workstation's VPN, not the site.
- **One gate run in three flaked locally** on "The Design holds still" (states all zero), then
  passed twice unchanged. The pin ranges were identical in both builds. If it recurs, lengthen the
  350 ms settle in `scrollTo`, do not touch the page.
- Git Bash turns a `/path` argument into `C:/Program Files/Git/path`; `MSYS_NO_PATHCONV=1` before
  any `curl https://host$p` loop, or the 404 you see is for a URL that never existed.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Ids and hostnames only; no secrets.
