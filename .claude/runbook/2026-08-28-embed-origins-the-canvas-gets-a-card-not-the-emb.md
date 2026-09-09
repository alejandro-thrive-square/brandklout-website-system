## 2026-08-28 — embed-origins: the canvas gets a card, not the embed (UNCOMMITTED)

**Ask**: the Embed block "renders weirdly on the canvas inside Instatic"; it only has to work
once published.

**Done.** `preview()` — the editor-only path — no longer emits the frame or the snippet. It
returns a static card: mode, destination host(s), what a snippet contains, the height rule, and
"Appears when the page is published". `render()` (publish) is byte-for-byte unchanged, which is
the point: nothing about the live sites' output moves.

Why the live render was wrong on the canvas, in both modes and for opposite reasons:

- a **URL-mode iframe DOES load** in the editor (the admin CSP sets no `frame-src`), so the
  vendor's widget booted inside the canvas and then sat at its *starting* height forever — the
  auto-height runtime is a `render()` output and never ships to the canvas. A widget that
  publishes at 1800px showed as a 600px box with its own scrollbar;
- a **snippet** is mounted with `dangerouslySetInnerHTML`, so its `<script>` never runs and what
  appears is the vendor's *undressed* markup, while any `<style>`/`<link>` in the same paste
  leaks OUT of the module and restyles the editor around it.

**Versions**: plugin `1.3.0` → **`1.4.0`**, module `1.0.0` → **`1.1.0`**.

**Changed, in both copies (they are byte-identical and must stay so)**:
`deliver/process/18-instatic-embeds/` and
`deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/` —
`embed-origins/modules/index.js`, `embed-origins/plugin.json`, `embed-origins/README.md`,
`test-embed-module.mjs`, `handoff/embed-block-guide.html`, and each folder's directive `.md`.

**Gates**: `test-embed-module.mjs` **54/54** (was 44 — 2 old preview assertions replaced by 12
new ones), `test-embed-origins.mjs` 54/54, both green in both copies. `pack-plugin.mjs` packs
clean (4 entries). Nothing was installed and nothing was published.

### SHIPPED — both sites are on 1.4.0, gated live

| Site | Base URL | Was | Now | Canvas gate |
|---|---|---|---|---|
| Dr. Nahlah | `https://encorercm.com` | 1.3.0 | **1.4.0** | **15/15** |
| Mason Park | `https://mason-park.up.railway.app` | 1.3.0 | **1.4.0** | **15/15** |

Both enabled, `lastError: null`, and settings survived the upgrade (Dr. Nahlah keeps
`frameOrigins: https://reputationhub.site`; both stay `compatible` + `autoTrust`). **Nothing was
published on either site** — the editor reads the draft, so the gates never needed a bake.

Installed from each site's OWN worktree (`bk-dr-nahlah`, `bk-mason-park`), because `.env` is
per-worktree and main's has no `INSTATIC_BASE_URL` on purpose. Do not run these from main.

```bash
cd <worktree>/deliver/process/18-instatic-embeds
node pack-plugin.mjs embed-origins .tmp/embed-origins.zip
node install-plugin.mjs .tmp/embed-origins.zip --apply   # step-up is automatic from .env
node verify-embed-canvas.mjs --place && node verify-embed-canvas.mjs --check && node verify-embed-canvas.mjs --cleanup
```

### Propagated

`06b9f09` (the change) and `0970867` (the canvas gate) are in **main and all nine worktrees**.
Seven fast-forwarded; `bk-dr-nahlah` and `bk-mason-park` took real merges that auto-resolved and
kept their local directive sections (mason-park's `GRANTS`-by-plugin-id note, nahlah's SEO plugin
chapters). Offline suites re-run in all ten checkouts: 54/54 + 54/54 each, both copies.

**Not pushed to origin** — `main` is 2 commits ahead of `origin/main`.

### Still open

- `verify-embed-editor.mjs` is RED on both sites and was red before this change — see Gotchas.
  It needs a real trusted click (Chrome MCP `computer`) to fix, or the picker step reworked.
- Three plugins (`aeo-schema`, `open-graph`, `link-editor`) are still only in
  `bk-dr-nahlah/.../16-instatic-plugins/` and were never promoted into `deliver/process/`.
  `install-plugin.mjs`'s `GRANTS`-by-plugin-id fix is likewise stranded in `bk-mason-park`.

### Gotchas

- **`verify-embed-editor.mjs` is RED on both sites and it is NOT the plugin.** It failed the same
  four assertions twice on each site: pack fetched 200, "Embed is offered in the inserter" ok,
  then `inCanvas: 0` and an empty Properties Panel — nothing ever got *selected*. The new
  `verify-embed-canvas.mjs` passed **15/15 on the same two sites minutes later**, with configured
  blocks written into the draft, which proves the module, `preview()` and the canvas render are
  all fine and isolates the fault to the synthetic click on the picker item. **Run the canvas gate
  before debugging the plugin from a red editor gate.**
- **A gate made only of negatives passes vacuously.** The canvas gate asserts "no iframe", "no
  injected script", "no vendor request" — all of which an editor that never loaded satisfies
  perfectly. Its first Mason Park run reported four greens over zero rendered canvases. Fixed:
  they now hang off a positive (3 canvases × 3 cards). Watch for this shape in any new gate.
- **60s of editor-ready wait is not enough for a cold Railway dyno.** That alone was the first
  Mason Park failure; at 120s the identical run passed 15/15.
- **A module version bump is not enough on its own** — the editor imports
  `/uploads/plugins/<id>/<version>/modules/index.js`, keyed on the PLUGIN version. That is why
  `plugin.json` went to `1.4.0` too; bumping only the module object's `version` field would have
  left every browser on the old pack.
- **The editor gate's probe is `[data-wz-embed], .wz-embed-note`** and the card carries
  `data-wz-embed="<fit>"`, so `verify-embed-editor.mjs` needed no change. `data-wz-embed-card="1"`
  is the new marker that tells card from real render; `render()` never emits it.
- **Writing `\uXXXX` escapes into a JS file through an editing tool can land as literal control
  bytes.** It happened once here in `hostOf()` and only showed up as `grep: binary file matches`.
  Check with `grep -naP "[\x00-\x08\x0b\x0c\x0e-\x1f]" <file>` after touching a regex.
- **`pack-plugin.mjs` does not create its output directory** — `mkdir -p .tmp` first in a fresh
  clone, or it dies with ENOENT after printing the file list, which reads like a packing failure.
