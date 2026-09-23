# Scenario 2 · Updates and Expansions on Live Sites

## What it covers
Changes to a website that is already live and already carries real patients and paid traffic.
Typical requests:

- New pages on the live site: an ads funnel (landing, consultation, thank-you), a contact page per
  location, a "v2" of an existing page.
- Section, copy, image and phone-number changes on existing pages.
- Site-wide code: cookie consent (Termly), the GHL consent bridge, DNI call tracking, tracker tags.
- Fixes reported by the client, Brandklout (Asana) or a reviewer (BugHerd).

**Webflow is the main platform here.** Seven Brandklout clients are live on Webflow and stay there
(owner decision, 2026-09-23): Arvada, Grand Mission, Legacy Dental, Livewell, Marvel Dental,
Stone Dental Implant Center, Oceanic Dental. The Termly registry lists more Webflow sites
(`tools/termly-ghl-consent/kit/termly-websites.json`). Instatic sites use the short Instatic path in
step 02.

## When to use it
- The site exists and is live (or has a live domain behind it).
- The request changes or adds to that site, not the whole site.

Use something else when:
- Building a new site: `scenario-0-new-site`.
- Moving an old site to a new platform: `scenario-1-migration`.
- Designing a paid-traffic combo from scratch: `scenario-3-ads-landing-pages` owns the flow and the
  design. Come back here to put it onto a live Webflow site (steps 02 and 03).

## The steps
| Step | Directive | Output |
| :--- | :--- | :--- |
| 01 | [Request intake](./01-request-intake/01-request-intake.md): Asana/BugHerd request, access, platform, baseline, scope | `change-list.md`, baseline `publish-state.txt` |
| 02 | [Build](./02-build/02-build.md): the Webflow change types, then the Instatic path | the change in the Webflow draft (or Instatic draft) |
| 03 | [QA and publish](./03-qa-and-publish/03-qa-and-publish.md): gates, staging, the live publish rules | verified staging/live, runbook run |

Per-request working folder: `deliver/brandklout/<client>/scenario-2-updates-expansions/<step>/output/<YYYY-MM-DD>-<slug>/`.

## The rules that matter most
1. **Every Webflow publish is whole-site.** It ships every pending Designer edit, including other
   people's unfinished work. Check `wf-publish.mjs state` before the first write and before any publish.
2. **The site id is the boundary.** All Brandklout clients share one MCP instance. Resolve the id
   from the client `docs/mcp-access.md`; never act on a site by name.
3. **Add, do not mutate.** New pages as drafts or duplicates; the original stays untouched until the
   new one is approved.
4. **Staging publish is the review mechanism.** A live-domain publish needs the user's explicit
   go-ahead in the conversation.
5. **Walk the Designer tree, not only the published HTML.** Unpublished foreign content hides there.

## Promoted scripts (in `deliver/process/tools/webflow-build/`)
All Node 18+, no install. Redirect output to a file (`> output/x.log 2>&1`), never pipe it. The site id
comes from `--site` or `WF_SITE_ID`.

| Script | Purpose | Usage | Origin |
| :--- | :--- | :--- | :--- |
| `wfmcp.mjs` | Webflow MCP JSON-RPC client that reuses Claude Code's stored OAuth grant | `node wfmcp.mjs list` / `call <tool> '<json>'`; `WEBFLOW_MCP_INSTANCE=webflow-oceanic-dental` | bk-grand-mission `workflows/07-webflow-build/output/wfmcp.mjs` (copies on arvada, legacy, marvel) |
| `wf.mjs` | Front end: site guard, Designer vs Data-API argument shapes, `session_id`/`agent_id`, 429 retries | `node wf.mjs <tool> '<action>' --site <id> [--page <id>] [--out f]` | bk-grand-mission `output/mcp.mjs` + bk-legacy-dental / bk-marvel-dental `output/native/wf.mjs` |
| `wf-publish.mjs` | Pending-page report, staging-only publish, guarded live publish | `state --site <id>`; `staging --site <id> --yes`; `live --site <id> --domains a,b --yes [--expect ids]` | bk-grand-mission `output/publish-staging.mjs` + the lastUpdated check from the Termly rollout and bk-oceanic-dental |
| `wf-tree-audit.mjs` | Designer-tree audit: foreign names/classes, alt text, em dashes, empty embeds, dashed phone numbers, minted classes | `--site <id> --pages <ids/slug/all> --foreign "a,b" [--foreign-prefixes lw-] [--phone digits]` | bk-stone-dental `04-design/output/build/build_v2.py verify`, bk-arvada `v2-native/extract-v1-sections.mjs`, bk-marvel-dental `08-qa/output/gate.mjs` |
| `wf-register-script.mjs` | Register and apply a site script: 2000-char cap, hosted-copy compare, 404 handling | `--site <id> --name X --version 1.0.0 --file x.min.js [--location header] [--dry]` | Consent rollout procedure (tools/termly-ghl-consent) and bk-oceanic-dental DNI runs |
| `upload-asset.mjs` | Upload one file to the asset library (MD5, S3 field order), print its hostedUrl | `--site <id> <file> [name]` | bk-legacy-dental `output/native/upload-asset.mjs` |
| `lint-css.mjs` | Gate CSS for `data_whtml_builder` (media queries, selectors, clamp, fonts) | `<file.css> --fonts "karla,noto serif"` | bk-legacy-dental `output/native/lint-css.mjs` (copies on arvada, marvel) |
| `check-ghl-form.mjs` | GHL form: save-and-exit flag and the 11 consent fields | `<formId> [...]` | bk-ifa-dentistry `workflows/21-instatic-upload/check-ghl-form.mjs` |
| `live-page-check.mjs` | Served-HTML check: status, cache, foreign names, em dashes, empty embeds, phones, forms, marker | `<url,url> [--foreign a,b] [--phone d] [--marker t]` | bk-stone-dental em-dash pass, bk-marvel-dental `gate.mjs`, bk-arvada `verify_links.mjs` |
| `site-scripts/ghl-dni-loader.template.js` | One or several GHL number pools on one page | fill `POOLS`, minify, register | bk-oceanic-dental `site-scripts/dni-loader.js` 2.0.0 |

Also used, not moved: `deliver/brandklout/scripts/asana-context.mjs` (Asana brief),
`deliver/brandklout/scripts/staging-verify.mjs` (motion pages), `tools/termly-ghl-consent/consent-kit.mjs`.

## Evidence
Built from the client runbooks and commit history of bk-arvada, bk-grand-mission, bk-legacy-dental,
bk-livewell, bk-marvel-dental, bk-stone-dental, bk-oceanic-dental, the Webflow-era runs of
bk-dr-nahlah and bk-mason-park, and `.claude/runbook/2026-09-22-termly-consent-rolled-out-to-29-sites.md`.
Each step lists its own evidence.

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
