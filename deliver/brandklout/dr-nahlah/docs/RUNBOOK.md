# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Where things stand (2026-09-17)

| | |
| :--- | :--- |
| **Platform** | Instatic on Railway. Production `www.drnahlah.com`, staging `staging.drnahlah.com` (a full clone). Webflow is superseded. |
| **Published site** | 37 editorial pages + 43 migrated blog posts, live and verified. |
| **Local source of truth** | `workflows/04-design/.tmp/site-src/`. `node build-site.mjs` assembles `../final-site/`. Never hand-edit `final-site/`. |
| **In flight** | The **ads landing pages**: eighteen, one set of nine per office (Alexandria, Tysons Corner), each with its own LeadConnector forms, more photography on more grounds, and the four site tags (Termly, GTM, LeadConnector number pool) on every page of the local build. Built and gated locally 2026-09-17 (three passes). Not on Instatic, not published. |

## What is next

1. **Review the eighteen ads landing pages with Brandklout** (two offices × three
   campaigns × landing, consultation, thank you). See the 2026-09-17c run.
2. **In LeadConnector, point each of the six forms at its own thank-you page**
   (`/ads-<office>-<campaign>-thank-you`). The forms are wired; the redirect cannot be
   verified from this repository.
3. Google Ads conversions, one per thank-you URL (six).
4. Import the eighteen to Instatic (workflow 22): the four site tags go into `siteScripts`,
   the CSP has to allow their three hosts, then publish.

## Standing traps

These bite every time somebody works in here. The per-run files carry the rest.

- **`site-src/` is the source; `final-site/` is output.** Edit the body, the partial or the
  CSS component, then rebuild. Three page lists move together: `PAGES` in `build-site.mjs`,
  and the lists in `site-test.mjs` (derived) and `fluid-qa.mjs` (hardcoded).
  `check-page-lists.mjs` is the cheap gate that catches the drift, and a gate pointed at a
  page that does not exist is not a failing gate, it is an absent one.
- **One class name, one stylesheet.** `css-vocab.mjs` fails any class declared in two files,
  because Webflow and Instatic both merge classes by name. A new stylesheet cannot restate a
  rule an old one owns, not even to change one value.
- **Instatic flattens a slash in a slug.** `a/b` saves and then serves at `/a-b`, so links to
  the nested path 404. Flatten before importing.
- **Instatic drops elements it considers empty**, which includes a `<dt>` or `<span>` whose
  only content is a CSS `::before`. Put the character in the markup.
- **Duplicate uploads of the same photograph exist under different filenames.** `lab.jpg` IS
  `tech-hero.jpg`. Compare bytes, not filenames, when checking whether a page repeats an
  image.
- **`js/90-boot.js` reads `#nav` and `#navProgress` without guarding.** Any page with its own
  header has to keep those ids or the first scroll past 40px throws and takes the rest of
  boot with it.
- **Only six of the fourteen films in `videos.json` are the practice's own.** The other eight
  feature a generic presenter and are not Dr. Nahlah; the tell is `hqdefault` rather than
  `maxresdefault`. Never put one on a paid page. There is no veneer patient film at all.
- **A page with click-to-play film facades needs one real YouTube `<iframe>` on it.** Instatic
  lifts CSP `frame-src` only for a page that renders a real YouTube node.
- **Never wrap already-revealing blocks in a `data-rv` container** — `js/20-pagekit.js` skips a
  `data-rv` whose parent has one, and the children silently stay at opacity 0.
- **A blank GHL form under automation is Cloudflare Turnstile**, not a broken embed. It refuses
  automation and localhost; prove the form on the deployed domain.
- **The ads pages are templates: nine bodies, eighteen outputs.** `build-site.mjs` fills
  `{{LOC_*}}` tokens from its `LOCATIONS` table per office. Edit the body once; never the
  built page. The six form ids live in that table and nowhere else.
- **The asset library's file names lie.** `Untitled-3.jpg` is the reception desk, `Untitled-4`
  a handshake, `pt-hero-2` is Stephen, `dr-and-yolanda` is Barbara. Look before captioning.
- **The four site tags are one partial, `partials/site-scripts.html`, on every page.** The
  inline-script gate exempts only a `<script data-site-script>`. Termly runs autoBlock=off on
  purpose: on, it would hide the GHL form and the films until consent.
- **No prices anywhere**, on the client site or the landing pages: the practice publishes
  none, and the relative-weight column ($ / $$ / $$$) is the substitute.
- **Open since the original build:** the McLean current-patient phone conflict
  ((703) 448-3312 is used, (703) 493-1358 also published), inconsistent brand naming, and
  four `assets/tech-*.webp` files `/our-facility` references that are not in the local
  assets folder.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
