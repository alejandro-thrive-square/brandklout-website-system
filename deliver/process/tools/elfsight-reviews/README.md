# Elfsight Google Reviews widgets

**The rule: every client has exactly one Google Reviews widget on its own Google listing.**
Check this registry before you create one. Elfsight has no API for listing or creating widgets,
and each widget uses one of the shared account's 50 Google Reviews slots.

| File | Job |
| :--- | :--- |
| `review-widgets.json` | **The registry.** One row per client (the same 29 keys as Termly's `termly-websites.json`): widget id, account, connected listing, the verified rating, a state, and notes. |
| `scan-reviews.mjs` | Read-only. For every site, lists the Elfsight app ids on its homepage and review pages, any other review vendors it loads, and its JSON-LD address. |
| `boot-ids.mjs` | Read-only. Queries Elfsight's public boot API (`core.service.elfsight.com/p/boot/?w=<id>`, no login) for each id's app type, status and connected Google place. It also catches deleted apps (`WIDGET_NOT_FOUND`) that sites still embed. |
| `elfsight_widget.py` | Creates **one** widget (`--widget new`) or resumes one by id: Carousel template, source search, the result whose text contains `--expect`, the name, then Publish. It runs over CDP in its own background tab; no screenshots, no model. |
| `elfsight_render.py` | Read-only. Renders widgets on a local test page, as a visitor sees them, and reports each one's rating, review count and first reviewer. This is the proof step. |
| `check-widget.mjs` | Read-only gate for the [in-section standard](#in-section-widget-standard-sop): reads the widget's settings from the boot API, compares them with the site (`--style`), and with `--render <page>` checks what a visitor sees. |
| `codex-instruction.txt` | The Codex brief that applies the standard in the Elfsight editor. |

Dashboard work that these scripts don't cover (checking the dashboard list, editing a widget's
settings) goes through [codex-computer-use](../codex-computer-use/README.md), the house standard
since 2026-10-02. The Python scripts run inside the Jev clone (`~/tools/jev-ultrafast`, see
[jev-browser-agent](../jev-browser-agent/README.md)), which provides `browser_harness`. Chrome
needs remote debugging on and the account signed in; after a Chrome restart, Chrome asks
"Allow remote debugging?" once, and the user approves it.

## Rollout, per client (modelled on the Termly rollout)

1. **Inventory.** Run `node scan-reviews.mjs <termly-websites.json> > scan.json`, then
   `node boot-ids.mjs scan.json [dashboard ids…] > boot.json`. Compare the site ids against the
   dashboard list (`dash.elfsight.com/apps/google-reviews`, all pages).
2. **No duplicates.** A client is covered when any widget, in **either** account, is on its
   listing. Match on the listing (address, suite), not the widget name. Stone Dental (#110A) and
   Stone Surgical Arts (#110) share a building, and Mason Park's widget is an *All-in-One Reviews*
   app in the other account. Where coverage is unsure, skip the client and list it for the user.
3. **Create.** Run
   `uv run python elfsight_widget.py --widget new --query "<Name>, <street>, <City ST>" --expect "<street or name>" --name "<Client> - Google Reviews"`.
   It prints `created <id>` first. On any failure, rerun with `--widget <id>` and **never** with
   `new`: opening the create page makes a widget immediately.
4. **Verify.** Put the ids on a page (`<section data-w="<id>"><div class="elfsight-app-<id>"></div></section>`
   plus `platform.js`), serve it on 127.0.0.1, and run `elfsight_render.py`. Every row needs a
   rating and a count.
5. **Record.** Update the row in `review-widgets.json`, and add a runbook row. Placing the widget on a
   site is a separate step: for Instatic, see Mason Park Kids'
   `workflows/03-core-pages/.tmp/add-elfsight-reviews.mjs`, and **strip `data-elfsight-app-lazy`**.

## In-section widget standard (SOP)

How a Google Reviews widget looks when it sits **inside a site section that already has its own
heading** (a *Reviews* / *What patients say* section). Owner decision 2026-10-04. The widget brings
the proof (Google logo, rating, review count, cards, a button to Google), the site brings the
heading and the look. Reference: Mason Park Kids' widget `d359c3c4…` already has the right header
(read 2026-10-04) but still shows the widget title and Elfsight's blue and grey.

| Part | Rule | Boot setting the gate reads |
| :--- | :--- | :--- |
| Layout | Carousel (never a badge in a section) | `layout: carousel` |
| **Widget title** | **Off.** The section's own H2 is the heading; no "What Our Customers Say" | `widgetTitle: false` |
| **Header** | **On, layout 1:** Google logo + *Reviews*, rating and **review count** left, button right | `headerLayout: header1`, `headerElements` ⊇ `title, rating, reviewsNumber`, `showOverallRating` |
| Header logo | Google's own colours | `headerSourceImageColor.type: native` |
| **Button** | *Write a review* on, **in the site's main CTA style**: background, text colour, weight, radius, and case via Custom CSS | `showWriteReviewButton`, `theme.themeSettings.writeReviewButton` |
| **Cards** | Site font, body colour 16px text, card background set apart from the section (white on a tinted section, the site's light neutral on a white one), outline body colour at ~12%, the site's card radius (else 16px), *Read more* and verified badge in the button colour, gold stars, Google icon on | `reviewBackgroundColor`, `reviewOutlineColor`, `reviewTextColor`, `reviewCornerRadius`, `reviewReadMoreColor` |
| Plate | Widget background and header background transparent, padding 0: the section is the plate | `widgetBackground`, `widget*Padding`, `headerBackgroundColor` |
| Font | *Apply from Website* (inherits the page font, also into the shadow root) | `themeSettings.font.name` |
| Off | AI summary (adds its own label and block), Elfsight logo | `AISummary: false`, `showElfsightLogo` |
| Arrows, dots | Arrow background = button colour, icon = button text colour; dots = heading colour | `carouselArrow*`, `carouselPaginationColor` |

Light themes only (Brandklout: dark sites do not convert): never Elfsight's dark theme.

### Steps

1. **Widget.** Find the client's row in `review-widgets.json`. No widget yet: create one first
   (rollout steps 2–3 above, one widget per listing).
2. **Site style.** Read it from the live page that will hold the widget, with the GHL forms reader:
   ```bash
   cd deliver/process/tools/ghl-forms
   node site-style.mjs <page url> > output/site-style.json
   ```
   Button = `button` (background, colour, radius, weight, case, letter spacing); text = `body`;
   header text = `heading`. The card background and radius are read by eye from the site's own
   cards (Inspect one); never Elfsight's defaults (`#f6f6f8`, `#006dff`).
3. **Where it stands** (no login):
   ```bash
   cd deliver/process/tools/elfsight-reviews
   node check-widget.mjs <widgetId> --style ../ghl-forms/output/site-style.json > output/elfsight-check.log 2>&1
   ```
   Each `PROBLEM` line is one thing to change.
4. **Custom CSS.** Only what the Style panel cannot set. Fill and keep it this short:
   ```css
   .es-widget-title-container { display: none !important; } /* belt and braces: the section has the heading */
   .es-header-write-review-button { text-transform: {{BUTTON CASE}}; letter-spacing: {{BUTTON TRACKING}}; font-weight: {{BUTTON WEIGHT}}; }
   .es-header-rating-reviews-count { color: inherit; opacity: .7; }
   ```
   These `es-*` classes are Elfsight's stable names (read from the rendered widget on 2026-10-04,
   next to hashed `sc-` classes that change per release; never target those).
5. **Codex.** Fill [`codex-instruction.txt`](./codex-instruction.txt) and run it with writes allowed,
   one widget per run:
   ```bash
   node deliver/process/tools/codex-computer-use/codex_cu.mjs "<filled instruction>" --allow-writes --timeout 30
   ```
   A whole-widget brief can stop halfway (see the GHL forms gotcha "one Codex run = one small,
   saved step"): if it does, split it into (1)–(3) header/title, (4)–(5) style, (6) CSS.
6. **Place** it in the section, under the section's heading, as `<div class="elfsight-app-<id>"></div>`
   plus `https://elfsightcdn.com/platform.js` once per page. Instatic: strip `data-elfsight-app-lazy`
   and let `embed-origins` open the Elfsight origins ([instatic-embeds](../instatic-embeds/instatic-embeds.md));
   Webflow: an Embed element inside the section.
7. **Gate** with the render (staging first):
   ```bash
   node check-widget.mjs <widgetId> --style ../ghl-forms/output/site-style.json --render <page url> > output/elfsight-check.log 2>&1
   ```
   It must print `ok`: no widget title on the page, Google logo, count, button and cards visible,
   cards in the page's font, button not Elfsight blue. Then look once at 1440 and 390 px.
8. **Record** the widget id and the colours used in the client runbook and the registry row.

## States

`live-on-site` · `created-not-placed` · `exists-placed-on-wrong-site` · `draft-needs-listing` ·
`other-account-all-in-one`

## Gotchas

- **Elfsight ignores `element.click()`.** Every click has to be a real mouse event at the
  element's page position; iframe coordinates are offset by the owner iframe's box
  (`DOM.getFrameOwner` plus `getBoxModel`, with the frame's own target id).
- **The rename field commits only on an Enter key event that carries the text CR** (`chr(13)`).
- **The search dropdown also echoes the typed query, and a hidden live region repeats the result
  text.** Pick a row that contains `--expect`, reads like a result (`USA` or `(count)`), does not
  contain the query, and passes a hit test. Clicking the echo resets the search.
- **Some businesses appear in the dropdown as a bare address** (Kissimmee, IFA, Oceanic). That is
  still the business place: `boot-ids.mjs` shows its name, and the render shows its reviews.
- **The editor's own preview is a nested frame, and the review text sits in shadow roots.** Read
  results from `elfsight_render.py`, not from the editor.
- **Writing these scripts through a bash heredoc drops backslashes** (`\r`, `\n`, regex escapes).
  Edit them with an editor.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md) §4. The registry and the
scripts are tracked. No credentials are involved: the Elfsight session lives in the user's Chrome.
