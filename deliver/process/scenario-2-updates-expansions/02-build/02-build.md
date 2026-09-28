# Scenario 2 · 02 Build

## Purpose
Make each change in `change-list.md` on the Instatic draft, staging first, and read every write back.
The site keeps working for its visitors the whole time. Nothing here publishes; step 03 does.

## Inputs
- `change-list.md` and the baseline `publish/status` from step 01.
- The staging and production hosts from the client `docs/project-overview.md`.
- For new pages or sections: approved copy and the approved design (Scenario 3 or a client file).
- Images as files (Drive via `node scripts/drive.mjs`, the client's shared drive).

## Checklist
- [ ] Every write goes to staging first (`INSTATIC_BASE_URL=https://<staging host>`)
- [ ] No existing page mutated unless the change list says so and the user agreed
- [ ] Every write read back (page nodes, SEO cells, slugs, embed blocks, plugin settings)
- [ ] The same change applied to production once staging is approved (step 03)

## Steps
Set up once per session: run every tool from its folder in the client's scenario copy; credentials
come from the generated worktree `.env`, which points at production. For staging, prefix each
command with `INSTATIC_BASE_URL=https://<staging host>`. Scripts that write in replace mode or patch
rows also want `STAGING_HOST=<exact hostname>`, or `--allow-production` on purpose.

1. **Copy, phone numbers, links.** Write page nodes through `tools/instatic-api-sync/insta-api.mjs`
   (`PUT /site-document`, incremental). A phone number lives in four places: page nodes,
   components, the aeo-schema settings and the open-graph store. Sweep all four.
2. **Images.** Pick them by [`deliver/docs/IMAGES.md`](../../../docs/IMAGES.md): client sources
   before stock, every photo showing what its text says, none on more than two pages. Upload before
   writing the page. A re-cut image needs a new file name: the media upload skips a basename it
   already has.
3. **New page.** Write it through site-document at its slug. Ads pages go under
   `ads-landing-pages/<slug>`.
   - A page write through `PUT /site-document` drops `seoTitle`/`seoDescription`.
   - Restoring them with `PATCH /data/rows` flattens `a/b` slugs to `a-b`, so re-save the page through
     site-document afterwards (`tools/instatic-site/ops/restore-page-seo-cells.mjs`).
4. **Styles.** Font sizes go on the Client-First type-role classes with their responsive values on
   the same class. Contextual CSS (`.section p`) beats a bare class edit, so resolve the cascade
   before changing a class.
5. **Third-party embeds and site scripts.** Use the Embed block and the Embed Origins settings, not
   raw HTML: [`tools/instatic-embeds/instatic-embeds.md`](../../tools/instatic-embeds/instatic-embeds.md).
   Site-wide tags go in `siteScripts`; read-merge-write the plugin settings, never replace them.
6. **Consent.** Termly and the GHL consent bridge: `tools/termly-ghl-consent/consent-kit.mjs instatic ...`.
7. **Domains.** Any change to a domain or `PUBLIC_ORIGIN` goes through
   [`tools/instatic-domain-origins/`](../../tools/instatic-domain-origins/instatic-domain-origins.md).

## Conditionals
- If the page already has content and you are asked to rebuild it, then build a new page on a
  temporary slug and swap slugs after approval. Clients edit and publish too, so never re-render
  over their page.
- If a write reports success, then still read it back.
- If the client wants call tracking gated behind consent, then ask first. The standing instruction
  is un-gated.
- If the site is on Webflow, then use `scenario-6-webflow-sites`.

## Do / Don't
- Do keep house copy rules:
  - no em dashes in copy we write;
  - no other client's names, prices or doctors;
  - no prices except the client's own.
- Do keep every script you ran in the workdir so the change can be replayed.
- Don't write to production before staging is approved.
- Don't restore a page version from the admin to undo a change: page versions hold only title and
  slug, and the restore empties the page. Recover from the step 01 backup.

## Tools
- `tools/instatic-api-sync/`: page and CSS writes, snapshots and the publish guard.
- `tools/instatic-site/ops/`: backup, SEO cell restore, draft render.
- `tools/instatic-embeds/`: Embed block, site scripts, CSP origins.
- `tools/instatic-domain-origins/`: domains and `PUBLIC_ORIGIN`.
- `tools/termly-ghl-consent/`: consent kit.

## Outputs
- The change, on the staging draft.
- `<workdir>/*.mjs`: the scripts that made it.

## Evidence
- `tools/instatic-api-sync/instatic-api-sync.md` (site-document writes, SEO cells, slugs).
- `tools/instatic-site/README.md` (conventions, staging guard).
- `tools/instatic-embeds/instatic-embeds.md` (Embed block, siteScripts).

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
