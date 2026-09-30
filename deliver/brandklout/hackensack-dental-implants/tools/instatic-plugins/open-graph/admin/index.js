/**
 * Open Graph — admin page.
 *
 * A thin React view over the plugin's own server routes. It holds no rules of
 * its own: what a page WOULD get is computed by the server from the same mirror
 * the publish filter reads, so the preview here and the tags in the published
 * page cannot disagree.
 *
 * No build step. Bare specifiers (`react`, `@instatic/host-hooks`,
 * `@instatic/host-ui`) resolve through the host import map in `index.html`,
 * which re-exports the host's live instances from `globalThis.__instatic`.
 * `createElement` is used directly because JSX would need a compiler.
 *
 * ## The one trap worth knowing before editing this file
 *
 * `Input`, `Textarea` and `Select` from `@instatic/host-ui` are the NARROWED
 * plugin wrappers (`PluginInput` &c.), and their `onChange` receives the
 * **string value, not the event**. A handler written as `(e) => e.target.value`
 * throws on every keystroke and the field silently refuses input with nothing
 * in the console. Anything outside `PluginUi*Props` — `id`, `name`,
 * `autoComplete`, `spellCheck` — is dropped on the floor.
 */
import { createElement as h, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePluginRoutes } from '@instatic/host-hooks'
import {
  Alert, Button, Card, EmptyState, Heading, Input, SearchBar, Select,
  Separator, Stack, Text, Textarea,
} from '@instatic/host-ui'

/* ── the popup ────────────────────────────────────────────────────────────
 * A native `<dialog>` driven by `showModal()`, not a hand-rolled overlay.
 * The browser then supplies the focus trap, the inert background, Escape,
 * and the top layer — which is the part that matters here, because the top
 * layer escapes `overflow` and ancestor transforms, and the admin shell has
 * both. A `position: fixed` div would have been clipped by the scroll
 * container this page lives in.
 *
 * `::backdrop` cannot be set from an inline style, so one stylesheet is
 * injected once. The dialog itself is transparent and unpadded; the visible
 * surface is the host's own `Card`, so the popup is themed by the admin and
 * not by guesses about its colour tokens.
 */
const MODAL_STYLE_ID = 'wz-plugin-modal-style'
function ensureModalStyles () {
  if (typeof document === 'undefined' || document.getElementById(MODAL_STYLE_ID)) return
  const el = document.createElement('style')
  el.id = MODAL_STYLE_ID
  el.textContent =
    // `inset: 0` + `margin: auto` is what centres a modal dialog. The UA sheet
    // does it for you ONLY while nothing else sets margin or inset; the admin's
    // global reset does, and without these three the popup pins itself to the
    // top-left corner — which is what it did the first time.
    'dialog.wz-modal{position:fixed;inset:0;margin:auto;border:0;padding:0;background:transparent;' +
    'width:min(920px,92vw);max-width:92vw;max-height:88vh;height:fit-content;overflow:visible}' +
    'dialog.wz-modal::backdrop{background:rgba(0,0,0,.62)}' +
    'dialog.wz-modal>.wz-modal-inner{max-height:88vh;overflow:auto}'
  document.head.appendChild(el)
}

function Modal ({ open, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => { ensureModalStyles() }, [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    // Never call showModal() on an already-open dialog — it throws
    // InvalidStateError and the whole tree unmounts.
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    /* `close` is the authority here, not `cancel`.
     *
     * Escape is a UA-level close request. Cancelling it and closing from React
     * instead LOOKS right and was measured wrong: the element closed, the
     * `cancel` handler never ran, React went on believing the popup was open,
     * and the row could never be reopened because `open` never changed.
     * Listening to `close` — which fires however the element closed, including
     * our own `d.close()` — keeps React and the DOM agreeing on one source of
     * truth. The extra `onClose()` our own close triggers is a no-op.
     */
    const onClosed = () => onClose()
    // A click on the backdrop targets the dialog itself; a click on anything
    // inside targets that child. This is why the dialog carries no padding.
    const onClick = (e) => { if (e.target === d) onClose() }
    d.addEventListener('close', onClosed)
    d.addEventListener('click', onClick)
    return () => { d.removeEventListener('close', onClosed); d.removeEventListener('click', onClick) }
  }, [onClose])

  // The element stays mounted so the ref exists to call showModal() on; the
  // children do not, so a closed popup holds no draft state.
  return h('dialog', { ref, className: 'wz-modal', 'aria-modal': 'true' },
    open ? h('div', { className: 'wz-modal-inner' }, children) : null)
}

const FIELDS = [
  { id: 'title', label: 'og:title', hint: 'Blank uses the page title.' },
  { id: 'description', label: 'og:description', area: true, hint: 'Blank uses the page SEO description.' },
  { id: 'image', label: 'og:image', hint: '/uploads/… or a full https:// address. Blank uses the first picture on the page, then the fallback.' },
  { id: 'imageAlt', label: 'og:image:alt', hint: 'What the picture shows. Read aloud where the network supports it.' },
  { id: 'url', label: 'Canonical URL', hint: 'Blank uses the page address derived from the site URL.' },
]

