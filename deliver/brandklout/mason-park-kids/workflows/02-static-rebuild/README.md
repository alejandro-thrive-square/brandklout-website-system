# 02 — Static rebuild of pediatricdentistkatytx.com

**Status: the site builds locally and passes both of its gates. 54 pages — content audit 0
blockers / 0 errors / 0 warnings, layout gate 54 pages x 3 widths / 0 problems.** Blog posts (157)
are deliberately out of scope, as they were for the parent site.

The client's WordPress install is compromised and was still being written to during the recovery
(see [`docs/security-incident-2026-08-27.md`](../../docs/security-incident-2026-08-27.md)). This
workflow rebuilds the site as **plain static HTML/CSS** — no WordPress, no plugins, no PHP, no
database — so there is nothing of the old attack surface left to re-infect. It follows the parent
practice's rebuild in [`mason-park/workflows/09-static-rebuild/`](../../../mason-park/workflows/09-static-rebuild/README.md)
and reuses its Client-First stylesheet and component library.

## Run it

```bash
cd deliver/brandklout/mason-park-kids/workflows/02-static-rebuild/.tmp
node db-pages.mjs      # database dump -> content-db/*.json   (the service pages)
node extract.mjs       # recovery snapshots -> content/*.json (the live pages)
node build.mjs         # content + templates -> dist/
node audit.mjs         # content QA gate; exits non-zero on any blocker or error
node responsive.mjs    # layout gate; every page at 390 / 768 / 1440px
node weigh.mjs         # per-page download weight, desktop vs phone
node serve.mjs --port 4310   # browse it, as a host would serve it. 4300 is often taken
                             # by the PARENT site's server in this same worktree
node shot.mjs .        # screenshot the built pages (add --mobile for 390px)
node to-instatic.mjs   # dist/ -> instatic/, the import bundle. See "Shipping it to Instatic"
```

`dist/` is the deployable site. It is gitignored — it is generated, and it carries ~14MB of the
practice's photography, which the repo rules keep out of git.

## Shipping it to Instatic

`to-instatic.mjs` turns `dist/` into `instatic/`, which is what the import actually consumes:
`pages/*.json` (a **body**, not a document), `site.css` and `site.js` as **site-wide code assets**,
and `media-manifest.json`. The generated `instatic/IMPORT.md` is the run order — read that, not
this. Ported from the parent practice's `09-static-rebuild/.tmp/to-instatic.mjs`; the contract is
identical because both sites are the same ThemeREX build behind the same Client-First stylesheet.

`instatic/` is gitignored for the same reason `dist/` is. The script is the artifact.

**It is a two-pass process and the order is not optional.** Instatic assigns an id at upload time,
so `/uploads/<id>-<name>` cannot be predicted: upload the media, harvest the map, then re-run with
`--media`. The first pass reports every path as unmapped, which is correct and expected.

Three things this port does that are worth knowing:

- **`--lean` is much bigger here than on the parent.** 30 files / 5.1 MB against 138 / 13.9 MB,
  because 111 of the referenced files exist only to fill a `srcset`. On a self-hosted instance a
  publish snapshots every runtime asset into the volume and nothing is collected, so that footprint
  is paid on **every** publish, not once. Use the same flag on both passes or the pages come back
  pointing at candidates that were never uploaded. Measured on the real import, `--lean` also
  costs nothing: Instatic derives its own `-w64`/`-w320`/`-w350` variants on upload, so 29
  uploaded files became 144 live `/uploads/` references. Keep it on.
- **The harvest map must be keyed by full relative path, not basename.** Nine basenames here belong
  to more than one file, and a basename-keyed map is a coin flip, so the script exits non-zero
  rather than resolve one. Note the specific case is milder than previously recorded here: the one
  such basename in the `--lean` set, `Dentist-in-Katy-Office.webp` in `2023/11` and `2024/09`, is
  the **same image** — both 95606 bytes, sha `8ca3aedb…`. The earlier claim that they differed in
  size because the photo was re-uploaded was wrong. `push-media.mjs` groups by SHA-256 and uploads
  identical bytes once.
