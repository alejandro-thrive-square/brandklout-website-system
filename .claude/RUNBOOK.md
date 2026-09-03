# Runbook — bk-stone-dental

## Objective

**Stone Dental Implant Center** — the oral & maxillofacial surgery pillar, and the only Stone brand
that is actually live. **Landing pages for ad campaigns**, not site work.

`https://stonedentalimplantcenter.com` is live on Webflow (site `6a07d5aac093f0e4521d29bc`),
43 URLs. Dr. Mona Stone, DDS, 72 Andorra Dr #110A, Westlake, TX 76262, (817) 383-8361.
The same Webflow site also serves `stonesurgicalarts.com` — see gotcha 2 and 5.

## Status: All-on-X ad campaign trio LIVE (2026-09-03)

First campaign delivered. Three pages live under `/ads-landing-pages/` (folder
`6a9976fa58138b416a8de7ea`):

| Page | Path | Page ID |
| :--- | :--- | :--- |
| Landing | `/ads-landing-pages/all-on-x` | `6a99792d6642f8d8d2c99716` |
| Consultation | `/ads-landing-pages/all-on-x-consultation` | `6a9985eb38e229b39cdcd4d2` |
| Thank You | `/ads-landing-pages/thank-you-all-on-x` | `6a9985ec10482f3af4ffd9b4` |

Everything about the build — structure, brand, class system, copy rules, build scripts, publish
recipe — is documented in
[`workflows/04-design/ALL-ON-X-CAMPAIGN.md`](../deliver/brandklout/stone-dental-implant-center/workflows/04-design/ALL-ON-X-CAMPAIGN.md).
Read it before touching these pages.

## Scope note — Stone is three brands, this worktree owns one

| Pillar | Brand | Worktree | Status |
| :--- | :--- | :--- | :--- |
| **Oral & maxillofacial surgery** | **Stone Dental Implant Center** | **here** | Live on Webflow. First ad campaign live. |
| Cosmetic facial surgery | Stone Surgical Arts | `bk-stone` | 12 pages published to Instatic 2026-09-02 |
| Non-surgical skin & aesthetics | Stone Med Spa | `bk-stone-med-spa` | Blocked on scope |

The sparse checkout hides the med spa folder. It does **not** hide Surgical Arts, because that build
lives inside *this* client folder on the `bk-stone` branch — see gotcha 2.

## Done this session (2026-09-03, second session — builds on `adca17c5`)

- Discovered the Webflow site via `list_sites` (was "unknown" in the docs): `6a07d5aac093f0e4521d29bc`.
  Registered it in both `docs/mcp-access.md` files with a two-domain caution.
- Cloned the Livewell reference trio (rendered HTML + CSS downloaded; element structure available
  via the same MCP from site `69d03fdbe999e9907724a69d` — the pages live in Brandklout's own
  workspace, which is a better source than scraping).
- Built the three pages headlessly through the Webflow MCP (`data_whtml_builder` inserts HTML+CSS
  that becomes real Webflow elements + styles). ~140 `axon-*` styles created; Client-First-style
  campaign namespace. GHL form iframe embeds added via `data_element_builder` + settings (whtml
  sanitizes iframes).
- Copy: all facts sourced from the client's own site (credentials, FAQ, pricing language, review
  counts). Enforced zero Livewell copy with a 6-gram overlap diff — found 343, rewrote to 3
  boundary artifacts (no whole sentences shared).
- Published twice (initial + copy-correction republish) — the user gave the go-ahead in-session;
  recorded in the client's `docs/mcp-access.md`. Single-page publishing is NOT available on this
  plan (`pageId` → `bad_request`); publish is always full-site to all four domains.
- QA: live screenshots of all sections (in `workflows/08-qa/.tmp/screens/`), Livewell-marker scan
  on the published HTML, title/form/image checks.

## Next

1. Campaign copy/design sign-off from the client if required; the pages are live either way.
2. Point the Google Ads campaign at `/ads-landing-pages/all-on-x` and wire the thank-you page as
   the conversion destination if GHL is not already reporting.
3. Optional: dedicated GHL form for the campaign (lead tracking), swapped into the two form cards.
4. Optional: mobile-viewport screenshots + an end-to-end form submission test.
5. The empty `untitled.md` / `untitled-2.md` at the repo root are session debris — delete when
   convenient.

## Gotchas

1. **The reference implementation for Brandklout landing pages is Grand Mission Dentistry**
   (`deliver/brandklout/grand-mission-dentistry/` on `main`, outside this sparse checkout). This
   session used the Livewell trio as the *structural* reference per the user's instruction, but
   Grand Mission's `campaign-*` class convention is the house style — `axon-*` here matches its
   spirit. Read Grand Mission before the next campaign.
2. **This client folder is contested.** `deliver/brandklout/stone-dental-implant-center/` is the
   dental folder on `main`, but on branch `bk-stone` the same folder holds the entire **Surgical
   Arts** build — twelve pages under `workflows/04-design/.tmp/surgical-arts/`. Expect a merge
   conflict on `04-design/` when `bk-stone` merges; keep both `.tmp/` sets.
3. **Do not work two Stone pillars from one session.** One surgeon, one address, three brands.
4. **The site is live paid traffic AND serves two brands.** Any publish is a FULL-SITE publish to
   `stonedentalimplantcenter.com` + `stonesurgicalarts.com` (+ `www.`). Single-page publishing
   returns `bad_request` on this plan. Add-only: never mutate existing pages or shared classes.
   Publishing needs an explicit in-conversation go-ahead (given 2026-09-03 for this campaign;
   recorded in the client's `docs/mcp-access.md`).
5. **The Webflow MCP token is MCP-only.** The `webflow-brandklout` OAuth token from
   `~/.claude-team/.credentials.json` returns 401 against `api.webflow.com`. Drive the MCP endpoint
   (`https://mcp.webflow.com/mcp`, JSON-RPC) with `workflows/07-webflow-build/.tmp/mcp-call.py`. Tool
   actions take an `actions: [{label, <action_name>: {...}}]` array; ids like `site_id` often go
   *inside* the action object — check `tools/list` inputSchema on schema mismatch.
6. **`whtml_builder` CSS rules**: Webflow breakpoints only (tiny is **479px**, not 478px), no
   `:first-of-type` (only `:hover`/`:focus`/`:active`), and a CSS error aborts the whole call —
   insert one section per call and check each result. An early failed batch here produced
   classless ghost elements; they were removed, but check the tree after any error.
7. **No prices, no invented content.** Patient-facing pricing on the pages comes from the client's
   own FAQ (`$25,000–$50,000+ per arch`, their finance partners). Never compute or record a
   Brandklout engagement price anywhere under `deliver/brandklout/`.
8. **`docs/project-overview.md` in this folder is stale** — describes all three Stone brands and
   predates the campaign. Trust this runbook and
   [`ALL-ON-X-CAMPAIGN.md`](../deliver/brandklout/stone-dental-implant-center/workflows/04-design/ALL-ON-X-CAMPAIGN.md).
