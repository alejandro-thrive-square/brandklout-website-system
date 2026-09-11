## 2026-09-11 (afternoon): Sang's v2 package published to the review link

Brief: `workflows/21-instatic-upload/.tmp/brief-sang-v2.md`. The previous run is
[`2026-09-11-sangs-page-published.md`](./2026-09-11-sangs-page-published.md) (v1, one page).

### What Sang sent

`client-handoff/BrandKlout-Preview1-Website-Package (1).zip`, kept as received (gitignored),
unpacked into `client-handoff/package-v2/` (committed, it is the source):

| page | file | stylesheet | script | form | images / embeds |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `index.html` | inline `<style>` | inline (FAQ toggle, lead form) | `#leadForm`, no action | 6 YouTube thumbnails (`i.ytimg.com`, jpg) |
| `/survey` | `survey/index.html` | `survey/styles.css` | inline (4-step survey) | `#growthSurvey`, Netlify, `POST ?submitted=true` | none |
| 5 stories | `customer-stories/<name>/index.html` | `customer-stories/story.css` | none | none | one `youtube-nocookie` iframe each |

`preview (1).html` inside the zip is byte-identical to `index.html` and is what the stories and
the survey link back to (`../../preview%20(1).html#apply`). Fonts: Google DM Sans + Manrope on every
page, already installed. Every page has JSON-LD and a data-URI favicon in `<head>`, which Instatic
drops (trap 31). Inter-page links: home → 5 stories + survey; story → home, `#apply`, `#stories`,
next story; survey → home.

### What v2 changed against v1 (copy)

- New: the "Client stories on video" block (5 cards → 5 new story pages), the "Why us" operator
  block (Sang's video + the 10-mile territory map), "Earn the relationship" (month-to-month +
  60-day money-back guarantee), "What we won't do", a FAQ entry on the guarantee, a footer link to
  the new 21-question survey.
- Removed: the "Use video to make the strategy believable" block, and with it two of the three
  strategy-note lines.
- Firmed up: "Exclusive market protection / No long-term lock-in / 60-day guarantee" became
  "One practice per specialty per 10 miles / Month-to-month. No long-term contract. / 60-day
  money-back guarantee". The v1 hedge ("Final terms, guarantees and market protection should match
  the executed client agreement") is gone.

### Done

- **Published** at <https://brandklout-production.up.railway.app>, `{"publishedPages":7}`:
  `/`, `/survey`, `/customer-stories-legacy-dental-pasadena`, `/customer-stories-oceanic-ai-search-growth`,
  `/customer-stories-oceanic-future-ready`, `/customer-stories-ocpao-ai-authority`,
  `/customer-stories-omnia-ai-search-growth`. The index kept its row id. 6 thumbnails are in the media
  library with Sang's alt text.
- `21-instatic-upload` adapted for a package: `prepare-source.mjs` rewritten (pages at their package
  paths, stylesheets scoped per `<body>` class and joined, scripts guarded and joined, form-control
  attributes recorded for repair, remote images downloaded, `site-src/pages.json` manifest).
  `build-import-input.mjs` has 7 `PAGES` lines, asserted against the manifest, and resolves relative
  links through aliases. The page lists in `verify-live`, `compare-live`, `visual-diff` and
  `css-parity` are checked against the manifest. `visual-diff --source` compares Sang's files with
  the prepared pages. `form-probe.mjs` walks the survey end to end. The directive has a "package
  run" section and traps 39–42.
- **Gates, final run:** `verify-live` FAIL none (7 routes, 24 URLs, 41 assets, 7/7 titles) ·
  `css-parity` FAIL none (551 local rules) · `visual-diff` 1440: home 0.030%, survey 0.000%,
  stories 0.005–0.006% · 390: home 0.030%, survey 0.000%, stories 0.014–0.015% ·
  `visual-diff --source` 0.000% on all 7 at both widths · `compare-live` 23 findings, all benign ·
  `form-probe`: survey boots at step 1, slider is `range`, 21/21 labels numbered, `#submitButton`
  present, all 4 steps advance, FAQ opens (85px).
