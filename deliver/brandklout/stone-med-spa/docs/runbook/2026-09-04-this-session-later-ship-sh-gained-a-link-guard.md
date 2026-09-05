## Done this session (2026-09-04, later) — ship.sh gained a link guard

Investigation into whether this worktree and `bk-stone` were interfering over Railway. They were
not, at the link level: `railway link` keys `~/.railway/config.json` by EXACT directory and does not
walk up to a parent, and the `.env` files carry one instance each. But `ship.sh` took its target
from `$RAILWAY_LINK_DIR` and nothing else, and **this worktree's own directive still said
`railway link -p "Stone Surgical Arts"`** — four lines above a script that would have shipped the
med spa payload into the Surgical Arts container and run the importer there. That line was corrected
during the session; the guard is the durable half.

`ship.sh` now runs `check-link.mjs` as step 0 and refuses to ship unless the linked project and
environment actually serve `INSTATIC_BASE_URL`. Verified both ways round: correct pairings pass,
each crossed pairing is blocked before any `railway ssh`. Same file in `bk-stone`. Not committed.

Added to Gotchas below: 36, 37, 38.

## Next

1. **Send the link and collect the review.** <https://stone-med-spa-production.up.railway.app>
2. **Get the seven client answers.** They are listed in priority order in `project-overview.md`
   under "Recommended next action", with detail in `HANDOFF.md`. Nothing about the build improves
   until these land.
2. **Per-case photo consent first** — it has weeks of lead time and gates the strongest asset on
   the site. `/results` and `/botox` ship a reserved frame that degrades honestly without it.
3. **Trading name and domain next**, because they are cheap now and expensive after the client has
   reviewed eleven pages.
4. **On `bk-stone`, not here:** cut the seven med spa treatments out of the Surgical Arts
   treatments page, write the 301 map, and add the reciprocal brand switcher. Do not do this from
   this worktree — gotcha 5.
5. The other six treatment pages are a body file each once someone wants them. Botox was built as
   the template deliberately (`css/59-detail.css`, `{{VITALS:<slug>}}`).
6. **Client review of the second build.** It has not been seen by anyone yet. Open
   `final-site/index.html` locally (or serve the folder) — the pins and scrubs need a real
   browser, and the full-page screenshots in `shots/v2-*` deliberately show the reduced-motion
   state.

## Gotchas

1. **This worktree is sparse.** `git sparse-checkout list` shows what is checked out. A path outside
   it will look deleted rather than missing, and `git status` will not warn you. Adding a folder
   means editing `.git/worktrees/bk-stone-med-spa/info/sparse-checkout` and reapplying — the
   worktree has its own file, not the repo's.

2. **The Instatic tooling in `05-instatic-upload/` exists nowhere on `main`.** It was copied from
   the `bk-stone` branch, which is unmerged. It is a versioned snapshot, so corrections made in
   `bk-stone` after 2026-09-02 will not appear here. Diff before the first publish. Its own
   directive carries traps 21 to 25 from the descent that got Surgical Arts from 168 comparison
   findings to 2 — read them first.

3. **`push-site.mjs` is an atomic PUT of a whole site.** Pointed at the wrong Instatic instance it
   deletes what is there. This worktree's instance is `stone-med-spa-production.up.railway.app`;
   the Surgical Arts one is `stone-surgical-arts-production.up.railway.app` and holds twelve
   published pages the client is reviewing. `INSTATIC_BASE_URL` in this worktree's generated `.env`
   is the only thing keeping them apart, and `.env` is generated per worktree from
   `~/.webzite/.env` — never export `INSTATIC_BASE_URL` in a shell that runs both.

4. **Do not reuse Surgical Arts section shapes.** A technique may repeat between sites; a section
   shape may not. The two brands share a surgeon, an address and, right now, a service menu — the
   temptation to copy the dossier layout will be strong and it is the wrong instinct. This is the
   same rule that separates Mason Park from Mason Park Kids.

5. **Do not work two Stone pillars from one session.** The sparse checkout enforces it. The Mason
   Park pair proved why: near-identical builds whose every meaningful detail differs, and sessions
   kept crossing their facts.

6. **Cached Asana context goes stale silently.** Re-pull with
   `node deliver/brandklout/scripts/asana-context.mjs --task 1217160668112180 --out <dir>`.

