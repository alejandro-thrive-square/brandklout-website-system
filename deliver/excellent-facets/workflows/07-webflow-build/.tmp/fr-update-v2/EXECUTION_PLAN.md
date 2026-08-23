# FR Update v2 — Execution Plan (self-contained)

Read this file first. It is written so a fresh session can execute without repeating Phase 1 reconnaissance.

- **Change list (source of truth for all text):** `deliver/excellent-facets/docs/Checklist_FR_actualizaciones_ES.md`
- **Audit / rationale:** `../../15-improvement-intake-audit/.tmp/fr-update-v2-plan.md`
- **Resolved element IDs so far:** `resolved-elements.json` (this folder)
- **Client query list:** `../../15-improvement-intake-audit/.tmp/fr-typo-queries.md`
- **MCP rules:** `deliver/excellent-facets/docs/mcp-access.md`

Site ID: `667ba12b8def17ce19a9419b` · MCP server: `webflow-excellent-facets`

---

## Hard rules

1. **Do not publish.** Publishing needs explicit client approval (`mcp-access.md`). Draft edits only.
2. **Paste text byte-exact** from the checklist's `NUEVO TEXTO (francés)` blocks — every accent, space and
   punctuation mark, including the ones that look like typos. Do not silently correct anything. Corrections are
   queued in `fr-typo-queries.md` for the client.
3. **French pages only** (`/fr/...`). Do not touch English pages.
4. **The site does NOT use Webflow Localization.** Never use `data_localization_tool`. FR pages are ordinary
   pages in a `/fr` folder.
5. **Every edit may need doing twice** — see Trap 1.
6. Use Data API tools only. Do **not** open the Designer bridge (`designer_tool`); it is slow and unnecessary.
7. One page per commit, atomic, so any page can be reverted alone.

---

## Traps found during reconnaissance — read before editing

### Trap 1 · Desktop and mobile are separate DOM subtrees

Home's benefits section exists twice and both copies are visible:

- desktop: `benefits_wrap` → `benefits_layout` → `benefit_card_01`
- mobile: `benefits_wrap.mobile` → `benefits_layout_mobile` → `benefit_card_mobile`

Measured: **Home items #1, #2, #3 are duplicated. About items #3–#14 are duplicated.** Item #4 on Home and the
Home Part 2 deletion are single. Editing one copy leaves stale French live on the other breakpoint.

Before editing any page, dump it and check for duplicates:

```
python <scratchpad>/extract_text_nodes.py <dump.txt> <slug> nodes/<slug>.json
```

It flattens the tree, reports duplicated long strings, and flags `mobile_variant` via the ancestor style chain.
A copy of the script is preserved at `extract_text_nodes.py` in this folder.

### Trap 2 · `set_text` on a rich paragraph destroys its inline children

Several target paragraphs are not a single String — they contain `Strong` labels and `Link` elements as siblings.
Calling `set_text` on the parent paragraph **replaces all of it**, deleting the bold label and the iTraceiT
hyperlink.

Known affected:

- **Round Mêlée #4** — paragraph `e336a910-…-f4ae` = `Strong("Calibrage & Constitution des Lots:")` +
  String + `Strong("Provenance:")` + String + `Link(iTraceiT)` + String.
- **Round Mêlée #5** and **Calibrated Fancy Shapes #3** — the mine-of-origin sentence is split across
  String + `Link(iTraceiT → https://itraceit.io/members_en/)` + String.
- **Fancy Color Melee #2** — paragraph `ab92655d-…-3a10` is split across two String nodes.

For these, set text on the **individual String node's parent** where possible, or rebuild the paragraph preserving
the Strong and Link children. Verify the iTraceiT link still resolves after every such edit.

### Trap 3 · "100% Synthetic Free" is a component; its text lives in props

Component `Section / Synthetic Fr`, id `48e9b8f0-13ce-91e6-c716-a04cc9a7521d`.
Props: `Show`, `Ratio`, `Synth Heading`, `Paragraph`, `Caption`, `Flutting`, `1`–`5`, `Icon`, `Icon-Fr`.

- Items `100% Synthetic Free #2 / #3` are **prop edits** via `data_component_props_tool`, not `set_text`.
- `Synth Heading` is `"100% Synthetic Free, Zero Tolerance Technology"` with `hasOverride: false` on every
  instance. So item **#4 is one edit to the component default** and propagates to all FR pages.
  **Before doing it:** confirm the English pages use a *different* component (there should be a non-`Fr`
  equivalent). If they share this one, stop and ask.
- Part 2 "remove the block from Fancy Color Melee + Certified" = set `Show` to `hide`. **Do not delete elements.**
  Fancy Color Melee's instance already reads `Show: "hide"` — check the published page first; this item may
  already be satisfied.

Instance element IDs: Round Mêlée `e712bb5a-c636-091b-2d05-9bbada19bd04` · Calibrated Fancy Shapes
`af861cd2-c41b-18c0-9143-c65a82e246e3` · Single-Cut `c0468a15-6db0-1951-a7c1-3f2804696614` ·
Fancy Color Melee `9c10ad27-0421-8b6a-32ec-6730c13a7ed6`.

### Trap 4 · Our Story #24 → #26 is a cascade

Not three independent edits. Content shifts up one slot:

- `#24` deletes the iTraceiT paragraph
- `#25` replaces the India-audits paragraph **with** the iTraceiT text
- `#26` replaces the RJC paragraph **with** the India-audits + RJC text