- **Benign, with reasons.** The visual-diff bands, each inspected as a crop:
  - the submit button's `↗` span flattened into its label (trap 38, home, both widths);
  - anti-aliasing on the edge of Sang's founder photo (re-encoded to media-library variants);
  - YouTube's own player controls inside the story iframes (a third-party frame, not the page).

  compare-live:
  - `span.arrow` #4/#5: trap 38 again, the missing span shifting the index of every later arrow;
  - `div.container#2` margin 130 vs 0 at 1440: trap 30's auto-margin reading; geometry agrees
    within 2px and the pixel diff is clean there;
  - `p.bot-field`: the off-screen (`left:-9999px`) survey honeypot, taller because Instatic
    renders `type="text"`, which Sang's input rule matches;
  - `.js` scope on every page: push-site's bootstrap class, which none of Sang's CSS uses.

  Also: the story videos publish as `youtube.com/embed`, not `youtube-nocookie.com`. `base.video`
  does that, and it is the only module that lifts the CSP for YouTube.
- **Real defects found and fixed:**
  1. Trap 39: nested slugs published at `/customer-stories-<name>`, so every story link 404'd.
     Slugs are flattened now.
  2. Trap 40: media conditions are ordered site-wide by first appearance. Joined story-first, the
     home page's ≤980 rules beat its ≤620 rules (compare-live at 390: 97 findings, then 23).
  3. Trap 41: form controls lose unlisted attributes. Without the repair, the survey throws at
     boot (`#submitButton`), loses its 21 number badges and its slider. Found by reading the
     importer before importing.
  4. `verify-live` looked for a comment in the published script, which strips comments. It now
     looks for code.

### Flagged for Sang, NOT changed (his copy; phase 1 publishes it as written)

Last round's list, re-checked on v2:

| item | v2 |
| :--- | :--- |
| The form captures nothing | **Still true, and worse.** The home lead form still shows "Prototype form submitted…" and sends nothing. The **new survey** is a Netlify form; on Instatic its POST gets `404 {"error":"Not found"}`, so a visitor who answers 21 questions lands on a JSON error page and the answers are lost (trap 42). |
| Visible prototype text | **Still there, all three:** the success message, "Replace this prototype text with your final privacy language." and the footer's "Prototype rebuild · … Replace legal/contact links before production." |
| Privacy, Terms, HIPAA → `#` | **Still `#`.** |
| Strategy notes written as copy | **Two of three fixed** (the video block is gone). "The site should answer the objections your sales team hears most often before a prospect books time with you." remains (FAQ intro). |
| Unverified claims | **Still there, and more of them.** 60-day guarantee → now "60-day **money-back** guarantee, no questions asked", on every page including every story footer, without v1's hedge. Still: 5.0★ reputation, Henry Schein One API vendor listing, $109K avg. monthly production, +60% collections, 200+ reviews pre-opening. New: one practice per specialty per 10 miles; month-to-month, no contract; the stories' +200% new patients, +250% Yelp organic traffic, Invisalign Diamond in 7 months, 35 reviews in 2 weeks / 4.8★, "#1 across Gemini, Grok and ChatGPT", "#1 observed AI-search choice". |
| New: story CTA button | "Check My Market ↗" on every story's closing CTA renders **white text on a white pill** (`.cta{color:#fff}` + `.btn-light` sets no colour). Same in Sang's own files. |
| Head tags | JSON-LD (FAQ, Organization, VideoObjects, Article), Open Graph and the favicon are dropped (trap 31). The meta description is site-level, so every page carries the home page's. |

### Next

1. Send Sang the link and the table above. The survey's destination, the lead form, the legal
   pages and the guarantee wording must be settled before the domain.
2. After his answers: rerun the package chain (directive → "Brandklout: the package run").
3. Domain cutover via `20-instatic-domain-origins`, only after his approval.

### Gotchas

- **Read `pages.json` slugs, not package paths.** Routes are flat (`/customer-stories-<name>`).
  Anything that builds a URL from a file path is wrong (trap 39).
- `push-site.mjs` without `--force` refuses (the index has content). Before `--apply --force`,
  confirm nobody edited in the admin: `getPages()` `updatedAt`/`updatedBy` and the shell `seq`
  should be the script's own last push (seq 6 after this run).
- `form-probe.mjs` sees four same-host POSTs/HEADs to random 40+-char paths on every page. They
  are not the page's; same as v1 (network filter). Filter them out before reading the result.
- `visual-diff --source` and a live `visual-diff` write the same `-local.png` files: never run them
  at the same time.
- The Railway link dir is per session (`railway link -p 550ebd58-… -e production -s Brandklout`
  in a scratch dir; run with `env -u RAILWAY_TOKEN -u RAILWAY_PROJECT_ID`).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
