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

The Python scripts run inside the Jev clone (`~/tools/jev-ultrafast`, see
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
