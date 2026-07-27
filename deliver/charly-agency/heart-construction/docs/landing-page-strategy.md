# Heart Construction Custom Homes Landing Page Strategy

## Strategic Objective

Create a conversion-focused **Custom Homes** landing page for the Framer rebuild that improves on the current Squarespace site while preserving its strongest conversion assets: premium project photography, direct CTAs, testimonials, portfolio proof, and the promise of making complex residential construction feel clear and manageable.

The page must sell the next step: a qualified consultation / project-fit conversation. It should not feel like a generic contractor page or a broad company overview.

## Inputs and Source Hierarchy

### Primary Client Sources

Use these for core brand, services, audience, pain points, and positioning:

- `Charly Agency Mail - Fwd_ Document shared with you_ _B2B Questionnaire - Heart Construction.md`
- `Charly Agency Mail - Fwd_ Next Steps & Project Details.md`

### Client-Owned Previous Site Source

The client specifically identified the existing site as important:

- `https://www.myheartconstruction.com/`
- Markdown scrape: `workflows/04-design/.tmp/reference-markdown/heart-current-squarespace.md`

Use it for:

- Existing brand language and page structure inspiration.
- Existing project photography and portfolio inventory.
- Current navigation, service/location route inventory, and migration planning.
- Testimonials, phone numbers, email, license number, and claims **only after confirmation before final launch**.

### Visual / Interaction Reference

- `https://info.lasruinas.com/`
- Markdown scrape: `workflows/04-design/.tmp/reference-markdown/las-ruinas-reference.md`

Use it for visual and conversion-pattern inspiration only:

- Warm editorial art direction.
- Large refined serif headlines.
- Strong hero with two CTAs.
- Immediate practical info strip.
- Numbered `Why` section.
- Proof before deep explanation.
- Experience cards, process steps, FAQ, and repeated final CTA.

Do **not** copy Las Ruinas business content, wellness/spa language, offers, pricing, or claims.

## Platform Direction

The existing site is on Squarespace. The rebuild target is **Framer**.

Framer should be used for:

- Componentized landing page sections.
- Scroll reveal and subtle parallax.
- Hover states and card interactions.
- Testimonial carousel or variant stack.
- Process-step component variants.
- Sticky CTA behavior.
- Responsive image-led layouts.

Before launch, migrate approved Squarespace images into Framer as optimized assets rather than relying on remote Squarespace CDN URLs.

## Conversion Diagnosis

The earlier custom homes prototype had the right tone but not enough conversion structure. It needed more of the current Heart site’s strongest assets:

- More immediate proof.
- More project photography.
- More direct stress-removal messaging.
- A clearer buyer journey.
- More objection handling before the form.
- A stronger connection between `custom homes` and the actual next step.

The new strategy should use the current site’s conversion spine:

> Custom Homes Built With Intention → Build the home of your dream, without the headache → We take the stress out of building → The Plan / The Team / The Call → Schedule a Consultation.

## Primary Landing Page Promise

### Main headline direction

> Custom Homes Built With Intention.

### Supporting headline / subpromise

> Build your dream home without the headache.

### Supporting copy

> Heart Construction helps Los Angeles homeowners plan and build custom homes with clarity, craftsmanship, transparent communication, and a structured process from early planning through completion.

### Emotional reassurance

> A custom home is a major investment — financially and emotionally. Heart Construction helps you understand what your property supports, what the process requires, and what happens next before construction begins.

## Primary Conversion Action

Primary CTA:

> Schedule a Consultation

Secondary CTAs:

- Start the Conversation
- Explore Our Process
- Call Heart Construction

For paid traffic, the hero should prioritize one primary action. Secondary CTAs can appear as smaller supporting actions.

## Recommended Conversion Page Structure

### 1. Hero: Custom Homes Built With Intention

Goal: Communicate category, outcome, and trust in the first 5 seconds.

Elements:

- Eyebrow: `Los Angeles Custom Home Builder`
- H1: `Custom Homes Built With Intention.`
- Subheadline: `Build your dream home without the headache.`
- Supporting copy about planning, communication, craftsmanship, and completion.
- Primary CTA: `Schedule a Consultation`
- Secondary CTA: `Explore Our Process` or `Call Heart Construction`
- Image-led hero using current Heart project photography.
- Small proof/utility strip below or overlaid:
  - Greater Los Angeles
  - Custom homes and major residential projects
  - Structured process
  - License number / phone if confirmed

Why this matters:

The current site’s hero already has strong conversion language. The rebuild should sharpen it, not replace it with abstract strategy language.

### 2. Immediate Trust / Practical Info Strip

Inspired by Las Ruinas’ hours/address/contact strip, but translated for construction.

Recommended cards:

- **Project focus:** Custom homes and significant residential projects.
- **Where we build:** Pacific Palisades, Malibu, Brentwood, Beverly Hills, Studio City, Calabasas, and Greater Los Angeles.
- **How we start:** Vision, goals, budget, timeline, and property review.
- **Talk to us:** Phone number / consultation CTA if confirmed.

This should appear before long copy so visitors get practical answers quickly.

