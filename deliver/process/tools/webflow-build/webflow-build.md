# Tool · Webflow Build (live-site toolkit)

## Purpose
Scripts for changing a live Brandklout Webflow site through the Webflow MCP. They cover reading the
Designer tree, adding pages and sections natively, registering site scripts, uploading assets,
auditing, and publishing without shipping someone else's work.
The process that uses them is
[scenario 2 · updates and expansions](../../scenario-2-updates-expansions/README.md). Read that first.

Rewritten 2026-09-23 to match what the client runs actually did. The earlier version described a
full-site build pipeline (clipboard paste of converted HTML, a config-driven orchestrator, an hourly
build loop, Kernel cloud paste). None of that is how live Brandklout sites are changed today. The
section at the end lists those files and their status.

## How live Webflow sites are actually changed
- **Native elements and classes, over the MCP, from scripts.**
  - A site-scoped class layer (`camp_`, `lp_`, `axon-`) is pushed once.
  - Pages and sections are inserted as markup-only `data_whtml_builder` calls, and existing classes
    resolve by name.
  - Surgical edits use `data_element_tool` / `data_element_settings_tool`.
  - Evidence: bk-arvada v2-native (18/18 pages), bk-grand-mission d3dcfdce, bk-legacy-dental,
    bk-marvel-dental, bk-stone-dental.
- **Data API for pages, assets, scripts and publishing.** `create_page` (`duplicateOf`,
  `draft: true`), `create_asset`, registered scripts, `publish_site` with explicit `customDomains`.
- **Registered scripts for site-wide code the agent owns.** Freeform head/footer code stays the
  team's; the agent edits it only to add the Termly line and tracker tags.
- **No REST token.** The Webflow OAuth token is MCP-only (401 on api.webflow.com), so scripts speak MCP
  JSON-RPC through `wfmcp.mjs`.

## Scripts
Node 18+, no `npm install` needed. The site id comes from `--site` or `WF_SITE_ID`. Read it from the
client `docs/mcp-access.md`, never from a listing. Redirect output to a file; never pipe it (Node on
Windows dies on a libuv assertion when stdout is a pipe).

| Script | Purpose | Usage | Origin |
| :--- | :--- | :--- | :--- |
| `wfmcp.mjs` | MCP client over streamable HTTP. It reuses Claude Code's stored grant, scans the `.claude-team` / `.claude-personal` / `.claude` profiles and refreshes the token | `node wfmcp.mjs list [--full]`, `node wfmcp.mjs call <tool> '<json>'`; `WEBFLOW_MCP_INSTANCE` (default `webflow-brandklout`) | bk-grand-mission `workflows/07-webflow-build/output/wfmcp.mjs` |
| `wf.mjs` | The front end every script imports. Site guard (refuses actions naming another site), argument shapes (Designer tools: top-level `siteId`/`pageId`; Data-API tools: `site_id` in each action), `session_id`/`agent_id`, retries on 429/1101/"Too Many Requests", throws on real errors | `node wf.mjs <tool> '<action or [actions]>' --site <id> [--page <id>] [--out f]`; library `call()`, `result()` | bk-grand-mission `output/mcp.mjs` + bk-legacy-dental / bk-marvel-dental / bk-arvada `wf.mjs` |
| `wf-publish.mjs` | `state`: site record, domains, every page changed since the last publish, CLEAN/PENDING verdict. `staging`: publish to webflow.io only. `live`: refuses unknown domains and foreign pending pages | `state --site <id>`; `staging --site <id> --yes`; `live --site <id> --domains a,b --yes [--expect ids] [--ship-pending]` | bk-grand-mission `output/publish-staging.mjs`; Termly rollout; bk-oceanic-dental |
| `wf-tree-audit.mjs` | Designer-tree audit per page: other clients' names in text, altText, hrefs, component props and embed code; foreign class prefixes; `inline-section-N` and forked `name 2` classes; em dashes; placeholders; dashed phone numbers; empty HtmlEmbeds | `--site <id> --pages <ids/slug/all> --foreign "a,b" [--foreign-prefixes lw-,imp-] [--phone digits] [--no-embeds] [--out f]` | bk-stone-dental `build_v2.py verify`; bk-arvada `extract-v1-sections.mjs`; bk-marvel-dental / bk-legacy-dental `08-qa/output/gate.mjs` |
| `wf-register-script.mjs` | Register and apply a site script. Enforces the 2000-char cap, compares the hosted copy byte for byte, uses `set_site_scripts` when nothing is applied (404) and keeps the other applied scripts otherwise. Header by default | `--site <id> --name <Name> --version <x.y.z> --file <min.js> [--location header] [--dry]` | termly-ghl-consent Phase 1 procedure; bk-oceanic-dental OceanicDNI runs |
| `upload-asset.mjs` | `create_asset` (MD5), S3 POST (fields first, file last, canonical names), read back the s3 `hostedUrl` | `--site <id> <file> [name]` | bk-legacy-dental `output/native/upload-asset.mjs` |
| `lint-css.mjs` | Gate CSS for `data_whtml_builder`: exact Webflow media queries, no pseudo-elements, structural pseudo-classes, combinators, attribute or bare tag selectors, no `clamp/min/max/calc`, `0 -8px` corruption, installed fonts | `<file.css> [...] --fonts "a,b"` or `--no-fonts` | bk-legacy-dental `output/native/lint-css.mjs` (also arvada, marvel) |
| `check-ghl-form.mjs` | GHL form readiness: `enableSaveExitConfirmation` (causes "Submission in progress" with the consent bridge) and the 11 consent fields | `<formId|url> [...]` | bk-ifa-dentistry `workflows/21-instatic-upload/check-ghl-form.mjs` |
| `live-page-check.mjs` | Served-HTML first pass: status, redirect, `cf-cache-status`/age, other clients' names, em dashes, placeholders, empty `w-embed`, noindex, canonical, `tel:` and shown numbers, GHL form ids, a required marker | `<url,url> [--foreign a,b] [--phone d] [--marker text]` | bk-stone-dental em-dash pass; bk-marvel-dental `gate.mjs`; bk-arvada `verify_links.mjs` |
| `site-scripts/ghl-dni-loader.template.js` | One or several GHL number pools on a page: execute the first, add the rest as inert `text/plain` tags | copy to the client's `site-scripts/`, fill `POOLS`, minify, register | bk-oceanic-dental `site-scripts/dni-loader.js` 2.0.0 |

