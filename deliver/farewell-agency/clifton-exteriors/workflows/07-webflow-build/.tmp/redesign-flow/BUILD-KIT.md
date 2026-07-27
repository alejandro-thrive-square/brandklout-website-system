# Clifton Redesign — Page Build Kit (shared reference for build agents)

Site ID: `6a234fcd5732d1f0a674156f`. Server: `webflow-clifton-exteriors` MCP (Data API, headless — no bridge). Load tools via ToolSearch: `select:mcp__webflow-clifton-exteriors__data_element_tool,mcp__webflow-clifton-exteriors__data_component_tool,mcp__webflow-clifton-exteriors__data_pages_tool`.

## The build pattern (proven on /doors)
Pages are placeholder Relume scaffolds. Goal: make the page's `main-wrapper` hold the correct component instances in order, with per-page content via props, then remove leftover placeholder sections.

1. `data_element_tool > get_all_elements` (depth 3) → find the page's `main-wrapper` block id and its current child sections (placeholder component instances + any pasted blocks).
2. For each target section: `data_component_tool > insert_component_instance` (parent_element_id = an anchor, creation_position before/after) to place it. **The insert RESPONSE returns the instance's live props with propId+name+value** — use those propIds (do NOT trust any pre-saved propId list; they go stale).
3. `data_component_tool > set_component_instance_prop_values` — set only props that differ from the component default (defaults = windows content; anything genuinely shared across services is left default). Match by prop NAME → value from the page's content spec. For image props: `type:"string", string_value:"<assetId>"`. For links: `type:"link", link_mode:"url", link_to:"/path"`.
4. `data_element_tool > remove_element` the placeholder/twin sections that the new instances replace.
5. Order the instances correctly (insert relative to anchors, or `move_element` if needed).

Batch aggressively (multiple actions per call). Keep responses smaller by doing 3-5 inserts per call, then their prop-sets, then removes.

## Component IDs (· 01 Sections)
Service (windows-design) set:
- Services Hero `428d3e1e-0528-4142-4d72-5db0ffd78e50` — props incl. Heading Content, Subheading Lead/Emphasis/Tail, Cert Text, Cert Visible (bool, default false → roofing=true), Image (bg), Image 1-5 (badges, global defaults OK), Button Text/Link ×2.
- Services Financing `10fa3e9d-7ee1-bac6-9278-d4887de83041` — mostly default (global band); Image 1 optional per service.
- Services Invite `c1076ca4-c4bb-37d9-9757-aafb94f53331` — Eyebrow, Heading Content, Paragraph Text, Paragraph Text 2 (ONLY 2 paras), Image 1, Button Text/Link.
- Services Upgrades `faab8589-286a-f082-68b0-ce115c984470` — Eyebrow, Heading Content, Card 01-05 Title, Card 03/04/05 Visible (bools; windows=4 so Card05 Visible default false; doors=5 set true; siding/gutters=3 set Card04+05 false).
- Services Curb Appeal `22b5c99a-19b8-2ba9-137a-34ea23e2dec2` — Eyebrow, Heading Content, Paragraph Text, Paragraph Text 2, Image 1, Button Text/Link.
- Services Portfolio `194bffad-0293-9ee7-6d25-5e49f61fe4d2` — Eyebrow, Heading Content, Image 1-9 (repeat photos to fill 9 if fewer uniques), Button Text/Link.
- Services Confidence `0c788429-e47e-1ab2-336a-84be54e3db55` — all default EXCEPT roofing Card 01 Title = "10 Year Craftsmanship Warranty".
- Services Pricing `0e921bec-dce9-db0d-0134-f4977505213f` — Heading Content, Note, per-tier Starting Amount + Feature 01/02/03, Feature 03 Visible (bool default false → roofing=true for 3-feature tiers). Tier Names default (Standard/Deluxe/Premium).
- Services Process `c66840de-979a-23d4-75c1-c56600bbe6a1` — Paragraph Text override to generic "We have crafted a process that keeps your vision for your home at the forefront of everything we do. Let’s upgrade your home together." (default is windows-specific).
- Services FAQ `1ca8e3f5-0737-be11-3951-28d66c9f047b` — Eyebrow, Heading Content props; Q&A items are STATIC in the definition. For per-service Q&A: `duplicate_component` → edit the duplicate's Q&A String nodes via set_text (find them with query_elements scoped to the duplicate), then insert the duplicate. (Windows Q&A stays in the original.)
- Services Contact `4007df27-517f-5b60-29de-17f9b740389b` — all default (identical every service).
- Services Sunshine `4d9a3818-e1ce-994d-8146-142cad405747` — Heading Lead/Emphasis/Tail (split; set per service), Paragraph Text (service areas, default OK), Button Text/Link.

