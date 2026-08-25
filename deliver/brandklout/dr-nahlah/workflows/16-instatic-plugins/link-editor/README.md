# Link Editor — `webzite.link-editor` v1.0.2

Adds a **Link URL** panel to the Instatic editor rail. Select a button or link
on the canvas, and its address becomes editable — internal pages, on-page
anchors and phone numbers included.

## The problem it solves

The platform's own "Link URL" field cannot express most of the links this site
actually uses. `UrlControl.tsx` commits a value only when `isValidUrl()` passes:

```ts
const valid = isValidUrl(v)
setError(!valid)
if (valid) onChange(propKey, v)      // invalid values are never committed
```

and `isValidUrl()` accepts absolute `https:` / `http:` / `mailto:` **only** —
its own doc comment lists "schemeless values" among what it rejects.

Because the input is controlled from the store and the store is written only on
a valid value, every keystroke that leaves the value invalid is discarded and
the field re-renders from the unchanged value. Backspacing `#invitation` passes
through `#invitatio`, `#invitati`, … — each schemeless, each rejected, each
snapped back. The empty string that *would* be accepted is unreachable, so the
field can be neither edited nor cleared.

**It reads as a broken field, not a restricted one.** That is what the client
reported. On this site it affects **2,362 of 2,510** link/button nodes: 1,954
relative links, 345 `tel:`, 29 `#fragment` buttons, 33 relative buttons.

## Why a plugin and not a patch

A three-file patch to `isValidUrl()` exists and works
(`../../17-instatic-platform-patch/`). It was **not** taken, on the client's
call: patching `corebunch/instatic` means rebuilding the image and re-applying
the diff on every upstream release — permanent maintenance debt for a
one-control problem.

This plugin changes nothing about `UrlControl`. It is a second, unrestricted
route into the same store action, and it survives an Instatic upgrade the way
any other installed plugin does.

## How it works

| Piece | Mechanism |
| :--- | :--- |
| Runs in the editor | `entrypoints.editor` + the `editor.code` permission — unsandboxed ES module dynamically imported into the admin window |
| Draws the panel | `api.editor.panels.register({ component })`, mounted in the left rail |
| Reads the selection | `useEditorStore` from `@instatic/host-hooks` |
| Writes the value | `api.editor.store.read().updateNodeProps(nodeId, { href })` |

**No build step.** Both files are hand-written; bare specifiers (`react`,
`@instatic/host-hooks`, `@instatic/host-ui`) resolve through the host import map
in `index.html`, which re-exports the host's live instances from
`globalThis.__instatic`. `createElement` is used directly because JSX would
need a compiler.

### The three decisions that matter

**1. The draft is local React state.** This is the entire fix. `UrlControl`
derives its input value from the store, which is exactly why a rejected
keystroke snaps back. Here the field is driven by `draft`, so it stays typable
even while the value is momentarily unsafe — the panel declines to *commit* an
unsafe value rather than refusing to let it be *typed*.

**2. Writes go through the action, not `store.transaction`.** The editor store
is `zustand-mutative`. `api.editor.store.transaction(fn)` calls
`setState((state) => fn(state))`, so `state` is a **Mutative draft** — calling
`state.updateNodeProps(...)` on it would re-enter `set()` from inside a
producer. `store.read()` returns `getState()`, the real store with the real
actions, and `updateNodeProps` is precisely what the platform's own property
panel calls, so undo coalescing, dirty tracking and no-op detection all come
along for free.

`editor.store.write` is still requested: the plugin genuinely mutates editor
state and the operator's consent screen should say so.

**3. The write is debounced (400 ms), with an immediate commit on blur.**
Committing on every keystroke writes every *prefix* of what is typed — and
every prefix of a dangerous value is itself safe. Typing `javascript:alert(1)`
walks through `j`, `ja`, … `javascript`, each schemeless and therefore
committed, and only the colon makes it stop. The node was left holding
`javascript` while the panel said "Not saved". Caught on the live editor, fixed
in v1.0.2; the verify gate now asserts the delay is still there.

