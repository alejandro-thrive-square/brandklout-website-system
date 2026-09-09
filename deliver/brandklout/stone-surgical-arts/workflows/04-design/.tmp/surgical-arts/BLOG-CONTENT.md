# Blog content and build

The 2026-09-08 request adds a blog overview and reusable article page to the existing Sculpted
Ivory site, then builds and tests the same pages on the Surgical Arts Instatic review instance.
There are four new routes: `/blog`, `/why-do-people-get-plastic-surgery`,
`/types-of-plastic-surgery`, and `/dermal-fillers-vs-botox`.

## Content intake

The intake CDX list contains 13 article URLs. The original text exporter did not include `/blog/`
in its PATHS, so an empty text search did not establish that the old site lacked articles.
Three complete article bodies were recovered on 2026-09-08 from the archived client site:

| Original article | Original publication | Archive capture |
| --- | --- | --- |
| Why Do People Get Plastic Surgery? Here are the Top Reasons | June 1, 2024 | [20250810071951](https://web.archive.org/web/20250810071951id_/https://www.stonesurgicalarts.com/blog/why-do-people-get-plastic-surgery-here-are-the-top-reasons/) |
| What are the Top Types of Plastic Surgery in the World? | September 5, 2024 | [20250810065936](https://web.archive.org/web/20250810065936id_/https://www.stonesurgicalarts.com/blog/what-are-the-top-types-of-plastic-surgery-in-the-world/) |
| Dermal Fillers vs Botox: Comparing the Two Top Treatments | October 1, 2024 | [20250810060138](https://web.archive.org/web/20250810060138id_/https://www.stonesurgicalarts.com/blog/dermal-fillers-vs-botox-comparing-the-two-top-treatments/) |

Recovered article-only HTML and text are in `../../../01-content-intake/.tmp/archive-text/blog-*`.
Keep bodies and headings, not menus, tracking scripts or the whole archived page. The public web
tool failed to open these captures; Python urllib retrieved them successfully. Check page titles
and the article container, since a 200 response alone does not prove the archive returned content.

The current copy is an editorial adaptation, not a verbatim restoration. It keeps the original
dates and identifies the September 8, 2026 update. The practice is the organizational byline;
no individual authorship or medical-review claim has been invented. Dental, sleep-apnea, weight
loss and teen-acne articles were not added to this facial-surgery site.

Outdated statistics, guaranteed outcomes, fixed injectable timelines, relationship/career promises
and the implication that surgery treats body dysmorphic disorder were removed. The broader surgery
article explicitly distinguishes general examples from this practice's offered treatments. Relevant
ASPS and FDA pages were checked and linked in the articles, including filler vascular risks and
botulinum toxin warnings. No new procedure or recovery instructions were authored.

## Implementation

- `site-src/blog-data.mjs`: the content collection; metadata, sections, references and related links.
- `site-src/blog-render.mjs`: overview, article template, page descriptors and SEO generation.
- `site-src/css/60-journal.css`: responsive layouts using the existing palette and typefaces.
- `site-src/js/13-journal.js`: current-section cue; native anchors work without JavaScript.
- `build-site.mjs` renders these pages alongside the existing body files. No generated body needs
  hand editing. Nav, drawer and footer all include Blog.
- The upload input and both published-site gates derive blog routes from `BLOG_PAGES`. A newly
  added record therefore cannot appear locally but be omitted from the replace-mode import.
- Existing media-library images are reused. This task creates no new media or licensing scope.
- The local build includes Blog/BlogPosting structured data. Instatic's existing publisher limits
  for per-page head metadata are recorded in the upload directive; passing a visual gate is not
  evidence of server-rendered SEO parity.

## Verification

Run `build-site.mjs`, `audit.mjs`, `check-copy.mjs`, `all-pages.mjs`, then `blog-test.mjs` from
`site-src`. The blog test checks 320, 390, 768, 1024, 1440 and 1920 widths, images, fonts, headings,
overflow, keyboard navigation, mobile menu, section anchors, related posts, booking navigation
and reading without JavaScript. It never submits the booking form. Run the same test with `--live`
after publishing. Reports and desktop/mobile screenshots are in `04-design/.tmp/blog-qa/`.

Before awaiting image decode in browser tests, set lazy images to eager and bound the wait. Awaiting
decode on below-the-fold lazy images without loading them can hang a test indefinitely.

Run `verify-live.mjs` and `compare-live.mjs` in `21-instatic-upload`. Both include all 16 routes.
Compare layout, computed styles and behavior, and inspect screenshot pairs. Do not silence an
import difference by adding it to the benign list without identifying its cause.

## Version Control

Follow [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md). Commit source, recovered article
bodies and lightweight QA reports. Screenshots and other media remain ignored.

## Infrastructure

Local QA uses Node.js, Puppeteer and Chrome on Windows. The static build is platform-independent;
the Instatic converter runs through Railway SSH in the existing Stone Surgical Arts container.
