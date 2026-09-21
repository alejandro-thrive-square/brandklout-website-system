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

## Review round 2 (same day): the form overflowed its card and said "Submission in progress"

Two different causes, one ours and one GoHighLevel's.

1. **Ours, fixed and republished (seq 6).** The form card was pinned with ScrollTrigger so it would
   travel beside the copy. A pin lifts its element out of the page and puts it back on every
   refresh, and **a browser reloads an `<iframe>` every time it is moved in the DOM**: traced on
   staging, the GoHighLevel frame was moved 25 times and reloaded 25 times in four seconds. The pin
   also froze the card at the 747 px it measured before the form grew, which was the overflow. The
   card is no longer pinned or faded; the frame now loads 3 times (first load, the consent bridge's
   single `src` write, `form_embed.js` wrapping it once) and sits 40 px inside its card. Two gate
   checks hold it there: at most 3 loads and none after a forced refresh; frame inside a visible,
   unpinned card. Gate on staging **52/52**.
2. **GoHighLevel's, and it is why other sites show it too.** The prompt is GoHighLevel's
   save-and-exit feature. A form shows it when its setting **`enableSaveExitConfirmation`** is on
   **and** any field arrives prefilled through the iframe URL, which the consent bridge does on
   every load for the hidden `privacy_*` fields. GoHighLevel treats the prefilled values as a
   submission in progress, writes `form_progress_<formId>` to the frame's localStorage, and offers
   "Start over / Continue" on the next load. Proven on the bare form with no site around it (no query
   string, two loads: nothing; consent query string, two loads: prompt on the second;
   `?first_name=Test` alone: the same). Reproduced on production's `/contact-us/` at 4 s. Of the 13
   forms referenced in the repo, exactly the ones with the flag on prompt:

   | Flag ON (will prompt) | Client |
   | :--- | :--- |
   | `cxtQ5q29TfUr3cYlMmDB` | **Institute for Advanced Dentistry** (production and staging) |
   | `PzBilvSVUmynr9PLukbt` | Arvada Dental Center, Stone Dental Implant Center |
   | `iu5PnIxTRO7whKp6pahH`, `TYYxcIqi9UWzZBA9P5Ms`, `Jv5B9yuqGLgfrRpfWdLr` | Arvada Dental Center |

   Off, and quiet: Grand Mission / Livewell / Stone `WFEJsiC2yvdshNv2x2ff`, Legacy Pasadena x3, Mason
   Park `6SUhknD0606Y66ZAgaZI`, Marvel x2, Stone `0mtZk3CrshD7Y0OYOao4`.

   **The fix is in GoHighLevel: turn save-and-exit off on those forms.** No site script can reach it:
   the storage belongs to `api.leadconnectorhq.com`. Check any form with
   `node workflows/21-instatic-upload/check-ghl-form.mjs <formId> > file 2>&1` (exit 1 when on).
   A visitor who already has the saved key keeps seeing the prompt until they choose "Start over".

## BugHerd on staging (same day)

- **BugHerd project `542527` "Institute for Advanced Dentistry"**, created through the API with
  `devurl` = the staging host. Members came with it: Sang Huynh, BrandKlout Success, Gauge Hill,
  Jessica, Alejandro. Nobody needs inviting.
- **The sidebar is on staging**, published. It is not a tag in the page: Instatic bakes a CSP into
  every page, so it went in through `brandklout.embed-origins` — `siteScripts` gained
  `https://www.bugherd.com/sidebarv2.js?apikey=<project key>` (Sienna kept), and script / connect /
  frame origins for BugHerd and its Pusher socket were added. Written read-merge-write, with the
  untouched keys asserted unchanged. Tool: `workflows/21-instatic-upload/home/bugherd.mjs`
  (`status | create | install <key> | uninstall`), staging-locked like the rest of `home/`.
- **Checked:** the script tag is in the published page, no CSP violation in the console, the loader
  answers 302 to `sidebar.bugherd.com/embed.js` (200, 19 KB), GSAP and all 8 chapters still run.
- **Headless Chrome on this workstation gets `204` for the loader.** That is NordVPN Threat
  Protection filtering it inside Chrome; curl with the staging referer gets the real script. If the
  sidebar does not appear in a browser here, pause Threat Protection before suspecting the site.
- **`node home/bugherd.mjs uninstall` + publish before staging is ever promoted.** The setting lives in
  the plugin record, and the plugin record is one of the things a clone copies.
- Feedback arrives on the BugHerd board; pull it per
  the usual convention: list the tasks, then fetch each task by id with its
  screenshot, and reproduce in WebKit at 1512x735 before calling anything unreproducible.

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

- **Turn save-and-exit off on the GoHighLevel form** (`enableSaveExitConfirmation`, review round 2 above).
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
- **Never pin, and never let anything re-parent, an element that holds an `<iframe>`.** Every DOM move
  reloads the frame. ScrollTrigger pins move their element on every refresh.
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
