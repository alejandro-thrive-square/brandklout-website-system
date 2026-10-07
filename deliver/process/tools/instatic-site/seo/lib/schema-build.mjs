/**
 * schema-build.mjs — the engine of build-schema.mjs: structured data built from what each page SAYS.
 *
 * Inputs: the config (seo-config.json), the scan (sections.json), the facts (facts.json), the base
 * layer (the practice's stated facts: organization, site-wide nodes, per-page entity nodes, article
 * nodes) and, for scanned pages the base does not cover, the blocks stored live (read-only).
 * Output: { organization, blocks: { sitewide, pages, posts }, used, notes }, in the shape
 * push-schema.mjs ships to the brandklout.aeo-schema plugin.
 *
 * Layers, in order, per page:
 *   1. base: base.pages[slug], else the live stored block (its BreadcrumbList and #faq dropped,
 *      they are rebuilt), else a bare WebPage
 *   2. treatment (pages[slug].treatment): Service description = the hero lead line, the meta
 *      description as disambiguatingDescription, the WebPage `about` Things and the procedure's
 *      Wikipedia/Wikidata sameAs, the designed headline as alternativeHeadline
 *   3. FAQPage = the page's "?" accordions, word for word (faq: true | false | "webpage")
 *   4. ops (pages[slug].ops): `set` properties, `add` nodes, `describeOffers`, `pageSays` — values
 *      written in the small language documented in ../README.md ("The mapping language")
 *   5. a VideoObject for every embedded film the ops did not describe
 * then for every page: the BreadcrumbList repeats the trail the page shows; then the articles; then
 * the organization ops.
 *
 * House rules (they hold for every client; the client rules live in the config):
 *   - a value is a page string or a fact the practice states (a literal in the config or base);
 *     nothing is written for the schema. `pageSays` guards a literal against copy drift.
 *   - no AggregateRating or Review from on-site quotes: Google ignores self-serving reviews on a
 *     LocalBusiness and treats them as a policy risk. Only a third-party source with a displayed count.
 *   - text from a video platform is the platform's, not the site's: filtered sentence by sentence.
 *   - a renamed heading fails the build (every section alias must match), never ships a stale value.
 *   - ItemList has no `about` (schema.org): the subject goes on each item.
 *
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/build-schema-v3.mjs.
 */
import { rx } from './seo-config.mjs'
import { join_ } from './sections.mjs'

const clone = (x) => JSON.parse(JSON.stringify(x))
const arr = (x) => (x === undefined || x === null ? [] : [].concat(x))
const types = (n) => arr(n?.['@type'])
const labelOf = (x) => (typeof x === 'string' ? x : x?.h3 ?? x?.q ?? x?.alt ?? x?.name ?? x?.h2 ?? '')

