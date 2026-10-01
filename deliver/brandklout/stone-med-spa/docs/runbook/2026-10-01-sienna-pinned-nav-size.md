# 2026-10-01 — "The homepage has a different navigation size": Sienna pinned text at 16px

The client's report: the home page's navigation was a different size from the other pages. It was
real, and bigger than the nav: the Sienna accessibility widget had frozen text at the browser
default on whichever page lost a load race. Fixed on STAGING and PRODUCTION the same day.

## Done (`cff40aad`, this worktree only — not pushed, not merged)

- **Cause.** Sienna (`siteScripts`, an `async` tag in `<head>`) runs `W(1)` at start-up. It reads
  every text element's computed font-size, stamps it as `data-asw-org-font-size` and writes it
  inline in px, even at 100%. When it runs before the page CSS has applied, it reads 16px. Seen
  live: nav links 16px instead of 12px, the home `h1` 32px instead of 123.84px, `/about`'s `h1`
  32px instead of 95px; 131 elements on `/about`, 516 on `/`. The Elfsight change (2026-09-30)
  did not cause it; the race predates it, but a heavier home page loses it more often.
- **Fix:** new `site-src/js/01-sienna.js`. Once CSS applies (the bundle is a module), it re-reads
  the true sizes, stores them as Sienna's originals and drops the inline sizes. A visitor's
  chosen scale is re-applied to the corrected originals; an observer catches a late Sienna.
  This also restores the fluid type on resize. Built with `build-site.mjs`; the diff against the
  live bundle was the new block only.
- **Shipped** with the new **`05-instatic-upload/swap-site-js.mjs`** (only the bundle inside the
  shell's `src/scripts/site.js`, incremental, backup, read-back exact, publish):
  staging seq 22 → **23**, production seq 26 → **27**, both `{"publishedPages":26}`.
  Backups `.tmp/backup-staging-2026-10-01-seq22-pre-site-js`, `.tmp/backup-prod-2026-10-01-seq26-pre-site-js`.
- **New gate `05-instatic-upload/sienna-test.mjs`** — keeps Sienna, alternates cold and warm loads.
- **BugHerd** (new `05-instatic-upload/bugherd-scan.mjs`): 86 tasks, 84 done, no new tasks or
  client comments since the round-2 replies of 2026-09-29. Still open, still blocked, nothing posted:
  **#10** (Abby/Brooke photos: Drive searched again for "Abby", "Gentry", "IMG_5299", "Stone Team";
  only the `brooke.jpg` the site already uses) and **#73** (GHL form colours, a GHL setting).

## Verified

- Before: staging `/about` lost the race 8 of 10 cold loads (link 16px, `font-size: 16px` inline,
  `data-asw-org-font-size=16`). The repair, injected into a lost load, gave 12px / h1 95.04px,
  no inline sizes; Sienna's ×1.2 then gave 14.4px (from the corrected 12); 1920px gave 13.5px.
- After: `sienna-test.mjs` on both hosts, `/ /about /results /botox` × 4 loads (cold/warm):
  link 12px, h1 123.84px (home) / 95.04px, inline 0, widget present — `FAIL none`.
- `verify-live.mjs` on both: 26 routes, 26/26 titles, `FAIL none`.

## Next

- **The other Sienna sites have the same race** (Mason Park, Mason Park Kids, Stone Surgical
  Arts, IFA, West LA, Brandklout, Dr. Nahlah). The root fix is system work on main: give
  `brandklout.embed-origins` a way to emit a site script `defer` (deferred scripts wait for
  stylesheets) and use it for Sienna. This worktree only fixed this site.
- #10 and #73 as before.

## Gotchas

1. **Every gate blocks Sienna**, so none of them could see this (trap 38). Directive trap 42.
2. **An injected test script fails silently on pages with the strict CSP** (`/about`): puppeteer's
   `addScriptTag` inline content is refused. Use `setBypassCSP(true)` for such probes.
3. **"16px on one load, 12px on the next" is a race, not a bad rule.** A matched-rules dump showed
   `.navbar_link { font-size: var(--size-text-tiny) }` applying and the token resolving to 0.75rem
   at every ancestor; the inline `style` attribute was the answer.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md). Committed with the work it describes; not pushed, not merged.
