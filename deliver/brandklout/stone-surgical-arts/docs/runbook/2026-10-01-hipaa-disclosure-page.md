# 2026-10-01 — HIPAA Disclosure page injected on staging and production (55 pages each) — `65e6321c`

## Done

- **`/hipaa-disclosure` is live on both hosts**, 200, title `HIPAA Disclosure | Stone Surgical Arts`,
  indexable like `/privacy-policy` (no robots meta; staging is noindex at the edge as always):
  - https://staging.dfwsurgicalarts.com/hipaa-disclosure
  - https://www.dfwsurgicalarts.com/hipaa-disclosure
- Body: the HHS model Notice of Privacy Practices the agency's Webflow sites carry (source:
  stonedentalimplantcenter.com/hipaa-disclosure, which is the **same legal entity**), verbatim except
  the practice-specific parts: entity **Stone Surgical Arts PLLC** (from this site's own Privacy Policy
  and Terms), display name "Stone Surgical Arts", 72 Andorra Dr #110, Westlake, TX 76262,
  (817) 631-4619, info@stonesurgicalarts.com, Privacy Policy link `/privacy-policy`, Effective Date:
  October 1, 2026. One location, so one contact block.
- Authored as `site-src/pages/hipaa-disclosure.body.html` (journal article template + `legal_*`
  classes, same as the Privacy Policy) and pushed by the new
  `workflows/21-instatic-upload/add-hipaa-page.mjs`: one page, one `PUT /site-document`
  (incremental), one SEO-cells `PATCH`, one publish. No `push-site`, no re-import, no shell, footer,
  nav or component change.
- The page is registered in `build-site.mjs`, `seo.json`, `build-import-input.mjs`, `verify-live.mjs`
  and `compare-live.mjs`, so the next replace-mode `push-site --apply` keeps it instead of deleting it.
  `build-site.mjs` was **not run** (other agents' uncommitted source edits are in the worktree), so
  `final-site/hipaa-disclosure.html` does not exist yet; the next build creates it.

## Verified

- Before writing, on each host: `publish/status` said `draftMatchesPublished: true` (54/54). After the
  write and before the publish, no other page row's `seq|updatedAt` had moved and the draft was 55.
- **Production:** all 54 existing pages byte-identical before/after, once two publish artefacts are
  normalised (see Gotchas); `/book` also differs by `embed.js?v=12` -> `?v=13`.
- **Staging:** the raw baseline had not normalised the bundle folder, so a full before/after byte
  compare was not possible; `/privacy-policy` and `/terms-of-service` (saved before) differ only by
  the bundle folder line, and no other page row changed (row stamps).
- Self-test: the script's HTML -> node converter, run on `privacy-policy.body.html`, reproduces the
  live privacy `<article>` node-for-node on both hosts before anything is written.

## Gotchas

- **Every publish changes every page's bytes without changing content.** Instatic mints a new
  per-page folder id for runtime scripts (`/_instatic/assets/<id>/entries/site-*.js` and
  `/_instatic/assets/<id>/classic/*.js`) and bumps `/_instatic/module-js/<module>.js?v=N` on pages
  that use a plugin module. Cloudflare also re-encodes `data-cfemail` per request. Normalise all
  three before a byte compare, or every page "changes".
- `<meta name="description">` on this instance is the SITE-level one on every page; the page's
  `seoDescription` cell is stored but not rendered (no open-graph plugin here, only embed-origins).
  So the HIPAA page carries the same site description as every other page, including Privacy.
- The footer **does** have a legal-links row (`.footer_legal`: Privacy Policy, Terms of Service, SMS
  Terms). No HIPAA link was added; that is a decision for later and is a footer change on every page.
- The Terms of Service (section 04) and the Privacy Policy say the Notice of Privacy Practices is
  "available at our office and on request". They could now link to `/hipaa-disclosure`; not done.

## Next

- Decide the footer link, and whether the Terms/Privacy wording should point at the page.
- Have the practice's counsel read the notice before it is relied on (same note as the legal pages).
