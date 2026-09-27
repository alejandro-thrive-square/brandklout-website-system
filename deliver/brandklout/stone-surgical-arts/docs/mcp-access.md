# Stone Surgical Arts: platform access

## Scope and target

This folder owns Stone Surgical Arts only. It was split from the Dental Implant Center on
2026-09-04. The copied Webflow access note was stale and did not describe this project.

- Instatic review URL: `https://stone-surgical-arts-production.up.railway.app`.
- Railway workspace: Brandklout; project ID `b3cae5d8-5f45-4e5c-8bfb-03113bb45327`.
- Railway service: Stone Surgical Arts; environment: production (the existing review instance).
- Account: `alejandro@thrivesquare.com`, authenticated by the shared REST client.
- Credentials: generated worktree `.env`, sourced from the master described in
  [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Never print or commit values/session cookies.

## Current authorization

On 2026-09-08 the user requested the blog overview and article pages locally, their Instatic build,
and end-to-end testing to match the local version. This authorizes updating and publishing these
pages and the necessary shared navigation/styles on the existing review instance. The previous
12 routes must be preserved. The site was read successfully at shell sequence 26 before this work.

This does not authorize domain/DNS changes, contacting others, submitting real leads, changing
billing/access, deleting unrelated pages, or editing another Stone brand or Brandklout client.

## Access mechanism and checks

This workflow uses the Instatic REST API and Railway CLI, not a Webflow MCP. No new MCP registration
is needed. See [21-instatic-upload.md](../workflows/21-instatic-upload/21-instatic-upload.md).
Before each import, run `check-link.mjs` against the linked directory and confirm the host matches
the API target. Read the remote page set and retain every existing slug in the replace payload.
Run local QA, then `verify-live.mjs`, `compare-live.mjs` and `blog-test.mjs --live` after publication.

If a future task uses MCP, follow [ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md), the
[client-delivery profile](../../../../mcp-servers/profiles/client-delivery.md), and the MCP index.
Partnership Asana access remains read-only under [the partnership scope](../../docs/mcp-access.md).

## Artifact storage

Design and browser QA: `workflows/04-design/.tmp/`. Recovered content:
`workflows/01-content-intake/.tmp/`. Instatic conversion and QA: `workflows/21-instatic-upload/.tmp/`.

## Version Control

Follow [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit source and lightweight reports;
never credentials, session exports or binary/media assets.

## Infrastructure

Windows workstation for local authoring and Chrome QA. Instatic runs in the existing Railway
container. No production-domain cutover is included.
