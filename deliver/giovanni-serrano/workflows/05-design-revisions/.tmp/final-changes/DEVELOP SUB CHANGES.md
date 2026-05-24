# Develop Sub-Page Design Changes

## Global

- Add a sticky `Get a free lot review ->` button.
- Desktop placement: top right.
- Mobile placement: full-width bottom bar.
- Trigger: appears after the second scroll.
- Anchor: `#contact`.
- Standardize CTA copy as `GET A FREE LOT REVIEW` across the entire page: banners, sticky button, hero CTA, and form button.
- The two existing inline CTA banners already use this copy. The Section 10 form submit button currently says `REQUEST A FREE LOT REVIEW`; change it to match.
- Fix the systemic font rendering issue across the page. Capital letters are rendering as fallback glyphs:
  - `S` renders incorrectly in examples such as `San Diego`, `SB 9`, `SB 1123`, `Stabilized`, `SD`, `Structural`, `Soils`, and `Sometimes`.
  - `W` renders incorrectly in examples such as `What's` and `Walking`.
  - `Y` renders incorrectly in examples such as `You contribute` and `You hold`.
  - `V` renders incorrectly in examples such as `JV structuring` and `LTV`.
  - Lowercase `s` renders incorrectly in examples such as `Saving`.
- This is likely a missing font weight or Unicode mapping issue. It needs a technical fix at the font level, followed by a global verification pass before publish.
- For a homeowner audience making a six-figure decision, copy glitches kill trust faster than anything else on the page.
- Keep the two existing inline CTA banners after the hero and after Section 05.
- Add one additional banner between Section 04, Refinance Play, and Section 05, Sample Lot Review. Use the same copy and styling.

## Section 01 - Hero

- Add two CTAs below the `BEST FOR / RANGE / MY ROLE` box:
  - Primary terracotta button: `Get a free lot review ->`, anchored to `#contact`.
  - Secondary text link with arrow: `See a sample lot review v`, anchored to Section 05.
- Replace eyebrow text:
  - From: `03 / 04 - DEVELOP - SERVICE BRIEF C`
  - To: `03 / 04 - FOR HOMEOWNERS WITH A BACKYARD`
- Keep the site-plan visual on the right as-is. It is excellent.

## Section 02 - Why Build

- Fix typo in Card 02: change the broken rendering of `San Diego` to `San Diego`.

## Section 03 - Three Paths

The `2x2` grid has an empty bottom-right quadrant: A top left, B top right, C bottom left, and empty bottom right. It reads as unfinished.

Preferred option:

- Restructure as a single row of three columns: `A / B / C`.
- This is tighter, balanced, and avoids empty space.

Alternative option:

- Move the `CA law` callout up into the empty quadrant so the grid stays `2x2` with no gap.
- Then drop the standalone CA law section below.

## Section 04 - The Refinance Play

- Fix typo in Stage 01 body: change the broken rendering of `You contribute 20-35% equity` to `You contribute 20-35% equity`.
- Fix typo in Stage 04 body: change the broken rendering of `You hold the property` to `You hold the property`.
- Keep the `+Units / +Income / +Equity / Repeat` treatment at the bottom of the four stages as-is. It is the strongest formulaic moment on the page.

## Section 05 - Sample Lot Review

- Fix typos in the sample document:
  - Change broken `SB 9 lot split` text to `via SB 9 lot split`.
  - Change broken `SB 1123 small-lot subdivision` text to `SB 1123 small-lot subdivision`.
  - Change broken `Stabilized rents` text to `Stabilized rents`.
  - Change broken `Cash-out at 70% LTV` text to `Cash-out at 70% LTV`.
- Insert a testimonial slot between this section and the CTA banner that follows:
  - Single quote, 2-3 lines.
  - Attribute by name and neighborhood.
  - Design the slot now even if final copy is not ready.
- For a homeowner audience considering a six-figure development project, a quote from another homeowner who went through the process is the single highest-impact addition to this page.

## Section 06 - Why Work With Me

- Fix typo in Card B body: change the broken rendering of `Saving you from a project` to `Saving you from a project`.

## Section 07 - The Process

- Fix typos in Stage 01 body:
  - Change broken `What's actually worth building` text to `What's actually worth building`.
  - Change broken `under SB 9, ADU law, Density Bonus, SB 1123` text to `under SB 9, ADU law, Density Bonus, SB 1123`.

## Section 08 - The Team

- Fix typos across cards:
  - Card A, Design: change broken `SD -> DD -> CD` text to `SD -> DD -> CD`. Consider expanding on first use as `Schematic Design (SD) -> Design Development (DD) -> Construction Documents (CD)` because most homeowners do not know these abbreviations.
  - Card B, Structure + Site: fix `Structural engineering` and `Soils (geotech)`.
  - Card D, Capital: fix `Sometimes the same institution`.
  - Card E, Legal: fix `JV structuring`.
  - Card F, Developer: fix `Walking the site`.
- Keep Card F as-is. The inverted dark-panel `Me - end to end` card is intentional and effective.
- Mobile: stack the `3x2` grid as `2x3`, not `1x6`, because a single column creates too long a scroll.
- Card F must land last in the stacked order so the `everyone else, then me` reveal stays intact.

## Section 09 - My Background

- Add a professional headshot of Gio.
- Position it above the body copy on the left column.
- Keep the Core Thesis terracotta panel on the right.
- Preserve the two-column structure and land the photo in the natural `introduce yourself` position before the narrative.
- Keep the Core Thesis panel as-is:

```text
The construction site and the spreadsheet, both. Most people only bring one.
```

## Section 10 - Let's Talk Contact Form

- Phone field placeholder `619.555.0000` reads as a real number. Change it to `(619) 555-0000` or `Your phone`.
- The `I'm looking to` dropdown currently shows an empty `Select your goal`.
- Suggested Develop-specific dropdown options:
  - `Find out what's buildable on my lot`
  - `Get a feasibility review for a specific property`
  - `Explore the refinance math on my home`
  - `Discuss a full development project`
- Verify the house-shape watermark behind the terracotta panel renders consistently on mobile.

## Section 11 - Other Services

- Cards are labeled `A - INVEST` and `B - SCALE`, skipping `C` because Develop is the current page.
- Relabel these as `01 / 02`, or drop the letter labels entirely.
- Confirm placement is below the contact form.

## Section 12 - Footer

- No changes.
