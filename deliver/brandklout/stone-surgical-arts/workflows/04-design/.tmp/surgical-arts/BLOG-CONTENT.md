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
dates and identifies the update date. The practice is the organizational byline; no individual
authorship or medical-review claim has been invented.

## The full archive, 2026-09-09

The client then supplied a complete file backup of the old site at
`01-content-intake/.tmp/website-files`. It holds **thirty-nine** posts, not three, in two static
trees that the CDX list never exposed:

| Tree | Posts | Words | What they are |
| --- | --- | --- | --- |
| `old-blog/` | 15 | 248–2,650, median 792 | Patient education. The three above are among them. |
| `news/` | 24 | 279–387, median 310 | Celebrity-angle SEO, uniformly thin. |

A third directory, `blog/`, is a WordPress installation. Its posts live in a database that is not
in the backup, so there is nothing to recover there; every readable post is in the two trees above.

`01-content-intake/extract-archive-posts.mjs` recovers all of them, reading the DOM with scripts
disabled and every non-`file://` request aborted. The article container is `div.mw1200.animate.fadeIn`
on all thirty-nine, despite the pages being ~640KB each. It writes `blog-<slug>.html`,
`blog-<slug>.txt` and an `archive-manifest.json` inventory, and **skips the three Wayback
recoveries**: the table above cites their capture timestamps, and regenerating them from a
different source would falsify it. Chrome does not survive thirty-nine pages of that size in one
process, so the script recycles the browser every six pages and is resumable.

**The earlier decision to omit the dental, sleep-apnea, weight-loss and teen-acne articles was
reversed on 2026-09-09 at the client's explicit instruction: all thirty-nine are published.**

### What was removed on the way in

The originals are not publishable as they stand, and the adaptation is what makes them so:

- **Dated and unsourced statistics.** "$56 billion industry", "2.2 million procedures in 2022",
  "over 900 million people", "23% of Americans will get full dental implants over the next two
  years", "90% of people have impacted wisdom teeth", "90 to 95%" implant success, "50 million
  Americans", "close to 16 million Americans". None is reproduced.
- **Two different practice telephone numbers**, appearing across posts from the same period.
- **An agency byline** (`by kat@nkpmedical.com`) on the tori post.
- **Authoring bugs**: the "types of oral and cosmetic surgery" post repeats *Jaw Surgery* and
  *Dermal Fillers* as duplicate sections, and files a tummy tuck under *Jaw Surgery*. The two
  February 2026 posts are near-duplicates of each other, and the one titled for tooth extraction
  has a heading structure entirely about dental emergencies.
- **Speculation about named living people**, throughout the `news` tree: "many speculate",
  "experts claimed", "reports [X] had liposuction", alongside references to individuals' cancer
  diagnoses and genetic test results. A practice cannot publish medical claims about identifiable
  people who have not disclosed them. Every `news` post therefore keeps its subject and its URL
  and is rewritten as patient education about that procedure.
- **Hotlinked images** from Reddit, gossip and news sites, left as bare URLs in the body text, and
  an unedited `X celebrities` placeholder.
- **Unsafe framing**, particularly around weight-loss injections: appetite-suppressant mechanisms
  presented as benefits without risk, inositol described as treating anxiety and depression, and
  weight loss described as shedding "carcinogens".

### Checking it

`site-src/blog-validate.mjs` runs before any build and fails on: a slug that collides with an
existing route, an image absent from the media library, `date` and `dateLabel` disagreeing, a
`relatedTreatment` anchor that does not exist in the target page, a `<title>` that would exceed the
65-character warning, a non-https or (with `--check-refs`) non-200 reference, and any em dash,
telephone number, guarantee or marketing superlative in the copy. Eight of the reference URLs
originally chosen turned out to 404 and were replaced before publication; all 31 now cited return
200.

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