const TYPE_OPTIONS = [
  { label: 'Derived (article for journal entries, website otherwise)', value: '' },
  { label: 'website', value: 'website' },
  { label: 'article', value: 'article' },
  { label: 'profile', value: 'profile' },
]

function useRows (routes) {
  const [state, setState] = useState({ loading: true, error: null, pages: [], settings: {} })
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await routes.fetch('/pages')
      if (!res.ok) throw new Error('the plugin route answered ' + res.status)
      const body = await res.json()
      setState({ loading: false, error: null, pages: body.pages || [], settings: body.settings || {} })
    } catch (e) {
      setState({ loading: false, error: String((e && e.message) || e), pages: [], settings: {} })
    }
  }, [routes])
  useEffect(() => { reload() }, [reload])
  return [state, reload]
}

function Field (props) {
  const Component = props.area ? Textarea : Input
  return h(Component, {
    label: props.label,
    description: props.hint,
    value: props.value ?? '',
    placeholder: props.placeholder,
    rows: props.area ? 3 : undefined,
    onChange: props.onChange,
  })
}

/* ── one page's overrides ─────────────────────────────────────────────── */

function Editor ({ routes, row, onSaved, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...(row.override || {}) }))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  useEffect(() => { setDraft({ ...(row.override || {}) }); setNote(null) }, [row.key])

  const set = (id) => (value) => setDraft((d) => ({ ...d, [id]: value }))

  const save = async () => {
    setBusy(true); setNote(null)
    try {
      const res = await routes.fetch('/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, key: row.key }),
      })
      if (!res.ok) throw new Error('save answered ' + res.status)
      setNote({ tone: 'success', text: 'Saved. It reaches the live site on the next publish.' })
      onSaved()
    } catch (e) {
      setNote({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  const clear = async () => {
    setBusy(true); setNote(null)
    try {
      const res = await routes.fetch('/override', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: row.key }),
      })
      if (!res.ok) throw new Error('delete answered ' + res.status)
      setDraft({})
      setNote({ tone: 'info', text: 'Override removed — this page goes back to its derived values.' })
      onSaved()
    } catch (e) {
      setNote({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  return h(Card, { padding: 16, bordered: true },
    h(Stack, { direction: 'column', gap: 12 },
      h(Stack, { direction: 'row', gap: 12, justify: 'between', align: 'start' },
        h(Stack, { direction: 'column', gap: 4 },
          h(Heading, { level: 3 }, row.title || row.slug),
          h(Text, { variant: 'muted', size: 'sm' }, row.url || ('/' + row.slug)),
        ),
        h(Button, { variant: 'ghost', onClick: onClose, ariaLabel: 'Close' }, 'Close'),
      ),
      h(Separator, null),
      h(Stack, { direction: 'column', gap: 4 },
        h(Text, { variant: 'muted', size: 'sm' }, 'Derived today, with nothing typed here:'),
        h(Text, { size: 'sm' }, 'title — ' + (row.seoTitle || row.title || '(the page title)')),
        h(Text, { size: 'sm' }, 'description — ' + (row.seoDescription || '(the site-wide description)')),
      ),
      h(Separator, null),
      ...FIELDS.map((f) => h(Field, {
        key: f.id,
        label: f.label,
        hint: f.hint,
        area: f.area,
        value: draft[f.id] ?? '',
        onChange: set(f.id),
      })),
      h(Select, {
        label: 'og:type',
        value: draft.type ?? '',
        options: TYPE_OPTIONS,
        onChange: set('type'),
      }),
      note ? h(Alert, { tone: note.tone }, note.text) : null,
      h(Stack, { direction: 'row', gap: 8 },
        h(Button, { variant: 'primary', disabled: busy, onClick: save }, busy ? 'Saving…' : 'Save'),
        h(Button, { variant: 'ghost', disabled: busy || !row.override, onClick: clear }, 'Remove override'),
      ),
    ),
  )
}

/* ── the whole site at once ───────────────────────────────────────────── */

function Bulk ({ routes, onApplied }) {
  const [kind, setKind] = useState('')
  const [slugPrefix, setSlugPrefix] = useState('')
  const [field, setField] = useState('image')
  const [value, setValue] = useState('')
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  const call = async (dryRun) => {
    setBusy(true); setNote(null)
    try {
      const res = await routes.fetch('/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: { ...(kind ? { kind } : {}), ...(slugPrefix ? { slugPrefix } : {}) },
          set: { [field]: value },
          dryRun,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || ('the route answered ' + res.status))
      if (dryRun) {
        setPlan(body)
        setNote({ tone: 'info', text: body.matched + ' page(s) match. Nothing has been written.' })
      } else {
        setPlan(null)
        setNote({ tone: 'success', text: 'Wrote ' + body.written + ' of ' + body.matched + '.' })
        onApplied()
      }
    } catch (e) {
      setNote({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  return h(Card, { padding: 16, bordered: true },
    h(Stack, { direction: 'column', gap: 12 },
      h(Heading, { level: 3 }, 'Change many pages at once'),
      h(Text, { variant: 'muted', size: 'sm' },
        'Set one field across everything that matches. {title}, {slug}, {url} and {description} ' +
        'are replaced per page, so one rule can give every page a different correct value. ' +
        'Preview first — nothing is written until you apply.'),
      h(Select, {
        label: 'Which pages',
        value: kind,
        options: [
          { label: 'Every page and every journal article', value: '' },
          { label: 'Pages only', value: 'page' },
          { label: 'Journal articles only', value: 'entry' },
        ],
        onChange: setKind,
      }),
      h(Input, {
        label: 'Whose slug starts with (optional)',
        placeholder: 'contact',
        value: slugPrefix,
        onChange: setSlugPrefix,
      }),
      h(Select, {
        label: 'Set this field',
        value: field,
        options: FIELDS.map((f) => ({ label: f.label, value: f.id }))
          .concat([{ label: 'og:type', value: 'type' }]),
        onChange: setField,
      }),
      h(Textarea, {
        label: 'To this value',
        rows: 2,
        placeholder: '{title} | Dr. Nahlah Implants & Prosthodontics',
        value,
        onChange: setValue,
      }),
      note ? h(Alert, { tone: note.tone }, note.text) : null,
      plan && plan.changes && plan.changes.length
        ? h(Card, { padding: 12, bordered: true },
          h(Stack, { direction: 'column', gap: 4 },
            ...plan.changes.slice(0, 12).map((c) => h(Text, { key: c.key, size: 'sm' },
              c.key + ' → ' + String(c.data[field] ?? '').slice(0, 90))),
            plan.changes.length > 12
              ? h(Text, { variant: 'muted', size: 'sm' }, '…and ' + (plan.changes.length - 12) + ' more')
              : null,
          ))
        : null,
      h(Stack, { direction: 'row', gap: 8 },
        h(Button, { variant: 'secondary', disabled: busy || !value, onClick: () => call(true) }, 'Preview'),
        h(Button, { variant: 'primary', disabled: busy || !plan, onClick: () => call(false) },
          plan ? 'Apply to ' + plan.matched : 'Apply'),
      ),
    ),
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function OpenGraphAdminApp () {
  const routes = usePluginRoutes()
  const [state, reload] = useRows(routes)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return state.pages
    return state.pages.filter((p) =>
      String(p.slug).toLowerCase().includes(q) || String(p.title).toLowerCase().includes(q))
  }, [state.pages, query])

  const current = useMemo(
    () => state.pages.find((p) => p.key === selected) || null,
    [state.pages, selected],
  )

  if (state.loading) return h(Text, { variant: 'muted' }, 'Reading the site…')
  if (state.error) return h(Alert, { tone: 'danger', title: 'Could not read the site' }, state.error)

  const noSiteUrl = !state.settings.siteUrl
  const withOverride = state.pages.filter((p) => p.override).length

  return h(Stack, { direction: 'column', gap: 16 },
    noSiteUrl
      ? h(Alert, { tone: 'warning', title: 'No public address is set' },
        'Open Graph refuses a relative og:image and a relative og:url, so until the site address ' +
        'is filled in on this plugin\'s settings screen no image and no canonical link can be emitted. ' +
        'The title, description and type tags are still written.')
      : null,
    h(Text, { variant: 'muted', size: 'sm' },
      state.pages.length + ' pages and articles · ' + withOverride + ' with a hand-written override · ' +
      'the rest derive their tags from the page. Changes reach the live site on the next publish.'),
    h(Bulk, { routes, onApplied: reload }),
    h(Separator, null),
    h(SearchBar, { placeholder: 'Find a page', value: query, onChange: setQuery }),
    rows.length === 0
      ? h(EmptyState, { title: 'Nothing matches', body: 'Try part of a slug or a title.' })
      : h(Stack, { direction: 'column', gap: 6 },
        ...rows.slice(0, 200).map((p) => h(Button, {
          key: p.key,
          variant: p.key === selected ? 'secondary' : 'ghost',
          fullWidth: true,
          onClick: () => setSelected(p.key),
        }, (p.override ? '● ' : '○ ') + (p.title || p.slug) + '  —  ' + p.key))),
    h(Modal, { open: !!current, onClose: () => setSelected(null) },
      current ? h(Editor, {
        routes, row: current, onSaved: reload, onClose: () => setSelected(null),
      }) : null),
  )
}
