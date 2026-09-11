# Runbook — bk-brandklout-website

The **standing** state of this project: what is true now, what comes next, and the traps.
The dated run history is one file per run under [`runbook/`](./runbook/INDEX.md). Read the index,
then only the runs you need.

## Objective

**Brandklout's own website.** Sang (CEO) built a page with ChatGPT. Phase 1 puts that page on
Instatic as supplied, to fix a compliance emergency on the current site. Phase 2 redesigns and
expands the site. Full scope and open questions: [`project-overview.md`](./project-overview.md).

## Status: instance ready, waiting on the source HTML (2026-09-11)

- Worktree `bk-brandklout-website`, sparse, based on `main` `116efa21`.
- Railway: workspace `Brandklout` → project **`Brandklout`** `550ebd58-0e74-444e-96d5-2b836a2db98a`
  → service `Brandklout` `742221a0-b1f1-45f1-bf42-fc7bab85adca`, env `production`
  `ebac465d-468b-4cd3-afc6-78da721e0eb0`, volume `/app/storage`.
- Review host: <https://brandklout-production.up.railway.app>. Admin at `/admin`, with the same
  login as Mason Park and Stone Med Spa.
- `~/.webzite/.env` has a `[brandklout-website]` section. This worktree's `.env` is generated from it.
- **Nothing is published yet.** The source HTML has not landed.

## Next

1. Alejandro drops Sang's HTML into
   `workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
2. Read it before touching the toolkit. Count the pages, list every `<script>`, form, font,
   external image and third-party embed. Every one of those is a known way an Instatic import
   fails silently (see the traps in `21-instatic-upload.md`).
3. Adapt `21-instatic-upload`. It was copied from Stone Med Spa and expects a multi-page
   `final-site/` build with `seo.json`. One ChatGPT page needs a much thinner input step.
4. Import, publish, and run the gates (`verify-live`, `css-parity`, `visual-diff`), then send Sang
   the review link.
5. Domain cutover only after Sang approves, via `20-instatic-domain-origins`.

## Gotchas

1. **The Railway token is `user.accessToken` in `~/.railway/config.json`.** `user.token` is null
   now, and the `[shared]` `RAILWAY_TOKEN` answers `Not Authorized` to GraphQL in every header
   form (bearer, team, project). The CLI's own login is the only one that works.
2. **The toolkit is a copy, and it carries a sibling's facts.** `push-site.mjs` once shipped the
   sibling's meta description to every page (trap 31). Grep the copied scripts for `stone` and
   `med-spa` before the first `--apply`.
3. **`ship.sh` needs `RAILWAY_LINK_DIR` linked by project ID**
   (`railway link -p 550ebd58-0e74-444e-96d5-2b836a2db98a -e production`), never by name.
   `check-link.mjs` refuses a link dir that does not serve `INSTATIC_BASE_URL`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). IDs and public URLs only. No secrets.
