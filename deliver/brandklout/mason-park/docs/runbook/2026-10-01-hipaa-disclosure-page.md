# 2026-10-01 — The HIPAA Disclosure page, injected on both instances

Task: add ONE page, `/hipaa-disclosure`, matching what the agency's Webflow sites carry
(stonedentalimplantcenter.com and grandmissiondentistry.com `/hipaa-disclosure`): the HHS model
Notice of Privacy Practices, verbatim, with only the practice details swapped. An injection, not a
sweep: no push chain, no other page, footer, nav, component or stylesheet touched, no footer link.

## Done

Commit `33633efa` on `bk-mason-park` (not pushed, not merged).

**Live, 200, on both instances:**
- Staging: https://staging.masonparkdental.com/hipaa-disclosure (row `PRjjYrRlycWsqeDsWpYjM`, seq 147 → 149,
  published 2026-10-01T13:29:11Z, 65 draft / 65 published).
- Production: https://www.masonparkdental.com/hipaa-disclosure (row `8EA1VzcnIdNSoanwaC60N`, seq 73 → 74,
  published 2026-10-01T13:31:15Z, 95 draft / 95 published).

**What the page is:**
- A clone of the live `/privacy-policy` row (same topbar, nav, compact arrival, breadcrumb, invitation,
  footer, call bar, all classes as that page has them, fresh node ids), with "The Short Version" dropped and
  the policy accordion replaced by the notice as one flat `.lf-body.text-rich-text` block (lists `.lf-ticks`,
  like the policy's). Arrival "HIPAA *Disclosure*", button "Read the notice" → `#notice`; invitation lede and
  effective date retexted.
- Title `HIPAA Disclosure | Mason Park Dental of Katy`; description through the open-graph override (and
  `seoDescription`); production canonical `https://www.masonparkdental.com/hipaa-disclosure`, no noindex
  (indexable like `/privacy-policy`). Staging has the site-wide `X-Robots-Tag: noindex`, as every staging page.
- **Entity: Mason Park Dental PLLC** (d/b/a Mason Park Dental of Katy), as this site's own Privacy Policy and
  Terms state it. Contact block: 21830 Kingsland Blvd #104A, Katy, TX 77450; (281) 769-8878;
  office@masonparkdental.com; www.masonparkdental.com. Privacy Policy link → `/privacy-policy`.
  **Effective Date: October 1, 2026** in the notice (the brief's format); the page furniture uses the site's
  "1 October 2026".
- **One location.** This site has one address and one privacy page. Mason Park Dental for Kids is a separate
  site with its own policy and is not in this notice.

**Besides the row, two writes:** the new row id was appended to `src/scripts/mason-park.js`'s runtime scope
(an explicit `pageIds` list, so a new page otherwise gets no GSAP, `journey.js` or menu toggle), and one
open-graph override (description). No style rule, code file content, component or other row changed.

**Tooling** (`workflows/09-static-rebuild/.tmp/hipaa/`):
- `notice.mjs`: the reference (`hhs-notice-reference-stone.html`), the swaps (each asserted to match once;
  fails if any Stone detail survives), and the HTML → Instatic node converter for that subset.
- `build-hipaa-page.mjs`: writes the local twin `home/hipaa-disclosure/index.html` from the privacy page, so a
  later `import-pages --overwrite` chain carries the page. `check.mjs`: 0 errors.
- `add-hipaa-page.mjs`: the live injection (dry run / `--apply` / `--publish`). Refuses if draft != published
  before it writes, or if any other row's seq moved before publishing.
- `hash-pages.mjs`: before/after hashes of 12 key pages. `og/page-descriptions.json` has the description.
- Read-only probes added in `.tmp/`: `probe-publish-state.mjs`, `probe-page-tree.mjs`, `probe-shell-scope.mjs`.

## Verified

- Both instances were draft == published before the write (no one else's drafts); no other row moved; one
  publish each.
- **Every other page byte-identical:** production, 12 key pages (`/`, privacy, terms, contacts, about,
  reviews, invisalign, services, blog, sitemap, cookie-policy, an ad page) identical after normalising
  per-publish tokens. Staging: `/contacts` raw HTML identical pre/post; all 12 the same length; the script
  bundle's bytes identical across builds.
- Rendered live in Chrome (playwright) at 1440 and 390: H1 "HIPAA Disclosure", no horizontal overflow, GSAP
  loaded, 9 h2s and 59 list items in the notice, the notice in the privacy page's 68ch column.
  Screenshots were not committed.
- Backups: `.tmp/backup-staging.masonparkdental.com-2026-10-01T13-28-44.json`,
  `.tmp/backup-www.masonparkdental.com-2026-10-01T13-30-45.json`.

## Open (for a decision, not done)

- **Footer:** the footer *has* a legal row (`.footer_legal`: "© 2026 Mason Park Dental of Katy · Privacy
  Policy · Terms of Service · FAQs · Sitemap · Contact"). No HIPAA link was added. Nothing links to the page yet.
- **The number pool rewrites the notice's phone number** on production: the contact block reads a pool number
  such as (281) 215-8819, not (281) 769-8878 (the pool swaps numbers inside sentences site-wide; the Privacy
  Policy's contact section has the same "Phone: (281) 769-8878" pattern, not checked). For a legal notice the office number may be wanted; that needs a pool
  exclusion, which is a site-wide setting.
- The Privacy Policy's "What this policy does not cover" ledger and its opening still say the Notice of
  Privacy Practices is "available at our office and upon request"; they could now link `/hipaa-disclosure`.
- Neither instance serves `/sitemap.xml` (404), so there was no sitemap to add the page to. The `/sitemap/`
  page lists legal pages and does not include this one (other page, not touched).
- The entity in the notice is the one this site states; nobody at the practice has confirmed it for HIPAA.

## Gotchas

- **Instatic page HTML is not byte-stable across a publish, even for untouched pages.** Every publish mints a
  new asset build id (`/_instatic/assets/<id>/`) and bumps the plugin module-js `?v=` counter (pages with an
  Embed: `/`, `/patient-reviews`); Cloudflare re-keys the email-obfuscation hex on every request. Normalise all
  three before hashing (`hash-pages.mjs`), and record the baseline with the same normaliser you compare with.
- `mason-park.js` is scoped to an explicit page list. **Any new row must be added to it**, or the page silently
  ships with no JavaScript. `import-scripts.mjs` re-scopes to every row; `add-hipaa-page.mjs` appends one.
- `shot.mjs` on a `file://` page timed out at `load` (external fonts/map); the live page was shot instead.
- The Webflow reference has a non-breaking space after "Effective Date:"; a plain-space match misses it.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