Three paragraphs become two. Execute strictly in that order and do not "fix" the apparent mismatch.
Cut-To-Measure `#5` is the same shape — the RJC sentence is already removed inside the replacement text, so the
Part 2 deletion needs no second edit.

### Trap 5 · Same source string on multiple pages

The mine-of-origin / iTraceiT sentence appears on both Round Mêlée `#5` and Calibrated Fancy Shapes `#3`.
Always scope matching to one page.

---

## Locator annotations that are NOT part of the text to paste

- `Étiquettes :` (Home #1) — locator. Home #1 is **three separate label elements**, ×2 for mobile = 6 edits.
- `Slogan :` (Our Story #15) — locator.
- `(bandeau)` (Round Mêlée #3) — locator. **Resolved:** the subtitle element already exists reading
  *"Notre inventaire poli de mêlé blanc répond aux normes suivantes"*. The change is only dropping the word
  **"poli"**. No new element needed.
- `¶` (Fancy Color Certified #1) — a paragraph break between the `Notre qualité` heading and the body.
- `•` bullets — keep existing list markup, change label text only.

---

## Order of work

### Step 0 — decide the staging mode (ask the user before writing)

Data API edits land on the shared canvas immediately. If the client publishes for any unrelated reason mid-job,
partial work goes live. The site reports `canBranch: true`. **Recommended: work on a page branch and merge on
approval.** Confirm before the first mutation.

### Step 1 — finish the mapping

Already dumped: Home, About, Our Diamonds, Round Mêlée, Calibrated Fancy Shapes, Single-Cut, Fancy Color Melee.
**Still to dump:** Cut-To-Measure (`6853fb013142b018f3aa9be3` — returned a 502, retry), Fancy Color Certified,
Sustainability, Responsible Sourcing, Socially Compliant, Synthetic Free, Contact.

Produce `fr-update-v2-manifest.json`: one row per checklist item →
`{item, page, page_id, action, element_ids[], breakpoint, current_text, new_text, notes}`.
Every item must resolve to at least one element. Unresolved items get parked in `unmatched.md` and reported —
never guessed.

### Step 2 — apply Part 1 and Part 2

Page by page, checklist order, both breakpoints. Log each applied change to `applied-<slug>.json` in this folder.

Blocked items — do **not** attempt until the client answers (see `fr-typo-queries.md`):

- Sustainability Part 2 (Gender Equality 05 deletion) — checklist itself parks it.
- Contact #1 form field key — see below.

Proceed on best judgement, flagging the assumption:

- **Single-Cut #1 (AÑADIR)** — the page has no quality-standards strip. Round Mêlée and Calibrated Fancy Shapes
  both place theirs between the hero `text_card` and the Synthetic component. Insert there, between
  `f4bcfd98-…-13a9` and `c0468a15-…`.
- **Fancy Color Certified #1 (AÑADIR)** — add the `Note qualité` block. Fancy Color Melee has this same block
  twice (hero `text_card` + `trusted_wrap`); Part 2 removes the FCM duplicate and this item adds the FCC copy.
  Mirror FCM's `trusted_wrap` structure.
- **Contact #1/#2** — change the **visible label only** (`TONALITE` → `Message`, and the line above the form →
  `Contactez-nous`). The input is `inputName: "The Tone 2"`, `id: "the-tone-2"`; renaming it changes the form
  submission key and would break their notification templates. Leave `inputName` alone unless the client
  explicitly approves.

### Step 3 — Part 3 display bugs

- **About, 1984 timeline popup shows Nathalie Bonvin's bio.** Related lead: the About dump contains a
  **desktop+desktop** duplicate of Deepak Sheth's bio. Investigate together — likely a duplicated element or a
  reused interaction target from the v1 build.
- **Sustainability UN goals** (page `6695237c9fbf8620fd93d583`). The goals are a Tabs widget:
  `goals_cards` (TabsMenu, `goals_card` TabsLinks) + `goals_item` (TabsContent `5a4b6ea8-…-d63`) containing
  `goals_dropdown` blocks. Evidence gathered:
  - two `Vie Terrestre` dropdowns with **identical body text** — `…-da9`/`…-dab` (no number prefix) and
    `…-e11`/`…-e14` (`15. Vie Terrestre`)
  - `08. Énergie Propre & Abordable` (`…-ddb`) and its full body (`…-dde`) **do exist**
  - tab card label `Énergie Propre & Abordable` at `…-d1a`

  Hypothesis: a dropdown slot was overwritten with a copy of the Vie Terrestre entry, which would produce all
  three reported symptoms at once (07=08, 11=12, Clean Energy "absent"). **Map tab card → dropdown pairs in order
  first.** If the copy is recoverable we do not need to ask the client for replacement text at all.
- Check all four bugs on the **English** pages too — they probably originate in the v1 build.

### Step 4 — QA (`08-qa/.tmp/fr-update-v2/`)

- Scripted diff of every changed node against the checklist: accents, punctuation, spacing preserved exactly.
- Visual pass at **desktop and mobile** on a focused browser tab (background tabs freeze IntersectionObserver
  and transitions — reveals will not fire).
- Confirm every iTraceiT link still resolves after the Trap 2 edits.
- Confirm no English page changed.

### Step 5 — publish

Explicit client approval required. Deliver a change summary with the request. If the MCP token cannot call
`publish_site`, hand the client a publish instruction instead.

---

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
Branch: `deliver/excellent-facets-fr-update-v2`. Commit artifacts and logs; never `.env`, tokens, or media.