Tested 2026-09-23, read-only, against Arvada (`693c51e685b19f0d0c149cab`): `wf.mjs get_site`,
`wf-publish.mjs state` (17 pages pending since 2026-09-15), `wf-tree-audit.mjs`,
`wf-register-script.mjs --dry`, `check-ghl-form.mjs` and `live-page-check.mjs`. `upload-asset.mjs`
and the publish and register writes were not exercised.

## MCP facts the scripts depend on
- **Since September 2026 every tool call needs `session_id` and `agent_id`.** The first call sends
  `start`. The server answers with a `[session_id issued ...] ses_...` text block ahead of the JSON,
  and every later call sends that value. `wf.mjs` handles it. Scripts that call `wfmcp.mjs` directly
  (the old client copies) now fail with that notice as their "error".
- A reply is one JSON object per action, newline-delimited: `{label, action, result|error}`.
- `get_all_elements` returns `result[0].data` as the Body node.
  - Nodes carry `id {component, element}`, `type`, `styleNames`, `settings` (`altText`, `link`) and
    `attributes`. `String` nodes carry `textContent`.
  - HtmlEmbed `code` is not in the tree: read it with
    `get_settings { type: "all_raw_settings", element_id }` → `data.matches[]`.
  - Rich-text internals are not in the tree either. Use `query_elements`.
- `list_pages` pages at 100 (`limit`/`offset`). Each page has `lastUpdated`, `draft` and `publishedPath`.
- `publish_site` publishes the whole site. `pageId` (single-page publish) needs Enterprise.
  `customDomains: []` plus `publishToWebflowSubdomain: true` is the staging publish.
- There is no `delete_page`. Archive instead: rename, then `draft: true`.
- The pages tool now also offers branches (`create_branch`, `merge_branch`, `publish_branch`). No
  Brandklout run has used them yet.
- Rate limits: about 30 fast element queries, or `/v2/assets` 429s, and then even `get_all_elements`
  fails. Batch, and let `wf.mjs` back off.

## Using the scripts in a client worktree
Import them by path from `deliver/process/tools/webflow-build/`. Do not copy them into the client
folder: copies drift (the client `wfmcp.mjs`, `wf.mjs` and `lint-css.mjs` copies had already diverged).
Client-specific build scripts (content JSON, templates, one-off fixes) stay in
`deliver/brandklout/<client>/scenario-2-updates-expansions/<step>/output/<date>-<slug>/` and import `wf.mjs`.

## Retired paste route (removed)
The clipboard converter built the first Dr. Nahlah, Mason Park, Grand Mission and Arvada v1 pages,
and Livewell's July pages. Every one of those sites later moved to native builds or to Instatic.
Arvada v1 "passed every gate and still needed ~15 harnesses and several hundred corrections, because
nothing on the page was a Webflow class" (bk-arvada 301acb2d). No run after mid-August used it.

The converter (`html_to_webflow*.py`, `wf_tools.py`, `build_vocab.py`, tests), the pasteable-component
pipeline, `verify.mjs`, the Kernel paste spike, the build loop, the template-library plan and the
config orchestrator were removed on 2026-09-23 in the system-v2 rewrite. Read them from git history
(`git show main:deliver/process/tools/webflow-build/<file>`) if a clipboard trap ever needs explaining.

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
Never commit OAuth tokens, `.env` files or `.credentials.json`.
