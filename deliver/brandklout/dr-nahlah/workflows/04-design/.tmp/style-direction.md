# Style Direction — Dr. Nahlah Home Page

First-draft design direction for the home page. Coded package lives in
[`final-design/index.html`](./final-design/index.html); tokens in
[`design-tokens.json`](./design-tokens.json).

## The brief, restated

> Build the home page like an award site. Use the example site as **structure**, not
> as the final design direction. Keep their current brand guidelines and elevate with
> high interaction, scroll animation and parallax. Mobile responsive. Home only.

## Where the brand came from

Nothing here is invented. Each decision traces to something the client already owns.

| Token | Value | Source |
| :--- | :--- | :--- |
| Brand gold | `#AB9E6A` | Sampled directly from the client's wordmark — the dominant opaque pixel across 24,551 samples |
| Gold tints | `#D4CDB2` / `#8A7E4E` | Lighter and darker stops present in the wordmark's own gradient |
| Body type | Raleway | Already the primary `font-family` declared on drnahlah.com |
| Display type | Playfair Display | Closest Google-hosted match to the didone letterforms in the existing wordmark |
| Black | `#0B0B0C` | The logo is supplied on transparent for dark placement; near-black preserves the gold's warmth better than pure `#000` |

The happy accident: **the client's existing brand is already gold**, which is why the
reference template resonated with them. We are not importing the reference's palette —
we are using the client's own, which happens to land in the same territory.

## What we took from the reference — and what we did not

**Taken (structure only):**
- Hero → trust signals → doctor authority → before/after proof → service grid → process → video → testimonial → locations → CTA
- Hub-and-spoke service grid rather than a long scrolling list
- Location blocks treated as first-class content
- The idea that proof (before/after) belongs high on the page, not buried in a gallery

**Deliberately not taken:**
- Its beige-on-beige palette and marble textures — we use the client's black/gold
- All-serif body copy — a legibility risk for an implant demographic; body is Raleway
- Its static, low-interaction feel — the brief asked for the opposite
- Any of its copy, imagery or layout verbatim; that is a different practice

## Design rationale

**Positioning drives the design.** The current site sells "dentistry." The differentiator
that actually matters is that Dr. Nahlah is a *board-certified prosthodontist* — one of
twelve ADA-recognised specialties, three extra years of training. The page is built
around that single claim: the H1 says "rebuilt by a **specialist**," the statement
section explains what a prosthodontist is, and the process section shows planning-first
sequencing. That is the argument the old site never makes.

**Dark, not clinical.** Implant patients are usually embarrassed and have often been
told no elsewhere. A bright, chirpy family-dentistry look reads wrong. Black + gold
reads as considered, expensive, discreet — closer to a specialist consultancy.

**Proof over promises.** The single most persuasive asset the practice owns is 23
matched before/after case pairs. The drag-to-reveal slider is the page's signature
interaction because it makes the strongest evidence physically interactive.

## Motion system

Twelve interactions, all vanilla JS — no animation library, so this converts to Webflow
interactions cleanly and adds zero third-party weight.

| Interaction | Where | Behaviour |
| :--- | :--- | :--- |
| Preloader | Entry | Wordmark fade + 0–100 counter, curtain wipes up. Hard 3.2s ceiling so the page can never be trapped behind it |
| Line masks | Hero H1 | Lines rise out of overflow masks, 110ms stagger |
| Hero parallax | Hero | Portrait translates at 0.14× scroll and scales subtly |
| Credential ticker | Below hero | Infinite marquee, row cloned in JS for a seamless loop, pauses on hover |
| Word brighten | Statement | Copy lights word-by-word, driven by scroll position |
| Counters | Stats | Count up once on first view, cubic ease-out |
| Compare slider | Results | Pointer drag + keyboard, three swappable cases |
| Card reveal | Services | Image at 30% resolves to full colour, de-saturates on exit, gold rule extends |
| Sticky rail | Process | Left column pins while steps scroll past |
| Film scale | Video | B-roll scales 1.14 → 1.0 within a fixed frame; plays only while visible |
| Story drift | Testimonial | Image counter-drifts against scroll |
| Magnetic CTAs | Buttons | Drift toward the cursor — pointer-fine devices only |

**Accessibility.** `prefers-reduced-motion` collapses every transform to an instant
final state, removes the preloader, and stops the marquee. The compare slider is a
real `role="slider"` with arrow-key control and live `aria-valuenow`. Focus styles use
the gold light tint at 2px with offset.

## Responsive behaviour

Verified at 390px and 1440px, zero horizontal overflow at both.

- Type scales fluidly via `clamp()` — no fixed breakpoint jumps
- Services 3-col → 2-col → 1-col; locations and footer collapse in step
- Desktop nav swaps to a burger below 1024px, opening a circular-reveal drawer with
  staggered links and body scroll lock
- Hero portrait drops to 55% opacity behind the text on small screens instead of
  competing with it
- The compare slider switches from 16:9 to 4:3 on mobile so it keeps real presence
- Magnetic buttons disabled on touch (`hover:hover and pointer:fine` only)

## Verification

`interaction-test.mjs` drives a headless Chrome through **31 functional checks** —
font loading, preloader release, reveal firing after a full-page scroll, counter final
values, slider drag *and* keyboard, case-tab swaps, video playback, broken images,
horizontal overflow at both widths, drawer open/close/aria, and reduced-motion. All 31
pass. Screenshots in `screenshots/`.

## Open questions for the client review

1. **Stats are placeholders.** "25+ years", "10,000+ implants", "4.9 rating" are
   plausible but unverified. Real figures needed before this goes anywhere near
   production — or the section gets cut.
2. **The testimonial quote** is lifted from the current site's All-on-4 page
   ("My smile held me back…" — Melanie). Confirm attribution and consent.
3. **Patient photo consent** for the before/after cases — still unconfirmed, and this
   design puts them front and centre.
4. **Logo is raster.** At hero scale on a 2x display the PNG will soften. The vector
   original is still outstanding.
5. **Phone conflict** — the McLean "current patients" number differs between the old
   site's contact page and its footer. This build uses the footer number,
   (703) 448-3312. Needs confirming.
6. **Copy is a design draft, not approved content.** It is written to demonstrate the
   positioning; `06-content-seo` owns the final wording.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- `final-design/` HTML/CSS/JS is committed; `final-design/assets/` binaries and
  `screenshots/` are gitignored and sync to the VPS.
