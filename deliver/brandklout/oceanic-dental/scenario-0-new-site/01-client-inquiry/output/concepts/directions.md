# Oceanic Dental · five visual directions

The concept deck follows the Hackensack model (an index page presents the directions, each direction
is a full homepage on its own subpage), as built for Livewell. All five carry the **same content in
the same order** ([content.md](./content.md)); only the style changes: palette, type, layout idiom,
motion signature. The client picks one, and that page becomes the design authority for scenario 0
step 03.

Every direction keeps a visible relationship to the current Oceanic identity (teal on aqua and sand,
wide display caps, the flower mark, the coast), so the choice is how far to move, not whether to
rebrand. **All five are light-ground** (Brandklout rule: dark sites do not convert).

| # | Slug | Name | Tag | Display + text | Palette (ink · grounds · accent) |
| --- | --- | --- | --- | --- | --- |
| 01 | `concept-01-coastal-concierge` | Coastal Concierge | Recommended | Oceanic Font (their own) + Nunito Sans | `#1a3743` · `#ffffff` `#effafa` `#eee9e0` `#fdf3e2` · teal `#29999a` (text `#1c6f70`), oceanic `#64b5b6`, blush `#ffd1ca` |
| 02 | `concept-02-clinical-clarity` | Clinical Clarity | Precision-led | Sora + DM Mono | `#0f2a33` · `#ffffff` `#f2f7f8` `#e4eff1` · cyan-teal `#1f8f95` (text `#136a6e`), coral hairline `#e8735a` |
| 03 | `concept-03-golden-hour` | Golden Hour | Patient-led | DM Serif Display + Plus Jakarta Sans | `#2c2a29` · `#fffaf3` `#fdf0dc` `#ffe9e2` `#ffffff` · sunset coral `#e9876f` (text `#a2452d`), teal `#29999a` |
| 04 | `concept-04-tide-journal` | The Tide Journal | Design-led | Instrument Serif + Inter Tight | `#111a1e` · `#fbfaf7` `#f1eee7` `#ffffff` · deep teal `#1a3743`, one aqua field `#afe7e5` |
| 05 | `concept-05-shoreline-retreat` | Shoreline Retreat | Hospitality-led | Italiana + Albert Sans | `#263235` · `#f7f5f0` `#e8efec` `#ffffff` `#efe7dc` · seafoam `#7fb7b0` (text `#3d6b65`), champagne `#c4ab83` |

### 01 · Coastal Concierge
The current brand, done properly. Their own Oceanic Font caps kept for headlines, Nunito Sans for
text, the teal and aqua kept but rebalanced: mostly white and aqua-mist grounds, teal as the working
accent, blush as a rare warm note, sand for the locations. The wave dividers grow up: one continuous
SVG swell runs down the page between chapters and flattens into a calm horizon line as you scroll
(scrubbed). The flower mark blooms open once in the hero. Signature: **the swell**. Rounded cards
stay, with real scale contrast and photography in every chapter. Feels like: the practice they
know, one clear step up.

### 02 · Clinical Clarity
Dentistry as precision: AI diagnosis and in-house specialists. A strict 12-column grid, hairlines,
mono labels (`01 / GENERAL`, `SCAN 03`), counters and numbered steps. Cool white and mist grounds,
the teal pushed toward cyan, coral only as a hairline and a status dot. Photography cropped tight
and documentary. Signature: **the scan**: a pinned chapter where a light bar sweeps across the X-ray
photograph and three readouts (the three AI points) lock in one after another; the specialist roster
is a directory that lights each specialty under one roof. Feels like: modern, exact, a practice
that sees more.

### 03 · Golden Hour
"Smile Bright, Feel Right" as Southern California light: warm cream, peach and blush grounds, sunset
coral next to the brand teal, a soft display serif with generous italics. People first: big smiling
portraits, the patient films and reviews prominent, the two steps told warmly. Signature: **the
sunrise**: the hero sun disc (a gradient circle) rises behind the H1 as the page scrolls, and the
review counters count up in a pinned row while the background warms from cream to peach. Rounded,
overlapping image stacks that fan open. Feels like: friendly, bright, about how you'll feel.

