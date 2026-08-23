# Excellent Facets — FR Update v2 · Implementation Plan

Source: `docs/Checklist_FR_actualizaciones_ES.md` (Nathan review, July 2026).
Scope: French pages only (`/fr/...`). English pages untouched unless a query below is answered otherwise.
Status: Phase 1 reconnaissance done against the live site (read-only). Findings below are verified, not assumed.

## Volume

| Part | Checklist items | Actual element edits |
| :--- | :--- | :--- |
| Part 1 — text replacements / additions | 80 | ~112 (see duplication) |
| Part 2 — block deletions | 7 (1 on hold) | 5 confirmed, 1 already done, 1 on hold |
| Part 3 — display & layout bugs | 4 | wiring fixes, not copy |

## Page IDs (site `667ba12b8def17ce19a9419b`)

| FR page | Page ID |
| :--- | :--- |
| `/fr/home` | `669522b54bdcb9927e7a50ff` |
| `/fr/about` | `669522d7a0b78e01eb1df575` |
| `/fr/diamonds` | `66952308b7b7313dd5a3cbf5` |
| `/fr/white-melee-diamonds` | `6695231ae260364bc56e11ef` |
| `/fr/calibrated-fancy-shapes` | `6a4e50906e476eada06a4fe3` |
| `/fr/cut-to-measure-fancy-shape-diamonds` | `6853fb013142b018f3aa9be3` |
| `/fr/single-cut-diamonds` | `6695234320cd94ec11712b66` |
| `/fr/fancy-color-melee-diamonds` | `6853f8d1eda9bf0d27621337` |
| `/fr/fancy-color-certified-diamonds` | `6853fec4cd4f68b14fca3916` |
| `/fr/sustainability` | `6695237c9fbf8620fd93d583` |
| `/fr/responsible-sourcing` | `6695236eabf0415529d3304f` |
| `/fr/socially-compliant-manufacturing` | `6695235e78d6f35ce099eb44` |
| `/fr/synthetic-free` | `6695234eaa03d53c28df6f0c` |
| `/fr/contact` | `669523a34220bd1e88e4f385` |

Confirmed: no Webflow Localization. FR pages are real pages in a `/fr` folder, editable with the standard
element tools. Never use `data_localization_tool`.

## Verified findings that change the work

### 1. Desktop and mobile are separate DOM subtrees — every edit is doubled

Home's benefits section exists twice: `benefits_wrap` → `benefits_layout` → `benefit_card_01` (desktop) and
`benefits_wrap.mobile` → `benefits_layout_mobile` → `benefit_card_mobile`. Both `visibility: true`.

Measured duplication:

- **Home** — 3 of 4 items duplicated (`#1` labels, `#2` heritage, `#3` ethics). `#4` and the Part 2 deletion are single.
- **About** — 12 of the timeline entries duplicated (`#3`–`#14`).

Editing one copy leaves the old French live on the other breakpoint. Every manifest row must carry **all**
matching element IDs, and QA must check both breakpoints. This is the single largest correctness risk in the job.

Also found on About: a **desktop+desktop** duplicate of Deepak Sheth's bio. Likely the same root cause as the
Part 3 1984-popup bug — investigate together.

### 2. "100% Synthetic Free" is a component, and its text lives in props

Component `Section / Synthetic Fr`, id `48e9b8f0-13ce-91e6-c716-a04cc9a7521d`. Instances appear on Round Mêlée,
Calibrated Fancy Shapes, Single-Cut, Fancy Color Melee and others. Content is carried by props — `Synth Heading`,
`Paragraph`, `Caption`, `Flutting`, `1`–`5`, plus `Show`, `Ratio`, `Icon`.

Consequences:

- Items `100% Synthetic Free #2/#3` are **prop edits per instance** via `data_component_props_tool`, not `set_text`.
- `Synth Heading` is `"100% Synthetic Free, Zero Tolerance Technology"` with `hasOverride: false` on every instance
  — they all inherit the component default. So item `#4` (the corrected heading) is **one edit to the component
  default**, which updates every FR page at once. The component is French-specific by name; confirm the English
  pages use a separate component before touching it.
