## Latest completed: the blog, 33 pages, and the whole old site covered (2026-08-19)

Commits **db69a3e**, **f48d04b**, **98d91ac**, **552d411**, **7f44f6b**, **3d7f950**, **2c19903**,
**edbf98d**. Started from "How many pages do we build?" and the answer being wrong.

### The old site was 78 URLs, not 28 pages
33 pages, 43 blog posts, 2 category archives. Pages were nearly covered (29 of 33); the blog was
not covered at all. Local is now **33 pages** and Instatic carries **33 pages + 43 posts**.

### Legal: FOUR documents, plus two choosers
The two offices are SEPARATE LEGAL ENTITIES. McLean trades as Esam Abou Nahlah, DDS, MS, PLLC;
Alexandria as Implants And Prosthodontics Specialists, PLLC. The client's counsel rewrote both
documents per entity on Webflow (effective 18 Aug 2026). They read 97% alike and merging them
would misstate which entity governs which office, so all four are cloned verbatim by
`gen-legal.mjs`; only structure and typography are ours. This supersedes the old WordPress terms
and closes all three defects those carried (PatientPop copyright, unattributed notices number,
bulletin-board boilerplate).
`/privacy-policy` and `/terms-conditions` are kept as CHOOSERS, not deleted: they are what inbound
links point at, Instatic has no redirect tool, and what they served was the withdrawn text.

### video-gallery -> video-library
14 films, all still live on the practice's channel. One real embed + 13 click-to-play facades,
which is also the only shape that works on Instatic (see CSP below). Three things not carried over:
the page was headed "Dental Group of Tyson Video Library" (another practice's name), its h1 was
"Patient Testimonials" (these are procedure explainers), and **only 6 of the 14 are Dr. Nahlah** -
the other 8 are an older set with a generic presenter, so the copy never claims otherwise.
`probe-thumbs.mjs` measures every thumbnail: 6 have maxresdefault at native 16:9, 8 are portrait
source pillarboxed 47%, and one crop rule for both put black slabs through half the grid.

**tysons-study-club is deliberately NOT built.** Its body on the old site is two blocks of Lorem
ipsum and a literal `[Practice Name]`. It was never written.

### The blog: 43 posts in the Instatic CMS
`extract-posts.mjs` -> `posts.json` -> `load-posts.mjs`. 43/43 published, slugs matching the old
WordPress URLs, every body read back and compared byte-identical.
- `/posts` index is a CMS loop (`build-blog-index.mjs`); post template is registered against the
  post type with a content outlet (`build-post-template.mjs`).
- **Each body carries its own `<h1>` and original date.** `{currentEntry.*}` tokens are STRIPPED
  outside a loop, so a template `<h1>` renders empty, and `publishedAt` is the load date, which
  would print 2026 on a 2022 post.
- Redirects are no longer lossy: each old post URL maps 1:1 to `/posts/<slug>` instead of the
  intent-based funnel (52 rules once pointed at /dental-implants). 117 rules, coverage 78/78.

### Reviews: the client's script and iframe, as an upgrade
The vendor script + iframe ship in the page and swap in over the generated cards ONLY once the
widget reports a height by postMessage. Works on local and Webflow; on Instatic everything added is
removed and the cards stay. Judging success on the iframe's `load` event does not work: a blocked
frame still fires it. The probe must also be laid out at FULL WIDTH while hidden, or the widget
measures its container as zero and reports 1px.

### Selectors panel: 17 dead class names removed
The registry still held the original import's vocabulary (std, st, cap, rv, fm, creds, marquee,
versus) and converter artifacts (a-2, b-2, after-2). `site_apply_css delete` DETACHES THE CLASS
FROM ELEMENTS, and runtime-applied classes appear in no document, so a naive unused-diff proposes
exactly the classes whose loss killed the nav menu before. Filtered against the 28 documents,
site.js and runtime-states.css: 86 candidates -> 61. All 28 documents hashed before and after both
passes, every one byte-identical.

### Gotchas
- **THE IMPORTER FLATTENS `<button>` AND `<a>` CHILDREN.** 13 video cards shipped as buttons
  wrapping a thumbnail, badge and title and arrived as bare strings. Use a container with
  `role="button"` and wire Enter/Space by hand. External image URLs were never the problem.
- **`content_set_document_fields` refuses a write unless the document is ACTIVE.** create-then-fill
  hides this, because create leaves the new document active.
- **Four bridge transients now retried**, all arriving as a 200 with prose: Site editor not
  attached, Content workspace not attached, "AI chat stream ended", and "Insert was refused before
  it reached the store ... the editor is usually still syncing". The last failed 14 of 33 pages
  mid-run before it was matched.
- **Do not read a report file while it is still being written.** `push-report.json` said 6 failures
  when there were 14. `verify-all.mjs` asks the server about every page in one pass.
- **Instatic has no sitemap and no robots.txt.** The robots.txt visitors see is synthesised by
  Cloudflare because the origin 404s. `STATIC_DIR` (/app/dist) IS served at root (`/favicon.svg`
  proves it) but is an image layer, so anything dropped there dies on redeploy.
- **A CMS loop wrapped in a grid puts every iteration in ONE cell.** The loop element must carry
  the grid class. An empty inline element inside a loop renders an "Empty container" chip per
  iteration in the canvas; use a pseudo-element.
- Gate page lists drift. `site-test` derives its list from `build-site.mjs`; `check-page-lists.mjs`
  cross-checks every gate's list against the build and `final-site`.

### Gates
`css-vocab` 262 | `site-test` **569/569** | `interaction-test-gsap` **64/64** | `swap-proof` **6/6**
| `fluid-qa` **405/405** | `sim-check` **28/28** | `check-page-lists` 3/3 | `image-substance` OK |
em dashes **0** | Instatic parity **33/33 pages, 43/43 posts**

### Still open, all decisions for the client or the operator
- **Nothing is published.** The post template's ENTRY rendering is the one thing that cannot be
  verified without publishing.
- **Sitemap hosting**: Cloudflare rule (fast) or an Instatic plugin (durable, and the route the
  SDK describes). 76 URLs generated and validated at `13-content-export-import/.tmp/sitemap.xml`.
- **tysons-study-club**: needs the client to say what the study club is.
- **The 8 non-Dr.-Nahlah videos**: keep or drop.
- **7,000+ vs 18,000+ implants** on `about` and `doctor-referral`.
- **The blog exists on Instatic only.** The redirect map is therefore target-aware:
  `--target webflow` fails validation naming the 47 destinations Webflow does not have.
- The canvas renders 6 of 43 index cards despite `data-limit="60"`; read as an editor preview cap,
  unconfirmed without a publish.