### 3. Problem / Buyer Anxiety Section

Goal: Show that Heart understands the emotional and logistical stakes.

Headline direction:

> A custom home should feel exciting, not overwhelming.

Points to address:

- Major financial and emotional investment.
- Too many decisions.
- Budget uncertainty.
- Permits, consultants, and scheduling.
- Fear of choosing the wrong builder.
- Previous negative contractor experiences.

Recommended copy angle:

> Designing and building a home can quickly become all-consuming. Heart Construction brings clarity to the process so homeowners can make informed decisions before construction begins.

### 4. Outcome Promise: We Take the Stress Out of Building

Goal: Make the value proposition more concrete and emotional.

Headline direction:

> We take the stress out of building.

Support points:

- Architectural planning coordination.
- Budget and scope alignment.
- Consultant and design-team coordination.
- Construction sequencing.
- Communication and progress tracking.
- Details handled before they become surprises.

This section should feel like a direct answer to the pain section.

### 5. Why Heart Construction / 3 Differentiators

Inspired by Las Ruinas’ numbered `Why` section and the current Heart process.

Recommended three cards:

1. **The Plan**
   - We clarify vision, goals, budget, property constraints, and timeline.
2. **The Team**
   - We coordinate the right professionals, consultants, designers, and decision makers.
3. **The Communication**
   - We keep expectations, next steps, and decisions organized throughout the project.

Alternative third card if preferred:

3. **The Build**
   - We manage sequencing, craftsmanship, problem solving, and completion with care.

### 6. Proof Early: Testimonials and Review Signals

The current site has testimonials that should move higher than the first prototype placed them.

Goal: Provide confidence before asking the visitor to read detailed process content.

Use a testimonial carousel or 2x2 card grid.

Current-site testimonial themes to preserve after confirmation:

- Treated the home like their own.
- Managed permits, design meetings, and landscaping.
- Transparent, responsive, and organized.
- Reliable, stayed on budget, did not cut corners.
- Helped assemble the right team and deliver the vision.

The current static prototype now includes these four current-site testimonials in a slider. Before final Framer launch, confirm the client approves reusing the exact quotes, names, and locations.

### 7. Project Proof / Portfolio Strip

Goal: Show the work before making more claims.

Implementation update: the static prototype now includes a local selected project photography gallery using extracted current-site assets, placed before the broader service-context cards.

Feature image-led cards for current project inventory:

- Malibu
- Hollywood Hills
- Malibu Pier
- La Cuesta
- Hancock Park
- Marina Del Rey

Recommended card content:

- Project name/location.
- Project type if known.
- One short proof line.
- `View Project` link if the Framer build includes project pages.

If only one landing page is in scope, use modal/lightbox or anchor-based project previews instead of full project pages.

### 7.1 Owner / Human Trust Moment

The landing page should include the owner image of Jason and Asaf from the extracted current-site assets. This adds a human touch and reinforces the client-provided positioning around personal involvement, accountability, relationship-driven service, and genuine care. The static prototype places this after the planning differentiator so the page moves from process clarity into the people behind the process before showing the portfolio gallery. The latest revision uses the user-provided integrity quote and origin story copy for this section.

### 8. Custom Home Services / Scope Fit

Goal: Qualify the visitor and keep the page focused.

Primary service:

- Custom Home Construction

Adjacent services to show as related, not equal priority:

- Hillside Construction
- Fire Rebuilds
- Full Home Remodels
- Additions / ADUs
- Outdoor Living

Do not emphasize:

- Handyman work
- Repairs
- Standalone trade work
- Flooring-only projects
- Paint-only projects
- Window-only or HVAC-only projects

### 9. Signature Process: From Vision to Build

Goal: Convert uncertainty into a clear path.

Recommended process sequence:

1. **Project Fit Conversation**
   - Goals, property, decision makers, timeline, and fit.
2. **Strategic Visioning / The Plan**
   - Vision, budget, schedule, constraints, and priorities.
3. **Team Alignment / The Team**
   - Architects, designers, consultants, and pre-construction collaborators.
4. **Scope, Budget, and Timeline Alignment**
   - Clarify cost drivers and expectations before construction.
5. **Construction Management**
   - Sequencing, communication, progress, quality, and problem solving.
6. **Completion With Care**
   - Final details and homeowner experience.

Framer implementation:

- Use horizontal step cards on desktop.
- Use sticky stepper or accordion on mobile.
- Use component variants for step details.

### 10. Qualification Section

Goal: Improve lead quality and reduce poor-fit inquiries.

Headline direction:

> Is Heart Construction the right fit for your project?

Good-fit bullets:

- You are planning a custom home or significant residential project.
- You value planning, communication, and long-term quality.
- You want an experienced partner before construction begins.
- You are making decisions with family, designers, architects, or consultants.

Not the right fit:

- Small repairs.
- Handyman work.
- Single-trade projects.
- Lowest-bid-only selection.

This supports the client’s stated desire to focus on larger comprehensive projects.

### 11. FAQ / Objection Handling

The first prototype lacked a conversion FAQ. The static prototype now adds an FAQ before the final form focused on budget clarity and construction-cost objection handling.