7. **`asana-context.mjs` gained `stone-med-spa` and `stone-surgical-arts` slugs** in `f1560bad`, so a pillar can be pulled without its sibling. That edit is on this branch only. Cherry-pick it to `main` before another branch touches the same file.

8. **No prices.** Brandklout is a partner engagement. Never compute or record a price, rate, quote
   or cost anywhere under `deliver/brandklout/`.

9. **`web.archive.org` was blocking this IP** as of 2026-08-30. The URL list is catalogued but the
   pages themselves may need another route.

10. **There are two Asana tasks for this pillar, in two different projects.** `1217160668112180`
    ("Build New Stone Med Spa") is bare and lives in BK Activation `1213901750672059`;
    `1218112701145002` ("Core Pages - MedSpa") carries the eleven-page list and lives in
    **Success Daily Stand-Up** `1211830976769588`. `asana-context.mjs`'s `stone-med-spa` slug pulls
    only the first. Pull the second explicitly:
    `node deliver/brandklout/scripts/asana-context.mjs --task 1218112701145002 --out <dir>`.
    Neither task names a client, a brand or a domain. Do not assume the eleven-page list supersedes
    the blocker — it does not; it is a page list, not a scope decision.

11. **Repeated headless hits get you Cloudflare-blocked on `vivadayspa.com`.** Two capture passes in
    quick succession returned "Attention Required! | Cloudflare" instead of the page, silently and
    with a 200-shaped render. Space requests ~8s apart and check `document.title` before trusting a
    screenshot. `screenshots/viva/medspa-hub.png` is good (first pass); the small
    `viva-medspa` JPEG thumbnail is the block page and was excluded from the report.

12. **Do not write competitor prices into this folder.** The no-prices rule in `CLAUDE.md` is about
    the Brandklout engagement, but the safe reading is to keep dollar figures out of
    `deliver/brandklout/` entirely. The research records pricing *architecture* — published vs
    consult-only, flat-rate vs per-unit, fee-plus-credit membership — which is the useful part
    anyway.

13. **THE BUILD'S MEDIA IS NOT IN GIT AND THE BUILD LOOKS BROKEN WITHOUT IT.** `.gitignore`
    excludes `*.webp`, `*.woff2` and `*.png` repo-wide. Source, markup, styles and data are all
    tracked; `site-src/assets/` is empty on a fresh clone and every page renders with missing
    images and fallback typefaces. Restore it from the `bk-stone` worktree — the exact command is
    in `HANDOFF.md` under "The media is not in git". This is convention, not a mistake, and the
    sibling build works the same way.

14. **Never mix explicit and auto grid placement in one row.** The year grid's connecting line is
    placed explicitly (it spans a computed pair of columns). Grid positions explicit items FIRST
    and auto-placed items fill what is left — so the twelve month cells found their columns
    occupied and wrapped into implicit rows. Every treatment rendered as two stacked half-rows with
    its dots in the wrong months, and it looked plausible enough in a full-page screenshot to
    nearly pass. Only reading the computed `grid-column` of each cell showed it. Every child of
    `.cadence_row` is now placed explicitly. If you add a row, keep it that way.

15. **`minmax(0, 1fr)` on a track is not the same as `min-width: 0` on the item.** The Botox page's
    comparison table carries `min-width: 40rem`, which propagated out through `.detail_prose` and
    set the floor for the whole grid row — at 390 both tracks became 595px inside a 353px
    container. `.page-wrapper` has `overflow-x: clip`, so the page did *not* scroll sideways and
    the only symptom was two buttons hanging off the right edge, in the vitals rail, on the
    opposite side of the grid from the table that caused it. `all-pages.mjs` at 390 is what caught
    it. Both fixes are required.

16. **A quoted bash heredoc still halves backslashes** — the `[[no-mjs-via-bash-heredoc]]` trap,
    hit twice this session. `[\\s\\S]` inside a `<<'EOF'` heredoc reaches node as `[\s\S]`, which
    in a JS string literal is `[sS]`, and the regex silently matches nothing. Write any patch
    script containing a backslash with the Write tool instead. Long multi-file heredocs also get
    truncated mid-content and fail with `unexpected EOF` — one file per call, and keep each under
    roughly 6KB.

