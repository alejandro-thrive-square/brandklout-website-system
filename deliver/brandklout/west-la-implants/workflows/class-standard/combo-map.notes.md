# combo-map.json — review notes (phase 2 B, CLASS-STANDARD §10)

2026-10-09, `bk-west-la-implants`, from `context-combo.mjs --site west-la-implants:staging` (seq 8):
7 candidates, 6 kept with readable names, applied on staging.

| Old contextual rule | Combo on the element | Nodes |
| :-- | :-- | :-- |
| `.detail_column .heading-style-h3` | `heading-style-h3 is-detail` | 31 on 4 pages |
| `.post-index_card .heading-style-h3` | `heading-style-h3 is-post-card` | 46 on 1 page |
| `.why_head .text-style-lead` | `text-style-lead is-why` | 2 on 2 pages |
| `.landing-final_content .text-style-lead` | `text-style-lead is-landing-final` | 4 on 4 pages |
| `.thank-you_content .button` | `button is-thank-you` | 2 on 2 pages |
| `.is-landing-page .heading-style-h3` | `heading-style-h3 is-landing-heading` | 52 on 6 pages |

Dropped: `.section_transformation .text-style-lead` (0 nodes on 0 pages: that chapter's lead carries no
`text-style-lead` class; the rule is dead and stays as it is).

Kept contextual by the tool (for a person, if ever): the six `[data-theme="light"] …` theme rules
(themes stay contextual by the standard), `.is-landing-page .compare_column-head .text-size-small`
(three classes would become two, specificity change) and the selector list
`.is-landing-page .compare_pin .heading-style-h2, .is-landing-page .steps_pin .heading-style-h2, .is-landing-page .card-rail_pin .heading-style-h2`
(split it by hand first).

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