Included / recommended questions:

1. **When should we contact Heart Construction?**
   - Early, before scope, budget, and timeline are locked.
2. **Can you help before construction begins?**
   - Yes, pre-construction planning is a core part of the value.
3. **Do you work with architects and designers?**
   - Yes, alignment between stakeholders is part of the process.
4. **How do you help with budget uncertainty? / How do we stay on budget?**
   - By discussing cost drivers, scope, priorities, timeline, and expectations early.
5. **What are the biggest cost drivers?**
   - Scope, property complexity, structural needs, permitting, finish selections, consultant coordination, sequencing, and timeline expectations.
6. **How can we avoid surprises?**
   - Through early planning, documentation, realistic expectations, consistent communication, and clear visibility into scope, budget, timeline, and next steps.
7. **Do you handle remodels or only custom homes?**
   - Custom homes first for this page; comprehensive remodels/additions may be discussed if they are significant projects.
8. **What happens after I submit the form?**
   - Heart reviews project details and follows up to schedule a consultation or site/project fit conversation.

### 12. Final CTA + Consultation Form

Goal: Make the next step feel clear, qualified, and low-friction.

Headline direction:

> Ready to start planning your custom home?

Supporting copy:

> Tell us about your goals, property, timeline, and budget. Heart Construction will help you understand the next steps and whether we are the right fit for your project.

Form fields:

- Name
- Email
- Phone
- Project city/neighborhood
- Project type
- Estimated budget
- Desired timeline
- Brief project description

Microcopy below button:

> After you submit, our team will review your project details and follow up to schedule the right next conversation.

Primary button:

> Schedule a Consultation

## Recommended Framer Component Map

1. `HeaderNav`
2. `HeroCustomHomes`
3. `TrustInfoStrip`
4. `ProblemEmpathySection`
5. `StressOutOutcomeSection`
6. `WhyHeartThreeCards`
7. `TestimonialProofCarousel`
8. `PortfolioProjectStrip`
9. `ScopeFitServicesGrid`
10. `SignatureProcessStepper`
11. `QualificationFitSection`
12. `FAQAccordion`
13. `FinalConsultationForm`
14. `Footer`
15. `StickyCTA`

## Visual Direction

Blend the two references:

From Heart Construction current site:

- Premium Los Angeles residential photography.
- Existing logo and brand assets.
- Editorial black/cream/red accent feeling where appropriate.
- Portfolio and testimonial credibility.

From Las Ruinas:

- Warm editorial pacing.
- Large serif headlines.
- Calm, luxury spacing.
- Numbered proof sections.
- Elegant practical information cards.
- FAQ and final CTA discipline.

Avoid:

- Generic contractor stock layouts.
- Overly abstract visuals that hide the actual work.
- Too many equal CTAs.
- Burying proof below the form.
- Conversion sections that read like internal strategy rather than homeowner reassurance.

## SEO / Paid Search Focus

Primary page target:

> Los Angeles Custom Home Builder

Supporting keyword themes:

- Los Angeles custom homes
- Custom home construction Los Angeles
- Los Angeles residential builder
- Los Angeles luxury home builder
- Pacific Palisades custom home builder
- Malibu custom home builder
- Brentwood custom home builder
- Studio City custom home builder
- Calabasas custom home builder

Meta title draft:

> Heart Construction | Los Angeles Custom Home Builder

Meta description draft:

> Heart Construction helps Los Angeles homeowners plan and build custom homes with clarity, craftsmanship, transparent communication, and a structured process from early planning through completion.

## Migration / Redirect Notes

Because the current site has established Squarespace routes, the Framer rebuild should plan redirects for any changed URLs.

Current routes observed in the scrape include:

- `/signature-approach`
- `/our-story`
- `/portfolio`
- `/design-build`
- `/what-we-do`
- `/where-we-build`
- `/contact-us`
- `/service-custom-homes`
- `/service-full-remodel`
- `/service-adus`
- `/service-outdoor-living`
- Location pages for Pacific Palisades, Studio City, and Calabasas
- Project pages such as Malibu, Hollywood Hills, Malibu Pier, La Cuesta, Hancock Park, Marina Del Rey

If the custom homes page replaces or consolidates any of these, redirects must be mapped before launch.

## Content Needed Before Final Framer Build

- Confirm approved Heart logo source file.
- Confirm which current Squarespace project images can be reused.
- Confirm testimonial reuse and exact names/locations.
- Confirm phone number(s), email, and license number.
- Confirm form destination / CRM / Framer form handling.
- Confirm whether direct scheduling is required.
- Confirm priority neighborhoods for paid search.
- Confirm whether project pages are in scope for Framer Phase 1.
- Confirm redirect map from Squarespace to Framer.

## Version Control

This document is part of the Heart Construction delivery workspace under `deliver/charly-agency/heart-construction/`. Follow the root repository version control rules in `SYSTEM_RULES.md` and the Deliver rules in `deliver/DELIVER_SYSTEM_RULES.md`. Do not commit secrets, `.env` files, credentials, or heavy binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
