/**
 * Link Editor — editor entrypoint.
 *
 * WHY THIS PLUGIN EXISTS
 * ----------------------
 * The platform's own "Link URL" field (`UrlControl.tsx`) commits a value only
 * when `isValidUrl()` passes, and that gate accepts absolute `https:`, `http:`
 * and `mailto:` ONLY:
 *
 *     const valid = isValidUrl(v)
 *     setError(!valid)
 *     if (valid) onChange(propKey, v)      // invalid values are never committed
 *
 * The input is controlled straight from the store and the store is only
 * written on a valid value, so every keystroke that leaves the value invalid
 * is discarded and the field re-renders from the UNCHANGED value. Backspacing
 * `#invitation` passes through `#invitatio`, `#invitati`, … — each schemeless,
 * each rejected, each snapped back. The empty string that WOULD be accepted is
 * unreachable, so the field can be neither edited nor cleared. It presents as
 * a broken field, not a restricted one.
 *
 * On the Dr. Nahlah site that is 2,362 of 2,510 link/button nodes: every
 * relative link, every `tel:`, every `#anchor`.
 *
 * This panel is a second, unrestricted way into the same store action. It does
 * NOT patch the platform — nothing about `UrlControl` changes, so there is no
 * fork to re-apply on the next Instatic release.
 *
 * THREE DESIGN DECISIONS WORTH KNOWING
 * ------------------------------------
 * 1. THE DRAFT IS LOCAL STATE. This is the entire fix. `UrlControl` derives
 *    its input value from the store, which is why a rejected keystroke snaps
 *    back. Here the text field is driven by `draft`, so it is always typable
 *    even while the value is momentarily unsafe — we simply decline to COMMIT
 *    an unsafe value rather than refusing to let it be typed.
 *
 * 2. WRITES GO THROUGH THE ACTION, NOT `store.transaction`. The editor store
 *    is `zustand-mutative`, and `api.editor.store.transaction(fn)` calls
 *    `setState((state) => fn(state))` — `state` is a MUTATIVE DRAFT. Calling
 *    `state.updateNodeProps(...)` on that draft would re-enter `set()` from
 *    inside a producer. `store.read()` returns `getState()`, the real store
 *    with the real actions, and `updateNodeProps` is precisely what the
 *    platform's own property panel calls — so we inherit its undo coalescing,
 *    dirty tracking and no-op detection for free. `editor.store.write` is
 *    still requested because this plugin genuinely mutates editor state and
 *    the operator's consent screen should say so.
 *
 * 3. THE WRITE IS DEBOUNCED (400 ms), plus an immediate commit on blur.
 *    Committing per keystroke writes every PREFIX of what is typed, and the
 *    prefixes of a dangerous value are all safe: `javascript:alert(1)` walks
 *    through `j`, `ja`, … `javascript`, each schemeless and therefore
 *    committed, and only the colon makes it stop. The node was left holding
 *    `javascript` while the panel said "Not saved". Seen on the live editor.
 *
 * The bundle is hand-written ESM with no build step: bare specifiers resolve
 * through the host import map in `index.html` (`react` → `/runtime/react.js`,
 * `@instatic/host-hooks` → `/runtime/host-hooks.js`), which re-export the
 * host's live instances from `globalThis.__instatic`. `createElement` is used
 * directly because JSX would require a compiler.
 */
import { createElement as h, useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@instatic/host-hooks'
import { Input } from '@instatic/host-ui'

// ---------------------------------------------------------------------------
// Safety gate — a deliberate mirror of the host's `isSafeUrl()`
// ---------------------------------------------------------------------------
//
// `@core/html-sanitize` is NOT importable from a plugin bundle (the import map
// exposes react / host-ui / host-hooks / plugin-sdk and nothing else), so the
// check is restated here. It is transcribed from the host verbatim, including
// the C0-control handling that fixed GHSA-pqcp-872g-gmp8 — `javascript:` behind
// a leading C0 control, or split by a tab, must not read as safe.
//
// This is a BACKSTOP, not the enforcement gate. The publisher runs its own
// `isSafeUrl()` at export time and collapses anything unsafe to `#`. Declining
// to commit here just means the editor never stores a value the publisher
// would throw away.
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:'])

function urlScheme(value) {
  const normalized = String(value ?? '')
    .replace(/^[\u0000-\u0020]+/, '')
    .replace(/[\u0000-\u0020]+$/, '')
    .replace(/[\t\n\r]/g, '')
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalized)
  return match ? `${match[1].toLowerCase()}:` : null
}

/** Relative forms (`/a`, `./a`, `#anchor`, `?q=1`, `//cdn/x`, ``) plus the safe schemes. */
function isSafeUrl(value) {
  const scheme = urlScheme(value)
  return scheme === null || SAFE_URL_SCHEMES.has(scheme)
}

