/**
 * AEO Schema — admin page.
 *
 * A thin React view over the plugin's own server routes. The JSON is validated
 * on the SERVER before it can be stored (`validateJson` in server/index.js),
 * and the parse here is only so the operator sees the error while typing rather
 * than after saving — the two must never disagree about what is storable, so
 * this one does not add rules of its own.
 *
 * No build step: bare specifiers resolve through the host import map, and
 * `createElement` is used directly because JSX would need a compiler.
 *
 * Trap, same as every other plugin admin page: `Input` / `Textarea` / `Select`
 * from `@instatic/host-ui` are the narrowed plugin wrappers and their
 * `onChange` receives the **string value, not the event**.
 */
import { createElement as h, useCallback, useEffect, useMemo, useState } from 'react'
import { usePluginRoutes } from '@instatic/host-hooks'
import {
  Alert, Button, Card, Code, EmptyState, Heading, Input, SearchBar, Select,
  Separator, Stack, Text, Textarea,
} from '@instatic/host-ui'

const FAQ_TEMPLATE = JSON.stringify({
  '@type': 'FAQPage',
  mainEntity: [{
    '@type': 'Question',
    name: '{title}',
    acceptedAnswer: { '@type': 'Answer', text: '{description}' },
  }],
}, null, 2)

const SERVICE_TEMPLATE = JSON.stringify({
  '@type': 'MedicalProcedure',
  name: '{title}',
  description: '{description}',
  url: '{url}',
}, null, 2)

function localCheck (text) {
  const t = String(text || '').trim()
  if (!t) return null
  try {
    const parsed = JSON.parse(t)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    for (const node of list) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return 'every member must be an object'
      if (!node['@type'] && !node['@graph']) return 'every node needs an @type'
    }
    return null
  } catch (e) {
    return String((e && e.message) || e)
  }
}

function useEntries (routes) {
  const [state, setState] = useState({ loading: true, error: null, entries: [], global: null, settings: {} })
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await routes.fetch('/entries')
      if (!res.ok) throw new Error('the plugin route answered ' + res.status)
      const body = await res.json()
      setState({
        loading: false, error: null,
        entries: body.entries || [], global: body.global || null, settings: body.settings || {},
      })
    } catch (e) {
      setState({ loading: false, error: String((e && e.message) || e), entries: [], global: null, settings: {} })
    }
  }, [routes])
  useEffect(() => { reload() }, [reload])
  return [state, reload]
}

/* ── one block ────────────────────────────────────────────────────────── */

