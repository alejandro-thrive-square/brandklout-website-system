# Style direction — "Designed first"

Home page, 2026-09-21. Tokens in [`design-tokens.json`](design-tokens.json); authority in
[`reference-inventory.md`](reference-inventory.md).

## The idea

The client's brief says one thing in six different ways: **the doctor designs the case, and the
laboratory executes it.** So the page is built around a drafting motif. Hairline gold rules, corner
ticks, monospaced figure captions ("Fig. 03"), coordinates under the hero. The page reads like a
set of working drawings for a smile, because that is what the practice actually produces before it
touches a tooth.

**Signature moment (chapter 03).** A real patient's "before" photograph holds still. As you scroll,
the smile design is drawn over it: facial midline, smile line, tooth proportion, gum architecture.
Keep scrolling and the finished veneers wipe in across the same mouth, aligned to the pixel. Then
the divider is yours to drag. It is the practice's method, shown rather than described.

## Identity

| | |
| :--- | :--- |
| Ground | Graphite-black `#121112` / `#1b1a1b`, from the logo's charcoal `#373435`. Light chapters on ivory `#f5f1e8`, `#ebe5d8`, `#fbf9f4` |
| Accent | Gold `#c3972b`, the logo's Pantone 1245 C, for fills, rules, numerals and text **on dark** (7.0:1 on `#121112`, 6.4:1 on `#1b1a1b`). `#e2bd58` for hover and for gold text on the glass panels |
| Gold on light | `#c3972b` on ivory is 2.4:1 and cannot carry a glyph. Text on light uses `#74560f` (5.4:1 to 6.5:1 across the three ivories); the bright gold stays on rules and fills |
| Type | **Jost** 300 for display: the nearest web face to the logo's Century Gothic. **Instrument Serif** italic for the one emphasised word per headline, and for quotations. **IBM Plex Mono** for chapter tags and figure captions. All three self-hosted |
| Shape | Near-square buttons (`.2rem`), `.6–.8rem` media corners, hairline rules. No pills, no shadows on sections |
| Photography | Only the practice's own. Colour at rest everywhere: nothing is desaturated until hovered |

## The journey — eight chapters, fixed order

| # | Chapter | Ground | What scroll does |
| :--- | :--- | :--- | :--- |
| 00 | **Arrival** | dark | **Pinned.** The film window opens from a framed figure to full bleed; the headline leaves, the practice's descriptor arrives over the film |
| 01 | **The Question** | dark | **Pinned.** "Who is actually designing your case?" is written word by word, then answered |
| 02 | **Two Disciplines** | ivory | Two panels that open to the pointer; the four client figures count against the scroll |
| 03 | **The Design** | dark | **Pinned, signature.** Guides draw, the after wipes in, three captions hand over. Then draggable |
| 04 | **The Specialist** | bone | Portrait wipes and drifts, the Top Dentists seal turns with the scroll, credentials count, memberships marquee reacts to scroll velocity |
| 05 | **The Path** | dark | **Pinned.** Six steps travel sideways with a counter and a progress rule; technology lives here as supporting cast, the way the client asked |
| 06 | **The Proof** | ivory | The four patient cards are dealt from a stack by the scroll; each opens the patient's own film. Written reviews on arrows |
| 07 | **The Invitation** | dark | The first-visit offer, what it includes, phone, address, payment options; the form column pins beside it |

FAQ-style objections fold into the chapter that answers them: payment options sit inside The
Invitation, technology inside The Path, memberships inside The Specialist.

**Continuity.** A gold reading-progress rule under the nav, numbered chapter tags, a numbered rail
on the right edge, the nav and rail inverting over light chapters, and a theme shift at every turn
of the story (dark, dark, ivory, dark, bone, dark, ivory, dark).

**Conversion.** Consultation button in the nav at every depth, phone in the nav from 1280 up, a
fixed Call / Request bar on phones from the first pixel, which steps aside only while the form
itself is on screen.

## Breakpoints and type

House fluid root installed verbatim. Breakpoints 1279 / 991 / 767 / 479. All type in `rem`; the
display sizes are `rem × multiplier`, and only the multipliers step at the breakpoints. No `px`
and no `clamp()` font sizes. Body copy is 17 px at 1440 and 17.5 px at 390.

## Motion rules kept

- ScrollSmoother on desktop fine pointers only; phones scroll natively and keep every pin.
- Scrubbed scale never lands on exactly `1`.
- The unlit words in chapter 01 are already 5.2:1 before they fill.
- `prefers-reduced-motion` (or `?motion=off`): no smoother, no pins, no scrubs, nothing hidden; the
  before/after rests at its midpoint and still drags, the path becomes a snap-scrolling row.
- Initial hidden states are written by the script, never by the stylesheet, so the page reads in
  full with JavaScript off.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md).
