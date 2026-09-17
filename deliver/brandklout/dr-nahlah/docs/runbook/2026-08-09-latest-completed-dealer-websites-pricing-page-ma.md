## Latest completed: Dealer Websites — Pricing page made prop-editable (2026-08-09)

Site `69c8c0f16c14c214b2451dcf`, page **Pricing** `69ee3889752d31141e3216b2`. **Not published.**

`Section Pricing` `c4cea9d6-…4ab10` went from 0 props to **44**, grouped `Tabs` /
`Monthly Plans` / `Annual Plans`, every one tooltipped, all 38 elements bound. Naming mirrors the
FAQ page (`Faq Heading`, `Button Text`, `Button Link` → `Monthly Plan 1 Title`, `… Button Link`).
`Section FAQ Short` `8b50302f-…a9e01` got 6 group heading/sub-heading props, bound.

Two techniques worth reusing (full detail in memory `reference_webflow_component_nesting_limits`):
- The price line mixed a loose text node (`$39`) with a styled `Span` (`Per month`, `.check-span`-
  style superscript). Binding the parent's `text` destroys the span. Fix: Webflow `Span` is NOT
  bindable, but a **DOM element with `dom_tag: "span"` is** — two DOM spans, classes copied onto
  the period one, each bound to its own prop, then remove the original String + Span.
- Multi-line titles/notes: `textContent` binding wipes `<br>` elements. Fix: new class
  `.text-style-multiline` (`white-space: pre-line`) + `default_text.multiline: true`.

**Pricing FAQ nesting — DONE.** The user created the two components in the Designer (MCP cannot:
`transform_element_to_component` has no `scope_component_id` and cannot resolve elements inside a
component definition). Their names/props, used verbatim:
- `Pricing Faq` `e93dbb2d-…63fc` — `Pricing Faq Heading`, `Pricing Faq Paragraph`
- `Add-Ons Card` `3467b538-…49d0` — `Add-Ons Name`, `Add-Ons Text`, `Add-Ons Logo`, `Add-Ons Price`

Over MCP: inserted 12 + 2 instances, filled every value (image props take
`type:"string"` + assetId in `string_value`), removed the 12 hard-coded accordions and 2 cards.
`faq1_list` now holds 13 `Pricing Faq` instances in order; `card-row43_component` holds 3
`Add-Ons Card` instances. Copy cached at `<session tool-results>/faqshort.json`.

**Slots are dead weight.** The user's two Slots (`5b2d2392…` `card-row43_component`,
`e3ae3a3d…` `faq1_list`) plus their two `Slot` props are EMPTY and unusable from MCP — inserting
into a Slot fails with `Missing element` even scoped to the definition, and page-level slot
population is rejected outright. Instances live in the original containers beside them instead.
Empty grids render at 0 height, so no visual impact. Delete them in the Designer or ignore.

**Style note:** `.card-row43_card` gained `white-space: pre-line` so the `\n` in `Add-Ons Name` /
`Add-Ons Price` renders as a line break. Do NOT try `set_style` with two class names unless the
combo already exists — it errors `styles not found`, and `create_style` with `parent_style_names`
fuzzy-matches and will attach the combo to the WRONG chain (it produced
`.pricing15_price.heading-style-h5.text-style-multiline`; both strays were removed).

**Also flagged:** Annual Plan 2 reads "Med / Large Dealership" while the equivalent monthly plan
reads "Small Dealership" — preserved as-is, exposed via `Annual Plan 2 Title`.