New-section set (Phase B):
- Process Timeline `428c47f1-4839-ea9d-1bb7-6b16bf8aab72` (10 steps; duplicate→edit for insurance 9-step). Props: Eyebrow Text, Paragraph Text. Steps static.
- Form Panel `7d143a14-5a4e-47fa-09d6-4948c9fecb7f` (dark form shell; slot has placeholder — build native Form via element_builder). Props: Eyebrow Text, Paragraph Text.
- Financing Partners `782a1198-8621-a036-99e2-43fffdfb5e84` — Eyebrow Text, Partner Body Text.
- Media Grid `ea936c7c-79d2-044d-18a9-22d867a8899a` — Eyebrow Text.
- Thank You Hero `ddb858da-b347-5c68-bbd1-77aa50957622` — Quote Text.
- Contact Direct `07f0396d-23f3-c4bc-737d-9f59b6684d06` — Eyebrow Text.
- Badge Wall `adb130f3-cf63-a299-be0a-058232d2c113` — Eyebrow Text.

Existing globals/shared (usually already on scaffold pages; keep or reuse):
- Reviews `e6d5df1a-1e49-e8e2-5e1c-7cc2aed9daa0` (12-card wall; no props).
- Page Header `a8e3d435-...` (generic hero placeholder — REPLACE with Services Hero on service pages; on lighter pages it can be configured via its props: Headline, Subheadline, 01/02 Button Text/Link).
- Financing Banner `c1e7bad6-...`, Logo Strip `a16c4ede-...`, Trust Bar `e7c69aec-...`, Feature Split `f00ec35a-...`, Gallery `ac3b375c-...`, Pricing Cards `4d6a27c1-...`, Process Steps `6dcb9698-...`, FAQ `9cd4554f-...`, CTA Band `61069678-...` — these are the PLACEHOLDER scaffold instances to remove/replace on service pages.

## Content sources (verbatim)
- Service pages: `deliver/farewell-agency/clifton-exteriors/workflows/04-design/.tmp/final-design/page-<service>.html` (roofing, siding exist; doors done; NO gutters file — use oldsite inventory C.5 + `.tmp/redesign-flow/oldsite-section-inventory.md`).
- Prop values already worked out: `.tmp/page-roofing/component-replacements.json`, `.tmp/page-doors/component-replacements.json` (NOTE: their propId fields are STALE — use names only, resolve ids live).
- New-component pages: `.tmp/redesign-flow/phase-b-content.md` (forms, steps, financing, thank-you, media, contact verbatim).
- Old-site per-page section order: `.tmp/redesign-flow/oldsite-section-inventory.md` PART C.
- Image asset IDs: in the component-replacements.json files and `.tmp/page-<x>/asset-map.json` where present. If an asset id is unknown, leave the component's default image (do NOT invent asset ids) and note it.

## Gotchas
- Resolve prop IDs LIVE from insert response (saved ids stale).
- `create_prop`/`duplicate_component` with an existing name silently suffixes " 2" — check first.
- Image props set via `type:"string", string_value=assetId`.
- Do NOT invent asset IDs. Do NOT publish (the orchestrator publishes). Do NOT delete components (purge is orchestrator + user-gated).
- Verify each page after build: query the page, confirm no "This is your headline"/"This is a heading"/lorem remain and section order is right.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
