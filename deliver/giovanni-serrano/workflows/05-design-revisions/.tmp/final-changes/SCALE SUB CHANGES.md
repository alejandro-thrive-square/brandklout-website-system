# Scale Sub-Page Design Changes

## Global

- Add a sticky `Request a full underwrite ->` button.
- Desktop placement: top right.
- Mobile placement: full-width bottom bar.
- Trigger: appears after the second scroll.
- Anchor: `#contact`.
- Fix the recurring `u/` character typo across the page. Words starting with `Wh` or `W` are rendering as `u/`, for example:
  - `Where` renders as `u/ here`.
  - `When` renders as `u/ hen`.
  - `What` renders as `u/ hat`.
- This appears to be a font ligature or character-encoding issue. It is visible in Sections 06 and 07.
- Run a global find-and-replace verification pass before publishing. For a scaling-investor audience, copy typos kill professional credibility instantly.
- Use the same CTA copy for all inline CTAs on this page: `Request a full underwrite ->`.
- This matches the existing form button text in Section 08 and gives the page one consistent conversion action.

## Section 01 - Hero

- Add two CTAs below the `BEST FOR / TYPICAL PROPERTY / OUTPUT` box:
  - Primary terracotta button: `Request a full underwrite ->`, anchored to `#contact`.
  - Secondary text link with arrow: `See the framework v`, anchored to Section 02.
- Replace eyebrow text:
  - From: `02 / 04 - SCALE - SERVICE BRIEF B`
  - To: `02 / 04 - FOR SCALING INVESTORS`
- Keep the 10-year DCF / IRR trajectory visual on the right as-is. It is the strongest hero asset on any sub-page.

## Section 02 - The Framework

- Intro paragraph: replace the broken trailing glyph after `Watch the model build as you scroll through each one` with a down arrow.
- Add inline CTA after Stage 5:
  - Copy: `Request a full underwrite ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.
- This is a peak-intent point because the visitor has just seen institutional-grade sophistication.

## Section 03 - Where It Comes From

- Card A, Capstone: expand `3.05-Acre Multifamily OM` to `3.05-Acre Multifamily Offering Memorandum` so non-industry visitors can decode it.
- Card C, JV Waterfall: cap structures like `10% pref, 60/40 GP/LP` are correctly written for a scaling-investor audience. Do not simplify them.

## Section 04 - When the Model Updates

- No changes.

## Section 05 - Sensitivity & Risk

- Mobile: the six-card grid should stack as `2x3` or `3x2`, not `1x6`.
- A six-card single column breaks the visual logic of six parallel sensitivity tests and creates excessive scroll.
- Add inline CTA after Card 06:
  - Copy: `Request a full underwrite ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.
- This is the second-highest intent moment on the page.

## Section 06 - Why Work With Me

- Fix the `u/` typo in Card D, Operate.
- Replace:

```text
u/ here outperforming. u/ here underperforming. u/ hen to refinance. u/ hen to start the next one.
```

- With:

```text
Where outperforming. Where underperforming. When to refinance. When to start the next one.
```

- Add inline CTA after Card D:
  - Copy: `Request a full underwrite ->`
  - Style: terracotta button, approximately 80px tall.
  - Anchor: `#contact`.
- This is the peak differentiation moment.
- Insert a testimonial slot between Section 06 and Section 07:
  - Single quote, 2-3 lines.
  - Attribute by name and portfolio size or unit count.
  - Design the slot now even if final copy is not ready.
- For a scaling-investor audience, social proof from another sophisticated buyer carries significant weight.

## Section 07 - How We Work Together

- Fix `u/` typos in multiple steps:
  - Step 01: change `u/ hat are you optimizing for?` to `What are you optimizing for?`
  - Step 01: change `u/ hat submarkets` to `What submarkets`
  - Step 04: change `u/ here to be aggressive, where to give in.` to `Where to be aggressive, where to give in.`
  - Step 06: change `u/ here you're outperforming. u/ here you're underperforming.` to `Where you're outperforming. Where you're underperforming.`

## Section 08 - Let's Talk Contact Form

- Keep headline: `Bring me your next deal.`
- It is strong peer-to-peer voice and works as a headline, not as a button.
- Keep form submit button copy: `REQUEST A FULL UNDERWRITE`.
- This is now the consistent action across the whole page.
- Phone field placeholder `619.555.0000` reads as a real number. Change it to `(619) 555-0000` or `Your phone`.
- The `I'm looking to` dropdown currently shows an empty `Select your goal`.
- Suggested Scale-specific dropdown options:
  - `Underwrite a specific property`
  - `Stress-test a deal I'm considering`
  - `Map a JV waterfall for an equity raise`
  - `Discuss my acquisition criteria`
- Verify the `%` watermark behind the dark panel renders consistently on mobile.

## Section 09 - Other Services

- Cards are labeled `A - INVEST` and `C - DEVELOP`, skipping `B` because Scale is the current page.
- Relabel these as `01 / 02`, or drop the letter labels entirely in this section.
- Confirm placement is below the contact form in the final layout.
- The cross-link should not compete with the form for attention.

## Section 10 - Footer

- No changes.