// A stored internal page reference (`cms:page:<id>`, optionally `#fragment`).
// The publisher resolves these to the target page's CURRENT path before any
// href validation runs (`resolvePageRefProps` in `publisher/renderNode.ts`
// executes ahead of `validateNodeProps` / `escapeProps`), so `cms:` never
// reaches the enforcement gate and never lands in the published HTML.
const PAGE_REF_PREFIX = 'cms:page:'

function isPageRef(value) {
  return String(value ?? '').startsWith(PAGE_REF_PREFIX)
}

/**
 * Whether a draft may be written to the store.
 *
 * Page refs have to be allowed explicitly: `urlScheme()` reads `cms:` as a
 * scheme and `isSafeUrl()` rejects it, so gating on `isSafeUrl` alone would
 * make a page-ref link uneditable in exactly the way the platform's own field
 * is — every intermediate keystroke still carries the `cms:` prefix, so the
 * value could never be edited down to something else.
 *
 * Allowing them is also the one thing this panel can do that the platform's
 * Page picker cannot: `handlePagePick` only PRESERVES an existing fragment
 * (`makePageRef(pageId, ref?.fragment)`) and offers no way to type one, so
 * `cms:page:<id>#book` is unreachable from the native UI.
 */
function isCommittable(value) {
  return isPageRef(value) || isSafeUrl(value)
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

// `base.button` and `base.link` both store the address under `href`
// (`src/modules/base/{button,link}/props.ts`); plugin-provided modules such as
// the Embed block use `url`. Checking both keys keeps this generic rather than
// hard-coding the two base modules.
const LINK_PROP_KEYS = ['href', 'url']

/**
 * Resolve the selected node from the editor store.
 *
 * `@instatic/host-hooks` exposes `useEditorStore` but NOT the host's
 * `selectSelectedNode` selector, so the lookup is rebuilt here. It returns the
 * node object straight out of the tree — a stable reference under Mutative, so
 * Zustand's `Object.is` check does not tear the subscriber between renders.
 *
 * Visual-component documents are deliberately not handled: the host builds a
 * VIRTUAL page for those and the plugin has no access to that memoised
 * builder. Selecting inside a VC shows the "no link" state rather than
 * silently editing the wrong tree.
 */
function selectSelectedNode(s) {
  const id = s.selectedNodeId
  if (!id) return null
  const doc = s.activeDocument
  if (doc && doc.kind !== 'page') return null
  const page = s.site && s.activePageId
    ? s.site.pages.find((p) => p.id === s.activePageId)
    : null
  return (page && page.nodes && page.nodes[id]) || null
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------
//
// `Input` from `@instatic/host-ui` is `PluginInput` — a NARROWED wrapper around
// the host's design-system Input, not the component itself. Its whole contract
// is `PluginUiInputProps`:
//
//     label? value? defaultValue? placeholder? type? invalid? disabled?
//     required? prefix? unit? description? onChange?(value) onBlur?(event)
//
// Anything outside that list is dropped — `id`, `fieldSize`, `autoComplete`
// and `spellCheck` all silently do nothing (the wrapper assigns its own `id`
// from `useId()`). And `onChange` is handed the STRING, not the event.
//
// The wrapper renders `label` and `description` in a host `FormField`, so the
// panel gets native chrome for free and needs no styling of its own beyond
// padding.

const styles = {
  body: { padding: '12px' },
  empty: { fontSize: '12px', lineHeight: 1.5, opacity: 0.65, padding: '12px' },
}

function buildPanelComponent(api) {
  return function LinkEditorPanel() {
    const node = useEditorStore(selectSelectedNode)

    const propKey = node && node.props
      ? LINK_PROP_KEYS.find((k) => typeof node.props[k] === 'string')
      : undefined
    const stored = propKey ? String(node.props[propKey]) : ''
    // Identity of "what is being edited" — changes on a new selection or when
    // the same node's link prop changes key.
    const identity = node ? `${node.id}:${propKey || ''}` : ''

    const [draft, setDraft] = useState(stored)
    const [unsafe, setUnsafe] = useState(false)
    // The last value THIS panel wrote. Lets an external change (undo, a canvas
    // edit, the platform's own URL field) reseed the draft, without the
    // panel's own commits bouncing back and fighting the cursor.
    const committed = useRef(stored)

    // Pending debounced write. See `onChange` for why the commit is delayed.
    const timer = useRef(null)
    // The node + prop the pending write belongs to, captured at schedule time
    // so a commit can never land on a node the user has since moved off.
    const target = useRef(null)

    const cancelPending = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }

    useEffect(() => {
      setDraft(stored)
      setUnsafe(false)
      committed.current = stored
      cancelPending()
      // Reseeding is keyed on WHAT is selected, not on the stored value: if it
      // ran on `stored` too, declining to commit an unsafe keystroke would
      // snap the field back and reintroduce the exact bug this panel exists to
      // fix.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity])

    useEffect(() => {
      if (stored !== committed.current) {
        setDraft(stored)
        setUnsafe(false)
        committed.current = stored
      }
    }, [stored])

    // Drop a pending write if the panel goes away mid-edit.
    useEffect(() => cancelPending, [])

    if (!node) {
      return h('div', { style: styles.empty },
        'Select a button or link on the canvas to edit its address.')
    }

    if (!propKey) {
      return h('div', { style: styles.empty },
        `The selected element (${node.moduleId}) has no link address.`)
    }

    // NOTE THE SIGNATURE. `@instatic/host-ui`'s `Input` is NOT the host's own
    // design-system Input — it is `PluginInput`, a narrowed wrapper whose
    // handler is `onChange?: (value: string) => void`. It calls
    // `props.onChange(event.currentTarget.value)`, so a handler written as
    // `(e) => e.target.value` throws on EVERY keystroke and the field silently
    // refuses to accept input. Found the hard way against the live editor.
    //
    // WHY THE WRITE IS DEBOUNCED. Committing on every keystroke looks fine
    // until the finished value is one we refuse. Typing `javascript:alert(1)`
    // walks through `j`, `ja`, … `javascript` — every one of those is
    // schemeless and therefore SAFE, so each gets written — and only at the
    // colon does the value turn dangerous and stop being committed. The node
    // is then left holding `javascript` while the panel says "Not saved".
    // Observed on the live editor, not theorised.
    //
    // Waiting for a pause means the intermediate prefixes are never written:
    // the only value that reaches the store is one the user stopped typing on.
    // Blur commits immediately so clicking straight onto another element
    // cannot lose the edit.
    const COMMIT_DELAY_MS = 400

    const commit = (v) => {
      cancelPending()
      if (!isCommittable(v)) return
      if (v === committed.current) return
      committed.current = v
      const t = target.current
      if (!t) return
      // `read()` hands back the live store with its actions — the same
      // `updateNodeProps` the platform's property panel calls. See the header
      // note on why this is not `store.transaction`.
      api.editor.store.read().updateNodeProps(t.nodeId, { [t.propKey]: v })
    }

    const onChange = (v) => {
      setDraft(v)
      setUnsafe(!isCommittable(v))
      target.current = { nodeId: node.id, propKey }
      cancelPending()
      timer.current = setTimeout(() => {
        timer.current = null
        commit(v)
      }, COMMIT_DELAY_MS)
    }

    const onBlur = () => commit(draft)

    // One contextual line under the field, most specific first. `PluginInput`
    // renders `label` and `description` itself inside a host `FormField`, so
    // using them keeps the panel looking native — and is the only way to label
    // the field at all, since the wrapper generates its own `id` via `useId()`
    // and ignores any `id` passed in.
    const description = unsafe
      ? 'Not saved — that scheme is blocked (javascript:, vbscript: and data: are '
        + 'stripped when the site is published). Everything else is allowed.'
      : isPageRef(draft)
        ? 'Page reference — resolves to the target page\'s current path when the site '
          + 'publishes, so it survives a slug rename. Add a #fragment on the end to land '
          + 'on a section (the Page picker cannot do that); replace the whole value to '
          + 'turn it into a fixed address.'
        : 'Saves a moment after you stop typing. Relative paths (/contact), on-page anchors '
          + '(#book), phone (tel:) and SMS (sms:) links all work here.'

    return h('div', { style: styles.body },
      h(Input, {
        label: `Link address (${propKey})`,
        description,
        // NOT type="url": the browser's own validation UI flags relative
        // values, which is the same complaint in a different coat.
        type: 'text',
        value: draft,
        placeholder: '/contact, #book, tel:+1…, https://…',
        invalid: unsafe,
        onChange,
        onBlur,
      }),
    )
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export function activate(api) {
  const granted = (api.plugin && api.plugin.permissions) || []
  const missing = ['editor.panels', 'editor.store.read', 'editor.store.write']
    .filter((p) => !granted.includes(p))
  if (missing.length) {
    // The host logs activation failures onto the plugin card; a thrown error
    // is more useful than a panel that mounts and then throws on first render.
    throw new Error(
      `[webzite.link-editor] missing permission(s): ${missing.join(', ')}. `
      + 'Grant them on the Plugins page and reload the editor.',
    )
  }

  api.editor.panels.register({
    id: 'webzite.link-editor.panel',
    label: 'Link URL',
    iconName: 'text-start-t',
    accent: 'sky',
    component: buildPanelComponent(api),
  })
}

export default { activate }
