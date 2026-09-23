# 2026-09-09 — The BugHerd board key swapped, and the site republished

## What was asked

> Lets add this script to the instatic site
> `<script src="https://www.bugherd.com/sidebarv2.js?apikey=whxgp1fjoqpgvwaf6mdttg" async></script>`

## What was actually needed

**BugHerd was already installed sitewide.** It has been since 2026-09-01, as
`site-src/js/90-bugherd.js`. So this was not an install — it was a **board key swap**, from
`wss7lflvrdyxfigqiilzsq` to `whxgp1fjoqpgvwaf6mdttg`. A second copy of the sidebar is a visible
bug, and the loader guards against exactly that, so pasting the tag as given would have produced
nothing at all on the live site while looking correct in the source.

Two other reasons the literal tag would not have worked, both already documented in the header of
`90-bugherd.js` and worth restating because they will come up again:

1. **Instatic has no custom-head field, and `importHtml` strips every `<script>`** out of a page it
   imports. A tag in `partials/head.html` works in `final-site/` and then silently does not exist
   on the published site — the worst failure shape available, because the local build proves it
   works.
2. **The loader is host-gated on purpose.** It runs on `*.up.railway.app` and nowhere else, so the
   widget stops loading by itself when this moves to `stonesurgicalarts.com`. This is a medical
   practice; an unconditional third-party script on every page view hands BugHerd the IP of
   everyone researching surgery. The gate is mechanism instead of a checklist item.

## Done

One line changed in the whole build:

```diff
- var API_KEY = "wss7lflvrdyxfigqiilzsq";
+ var API_KEY = "whxgp1fjoqpgvwaf6mdttg";
```

- `node build-site.mjs` — 52 pages regenerated. `git diff --stat` on `final-site/` showed
  **only** `assets/site.js`; all 52 HTML files came out byte-identical.
- `node bugherd-test.mjs` — **104/104**. Proves the gate both ways against the real bundle: the
  tag present and requested on the Railway host, absent and never requested on
  `www.stonesurgicalarts.com`.
- `node audit.mjs` — `FAIL none`, `WARN none`. `node check-copy.mjs` — clean.
- Published: `push-site.mjs --apply --force`, then `insta-api.publish()` → `publishedPages: 52`.
- `node verify-live.mjs` — 52 routes, 183 URLs, 601 asset references, 8 retired routes gone,
  `FAIL none`.
- Live bundle confirmed carrying the new key (see Gotchas for how to check).

## Gotchas

- **The convert steps were skipped, and that was correct.** Because every HTML file was
  byte-identical, the `import-out.json` produced by the previous run's `ship.sh` was still valid.
  `push-site.mjs` reads `assets/site.js` live from `final-site/`, so a JS-only change needs
  `push-site --apply --force` and `publish()` and nothing else. Steps 1–3 (`upload-media`,
  `build-import-input`, `ship.sh`) are only needed when the markup, the CSS or the media move.
  **Check `git diff --stat` on `final-site/` before deciding this** — if any `.html` differs, run
  the whole pipeline.
- **`push-site.mjs` refusing with "52 page(s) already carry authored content" is trap 11, not a
  problem.** `--force` is required on *every* re-import. The refusal is the guard working.
- **`/assets/site.js` does not exist on the published site.** Fetching it returns 21 bytes and no
  key, which reads like the publish failed. Instatic serves the bundle from a content-hashed path,
  `/_instatic/assets/<id>/entries/site-<hash>.js`. To verify a JS change actually shipped, read the
  `<script src>` off the live HTML first:

  ```bash
  node -e "const B='https://stone-surgical-arts-production.up.railway.app';
  fetch(B+'/').then(r=>r.text()).then(async t=>{
    const s=[...t.matchAll(/<script[^>]+src=\"([^\"]+)\"/g)].map(m=>m[1]);
    for (const u of s) { const b=await fetch(B+u).then(r=>r.text());
      console.log(u, b.length, (b.match(/API_KEY\s*=\s*\"([a-z0-9]+)\"/)||[])[1]||'-') } })"
  ```

- **The key is public by design** — it ships in the page source of every BugHerd-instrumented site.
  It is not a secret and does not belong in `.env`. It *does* identify the board, so it is the one
  thing that changes when the client or the board changes.