- Part 2 "remove the block from Fancy Color Melee and Certified" is a **`Show` prop change, not a deletion**.
  Fancy Color Melee's instance already reads `Show: "hide"` — verify on the published page whether this item is
  already satisfied before doing anything.

### 3. Two interpretation questions are now answered by the DOM

- **Round Mêlée #3** — the subtitle element already exists: *"Notre inventaire poli de mêlé blanc répond aux normes
  suivantes"*. The requested new text is the same line minus the word "poli". No new element needed, and
  "(bandeau)" is confirmed as a locator annotation.
- **Single-Cut #1 (AÑADIR)** — the page genuinely has no quality-standards strip. Round Mêlée and Calibrated Fancy
  Shapes both place theirs between the hero `text_card` and the Synthetic component. That is the natural insertion
  point; propose it to the client rather than asking an open question.

### 4. Part 2 duplications confirmed

- **Round Mêlée** — the page paragraph beginning `Calibrage & Constitution des Lots:` duplicates the `Flutting`
  prop value of the Synthetic component instance on the same page, verbatim. Real duplication.
- **Fancy Color Melee** — the quality paragraph appears twice: in the hero `text_card` and again in the
  `Note qualité` (`trusted_wrap`) section. Real duplication.
- These two dovetail with **Fancy Color Certified #1 (AÑADIR)**, which asks for that same quality block on FCC.
  So the net intent is: remove the extra copy on FCM, add the missing one on FCC.
- **Socially Compliant** — `généreux` located, sentence-final: *"…des pratiques de travail éthiques et des salaires
  décents généreux."* Deleting the word leaves a clean sentence. Single node, no duplicate.

### 5. Sustainability Part 3 looks like a wiring bug, not missing copy

The UN goals are a Tabs widget (`goals_cards` TabsMenu + `goals_item` TabsContent + `goals_dropdown` blocks).

- Two `Vie Terrestre` dropdowns exist with **identical body text**; one carries the `15.` prefix, one does not.
- `08. Énergie Propre & Abordable` and its full body paragraph **do exist** on the page.

So the likely cause is that a dropdown slot was overwritten with a copy of the Vie Terrestre entry, which would
produce all three reported symptoms at once (07=08, 11=12, Clean Energy "absent"). Good news: the copy is probably
not lost, so query 3 to the client may be unnecessary. Confirm by mapping tab card → dropdown pairs in order
before asking them for replacement text.

### 6. Contact rename touches a form field

- Visible label `TONALITE` and the line `Laissez un message à la tonalité :` are ordinary text nodes.
- The input itself is `inputName: "The Tone 2"`, `id: "the-tone-2"`.

Renaming `inputName` changes the submission field key and would break existing form notifications or integrations.
**Recommendation: change the visible label and the line above the form only; leave `inputName` alone** unless the
client explicitly wants the field key changed and has checked their notification templates.

## Technical approach

- Read: `data_element_tool > get_all_elements` per page, processed offline with
  `scratchpad/extract_text_nodes.py`, which flattens the tree and flags duplicated / mobile-variant subtrees.
- Write text: `data_element_tool > set_text` on the **parent** text element (Paragraph/Heading), not the String node.
- Write component content: `data_component_props_tool`.
- Remove blocks: prefer a `Show` prop change over `remove_element` wherever the component supports it.
- All headless via the Data API. The Designer bridge app is not needed and should not be used.

**Staging risk worth a decision:** Data API edits land on the site's shared canvas immediately. If the client
publishes for any unrelated reason mid-job, partial work goes live. The site reports `canBranch: true`, so we can
work on a page branch and merge when approved. Recommend branching; it costs a merge step and removes the risk.

## Phases

