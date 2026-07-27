# Heart Construction — Conversion Rate Optimization Plan

**Page analyzed:** `04-design/.tmp/final-design/index.html` (Los Angeles custom-home builder landing page)
**Goal of the page:** Generate qualified consultation leads for high-ticket ($1M+) custom home / hillside / remodel / fire-rebuild projects.
**Date:** 2026-06-22

---

## 1. How this page should be judged

This is a **high-ticket, considered-purchase, local-service** landing page. The CRO playbook differs from a SaaS free-trial page:

- The buyer is risk-averse and skeptical — they are about to hand a stranger seven figures and 12–24 months of their life. **Trust and proof are the #1 conversion lever**, more than copy cleverness.
- Longer pages with detailed proof, FAQs, and social proof convert *better* here, not worse — so the page length is fine; the issue is *what* fills it.
- There are two valid conversions: **(a) submit the consultation form** and **(b) call/book**. Both must work flawlessly and be tracked.

Research backing (see Sources at bottom): trust signals near CTAs lift conversions ~34%; form-field reduction lifts completion 30–120%; benefit-specific CTAs beat generic ones (one case: +127% qualified leads); mobile is ~83% of traffic but converts at roughly half desktop, so mobile and page-speed fixes are disproportionately valuable.

---

## 2. What's already strong (keep it)

- **Hero headline + lede + benefit-specific primary CTA** ("Start Planning Your Custom Home") — outcome-focused, not generic. Good.
- **Single dominant conversion goal** with a persistent sticky CTA and nav CTA — low decision fatigue.
- **Real project photography, owner photo, FAQ section, service-area coverage** — all the right *ingredients* for a trust-heavy page.
- **Accessibility basics**: skip link, labeled form fields, `prefers-reduced-motion` handling, ARIA on tabs/slider.
- **Responsive**: clean mobile stack, WebP images.

---

## 3. Launch-blocking problems (P0 — fix before any traffic)

These are not optimizations; the page **cannot convert** in its current state.

| # | Problem | Where | Why it kills conversions |
|---|---------|-------|--------------------------|
| P0-1 | **Internal build notes are visible to visitors.** Meta copy leaked into the live page. | Projects subhead "…help the custom homes landing page feel tangible, premium, and trustworthy" (`index.html:226`); Project-types subhead "The custom homes landing page should support high-value residential inquiries…" (`:294`); Testimonials subhead "These testimonials come from the current Heart Construction site and should be confirmed for final Framer launch…" (`:326`); Form note "This form is a front-end draft…" (`:486`); Contact note "Placeholder number — replace…" (`:417`); Footer "Next required details" todo list (`:507-513`) | Instantly destroys credibility — reads as an unfinished demo. A buyer spending $1M will leave. |
| P0-2 | **Fake phone number** `(323) 555-0198` | `:56`, `:416` | The phone CTA is a primary conversion path and it goes nowhere. |
| P0-3 | **Form has no real endpoint** (`action="{{FORM_ENDPOINT}}"`, JS only shows a "draft submitted locally" message) | `:421`, `script.js:173-190` | Every lead submitted is silently lost. Zero conversions are actually captured. |
| P0-4 | **No analytics or conversion tracking** of any kind | whole page | You can't optimize what you can't measure; ad spend can't be attributed; no baseline. |
| P0-5 | **Meta heading is sales-y meta, not customer copy:** "Real residential work should do more of the selling." | `:225` | Talks about the page to the marketer, not to the homeowner. |

---

## 4. High-impact optimizations (P1 — do before/with launch)

### 4.1 Trust & credibility (biggest lever for high-ticket)
The page *describes* trustworthiness but shows little *hard proof*. Add, ideally above the fold and again near the form:

- **CSLB contractor license number** (legally expected for CA builders; major trust signal). Add to hero trust-row and footer.
- **Concrete proof numbers**: years in business, # of homes built/completed, total $ value managed, on-time/on-budget rate. Replace the soft hero trust-row labels ("Before you build / Project focus / Market" at `:58-71`) with quantified proof ("X homes delivered", "Y years in LA", "Licensed & insured — CSLB #…").
- **Testimonials: add full names + photos + project/neighborhood + ideally a star rating.** Current cards are quote-only with first name + city (`:335-354`), which reads as low-credibility. Link to Google/Houzz reviews if they exist.
- **Recognizable trust marks**: Google rating badge, Houzz/Yelp, "Licensed • Bonded • Insured", any awards or press. Place one cluster directly beside the form CTA (research: trust signals near CTAs reinforce confidence at the decision moment).
- **Remove duplicate portfolio image**: `project-la-cuesta-kitchen.webp` is used twice (`:237` and `:279`), making the portfolio look thin. Swap in one of the unused assets (`project-pool-courtyard.webp`, `project-pool-guesthouse.webp`).

### 4.2 Form optimization (lift: 30–120% in research)
Current form = **8 fields, 5 required** (name, email, phone, city, project type, budget, timeline, message). That's heavy for a first touch.

- **Reduce the first ask.** Make only Name, Email, Phone, and Project type required; demote City/Budget/Timeline/Message to optional or to a **step 2** (progressive profiling). Multi-step forms feel lighter and often out-convert single long forms for high-ticket.
- **Fix the budget ranges to match positioning.** "Under $250K" / "$250K–$500K" (`:462-463`) contradict a $1M+ custom-home audience and attract unqualified leads. Start ranges where the real work starts (e.g. $500K–$1M, $1M–$2M, $2M–$5M, $5M+).
- **Add a privacy/no-spam reassurance line** under the submit button ("We'll only use this to plan your consultation. No spam.").
- **Add inline validation + a real success state** (replace the placeholder JS) and a thank-you redirect/confirmation that fires the conversion event.

