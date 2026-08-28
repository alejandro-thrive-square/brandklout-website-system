# 09 — Static rebuild of bestdentistinkatytx.com

> [!IMPORTANT]
> **The design changed on 2026-08-28.** The site is now built on the client-approved Figma system
> (Newsreader / Nunito Sans / Karla, the warm `#8C6349` palette) with a rebuilt layout, replacing
> the WordPress-screenshot design described further down. Read
> [REDESIGN-2026-08-28.md](./REDESIGN-2026-08-28.md) first — it records every colour and type size
> verbatim from the Figma handoff, the nine layout changes made on top of it, and the four things
> in the comps that were deliberately **not** shipped (an unverified founding year, a static star
> rating, four questions with no answers, and a five-item nav that does not reach 71 pages).
> Everything below still describes how the build *works*; only the design it emits has moved.


**Status: the main site is rebuilt and passing its own QA gate. 72 pages, 0 blockers, 0 errors,
0 warnings.** Blog posts are deliberately out of scope.

The client's WordPress install is compromised (see the malware sections in `.claude/RUNBOOK.md`
and [`docs/security-incident-2026-08-24.md`](../../docs/security-incident-2026-08-24.md)) and
SiteGround is taking it down. This workflow rebuilds the site as **plain static HTML/CSS**, with no
WordPress, no plugins, no PHP and no database — so there is nothing of the old attack surface left
to re-infect. The output is a flat folder ready to host on **Instatic**.

## Run it

```bash
cd deliver/brandklout/mason-park/workflows/09-static-rebuild/.tmp
node extract.mjs      # crawl snapshots -> content/*.json   (only needed if the crawl changes)
node build.mjs        # content + templates -> dist/
node audit.mjs        # content QA gate; exits non-zero on any blocker or error
node responsive.mjs   # layout gate; every page at 390 / 768 / 1440px
node weigh.mjs        # per-page download weight, desktop vs phone
node to-instatic.mjs  # body-only pages + code assets + media manifest -> instatic/
node shot.mjs .       # screenshot the built pages (add --mobile for 390px)
node serve.mjs        # browse it at http://localhost:4300/, exactly as a host would serve it
```

`dist/` is the deployable site. It is gitignored — it is generated, and it carries ~14MB of the
practice's photography, which the repo rules keep out of git.

## What is in the build

| | |
| :--- | :--- |
| Pages | **72** — 35 service pages, 3 doctor pages, 11 hand-authored pages, 23 content pages |
| Images | 126 files, 13.3MB, all copied from the pre-takedown crawl |
| Third-party code | none, except Google Fonts, the practice's Google Maps pin and its own booking/form embeds |
| JavaScript | one 2KB file for the mobile menu and lazy map. The site is fully usable with JS off |
| Out of scope | ~180 blog posts, `/category/*`, the blog index |
| Page weight | median **50 KB** on load, 102 KB full scroll; homepage 0.15 MB on load |
| Gates | `audit.mjs` 0 blockers 0 errors, `responsive.mjs` 71 pages x 3 widths 0 problems |

## How it works

```
.tmp/
├── pages.config.mjs     the real main menu, footer links, practice details
├── extract.mjs          drives headless Chrome over the saved crawl snapshots
├── extract-in-page.js   runs inside that page and emits structured blocks
├── content/<slug>.json  the extracted content, one file per page
├── theme/site.css        Client-First style guide + component CSS
├── site/components.mjs   the reusable component library; nothing else writes markup
├── site/presentation.mjs page chrome + the two generic renderers, composed from it
├── theme/site.js        mobile menu + deferred map
├── site/pages.mjs       hand-authored templates for the Elementor-built pages
├── build.mjs            content + templates -> dist/
├── audit.mjs            static QA gate over dist/ (content, links, images, meta)
├── responsive.mjs       layout gate - horizontal overflow at 3 widths, all pages
├── weigh.mjs            what a visitor downloads per page, desktop vs phone
├── serve.mjs            local preview on :4300, served the way a host serves it
├── shot.mjs             serve dist/ and capture it, sliced for review
└── slice.mjs            slice a pre-takedown screenshot for side-by-side comparison
```