17. **`node_modules/` in this worktree is a junction to `bk-stone`'s.** `audit.mjs` is dependency-
    free but `all-pages.mjs` and `shot.mjs` need `puppeteer-core`, and this worktree has no
    `package.json` of its own. Created with
    `New-Item -ItemType Junction -Path node_modules -Target "<bk-stone>/node_modules"` (PowerShell —
    `mklink /J` chokes on the spaces in the path). It is gitignored and it is why the screenshot
    tooling runs at all. If `bk-stone` is ever removed, the junction dangles and those two scripts
    fail with `ERR_MODULE_NOT_FOUND`; recreate it against any worktree that has puppeteer-core.

18. **Inline `style` attributes fail `audit.mjs`, and correctly.** Client-First forbids them and
    the Instatic conversion does not carry them across reliably, so a value written inline is a
    value that silently vanishes at publish. The year grid needed a computed `grid-column` per row,
    which is exactly the case that tempts you to reach for one; `build-site.mjs` generates
    `css/60-cadence-plan.css` instead, before `bundle()` reads the directory. That file is
    generated — edit `PLAN` and rebuild, never the CSS.

19. **`shot.mjs` cannot show a pin, a scrub or a wipe mid-flight** — it emulates reduced motion so
    the full-page capture is honest, which also means a full-page screenshot of this site is the
    reduced-motion site. Use `probe.mjs` (viewport stops, motion on) to see what a visitor sees.

20. **The reduced-motion branch has to be explicit.** `02-base.css` zeroes every animation duration,
    but a state set by an animation with `both` fill still did not land in the headless capture:
    the year grid's dots were invisible. Every `.js [data-x]` hidden state now has a matching
    `@media (prefers-reduced-motion: reduce)` rule that forces it visible. Add one for any new
    primitive.

21. **`data-hscroll` inside a grid needs `minmax(0, 100%)` on its column** — a `max-content`
    track otherwise widens the column to the track's width and pushes the heading off-canvas.
    Found on the team filmstrip.

22. **`stacks()` scales the covered card and must not fade it.** A fade shows the covered card
    through the one above it while it is still the top of the stack. The tween is scale only.

23. **A `data-count` span must carry its number as text.** The script writes the numeral; an
    empty span is an empty stat without JS. The regex fix in this session's history filled them.

24. **Four parallel builders on one `final-site/` is fine, on one port is not.** Each build
    rewrites all eleven pages, so concurrent builds are idempotent; but three puppeteer tools on a
    fixed port were not, hence `listen(0)`.

25. **The `insta-api.mjs` fix is on this branch and on `bk-stone`, not on `main`.** `loadEnv()`
    below the `BASE` declaration meant `INSTATIC_BASE_URL` from `.env` was read a moment too late
    and every client's pipeline silently defaulted to `encorercm.com` — Dr. Nahlah's instance. The
    symptom is not "the variable was ignored", it is `login failed 404 {"message":"Application not
    found"}` from Railway's edge, which reads exactly like the new instance being down. The same
    file also gained a per-host session cache. **`bk-stone` had already fixed this on 2026-08-31
    and the fix is still unmerged**, so a third worktree cut from `main` will hit it again. Cherry-
    pick both to `main`.

26. **Instatic reads alt text from the MEDIA LIBRARY and from nowhere else.** `importHtml` throws
    the `alt` attribute away — a `base.image` node has no alt prop and it is not in
    `htmlAttributes` either — and the publisher writes `alt=""`. The first publish here had fifteen
    images on the home page and fifteen empty alts, with a clean `verify-live.mjs`. `set-alt.mjs`
    is now a required pipeline step. It also means **alt is per asset, not per usage**: eight
    photographs on this site are used twice with different words and only one can win.

27. **A comparison finding whose direction FLIPS between runs is not a publish difference.** The
    `container-large` 8px auto-margin is comparison noise from the scroll pass, it lands on a
    different page each run, and on consecutive runs the same element read 8px local / 0px live and
    then 0px local / 8px live. Trap 30 in the workflow directive has the mechanism. Do not chase it
    as a styling bug and do not suppress it either.

28. **`compare-live.mjs` keys elements by tag + sorted class list, not by a CSS selector.**
    `div.container-large#4` is the fifth element whose class list is EXACTLY `container-large`
    (with `is-*` and `js` filtered out) — which is not what `querySelectorAll('div.container-large')[4]`
    returns. Use `.tmp/probe-key.mjs`, which reproduces the keying, or you will spend an hour
    comparing two different elements and concluding they are identical.