- **A body-only export silently drops part of the `<head>`.** Every page's JSON-LD is preserved as
  `jsonLd` on the page record, and the favicon is collected into the manifest's `headOnly`, because
  neither travels in the body. The favicon is restored by `set-favicon.mjs`. **The JSON-LD is
  not**, and cannot be as things stand — see below.

### Doing the import: it is headless, and it goes through the container

The whole import runs with no browser. `IMPORT.md`'s "the import cannot run headlessly" is about
the **MCP connector** — 29 of its `site_*` tools proxy through the in-editor AI chat stream — and
not about the admin REST API underneath, which
[`deliver/process/18-instatic-embeds/lib/insta-api.mjs`](../../../../process/18-instatic-embeds/lib/insta-api.mjs)
speaks directly.

The catch is that **pages are stored as node trees (`cells.body.nodes`), not HTML**. The converter
is Instatic's own `@core/htmlImport`, so it runs *inside* the container over `railway ssh` —
`container-convert.ts`, driven by `run-convert.mjs`. Same solution the parent practice reached.

```bash
node push-media.mjs                 # upload; writes instatic-media-map.json (outside instatic/)
node to-instatic.mjs --media instatic-media-map.json --lean
node ship-payload.mjs && node run-convert.mjs && node fetch-nodes.mjs
node import-pages.mjs --only core   # then again without --only
node import-styles.mjs && node install-fonts.mjs && node set-favicon.mjs
node verify-live.mjs                # the proof; `{"publishedPages":54}` is not
```

Two failures here are invisible rather than loud, and both are handled by the scripts above:

- **Instatic emits no class attribute for a class it has no rule for.** `import-styles.mjs`
  registers every class name as an empty rule and ships `site.css` as a code asset to do the
  actual styling. Skip it and you get perfect structure with zero styling, which looks exactly
  like a stylesheet that failed to load.
- **The published-page CSP blocks Google Fonts.** The base policy sets `style-src 'self'
  'unsafe-inline'` and emits no `font-src` at all, so `site.css`'s `@import` of
  `fonts.googleapis.com` can only fail — into the fallback stack, with nothing in the UI to say
  so. `install-fonts.mjs` self-hosts DM Sans and Figtree through
  `POST /admin/api/cms/fonts/install`; `import-styles.mjs` strips the dead `@import`.

**Not solved: `jsonLd` and the meta `description`.** A page row carries only `title`, `slug` and
`body` — there is no per-page head field, so step 6's "paste the JSON-LD into the head field"
describes something that does not exist. The parent practice emits its `og:` tags and JSON-LD from
the `webzite.open-graph` and `webzite.aeo-schema` plugins. Installing those here is the way to
close it, and it needs a decision because they also relax the CSP.

Before anything writes: **every script prints the host it is about to touch as its first line.**
`.env` shipped pointing at the parent practice's live site, inherited from the 2026-08-28 split;
it now points at the pediatric instance, `https://mason-park-kids.up.railway.app`.

That host was itself generated as `corebunchinstaticlatest-production-fb3b.up.railway.app` — named
after the container image rather than the client — and was renamed on 2026-08-31 to match
`mason-park` and `dr-nahlah`. **Renaming a Railway service domain silently invalidates
`PUBLIC_ORIGIN`**, which produces the 403-on-login trap that
[process 20](../../../../process/20-instatic-domain-origins/20-instatic-domain-origins.md) exists
to catch: the login page at the new address renders perfectly and then refuses the login. The
order that avoids a broken window is to widen `PUBLIC_ORIGIN` to hold **both** hosts, confirm the
container has actually applied it (a variable that is set but never redeployed is the exact bug
the parent site hit), rename, then narrow it back.

> **Do not run `build.mjs` while `responsive.mjs` is running.** The build deletes and rewrites
> `dist/` under the gate's own static server, and the gate then hangs waiting on pages that have
> stopped existing. It looks like a Chrome problem and is not.
>
> **`responsive.mjs` reads `--accent` out of `theme/site.css`, and it must.** Its "has the
> stylesheet applied yet" probe compares a computed custom property against a literal. Ported from
> the parent practice's rebuild it carried that practice's `#00bde0`, which never matches here, so
> every page burned 80 retries failing to look ready: a 17-minute run reporting the whole site as
> "page never finished loading". The literal is now read from the stylesheet. If you port this file
> to a third site, do not put a colour back in it.