### The `@instatic/host-ui` Input is not the design-system Input

Worth knowing before writing any other editor plugin. `Input` from the host-ui
shim is **`PluginInput`**, a narrowed wrapper. Its entire contract is
`PluginUiInputProps`:

```
label? value? defaultValue? placeholder? type? invalid? disabled?
required? prefix? unit? description? onChange?(value) onBlur?(event)
```

Two traps:

- **`onChange` receives the STRING, not the event.** The wrapper calls
  `props.onChange(event.currentTarget.value)`. A handler written as
  `(e) => e.target.value` throws on every keystroke, and the field silently
  refuses input with no console error surfaced to the user. This cost a
  debugging round against the live editor.
- **Anything outside that list is dropped.** `id`, `fieldSize`, `autoComplete`
  and `spellCheck` all silently do nothing — the wrapper assigns its own `id`
  from `useId()`. Use `label` and `description`, which it renders in a host
  `FormField`, and the panel gets native chrome for free.

### What it accepts

Anything the publisher would keep — a deliberate mirror of the host's
`isSafeUrl()`: every relative form (`/contact`, `./a`, `#book`, `?q=1`,
`//cdn/x`, empty) plus `http:`, `https:`, `mailto:`, `tel:`, `sms:`.

`javascript:`, `vbscript:` and `data:` are refused, including behind a leading
C0 control or split by a tab (GHSA-pqcp-872g-gmp8). This is a **backstop**, not
the enforcement gate — the publisher runs its own `isSafeUrl()` at export time
and collapses anything unsafe to `#`. Declining to commit here just means the
editor never stores a value the publisher would throw away.

**Page refs (`cms:page:<id>`) are allowed explicitly.** `urlScheme()` reads
`cms:` as a scheme, so gating on `isSafeUrl` alone would leave a page-ref link
uneditable in precisely the way the platform's field is. Allowing them is also
the one thing this panel can do that the native Page picker cannot: that picker
only *preserves* an existing fragment (`makePageRef(pageId, ref?.fragment)`)
and offers no way to type one, so `cms:page:<id>#book` is unreachable from the
stock UI.

## What it does not cover

- **Visual-component documents.** The host builds a *virtual* page for those via
  a memoised builder the plugin cannot reach, so selecting inside a VC shows the
  "no link" state rather than risking an edit to the wrong tree.
- **The property panel itself.** Plugins can register left-rail panels
  (`editor.panels`); there is no extension point on the right-hand inspector, so
  the field lives in the rail rather than beside the platform's own Link URL
  control.
- **Multi-select.** Edits apply to the single anchor node.

## Install

```bash
cd deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins
node pack-plugin.mjs link-editor .tmp/link-editor.zip
node install-plugin.mjs .tmp/link-editor.zip            # dry run — shows the grants
node install-plugin.mjs .tmp/link-editor.zip --apply
```

Then **reload the editor tab**: plugins activate at admin boot, and
`useInstalledEditorPlugins` only re-runs on `CMS_PLUGINS_CHANGED_EVENT`.

`install-plugin.mjs` holds a per-plugin grant table and refuses any id it has no
entry for, so a package cannot widen what it receives by editing its own
manifest.

## Verify

```bash
node verify-link-editor.mjs                        # 53 assertions
node verify-link-editor.mjs --host=<instatic-src>  # non-default checkout
```

The gate re-reads **both** implementations from source — the plugin's and the
host's `src/core/html-sanitize/index.ts` — and fails if the host's
`SAFE_URL_SCHEMES`, `isSafeUrl` or `urlScheme` have drifted from what this copy
was transcribed against. A hand-copied security check rots silently otherwise;
this makes an upstream change to the enforcement gate a test failure rather
than a quiet divergence.

## Version Control

Follows the version control rules in
[SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). The packaged `.zip` under
`.tmp/` is a build artifact and is not committed.