29. **A published Instatic page's `<head>` is four tags and you cannot add a fifth.** title,
    description, favicon, `lang` — `buildDocumentMetaTags` in `src/core/publisher/render.ts` is the
    whole surface. The canonical, the eight `og:`/`twitter:` tags and the `MedicalBusiness` JSON-LD
    that `build-site.mjs` writes into `partials/head.html` are simply not there. Two of those four
    are SITE-level (description and favicon), so every page shares one description. The favicon is
    `settings.faviconUrl` on the site shell, unset here on purpose. Trap 31 in the workflow
    directive; the route to the missing tags is a runtime module that injects them, like
    `js/90-bugherd.js`.

30. **A hardcoded string in a copied workflow is a client-data leak waiting to happen.**
    `push-site.mjs` carried the Surgical Arts meta description as a literal, so the med spa
    published *"Boutique facial and cosmetic surgery… performs every case herself"* on all eleven
    pages — surgical positioning on the non-surgical site, as the line Google shows. Neither gate
    looks at `<head>`: `verify-live.mjs` checks routes and assets, `compare-live.mjs` compares
    rendered pages. **Read the published `<head>` by hand once per new instance**, and when you
    find a literal in a script that was copied from another client, derive it.

32. **`fullPage: true` is not what a visitor sees, and on this site it invents missing pictures.**
    Chrome resizes the viewport to the whole document — 8,600px on the home page — and re-renders,
    so every scroll-driven effect and every `loading="lazy"` decision happens at a size nobody has.
    Two photographs "went missing" on the published site and both are present and pixel-identical
    at a real 1440x900. A solid block in a diff where a picture should be is extremely convincing
    and was wrong twice. `visual-diff.mjs` scrolls a real viewport and stitches tiles; use
    `.tmp/viewshot.mjs` to settle any disagreement between a diff and a probe.

33. **Do not `await img.decode()` on a lazy image.** On an image the browser has not chosen to
    fetch, that promise never settles, and awaiting them all deadlocks the `page.evaluate` until
    puppeteer's CDP protocol timeout kills the run with a `ProtocolError` that names nothing useful.
    Poll `complete && naturalWidth`, bounded.

34. **`compare-live.mjs` cannot see three whole categories of element**, which is why two more gates
    exist. It skips any element with **no class at all** (`if (!cls) continue` — that is every bare
    `<img>`), it can never see a **pseudo-element** (`::before`/`::after` have no node, so they are
    not in `querySelectorAll('body *')`), and its property list has no `filter`, `backdrop-filter`,
    `mix-blend-mode`, `clip-path` or inset properties. The site's entire scrim system lives in
    `::after`. Reach for `visual-diff.mjs` and `css-parity.mjs` when a page looks wrong and
    `compare-live.mjs` says nothing.

35. **Never build a local file server path with `new URL(import.meta.url).pathname`.** This
    workspace's path contains spaces, the URL form percent-encodes them, every `fs.existsSync`
    misses, and the server 404s the page into a blank body — which then reports as "key not found"
    or "width 0px" and looks like a real difference. `fileURLToPath` is the only correct form here.

36. **`RAILWAY_PROJECT_ID` in the environment OUTRANKS the linked directory.** Standing in a
    directory linked to Stone Surgical Arts with this worktree's value exported, `railway status`
    reports *Stone Med Spa*. It is in this worktree's `.env`, so `set -a; . .env` in a shell you
    then run `ship.sh` from is enough to cross the two sites; `$RAILWAY_LINK_DIR` stops meaning
    anything at that point. `check-link.mjs` names the variable when it sees it.

37. **`RAILWAY_TOKEN` in the `.env` is STALE and overrides the CLI's own stored auth.** Any script
    that loads `.env` and then shells out to `railway` gets `Invalid RAILWAY_TOKEN` from a CLI that
    works perfectly by hand a second later. `check-link.mjs` drops the RAILWAY_* values it injected
    before spawning `railway` — anything else that shells out needs the same.

38. **This worktree's `insta-api.mjs` is the older copy: the session cache is a shared
    `.tmp/.session`, not keyed by host.** `bk-stone`'s was fixed on 2026-09-04 to
    `.session-<host>`. Nothing has crossed, because the two files live in different worktrees, but
    a cookie minted for one instance is replayed against the next one this worktree talks to. Diff
    the two before the next publish.
