# Desktop screenshots — bestdentistinkatytx.com (pre-takedown capture)

Captured **2026-08-24** by `../site-scrape/screenshot.mjs`, because SiteGround is taking the site
down (it could not be cleaned — see the malware sections in `.claude/RUNBOOK.md`). These are the
visual reference for replicating the page flow on the new build.

## What is here

- `desktop/<slug>.png` — full-page capture, **1440×900 viewport**, deviceScaleFactor 1.
- `desktop/blog-part1..5.png` — the blog index is 70,192px tall, so it is sliced (see below).
- `manifest.json` — one entry per page: `slug`, `url`, `title`, `width`, `height`, `parts`,
  `files`, `stripped`, `status`.

**252 pages, 256 PNGs, ~410MB.** Every page captured `ok`; none hit the bot wall.

The PNGs are gitignored — the repo rules forbid committing binary/media assets. The manifest and
this README are text and are tracked.

## Three things the capture had to work around

Straight screenshots of this site are wrong in three ways. Anyone re-running or extending this
should know why the script is not just "navigate and capture".

**1. The nav was invisible on every page.** The `tooth-fairy` theme holds the main menu at
`visibility:hidden` until its own JS adds `.inited` to `.sc_layouts_menu`. On the broken site that
init never completes, so a naive capture yields 252 pages with **no navigation at all** — useless
for a flow rebuild. The script adds the class the theme would have added. Submenus are
`display:none` in their own right, so dropdowns correctly stay closed.

**2. The ClickFix malware overlay.** The compromised site injects a full-viewport iframe from
`palm.yourbodybydesign.me` inside a `div[data-sm="1"]` at `z-index:2147483647`. It renders that
host's own Cloudflare challenge over the real header. The script strips cross-origin
full-viewport overlay iframes before capturing and records what it removed in `manifest.stripped`.
In-flow embeds (Google Maps, the `app.neuralityhealth.ai` booking widget) are small and in-flow,
so the size test leaves them alone.

**3. Reveal-on-scroll sections.** A full-page capture does not scroll, so sections that animate in
would have stayed at `opacity:0`. The script neutralises animation/transition, forces lazy images
eager, walks the page top to bottom to fire every IntersectionObserver, then returns to the top.

## Known limits

- **4 pages are 403s** and captured as error pages, not real content: `privacy-policy`, `our-team`,
  `services`, `team`. They are 403 on the live site too.
- **The blog index is sliced.** Chrome's compositor tops out near 16384px; anything taller is
  captured as sequential full-width slices (`-part1`, `-part2`, …). Only `blog` needed this.
- **Desktop only.** No mobile/tablet widths were captured. Re-run with `--width 390` if needed.
- Page heights run 900px (min) to 70,192px (max), median ~8,100px.

## Re-running

```bash
node ../site-scrape/screenshot.mjs                  # all pages; skips what already exists
node ../site-scrape/screenshot.mjs --only contacts  # one page (or any slug substring)
node ../site-scrape/screenshot.mjs --width 390      # a different viewport
node ../site-scrape/screenshot.mjs --probe "<js>"   # evaluate JS on the first matching page
node ../site-scrape/screenshot.mjs --scan --probe "<js>"   # …across every page
```

It runs headless Chrome over CDP on a **throwaway profile** — the same approach `crawl.mjs` uses to
clear SiteGround's bot wall, and it keeps the infected site away from any real browser profile.
Capture order is home → services/team/contact/conversion → blog indexes → posts, so the
flow-critical pages land first if the site disappears mid-run. Re-running resumes.

## Version Control

Follows the root version control rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
`desktop/` is deliberately gitignored; `manifest.json` and this README are tracked.
