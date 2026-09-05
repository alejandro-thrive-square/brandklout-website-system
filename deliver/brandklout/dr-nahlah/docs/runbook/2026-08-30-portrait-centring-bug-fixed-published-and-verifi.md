## DONE 2026-08-30: portrait centring bug — FIXED, PUBLISHED AND VERIFIED LIVE, not committed

Chapter 03's portrait (`#specPortrait`) sat half its own width too far left on the live
site, correct locally. Fixed at the source, pushed, published, verified in a real browser.
**Working tree is NOT committed** — that is the only thing left to do.

### The cause: CSS and GSAP both centring the same element

- `site-src/css/33-ch-specialist.css:8` — `left:50%; transform:translateX(-50%)`
- `site-src/sections/ch-specialist.js` — `gsap.fromTo('#specPortrait',{xPercent:-50,...})`

GSAP reads a starting transform through `getComputedStyle`, which returns a resolved
**matrix** — the `-50%` arrives as plain pixels and is recorded as the baseline `x`.
`xPercent:-50` is then layered on as a second translate, so the element is shifted twice:

    transform: translate(-50%, 2.4054%) translate3d(-237.401px, 0px, 0px);

**Fix**: pin `x:0` in both `fromTo` states. The CSS `translateX(-50%)` must stay — the
`if(W.reduced) return;` at the top means the tween never runs under
`prefers-reduced-motion`, and CSS is then the only thing centring the portrait.

### Why it hid locally — the transferable lesson

It depends on whether the image has a **laid-out width** when GSAP takes its snapshot.
Local `<img>` has no `width`/`height` attributes, so pre-decode the box is 0px wide and
`-50%` of 0 is a harmless 0. Instatic's uploader adds `width="1200" height="1500"` plus
`srcset`/`sizes`, so the aspect ratio is known at parse time and the real half-width is
baked in permanently. **Any element the CSS transforms AND GSAP animates is this bug
waiting to happen, and a local pass proves nothing about the host.**

Audited every other overlap — `#realityImg` (transform is on the parent `.re-frame`),
`.sv-follow` (no CSS transform), `.bl-rc-fig img` (`css:2155`, same shape but no tween
targets it), `.nav-chapter` (no JS). All clear. If `.bl-rc-fig img` ever gets
`data-drift`, note the generic drift tween sets only `yPercent`, so it would *lose* its
centring rather than double it.

### Verified live

`translate(-50%, 2.44%) translate3d(0px, 0px, 0px)` — same shape as the bug, `0px` where
`-237.401px` was. Image centre and plate centre agree to **0px**. Post-publish audit vs a
pre-publish capture of the same page: identical except `ogImage`, which varies run to run
(three runs, three values) and is not publish drift.

### Two traps that cost the most time here — READ BEFORE USING THE API TOOLKIT

**The site's domain has moved to `https://www.drnahlah.com`.** `encorercm.com` no longer
serves `/admin` (403). Both now documented in `15-instatic-api-sync.md` Gotchas:

1. `insta-api.mjs` evaluated `BASE` **above** `loadEnv()`, so `.env` could set the email and
   password but **not** `INSTATIC_BASE_URL` — it had already been frozen to the hard-coded
   `encorercm.com`. Setting it in `.env` appeared to work and changed nothing. **Fixed** in
   this session: `loadEnv()` runs first, default now `https://www.drnahlah.com`.
2. A cached cookie from the old host returns **403 with an HTML body, not 401**, so
   `request()`'s transparent re-login never fires. **Delete `.tmp/.session` after any domain
   change.**

Diagnostic that separates these from a credentials problem: `curl` the endpoint with no
cookie. A clean `401` means host and route are fine. Then
`node deliver/process/20-instatic-domain-origins/check-origins.mjs --all`, which needs no
credentials and names the host to use.

### State

- Changed, uncommitted: `site-src/sections/ch-specialist.js`,
  `final-site/assets/site.js`, `15-instatic-api-sync/insta-api.mjs`,
  `15-instatic-api-sync.md`, this runbook. Also `.env` (untracked) → new base URL.
- I did **not** run `node build-site.mjs` — it rewrites all 37 pages and the generators
  (`gen-blog`, `gen-reviews`, `gen-gallery`, `gen-videos`, `gen-legal`, `add-cta-offices`)
  post-process those afterwards, so a bare run drops their output. `site.js` is a verbatim
  concatenation (`build-site.mjs:56-80`), so patching the bundle by hand is byte-identical
  to rebuilding it — verified by re-running the bundle logic and diffing.
- Before pushing I diffed the **live** asset against local: the only difference was this
  fix. Worth repeating — the local bundle carries other uncommitted work that was already
  live, so "local differs from HEAD" does not mean "unpublished".

### Two things left for someone to decide

- **The QA baseline in `08-qa/.tmp/audit-out/` is stale**: captured against
  `encorercm.com`, and predates the Vimeo migration (`words` 1385 vs 1617 live, YouTube
  iframes vs Vimeo, 25 images vs 37). It cannot function as the publish gate the workflow
  doc describes until it is re-captured against `www.drnahlah.com`. I ran `--only index`,
  then **restored the file to HEAD** rather than silently re-baselining a tracked record.
- **The CSS deployed on Instatic is older than `site-src`**: live shows `height:100%` /
  `object-fit:cover` and no `max-width:none` (so base `img,video{max-width:100%}` still
  wins, clamping the portrait to its plate); source says `height:104%` /
  `object-fit:contain` / `max-width:none`. Pushing `site.css` will change the portrait's
  width. Not needed for this fix, and deliberately not done.

### Pre-existing, not mine, still open

Home page audit shows `imgBroken: ['']`, three images with no alt, and `401` on
`player.vimeo.com/video/1221240290` — the Vimeo uploads are the BLOCKED item below.
