## Previous status: eleven core pages REBUILT (second build, 2026-09-03 evening), local only

**The first build was rejected at review the day it was finished** — not elevated enough, too much
text, too little imagery, no scroll motion — and every page was rebuilt the same evening. Read the
block at the top of `HANDOFF.md` first. Gates: `audit` FAIL none · `all-pages` 132 clean ·
`menu-test` 9/9 · `probe` console clean everywhere.

**The blocker is gone.** The client answered it on 2026-09-03 by sending the practice's own two
category images, which partition the menu with no ambiguity. It is the **modality split** — the
NassifMD pattern the research had recommended. The cut is at the incision, not the price.

Read [`04-design/.tmp/med-spa/HANDOFF.md`](../deliver/brandklout/stone-med-spa/workflows/04-design/.tmp/med-spa/HANDOFF.md)
before touching the build. It lists thirteen open items and what each one blocks.

```
cd deliver/brandklout/stone-med-spa/workflows/04-design/.tmp/med-spa/site-src
node build-site.mjs     # -> ../final-site, 11 pages
node audit.mjs          # static gate: FAIL none
node all-pages.mjs      # 11 pages x 390/1024/1440: 132 assertions clean
node menu-test.mjs      # the concern filter and the menu rows: 9/9
node shot.mjs ../final-site index.html ../shots/x.png 1440   # full page, REDUCED MOTION
node probe.mjs index.html 1440 ../shots/_p 0 600 ".section_cadence"  # viewport stops, motion ON
```

> [!WARNING]
> **The publishing blocker is resolved, but only half of it went away.** `seo.json`'s origin is now
> the Railway host — a real, resolvable origin — so nothing built from it points at a domain nobody
> owns. (In practice the canonical and `og:url` are not published at all: Instatic emits four head
> tags and those are not among them — gotcha 29. The origin still matters, because it will be the
> moment those tags are injected at runtime, and it matters for the build.)
> What has NOT been settled: there is still no purchased domain, the trading name is still
> unconfirmed (Asana says *Stone Med Spa*, the live Instagram says *Westlake Medical Aesthetics*),
> and there is no brand identity, logo or favicon. **The trading name is now baked into the URL**,
> so changing it means renaming the Railway project, service and domain, moving `PUBLIC_ORIGIN`
> with them and rebuilding `seo.json`. Ask before that gets expensive.