Source of truth is `01-content-intake/.tmp/site-scrape/` (252 rendered pages + 2,534 assets) and
`01-content-intake/.tmp/site-screenshots/desktop/` (252 full-page captures). Nothing was retyped:
copy is lifted out of the extracted JSON, and layout follows the screenshots.

**Responsive images**: WordPress had already generated derivatives beside every upload
(`g7-768x512.jpg` next to `g7.jpg`) and the crawl downloaded them, so the build emits a `srcset`
from whatever sizes exist rather than shipping one size to everyone. A phone no longer pulls a
1536px photo to paint it 390px wide: the homepage went from 1.64 MB to **0.78 MB on a phone**, and
the median page to 92 KB. `dist/` is larger on disk as a result (28 MB, every derivative) — that is
not what any single visitor downloads.

**Safety**: `extract.mjs` never executes the compromised markup. Every `<script>`, `<iframe src>`,
`<img src>` and stylesheet is stripped from a throwaway sanitised copy *before* it reaches the
browser, and Chrome additionally runs with `--disable-javascript`. `audit.mjs` re-checks the built
output for every known malware IOC on each run.

## Four things found in the old site that were wrong

**1. Fabricated awards.** Every Elementor page carried a hidden ThemeREX demo block listing four
awards the practice has not won — "Top Dental Clinic 2019", "Dental Business Annual Award 2020",
"Dental Laboratory 2021", "Best Dental Practice 2022" — alongside lorem ipsum body copy. It was
CSS-hidden on the live site, so nobody at the practice would have seen it, but it was in the HTML
and readable by search engines. Stripped, and `audit.mjs` fails the build if any of it comes back.

**2. The smile gallery was stock photography.** `/before-after/` was 100% theme demo content: lorem
ipsum plus the theme's own before/after stock photos, presented as this practice's results. The
rebuilt page says plainly that the gallery is being restocked and links to the treatment pages
instead. **It needs real, consented patient photography before it means anything.**

**3. Every FAQ question on the site.** Elementor keeps a toggle's question in an
`<a class="elementor-toggle-title">` - neither a heading nor a button - so the first pass of the
extractor walked straight past them and kept only the answers. 79 questions across five pages,
including both FAQ pages in the main menu, were silently missing. Recovered, and they now render as
`<details>` accordions that work with JavaScript off.

**4. Two contradictory sets of office hours.** The footer and homepage say Mon 9–6, Tue 8–5,
Wed 9–6, Thu 8–5, Fri/Sat/Sun closed. The three doctor pages say Mon 9–7, Tue 7–5, Wed 8–6,
Thu 7–5, **Fri 7–5**. The rebuild uses the footer/homepage set throughout. **The practice needs to
confirm which is right** — this is the third time this has come up (see Open Question 9 in
`docs/project-overview.md`).

## How it is built

**Layout comes from the screenshots**, not from the old site's markup. The 252 pre-takedown
captures in `01-content-intake/.tmp/site-screenshots/desktop/` are the design reference. The old
Elementor markup is not, because it was page-builder soup wrapped around theme demo content.

**Copy comes verbatim from the extraction.** Nothing retypes a sentence, a price or a credential -
those are the practice's published words, and a transcription step is exactly where a wrong digit
gets into a price or a doctor's qualification.

**Structure is Client-First**, following the house mapping in
`dr-nahlah/workflows/07-webflow-build/.tmp/CF-MAPPING.md`. Two layers, and the split is the point:

| Layer | Naming | Examples |
| :--- | :--- | :--- |
| Style guide | hyphenated utilities, shared everywhere | `padding-global`, `container-large`, `heading-style-h2`, `button` |
| Components | Client-First underscore, one CSS block each | `doctor-card_image`, `offer-card_price`, `navbar_dropdown-list` |

Nothing is styled by a bare tag name except the document defaults - a bare-tag rule collides
site-wide the moment the markup is pasted into a builder, which is the failure the Client-First
validator flags.

