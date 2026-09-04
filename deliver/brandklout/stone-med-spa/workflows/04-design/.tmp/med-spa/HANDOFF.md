# Stone Med Spa — handoff

**Built 2026-09-03, rebuilt the same day, PUBLISHED 2026-09-04** to this brand's own Instatic
instance at <https://stone-med-spa-production.up.railway.app>. Eleven core pages. That is the link
for review; the admin is the same URL + `/admin`.

> [!IMPORTANT]
> **2026-09-03, EVENING: THE SECOND BUILD.** The first build (below, kept for its reasoning) was
> reviewed the day it was finished: *"I didn't like the result. We need to elevate it way more
> like on Surgical Stone... maintain the colours but try to use them differently. Make different
> layouts... a site with a lot of high-end interactions and animations, scroll-based animations,
> way more imagery and less text."* Every one of the eleven pages was rebuilt to that brief.
>
> **What changed, and where to read why:**
>
> | | first build | second build |
> | :-- | :-- | :-- |
> | Ground | flat ivory, one dark band | the five colours as grounds in turn: charcoal hero, ivory, **stone**, **green**, ivory, dark, ivory, dark close and a dark footer (`01-tokens.css` grew `[data-theme="green"]` and `[data-theme="stone"]`) |
> | Motion | IntersectionObserver reveals | GSAP + ScrollTrigger + SplitText on every page (`motion: true`), and a page-agnostic vocabulary in `css/40-motion.css` + `js/20-motion.js`: `data-split`, `data-wipe`, `data-parallax`, `data-speed`, `data-count`, `data-hero-pin`, `data-hscroll`, `data-stack`, `data-words`, `data-drag`, the marquee, a custom cursor, magnetic buttons, a progress hairline |
> | Interior headers | eyebrow + H1 on ivory | a photograph with the navbar over it, on every page (`css/49-cover.css`) |
> | Imagery | 33 files, ~12 used | 72 files (the sibling's model library, the practice's own photographs, the previous site's masthead portrait converted from the Drive export, five lifestyle images from the old blog), four to nineteen photographs per page |
> | Copy | ~450 words on the home page | ~260; every page cut by half or more |
> | Radius | 2px | pills and 1.25–1.75rem frames — the one aesthetic deviation from the Surgical Arts style guide, and it is deliberate (see the token comment) |
> | Marble | one dark marble band | none anywhere |
>
> **Page by page** (each stylesheet opens with its thesis): home `50-hero` `51-mosaic` `53-shelf` `52-cadence` `54-surgeon` `55-words` `56-place` `58-close`; about `61-about` (three stacked names, the line on stone, three rules, a drag rail of the rooms); team `62-team` (wipe-in portraits, a pinned filmstrip); treatments `57-menu` (concern chips on green, generated rows with index numerals and round portraits, two doors on stone); botox `59-detail` (sticky spec card, four products as stacked cards, care lists, the reserved frame on the dark section); results `65-proof` (drag rail of reviews with portraits between, the empty plates on stone); financing + membership `63-plan` (stacked ways to pay, the dark principle band, tiers as a split on stone, the year grid on green); doctor `66-doctor` (stacked rules, the under-treat rule on green, a pinned filmstrip of every doctor photograph); book + thank-you `64-book` (split screen with a sticky frame, the phone at display size, the self-drawing check).
>
> **Gates:** `audit.mjs` FAIL none · `all-pages.mjs` 11 × 3 widths, 132 assertions clean ·
> `menu-test.mjs` 9/9 · `probe.mjs` console clean on every page with motion on. `probe.mjs` is
> new: it captures the VIEWPORT at scroll stops with motion enabled, which is the only way to see
> a pin or a scrub — `shot.mjs` emulates reduced motion on purpose.
>
> **Nothing about the open items below changed.** Every placeholder survived the rebuild, shorter:
> reviews are placeholders, the gallery is a reserved consent frame, team roles are unconfirmed,
> the tiers are a proposal, the vendors are unconfirmed, the form is inert, the domain and trading
> name are unresolved, and there is still no price anywhere.

---

## The blocker is resolved, and the client resolved it

The standing blocker — *which brand owns the med spa menu* — was answered on 2026-09-03 when the
client sent the practice's own two category images. They are archived at
[`01-content-intake/.tmp/client-references/`](../../../01-content-intake/.tmp/client-references/)
and they draw the line themselves:

| Surgical — stays on Stone Surgical Arts | Med spa — this site |
| :--- | :--- |
| MyEllevate® Facelift · Neck Lift · Facelift \| Easy Lift · FaceTite · Facial Implants · Chin Sculpting & Reshaping · Buccal Fat Removal · Blepharoplasty · Neck Liposuction · Skin Lesion Removal · Male Facial Enhancement · Facial Fat Transfer | Dermal Fillers · Botox \| Xeomin · Morpheus8 · Hair Restoration · PRP Treatment · Chemical Peels · Dysport & Jeuveau |

It is **Scenario B, the modality split** — the NassifMD pattern the competitive research
recommended. The cut is at the incision, not at the price: FaceTite is minimally invasive but still
an incision under local, so it is surgical; Morpheus8 delivers radiofrequency through microneedles,
so it is here.

### Two consequences that are not this worktree's to fix

1. **Stone Surgical Arts still publishes all seven of these**, with a fee schedule, on a live
   staging link the client has reviewed. That page has to lose them, and a **301 map** from those
   URLs to these has to exist before either domain goes live. That is a `bk-stone` task.
2. **Six treatments the sibling sells are on neither list the client sent** — Sculptra, CO2 laser
   resurfacing, HydraFacial MD, microneedling, SkinPen and Cosmelan. They are non-surgical, so by
   the rule they belong here, but *the client did not name them*. They are **not** in this build.
   Ask before adding them; do not infer a menu the client did not write.

---

## What exists

`site-src/` builds to `final-site/` with `node build-site.mjs`. Eleven pages, every one of the
eleven Asana subtasks on task
[`1218112701145002`](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1218112701145002).

| Asana subtask | Page | Shape |
| :--- | :--- | :--- |
| Home | `index.html` | Photographic hero with the **interval rail** across its foot, the premise, the year grid, the menu, the doctor, reviews, the place |
| About Us | `about.html` | Why there are two Stone websites, the room, three rules |
| Meet The Doctor | `meet-the-doctor.html` | Split header, credentials strip, the training, the approach |
| Meet the Team | `team.html` | Eight cards — **roles deliberately unconfirmed**, see below |
| Services Overview | `treatments.html` | The **ledger**: whole menu as one table, plus the concern filter |
| Service Page Sample (Botox) | `botox.html` | The **spec sheet**: sticky vitals rail, four-product comparison, pre/post care, FAQ |
| Testimonials / Before & After | `results.html` | Reviews, the **reserved gallery**, authenticity FAQ |
| Financing | `financing.html` | Three ways to pay, vendor FAQ |
| Book Consultation | `book.html` | Two paths, virtual and in-office, then the inert form |
| Membership Plan | `membership.html` | Two proposed tiers, then the year grid |
| General Thank You Page | `thank-you.html` | `noindex`, real timings |

### Gates, all passing

- `node audit.mjs` — **FAIL none, WARN none**
- `node all-pages.mjs` — **11 pages × 3 widths (390/1024/1440), 132 assertions, all clean**
- Concern filter, path chooser and the inert form all functionally tested.

---

## The style guide is shared. The section shapes are not.

The client asked for the Surgical Arts style guide and that is exactly what this carries: the same
five colours, the same two typefaces, the same spacing and type scales, the same Client-First
layer, navbar, drawer, footer, brand wordmark, FAQ and motion CSS. `css/01-tokens.css` is that
build's file with only the comment changed.

**Nothing from its 50-journey / 51-dossier / 52-elevate / 53-hub / 54-profile / 55-about /
56-offers was copied.** Every section stylesheet from `49-cover.css` onward is new, per gotcha 4
in the runbook — two brands sharing a surgeon, an address and a palette have to differ somewhere,
and where they differ is the layout.

The organising idea, and the reason the shapes came out different: **surgery is a decision, med spa
is a cadence.** You choose a facelift once; you come back for Botox every three or four months
forever. So the site's spine is time — how long the appointment is, when it shows, how long it
lasts, how often you return — and the signature object is the **twelve-month year grid**, which
exists nowhere on the sibling.

`treatments-data.mjs` holds the seven records, and four things on the site are generated views of
them: the hero rail, the ledger table, the concern pills and the Botox vitals rail. They cannot
drift apart. The sibling had this file, let its pages drift from it, and deleted it.

---

## Open items — every one needs the client, not more build time

### Blocking a publish

> [!NOTE]
> **Items 1 and 2 were what blocked the publish, and 1 is settled enough to have unblocked it on
> 2026-09-04.** `site.origin` is now the Railway host — a real, resolvable origin, so canonicals
> and `og:url` point at pages that exist. That is the right answer for a review site and the wrong
> one for a launch; both still need the client. **Item 2 got MORE expensive, not less**, because
> the trading name is now baked into the URL.

1. **No domain.** `seo.json` `site.origin` was `https://stonemedspa.example`, a deliberate
   placeholder, and publishing with that in place **would have told Google the canonical home of
   all eleven pages is a domain nobody owns.** It is now
   `https://stone-med-spa-production.up.railway.app`. When a real domain is bought: change
   `site.origin`, rebuild, republish, and run `deliver/process/20-instatic-domain-origins` —
   `PUBLIC_ORIGIN` on the Railway service must gain the new host **and keep the railway one**, or
   every admin write answers `403 invalid origin` and every script in the upload workflow breaks.
2. **Trading name unconfirmed.** Asana says *Stone Med Spa*; the live Instagram is
   *@westlakeaesthetics*, "Westlake Medical Aesthetics". This used to be `seo.json` plus the
   wordmark in three partials. It is now also the Railway project, the service, the generated
   domain and `PUBLIC_ORIGIN`. Still doable in an hour, but ask before the client reviews at a URL
   that turns out to be the wrong name.
3. **NAP is not settled.** `project-overview.md` records the med spa phone as **(817) 383-8361**
   and suite **#110A**. The Surgical Arts footer carries a comment saying those exact two values
   were the *sister practice's* and were wrong there. So either the med spa genuinely shares the
   implant centre's line, or this pillar's overview inherited the same bad pair. The build uses
   383-8361 and **#110** (the suite Surgical Arts verified on every recovered page). **One line
   from the client settles both.**
4. **No brand identity.** No logo, no favicon. The wordmark is set in Cormorant as markup and the
   favicon is a generated "S". Fine for review, not for launch.
5. **Legal pages.** Privacy, Terms and SMS Terms point at the implant centre's live policies —
   same legal entity, so nothing is a dead link today, but this brand needs its own before a
   domain goes live. The sitemap also flags Contact, Accessibility and 404 as unscoped.

### Content that is honest placeholder, and says so on the page

6. **The three reviews are placeholders.** Representative of the practice's public Google reviews;
   nothing in them invents a treatment or an outcome. **They must be replaced with a verbatim pull
   and reviewer names the client will publish.** Flagged in the page text on `/` and `/results`.
7. **Before-and-after photography is not published, by rule.** Fifteen archived galleries of real
   patients exist and none can go up without **current written consent per case**. Both `/results`
   and `/botox` carry a reserved frame that says so; when consent arrives the frame fills and
   nothing around it moves. **This is a client task with weeks of lead time — start it now.**
8. **Team roles are unconfirmed and every card says so.** The portraits and first names are the
   practice's own; the job titles are not supplied. Inventing a job title for a named,
   photographed, real person on a medical site is not a placeholder, it is a false credential. One
   card has a portrait with no name; Abby has a name with no portrait.
9. **Membership tiers are a proposal.** Two working names, inclusions we recommend, **no prices
   anywhere** — Brandklout is a partner engagement and `CLAUDE.md` forbids recording a price, rate,
   quote or cost under `deliver/brandklout/`. Financing vendors (CareCredit, Cherry) are likewise
   the likely answer, not a confirmed one.
10. **Clinical review is outstanding** on every onset, longevity, downtime and product claim, on
    the Botox page and in `treatments-data.mjs`. The figures are the standard published ranges,
    not a statement of this practice's protocol. **Dr. Stone signs them off before launch.**

### Operational

11. **The booking form posts nowhere, deliberately.** No endpoint, no scheduler, and no decision on
    who takes a virtual consultation or whether that channel is HIPAA-compliant. Submit is
    prevented, the status line says so and gives the phone number. Verified: no navigation, no
    network request, nothing leaves the browser. **Do not "just turn it on"** — those fields are
    PHI the moment a patient types into them. See the header of `js/11-form.js`.
12. **Nothing routes to `/thank-you` yet**, because the form is inert. It is built because it is
    the conversion-tracking endpoint and the tag needs somewhere to fire.
13. **The brand switcher points at the Surgical Arts staging host**
    (`stone-surgical-arts-production.up.railway.app`), in the footer, on `/about` and on
    `/treatments`. It becomes the real domain when one is chosen. The reciprocal link **from**
    Surgical Arts does not exist yet and is a `bk-stone` task.

---

## The media is not in git — restoring it on a fresh clone

`.gitignore` excludes `*.webp`, `*.woff2` and `*.png` repo-wide, and `CLAUDE.md` forbids committing
binary assets, so **`site-src/assets/` is empty on a fresh clone** and the build will produce pages
with broken images. Source, markup, styles and data are all tracked; only the media is not. Same
convention as the sibling build.

To restore it, copy the subset from the Stone Surgical Arts worktree — 33 images and 7 font files:

```
SA=".../bk-stone/deliver/brandklout/stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/site-src/assets"
cp "$SA"/*.woff2 site-src/assets/fonts/   # the two self-hosted typefaces
# then the 33 named in site-src/assets/ — the practice's own photographs of Dr. Stone,
# the rooms and the staff, three instrument still lifes, seven model portraits and the
# dark marble. Every operating-theatre still and every neck/eyelid model was left behind
# deliberately: this site sells nothing surgical.
```

The client images that settled the menu split are likewise local-only; they are transcribed in full
in [`01-content-intake/.tmp/client-references/README.md`](../../../01-content-intake/.tmp/client-references/README.md),
which does commit.

**Model portraits carry a licence question.** The library travels with the practice by the client's
say-so and the sibling's handoff records that it **needs confirming before a domain goes live**.
The rule this build follows: a model appears as a *person*, never as a patient and never as a
result. Nothing here captions one as an outcome.

## Notes for whoever builds the next six treatment pages

The eleven-page brief funds one service page. Botox is it, and it was written as the template:
its vitals rail is generated from the same `treatments-data.mjs` record that fills its ledger row,
so the next six are **a body file each and one line in `PAGES`**. Set `page:` on the treatment and
its ledger row grows a link with no other change.

The six currently render as expandable ledger rows that say plainly that a full page is not
written yet, rather than as dead links.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
