## DONE 2026-08-24 (session 10d): link URLs are editable via a PLUGIN — INSTALLED & VERIFIED LIVE

Supersedes 10c. **The client rejected the platform patch**: modifying the
Instatic image means re-applying the diff on every upstream release, and that
maintenance debt is not worth one control. Workflow 17 is now marked reference-
only and NOT deployed. Docker/`bun`/`tsc` are no longer on the critical path —
that whole blocker is gone.

### The diagnosis was right; the conclusion was too narrow

Re-verified `UrlControl.tsx` line by line: the mechanism in 10c is accurate.
What 10c got wrong is "a plugin cannot fix this" — it tested only
`modules.register` (a replacement Button module), correctly rejected that on the
wrapper-div problem, and stopped. **It never looked at the editor-plugin
surface.** That surface is fully implemented in 0.0.16:

| Permission | Grants |
|---|---|
| `editor.code` | plugin JS in the admin window, UNSANDBOXED, full admin privileges (`dangerous`) |
| `editor.store.read` | `api.editor.store.read()` → the whole `EditorStore`, actions included |
| `editor.store.write` | `transaction(mutate)` → mutable draft of the entire store |
| `editor.panels` | a React panel in the editor's left rail |

`editorPluginLoader.ts` really loads the entrypoint; `runtime.ts:489-508` wires
`read`/`transaction` behind `assertPluginPermission`. Not just typed.

**Rule going forward: check the editor-plugin surface before ever proposing a
platform patch to editor behaviour.**

### Also missed in 10c: `UrlControl` already has a Page mode

The control renders a URL/Page `SegmentedControl`. `handlePagePick` calls
`onChange` **unconditionally — no validation at all** — storing `cms:page:<id>`,
which `resolvePageRefProps` (`publisher/renderNode.ts:63`) resolves generically
for any prop on any module at publish time. For a plain internal link that
works today with zero code, and it survives slug renames. Its limits: it cannot
type a fragment, and it cannot express `tel:`.

### What was built

`deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/link-editor/` —
`webzite.link-editor` v1.0.0. Two files, hand-written ESM, **no build step**
(bare specifiers resolve through the host import map; `createElement`, no JSX).
Adds a **Link URL** panel to the editor rail: reads the selection via
`useEditorStore`, writes via `store.read().updateNodeProps(nodeId, { href })`.
Nothing about `UrlControl` changes.

Two decisions to carry to any future editor plugin:

1. **The draft is local React state.** That IS the fix. Deriving the input from
   the store is exactly what makes the platform's field snap back. Let it be
   typed freely; decline to COMMIT an unsafe value rather than refusing to let
   it be TYPED.
2. **Write through the store ACTION, not `store.transaction`.** The store is
   `zustand-mutative`, so `transaction(fn)` hands a DRAFT — calling
   `state.updateNodeProps(...)` on it re-enters `set()` inside a producer.
   `read()` returns `getState()` with the real actions, which is what the
   platform's property panel itself calls (undo coalescing for free).

### Verified

`node verify-link-editor.mjs` — **53/53**. Behaviour of the safety gate, plus a
**drift test**: it re-reads the host's `src/core/html-sanitize/index.ts` and
fails if `SAFE_URL_SCHEMES` / `isSafeUrl` / `urlScheme` change, because the
plugin has to transcribe them (`@core/*` is not on the plugin import map).

`node install-plugin.mjs .tmp/link-editor.zip` — dry run passes: the LIVE
instance parsed the manifest and echoed the four permissions. Embed Origins
dry-run re-checked, no regression from the install-script change.

### Installed and verified live — v1.0.2

`webzite.link-editor` is **installed on `encorercm.com`**, `active`, `lastError: null`,
all four permissions granted. Driven under CDP against the real editor on the home
page's `Book a Free Consult` CTA:

| Typed | Result |
|---|---|
| `…#book` appended to a `cms:page:` ref | committed — a fragment on a page ref, unreachable from the Page picker |
| `tel:+15717029900` | committed |
| `#book` | committed; canvas re-rendered `<button>` → `<a href="#book">` in all 3 frames |
| `javascript:alert(1)` | refused, field invalid, warning shown, **node untouched after 1.2 s** |
| a `base.container` | "has no link address" empty state |

Restored to the original `cms:page:5eKjtlsP8RzgQ-CM7rh2c` and re-read over the API:
**MATCH, no test residue in any of the 37 page trees.** Draft still `seq 67`, nothing
published.

### v1.0.0 and v1.0.1 BOTH failed live while the offline gates passed

Worth internalising: the source-level gates said ALL PASS for two broken builds. Both
bugs needed the real editor.

1. **v1.0.0 — the field would not accept a single character.** `Input` from
   `@instatic/host-ui` is **not** the design-system Input; it is `PluginInput`, a
   narrowed wrapper. **`onChange` is handed the STRING, not the event**, so
   `(e) => e.target.value` threw on every keystroke and the field silently refused
   input. Anything outside `PluginUiInputProps` is also dropped — `id`, `fieldSize`,
   `autoComplete`, `spellCheck` all did nothing, and the wrapper assigns its own `id`
   via `useId()`. Use its `label`/`description`; it renders them in a host `FormField`.
2. **v1.0.1 — committing per keystroke wrote junk.** Every PREFIX of what is typed got
   written, and every prefix of a dangerous value is itself safe: `javascript:alert(1)`
   walks `j`, `ja`, … `javascript`, all schemeless, all committed, and only the colon
   stops it. The live node was left holding `javascript` **while the panel said "Not
   saved"**. Now debounced 400 ms with an immediate commit on blur, and the pending
   write captures its node id so it cannot land on a later selection.

`verify-link-editor.mjs` is now **53 assertions** and asserts both of these, plus the
`html-sanitize` drift test and the no-raw-control-characters check.

### Gotchas earned here

- **Page refs must be allowed through the commit gate explicitly.**
  `urlScheme('cms:page:x')` = `cms:`, so `isSafeUrl` refuses it; gating on
  `isSafeUrl` alone leaves a page-ref link uneditable in *exactly* the way the
  platform's field is. The verify gate caught this, not inspection.
- **Never write a literal `[\u0000-\u0020]` range into JS source.** It puts a
  real NUL byte in the file — `grep` reports "binary file matches" and several
  write paths silently failed to replace it. Fixed via `String.fromCharCode`;
  the verify gate now asserts no raw control characters.
- **`install-plugin.mjs` grants are now keyed by plugin id.** The flat `GRANT`
  list would have handed the new plugin the old one's permissions.
- **There is no right-hand inspector extension point** — `editor.panels` is the
  left rail only. The field is not beside the platform's own Link URL control.
- **Reload the editor tab after install**; plugins activate at admin boot.

### NOT done

1. **Nothing published.** The plugin only affects the ADMIN editor, not the
   published site, so no publish is required for it — but the draft still sits at
   `seq 67` with 10a/10b work on it.
2. **Only the single-node path is exercised.** Multi-select, visual-component
   documents (deliberately unsupported) and the `url` prop on the Embed block are
   untested in the browser.
3. Still open from 10a/10b: the contact split + CTA-offices work sits on the
   **draft at `seq 67`**, unpublished and uncommitted; the CTA scroll change
   (23 pages → `#book`) is still parked, and this plugin is what unblocks it;
   the home page still has ZERO `.rv-card` review fallbacks.
