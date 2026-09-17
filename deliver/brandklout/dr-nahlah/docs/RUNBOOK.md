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
| **In flight** | The **nine ads landing pages**, built locally 2026-09-17, revised the same day to put the GHL form in every hero and add filmed patients. Not on Instatic, not published. |

## What is next

1. **Review the nine ads landing pages with Brandklout** (three campaigns × landing,
   consultation, thank you). Built and gated locally; see the 2026-09-17 run.
2. **Get one LeadConnector form per campaign, each redirecting to its own thank-you page.**
   This blocks the campaign going live — see the trap below.
3. Google Ads conversions, fired on the thank-you URLs.
4. Import the nine to Instatic (workflow 22) and publish.

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
- **THE ADS FORMS ARE A PLACEHOLDER.** All three consultation pages carry the McLean general
  contact form. It has no redirect, so nobody reaches the thank-you page and the Google Ads
  conversion never fires, and no campaign tag, so leads from all three campaigns land in one
  pile. The pages look finished. They are not wired.
- **No prices anywhere**, on the client site or the landing pages: the practice publishes
  none, and the relative-weight column ($ / $$ / $$$) is the substitute.
- **Open since the original build:** the McLean current-patient phone conflict
  ((703) 448-3312 is used, (703) 493-1358 also published), inconsistent brand naming, and
  four `assets/tech-*.webp` files `/our-facility` references that are not in the local
  assets folder.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
