# Runbook — bk-brandklout-website

The **standing** state of this project: what is true now, what comes next, and the traps.
The dated run history is one file per run under [`runbook/`](./runbook/INDEX.md). Read the index,
then only the runs you need.

## Objective

**Brandklout's own website.** Sang (CEO) built a page with ChatGPT. Phase 1 puts that page on
Instatic as supplied, to fix a compliance emergency on the current site. Phase 2 redesigns and
expands the site. Full scope and open questions: [`project-overview.md`](./project-overview.md).

## Status: PUBLISHED on the review link, waiting on Sang (2026-09-11)

- **Live at <https://brandklout-production.up.railway.app>**: Sang's page as he wrote it, one
  editable Instatic page. Admin at `/admin`, with the same login as Mason Park.
- Gates: `verify-live` and `css-parity` FAIL none. `visual-diff` 0.013% at 1440 and 0.028% at 390.
  `compare-live` shows 9 benign findings.
- **Not on any Brandklout domain.** The cutover waits for Sang's approval.
- **The page itself is not launch-ready, by its own text.** The lead form captures nothing and
  tells visitors it is a prototype. Privacy, Terms and HIPAA link to `#`. Two lines say "replace
  before production". The full list is in
  [`runbook/2026-09-11-sangs-page-published.md`](./runbook/2026-09-11-sangs-page-published.md).
- Worktree `bk-brandklout-website`. Railway project `Brandklout`
  `550ebd58-0e74-444e-96d5-2b836a2db98a`, service `742221a0-b1f1-45f1-bf42-fc7bab85adca`, env
  `production` `ebac465d-468b-4cd3-afc6-78da721e0eb0`.

## Next

1. Sang reviews the link and answers the flagged list: where the form should send leads, the real
   Privacy/Terms/HIPAA pages, the prototype lines, and the claims.
2. Apply his corrections to the source (a new handoff file, or edits on a working copy), then
   rerun the chain in `21-instatic-upload.md` → "Brandklout: the one-page run".
3. Domain cutover via `20-instatic-domain-origins`, then add the domain to `sites.json`.
4. Phase 2: redesign and expand (see the project overview).

## Gotchas

1. **The Railway token is `user.accessToken` in `~/.railway/config.json`.** `user.token` is null,
   and the `[shared]` `RAILWAY_TOKEN` answers `Not Authorized`.
2. **`ship.sh` needs `RAILWAY_LINK_DIR` linked by project ID**
   (`railway link -p 550ebd58-0e74-444e-96d5-2b836a2db98a -e production -s Brandklout`).
3. **`puppeteer-core` is not a repo dependency.** Run `npm install --no-save puppeteer-core` at the
   worktree root before the Chrome gates.
4. **`push-site.mjs --apply --force` replaces the whole site.** If anyone edits the page in the
   admin, those edits are lost on the next push. Pull their changes into the source first.
5. The toolkit's comments still describe Stone in many places. The Brandklout box and section at
   the top of `21-instatic-upload.md` are what is true here.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). IDs and public URLs only. No secrets.
