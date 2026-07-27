# Heart Construction v2 — Pre-Launch Checklist

This version (`final-design-v2`) applies the CRO optimizations from `../cro-optimization-plan.md`.
All internal build notes were removed from the visible page. The items below still need
**real client data** before launch — each is flagged with a `TODO[launch]` comment in the code.

## Must supply before going live
- [ ] **Business phone number** — replace placeholder `(323) 555-0198` in 3 places: hero `tel:` link, contact card, footer. (Intentionally left as placeholder per request.)
- [ ] **Form endpoint** — connect `action="{{FORM_ENDPOINT}}"` to the confirmed CRM / Squarespace / booking flow, and add an email/SMS notification to Jason & Asaf. Remove the local "thank you" fallback branch in `script.js`. (Intentionally left as placeholder per request.)
- [ ] **GTM container** — paste the real Google Tag Manager snippet in `<head>` and replace `GTM-XXXXXXX`. Events already fire to `dataLayer`: `cta_click`, `click_to_call`, `generate_lead`, `lead_form_invalid`.
- [ ] **CSLB license number** — add to hero trust-row and footer (`Licensed & insured` slots).
- [ ] **Testimonials** — confirm wording with client; add real homeowner photos where permitted (avatar initials are a placeholder).

## Optional / nice to have (recommended in the plan)
- [ ] Add a direct calendar-booking option (Calendly/Cal.com) alongside the form.
- [ ] Add Google/Houzz rating badge + review count near the form.
- [ ] Add quantified proof stats (years in business, # homes built) once confirmed.
- [ ] Persist `gclid`/`utm_*` into hidden form fields for ad attribution.
- [ ] Add Microsoft Clarity or Hotjar for heatmaps/session replay.

## Changes already applied in v2
- Removed all visible internal build notes (projects/testimonials/form/footer meta copy).
- Rewrote meta headings into customer-facing copy.
- Hero trust-row → proof-oriented (licensed/insured, owner-led, area).
- Added CTA micro-reassurance + "free, no-obligation consultation" risk reversal.
- Unified CTA language around "Book … consultation".
- Reduced required form fields to Name, Email, Phone, Project type; made City/Budget/Timeline/Message optional.
- Fixed budget ranges to match a high-ticket audience ($500K–$5M+).
- Testimonials restructured with star rating + name + location + avatar.
- Removed duplicate portfolio image (swapped in `project-pool-courtyard.webp`).
- Tightened mobile hero headline so the primary CTA sits in view.
- Speed: hero image preloaded + `fetchpriority="high"`; below-fold images `loading="lazy"`.
- SEO: canonical, `GeneralContractor` + `FAQPage` JSON-LD.
- Analytics scaffolding + conversion events wired in `script.js`.
- Rebuilt footer with real contact links + service-area copy.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