Pages compose `site/components.mjs`; no template writes a card, a section shell or a button by
hand. `audit.mjs` enforces it: **any class in the markup that the stylesheet does not define is a
build error**. That check exists because moving the vocabulary to Client-First left the page
templates naming classes that no longer existed, and every one of those pages rendered completely
unstyled, with no error anywhere.

## Instatic import

`node to-instatic.mjs` writes `instatic/` - gitignored, because it is generated:

| Path | What it is |
| :--- | :--- |
| `pages/*.json` | `{ slug, title, description, html }`; `html` is a **body**, not a document |
| `site.css`, `site.js` | the two **site-wide code assets** |
| `media-manifest.json` | every image to upload, with its size |
| `IMPORT.md` | the run order |

The local build and the Instatic site are the same markup with three differences, and only three:

1. **Routes.** `/services/invisalign/` becomes `/services/invisalign`.
2. **Media.** Instatic assigns an id at upload and renames files on the way in (`.jpeg` to `.jpg`,
   dots to underscores), so paths **cannot be predicted**. Upload first, harvest the map, then
   re-run `node to-instatic.mjs --media <map>.json`. With no map every path is reported unmapped,
   which is a visible failure rather than a silently broken image.
3. **Scripts and styles.** Dropped from the page body; they go in as code assets instead.

**Two things that will bite.** The import cannot run headlessly - Instatic's MCP edits a live
workspace, so the Site editor has to be open in a browser, signed in as the connector owner. And
never call `site_add_page` twice for the same page: slugs auto-unique, so a repeat gives you
`about-2` rather than an overwrite.

There is no Instatic MCP configured for Mason Park yet; `.mcp.json` carries only
`instatic-dr-nahlah`.

## Cross-site images — needs a decision from Brandklout

**Four pages load 16 images directly from `grandmissiondentistry.com`** — the sibling practice's
web server, a separate Brandklout client with its own worktree (`bk-grand-mission`):

| Page | Images |
| :--- | :--- |
| `/dental-implant-costs/` and `/dental-implant-costs-esp/` | 7 each, including the implant price tiles ($17,499 / $9,499 / $2,999) and an `AdobeStock_` licensed image |
| `/services/what-is-tmj/` | 3, all `AdobeStock_` |
| `/services/silver-diamine-fluoride/` | 3 |

They are **hotlinks**, not copies: the WordPress site never held these files and neither does the
crawl, so there is nothing local to fall back on. Consequences:

- The pages break the moment Grand Mission moves, renames or takes down those files.
- Mason Park's site is serving another practice's bandwidth and, in the `AdobeStock_` cases,
  imagery licensed to that other practice.

**They have been left exactly as they are** — removing them would gut a page selling implants, and
choosing what to do with another client's assets is not a call to make silently. `audit.mjs` now
raises a WARN for every one of them, so they cannot ship unnoticed. Brandklout owns both clients
and should decide: re-license and copy the images to Mason Park, replace them, or drop the pages.

One further hotlink, `i.ytimg.com`, is a YouTube thumbnail on the same two pages and is benign.

**Scope check.** A scan of all 252 crawled pages finds *six* referencing `grandmissiondentistry.com`
— the four above plus `/ph-and-acidity-of-food-beverages/` and `/toothpaste-rda-table/`. Those last
two carried the image as page decoration outside the content flow, so it did not survive into the
rebuild: the built site hotlinks from four pages, not six. The entanglement is wider than images,
though — the crawl also picked up Grand Mission-hosted CSS and JS for two shared WordPress plugins
(a before/after comparison slider and a Google-reviews widget), served through Mason Park's own
cache paths. None of that is used by the static build, but it is evidence that the two sites were
sharing assets in more than one direction.

## The Terms of Service point at two documents that do not exist

`/terms-of-service/` is the one piece of the old site that is unambiguously
good: 2,000 words, dated 16 July 2026, naming Mason Park Dental of Katy PLLC,
covering A2P 10DLC SMS consent, financing tools and virtual-consultation photo
submissions. It is real, recent and specific to this practice.

It also says, in section 18:

> Your use of the Site and our SMS program is also subject to our **Privacy
> Policy and Cookie Policy**, which describe how we collect, use, and manage
> information collected through the Site and our messaging program.

