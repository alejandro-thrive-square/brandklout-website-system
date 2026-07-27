# Prop Gap Report — Windows Section Components → Multi-Service Reuse

Read-only audit (2026-07-10) of the 12 `Section / Services *` components on site `6a234fcd5732d1f0a674156f` (element trees walked via `data_element_tool > get_all_elements` scoped per component; binding status confirmed with `get_settings type=all_raw_settings` — prop bindings show `sourceType: "prop"`). Cross-referenced against old-site per-service deltas (`oldsite-section-inventory.md` PART C, sections C.1–C.5) and existing prop definitions (`component-catalog.md` lines 510–735).

Scope of variance: doors / roofing / siding / gutters vs the windows defaults.

## Summary table

| # | Component | Ready to reuse? | New props needed | Structural issues |
|---|-----------|-----------------|------------------|-------------------|
| 1 | Section / Services Hero `428d3e1e-0528-4142-4d72-5db0ffd78e50` | NO | 1 required (+1 optional alt) | H2 has em-span split (binding flattens it); roofing needs an extra cert paragraph that has no element |
| 2 | Section / Services Financing `10fa3e9d-7ee1-bac6-9278-d4887de83041` | YES | 0 (+1 optional alt) | none — band is identical across all services |
| 3 | Section / Services Invite `c1076ca4-c4bb-37d9-9757-aafb94f53331` | YES | 0 (+1 optional alt) | none |
| 4 | Section / Windows Upgrades `faab8589-286a-f082-68b0-ce115c984470` | PARTIAL | 0 for 4-card pages | card count fixed at 4: doors needs 5, siding & gutters need 3 |
| 5 | Section / Services Curb Appeal `22b5c99a-19b8-2ba9-137a-34ea23e2dec2` | YES | 0 (+1 optional alt) | none |
| 6 | Section / Services Portfolio `194bffad-0293-9ee7-6d25-5e49f61fe4d2` | YES | 1 recommended (shared alt) | 9 image slots fixed; doors/roofing/gutters have only 6 photos (repeat photos or hide slots) |
| 7 | Section / Services Confidence `0c788429-e47e-1ab2-336a-84be54e3db55` | YES | 0 | static H2 "Feel Confident Working With Us" is intentionally global (identical on all old-site services); roofing "10 Year…" delta covered by Card 01 Title |
| 8 | Section / Services Pricing `0e921bec-dce9-db0d-0134-f4977505213f` | PARTIAL | 0 for 2-feature tiers | each tier has exactly 2 feature rows; roofing needs 3 per tier (needs new elements + Feature 03 props ×3) |
| 9 | Section / Services Process `c66840de-979a-23d4-75c1-c56600bbe6a1` | YES | 0 | static H2 "A Hassle Free Process" is global (identical on all services) — OK |
| 10 | Section / Services FAQ `1ca8e3f5-0737-be11-3951-28d66c9f047b` | NO | see detail | 6 fully hardcoded Q&A items (all static Strings); count varies per service (doors 2, siding 3, gutters 4, roofing 6) and one answer is 3 paragraphs — props are a poor fit |
| 11 | Section / Services Contact `4007df27-517f-5b60-29de-17f9b740389b` | YES | 0 | none — identical across services (slot holds a CTA button, not the form) |
| 12 | Section / Services Sunshine `4d9a3818-e1ce-994d-8146-142cad405747` | NO | 1 required | H2 (varies on every service) is static, with em-span split (binding flattens it) |

Totals: 7 ready as-is, 3 need new props (Hero, Portfolio-recommended, Sunshine), 4 have structural gaps that props cannot solve (Hero-roofing, Upgrades, Pricing-roofing, FAQ).

---

## 1. Section / Services Hero — `428d3e1e-0528-4142-4d72-5db0ffd78e50`

Verified bindings (sourceType "prop"): H1 `…78e5c` text → "Heading Content"; badge span `…78e59` text → "Text" (Review Badge); button labels `…78e68`/`…78e6d` → "Button Text" (Button), `…78e76`/`…78e79` → "Button Text" (Button 2); link `…78e64` link → "Button Link"; bg image `…78e52` assetId → "Image" (Visuals). The 5 trust-badge images (`…78e7d`, `…78e7f`, `…78e81`, `…78e83`, `…78e85`) map to Image 1–5 and are identical on every service page (old-site financing badges are global) — no action. Trailing HtmlEmbeds `…78e86` (style) / `…78e87` (script) are the masked-word-reveal motion kit — service-agnostic, no content words.

