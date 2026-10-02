# Scenario 6 · Webflow Sites

## What it covers
Every change to a Brandklout client site that lives on Webflow. Seven clients are live on Webflow
and stay there (owner decision, 2026-09-23): Arvada, Grand Mission, Legacy Dental, Livewell, Marvel
Dental, Stone Dental Implant Center, Oceanic Dental. The Termly registry lists more Webflow sites
(`tools/termly-ghl-consent/kit/termly-websites.json`). Typical requests:

- New pages on the live site: a location contact page, a "v2" of an existing page.
- An ads combo (landing, consultation, thank you) designed in Scenario 3, built here.
- Section, copy, image and phone-number changes on existing pages.
- Site-wide code: cookie consent (Termly), the GHL consent bridge, DNI call tracking, tracker tags.
- Fixes reported by the client, Brandklout (Asana) or a reviewer (BugHerd).

## When to use it
- The site is on Webflow.

Use something else when:
- The site is on Instatic: `scenario-2-updates-expansions`.
- Building a new site: `scenario-0-new-site` (new sites are built on Instatic).
- Designing a paid-traffic combo: `scenario-3-ads-landing-pages` owns the flow and the design.
  Come back here to build it on Webflow (step 02, section K) and publish it (step 03).

## The steps
| Step | Directive | Output |
| :--- | :--- | :--- |
| 01 | [Request intake](./01-request-intake/01-request-intake.md): Webflow site, MCP grant, publish baseline, surface audit, change list | `change-list.md`, baseline `publish-state.txt` |
| 02 | [Build](./02-build/02-build.md): the Webflow change types A to K, native elements and classes | the change in the Webflow draft |
| 03 | [QA and publish](./03-qa-and-publish/03-qa-and-publish.md): gates, staging publish, the live publish rules | verified staging/live, runbook run |

Per-request working folder: `deliver/brandklout/<client>/scenario-6-webflow-sites/<step>/output/<YYYY-MM-DD>-<slug>/`.

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
6. **Build natively.** Real Webflow elements and classes through `data_whtml_builder`; the clipboard
   paste converter is retired.

## Tools
- [`tools/webflow-build/`](../tools/webflow-build/webflow-build.md): the MCP client, publish guard,
  tree audit, script registration, asset upload, CSS lint and live-page check, with their origins.
- [`tools/termly-ghl-consent/`](../tools/termly-ghl-consent/termly-ghl-consent.md): the consent kit
  and the GHL form and DNI gates.
- [`tools/client-first-style-guide/`](../tools/client-first-style-guide/README.md) and the
  `webflow-clientfirst` and `relume` MCPs ([MCP index](../../../mcp-servers/MCP_INDEX.md)).
- `03-qa-and-publish/scripts/staging-verify.mjs`: does the page built in Webflow still move like the
  page designed locally (the motion layer does not travel with the markup).
- `deliver/scripts/asana-context.mjs`: the Asana brief.

## FigJam
The *Deliver SOP's* board has the Scenario 6 lane (section `374:1330`, x 7180), drawn on 2026-10-02
from this README's three steps. When a step changes here, update its cards on the board.

## Evidence
Built from the client runbooks and commit history of bk-arvada, bk-grand-mission, bk-legacy-dental,
bk-livewell, bk-marvel-dental, bk-stone-dental, bk-oceanic-dental, the Webflow-era runs of
bk-dr-nahlah and bk-mason-park, and `.claude/runbook/2026-09-22-termly-consent-rolled-out-to-29-sites.md`.
Split out of Scenario 2 on 2026-09-28. Each step lists its own evidence.

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