## What is in the build

| | |
| :--- | :--- |
| Pages | **54** — 24 from the database, 14 hand-authored, 16 replayed content pages |
| Images | 138 files, 13.9MB, all from the SSH recovery |
| Third-party code | none, except Google Fonts and the practice's own booking link |
| JavaScript | one 2KB file for the mobile menu and lazy map. Fully usable with JS off |
| Out of scope | 157 blog posts, `/blog/`, and 11 ThemeREX demo pages |
| Page weight | median **47 KB** on load, 76 KB full scroll |
| Gates | `audit.mjs` 0/0/0; `responsive.mjs` 54 pages x 3 widths, 0 problems |

## The thing that shaped this build: the site had no service pages

The live install (table prefix `wp_`, theme `tooth-fairy`) publishes **40 pages, and not one of
them is a service page** — but its own main menu links to **24 URLs under `/services/`**. Every one
of those menu links was a 404 on the live site. That is most of the practice's clinical content
and most of its navigation.

The pages exist. The same SiteGround database carries a **second, abandoned WordPress install**
under the prefix `hni_` — `blogname` "Mason Park Dental for kids", admin `social@identitydental.com`,
the previous agency — with **69 published pages**, including every `/services/` URL the current
menu names. They are clean paragraph HTML written for this practice, not Elementor soup:

> A lifetime of healthy teeth begins with good dental habits. Give your child a solid foundation by
> bringing them for an exam and cleaning twice each year… The American Academy of Pediatric
> Dentistry has found that your child should visit the dentist within six months after the presence
> of the first tooth or by his or her first birthday.
> — `hni_posts#225`, `/services/comprehensive-pediatric-dentistry/`

So the rebuild reads from two sources: **rendered snapshots for the pages that were live, and the
database for the pages the menu promised.** `pages.config.mjs` says which is which, and every
service page records its row id (`"source": "hni_posts#225"`) so any sentence can be traced back.

**24 of the 69 are carried forward.** The rest are an adult general-dentistry set — dentures,
wisdom tooth removal, porcelain veneers, root canal retreatment, inlays, snore appliances — which
would be wrong to publish on a pediatric site. Rows are pinned by id, not slug, because several
slugs appear twice and the length heuristic picks the adult one.

## How it works

```
.tmp/
├── pages.config.mjs      the real main menu, the page set, practice details
├── db-pages.mjs          the database dump -> content-db/<slug>.json
├── extract.mjs           drives headless Chrome over the recovery snapshots
├── extract-in-page.js    runs inside that page and emits structured blocks
├── content/<slug>.json   extracted live pages
├── content-db/<slug>.json extracted database pages
├── theme/site.css        Client-First style guide + component CSS
├── theme/site.js         mobile menu + deferred map
├── site/components.mjs   the reusable component library; nothing else writes markup
├── site/presentation.mjs page chrome + the two generic renderers, composed from it
├── site/pages.mjs        hand-authored templates
├── build.mjs             content + templates -> dist/
├── audit.mjs             static QA gate over dist/
├── responsive.mjs        layout gate — horizontal overflow at 3 widths
├── weigh.mjs             what a visitor downloads per page
├── serve.mjs             local preview on :4300
└── shot.mjs              serve dist/ and capture it, sliced for review
```

**Structure is Client-First**, following the house mapping in
`dr-nahlah/workflows/07-webflow-build/.tmp/CF-MAPPING.md` and the parent practice's stylesheet
unchanged. Two layers, and the split is the point:

| Layer | Naming | Examples |
| :--- | :--- | :--- |
| Style guide | hyphenated utilities, shared everywhere | `padding-global`, `container-large`, `heading-style-h2`, `button` |
| Components | Client-First underscore, one CSS block each | `service-card_glyph`, `team-card_role`, `navbar_dropdown-list` |

