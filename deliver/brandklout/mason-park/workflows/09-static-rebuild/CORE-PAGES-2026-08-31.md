# Core pages, shipped to STAGING

**2026-08-31.** The eleven pages named on Asana
[`Build Core Pages`](https://app.asana.com/1/1210572425689866/project/1215184535967345/task/1217892732561687)
are now live on **`https://staging.masonparkdental.com`**, built on the client-approved Figma
system. Production is untouched.

> [!IMPORTANT]
> **The redesign had never left this machine.** [REDESIGN-2026-08-28.md](./REDESIGN-2026-08-28.md)
> rebuilt all 71 pages on the Figma system on 2026-08-28, but that build only ever existed in
> `dist/`; the 2026-08-27 WordPress-screenshot design was still what production and (after the
> clone) staging served. This run is the first time the redesign reached an Instatic site.

## What the brief actually asked for

The Asana task carries **no description and no comments** — the brief is its eleven subtasks, which
are page names. Nine of them already existed as routes; two did not exist at all.

| Asana subtask | Route on staging | Status |
| :--- | :--- | :--- |
| Home Page | `/` | redesigned |
| About the Practice | `/about-us` | redesigned |
| Meet the Doctor or Doctors | `/our-doctors` | redesigned |
| Meet the Team | `/our-team` | redesigned |
| Services Overview | `/our-services` | redesigned |
| Standalone Individual Service Page Starter Template | `/services/<slug>` | redesigned — **one template, 35 pages** |
| New Patients | `/new-patients` | **NEW PAGE** |
| Insurance and Financing | `/financing` | redesigned |
| Membership Plan | `/dental-savings-plan` | redesigned |
| Patient Reviews and Testimonials | `/patient-reviews` | **NEW PAGE** |
| General Thank you Page | `/thank-you` | redesigned |

"Standalone Individual Service Page Starter Template" needed nothing new: the build already renders
all 35 service pages from a single `service` template, which is exactly the starter template the
subtask names. Adding a treatment is one content file, not one page design.

## The Figma, checked rather than assumed

The prototype Jessica linked is **publicly viewable** — no Figma token needed, which is worth
knowing before anyone goes looking for one again. It carries **three homepage concepts** as separate
flows: `Family forward` (node `3-92`, the one Jessica named), `Team forward`, `Brand forward`. Only
the homepage is comped; there are no inner-page comps, so the other ten pages are composed in the
approved system rather than traced.

`3-92` is the same direction [REDESIGN-2026-08-28.md](./REDESIGN-2026-08-28.md) already recorded
verbatim (page **Final**, frame `1940w expanded`, plus **Handoff Documentation**). Nothing about the
design system changed this session — it was checked against the live prototype and matches.

## The two new pages

Both are in `site/pages.mjs` and registered in `BESPOKE` and `META`. Neither invents a fact.

**`/new-patients`** — the old site had no such page; a first-time visitor had to assemble the answer
from `/appointment/`, `/special-offers/`, `/financing/` and two questions buried in `/faq-page/`.
Four steps, the three new-patient offers with the practice's own figures (`$189` / `$129` / `$350`),
what to bring, how to pay, four FAQs, the appointment form. Three of the four FAQ answers are the
practice's own published wording; the fourth (booking a child and a parent together) is ours and
answers one of the four questions the Figma asked for and never answered.

**`/patient-reviews`** — the comps ask for *"a Google reviews screenshot with scroll indicators"*.
A screenshot cannot be read by a screen reader, does not reflow on a phone, and is wrong the day a
review is added. This is the same six published reviews as markup, read out of the homepage's own
content blocks so the two pages cannot drift apart.

Two deliberate omissions, both unchanged from the 08-28 position:

- **No numeric rating.** `reviewLockup()` is in the component library ready for one. A star average
  set as static text is a claim that is wrong the moment it moves, and the client has still not
  supplied a figure to publish.
- **No Google listing deep link.** The practice has never published its listing URL. The page uses a
  Maps *search* URL, which cannot land on the wrong business. A CID guessed off the embedded map
  could. **Ask the client for the real review link.**

### Navigation

Both pages are reachable from the main menu — `New Patients` first under *Patient Resources*,
`Patient Reviews` under *About*. This is the first change to the information architecture since the
rebuild, which otherwise keeps the live site's menu exactly.

## The one thing that broke on import, and why

The mobile menu button shipped as an **empty box**. Everything else survived.

Instatic's importer maps `<button>` onto its **`base.button`** module, which carries a text `label`
and takes **no child nodes**. The toggle's inline `<svg>` was therefore dropped at import — silently,
with `failed: 0` and no warning. The 14 service icons, which are inline `<svg>` in ordinary
containers, came through untouched: it is the `<button>` specifically that cannot hold one.

Fixed by drawing the three bars as three `linear-gradient` background stripes on the button itself,
so the same mechanism renders locally and on Instatic. `<button>` is now the only element in this
build that must never be given a child, and both the markup and the CSS say so.

> [!WARNING]
> **No gate catches this.** `audit.mjs` and `responsive.mjs` both run against `dist/`, which is
> correct; the loss happens downstream, inside the container. The only thing that found it was
> looking at the published page. Look at the published page.

## Run order — staging

Every step is now environment-aware. **Nothing here can reach production unless you name it.**

```bash
cd deliver/brandklout/mason-park/workflows/09-static-rebuild/.tmp

node build.mjs && node audit.mjs && node responsive.mjs        # never concurrently
node to-instatic.mjs --lean --media instatic-media-map.json

MSYS_NO_PATHCONV=1 RAILWAY_ENV_NAME=staging node ship-payload.mjs
# then, inside the container (see container-convert.ts for the upload recipe):
#   cd /app && bun run /app/mp-convertall.ts
MSYS_NO_PATHCONV=1 RAILWAY_ENV_NAME=staging node fetch-nodes.mjs

INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-styles.mjs
INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-pages.mjs --overwrite
# publish: see insta.mjs — guard on IS_STAGING before you call publish()
```

### What changed in the toolkit

| File | Change |
| :--- | :--- |
| `insta.mjs` | **Host guard fixed.** It tested `/mason-park/i`, which only ever matched the deleted Railway host `mason-park.up.railway.app` — so it refused *both* real targets. Now matches `masonparkdental` too. Added `IS_STAGING`. |
| `insta.mjs` | **Session cache keyed by host.** One unlabelled `.session` silently reused production's cookie against staging and back. Now `.session-<host>`; `.gitignore` follows it, or the first staging run commits a live admin credential. |
| `ship-payload.mjs`, `fetch-nodes.mjs` | Railway environment is `RAILWAY_ENV_NAME=staging\|production`, not a hardcoded id. Production is still the default, and that is **not** the safe default — say `staging` out loud. |
| `site/presentation.mjs`, `theme/site.css` | The hamburger, above. |
| `site/pages.mjs`, `pages.config.mjs` | The two new pages, their meta, and their menu entries. |

## Gates and verification

| Gate | Result |
| :--- | :--- |
| `audit.mjs` | 75 pages, **0 blockers, 0 errors**, 47 warnings — the same pre-existing hotlink/alt-text warnings as 08-28 |
| `responsive.mjs` | 74 pages × 3 widths, **0 problems** |
| container conversion | **74 of 74 converted, 0 failed**, 46,208 nodes, 0 warnings |
| payload integrity | sha256 verified on both sides, twice |
| publish | `draftMatchesPublished: true`, **81 published pages** |
| text equivalence, all 11 core pages | **word-for-word identical to `dist/`**, one token apart |

That one token is `office@masonparkdental.com`, which Cloudflare's `email_obfuscation` rewrites at
the edge. It is a zone setting, it does the same thing to production, and it is already logged in
the runbook.

## Known, not introduced here

- **Three images 404 on `/dental-implant-costs-esp/`** (`2020/10/pricing-single.jpg` and two
  siblings). They were never in the crawl, so they are not in `dist/assets` and cannot be uploaded.
  Broken on the live site today, identically. Not one of the eleven pages.
- **The brochure PDF is not a link.** `application/pdf` is refused by Instatic's upload pipeline on
  purpose — a PDF can render inline, so it is an XSS vector. The link is unwrapped to plain text.

## Still open for the client

Everything in [REDESIGN-2026-08-28.md](./REDESIGN-2026-08-28.md)'s closing list stays open — the
two contradictory sets of office hours, "Since 1997", a publishable Google rating, whether Dr.
William Sung stays, the staff-retention copy, and **the client's own photo album**
(`photos.app.goo.gl/k9MzHrudUfh4QhpW9`, plus five photographs attached to the Build Home Page task,
now pulled into `01-content-intake/.tmp/asana-context/attachments/`). Nothing in this build uses
them yet, and they remain the single biggest available upgrade to this design.

Added by this pass:

1. **The real Google review link**, so `/patient-reviews` can point at the listing instead of a search.
2. **Whether `/new-patients` and `/patient-reviews` belong in the top-level menu.** They are in
   dropdowns today, which is the conservative reading of an IA the rebuild otherwise left alone.
3. **Confirm the first visit takes about an hour** — that sentence is ours, not the practice's.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). `dist/`, `shots/`,
`instatic/` and `converted-pages.json` stay gitignored — generated, and they carry the practice's
photography.
