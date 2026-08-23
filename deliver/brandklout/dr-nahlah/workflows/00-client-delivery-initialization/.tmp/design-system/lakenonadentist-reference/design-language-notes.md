# Design Language Notes — lakenonadentist.com

What the client responded to, read off the captured screenshots. Written from the
**visual** capture only — no CSS was inspected, so values below are observations and
estimates to be re-derived during design, not extracted tokens.

> The reference belongs to another practice (Makris Dental Prosthodontics). These
> notes describe *patterns and principles* to reinterpret for Dr. Nahlah. Nothing —
> copy, imagery, logo, or layout verbatim — carries over.

## The short version

A **warm, dark, luxury-clinical** look. Black cinematic hero + gold/tan accents +
all-serif typography + generous whitespace. It reads closer to a high-end med-spa or
hotel than to a typical dental site — which is the point: it signals premium
specialist care, not volume family dentistry.

## Typography

- **All-serif system.** Display *and* body are serif — a high-contrast Didone/Bodoni-ish
  display face for headings, and a more readable transitional serif for body copy.
  No sans anywhere except tiny UI labels.
- Headlines are **large, tight-leading, sentence case**, and break across 2 lines
  deliberately ("Smile Makeover Services / in Orlando, FL").
- Nav and small labels use **letterspaced uppercase serif** at small sizes — the main
  source of the "refined" feel.
- Body copy in cards is **centered**; long-form body elsewhere is left-aligned.

**Note for our build**: an all-serif stack at small sizes is a legibility risk,
especially for the older implant demographic. Recommend keeping the serif display but
testing a highly-legible serif (or a restrained sans) for body and forms.

## Color

| Role | Observation |
| :--- | :--- |
| Hero / header | Near-black, with full-bleed photography fading into it |
| Primary accent | Warm gold → tan **gradient** (buttons, rules, labels, icons) |
| Card fill | Cream → tan vertical gradient, subtle |
| Page background | Off-white / very light warm grey |
| Footer | Light **marble texture** background |
| Text | Near-black on light; white on dark |

The palette is essentially **black + gold + cream**. There is no blue anywhere — a
deliberate break from dental-industry convention, and likely a big part of why the
client picked it.

## Layout Patterns Worth Borrowing

1. **Cinematic hero** — full-bleed dark photo, headline left-aligned at roughly 40%
   width, a thin vertical gold rule to the left of the text block, and two stacked CTAs
   (`CALL US` solid gold + `REQUEST A CONSULTATION` outline). Consistent on every page,
   only the photo and headline change. Cheap to template, looks expensive.
2. **Hub → spoke card grids** — service hub pages are little more than a hero plus a
   3-across card grid, each card = title, 3–4 line description, `LEARN MORE ›`. Cards
   have a tan gradient fill and a soft drop shadow. Hub pages are short (~2300px);
   depth lives in the spokes.
3. **Location landing pages** — `/lake-nona-dentist/` with 13 nested service pages
   beneath it. **The single most transferable idea for Dr. Nahlah**, who has two
   offices and currently no location pages at all.
4. **Marble-texture footer** — centered logo, an italic "Proudly serving [cities]"
   line, then a 3-column band (Get Directions / Hours / Social). The service-area line
   is doing real local-SEO work while looking like a brand statement.
5. **Floating Google reviews badge** — persistent "Top Rated on Google 4.9 ★ 279
   reviews" chip, right edge, dismissible. Continuous social proof without occupying
   layout space.
6. **Accessibility widget** — persistent round button, bottom-left. Third-party
   overlay; worth a scope discussion (these are contested for real ADA compliance).

## Rhythm & Density

- Very **generous vertical whitespace** — card grids float in large empty bands.
- Page heights are modest for the industry: hubs ~2300px, deep service pages
  ~9000–10000px, home ~16000px.
- Content per page is **much lighter than Dr. Nahlah's current site** (900–2200 words
  per page today). Expect to cut and restructure copy rather than port it. This is the
  main content-strategy tension in the project.

## Things Not to Copy

- **All-serif body copy at small sizes** — legibility risk for the target demographic.
- **Text over busy photography** in the hero — several captures have the headline
  competing with the image; needs a stronger scrim in our version.
- **Overlay accessibility widget** as a substitute for real accessible markup.
- The **near-identical location pages** — 6 city pages × 13 nested services reads as
  doorway-page territory. For two real offices, build two genuinely differentiated
  pages.

## Open Design Questions

1. Dr. Nahlah's brand has no established palette in the current site review — is
   black/gold/cream adopted wholesale, or adapted to existing brand equity?
2. Is new photography in scope? This design **lives or dies on photography quality** —
   the reference uses moody, professionally-lit clinical and portrait shots. The current
   site's imagery is much flatter.
3. Two locations: one hero with a location switcher, or separate location pages
   following the reference's pattern?

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md).
