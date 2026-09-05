## DONE 2026-08-22 (session 7): the Embed block is gated where a PERSON meets it — `63e94ae`, `cbf532a`

**The capability the client asked for — "add an iframe on an embed element, available for developers and marketers so we can hand off that capability" — already existed in v1.1.0, but nothing had ever proved the half that matters to a human.** Every gate placed the block by writing nodes into the site document over the API. None of them opened the editor.

Those are two code paths and only one was covered. Publish is `moduleAdapter` + the QuickJS sandbox, server side. The editor is `editorPluginLoader.ts` running in the BROWSER, importing `/uploads/plugins/<id>/<version>/modules/index.js` and registering the default export into the inserter — **and it fails silently by design**: a pack that 404s, that is not browser-valid ESM, or whose `modules.register` grant was dropped, leaves the plugin card reading `active` and the inserter with no Embed in it, while the published page keeps working and tells you nothing.

`16-instatic-plugins/verify-embed-editor.mjs` closes that. **11/11, three consecutive runs.** It drives the real admin under CDP and asserts the pack was fetched and returned 200, the inserter opens, Embed is offered in it (22 items, beside `base.image` / `base.video`), clicking it puts a block on all three breakpoint canvases with the placeholder copy that tells the person what to do next, and the Properties Panel exposes all ten declared controls.

```bash
cd deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins
node verify-embed-editor.mjs --place     # temp DRAFT page
node verify-embed-editor.mjs --check     # 11/11
node verify-embed-editor.mjs --cleanup   # deletes it
```

**It publishes NOTHING.** The editor reads the draft, so the temp page never needs baking — which deliberately keeps the whole gate off the publish path that cost the home page its review wall. The temp page has been deleted and `/plugin-embed-editor-test` returns 404.

### Traps, all now in the directive

- **The deployed admin has no `toolbar-add-module-btn`.** That is `ModulePickerDropdown.tsx` in the v0.0.16 zip only. A gate written from the source waits for a button that never appears and reports "the editor never loaded" on a fully loaded editor. The real doors are `canvas-notch-add-btn` and `dom-tree-insert-module`. **Dump `[data-testid]` off the running page; do not trust the zip for admin DOM.**
- **A freshly inserted Embed renders `.wz-embed-note`, not `[data-wz-embed]`** — no URL yet, so `preview()` returns the placeholder, which is the correct render.
- **Canvas iframes carry `[data-plugin-canvas-module]`, not `[data-node-id]`.** Filtering on the latter skips all three frames silently.
- **The notch button mounts before hydration finishes.** An insert fired into that window lands on the canvas but never *selects*, so the Properties Panel never opens and the gate reads a working block as broken. Wait for `dom-panel-ready`, settle, then poll for `property-control-source` — a fixed 3.5s sleep caught the canvases on one run and neither on the next.
- **Backticks in a JS comment inside a CDP template literal terminate the literal**, surfacing as `SyntaxError: missing ) after argument list` pointing at a line that looks fine.

### The handoff artifact

`16-instatic-plugins/handoff/embed-block-guide.html` — the non-engineer version, published at <https://claude.ai/code/artifact/45d0a779-2eb6-4508-a3c5-56d9f6bd8f07>. Five steps, every field with a reason to touch it or leave it, the two canvas states that look like faults and are not, and the frame-vs-script distinction given real weight rather than listed as two boxes. Give a marketer that, a developer the directive.