## THE SIDEBAR STILL DOES NOT RENDER, AND IT IS NOT THIS REPOSITORY'S FAULT

The key swap is correct and published. The widget still does not appear, and no change to this
repository can make it appear. Reported by the client as "on Mason Park and Dr. Nahlah the BugHerd
extension works perfectly but here it doesn't."

**Instatic bakes a Content-Security-Policy `<meta>` into every published page:**

```
default-src 'self'; frame-src 'none'; img-src 'self' data: https:; media-src 'self' data: https:;
script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;
```

`script-src 'self'` forbids the bugherd.com script. `frame-src 'none'` forbids the sidebar's
iframe. Both halves of BugHerd are blocked, so even fixing one would not be enough.

**The evidence, in the order it settles the question.**

1. The tag IS injected, on every page, with the right key —
   `document.querySelector('script[src*="bugherd.com/sidebarv2.js"]')` returns it live. The loader
   works. So does the host gate.
2. The browser reports the request as **503**; `node` fetches the same URL **200, 19269 bytes**.
3. BugHerd is not refusing anything: 200 for the new key, the old key, no referer, a Railway
   referer and a `stonesurgicalarts.com` referer alike. Not a key problem, not a domain-allowlist
   problem.
4. Not a browser or VPN filter: the identical tag injected into `example.com` in the same browser
   loads fine. It fails *only* in this page's context.
5. `document.querySelector('meta[http-equiv="Content-Security-Policy"]')` on the live page returns
   the policy above. It is **not in our build** — `grep` finds it nowhere in `site-src/` and it is
   absent from `final-site/index.html`. It is also **not an HTTP header**. Instatic writes it into
   the published HTML.
6. Two other live Instatic sites, `westlaimplants.com` and `novismilerogers.com`, serve **no CSP at
   all**. That is the whole of the difference the client noticed — those instances are an older
   Instatic build. Nothing about Stone's markup is special.

**Where it comes from, on the container** (`railway ssh`, project
`b3cae5d8-5f45-4e5c-8bfb-03113bb45327`):

- `/app/src/core/publisher/cspPlan.ts` — the CSP as data. `createBaseCspPlan` sets
  `script-src 'self'` as soon as the page carries any script tag, and `frame-src 'none'`.
- `/app/src/core/publisher/render.ts:461` — the base plan is unioned with `moduleCspSources`.
- `/app/src/core/publisher/renderNode.ts:181` — those sources come from a **module's `render()`
  output declaring `cspSources`**. Its own comment gives the worked example: a YouTube embed lifts
  `frame-src 'none'` this way.

So the policy relaxes for exactly two things: a module that declares `cspSources`, and a **plugin
declaring `frontend.assets[]`** (with the matching `frontend.assets` permission —
`/app/src/core/plugins/manifest.ts:304,524`). A raw third-party URL inside the `site.js` code asset
is neither, and is not reachable by any setting: `getSite()` carries no CSP field, and the
container has no CSP env var.

**Do not try to fix this by post-processing the published HTML.** The next `publish()` regenerates
it.

The three real options, for a decision rather than a guess:

1. **An Instatic plugin** declaring the BugHerd script in `frontend.assets[]`. The sanctioned
   extension point, survives republish, and is the only in-platform fix. Costs writing and
   installing a plugin on the client's instance.
2. **The BugHerd browser extension** for the review round, which is what the other two projects
   appear to be using — there is no BugHerd script in the Dr. Nahlah repository at all. Zero
   platform change; needs each reviewer to install it.
3. **Ask the Instatic vendor** to expose the CSP as a site setting, or to allow BugHerd on this
   instance.

`bugherd-test.mjs` passing 104/104 does NOT contradict any of this, and that is worth
understanding: it aborts every bugherd.com request and counts *tags and attempted requests*, which
is exactly the right test for the host gate and blind to whether the script would execute. It
proved the thing it was written to prove. Nothing in the suite tests that the sidebar renders,
because until Instatic added a CSP nothing needed to.

## Next

**Decide how BugHerd gets onto this instance** — the three options above. Until then the journal's
client review pass cannot happen through BugHerd on this site.

Unchanged: `capture()` in `compare-live.mjs` still needs a `pg.close()` so `--shots` survives a
full run. BugHerd now points at the new board and still comes off by itself at handoff.

## Version Control

Tracked. Committed with the work it describes.
