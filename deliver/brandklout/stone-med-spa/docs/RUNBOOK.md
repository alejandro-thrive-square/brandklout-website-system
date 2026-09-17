# Runbook — bk-stone-med-spa

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Objective

**Stone Med Spa**, the third and last pillar of Dr. Mona Stone's practice. The other two are the
implant centre (live on Webflow) and Stone Surgical Arts (twelve pages, published to Instatic
2026-09-02, in the `bk-stone` worktree). This worktree owns the med spa and nothing else.

Start at [`docs/project-overview.md`](../deliver/brandklout/stone-med-spa/docs/project-overview.md).

## Status: PUBLISHED — thirteen pages live at <https://westlaketxmedspa.com>

**2026-09-17, latest — the drag rails' arrows never worked, and now do.** A client report ("the
sliders buttons don't work") found that no arrow on the home reviews, /about's rooms or /results'
reviews had ever been bound: `data-drag-scope` sat on the section head, which is a *sibling* of the
rail, so the `closest()` lookup in `20-motion.js` found nothing. Fixed in the JS and the markup,
with a new click gate `site-src/drag-test.mjs` (3/3). Production is seq 12 and staging seq 6,
both `{"publishedPages":13}` and `verify-live` FAIL none. **Every existing gate had been green on
this for two weeks — none of them clicks anything** —
[run](./runbook/2026-09-17-drag-rail-arrows-never-bound.md).

**2026-09-17 — EVERYTHING WENT TO PRODUCTION.** Production was eleven pages behind and
the push is a whole-site replace, so the client's Asana feedback, the teammate's web dev brief pass
and the two new legal pages all went live together: 13 pages, seq 11, `{"publishedPages":13}`.
Gates: `verify-live` FAIL none (13 routes, **13/13 distinct titles** — the duplicate `<title>` from
the 2026-09-12 admin edit is gone), `css-parity` FAIL none, `compare-live` 4 trap-30 findings.
The sitemap was rebuilt and redeployed (12 URLs) and the Cloudflare token revoked. **Open:** the
legal pages still need the client's review, the legal entity name and a contact email; the Cherry
link, the "Dr. Stone injects" contradiction and the wallet question are now live unresolved; submit
the sitemap in Search Console —
[run](./runbook/2026-09-17-production-push.md).

**2026-09-17 — Privacy Policy and Terms of Service, built and first published to staging.** `/privacy-policy`
and `/terms-of-service` are adapted from the implant centre's pages, without its SMS program and
without its PLLC. The footer's legal links now point to them, and the SMS Terms link is gone.
Staging has 13 pages. **Open:** the client or their counsel reviews both pages, and supplies the
legal entity name and a contact email. Then production, and add both slugs to the sitemap —
[run](./runbook/2026-09-17-legal-pages-on-staging.md).

**2026-09-15, later — the teammate's web dev brief is on STAGING too.** The phone is back to
**(817) 383-8361**, a tracking number (so the "918-3666" below is superseded). The menu order is
Injectables, Skin Rejuvenation, Facials, Restoration, with Sculptra under Biostimulators, and
skin boosters are HydraFacial add-ons. "Same building" and the three-names stack are gone from
/about. The membership discloses its signed agreement. Two real Google reviews replaced the
placeholders. **Held for the client:** the brief's "Dr. Stone injects" rules, which contradict the
Asana pass. Also open: how the wallet works, reviewer names, suite #110 or #110b —
[run](./runbook/2026-09-15-web-dev-brief-on-staging.md).

**2026-09-15, later — the client's feedback is on STAGING, not production.** Asana task
`1218408530306236` (ten subtasks) is applied to every page and published to
`https://staging.westlaketxmedspa.com`. The practice is now **Westlake Medical Aesthetics**. The
menu has 12 treatments in 4 categories, and the team is two people (Brooke NP injector, Abby
esthetician). There is one $149/month membership with a 90-day commitment and 30 days' notice.
Cherry is the primary lender, CareCredit sits alongside it, and the phone is (817) 918-3666.
**Dr. Stone does not assess or inject here**, and the copy says so. **Open:** the practice's own
Cherry apply link (the button goes to Cherry's generic site), then the client's review on staging,
then the same push to production —
[run](./runbook/2026-09-15-client-feedback-on-staging.md). Staging had no fonts until this run
(upload directive trap 35).

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

