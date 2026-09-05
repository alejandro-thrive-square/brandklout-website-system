## Done this session (2026-09-04) — the instance, and the site on it (`2bcc2482`, `14f21a7e`, `63fa457b`, `93e82a9f`)

- **A Railway instance of this brand's own**, provisioned by script rather than from the dashboard:
  project `Stone Med Spa` `ad4db12e-eb77-42b8-9021-4e84083fc99d`, service of the same name,
  `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, healthcheck `/health`. **Named before
  the domain was minted**, which is the whole trick — a generated domain is derived from the service
  name at creation, so `PUBLIC_ORIGIN` was right from the first boot and nothing ever answered
  `403 invalid origin`. The exact six mutations are in the workflow directive under "Provisioning
  it, in the order that matters".
- `~/.webzite/.env` `[stone-med-spa]` filled in (base URL, the Mason Park password by reference,
  the Railway project id); `node scripts/env-sync.mjs` regenerated this worktree's `.env`.
- Registered in `deliver/process/20-instatic-domain-origins/sites.json`; `--all` exits 0.
- **Eleven pages published**, `{"publishedPages":11}`, `11 written, 0 deleted`.
- **Five real defects found and fixed**, every one silent and every one behind a 200. They are
  traps 26 to 29 and 31 in the workflow directive; the short version: the token code asset was
  shipping ordinary declarations that outranked the registry (the whole site's dark band was the
  wrong charcoal), custom properties declared on classes were being dropped, **every image
  published with `alt=""`**, `&nbsp;` spacing did not survive the import, and **every page
  published the SIBLING's meta description** — "Boutique facial and cosmetic surgery… performs
  every case herself", surgical copy on the non-surgical site — because `push-site.mjs` had it
  hardcoded and the workflow was copied. It is derived from `seo.json` now.
- **The published `<head>` is four tags** — title, description, favicon, lang — and that is the
  whole of it. No canonical, no Open Graph, no JSON-LD; `partials/head.html` does not survive the
  import and Instatic has no custom-head field. Fine for a review link, not fine for a launch.
  Trap 31.
- **Two new gates, because three more defects got past all the existing ones.**
  - **`visual-diff.mjs`** subtracts the two renders, pixel for pixel, at 1440 and 390. Its first
    run said `/thank-you` was **56% different** and found the worst thing this build has shipped:
    **a multi-layer `background` loses every layer but the last**, so the dark scrim over every
    interior page header was gone and white type sat on the raw photograph. Three scrims on the
    site, all three broken. `compare-live.mjs` could not see it — `::after` is a pseudo-element, it
    has no node, and nothing on this site with `::before`/`::after` had ever been compared. Trap 32.
  - **`css-parity.mjs`** asks whether every property the build declared reached the published CSS.
    It found `html { scroll-padding-top: 7rem }` dropped outright, which means every in-page anchor
    on the published site landed **underneath the fixed navbar** — while `menu-test.mjs` passed,
    because it tests the local build. Trap 34. It is the cheapest of the live gates; run it first.
- **Two "missing photographs" were the screenshot tool, not the site** — `fullPage: true` resizes
  the viewport to the whole 8,600px document and re-runs every scroll effect at a size no visitor
  has. `visual-diff.mjs` now scrolls a real viewport and stitches tiles. Trap 33, and gotcha 32.
- **`set-alt.mjs` is new** and is a required step: Instatic reads alt text from the media library
  and from nowhere else, so it has to be PATCHed onto the assets. 23 images now carry it.
- `push-site.mjs` `harvestRoots()` generalised; its `MUST` assertion is now derived from the
  stylesheets instead of being a hand-written list of the sibling's token names.
- `insta-api.mjs` brought in line with `bk-stone`'s copy — `loadEnv()` before `BASE`, per-host
  session cache. **This fix is on `bk-stone` and on this branch and NOT on `main`** — see gotcha 25.
- Sparse checkout extended to `deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/`,
  because every script here imports `insta-api.mjs` from it.