export function buildSchema({ config: C, pages, facts = {}, base = {}, live = [], log = console.log }) {
  const S = C.site.origin
  const W = facts.wiki || {}
  const VID = facts.videos || {}
  const used = []
  const notes = []
  const note = (m) => { notes.push(m); log('note     ' + m) }
  const url = (slug) => (slug === 'index' ? `${S}/` : `${S}/${slug}`)
  const abs = (src) => new URL(src, S).href
  const ref = (id) => ({ '@id': id })
  const art = C.articles
  const isArticle = (slug) => !!art && slug.startsWith(art.prefix)

  function idOf(spec, slug) {
    spec = String(spec)
    if (spec.startsWith('@')) {
      const v = C.ids[spec.slice(1)]
      if (!v) throw new Error(`no ids.${spec.slice(1)} in seo-config.json`)
      return idOf(v, slug)
    }
    if (spec.startsWith('#')) return url(slug) + spec
    if (spec.startsWith('/')) return S + spec
    if (/^https?:\/\//.test(spec)) return spec
    throw new Error(`"${spec}" is not an id: use #fragment (this page), /path#fragment, @alias (ids) or a full URL`)
  }
  const ORG = () => ref(idOf('@org'))

  // ── wiki ────────────────────────────────────────────────────────────────
  const missingWiki = new Set()
  const sameAsList = (keys) => arr(keys).flatMap((k) => {
    if (W[k]) return [W[k].url, W[k].wikidata]
    if (!missingWiki.has(k)) { missingWiki.add(k); note(`wiki "${k}" has no facts: left out of sameAs (fetch-facts.mjs; is it in seo-config wiki?)`) }
    return []
  })
  const sameAs = (...keys) => { const s = sameAsList(keys); return s.length ? { sameAs: s } : {} }
  const thing = (k, name) => {
    if (!W[k] && !name) throw new Error(`wiki "${k}" has no facts and no name was given (fetch-facts.mjs)`)
    return { '@type': 'Thing', name: name || W[k].title, ...sameAs(k) }
  }

  // ── sections and paths ──────────────────────────────────────────────────
  const page = (slug) => { const p = pages[slug]; if (!p) throw new Error(`${slug}: not in sections.json (not in the sitemap? rescan)`); return p }
  const secCache = {}
  function section(slug, alias) {
    const key = `${slug}:${alias}`
    if (secCache[key]) return secCache[key]
    const re = C.pages[slug]?.sections?.[alias]
    if (re === undefined) throw new Error(`${slug}: no section alias "${alias}" (seo-config pages["${slug}"].sections)`)
    const r = rx(re)
    const s = page(slug).sections.find((x) => r.test(x.h2 || x.h1 || ''))
    if (!s) throw new Error(`${slug}: no section heading matches ${re} — a heading was renamed? Rescan, then fix the config`)
    used.push(`${slug}: ${s.h2 || s.h1}`)
    return (secCache[key] = s)
  }
  function headValue(head, ctx) {
    if (head === '') return ctx.el
    let slug = ctx.slug, h = head
    const c = head.indexOf(':')
    if (c > 0) { slug = head.slice(0, c); h = head.slice(c + 1) }
    const p = page(slug)
    switch (h) {
      case 'intro': return p.sections[0]?.lead[0]
      case 'headline': return p.sections[0]?.headline
      case 'h1': return p.sections[0]?.h1
      case 'meta': return p.description || undefined
      case 'title': return p.title || undefined
      case 'videos': return p.sections.flatMap((s) => s.videos)
      case 'images': return p.sections.flatMap((s) => s.images)
      case 'crumb': return p.crumb
      default: return section(slug, h)
    }
  }
  function parsePath(expr) {
    let i = 0
    const n = expr.length
    let head = ''
    while (i < n && !'.[|'.includes(expr[i])) head += expr[i++]
    const steps = [], filters = []
    while (i < n) {
      const ch = expr[i]
      if (ch === '.') {
        i++
        let name = ''
        while (i < n && !'.[|'.includes(expr[i])) name += expr[i++]
        if (name) steps.push({ prop: name })
      } else if (ch === '[') {
        let depth = 0, j = i
        for (; j < n; j++) {
          if (expr[j] === '\\') { j++; continue }
          if (expr[j] === '[') depth++
          else if (expr[j] === ']' && --depth === 0) break
        }
        if (j >= n) throw new Error(`unclosed [ in $${expr}`)
        const inner = expr.slice(i + 1, j)
        i = j + 1
        let m
        if (/^-?\d+$/.test(inner)) steps.push({ index: +inner })
        else if ((m = /^(-?\d*):(-?\d*)$/.exec(inner))) steps.push({ slice: [m[1] === '' ? undefined : +m[1], m[2] === '' ? undefined : +m[2]] })
        else if (inner.startsWith('??')) steps.push({ find: inner.slice(2), strict: false })
        else if (inner.startsWith('?')) steps.push({ find: inner.slice(1), strict: true })
        else if (inner.startsWith('~')) steps.push({ keep: inner.slice(1) })
        else if (inner.startsWith('!')) steps.push({ drop: inner.slice(1) })
        else throw new Error(`[${inner}] in $${expr}: use [n], [a:b], [?regex], [??regex], [~regex] or [!regex]`)
      } else if (ch === '|') { filters.push(...expr.slice(i + 1).split('|')); break }
      else i++
    }
    return { head, steps, filters }
  }
  function path(expr, ctx) {
    const { head, steps, filters } = parsePath(expr)
    let v = headValue(head, ctx)
    for (const st of steps) {
      if (v === undefined || v === null) return undefined
      if (st.prop) v = v[st.prop]
      else if (st.index !== undefined) v = Array.isArray(v) ? v.at(st.index) : undefined
      else if (st.slice) v = v.slice(st.slice[0], st.slice[1])
      else if (st.find !== undefined) {
        const r = rx(st.find)
        const f = arr(v).find((x) => r.test(labelOf(x)))
        if (f === undefined && st.strict) throw new Error(`${ctx.slug}: $${expr}: nothing matches ${st.find} — the copy changed? Rescan, then fix the config`)
        v = f
      } else if (st.keep !== undefined) { const r = rx(st.keep); v = arr(v).filter((x) => r.test(labelOf(x))) }
      else if (st.drop !== undefined) { const r = rx(st.drop); v = arr(v).filter((x) => !r.test(labelOf(x))) }
    }
    for (const f of filters) {
      if (v === undefined) break
      if (f === 'abs') v = Array.isArray(v) ? v.map((x) => abs(x?.src ?? x)) : abs(v?.src ?? v)
      else if (f === 'lower') v = String(v).toLowerCase()
      else throw new Error(`unknown filter |${f} in $${expr} (abs, lower)`)
    }
    return v
  }
  const text = (x) => {
    if (x === undefined || x === null) return undefined
    if (typeof x === 'string') return x
    if (typeof x === 'number' || typeof x === 'boolean') return String(x)
    if (Array.isArray(x)) return join_(x.map(text).filter((t) => t !== undefined))
    if ('lead' in x) throw new Error('a whole section cannot be text: name a part of it (.h2, .lead[0], .items …)')
    if ('h3' in x) return `${x.h3}: ${join_(x.text)}`
    if ('q' in x) return `${x.q} ${x.a}`
    if ('src' in x) return abs(x.src)
    throw new Error(`cannot render ${JSON.stringify(x).slice(0, 80)} as text`)
  }
  // {1}..{9} regex groups (each … match), {1|lower}, {1|slug}, {i} the 1-based position
  const tpl = (s, ctx) => (ctx.groups || ctx.i !== undefined
    ? s.replace(/\{(\d|i)(\|lower|\|slug)?\}/g, (m, k, f) => {
      const v = k === 'i' ? String((ctx.i ?? 0) + 1) : ctx.groups?.[+k]
      if (v === undefined) return m
      return f === '|lower' ? v.toLowerCase() : f === '|slug' ? v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : v
    })
    : s)
  const isPath = (s) => typeof s === 'string' && s.startsWith('$') && !s.startsWith('$$')
  const raw = (v, ctx) => (isPath(v) ? path(tpl(v, ctx).slice(1), ctx) : val(v, ctx))
  const isSpread = (e) => e && typeof e === 'object' && !Array.isArray(e) && ('kind' in e || 'use' in e || ('thing' in e && Array.isArray(e.thing)))

  function val(v, ctx) {
    if (typeof v === 'string') {
      const s = tpl(v, ctx)
      if (s.startsWith('$$')) return s.slice(1)
      if (s.startsWith('$')) return text(path(s.slice(1), ctx))
      return s
    }
    if (Array.isArray(v)) {
      if (v.length && v.every(isPath)) return join_(v.map((e) => text(path(tpl(e, ctx).slice(1), ctx))).filter((t) => t !== undefined))
      const out = []
      for (const e of v) {
        const r = val(e, ctx)
        if (r === undefined) continue
        if (isSpread(e) && Array.isArray(r)) out.push(...r)
        else out.push(r)
      }
      return out
    }
    if (v && typeof v === 'object') {
      if ('literal' in v) return clone(v.literal)
      if ('use' in v) { if (!(v.use in C.define)) throw new Error(`no define.${v.use} in seo-config.json`); return val(C.define[v.use], ctx) }
      if ('ref' in v) return ref(idOf(tpl(v.ref, ctx), ctx.slug))
      if ('thing' in v) return Array.isArray(v.thing) ? v.thing.map((k) => thing(k)) : thing(v.thing, v.name === undefined ? undefined : val(v.name, ctx))
      if ('wikiSameAs' in v) { const s = sameAsList(v.wikiSameAs); return s.length ? s : undefined }
      if ('kind' in v) return builder(v, ctx)
      const o = {}
      for (const [k, x] of Object.entries(v)) {
        const r = k === '@id' && typeof x === 'string' && !isPath(x) ? idOf(tpl(x, ctx), ctx.slug) : val(x, ctx)
        if (r !== undefined) o[k] = r
      }
      return o
    }
    return v
  }
  const rest = (b, skip, ctx) => {
    const o = {}
    for (const [k, x] of Object.entries(b)) if (!skip.includes(k)) { const r = val(x, ctx); if (r !== undefined) o[k] = r }
    return o
  }

  // ── node shapes ─────────────────────────────────────────────────────────
  const list = (slug, id, name, entries, extra = {}) => ({
    '@type': 'ItemList', '@id': `${url(slug)}#${id}`, name, numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, ...(typeof e === 'string' ? { name: e } : e) })),
    ...extra,
  })
  const ENTRY_KEYS = new Set(['from', 'only', 'skip', 'pill', 'prefix', 'at', 'map'])
  function entries(spec, ctx, mode) {
    if (isPath(spec)) return asEntries(raw(spec, ctx), mode, {}, ctx, spec)
    if (Array.isArray(spec)) return spec.map((e) => val(e, ctx)).filter((e) => e !== undefined)
    if (spec && typeof spec === 'object' && spec.from) return asEntries(raw(spec.from, ctx), mode, spec, ctx, spec.from)
    throw new Error(`${ctx.slug}: entries must be a $path, a list, or { from, … }`)
  }
  function asEntries(xs, mode, spec, ctx, where) {
    if (!Array.isArray(xs)) throw new Error(`${ctx.slug}: entries ${where} is not a list`)
    if (spec.only) xs = xs.filter((x) => spec.only.includes(labelOf(x)))
    if (spec.skip) { const r = rx(spec.skip); xs = xs.filter((x) => !r.test(labelOf(x))) }
    const over0 = Object.fromEntries(Object.entries(spec).filter(([k]) => !ENTRY_KEYS.has(k)))
    return xs.map((el, i) => {
      const ectx = { ...ctx, el, i }
      if (spec.map) return val(spec.map, ectx)
      let e
      if (typeof el === 'string' && spec.pill) { const n = spec.pill.find((p) => el.startsWith(p)); e = n ? { name: n, description: el.slice(n.length).trim() } : { name: el } }
      else if (typeof el === 'string') e = mode === 'catalog' ? { name: el } : el
      else if ('h3' in el) e = { name: el.h3, description: join_(el.text) }
      else if ('q' in el) e = { name: el.q, description: el.a }
      else e = { ...el }
      const over = { ...over0, ...(spec.at?.[String(i)] || {}) }
      if (Object.keys(over).length || spec.prefix) {
        if (typeof e === 'string') e = { name: e }
        for (const [k, v] of Object.entries(over)) { const r = val(v, ectx); if (r === undefined) delete e[k]; else e[k] = r }
        if (spec.prefix) e.name = (spec.prefix[i] ?? '') + e.name
      }
      return e
    })
  }
  const faqOf = (slug, id = `${url(slug)}#faq`) => {
    const qa = page(slug).sections.flatMap((s) => s.qa).filter((x) => /\?$/.test(x.q) && x.a)
    if (!qa.length) return null
    return { '@type': 'FAQPage', '@id': id, isPartOf: ref(`${url(slug)}#webpage`), mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  }
  const DROP = C.rules.platformTextDrop ? rx(C.rules.platformTextDrop) : null
  const STRIP = C.rules.platformTextStrip ? rx(C.rules.platformTextStrip) : null
  const platformText = (t) => (t || '').split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x && !(DROP && DROP.test(x))).join(' ').slice(0, 2000)
  const iso = (sec) => `PT${Math.floor(sec / 60) ? Math.floor(sec / 60) + 'M' : ''}${sec % 60}S`
  const videoId = (id) => `${S}/#video-${String(id).replace(/^yt:/, '')}`
  function video(id, about) {
    const v = VID[id]
    if (!v) throw new Error(`no facts for film ${id} (fetch-facts.mjs)`)
    const yt = id.startsWith('yt:')
    const pub = C.videos.publisher?.[yt ? 'youtube' : 'vimeo']
    return {
      '@type': 'VideoObject', '@id': videoId(id), name: v.name,
      description: platformText(STRIP ? (v.description || '').replace(STRIP, '') : v.description) || v.name,
      thumbnailUrl: v.thumbnail, uploadDate: v.uploadDate, duration: iso(v.duration),
      embedUrl: yt ? `https://www.youtube.com/embed/${id.slice(3)}` : `https://player.vimeo.com/video/${id}`,
      ...(yt ? { url: `https://www.youtube.com/watch?v=${id.slice(3)}` } : {}),
      ...(pub ? { publisher: ORG() } : {}), inLanguage: C.site.language, ...(about ? { about } : {}),
    }
  }

  function builder(b, ctx) {
    const slug = ctx.slug
    switch (b.kind) {
      case 'list': {
        if ('about' in b) throw new Error(`${slug}: list "${b.id}" has an about — ItemList has no about (schema.org); put the subject on its items`)
        return list(slug, b.id, val(b.name, ctx), entries(b.entries, ctx, 'list'), rest(b, ['kind', 'id', 'name', 'entries'], ctx))
      }
      case 'catalog':
        return {
          '@type': 'OfferCatalog', '@id': `${url(slug)}#${b.id || 'options'}`, name: val(b.name, ctx),
          itemListElement: entries(b.entries, ctx, 'catalog').map(({ name, description, url: u }) => ({
            '@type': 'Offer', itemOffered: { '@type': 'Service', name, description, ...(u ? { url: u } : {}), provider: ORG() },
          })),
          ...rest(b, ['kind', 'id', 'name', 'entries'], ctx),
        }
      case 'howTo': {
        const s = raw(b.section, ctx)
        return {
          '@type': 'HowTo', '@id': `${url(slug)}#${b.id || 'process'}`, name: s.h2,
          ...(s.lead[0] ? { description: s.lead[0] } : {}),
          step: s.items.map((it, i) => ({ '@type': 'HowToStep', position: i + 1, name: it.h3, text: join_(it.text) })),
          ...rest(b, ['kind', 'id', 'section'], ctx),
        }
      }
      case 'cases': {
        const s = raw(b.section, ctx)
        const about = b.about === undefined ? undefined : val(b.about, ctx)
        return list(slug, b.id || 'cases', s.h2, s.images.filter((im) => im.alt).map((im) => ({
          item: { '@type': 'ImageObject', contentUrl: abs(im.src), caption: im.alt, ...(about ? { about } : {}), creator: ORG(), creditText: C.site.name, copyrightNotice: C.site.name },
        })))
      }
      case 'table': {
        const s = raw(b.section, ctx)
        if (!s.table?.length) throw new Error(`${slug}: section "${s.h2}" shows no table`)
        const [head, ...rows] = s.table
        return {
          '@type': 'Table', '@id': `${url(slug)}#${b.id || 'table'}`, name: s.h2, ...(b.about ? { about: val(b.about, ctx) } : {}),
          text: rows.map((r) => `${r[0]}: ${head.slice(1).map((h, i) => `${h}, ${r[i + 1]}`).join('; ')}.`).join(' '),
        }
      }
      case 'conditions':
        return arr(raw(b.from, ctx)).map((x) => ({ '@type': b.type || 'MedicalCondition', name: x.q, description: x.a, ...(b.wiki?.[x.q] ? sameAs(b.wiki[x.q]) : {}) }))
      case 'faq': { const f = faqOf(slug); return f ? f.mainEntity : undefined }
      case 'video': return video(String(raw(b.id, ctx)), b.about === undefined ? undefined : val(b.about, ctx))
      case 'videos': {
        const ids = raw(b.from ?? '$videos', ctx)
        return arr(ids).map((v) => video(v, b.about === 'map' ? (C.videos.about[v] ? ref(idOf(C.videos.about[v], slug)) : ORG()) : b.about === undefined ? undefined : val(b.about, ctx)))
      }
      case 'videoRef': return ref(videoId(raw(b.id, ctx)))
      case 'each': {
        let xs = arr(raw(b.from, ctx))
        if (b.skip) { const r = rx(b.skip); xs = xs.filter((x) => !r.test(labelOf(x))) }
        return xs.map((el, i) => {
          let groups
          if (b.match) {
            groups = String(labelOf(el)).match(rx(b.match))
            if (!groups) throw new Error(`${slug}: "${labelOf(el)}" does not match ${b.match} — the copy changed? Fix the config`)
          }
          return val(b.node, { ...ctx, el, i, groups })
        })
      }
      case 'imageByAlt': {
        const want = tpl(String(b.startsWith), ctx)
        const im = arr(raw(b.from, ctx)).find((x) => String(x.alt || '').startsWith(want))
        return im ? abs(im.src) : undefined
      }
      case 'refs': {
        const p = b.page || slug
        return (blocks[p] || []).filter((n) => n['@id'] && (!b.type || types(n).includes(b.type))).map((n) => ref(n['@id']))
      }
      case 'concat': return val(b.of, ctx).flat()
      case 'pick': {
        // the first case whose key the value contains ("/regex/" keys test instead), else the default
        const v = String(val(b.value, ctx) ?? '')
        const hit = arr(b.cases).find(([k]) => (String(k).startsWith('/') ? rx(k).test(v) : v.includes(k)))
        return hit ? val(hit[1], ctx) : b.default === undefined ? undefined : val(b.default, ctx)
      }
      default: throw new Error(`${slug}: unknown kind "${b.kind}" (list, catalog, howTo, cases, table, conditions, faq, video, videos, videoRef, each, imageByAlt, refs, concat, pick)`)
    }
  }

  // ── the blocks ──────────────────────────────────────────────────────────
  const liveBy = Object.fromEntries(live.filter((e) => e.block?.json).map((e) => [e.key, e.block.json]))
  const fromLive = (key) => {
    if (!liveBy[key]) return null
    return [].concat(JSON.parse(liveBy[key])).filter((n) => !types(n).includes('BreadcrumbList') && !(types(n).includes('FAQPage') && String(n['@id']).endsWith('#faq')))
  }
  const blocks = {}
  const scanned = Object.keys(pages).filter((s) => !isArticle(s))
  for (const [slug, nodes] of Object.entries(base.pages || {})) if (nodes) blocks[slug] = clone(nodes)
  for (const slug of scanned) {
    if (blocks[slug]) continue
    const l = fromLive(slug)
    blocks[slug] = l || [{ '@type': 'WebPage', '@id': `${url(slug)}#webpage` }]
    if (!l) note(`/${slug}: no base and no stored block — starts from a bare WebPage`)
  }
  function node(slug, spec, required = true) {
    const id = idOf(spec, slug)
    const n = (blocks[slug] || []).find((x) => x['@id'] === id)
    if (!n && required) throw new Error(`${slug}: no node ${id} in its blocks (base layer?)`)
    return n
  }
  function webpage(slug) {
    let wp = (blocks[slug] || []).find((n) => String(n['@id']).endsWith('#webpage'))
    if (!wp) { wp = { '@type': 'WebPage', '@id': `${url(slug)}#webpage` }; blocks[slug].unshift(wp) }
    return wp
  }
  const pushRef = (wp, key, id) => {
    const list = arr(wp[key])
    if (!list.some((r) => r?.['@id'] === id)) list.push(ref(id))
    wp[key] = list
  }
  function add(slug, n) {
    if (Array.isArray(n)) return n.forEach((x) => add(slug, x))
    if (!n) return
    const wp = webpage(slug)
    const i = n['@id'] ? blocks[slug].findIndex((m) => m['@id'] === n['@id']) : -1
    if (i >= 0) blocks[slug][i] = n
    else blocks[slug].push(n)
    if (n['@id'] && !/#(faq|service|procedure)$/.test(n['@id'])) pushRef(wp, 'hasPart', n['@id'])
  }
  const pageText = (slug) => {
    const out = []
    const walk = (x) => { if (typeof x === 'string') out.push(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => { if (k !== 'src') walk(v) }) }
    walk(page(slug).sections)
    if (page(slug).post) walk(page(slug).post)
    return out.join('\n')
  }
  function pageSays(slug, strings) {
    const t = pageText(slug)
    for (const s of arr(strings)) if (!t.includes(s)) throw new Error(`${slug}: the page no longer says "${s}" — a stated fact in the config is stale; update it`)
  }
  function runOps(ops, ctx, target) {
    for (const op of arr(ops)) {
      if ('pageSays' in op) pageSays(op.page || ctx.slug, op.pageSays)
      else if ('set' in op) {
        let props = op.props || {}
        if (Object.keys(props).length === 1 && 'use' in props) { if (!(props.use in C.define)) throw new Error(`no define.${props.use} in seo-config.json`); props = C.define[props.use] }
        Object.assign(target(op.set), rest(props, [], ctx))
      }
      else if ('add' in op) add(ctx.slug, val(op.add, ctx))
      else if ('describeOffers' in op) {
        const cat = target(op.describeOffers)
        const cards = arr(raw(op.from, ctx))
        const n = op.prefixChars ?? 8
        const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        for (const o of arr(cat.itemListElement)) {
          const card = cards.find((it) => norm(it.h3.toLowerCase().replace(/&/g, 'and')).startsWith(norm(o.itemOffered?.name || '').slice(0, n)))
          if (card) o.itemOffered.description = join_(card.text)
          else note(`${ctx.slug}: offer "${o.itemOffered?.name}" has no card in ${op.from}`)
        }
        if (op.description !== undefined) cat.description = val(op.description, ctx)
      } else throw new Error(`${ctx.slug}: unknown op ${JSON.stringify(op).slice(0, 80)} (set, add, describeOffers, pageSays)`)
    }
  }

  const order = [...Object.keys(C.pages).filter((s) => blocks[s]), ...Object.keys(blocks).filter((s) => !(s in C.pages))]
  for (const slug of Object.keys(C.pages)) if (!blocks[slug]) throw new Error(`seo-config pages["${slug}"]: no such page (not scanned, not in the base)`)
  for (const slug of order) {
    const pc = C.pages[slug] || {}
    const scannedPage = !!pages[slug]
    if (pc.treatment) {
      const t = { ...C.treatmentDefaults, ...pc.treatment }
      const intro = page(slug).sections[0]?.lead[0]
      Object.assign(node(slug, '#service'), { description: intro, disambiguatingDescription: page(slug).description || undefined, ...(t.category ? { category: t.category } : {}) })
      const wp = webpage(slug)
      const about = arr(wp.about)
      for (const th of arr(t.wiki).map((k) => thing(k))) if (!about.some((a) => JSON.stringify(a) === JSON.stringify(th))) about.push(th)
      wp.about = about
      const proc = node(slug, '#procedure', false)
      if (proc) Object.assign(proc, { description: intro, ...sameAs(...arr(t.wiki)) })
      const headline = page(slug).sections[0]?.headline
      if (headline) wp.alternativeHeadline = headline
    }
    if (scannedPage && pc.faq !== false && !C.faq.skip.includes(slug)) {
      if (pc.faq === 'webpage') {
        const f = faqOf(slug)
        if (f) webpage(slug).mainEntity = f.mainEntity
      } else {
        const id = `${url(slug)}#faq`
        const i = blocks[slug].findIndex((n) => n['@id'] === id)
        const f = faqOf(slug)
        if (f) { if (i >= 0) blocks[slug][i] = f; else blocks[slug].push(f) }
        else if (i >= 0) { blocks[slug].splice(i, 1); note(`/${slug}: its FAQPage was dropped — the page shows no "?" accordion`) }
      }
    }
    runOps(pc.ops, { slug }, (spec) => node(slug, spec))
    // every film the page embeds is described (the live gate requires it); ops that added one win
    if (scannedPage) {
      for (const v of new Set(page(slug).sections.flatMap((s) => s.videos))) {
        if (blocks[slug].some((n) => n['@id'] === videoId(v))) continue
        if (!VID[v]) { note(`/${slug}: film ${v} has no facts (fetch-facts.mjs) — not described`); continue }
        add(slug, video(v, C.videos.about[v] ? ref(idOf(C.videos.about[v], slug)) : ORG()))
      }
    }
  }

  // ── breadcrumbs: exactly the trail each page shows ──────────────────────
  const crumbList = (slug, trail) => ({
    '@type': 'BreadcrumbList', '@id': `${url(slug)}#breadcrumb`,
    itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.href ? abs(c.href) : url(slug) })),
  })
  for (const slug of scanned) {
    if (C.breadcrumbs.skip.includes(slug)) continue
    const trail = pages[slug].crumb.length ? pages[slug].crumb : C.breadcrumbs.fallback[slug]
    if (!trail) throw new Error(`${slug}: the page shows no breadcrumb (markup.breadcrumbClass?) and breadcrumbs.fallback has none`)
    webpage(slug).breadcrumb = ref(`${url(slug)}#breadcrumb`)
    blocks[slug] = blocks[slug].filter((n) => !types(n).includes('BreadcrumbList'))
    blocks[slug].push(crumbList(slug, trail))
  }

  // ── articles ────────────────────────────────────────────────────────────
  const posts = {}
  let postFaqs = 0
  if (art) {
    const keyOf = (slug) => art.keyPrefix + slug.slice(art.prefix.length)
    const keys = new Set([...Object.keys(base.posts || {}), ...Object.keys(pages).filter(isArticle).map(keyOf).filter((k) => liveBy[k])])
    for (const key of keys) {
      const slug = art.prefix + key.slice(art.keyPrefix.length)
      const u = url(slug)
      const nodes = base.posts?.[key] ? clone(base.posts[key]) : (fromLive(key) || [])
      posts[key] = nodes
      const p = pages[slug]?.post
      if (!p) { note(`${slug}: not scanned or no article region — its stored nodes are kept as they are`); continue }
      let a = nodes.find((n) => types(n).includes('BlogPosting') || types(n).includes('Article'))
      if (!a) { a = { '@type': 'BlogPosting', '@id': `${u}#article`, url: u, publisher: ORG(), mainEntityOfPage: ref(`${u}#webpage`), inLanguage: C.site.language }; nodes.unshift(a) }
      let wp = nodes.find((n) => String(n['@id']).endsWith('#webpage'))
      if (!wp) { wp = { '@type': 'WebPage', '@id': `${u}#webpage` }; nodes.push(wp) }
      const body = join_([...p.intro, ...p.parts.flatMap((x) => [x.h2, ...x.text])])
      const topic = arr(art.topics).find((t) => rx(t.match).test(slug + ' ' + p.h1))
      Object.assign(a, {
        headline: p.h1.slice(0, art.headlineMax ?? 110), wordCount: p.words,
        ...(topic?.section ? { articleSection: topic.section } : {}),
        ...(pages[slug].description ? { description: pages[slug].description } : {}),
        ...(p.intro[0] ? { abstract: p.intro[0] } : {}),
        ...(topic?.about ? { about: ref(idOf(topic.about, slug)) } : {}),
        mentions: arr(art.mentions).filter(([, re]) => rx(re).test(body)).map(([k]) => thing(k)),
      })
      wp.breadcrumb = ref(`${u}#breadcrumb`)
      for (let i = nodes.length - 1; i >= 0; i--) if (types(nodes[i]).includes('BreadcrumbList') || (types(nodes[i]).includes('FAQPage') && String(nodes[i]['@id']).endsWith('#faq'))) nodes.splice(i, 1)
      // the trail the article shows (Home › Journal), then its title; articles.crumb where it shows none
      const shown = pages[slug].crumb.length ? pages[slug].crumb : arr(art.crumb)
      nodes.push(crumbList(slug, [...shown, { name: p.h1, href: null }]))
      const drop = art.dropLines ? rx(art.dropLines) : null
      const trim = art.trimTail ? rx(art.trimTail) : null
      const qa = p.parts.filter((x) => /\?$/.test(x.h2))
        .map((x) => ({ q: x.h2, a: join_(x.text.filter((t) => !(drop && drop.test(t))).map((t) => (trim ? t.replace(trim, '') : t))) }))
        .filter((x) => x.a)
      if (qa.length >= (art.faqMinQuestions ?? 3)) {
        postFaqs++
        nodes.push({ '@type': 'FAQPage', '@id': `${u}#faq`, isPartOf: ref(`${u}#webpage`), mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) })
        pushRef(wp, 'hasPart', `${u}#faq`)
      } else if (wp.hasPart) {
        wp.hasPart = arr(wp.hasPart).filter((r) => r['@id'] !== `${u}#faq`)
        if (!wp.hasPart.length) delete wp.hasPart
      }
    }
    if (art.blogPage && blocks[art.blogPage]) {
      const blog = blocks[art.blogPage].find((n) => types(n).includes('Blog'))
      if (blog) blog.blogPost = Object.keys(pages).filter(isArticle).map((k) => ref(`${url(k)}#article`))
      else note(`${art.blogPage}: no Blog node in its blocks — blogPost list not written`)
    }
  }

  // ── the organization ────────────────────────────────────────────────────
  let org = base.organization ? clone(base.organization) : null
  if (org) {
    const orgTarget = (spec) => {
      if (spec === 'org') return org
      const id = idOf(spec, 'index')
      if (org['@id'] === id) return org
      const d = arr(org.department).find((x) => x['@id'] === id)
      if (!d) throw new Error(`organization: no node ${id} (the organization or one of its departments)`)
      return d
    }
    runOps(C.organization, { slug: 'index' }, orgTarget)
  } else if (arr(C.organization).length) throw new Error('organization ops given but the base layer has no organization')

  for (const [k, v] of Object.entries(blocks)) blocks[k] = v.filter(Boolean)
  return { organization: org, blocks: { sitewide: base.sitewide || [], pages: blocks, posts }, used, notes, postFaqs }
}

/** Canonical form for comparing graphs: object keys sorted; a block's top-level nodes sorted by
 *  @id (their order carries no meaning in an @graph); every other array keeps its order. */
export function canon(x, top = true) {
  if (Array.isArray(x)) {
    const a = x.map((e) => canon(e, false))
    return top ? a.sort((p, q) => String(p['@id'] ?? JSON.stringify(p)).localeCompare(String(q['@id'] ?? JSON.stringify(q)))) : a
  }
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k], false)]))
  return x
}
export const sameGraph = (a, b) => JSON.stringify(canon([].concat(a))) === JSON.stringify(canon([].concat(b)))