Nothing is styled by a bare tag name except the document defaults. `audit.mjs` enforces it: **any
class in the markup that the stylesheet does not define is a build error.**

**Copy is never retyped.** Templates pull their sentences out of the extracted JSON by matching the
heading they sat under, so the practice's wording travels verbatim and a change upstream surfaces
here rather than drifting silently.

**Layout comes from the screenshots** in `../01-site-recovery/.tmp/screenshots/w1440/` — 40
full-page captures taken during the recovery — not from the old Elementor markup.

**Safety.** `extract.mjs` never executes the recovered markup: every `<script>`, `<iframe src>`,
`<img src>` and stylesheet is stripped from a throwaway sanitised copy *before* it reaches the
browser, and Chrome additionally runs with `--disable-javascript`. `db-pages.mjs` only tokenises
SQL string literals; it evaluates nothing. `audit.mjs` re-checks the built output for every known
malware IOC on each run.

## Five things found in the old site that were wrong

**1. The same four fabricated awards as the parent site.** Every Elementor page carried the hidden
ThemeREX demo block listing "Top Dental Clinic 2019", "Dental Business Annual Award 2020", "Dental
Laboratory 2021" and "Best Dental Practice 2022" — awards the practice has not won — alongside
lorem ipsum. CSS-hid them on the live site, so nobody at the practice would have seen them, but
they were in the HTML and readable by search engines. Stripped, and `audit.mjs` fails the build if
any of it comes back.

**2. The smile gallery was stock photography, with fabricated prices under it.** `/before-after/`
was 100% theme demo: lorem ipsum, the theme's own before/after stock photos presented as this
practice's results, and three invented "Silver $50 / Gold $70 / Platinum $90 per month" tiers. The
rebuilt page says plainly that the gallery is being restocked and links to the treatment pages
instead. **It needs real, consented patient photography before it means anything.**

**3. The practice published two sets of its own contact details, on the same page.** The pediatric
chrome — top bar, header, contact band — says suite **#104B** and **(281) 578-7100** (88
occurrences). The footer block, copied wholesale from the parent practice's site, says **#104A** and
**(281) 769-8878** (57). The rebuild uses the pediatric set throughout. **The practice has to
confirm it.**

**4. `/our-services/` sold the parent practice's adult treatments.** The live page was an icon
carousel listing Dentures, Dental Implants, Root Canal Therapy and Oral Surgery — and every icon
was **hotlinked from `bestdentistinkatytx.com`**, the parent practice's web server. Rebuilt from
this practice's own service pages, with inline SVG icons that cost no request and belong to nobody
else.

**5. A page called `our-team-copy` was not a copy of the team page.** It is a 1,000-word parent
guide to the knee-to-knee infant dental exam, sitting on a page title no menu linked to, so nobody
could read it. Republished at `/knee-to-knee-pediatric-dental-exam/` and put in the menu. The real
`/our-team/`, meanwhile, names **nine members of staff with photographs** — the profiles the parent
site was missing entirely.

## The Invisalign page: a stale price that is not being republished

`hni_posts#264` is the abandoned install's Invisalign landing page: *"The BEST Invisalign Deal!
$1000 OFF"*, *"Prepay in full to receive a 5% discount (Lowest Price of $3,610)"*, a Trustindex
widget shortcode and a bare YouTube link. It is the longest Invisalign row in the dump and the
obvious one to pick.

It is **not** used. Republishing a price the practice has not confirmed, from an install it
abandoned, on a page a parent could reasonably hold them to, is not a call a rebuild gets to make.
`/services/invisalign/` uses `hni_posts#528` instead — the same practice's clinical explanation of
what Invisalign is. If the practice wants the offer back, it belongs on `/special-offers/` with a
current price. See `pages.config.mjs`.

## Pages that had to be authored rather than copied

