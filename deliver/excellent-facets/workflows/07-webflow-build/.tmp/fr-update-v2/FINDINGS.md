# FR Update v2 — findings from execution (2026-08-01)

Working mode chosen by user: **direct on canvas, draft only, no publish.**

## F1 · The canvas and the published site are different content generations

The published French pages still carry an older, machine-translation-era copy. The canvas
carries a newer French rewrite that has **never been published**.

Evidence (`/fr/white-melee-diamonds`):

| | published | canvas |
| :-- | :-- | :-- |
| hero H1 | *(absent)* | `Mêlé Rond.` |
| first paragraph | "Destinée aux maisons d'horlogerie… 0,70 mm à 3,80 mm… Sortoscope de Nossigem" | "Au service des maisons… 0,60 mm à 3,80 mm… Sortoscope Nossigem" |
| spec cards (Pureté / Poids du Poli / …) | absent | 7 cards present |
| `Calibrage & Constitution des Lots` para | absent | present |

Same pattern on Cut-To-Measure (published has `Finition Vérifiée`, `noms de maisons masqués`;
canvas has `Notre Savoir-Faire Technique`, the `Les Normes Qualité` strip).

**The checklist's `TEXTO ACTUAL` blocks match the CANVAS, not production.** So Nathan reviewed a
staging/canvas version for Part 1. Our edits are landing on the right content.

**Consequence for publishing:** a publish will ship our FR Update v2 changes *plus* the entire
pre-existing unpublished rewrite. That is a much larger release than "the FR text update", and it
is pre-existing — it was already on the canvas before this job started. Flag to client before publish.

## F2 · `set_text` works directly on String nodes — Trap 2 is defused

`set_text` accepts a String node's own element id, not just a text-capable parent. Individual
String children can be rewritten in place, leaving `Strong` labels and `Link` elements untouched.
Verified on Round Mêlée: the `Provenance:` Strong and the iTraceiT link
(`https://itraceit.io/members_en/`) survived intact. No paragraph rebuilding is needed anywhere.

## F3 · Trap 3 was wrong about the `Show` prop

`Show` belongs to the component's **`Fluting` prop group** — it controls the fluting/"Tri &
Ensachage" sub-block, *not* the whole Synthetic section. Component default is `hide`.

- Round Mêlée overrides `Show: ""` → its fluting block is visible, and its `Flutting` prop was
  overridden with the *same text* as the page's `Calibrage & Constitution des Lots` paragraph.
  **That is the duplication Nathan reported for Round Mêlée** (Part 2), not a page-level duplicate.
- Fancy Color Melee / Certified have `Show: hide` (default) but the **Synthetic section itself is
  still rendered** on both published pages (`Sans Produits Synthétiques` present). So Part 2's
  "remove the shared block from FCM + FCC" is **NOT already satisfied** — it still needs doing.

## F4 · English and French Synthetic components are separate

`Section / Synthetic` (English, 6 instances) and `Section / Synthetic Fr` (French, 6 instances) are
distinct components. Editing the `Fr` component's `Synth Heading` default is therefore safe and
cannot touch English pages. Trap 3's precondition is satisfied.

Note: the Fr component's `Paragraph`, `Caption` and `Flutting` **defaults are still English**;
instances override them per page.

## F5 · Sustainability UN goals — root cause found

Tab cards (13) vs accordion entries (13), in order:

| # | tab card | accordion entry | |
| :-- | :-- | :-- | :-- |
| 1 | 01 Pas de Pauvreté | 01. Pas de Pauvreté | ok |
| 2 | 03 Bonne Santé | 03. Bonne Santé | ok |
| 3 | 04 Éducation | 04. Éducation de Qualité | ok |
| 4 | 05 Égalité des genres | 05. Égalité des genres | ok |
| 5 | **07 Énergie Propre & Abordable** | **06. Travail décent** | MISMATCH |
| 6 | **08 Travail Décent & Croissance Économique** | **08. Énergie Propre & Abordable** | MISMATCH |
| 7 | 09 Industrie | 09. Industrie | ok |
| 8 | 10 Inégalités Réduites | 10. Inégalités Réduites | ok |
| 9 | 11 Villes & Communautés | 11. Villes & Communautés | ok |
| 10 | 12 Consommation & Production | 12. Consommation & Production | **body duplicates 11** |
| 11 | 13 Action pour le Climat | 13. Action pour le Climat | **body duplicates 01** |
| 12 | 15 Vie Terrestre | 15. Vie Terrestre | ok |
| 13 | 16 Paix, Justice | 16. Paix, Justice | ok |

Explains all three of Nathan's reports:
- *"07 and 08 show the same text"* — the clean-energy entry is numbered **08** while a tab card
  also says 07; the entry that should be 07 is numbered 06.
- *"Clean & Affordable Energy is absent"* — on the **published** page the `06. Travail décent`
  entry does not exist at all, so there is a 07 card with no matching 07 entry.
- *"11 and 12 identical"* — confirmed on canvas *and* published: entry 12's body is a verbatim
  copy of entry 11's ("Tous les membres de l'équipe utilisent les transports en commun…").

**Additional defect not in the checklist:** entry `13. Action pour le Climat` carries a
supplier/wages paragraph (a second translation of entry 01's body), not climate content.

Numbering fixes are safe and mechanical. The two duplicated bodies (12 and 13) need **client-supplied
replacement copy** — we will not invent content for a real business.

## Element ids for the Sustainability fixes

- entry 5 heading `25d60c08-ee5e-2134-c710-bd22cd341210` = `06. Travail décent`
- entry 6 heading `5a4b6ea8-1e19-4310-ceda-2cda81a81ddb` = `08. Énergie Propre & Abordable`
- entry 10 body `5a4b6ea8-1e19-4310-ceda-2cda81a81e02` (dupe of 11)
- entry 11 body `5a4b6ea8-1e19-4310-ceda-2cda81a81e0b` (dupe of 01; target of checklist Sust. #3)
- entry 12 heading `5a4b6ea8-1e19-4310-ceda-2cda81a81e11` (checklist Sust. #4 renames to `15. Vie sur terre`)
- entry 12 body `5a4b6ea8-1e19-4310-ceda-2cda81a81e14` (target of checklist Sust. #5)
- entry 6 body `5a4b6ea8-1e19-4310-ceda-2cda81a81dde`
- entry 7 body `5a4b6ea8-1e19-4310-ceda-2cda81a81de7` (target of checklist Sust. #1)
- entry 8 body `5a4b6ea8-1e19-4310-ceda-2cda81a81df0` (target of checklist Sust. #2)
- tab card 5 label `5a4b6ea8-1e19-4310-ceda-2cda81a81d1a`, number `…d18` = `07`
- tab card 6 label `…d24`+`…a054b`, number `…d22` = `08`

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