**Neither document is published.** `/privacy-policy/` returned 403 to the
crawler, and there is no Cookie Policy page anywhere on the site. So a binding
document that visitors accept by using the site, submitting a form or opting
into SMS incorporates two policies nobody can read.

This rebuild ships an interim `/privacy-policy/` describing what the *website*
does, clearly marked for review and explicit that it is not the practice's HIPAA
Notice of Privacy Practices. **That is a stopgap, not the fix.** The practice
needs to publish its real Privacy Policy and a Cookie Policy, or amend section
18 to stop referencing them.

Section 20 of the same document also gave up the practice's real email address,
`office@masonparkdental.com` — which appeared nowhere else on the site. The live
theme published `info@website.com`, a placeholder, which did not survive the
rebuild. The real address is now in the footer of every page and on the contact
page.

## Pages that had to be authored rather than copied

| Page | Why |
| :--- | :--- |
| `/our-team/` | returned **403** on the live site, and it is in the main menu |
| `/privacy-policy/` | returned **403**, and it is linked from every page's footer |
| `/financing/` | rendered **completely empty** — header straight into footer |
| `/appointment/` | was a bare, non-functional month calendar and nothing else |
| `/before-after/` | 100% theme demo content (see above) |
| `/contacts/` | rebuilt as a real contact layout around the practice's own copy |
| `/our-services/` | the live page was an icon carousel that listed no services in text |
| `/our-doctors/` | three portraits at their natural sizes (464x696 beside 230x300) with the bios below in a different order |
| `/patient-resources/` | one paragraph, a bullet list that linked nowhere, three orphan icon captions |
| `/special-offers/` | carries the practice's real prices; the generic renderer buried them in running text |
| `/thank-you/` | one line of copy on the live site |

`/pricing/` is **not** rebuilt: it was the theme's demo "Silver / Gold / Platinum Pack" tiers with
lorem ipsum, it is in no menu, and the practice's real prices live on `/special-offers/`.

## Open items for the client

1. **Office hours** — which of the two published sets is correct (see above).
2. **Smile gallery** — real before/after photography, with consent.
3. **Cherry financing link.** The live site's "Apply Now" pointed at
   `pay.withcherry.com/grand-mission-dentistry` — the **sibling practice's** account, so Mason Park
   applications were being attributed to Grand Mission. The rebuilt financing page describes Cherry
   but deliberately does **not** link it until Mason Park's own account URL is supplied.
4. **Heading typeface.** Headings on the WordPress site were Adobe Typekit **Stolzl**, licensed
   through the ThemeREX theme's kit. That licence does not travel to a static rebuild, so headings
   use **Figtree** (Google Fonts, closest free geometric sans). If the practice licenses Stolzl in
   its own name, swap two lines at the top of `theme/site.css`.
5. **Team profiles.** Hygienists and front-office staff are named constantly in patient reviews and
   have no profiles. `/our-team/` has a slot ready for them.
6. **Blog.** ~180 posts are captured in the crawl and can be rebuilt on the same templates when the
   main site is live. Six in-body links to blog posts are currently unwrapped to plain text; they
   are listed in `build-report.json` under `droppedLinks`.
7. **Forms.** The appointment form is the practice's live GoHighLevel form and the virtual-consult
   form is its live 123FormBuilder form; both are embedded as-is and should be test-submitted after
   launch.

## Hosting notes for Instatic

- Upload the contents of `dist/`. Every route is a directory with an `index.html`, so it works on
  any static host with directory-index support.
- `404.html` is at the root for the host's not-found handler.
- `sitemap.xml` and `robots.txt` are generated and point at `bestdentistinkatytx.com`. If the site
  launches on a different hostname first, change `SITE_URL` at the top of `build.mjs` and rebuild.
- No redirects are needed for the pages in scope: every rebuilt route matches its old WordPress URL
  exactly, so existing search rankings and inbound links land in the right place. The only
  exception is `/pricing/`, which is intentionally gone and will 404.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts,
templates, extracted content JSON and the two reports are committed; `dist/`, `shots/` and
`slices/` are gitignored because they are generated and carry binary media.