| Page | Why |
| :--- | :--- |
| `/` | the live homepage's service strip hotlinked the parent practice's icons; the rest is its own copy, re-laid-out |
| `/our-services/` | listed the parent practice's adult treatments (see above) |
| `/our-team/` | the staff are there but as loose image/heading pairs, with the theme's closing headline mixed in |
| `/contacts/` | published the parent practice's suite and phone number under this brand's header |
| `/before-after/` | 100% theme demo content (see above) |
| `/appointment/` | was a bare, non-functional month calendar and nothing else |
| `/product-recommendations-2/` | rendered **completely empty** — a title, a blog sidebar, no body |
| `/thank-you/` | one line of copy on the live site |
| `/sitemap/` | listed 113 entries, most of them pages of the abandoned install |
| `/dental-library/` | 36 topics as plain text linking nowhere, over half of them adult treatments |
| `/patient-resources/` | the menu pointed at `#`; the page existed only in the abandoned install |
| `/privacy-policy/` | **never published on either site.** Interim notice, clearly marked (see below) |
| `/services/restorative-dentistry/` | a menu parent with no page behind it; authored as a hub over the five restorative pages that do exist |
| `/refer-a-patient/` | **empty on the live site.** Its content in the abandoned install was a single 123FormBuilder embed (form `6072889`), a script tag that leaves nothing in a static snapshot |

## The privacy policy does not exist and this ships an interim one

Neither the pediatric site nor the parent site publishes a Privacy Policy — the parent's
`/privacy-policy/` returned 403 to its crawler, and this site has no such page in any of its 40.
The site embeds forms and offers SMS reminders, so shipping with nothing at all is worse than
shipping a stopgap.

`/privacy-policy/` describes what the *website* does, is marked "interim notice, pending review",
and states explicitly that it is **not** the practice's HIPAA Notice of Privacy Practices. **That is
a stopgap, not the fix.** The practice needs to publish its real policy.

## Two linked files were never recovered

`/dental-saving-plan/` links a brochure PDF and `/new-patients/` links a patient privacy-policy
form. Neither file is in the recovery — the mirror took the pages and the images they show, not
every attachment the copy links to, and the host cannot be reached again. Both links are
**unwrapped to plain text** rather than shipped pointing at a 404; they are listed under
`droppedLinks` in `build-report.json`. The parent site's rebuild hit the same thing with its own
brochure (commit `1f76523`). Re-upload both files and the links restore themselves on the next
build.

## Open items for the client

1. **Suite number and phone** — #104B / (281) 578-7100, or #104A / (281) 769-8878? Both are
   published on the live site (see above).
2. **Smile gallery** — real before/after photography, with consent.
3. **Privacy Policy** — publish the real one; the interim page is a stopgap.
4. **Two PDFs** — re-supply the brochure and the patient privacy form.
5. **The referral form.** `/refer-a-patient/` was built around the phone and email routes because
   the only content the page ever had was a 123FormBuilder embed, **form id `6072889`**, recovered
   from the abandoned install. Its public embed URL was not guessed. Supply it from the practice's
   123FormBuilder account and the page takes it.
6. **Google reviews.** The homepage carried six real, named patient reviews through a third-party
   widget that renders from JavaScript. They are not rebuilt: the extraction cannot reliably pair a
   quote with its author once the widget's markup is flattened, and attributing a review to the
   wrong patient is worse than not showing it. Restore through the practice's own Google Business
   Profile embed.
7. **Blog.** 157 posts are captured in the recovery and can be rebuilt on the same templates.
8. **Heading typeface.** As on the parent site, headings on WordPress were Adobe Typekit **Stolzl**,
   licensed through the ThemeREX theme's kit. That licence does not travel to a static rebuild, so
   headings use **Figtree**. Swap two lines at the top of `theme/site.css` if the practice licenses
   Stolzl in its own name.
9. **Booking link.** `https://www.flexbook.me/masonpark/1` is the **parent practice's** scheduler,
   which is what the pediatric site itself linked. Confirm that pediatric appointments should book
   through it.
10. **Dr. William Sung** is still named in this site's copy, though he was deliberately removed from
   the parent site's rebuild. Confirm before launch.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts,
templates, extracted content JSON and the build report are committed; `dist/`, `shots/` and the
recovered database dump are gitignored because they are generated, heavy, or carry credentials.
