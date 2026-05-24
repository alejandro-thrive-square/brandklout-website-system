# Invest Sub-Page Design Changes

## Global

- Add a sticky `Request a deal review ->` button.
- Desktop placement: top right.
- Mobile placement: full-width bottom bar.
- Trigger: appears after the second scroll.
- Anchor: `#contact`.

## Section 01 - Hero

- Add two CTAs below the `BEST FOR / TYPICAL PROPERTY / STRATEGY` box:
  - Primary terracotta button: `Request a deal review ->`, anchored to `#contact`.
  - Secondary text link with arrow: `See a sample analysis v`, anchored to Section 06.
- Replace eyebrow text:
  - From: `01 / 04 - INVEST - SERVICE BRIEF A`
  - To: `01 / 04 - FOR FIRST-TIME MULTIFAMILY BUYERS`

## Section 02 - Why Multifamily

- Cards 01, 02, and 03 end mid-sentence with trailing commas. Complete the sentences or trim to the bold lead-in.
- After Card 04, add bridge line: `So how do you actually enter? ->`
- Anchor the bridge line to Section 03.

## Section 03 - Strategy

- Card A: change `3,4% down` to `3.5% down`.
- Cards B and D end with trailing commas. Clean up.
- Bar-graph encoding is inconsistent:
  - On the investor side, longer bars mean worse.
  - On the owner-occupant side, longer bars mean better.
- Either normalize the encoding so longer always means the same direction, or add small row-level labels indicating which direction is favorable.
- Add inline CTA after the A/B/C/D cards:
  - Copy: `Find out what you'd qualify for ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.

## Section 04 - What I Do

- All three card bodies end mid-sentence with trailing commas. Fix the copy.
- Add inline CTA after the three cards:
  - Copy: `Bring me a property to underwrite ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.

## Section 05 - Proforma Walkthrough

- Step 01: change `000% occupancy` to `100% occupancy`.
- Step 05: change `(unleveraged yield(,` to `(unleveraged yield)`.
- Intro paragraph: replace the broken trailing glyph after `Watch it build as you scroll` with a down arrow.
- Multiple step bodies end with trailing commas. Clean up.
- `Watch it build as you scroll` implies a scroll-triggered fill animation on the right-side proforma. Confirm with dev whether this is being built. If not, remove the line.
- Mobile: when the two-column layout collapses, render the right-side proforma between Steps 5 and 6, not after Step 6.

## Section 06 - Sample Analysis

This section needs a hierarchy restructure. The current layout leads with investor-case metrics: `Cap 5.4% / Cash-on-Cash -2.1% / DSCR 0.90x`. A first-time buyer may read those as `this deal doesn't work` and bounce before reaching the yellow owner-occupant explanation.

- Lead with owner-occupant numbers as the primary metric row:
  - Cash to close: `~$115K`
  - `Housing-cost neutral`
  - `Tenants pay ~75% of mortgage`
- Demote the investor-case metrics to a smaller secondary row labeled `If bought as a pure investor at 25% down`:
  - Cap: `5.4%`
  - Cash-on-Cash: `-2.1%`
  - DSCR: `0.90x`
- Keep the yellow `Reading the metrics` callout, but give it heavier visual weight. Increase border, type size, or use a colored panel that visually ties to the owner-occupant primary metrics above.
- Add inline CTA directly below the yellow callout:
  - Copy: `Want this analysis on a property you're considering? ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.

## New Section - Testimonial

Place between Section 06 and Section 07.

- Design a testimonial slot.
- Use a single quote, 2-3 lines.
- Attribute it by name and neighborhood.
- Placeholder text is acceptable until final copy is provided.

## Section 07 - Process

- Step 02 references `SB 8 / ADU law`. Confirm with Gio whether this should be `SB 9` before publishing.
- Step 06 ends with a trailing comma. Clean up.
- Add inline CTA after Step 06:
  - Copy: `Start at step 01 ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.

## Section 08 - About

- Add a professional headshot of Gio.
- Position it to the right of the body copy or above the credentials column.
- Credentials column changes:
  - Change `Capstone - 3.05-acre OM` to `Capstone - 3.05-acre Offering Memorandum`.
  - Change `Models built - 14 institutional` to `Institutional models built - 14`.
- Make sure the line `I'm not learning multifamily on your transaction.` renders with strong visual weight. If the current bold treatment does not stand out, increase the type size or set the line off in its own block.

## Section 09 - FAQ

- Render all five answers inline and visible by default rather than behind `[+]` expand buttons.
- If expand-on-click is preferred for visual cleanliness, build the interaction with a smooth height transition. The `[+]` buttons currently appear non-functional in the screenshots.
- Add inline CTA below Q.05:
  - Copy: `Still have a question? Just ask ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.

## Section 10 - Contact Form

- The `I'm looking to` dropdown should default-select `Buy my first multifamily` on this page, not the empty `Select your goal`.
- Phone field placeholder `619.555.0000` reads as a real number. Change it to `(619) 555-0000` or `Your phone`.
- Verify the `$` watermark on the terracotta panel renders consistently on mobile.

## Section 11 - Other Services

- Confirm placement is below the contact form in the final layout.
- The cross-link section should not compete with the form for attention.

## Section 12 - Footer

- No changes.
