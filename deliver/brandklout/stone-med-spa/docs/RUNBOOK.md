# Runbook — bk-stone-med-spa

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Objective

**Stone Med Spa**, the third and last pillar of Dr. Mona Stone's practice. The other two are the
implant centre (live on Webflow) and Stone Surgical Arts (twelve pages, published to Instatic
2026-09-02, in the `bk-stone` worktree). This worktree owns the med spa and nothing else.

Start at [`docs/project-overview.md`](../deliver/brandklout/stone-med-spa/docs/project-overview.md).

## Status: PUBLISHED — eleven pages live at <https://westlaketxmedspa.com>

**2026-09-15 — staging and the sitemap.** Staging is `https://staging.westlaketxmedspa.com`
(admin `/admin`, same login as production). It is the Railway environment `staging`, seeded from
production (11/11 content-equivalent) and noindex at the edge. `/sitemap.xml` is live on the apex
and www, served by the Cloudflare Worker `westlaketxmedspa-sitemap` from
`workflows/06-cloudflare-sitemap/`. **Open:** every production page now shares one `<title>` after
an admin edit on 2026-09-12. Submit the sitemap in Search Console. There is still no canonical or
`og:url` —
[2026-09-15 run](./runbook/2026-09-15-staging-and-sitemap.md).

**2026-09-10 — domain cutover.** `westlaketxmedspa.com` (+ `www`) is connected and the admin is
`https://westlaketxmedspa.com/admin`. The old `stone-med-spa-production.up.railway.app` host was
**detached** by the cutover and 404s everywhere; everything below that names it is historical.
Users: the owner account and **Sang** (`sang@thrivesquare.com`, admin, same password as on Mason
Park). Republished the same evening: every link to Stone Surgical Arts (the footer switch, the
about button, the treatments door) now goes to `https://www.dfwsurgicalarts.com/`. The upload
scripts import `insta-api.mjs` from `deliver/process/22-instatic-api-sync/` —
[2026-09-10 run](./runbook/2026-09-10-domain-cutover-admin-origin-and-sang.md). **Still open:**
neither Stone site serves a canonical or `og:url`, so `seo.json` reaches nothing live. (The med
spa's sitemap was added 2026-09-15.)

**2026-09-04.** The brand has an Instatic instance of its own, provisioned name-first so the
generated host already carries the business name, and the second build is on it. Gates:
`verify-live` FAIL none (11 routes, 81 URLs, 166 asset references, 11/11 distinct titles) ·
**`css-parity` FAIL none** · **`visual-diff` ≤1.6% at 1440, ≤4.4% at 390**, all of it text
antialiasing and image re-encoding · `compare-live` 36 → 12 → 10 → **2**, and those are the noise
whose direction flips between runs (trap 30) · `console-live` clean on all eleven routes except
`/favicon.ico` 404 · `check-origins --all` exit 0 · local `audit` FAIL none · `all-pages` 132 clean ·
`menu-test` 9/9.

**The one visible gap is the favicon**: there is no logo or identity for this brand, so
`settings.faviconUrl` is deliberately unset and the browser tab shows a generic mark. It is one
field pointing at one uploaded asset the day a mark exists — see gotcha 29.

**This is the link to send for review**, and the admin is the same URL + `/admin`. Anyone can confirm the admin link is safe to send with
`node deliver/process/20-instatic-domain-origins/check-origins.mjs --all`.