### 4.3 Offer a direct booking path
High-intent buyers want to book *now*, not wait for a callback. Add a **"Book a free 30-min consultation"** calendar embed (Calendly/Cal.com) as an alternative to the form, and make the offer explicit and low-risk: **"Free, no-obligation consultation."** Risk-reversal language measurably lowers the barrier.

### 4.4 CTA consistency & specificity
- The same action is labelled three different ways: nav "Schedule a Consultation" (`:42`), hero "Start Planning Your Custom Home" (`:55`), sticky "Plan your custom home" (`:492`), form button "Request a Custom Home Consultation" (`:485`). Pick **one verb system** and make the value explicit (e.g. everywhere: "Book your free consultation"). Consistency reduces cognitive load; benefit-specific beats generic.
- Add a **micro-reassurance under the hero CTA** ("Free consultation • Usually responds within 1 business day").

### 4.5 Mobile (≈83% of traffic, converts ~half of desktop)
- On mobile the hero `h1` is `clamp(52px, 16vw, 76px)` (`styles.css:771`) and pushes the primary CTA to/below the fold. Tighten the headline size or trim the lede so **the primary CTA is visible without scrolling**.
- Confirm tap targets ≥48px (buttons are 52px min — good; verify nav links and form selects).
- The sticky bottom CTA (`.sticky-cta`) overlaps the form submit on small screens — verify it doesn't cover the final CTA.

### 4.6 Page speed (every 100ms ≈ 8–10% conversion swing)
- Add `width`/`height` (or aspect-ratio) to all `<img>` to prevent layout shift (CLS).
- Add `loading="lazy"` to all below-the-fold images (entire projects gallery, owners photo); **preload the hero image** (`project-evening-patio.webp`) and mark it `fetchpriority="high"` so LCP lands fast.
- Add responsive `srcset`/`sizes` for the large gallery and hero images.
- Self-host or `font-display: swap` for Inter (currently relies on system fallback chain — fine, just confirm no FOUT/CLS).

### 4.7 SEO / structured data (drives *qualified* traffic, compounding)
- Add **JSON-LD**: `LocalBusiness`/`GeneralContractor` (name, areaServed, telephone, license), `FAQPage` (the 6 FAQs are already on-page — free rich-result eligibility), and `AggregateRating`/`Review` if reviews are real.
- Add a canonical URL and ensure the `og:image` points to a real hero asset.

---

## 5. Measurement & tracking plan (do first — it's the baseline)

1. **Install GA4 + a tag manager** (GTM) so events can change without code deploys.
2. **Track conversion events:** `generate_lead` on form submit (server-confirmed, not just click), `click_to_call` on the tel: link, `book_consultation` on calendar booking, plus CTA-click and scroll-depth events.
3. **Capture ad attribution:** persist `gclid`/`utm_*` into hidden form fields so leads tie back to campaigns.
4. **Connect a real backend:** form → CRM (or Squarespace/Make/Zapier) + instant email/SMS notification to Jason/Asaf. Speed-to-lead is decisive for high-ticket.
5. Add **Microsoft Clarity or Hotjar** (free) for heatmaps + session replay to see where users drop.

---

## 6. A/B test roadmap (after launch + baseline, one variable at a time, to 95% significance)

| Priority | Hypothesis to test | Metric |
|----------|--------------------|--------|
| 1 | Hero trust-row of **quantified proof** (homes built / years / license) beats the current generic descriptors | Form-start rate |
| 2 | **Short 4-field form (or 2-step)** beats the current 8-field form | Form-completion rate |
| 3 | **Direct calendar booking** offered alongside the form beats form-only | Total leads (form + booking) |
| 4 | **"Free, no-obligation consultation" risk-reversal** microcopy under CTA vs. none | CTA click-through |
| 5 | Hero CTA copy variants ("Book your free consultation" vs. "Start planning your custom home") | CTA CTR |
| 6 | Testimonials **with photos + names + rating** vs. quote-only | Scroll-through + lead rate |

---

## 7. Suggested execution order

1. **P0 launch blockers** (Section 3) — strip internal notes, real phone, real form endpoint, analytics. *Non-negotiable before any traffic.*
2. **Tracking baseline** (Section 5) — so every later change is measurable.
3. **Trust + form + booking + mobile** (4.1–4.5) — the highest-ROI on-page changes.
4. **Speed + SEO/schema** (4.6–4.7) — compounding, lower urgency.
5. **A/B program** (Section 6) — continuous, once there's enough traffic for significance.

---

## Sources (CRO research)
- [Landing Page Best Practices That Convert in 2026 — Lovable](https://lovable.dev/guides/landing-page-best-practices-convert)
- [10 Conversion Rate Optimization Best Practices for 2026 — Aimers](https://aimers.io/blog/conversion-rate-optimization-best-practices)
- [25 Landing Page Best Practices That Convert in 2026 — Landingi](https://landingi.com/landing-page/41-best-practices/)
- [Landing Page CRO Strategy: A Practitioner's Guide (2026) — Apexure](https://www.apexure.com/blog/landing-page-cro-strategy)
- [Lead Generation Landing Page Best Practices 2026 — Heyflow](https://heyflow.com/blog/lead-generation-landing-page-best-practices/)
- [Lead Generation & CRO for Contractors — Growth Digital Hub](https://growthdigitalhub.com/services/cro-for-contractors/)
- [100+ Landing Page Statistics You Should Know (2026) — involve.me](https://www.involve.me/blog/landing-page-statistics)

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
