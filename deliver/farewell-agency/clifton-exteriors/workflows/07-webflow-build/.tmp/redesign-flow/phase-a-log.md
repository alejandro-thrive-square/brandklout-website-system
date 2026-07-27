# Phase A Execution Log — Props + Structural Gaps (2026-07-10)

All headless via Data API MCP. Windows page rendering unchanged by design: every new prop default = current windows content; every new element is visibility-bound to a boolean prop defaulting to the current windows state. **Verify on staging after next publish (focused tab!).**

## 1. Alt-text props — BOUND (originals already existed, were never bound)
| Component | Prop (id) | Bound elements |
|---|---|---|
| Services Portfolio `194bffad-…fe4d2` | Image Alt `865f384b-dc6e-ac2a-7ced-96dbba2d48a6` | all 9 marquee images (`…fe4de/e0/e2/e4/e6/ea/ec/ee/f0`), key `altText` |
| Services Invite `c1076ca4-…53331` | Image 1 Alt `f6f5b6f1-83ad-13bf-5ca6-eef240fc83e2` | `…4f5334f` |
| Services Curb Appeal `22b5c99a-…2dec2` | Image 1 Alt `e1c6b238-52a2-1719-6ad7-19975f31c7ef` | `…23e2dec5` |
| Services Financing `10fa3e9d-…83041` | Image 1 Alt `e0fb2249-72c5-a945-5988-c91adcc398c9` | `…de83059` |

Gotcha logged: `create_prop` with an existing name silently creates a suffixed duplicate ("Image Alt 2") — always check existing props first. The 4 accidental duplicates were removed.

## 2. Em-accent heading restructure (lead span + em + tail span, each prop-bound)
Pattern validated on a throwaway duplicate first (created + unregistered same-session). New spans are `BY_CUSTOM_TAG span` DOM elements; bare String nodes removed (remove_element works on String ids).

**Services Sunshine `4d9a3818-…05747`** — heading `…2cad40574a` (win-sun__h):
- Heading Lead `44f1fb4f-b133-fdae-a071-173280c8971d` → span `ea259539-1f42-2e7e-7bf3-9ceea07398b9` ("Invite The ")
- Heading Emphasis `0ebabb69-f050-180b-f8e2-b777fdbfa5f9` → em Block `…2cad40574c` ("Sunshine")
- Heading Tail `b43c7372-0773-a338-b4d5-5a0e31758998` → span `76a5f109-7739-3bc2-5eca-2e6479f5d973` (" Into Your Home")

**Services Hero `428d3e1e-…78e50`** — H2 `…78e5f` (win-hero__h2, has `data-win-split` animation hook — QA the masked word-reveal after publish):
- Subheading Lead `c18248b8-a730-6155-b8e6-68decf9cb0fb` → span `262d2f7f-aa55-78e1-0372-9876ba7dc214`
- Subheading Emphasis `d4855c90-24c8-bd31-97a8-4e42fc06dec5` → em Block `…78e61`
- Subheading Tail `00643fe1-6a3d-18fa-6db1-2ced9208b054` (default empty) → span `44d892ea-42cf-ca18-df50-cd8f3c3b93f5`

## 3. Structural additions
**Windows Upgrades `faab8589-…84470`** — card 5 + visibility bools (windows shows 4 → siding/gutters set Card 04/05 Visible=false… actually siding/gutters=3: set Card 04+05 false; doors=5: all true):
- Card 05 Title `646fcbe2-7322-e180-5ad6-7726d393c886` → new H3 `0c3beca8-296b-f42b-1b56-1fd92611d849`
- New card Block `1c0bcb37-663f-0cb2-5907-69b29fab098c` (win-upg__card, data-win-reveal; icon embed `08ef3fbd-…9219` = check-circle svg)
- Card 03 Visible `1ea933cd-70c1-592d-d264-956b200727cb` → card `…5c984483` | Card 04 Visible `876dcc99-48b0-aef0-5c6a-5be5b8fc0035` → card `…5c984488` | Card 05 Visible `12858180-0d30-1ecc-f0bb-82c09c2e21e7` (default FALSE) → new card

**Services Pricing `0e921bec-…5213f`** — 3rd feature row per tier (hidden by default; roofing sets visible + texts):
- Feature 03 (Tier 01) `7ce749d1-b512-7c66-1928-d1c3ed3c09a3` → Block `720dc1ae-c7b3-1416-e707-c4bc8bed337a` in row `86bd70c7-b3a9-9fcb-0852-206293b150b0`
- Feature 03 (Tier 02) `01400b7e-e677-c844-3f34-d881ee6e2393` → Block `f4df16a4-0e7d-53f5-21ea-300c1c937491` in row `71fddb25-5845-2c43-d907-76f69d397796`
- Feature 03 (Tier 03) `4d00538e-2ccf-0a27-4673-1193f004c0ab` → Block `e798a77d-4f06-0874-7233-cfeb5119fc63` in row `975a266a-af3b-25be-136e-162bccffeb6b`
- Feature 03 Visible `7a6c7930-7f9f-01fd-e29c-1807bd1170bf` (default FALSE) → all 3 row wrappers
- Cleanup applied: builder auto-added a stray `span` class on the 3 check wrappers — reset to `win-price__check` only.

**Services Hero** — roofing cert paragraph (hidden by default, UNSTYLED — style in Phase C when roofing is configured):
- New Paragraph `4e320669-02bd-e123-ac63-111d5396d2a0` after H2
- Cert Text `9c945ce9-a110-3dfc-a87f-05409e9bc731` (text) + Cert Visible `f2f45db2-dc49-b2e0-4400-5dbddb463e01` (default FALSE) both bound

## 4. Decisions carried to Phase C
- FAQ: per-service `duplicate_component` (NOT 19 props, NOT CMS for now) — duplicate + edit Q&A statics per service.
- Portfolio image counts (6 vs 9): repeat photos in the marquee, no structural change.
- Old `Section / FAQ`, `Section / Pricing Cards` etc. Relume shells: replaced in Phase C swaps, purge only after user confirmation.

## Pending verification
- Staging publish (needs explicit confirmation) → focused-tab QA of windows page: hero word-reveal animation (`data-win-split` now has span children), upgrades grid (4 cards visible), pricing (2 features per tier), sunshine em accent.

## Version Control
Lightweight `.tmp/` artifact per SYSTEM_RULES.md §4.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