function BlockEditor ({ routes, entryKey, label, sub, block, onSaved }) {
  const [json, setJson] = useState(() => {
    const raw = block && block.json
    if (!raw) return ''
    try { return JSON.stringify(JSON.parse(raw), null, 2) } catch (e) { return raw }
  })
  const [note, setNote] = useState((block && block.note) || '')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const raw = block && block.json
    let next = ''
    if (raw) { try { next = JSON.stringify(JSON.parse(raw), null, 2) } catch (e) { next = raw } }
    setJson(next)
    setNote((block && block.note) || '')
    setMsg(null)
  }, [entryKey])

  const problem = localCheck(json)

  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const res = await routes.fetch('/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: entryKey, json, note, enabled: true }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || ('save answered ' + res.status))
      setMsg({ tone: 'success', text: 'Saved. It reaches the live site on the next publish.' })
      onSaved()
    } catch (e) {
      setMsg({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  const remove = async () => {
    setBusy(true); setMsg(null)
    try {
      const res = await routes.fetch('/entry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: entryKey }),
      })
      if (!res.ok) throw new Error('delete answered ' + res.status)
      setJson(''); setNote('')
      setMsg({ tone: 'info', text: 'Removed. The page keeps the generated graph.' })
      onSaved()
    } catch (e) {
      setMsg({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  return h(Card, { padding: 16, bordered: true },
    h(Stack, { direction: 'column', gap: 12 },
      h(Heading, { level: 3 }, label),
      sub ? h(Text, { variant: 'muted', size: 'sm' }, sub) : null,
      h(Textarea, {
        label: 'JSON-LD',
        description: 'One object, or an array of objects. Each needs an @type. It is merged into the ' +
          'page\'s @graph, so leave @context out — the graph carries it once.',
        rows: 14,
        value: json,
        placeholder: FAQ_TEMPLATE,
        onChange: setJson,
      }),
      h(Input, { label: 'Note (for whoever reads this next)', value: note, onChange: setNote }),
      problem ? h(Alert, { tone: 'warning', title: 'Not valid yet' }, problem) : null,
      msg ? h(Alert, { tone: msg.tone }, msg.text) : null,
      h(Stack, { direction: 'row', gap: 8 },
        h(Button, { variant: 'primary', disabled: busy || !!problem, onClick: save }, busy ? 'Saving…' : 'Save'),
        h(Button, { variant: 'ghost', disabled: busy || !block, onClick: remove }, 'Remove'),
      ),
    ),
  )
}

/* ── the whole site at once ───────────────────────────────────────────── */

function Bulk ({ routes, onApplied }) {
  const [kind, setKind] = useState('entry')
  const [slugPrefix, setSlugPrefix] = useState('')
  const [mode, setMode] = useState('replace')
  const [template, setTemplate] = useState(FAQ_TEMPLATE)
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const problem = localCheck(template)

  const call = async (dryRun) => {
    setBusy(true); setMsg(null)
    try {
      const res = await routes.fetch('/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: { ...(kind ? { kind } : {}), ...(slugPrefix ? { slugPrefix } : {}) },
          template: JSON.parse(template),
          mode,
          dryRun,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || ('the route answered ' + res.status))
      if (dryRun) {
        setPlan(body)
        setMsg({ tone: 'info', text: body.matched + ' page(s) match. Nothing has been written.' })
      } else {
        setPlan(null)
        setMsg({ tone: 'success', text: 'Wrote ' + body.written + ' of ' + body.matched + '.' })
        onApplied()
      }
    } catch (e) {
      setMsg({ tone: 'danger', text: String((e && e.message) || e) })
    }
    setBusy(false)
  }

  return h(Card, { padding: 16, bordered: true },
    h(Stack, { direction: 'column', gap: 12 },
      h(Heading, { level: 3 }, 'One template across many pages'),
      h(Text, { variant: 'muted', size: 'sm' },
        '{title}, {slug}, {url} and {description} are replaced per page inside every string in the ' +
        'template, however deeply nested — so one rule gives eighty pages eighty correct blocks. ' +
        'Preview first; nothing is written until you apply.'),
      h(Select, {
        label: 'Which pages',
        value: kind,
        options: [
          { label: 'Journal articles only', value: 'entry' },
          { label: 'Pages only', value: 'page' },
          { label: 'Everything', value: '' },
        ],
        onChange: setKind,
      }),
      h(Input, {
        label: 'Whose slug starts with (optional)', placeholder: 'dental-',
        value: slugPrefix, onChange: setSlugPrefix,
      }),
      h(Select, {
        label: 'What to do with a page that already has a block',
        value: mode,
        options: [
          { label: 'Replace it', value: 'replace' },
          { label: 'Keep it and append this', value: 'merge' },
        ],
        onChange: setMode,
      }),
      h(Stack, { direction: 'row', gap: 8 },
        h(Button, { variant: 'ghost', onClick: () => setTemplate(FAQ_TEMPLATE) }, 'FAQPage example'),
        h(Button, { variant: 'ghost', onClick: () => setTemplate(SERVICE_TEMPLATE) }, 'MedicalProcedure example'),
      ),
      h(Textarea, { label: 'Template', rows: 12, value: template, onChange: setTemplate }),
      problem ? h(Alert, { tone: 'warning', title: 'Not valid yet' }, problem) : null,
      msg ? h(Alert, { tone: msg.tone }, msg.text) : null,
      plan && plan.changes && plan.changes.length
        ? h(Card, { padding: 12, bordered: true },
          h(Stack, { direction: 'column', gap: 6 },
            h(Text, { variant: 'muted', size: 'sm' }, 'First page of the plan:'),
            h(Code, null, String(plan.changes[0].json).slice(0, 900)),
            h(Text, { variant: 'muted', size: 'sm' },
              plan.changes.length + ' page(s) would be written.'),
          ))
        : null,
      h(Stack, { direction: 'row', gap: 8 },
        h(Button, { variant: 'secondary', disabled: busy || !!problem, onClick: () => call(true) }, 'Preview'),
        h(Button, { variant: 'primary', disabled: busy || !plan, onClick: () => call(false) },
          plan ? 'Apply to ' + plan.matched : 'Apply'),
      ),
    ),
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function AeoSchemaAdminApp () {
  const routes = usePluginRoutes()
  const [state, reload] = useEntries(routes)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('pages')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return state.entries
    return state.entries.filter((p) =>
      String(p.slug).toLowerCase().includes(q) || String(p.title).toLowerCase().includes(q))
  }, [state.entries, query])

  const current = useMemo(
    () => state.entries.find((p) => p.key === selected) || null,
    [state.entries, selected],
  )

  if (state.loading) return h(Text, { variant: 'muted' }, 'Reading the site…')
  if (state.error) return h(Alert, { tone: 'danger', title: 'Could not read the site' }, state.error)

  const withBlock = state.entries.filter((p) => p.block).length
  const noSiteUrl = !state.settings.siteUrl

  return h(Stack, { direction: 'column', gap: 16 },
    noSiteUrl
      ? h(Alert, { tone: 'warning', title: 'No public address is set' },
        'Every @id, url and breadcrumb in the graph is built from the site address. Until it is filled ' +
        'in on this plugin\'s settings screen the graph is emitted without them, and an answer engine ' +
        'cannot tie these nodes to anything.')
      : null,
    h(Text, { variant: 'muted', size: 'sm' },
      state.entries.length + ' pages and articles · ' + withBlock + ' with a hand-written block · ' +
      'every one of them also gets the generated Organization, WebPage and breadcrumb graph. ' +
      'Changes reach the live site on the next publish.'),
    h(Stack, { direction: 'row', gap: 8 },
      h(Button, { variant: tab === 'pages' ? 'secondary' : 'ghost', onClick: () => setTab('pages') }, 'Per page'),
      h(Button, { variant: tab === 'bulk' ? 'secondary' : 'ghost', onClick: () => setTab('bulk') }, 'Many at once'),
      h(Button, { variant: tab === 'global' ? 'secondary' : 'ghost', onClick: () => setTab('global') }, 'Site-wide block'),
    ),
    h(Separator, null),
    tab === 'bulk' ? h(Bulk, { routes, onApplied: reload }) : null,
    tab === 'global'
      ? h(BlockEditor, {
        routes,
        entryKey: '*',
        label: 'Site-wide block',
        sub: 'Added to the graph on EVERY published page, after the generated nodes and after that ' +
          'page\'s own block. For something true of the whole practice — an aggregate rating, a ' +
          'second location, an offer catalogue.',
        block: state.global,
        onSaved: reload,
      })
      : null,
    tab === 'pages'
      ? h(Stack, { direction: 'column', gap: 12 },
        h(SearchBar, { placeholder: 'Find a page', value: query, onChange: setQuery }),
        rows.length === 0
          ? h(EmptyState, { title: 'Nothing matches', body: 'Try part of a slug or a title.' })
          : h(Stack, { direction: 'column', gap: 6 },
            ...rows.slice(0, 200).map((p) => h(Button, {
              key: p.key,
              variant: p.key === selected ? 'secondary' : 'ghost',
              fullWidth: true,
              onClick: () => setSelected(p.key === selected ? null : p.key),
            }, (p.block ? '● ' : '○ ') + (p.title || p.slug) +
               (p.types && p.types.length ? '  [' + p.types.join(', ') + ']' : '')))),
        current
          ? h(BlockEditor, {
            routes,
            entryKey: current.key,
            label: current.title || current.slug,
            sub: current.url || ('/' + current.slug),
            block: current.block,
            onSaved: reload,
          })
          : null,
      )
      : null,
  )
}
