# Runbook — bk-stone-med-spa

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Objective

**Stone Med Spa**, the third and last pillar of Dr. Mona Stone's practice. The other two are the
implant centre (live on Webflow) and Stone Surgical Arts (twelve pages, published to Instatic
2026-09-02, in the `bk-stone` worktree). This worktree owns the med spa and nothing else.

Start at [`docs/project-overview.md`](../deliver/brandklout/stone-med-spa/docs/project-overview.md).

## Status: PUBLISHED — eleven pages live at <https://stone-med-spa-production.up.railway.app>

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

**This is the link to send for review**, and the admin is the same URL + `/admin`, same login as
Mason Park. Anyone can confirm the admin link is safe to send with
`node deliver/process/20-instatic-domain-origins/check-origins.mjs --all`.

