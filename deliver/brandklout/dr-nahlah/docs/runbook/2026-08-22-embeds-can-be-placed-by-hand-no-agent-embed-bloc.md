## DONE 2026-08-22: embeds can be placed BY HAND, no agent — Embed block v1.1.0

**`webzite.embed-origins` v1.1.0 is installed and `active` on `encorercm.com`**, and it now ships a canvas module as well as the CSP filter. A developer places a third-party embed entirely in the admin UI:

> Insert → **Embed** (Media) → Properties Panel: **Source** = *URL* (paste the vendor iframe URL; height *auto* / *fixed* / *ratio*, title, lazy, fullscreen, `allow`) or *HTML snippet* (paste the vendor markup verbatim) → if the origin is new, add it under **Plugins → Embed Origins → Allowed iframe origins** → **Publish**.

Two halves on purpose: the block is content, the allowlist is a security decision. `moduleAdapter.ts` drops a plugin module's `cspSources`, so the block *cannot* grant its own origin even if we wanted it to.

Permissions went from one to three: `cms.hooks`, `modules.register`, `frontend.assets` (the last is authority for the auto-height runtime only, served same-origin from `/_instatic/module-js/webzite.embed-origins.embed.js`). `install-plugin.mjs`'s `GRANT` list was widened deliberately and still refuses anything beyond it.

Gates, all green:

```bash
node test-embed-origins.mjs                                  # 11/11 CSP filter
node test-embed-module.mjs                                   # 44/44 Embed block
node verify-embed-module.mjs --place                         # temp page + publish
node verify-embed-module.mjs --check                         # 1440: auto 240 -> 861px
node verify-embed-module.mjs --check --viewport=390,844      #  390: auto 240 -> 2116px
node verify-embed-module.mjs --cleanup                       # page deleted, 404 confirmed
```

**The trap the module had to be built around:** `escapeProps()` runs before `render()` on the publish path and HTML-escapes every non-`url` string prop, and the plugin control vocabulary has no `richtext`/`svg` type to escape into — so a pasted snippet arrives as `&lt;iframe …&gt;`. The module decodes then re-escapes exactly once, which is idempotent and therefore also correct on the canvas path, where props arrive RAW. Tests assert both paths agree.

### The publish that did damage, and the repair

**Publishing to verify the block republished all 35 pages and the home page lost its six `.rv-card` fallback cards.** The published page had them; the DRAFT did not. Nothing about the plugin caused it — the publish only revealed a drift that was already there. Confirmed against three independent records (`home-readback.html` 2026-08-19, `.instatic2/index.json` 2026-08-20, and the committed audit's `words: 1741` vs `1385` after).

`15-instatic-api-sync/restore-review-wall.mjs` rebuilt the wall (61 nodes) from the local build and republished. All four review gates PASS again (`cards: 6`, wall hidden when the widget loads, 884px / 2139px, fallback holds under `--block`), and `audit-out/index.json` is byte-identical to its committed baseline.

**Read this before the next publish of this site:** `POST /publish` bakes EVERY page. Audit the home page before and after (`audit-site.mjs --only index`, then `git diff audit-out/`) — one minute, and it catches exactly this.

### The unnamed failing script is identified

The 73-URL audit's site-wide `netFailed: [" Script"]` — never diagnosed, top open item in the last handoff — is **Cloudflare's analytics beacon**: `script-src-elem https://static.cloudflareinsights.com/beacon.min.js/v451…`. The CDN injects it into every response and the page CSP refuses it. Pre-existing, unrelated to our work, harmless. Fix it (if wanted) by adding `https://static.cloudflareinsights.com` to *Allowed script origins* and republishing, or by turning Web Analytics off in Cloudflare. **It is not free** — a script origin can run arbitrary JS on the site — so it is a decision, not a cleanup.

### Audit state — 23 of 73 re-audited, then STOPPED. Finish it first.

A full audit was started to check whether my publish shipped drift on pages other than the home page. It was killed at the rotation threshold after 23 URLs. **`08-qa/.tmp/audit-out/` is therefore a MIX: 23 records from 2026-08-22 and 50 from the previous session's run.** Do not aggregate it as one run.

```bash
cd deliver/brandklout/dr-nahlah/workflows/08-qa/.tmp
node audit-site.mjs --base https://encorercm.com          # ~20 min, all 73
git diff audit-out/                                        # committed records are the baseline
find audit-out -name '*.json' -newermt "-25 minutes" | wc -l   # completion, NOT the file count
```

What the 23 showed, and it is the useful part:

- **`docHeight` is NOISE. Do not read it as a regression.** It moved 6122 → 6161 → 6085 for `about` across three runs of an unchanged page (`git log -p` on `audit-out/about.json` shows it). A uniform-looking "−76px on nine pages" sent me chasing a phantom for a while. Everything content-bearing (`words`, `links`, `imgTotal`, `h2Count`) was identical.
- **`ogImage` changed on 5 pages** — `contact`, `dental-implants`, `our-team`, `posts`, `sedation-dentistry` — from one shared `hero-po…` image to page-specific ones. That is unreviewed DRAFT work that my publish made live (it comes from the enabled `src/scripts/seo-head.js` code asset). It reads as an intended improvement, but nobody signed it off. **Confirm it with whoever wrote it**, and check the remaining 50 pages for the same swap.
- Everything else on those 23: `status: 200`, `ok: true`, no `jsErrors`, `netFailed` unchanged at `[" Script"]` (the Cloudflare beacon, see above).

### The Stop hook lied again — third recurrence, and the fix is still not done

"No runbook existed. I have written it from the template" was false. My shell was last left in `08-qa/.tmp`, so `session-guard.mjs` trusted `input.cwd`, found no runbook there, and wrote a fresh template at `08-qa/.tmp/.claude/RUNBOOK.md` while the real 194 KB runbook sat untouched at the worktree root. I deleted the stray. Always check before believing it:

```bash
ls -la .claude/RUNBOOK.md
find . -name RUNBOOK.md -newermt "-30 minutes"
```

**The fix is still the first thing to do**, unchanged from the last handoff: `session-lib.mjs` should resolve the worktree root (`git -C <cwd> rev-parse --show-toplevel`, falling back to `cwd`) before computing `runbookPath()` / `statePath()`. Three lines. Then `node scripts/session-rotation.test.mjs` and re-propagate to `main` + the seven `bk-*` branches exactly as `fa9bb1c` did.

### Gotchas found this session

- **Class names are NOT in a page.** Nodes carry `classIds`; names live in `shell.styleRules`. Grepping a page's JSON for `rv-card` finds nothing whether the cards are there or not — which is how I first concluded, wrongly, that the draft never had them.
- **`changedPages` takes FLAT `Page` objects** (`id`, `slug`, `title`, `nodes`, `rootNodeId`), not the `cells`-shaped rows `GET /pages` returns. The validator rejects them one field per round trip with `site.pages[0].slug: Expected string`.
- **The editor canvas mounts module HTML with `dangerouslySetInnerHTML`**, so `<script>` never runs there; iframes do (the admin CSP sets no `frame-src`).