0. **Access** — done, `webflow-excellent-facets` authenticated.
1. **Map** — dump all 14 FR pages, build `fr-update-v2-manifest.json`: one row per checklist item →
   `{page_id, element_ids[], current_text, new_text, action, breakpoint}`. Every item must resolve; unmatched items
   are parked and reported, never guessed. *(Home, About, Our Diamonds, Round Mêlée, Calibrated Fancy Shapes,
   Single-Cut and Fancy Color Melee dumped. Cut-To-Measure returned a 502 — retry. Remaining: Fancy Color Certified,
   Sustainability, Responsible Sourcing, Socially Compliant, Synthetic Free, Contact.)*
2. **Apply Part 1 + Part 2** — page by page, in checklist order, both breakpoints. Text pasted byte-exact.
3. **Fix Part 3** — the About 1984 popup and the Sustainability tab wiring; check the same bugs on the EN pages,
   since both probably originate in the v1 build.
4. **QA** — scripted diff of every changed node against the checklist (accents, punctuation, spacing), plus a
   visual pass at desktop **and** mobile on a focused tab.
5. **Publish** — explicit client approval required.

## Cascade warning — Our Story #24 → #26

Not independent edits; content shifts up one slot. `#24` deletes the iTraceiT paragraph, `#25` replaces the
India-audits paragraph **with** the iTraceiT text, `#26` replaces the RJC paragraph **with** the India-audits + RJC
text. Three paragraphs become two. Execute strictly in order; do not "correct" the apparent mismatch.

Cut-To-Measure `#5` follows the same pattern — the RJC sentence is already removed inside the replacement text, so
the Part 2 deletion is satisfied by the replacement, not by a second edit.

## Remaining interpretation calls

- `Étiquettes :` (Home #1) and `Slogan :` (Our Story #15) are locators, not content. Home #1 is three separate
  label elements, ×2 for mobile = 6 edits.
- `¶` in Fancy Color Certified #1 is a paragraph break between the `Notre qualité` heading and the body.
- Bullet items (`•`) keep existing list markup; only label text changes.

## Client queries

1. **Typos in the supplied French.** Instruction is to paste exactly, so we will — but ~20 items contain apparent
   unintended errors (`..`, double spaces, `Excellent facets` lowercase, `révèler`, `Thailande`, missing final
   periods, capitals mid-sentence after a colon). Delivered separately as `.tmp/fr-typo-queries.md`. Nothing is
   silently corrected.
2. **Contact field rename** — visible label only, or the form field key too? See finding 6.
3. **Sustainability Gender Equality (05) deletion** — still unmarked; checklist already parks it.
4. **English pages** — Nathan marked the TONE label on both EN and FR. Confirm FR-only.
5. *(Possibly moot)* Sustainability UN goal copy — only needed if finding 5 turns out to be real data loss.

## Risks

- **Breakpoint duplication** (finding 1) — the main correctness risk; mitigated by manifest + dual-breakpoint QA.
- **Component defaults propagate** (finding 2) — verify the EN pages use a separate Synthetic component before
  editing the shared default.
- **Shared canvas** — see staging risk above.
- **Page-scoped matching** — some source strings appear on multiple pages (the iTraceiT / mine-of-origin sentence
  is on both Round Mêlée #5 and Calibrated Fancy Shapes #3). The manifest must be page-scoped.

## Artifacts

| Path | Contents |
| :--- | :--- |
| `15-improvement-intake-audit/.tmp/fr-update-v2-plan.md` | this file |
| `15-improvement-intake-audit/.tmp/fr-update-v2-manifest.json` | resolved change manifest (Phase 1) |
| `15-improvement-intake-audit/.tmp/fr-typo-queries.md` | typo/query list for the client |
| `15-improvement-intake-audit/.tmp/client-docs/` | the client checklist belongs here per intake rules |
| `07-webflow-build/.tmp/fr-update-v2/` | applied-change log per page |
| `08-qa/.tmp/fr-update-v2/` | diff + visual QA results |

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
Branch: `deliver/excellent-facets-fr-update-v2`. No secrets, tokens, or binary assets.