STATIC content that must vary per service:
- **H2 subheadline** — Heading `…78e5f` contains static String `…78e60` "Elevate The Appearance Of Your Home With " + em Block `…78e61` > String `…78e62` "New And Improved Windows". Old site: doors "Welcome Loved Ones Into Your Home With Brand New Doors", roofing "Trust our expertise for all your roof replacement…", siding "Got hail damage? We got you covered…", gutters "Install Gutters That Can Handle All Weather Conditions".

New prop (execute with create_prop + set_settings binding):

| Prop name | Type | Default (= windows content) | Bind element id | Setting key |
|---|---|---|---|---|
| Subheading Content | textContent | Elevate The Appearance Of Your Home With New And Improved Windows | component `428d3e1e-0528-4142-4d72-5db0ffd78e50`, element `428d3e1e-0528-4142-4d72-5db0ffd78e5f` | text |
| Image Alt (optional) | altText | (empty — decorative bg) | component `428d3e1e-0528-4142-4d72-5db0ffd78e50`, element `428d3e1e-0528-4142-4d72-5db0ffd78e52` | altText |

Suggested group for Subheading Content: "Heading Text" (matches existing Heading Content's group).

CANNOT be solved by props:
- Binding the H2's `text` setting replaces its mixed children, so the `win-hero__em` highlight span ("New And Improved Windows") is flattened to plain text. If the em highlight must survive per-service, restructure the H2 into lead-span + em-span (each a Block with its own text prop) before binding — structural edit, not a prop.
- **Roofing hero extra paragraph** (C.3: GAF/CertainTeed cert + hail-damage line, a 3rd heading block on the old site). No element exists for it. Options: add a hidden Paragraph + textContent prop + visibility boolean prop, or a "Roofing" component variant.

## 2. Section / Services Financing — `10fa3e9d-7ee1-bac6-9278-d4887de83041`

Eyebrow `…de83045`, heading `…de83048`, button label `…de8304f`/`…de83054`, link `…de8304b`, image `…de83059` — all render empty in the tree (prop-bound; matches catalog props Eyebrow Text / Heading Content / Button Text / Button Link / Image 1). Old site C.2–C.5: financing band is **identical on every service page**. Ready to reuse with default prop values — no per-service overrides needed.

Minor: image `…de83059` altText is STATIC "Bedroom windows" (windows-flavored on a global band). Optional cleanup prop:

| Prop name | Type | Default | Bind element id | Setting key |
|---|---|---|---|---|
| Image 1 Alt (optional) | altText | Bedroom windows | component `10fa3e9d-7ee1-bac6-9278-d4887de83041`, element `10fa3e9d-7ee1-bac6-9278-d4887de83059` | altText |

## 3. Section / Services Invite — `c1076ca4-c4bb-37d9-9757-aafb94f53331`

All content-bearing elements are prop-bound: eyebrow `…4f53335`, heading `…4f53338`, paragraph 1 `…4f5333b`, paragraph 2 `…4f5333e`, button label `…4f53345`/`…4f5334a`, link `…4f53341`, image `…4f5334f`. Old-site deltas (heading, copy, image, eyebrow per service, e.g. doors "Add Personality To Your Home") are fully covered by Eyebrow Text / Heading Content / Paragraph Text / Paragraph Text 2 / Image 1. Two-paragraph copy fits the site's existing separate-paragraph-props pattern. **Ready to reuse.**

Minor: image altText STATIC "New windows installed by Clifton Exteriors" — service-specific wording. Recommended prop:

| Prop name | Type | Default | Bind element id | Setting key |
|---|---|---|---|---|
| Image 1 Alt | altText | New windows installed by Clifton Exteriors | component `c1076ca4-c4bb-37d9-9757-aafb94f53331`, element `c1076ca4-c4bb-37d9-9757-aafb94f5334f` | altText |

## 4. Section / Windows Upgrades — `faab8589-286a-f082-68b0-ce115c984470`

Eyebrow `…5c984473`, heading `…5c984476`, and the four card H3s (`…5c98447c`, `…5c984481`, `…5c984486`, `…5c98448b`) are prop-bound (Card 01–04 Title). Card icons are HtmlEmbeds (`…5c98447b` etc.) — verified card 1: a **generic check-circle SVG** (`<circle>` + checkmark path, currentColor), not a per-upgrade illustration, so icons do NOT need to vary per service.

CANNOT be solved by props (structural count gap):
- Grid is hardcoded at **4 cards**. Old site: doors needs **5** (Low-E Argon, Internal Grids, Internal Blinds, Designer Hardware Options, Custom Sizes), roofing 4 (different titles — covered by Card 01–04 Title), siding **3**, gutters **3**.
- Fix options: (a) add a 5th card Block (clone of `…5c984488` subtree) + "Card 05 Title" (textContent) prop, and bind each card wrapper's `visibility` to boolean props ("Card 03 Visible", "Card 04 Visible", "Card 05 Visible", defaults true/true/false) so siding/gutters can hide two and doors can show five; or (b) per-service duplicate components. Option (a) keeps one shared definition.
- Card wrapper element ids for visibility binding: card 1 `…5c984479`, card 2 `…5c98447e`, card 3 `…5c984483`, card 4 `…5c984488` (setting key `visibility`, binding type boolean).

## 5. Section / Services Curb Appeal — `22b5c99a-19b8-2ba9-137a-34ea23e2dec2`

Mirror twin of Invite; all content prop-bound: eyebrow `…a23e2dec8`, heading `…a23e2decb`, paragraph 1 `…a23e2dece`, paragraph 2 `…a23e2ded1`, button `…a23e2ded8`/`…a23e2dedd` + link `…a23e2ded4`, image `…a23e2dec5`. Old-site deltas (doors "Gift Yourself Peace Of Mind", roofing "Add Character…", etc.) fully covered. **Ready to reuse.**

| Prop name | Type | Default | Bind element id | Setting key |
|---|---|---|---|---|
| Image 1 Alt (recommended) | altText | Tall windows | component `22b5c99a-19b8-2ba9-137a-34ea23e2dec2`, element `22b5c99a-19b8-2ba9-137a-34ea23e2dec5` | altText |

## 6. Section / Services Portfolio — `194bffad-0293-9ee7-6d25-5e49f61fe4d2`

Eyebrow `…9f61fe4d5`, heading `…9f61fe4d8`, button `…9f61fe4f6`/`…9f61fe4fb` + link `…9f61fe4f2` prop-bound; 9 marquee images (row 1: `…9f61fe4de`, `…9f61fe4e0`, `…9f61fe4e2`, `…9f61fe4e4`, `…9f61fe4e6`; row 2: `…9f61fe4ea`, `…9f61fe4ec`, `…9f61fe4ee`, `…9f61fe4f0`) map to Image 1–9 props. Heading variance per service is covered.

Flags:
- All 9 images carry the STATIC altText "Window installation project by Clifton Exteriors". One shared prop can fix all nine (bind the same prop to each image's `altText`):

| Prop name | Type | Default | Bind element ids (all, setting key `altText`) |
|---|---|---|---|
| Image Alt | altText | Window installation project by Clifton Exteriors | component `194bffad-0293-9ee7-6d25-5e49f61fe4d2`, elements `194bffad-0293-9ee7-6d25-5e49f61fe4de`, `194bffad-0293-9ee7-6d25-5e49f61fe4e0`, `194bffad-0293-9ee7-6d25-5e49f61fe4e2`, `194bffad-0293-9ee7-6d25-5e49f61fe4e4`, `194bffad-0293-9ee7-6d25-5e49f61fe4e6`, `194bffad-0293-9ee7-6d25-5e49f61fe4ea`, `194bffad-0293-9ee7-6d25-5e49f61fe4ec`, `194bffad-0293-9ee7-6d25-5e49f61fe4ee`, `194bffad-0293-9ee7-6d25-5e49f61fe4f0` |

- Count gap (soft): doors/roofing/gutters old-site galleries have only **6** photos (windows/siding have 9). Since this is an infinite drag-marquee, repeating 3 photos across the 9 slots is acceptable — no structural change required. If exact counts matter, item-visibility boolean props on `win-port__item` wrappers would unbalance the two marquee rows; not recommended.

## 7. Section / Services Confidence — `0c788429-e47e-1ab2-336a-84be54e3db55`

Prop-bound: eyebrow `…be54e3db5c`, sub paragraph `…be54e3db65` (Paragraph Text), card titles `…be54e3db6b`/`…be54e3db72`/`…be54e3db79` (Card 01–03 Title), card blurbs `…be54e3db6d`/`…be54e3db74`/`…be54e3db7b` (Card 01–03 Blurb). Card icons: static generic HtmlEmbeds.

STATIC but intentionally global: H2 `…be54e3db5f` = String "Feel " + em Block `…be54e3db61` ("Confident") + String " Working With Us". Old site uses this exact heading on all five service pages — **no action**.

Per-service variance fully covered: roofing's "10 Year Craftsmanship Warranty" (vs "Lifetime…") is just a Card 01 Title override. **Ready to reuse — 0 new props.**

## 8. Section / Services Pricing — `0e921bec-dce9-db0d-0134-f4977505213f`

Prop-bound (verified feature span `…75052155` → "Feature 01", group "Tier 01"): eyebrow `…75052142`, heading `…75052145`, note `…750521b1`; per card — tier name (`…75052149`, `…7505216c`, `…7505218f`), amount (`…7505214e`, `…75052171`, `…75052194`), feature rows (card 1: `…75052155`, `…7505215b`; card 2 featured: `…75052178`, `…7505217e`; card 3: `…7505219b`, `…750521a1`), CTA labels + links per card. "Starting At" labels are static — global, fine. Per-service headings/amounts/features (C.2/C.4/C.5) are covered by existing props.

CANNOT be solved by props alone (structural count gap):
- Each tier has exactly **2 feature list items**; roofing (C.3 §8) has **3 feature items per tier**. Requires cloning a `win-price__list-item` Block into each of the 3 lists (parents: `…75052150`, `…75052173`, `…75052196`), then creating "Feature 03" (textContent) props in groups Tier 01/02/03 and binding the new spans' `text`. To keep windows/doors/siding/gutters at 2 rows, also bind the third row wrappers' `visibility` to a boolean prop (e.g. "Feature 03 Visible", default false).

## 9. Section / Services Process — `c66840de-979a-23d4-75c1-c56600bbe6a1`

Prop-bound (verified): both marquee paragraphs `…600bbe6a7` and `…600bbe6a9` bind to the SAME "Text" (Marquee) prop — one override updates the whole loop; badge span `…600bbe6b0` → "Text" (Review Badge); sub paragraph `…600bbe6b9` → Paragraph Text; button `…600bbe6c0`/`…600bbe6c5` + link `…600bbe6bc` → Button Text/Link.

STATIC but global: H2 `…600bbe6b3` = "A " + em "Hassle Free" + " Process" — identical on all old-site service pages (§9 process-teaser). **Ready to reuse — 0 new props.**

## 10. Section / Services FAQ — `1ca8e3f5-0737-be11-3951-28d66c9f047b`

Prop-bound: eyebrow `…66c9f047e` (Eyebrow Text), heading `…66c9f0481` (Heading Content — covers the per-service H2 wording).

Everything else is STATIC — **6 hardcoded Q&A items**, all plain String nodes:

| Item | Q element (Block, inside `win-faq__q`) | A paragraphs (`win-faq__a-p`) | Windows content (abridged) |
|---|---|---|---|
| 1 | `…66c9f0486` | `…66c9f048c` | "How long does it take to replace windows?" / 1-3 days |
| 2 | `…66c9f0490` | `…66c9f0496` | "How much should I expect to pay…" / $800–$1k per window |
| 3 | `…66c9f049a` | `…66c9f04a0` | "What happens if you don't replace old windows?" |
| 4 | `…66c9f04a4` | `…66c9f04aa` | "How do I start the process…" |
| 5 | `…66c9f04ae` | `…66c9f04b4` | "Is it cheaper to replace all windows at once?" |
| 6 | `…66c9f04b8` | `…66c9f04be` + `…66c9f04c0` + `…66c9f04c2` (**3 paragraphs**) | "Do vinyl windows decrease home value?" |

Old-site requirement: doors **2** Q&A, siding **3**, gutters **4**, roofing **6** (all different content).

CANNOT be cleanly solved by props:
- Count variance 2–6 items AND item 6's 3-paragraph answer. Full prop-ification would need ~6 question textContent props + ~8 answer-paragraph props + 4-5 visibility boolean props on item wrappers (`…66c9f0484`, `…66c9f048e`, `…66c9f0498`, `…66c9f04a2`, `…66c9f04ac`, `…66c9f04b6`, key `visibility`) — ~19 props, and text props cannot hold multi-paragraph rich text (the site's workaround is separate paragraph props, which here multiplies further).
- Recommended instead: either (a) per-service FAQ components (`duplicate_component` → edit static strings per copy — cheap, 4 duplicates, no props), or (b) CMS-driven FAQ list. Flag for a human/next-step decision; do NOT blindly create 19 props.

## 11. Section / Services Contact — `4007df27-517f-5b60-29de-17f9b740389b`

Prop-bound: eyebrow `…f9b740389e`, heading `…f9b74038a1`, paragraph `…f9b74038a4`, CTA label `…f9b74038ab`/`…f9b74038b0` + link `…f9b74038a7`. Note: despite the catalog description "form slot", the slot contains only the cx-btn CTA ("Get Your Quote" → /contact-us) — there is no embedded form element in this component. Old-site form section is identical on all service pages. **Ready to reuse — 0 new props.**

## 12. Section / Services Sunshine — `4d9a3818-e1ce-994d-8146-142cad405747`

Prop-bound: CTA label `…2cad405754`/`…2cad405759` + link `…2cad405750` (Button Text/Link), service-areas paragraph `…2cad40575e` (Paragraph Text — same on all services).

STATIC content that must vary on EVERY service page:
- **H2** Heading `…2cad40574a` = String `…2cad40574b` "Invite The " + em Block `…2cad40574c` ("Sunshine") + String `…2cad40574e` " Into Your Home". Old site: doors "A Door That Says \"Welcome Home\"", roofing "Put A Roof You Can Trust Over Your Family", siding "A Brand New Exterior For Your Home", gutters "Small Details Make A Big Difference".

New prop:

| Prop name | Type | Default (= windows content) | Bind element id | Setting key |
|---|---|---|---|---|
| Heading Content | textContent | Invite The Sunshine Into Your Home | component `4d9a3818-e1ce-994d-8146-142cad405747`, element `4d9a3818-e1ce-994d-8146-142cad40574a` | text |

Same caveat as the Hero H2: binding flattens the `win-hero__em` highlight span. If the em accent must survive, restructure into lead/em/tail spans first (structural).

---

## Execution checklist for the next step (create_prop + bind)

Required:
1. Hero `428d3e1e-0528-4142-4d72-5db0ffd78e50`: create textContent prop "Subheading Content" (group "Heading Text", default "Elevate The Appearance Of Your Home With New And Improved Windows") → bind element `428d3e1e-0528-4142-4d72-5db0ffd78e5f` setting `text`.
2. Sunshine `4d9a3818-e1ce-994d-8146-142cad405747`: create textContent prop "Heading Content" (default "Invite The Sunshine Into Your Home") → bind element `4d9a3818-e1ce-994d-8146-142cad40574a` setting `text`.

Recommended (SEO/alt hygiene):
3. Portfolio: altText prop "Image Alt" → bind all 9 image elements listed in §6, setting `altText`.
4. Invite / Curb Appeal (/ Financing optional): altText prop "Image 1 Alt" per §3/§5/§2.

Deferred (structural — needs element edits, not just props):
5. Upgrades: 5th card + Card 05 Title + card visibility booleans (doors=5, siding/gutters=3).
6. Pricing: 3rd feature row per tier + Feature 03 props + visibility boolean (roofing only).
7. Hero: roofing cert paragraph (hidden paragraph + visibility boolean, or variant).
8. FAQ: choose per-service duplicate components or CMS — do not prop-ify 6 static Q&A items.

## Version Control

Generated by a read-only MCP audit on 2026-07-10; part of the clifton-exteriors 07-webflow-build redesign-flow artifacts. Regenerate by re-running the audit if component definitions or props change. Lightweight `.tmp/` artifact — safe to commit per SYSTEM_RULES.md section 4.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
