## Previously completed: Dealer Websites — nested Collection List removed from the theme card (2026-08-08)

Site `69c8c0f16c14c214b2451dcf`, page **Themes** `69e6ce4fbcb42cd9132121a8`. **Published to staging.**

The blocker the user hit is narrower than "Webflow forbids Collection Lists in components": a single
list inside a component is fine (`Section Themes Slider` `d686e8bf-…ff553` already contains one).
What is forbidden is a **nested** list — and the theme card had one: a hidden multi-reference
Collection List (Category) whose only job was to print a category name for the filter script to
`slugify()` into `card.dataset.category`. Also note the card *is* the `DynamoItem`, so it can never
be a component itself; the componentizable unit is `.layout520_card-content`.

The nested list was redundant. The Themes collection already carries a PlainText field **`section-id`
("Item ID")** holding exactly that slug, populated on all 10 items and matching the Themes Categories
slugs 1:1. So:

1. Created a hidden `<div class="theme-category-hook">` inside `.layout520_card-content-top`
   (`c4582a21-…e910d`), text **bound to `section-id`**; new global class `.theme-category-hook`
   (`display:none`).
2. Deleted the nested `DynamoWrapper` `0a4d56e7-…e716`.
3. Repointed the filter embed (`f3203f54-…dd530`) at `.theme-category-hook`; the rest of the FLIP
   script is byte-identical.

Verified on the published page, not in the Designer: **10 cards, 0 `w-dyn-list` inside the grid, 10
hooks** rendering `car-dealer-websites` / `auto-repair-shop-websites` / `collision-center-websites` /
`auto-detail-websites`, all matching the `a.header64_link` ids exactly; `.theme-category-hook
{display:none}` is in the published CSS. The structural blocker is gone — **the component itself was
not created**, that is the next step if wanted.

**Second nested list — the user's ACTUAL blocker, also removed.** Clearing the card was not enough:
the user was converting the whole **`section_themes`** block (`a1219873-…f9fb`), which also held a
hidden **Features** Collection List (`f3021762-…a97b`, class `hide`, 24 items) with a *second* list
nested inside its items (`8c63196b-…d37c73`) — copy-paste residue from the Features page. I first
filed it as optional cleanup; it was the thing failing their conversion. Verified unreferenced (no
inline script mentions `layout240_category` / `_order` / `_item`; the filter script only touches
`.layout240_list` / `.layout520_card`, which are the grid) and deleted. **Published page dropped
60,609 → 40,026 bytes.** `section_themes` now holds exactly **2 top-level lists, 0 nested**.

**Lesson worth keeping: scan the whole subtree the user is converting, not the one you think is at
fault.** I answered for the card because that is where the interesting nesting was, and reported the
blocker cleared while the real one was still sitting two siblings away, hidden by `display:none`.

**Conversion succeeded** — the user created **`Section Themes`** (`82949d36-…a50e7f`, 1 instance).
It holds both Collection Lists, both HtmlEmbeds, the hook and both buttons; nothing was lost. Note a
component instance **hides its internals from the page tree** — after conversion, page-scoped
`query_elements` for `.section_themes` or `HtmlEmbed` returns 0 matches. Query with
`scope_component_id` instead, or you will conclude the elements were deleted.

### Card hover reveal was missing — restored (2026-08-08)

`.layout520_card-content` (heading + both buttons) is `opacity: 0` in the Webflow class, and
**nothing on the site set it back to 1**: no hover pseudo on any `layout520*` global or on the
`.layout520_card.text-color-white` combo (empty), no rule anywhere with a hover `opacity: 1`, no
`:hover` in any of the 4 inline `<style>` blocks, no IX2 on the cards (3 `data-w-id` on the page, all
navbar), and **no `transition` either** — the whole mechanism was absent, not just the trigger line.
Cause never established: my first live capture is already post-publish, there is no Wayback capture
of the URL, and none of my edits touch styles/custom code/interactions. Possible that my publish
merely exposed an unpublished Designer state (the earlier feature-row session was recorded as "NOT
published"). Restored as a fade, per the user, in a `<style>` block **inside the component's own
embed** so it travels with the component:

```css
.layout520_card-content { transition: opacity .35s ease; }
.layout520_card:hover .layout520_card-content,
.layout520_card:focus-within .layout520_card-content { opacity: 1; }
@media (hover: none) { .layout520_card-content { opacity: 1; } }
```

`focus-within` keeps the buttons keyboard-reachable; `hover: none` stops them being permanently
unreachable on touch. **Verified by driving the live page over CDP**, not by reading markup:
opacity `0 → 1 → 0` on real `Input.dispatchMouseEvent` enter/leave.

### The filter never filtered — same missing-stylesheet hole (2026-08-08)

User reported the shuffle "only works the first time". Measured instead of guessed, and the reported
symptom was not the defect: the FLIP ran on **every** click (10 cards moving, 67 sampled frames), but
**`.is-filtered-out` had no CSS rule anywhere on the site**, so cards were tagged and never hidden —
all 10 stayed on screen and each click merely reshuffled the same 10. `.header64_link.is-active` was
missing too, so the selected filter was never highlighted. That is the *same* hole that swallowed the
hover reveal: the script's own comments say these states are "handled in CSS", and all three rules
are absent. Strong evidence a single `<style>` block was lost at some point, not three separate edits.

Both rules restored in the component embed, and the animation upgraded to a **2-phase transition**,
because hiding cards properly exposed a second problem: switching between two *disjoint* categories
leaves no survivors to FLIP, so it would have snapped. Phase 1 shrinks leaving cards out in place
(260ms), phase 2 reshuffles and FLIP-reflows the survivors while entering cards fade + scale in on a
random stagger. Added `prefers-reduced-motion` (class toggle only) and an `exitTimeoutId` guard so a
fast second click cannot strand phase 1.

**Smoothness proved, not eyeballed** — a path-length metric cannot tell a glide from a teleport, so
the harness measures what share of a card's total travel lands in its worst single frame:

| click | survivors that travelled | worst single frame | leaving faded | entering faded in |
| :--- | ---: | ---: | ---: | ---: |
| car-dealer | 6 | 10.5% | 3/3 | – |
| auto-detail | 0 (disjoint) | – | 7/7 | 1/1 |
| car-dealer | 0 (disjoint) | – | 1/1 | 7/7 |
| all | 7 | 10.5% | – | 3/3 |
| all *(same filter again)* | **10** | 10.5% | – | – |

~85 frames per travelling card, worst frame ~10% of the path — a real glide. The last row is the
user's actual ask: clicking the **same** filter twice still reshuffles all 10.

Earlier verification of the hover, for the record:
opacity `0 → 1 → 0` on real `Input.dispatchMouseEvent` enter/leave with `opacity 0.35s`, both button
hrefs correct per theme; filter re-tested after the embed rewrite — 10/10 cards stamped,
`car-dealer-websites` 7, `auto-detail-websites` 1, `collision-center-websites` 1, `all` 10, matching
the CMS exactly. Harnesses are in this session's scratchpad (`hover-test.mjs`, `filter-test.mjs`).

**Multi-category caveat:** `section-id` is single-valued while `category` is a MultiReference. Today
every theme has exactly one category so nothing is lost, and the nested list was capped at 5 items
anyway. For multi-category themes later: store comma-separated slugs and change the match to
`card.dataset.category.split(',').includes(filterId)`. The text field must be kept in sync when
themes are added — that is the real cost of this trade.