### 04 · The Tide Journal
An editorial magazine for a coastal practice. Masthead nav, very large serif statements against a
small grotesk, asymmetric layouts, overlapping images, numbered features ("No. 03 · No-Prep
Veneers"), pull quotes in the margin, issue-style dates on the blog. Paper and stone grounds,
near-black ink, the deep brand teal as the only colour plus one aqua field. Signature: **the tide
wipe**: images reveal with horizontal clip-path wipes like a wave washing in, and the H1 starts huge
and settles into the masthead as you scroll. Feels like: design-led, confident, memorable.

### 05 · Shoreline Retreat
Concierge care as hospitality: a calm boutique-spa tone. Linen, seafoam and sand grounds, champagne
and seafoam accents, arched and pill-shaped image masks, slow parallax, centred symmetric
compositions, lots of air. Italiana display in large light sizes, Albert Sans in tracked small caps.
Signature: **the arrival**: a pinned walk-through of the visit (reception, the chair with the
blanket and headphones, the consultation, the result) where rooms crossfade and scale under arched
masks with a room caption. Feels like: serene, premium, an experience rather than an appointment.

## Rules every concept follows

- **Content**: everything in `content.md`, in that order (13 sections). Shorten to fit the layout;
  never invent claims, numbers, names or credentials. No em dashes. No wall of text (~110 words max
  per run; fold or cut). Phone numbers typed with plain hyphens.
- **Light grounds only.** Ink is the dark colour; accent is a fill and a rule; accent TEXT uses the
  deep variant (4.5:1 on its ground). A dark scrim is allowed only behind a playing film or under
  white type on a photo. Scroll-written text must be readable (≥4.5:1) before it animates.
- **Type**: paste the house fluid root verbatim (below). Everything in `rem`, no `px` and no `clamp()`
  font sizes. Breakpoints 1279 / 991 / 767 / 479 only (max-width). Google Fonts only, except
  concept 01's Oceanic Font via `@font-face` from the Webflow CDN.
- **Motion** (the client reviews this; a static page is rejected): GSAP 3.13 + ScrollTrigger +
  SplitText from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/{gsap,ScrollTrigger,SplitText}.min.js`).
  Split-text hero reveal, at least three scrubbed or pinned chapters, clip-path or scale image
  reveals, magnetic or cursor-aware CTAs, the direction's signature moment. No ScrollSmoother, no
  IntersectionObserver reveals, no smooth-scroll CSS. `prefers-reduced-motion` honoured: everything
  visible and static. Content must be readable if JS fails (no `opacity:0` in CSS without a `.js` guard).
- **Working controls**: the veneer compare drags (pointer + keyboard), the mobile menu opens, films
  play, any accordion opens, the form never submits. Links go to the live site's real URLs
  (`https://www.oceanicdental.com/...`).
- **Self-contained**: one HTML file, inline `<style>` and `<script>`, class prefix per concept
  (`o1-`, `k2-`, `g3-`, `t4-`, `s5-`) so any two could share a host without collisions. Images
  hotlinked from the Webflow CDN as listed; `<img>` with width/height attributes and `loading="lazy"`
  below the fold, `alt` text on every one.
- **Presentation chrome** (identical on all five, outside the design): a fixed pill top-left
  `← All 5 concepts` linking to `index.html` (the publisher rewrites it to `/concepts`), a fixed pill top-right `Concept 0N · <Name>` (hidden
  under 767), and a 3px reading-progress bar along the top in the concept's accent. Class prefix
  `deck-`. They must not cover the site nav: offset the nav or place the pills at the bottom on mobile.
- **No shared shapes**: these are Oceanic's own designs. Do not copy the Livewell or Hackensack
  concept markup or another client's sections; techniques may repeat, section shapes may not, and
  the five must differ from each other in layout, not just colour.

### House fluid root (paste verbatim at the top of the `<style>`)

```css
:root{--font-from:18;--font-to:20;--vw-from:calc(1920 / 100);--vw-to:calc(2400 / 100);--coefficient:calc((var(--font-to) - var(--font-from)) / (var(--vw-to) - var(--vw-from)));--base:calc((var(--font-from) - var(--vw-from) * var(--coefficient)) / 16)}
html{font-size:calc(var(--base) * 1rem + var(--coefficient) * 1vw)}
@media screen and (max-width:1920px){:root{--font-from:16;--font-to:18;--vw-from:calc(1440 / 100);--vw-to:calc(1920 / 100)}}
@media screen and (max-width:1440px){:root{--font-from:16;--font-to:16;--vw-from:calc(479 / 100);--vw-to:calc(1440 / 100)}}
@media screen and (max-width:479px){:root{--font-from:12;--font-to:16;--vw-from:calc(320 / 100);--vw-to:calc(479 / 100)}}
```

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md).
