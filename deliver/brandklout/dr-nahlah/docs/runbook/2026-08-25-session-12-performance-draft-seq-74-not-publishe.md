## DONE 2026-08-25 (session 12): performance — DRAFT seq 74, NOT PUBLISHED

The client reported PageSpeed falling from 95+ after the domain moved to
`www.drnahlah.com`. **First thing to settle before believing any of this is a
regression:** the runbook itself records `www.drnahlah.com` as the WEBFLOW build.
That domain now serves Instatic. A 95+ recorded against it before the cutover was
measuring Webflow, not this build. Findings below stand either way.

Full write-up published as an artifact:
https://claude.ai/code/artifact/43791b6d-b584-4153-9386-ff66ee391e0f

### What was wrong, and what was done

| Fix | Script | Effect |
|---|---|---|
| 246,151 raw B (~71 KB gz) of blocking JS in `<head>` → `body-end` | `perf-unblock-head.mjs` | 28 scripts moved; head now has ZERO blocking JS |
| every image lazy, no `fetchpriority` — incl. the LCP | `perf-image-priority.mjs` | 71 eager, 34 `fetchPriority: high` |
| 194/196 images emitted TWO `alt` attributes | same script | 0 duplicates |
| 13 YouTube thumbnails had an EMPTY alt | `perf-youtube-thumb-alt.mjs` | 13 filled from each card's heading |
| 3 snippet embeds loaded vendor scripts with no `defer` | `perf-review-embed.mjs` | all deferred; reviews widget also lazy |
| no standing check for any of it | `08-qa/perf-budget.mjs` | 41 assertions across 5 pages |

**Deliberately not done: the 9.2 MB hero video.** The client excluded it. It is
waived by name in `BUDGET.mediaWaivers` so the gate reports it rather than passing it.

### The traps, all of which cost time

- **`placement: head` means "block the parser".** Instatic emits classic scripts as a
  bare `<script src>` — no `defer`/`async` EVER — and the per-script `timing` field is
  **never read at publish time**. Only `placement` and `format` do anything.
- **`gsap-head-i.js`'s own header is WRONG.** It insists it must stay head + blocking
  because inline page scripts latch `window.gsap` during parse. Those inline scripts
  were retired and emptied on 2026-08-19. The only consumer left is `site.js`, which
  ships as a deferred `type="module"` entry — so a body-end classic script still runs
  first, by spec.
- **Checked before deferring anything: nothing is hidden pending JS.**
  `[data-anim="hide"]` appears 0 times in the published HTML and
  `.wz-kit [data-rv] { opacity: 0 }` never matches (nothing carries `.wz-kit`). Had
  either been live, deferring the reveal would have made LCP WORSE.
- **`htmlAttributes.alt` beats the library alt.** The module renders
  `htmlAttributes` FIRST, HTML keeps the first duplicate, so session 11's library
  writes were being ignored on 194 images. Stripping `alt` from `htmlAttributes`
  hands the role back to the library — but ONLY where a library asset actually has
  alt, or you replace real text with nothing.
- **Present is not non-empty.** The 13 YouTube thumbs had `htmlAttributes.alt === ""`.
  A `!= null` check called them covered. **Assert on the RENDERED attribute.**
- **Node `fetch` decompresses transparently** and this origin sends no
  `content-length`, so "gzip size" measured that way is the DECOMPRESSED size. The
  gate gzips locally with `zlib` now.
- **`changedPages` needs `slug`** — a payload without it 400s with
  `site.pages[0].slug: Expected string`.

### NOT done

1. **NOT PUBLISHED.** Draft at `seq 74`.
2. **After publishing, run both:** `node 08-qa/perf-budget.mjs --all` (should go from
   19/41 to near-clean) and `node 04-design/.tmp/interaction-test-gsap.mjs https://www.drnahlah.com/`
   — the GSAP move CANNOT be verified without a publish, and that test is the gate.
3. **`preconnect` is impossible from inside Instatic** — the publisher emits no
   `<link>` and plugin frontend assets have no `link` kind. Do it as a Cloudflare
   Transform Rule adding a `Link: <…>; rel=preconnect` header.
4. **HTML is not edge-cached** (`cf-cache-status: DYNAMIC`, TTFB 329–381 ms). A
   Cloudflare Cache Rule would fix it but needs a purge hook on publish.
5. The hero video, per the client.
6. Nothing committed.
