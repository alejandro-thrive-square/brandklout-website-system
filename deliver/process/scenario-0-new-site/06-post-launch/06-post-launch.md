# Scenario 0 · 06 Post-Launch

## Purpose

Get the site indexed, keep staging out of Google, prove a real lead arrives, hand the site over, and
finish the team review.

## Inputs

- The live site and staging subdomain (step 05).

## Checklist

- [ ] sitemap.xml served and submitted
- [ ] Site in Google Search Console
- [ ] Staging noindex checked
- [ ] One real test lead from the practice
- [ ] Handoff to the client
- [ ] Entire site reviewed on BugHerd

## Steps

1. **sitemap.xml.** Build it from the live pages and serve it through a Cloudflare Worker whose route
   ends in `*` (`tools/cloudflare-launch/build-sitemap-worker.mjs` → `deploy-worker.mjs` → `verify-launch.mjs`).
   Rebuild whenever a page is added, removed or renamed. Submit it in Google Search Console.
2. **Staging stays out of Google** with the noindex header and its own site URL
   (`staging-clone/verify-staging-clean.mjs`, `check-noindex.mjs`). `robots.txt` is Cloudflare's
   managed file: leave it alone.
3. **Real lead.** Ask the practice to send one real lead through each form and confirm it arrives in
   GHL with the right tags.
4. **Handoff.** Walkthrough of editing, publishing and page settings; admin links for the client;
   support window (3 weeks) and how to request changes. Write `docs/handoff-packet.md`.
5. **Team review.** BugHerd tasks in batches of 10 pages per day until finished; close every pin.
   Decide each comment's scope first ([`BUGHERD.md`](../../../docs/BUGHERD.md)); a site-wide
   comment is fixed at the source and checked on every page, not only the pinned one.
6. **Live sweep** after the first week: `seo-head-check`, `facts-sweep`. If a later page write
   dropped SEO fields, restore them with `ops/restore-page-seo-cells.mjs`.

## Conditionals

- **If there was an old site:** watch Search Console for 404s in the first weeks and add missing
  redirects to the Worker.
- **If the form settings point elsewhere** (links to `example.com`, the wrong legal name): fix them in
  GHL, not on the site.

## Do / Don't

- Do rebuild the sitemap after any page change.
- Don't route `robots.txt` through a Worker; it replaces Cloudflare's file.
- Don't close the project with BugHerd pins open.

## Tools

- `tools/cloudflare-launch/` (sitemap Worker, verify), `tools/instatic-site/staging-clone/`, `gates/seo-head-check.mjs`, `gates/facts-sweep.mjs`,
  `ops/restore-page-seo-cells.mjs`
- `tools/cloudflare-launch/verify-launch.mjs`

## Outputs

- `docs/handoff-packet.md`
- `scenario-0-new-site/06-post-launch/output/` sitemap and sweep reports

## Evidence

Runbooks: bk-stone-med-spa 2026-09-15 staging and sitemap; bk-brandklout-website 2026-09-22 staging and
Cloudflare; bk-dr-nahlah 2026-08-25 session 13 (robots.txt through a Worker); bk-stone 2026-09-17 GHL
form settings.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
