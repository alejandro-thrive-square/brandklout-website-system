
INVEST SUB-PAGE — DESIGN CHANGES

GLOBAL
•	Add a sticky "Request a deal review →" button. Top-right on desktop, full-width bottom bar on mobile. Appears after second scroll. Anchors to #contact.

SECTION 01 · HERO
•	Add two CTAs below the BEST FOR / TYPICAL PROPERTY / STRATEGY box: 
o	Primary (terracotta button): "Request a deal review →" — anchors to #contact
o	Secondary (text link with arrow): "See a sample analysis ↓" — anchors to Section 06
•	Replace eyebrow text "01 / 04 · INVEST · SERVICE BRIEF A" with "01 / 04 · FOR FIRST-TIME MULTIFAMILY BUYERS"

SECTION 02 · WHY MULTIFAMILY
•	Cards 01, 02, 03 end mid-sentence with trailing commas. Complete the sentences or trim to the bold lead-in.
•	After card 04, add a bridge line: "So how do you actually enter? →" — anchors to Section 03.

SECTION 03 · STRATEGY
•	Card A: "3,4% down" → "3.5% down"
•	Cards B and D end with trailing commas — clean up.
•	Bar-graph encoding is inconsistent: longer bars mean "worse" on the investor side and "better" on the owner-occupant side. Either normalize the encoding (longer always means the same direction) or add small row-level labels indicating which direction is favorable.
•	Add inline CTA after the A/B/C/D cards: "Find out what you'd qualify for →" (terracotta button, ~80px tall, anchors to #contact)

SECTION 04 · WHAT I DO
•	All three card bodies end mid-sentence with trailing commas. Fix.
•	Add inline CTA after the three cards: "Bring me a property to underwrite →" (terracotta button, ~80px tall, anchors to #contact)

SECTION 05 · PROFORMA WALKTHROUGH
•	Step 01: "000% occupancy" → "100% occupancy"
•	Step 05: "(unleveraged yield(," → "(unleveraged yield)"
•	Intro paragraph: trailing "□" character after "Watch it build as you scroll" is a broken glyph — replace with ↓.
•	Multiple step bodies end with trailing commas — clean up.
•	"Watch it build as you scroll ↓" implies a scroll-triggered fill animation on the right-side proforma. Confirm with dev whether this is being built. If not, remove the line.
•	Mobile: when the two-column layout collapses, render the right-side proforma BETWEEN steps 5 and 6, not after step 6.

SECTION 06 · SAMPLE ANALYSIS
This section needs a hierarchy restructure. The current layout leads with the investor-case metrics (Cap 5.4% / Cash-on-Cash −2.1% / DSCR 0.90×). A first-time buyer reads −2.1% and 0.90× as "this deal doesn't work" and bounces before reading the yellow callout that explains the owner-occupant case.
•	Lead with the owner-occupant numbers as the primary metric row: 
o	Cash to close: ~$115K
o	Housing-cost neutral
o	Tenants pay ~75% of mortgage
•	Demote the investor-case metrics (Cap 5.4%, Cash-on-Cash −2.1%, DSCR 0.90×) to a smaller secondary row labeled "If bought as a pure investor at 25% down".
•	The yellow "Reading the metrics" callout should remain but with heavier visual weight — increase border, type size, or use a colored panel that visually ties to the owner-occupant primary metrics above.
•	Add inline CTA directly below the yellow callout: "Want this analysis on a property you're considering? →" (terracotta button, ~80px tall, anchors to #contact)

NEW SECTION · TESTIMONIAL — BETWEEN SECTION 06 AND SECTION 07
•	Design a testimonial slot between Section 06 and Section 07. Single quote, 2–3 lines, attributed by name and neighborhood. Design the slot now even if the copy isn't final — placeholder text is fine.

SECTION 07 · PROCESS
•	Step 02 references "SB 8 / ADU law" — confirm this isn't a typo for SB 9 before publishing. Ask Gio.
•	Step 06 ends with a trailing comma — clean up.
•	Add inline CTA after Step 06: "Start at step 01 →" (terracotta button, ~80px tall, anchors to #contact)

SECTION 08 · ABOUT
•	Add a professional headshot of Gio. Position to the right of the body copy or above the credentials column.
•	Credentials column: 
o	"Capstone · 3.05-acre OM" → expand "OM" to "Offering Memorandum"
o	"Models built · 14 institutional" → relabel as "Institutional models built · 14"
•	Make sure the line "I'm not learning multifamily on your transaction." renders with strong visual weight. If the current bold treatment doesn't pop, increase the type size or set the line off in its own block.

SECTION 09 · FAQ
•	Render all five answers inline (visible by default) rather than behind [+] expand buttons.
•	If expand-on-click is preferred for visual cleanliness, build the interaction with a smooth height transition — the [+] buttons currently appear non-functional in the screenshots.
•	Add inline CTA below Q.05: "Still have a question? Just ask →" (terracotta button, ~80px tall, anchors to #contact)

SECTION 10 · CONTACT FORM
•	"I'm looking to" dropdown should default-select to "Buy my first multifamily" on this page (not the empty "Select your goal").
•	Phone field placeholder "619.555.0000" reads as a real number. Change to "(619) 555-0000" or "Your phone".
•	Verify the "$" watermark on the terracotta panel renders consistently on mobile.

SECTION 11 · OTHER SERVICES
•	Confirm placement is BELOW the contact form in the final layout. The cross-link should not compete with the form for attention.

SECTION 12 · FOOTER
•	No changes.
