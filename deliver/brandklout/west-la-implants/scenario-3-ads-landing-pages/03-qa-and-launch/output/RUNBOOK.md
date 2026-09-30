# scenario-3-ads-landing-pages · 03-qa-and-launch · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · first QA pass on the published pages; launch is blocked on the forms

**Done** (`b9b96a5c`), all against `https://west-la-implants-production.up.railway.app`

| Gate | Result |
| :-- | :-- |
| `21-instatic-upload/verify-live.mjs` | clean: 86 routes, 507 URLs, 1283 asset references |
| `21-instatic-upload/css-parity.mjs` | clean: every declared property published |
| `08-qa/.tmp/check-local.mjs --base` (six ad pages, plus index, all-on-4, results; 1440 and 390) | clean: runtime armed, three pins that scrub on each landing page, no overflow at 390, one h1 |
| `output/code/lp-click.mjs` (new) | clean: seven booking CTAs per landing page go to its consultation page, FAQ opens, slider follows the pointer, the prototype form reaches the right thank-you page, thank-you has no form and a `tel:` link |
| `output/code/lp-head.mjs` (new) | clean: rendered `robots` is `noindex, follow`, canonical is the page itself |
| `scripts/probe-adblock.mjs` | clean on a filtering network: 11 foreign sheets, 0 elements hit |
| `scripts/verify-combo-live.mjs` | **12 failures, all expected**: 6 "not noindex" (see gotchas), 4 "form not on the page", 2 form payloads |
| `scripts/check-conversion.mjs` | **fails**: no Google tag reaches either thank-you page |
| `scripts/verify-form.mjs`, `check-ghl-form.mjs`, `dni-proof.mjs`, `check-pool-scope.mjs` | not run: no GHL form, no pool |

Visual pass: `output/code/lp-slices.mjs` (viewport slices, local or `--base`), looked at for the
All-on-6 combo at 1440, 768 and 390 and the 3-on-6 combo at 1440 and 390, local and published.

**Next**
1. Send Brandklout `ADS-LANDING-COMMENT.md` (the client folder root) on both Asana tasks.
2. Forms in, then: `verify-form.mjs` at 1440 and 390, `check-ghl-form.mjs --combo`, `verify-combo-live.mjs`.
3. Tags in, then `check-conversion.mjs`; a pool, then `dni-proof.mjs --relay` as one visitor.
4. A human test lead on the final host. Not done, and cannot be until 2 and 3 are.
5. 1920 and 2560 by eye: the gates stop at 1440.
6. The 3-on-6 consultation and thank-you pages at 768, and Safari, were not looked at.

**Gotchas**
- `verify-combo-live.mjs` is fetch-only and looks for a robots meta in the raw HTML or a `seo-head`
  route entry. This instance has neither plugin: the meta is written at runtime by `js/80-seo.js`.
  The six "not noindex" lines are the gate's blind spot, and `lp-head.mjs` is the check that sees it.
  A raw-HTML noindex needs the SEO head plugin installed on the instance (a launch task, not done).
- The published meta description on every page of this instance is the site-level one (upload
  trap 31). The per-page descriptions are in `seo.json` and unread until the open-graph plugin is in.
- The Termly banner covers the lower half of a phone screen until it is answered, the mobile bar
  included. Slices of the published pages show it; it is the site's existing behaviour.
- There is no `/sitemap.xml` and no `/robots.txt` on this instance (both 404).
- Gate logs (`output/*.log`) and slices (`output/assets/slices/`) are gitignored; re-run to see them.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
