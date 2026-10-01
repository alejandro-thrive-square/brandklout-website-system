# Livewell Dental · five visual directions

The concept deck follows the Hackensack model (https://hackensack-dental-implants.webflow.io/): an
index page presents the directions, and each direction is a full homepage on its own subpage. All
five carry the **same content in the same order** ([content.md](./content.md)); only the style
changes: palette, type, layout idiom, motion signature. The client picks one, and that page becomes
the design authority for scenario 0 step 03.

Every direction keeps a visible relationship to the current Livewell identity (navy ink, gold accent,
classical caps), so the choice is how far to move, not whether to rebrand. **All five are light-ground**
(Brandklout rule: dark sites do not convert); the Hackensack set's "Dark Luxury" has no equivalent here.

| # | Slug | Name | Tag | Display + text | Palette (ink · grounds · accent) |
| --- | --- | --- | --- | --- | --- |
| 01 | `concept-01-refined-heritage` | Refined Heritage | Recommended | Marcellus + Figtree | `#0b2c41` · `#fbf9f5` `#f3eee6` `#ffffff` `#e8ecf1` · gold `#d3aa5a` (text `#7d5f22`) |
| 02 | `concept-02-diagnostic-precision` | Diagnostic Precision | Precision-led | Hanken Grotesk + IBM Plex Mono | `#13293a` · `#ffffff` `#f2f5f6` `#e7eef0` · teal `#376b7b`, gold hairline `#d3aa5a` |
| 03 | `concept-03-living-well` | Living Well | Patient-led | Fraunces + Outfit | `#2b2a33` · `#fbf7f1` `#f2e9dc` `#ffffff` `#eaeee8` · clay `#c0855a` (text `#8a4f2a`), navy `#0b2c41` |
| 04 | `concept-04-the-journal` | The Journal | Design-led | Cormorant Garamond + Space Grotesk | `#101820` · `#fcfbf8` `#f4f1ea` `#ffffff` · gold `#d3aa5a` (text `#7d5f22`), one red-brown rule `#8c3b2a` |
| 05 | `concept-05-quiet-luxury` | Quiet Luxury | Hospitality-led | Bodoni Moda + Jost | `#2a2c2b` · `#f7f4ef` `#ece6dc` `#ffffff` `#e4e7e1` · champagne `#c9ad7a` (text `#6f5a33`), sage `#8a9886` |

### 01 · Refined Heritage
The current brand, done properly. Navy and gold kept, Marcellus caps kept, everything else lifted:
real scale contrast, generous ivory grounds, a gold rule that draws itself through the page as a
continuity device. Dr. Chris is the hero (portrait with a split-text headline), credentials sit as a
calm logo band. Signature: the gold rule. It connects chapters and becomes the drag handle of the
before/after compare. Feels like: established, trustworthy, the same practice one step up.

### 02 · Diagnostic Precision
Dentistry as a Kois-trained diagnostic discipline. A strict 12-column grid, hairlines, monospaced
labels (`01 / LISTEN`, `FIG. 03`), measurements and numbered steps. Cool white and mist grounds,
teal as the working accent, gold only as a hairline. Photography is cropped tight and documentary.
Signature: a pinned "plan before treatment" sequence that scrubs through the six pillars as a
numbered diagnostic readout, with a progress scale like an instrument. Feels like: specialist,
exact, "you will understand why".

### 03 · Living Well
The practice's own name as the idea: life after treatment. Warm cream and sand, soft rounded
frames, a humanist serif with italics, the clay accent next to the navy. People first: patient
portraits large, the team warm, reviews prominent. Signature: a pinned horizontal "Life before /
Life after" chapter, the ten list items as cards that cross over from one state to the other as
you scroll. Feels like: warm, reassuring, about you, not about teeth.

### 04 · The Journal
An editorial magazine. A masthead-style nav, very large high-contrast serif statements against a
small grotesk, asymmetric layouts, overlapping images, numbered "features", pull quotes in the
margin. Paper white grounds, near-black ink, gold as the only colour plus one red-brown rule.
Signature: the H1 set huge and scaling down as the page scrolls into a masthead; images reveal with
clip-path wipes. Feels like: design-led, confident, memorable.

### 05 · Quiet Luxury
The office (Dexios interiors) as the brand: hospitality, calm, a boutique-hotel tone. Linen and stone
grounds, champagne and sage, arched and pill-shaped image masks, slow parallax, lots of air.
Bodoni Moda in light weights, Jost in tracked caps. Signature: "A space designed for your comfort"
becomes a pinned walk-through: rooms crossfade and scale as you scroll with a room caption.
Feels like: serene, premium, an experience rather than an appointment.

## Rules every concept follows

- **Content**: everything in `content.md`, in that order (14 sections). Shorten to fit the layout;
  never invent claims, numbers, names or credentials. No em dashes. No wall of text (~110 words max
  per run; fold or cut).
- **Light grounds only.** Ink is the dark colour; accent is a fill and a rule; accent TEXT uses the
  deep variant. A dark scrim is allowed only behind a playing film or under white type on a photo.
- **Type**: paste the house fluid root verbatim (`node scripts/fluid-root.mjs --css`: 16px flat
  from 479 to 1440, 12px at 320, 18px at 1920). Everything in `rem`, no `px` and no `clamp()` font
  sizes. Breakpoints 1279 / 991 / 767 / 479 only. Google Fonts only.
- **Motion** (the client reviews this; a static page is rejected): GSAP 3.13 + ScrollTrigger +
  SplitText from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/{gsap,ScrollTrigger,SplitText}.min.js`).
  Split-text hero reveal, at least three scrubbed or pinned chapters, clip-path or scale image
  reveals, magnetic or cursor-aware CTAs, the direction's signature moment. No ScrollSmoother, no
  IntersectionObserver reveals. `prefers-reduced-motion` honoured: everything visible and static.
  Content must be readable if JS fails (no `opacity:0` in CSS without a `.js` guard).
- **Working controls**: the before/after compare drags (pointer + keyboard), the mobile menu opens,
  film cards play, accordions open. Links go to the live site's real URLs (`https://www.livewelldentalva.com/...`).
- **Self-contained**: one HTML file, inline `<style>` and `<script>`, class prefix per concept
  (`r1-`, `d2-`, `l3-`, `j4-`, `q5-`) so any two could share a host without collisions. Images
  hotlinked from the Webflow CDN as listed.
- **Presentation chrome** (identical on all five, outside the design): a fixed pill top-left
  `← All 5 concepts` linking to `index.html`, a fixed pill top-right `Concept 0N · <Name>` (hidden
  under 767), and a 3px reading-progress bar along the top in the concept's accent. Class prefix
  `deck-`. They must not cover the site nav: offset the nav or place the pills at the bottom on mobile.
- **No shared shapes**: these are Livewell's own designs. Do not copy the Hackensack concept markup
  or another client's sections; techniques may repeat, section shapes may not, and the five must
  differ from each other in layout, not just colour.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md).
