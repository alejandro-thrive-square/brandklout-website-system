#!/usr/bin/env node
/**
 * swap-youtube-to-vimeo.mjs — move every practice-owned film on the site from
 * YouTube to the Brandklout Vimeo library.
 *
 *   node swap-youtube-to-vimeo.mjs                 # plan only
 *   node swap-youtube-to-vimeo.mjs --apply         # write the draft
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node swap-youtube-to-vimeo.mjs --apply
 *
 * Three mechanisms carry YouTube on this site and each needs its own swap:
 *
 * 1. `base.video` with a youtube.com/embed URL — an eager iframe. Instatic
 *    treats a non-YouTube <iframe> as a forbidden custom tag and publishes it
 *    as an empty div, so these become `brandklout.embed-origins.embed` nodes
 *    carrying Vimeo's own snippet. That is not a guess: it is the shape of the
 *    two Vimeo films already live on /index and /meet-dr-nahlah, copied.
 *
 * 2. `.vl-card[data-yt]` click-to-play facades. The attribute becomes
 *    `data-vimeo`; site.js learns to read either. `data-yt` keeps working
 *    because eight Wellness Hour films stay on YouTube (see below).
 *
 * 3. The facade thumbnails, `img.youtube.com/vi/<id>/maxresdefault.jpg`,
 *    become the matching 1280x720 still from i.vimeocdn.com. Left alone they
 *    would keep calling YouTube on every page load, which is most of what the
 *    migration was for.
 *
 * NOT MOVED: the eight THE WELLNESS HOUR films on /video-library. They are
 * third-party syndicated content licensed for embedding, never uploaded to the
 * client's Vimeo, and re-hosting them is a rights question nobody has
 * answered. They stay on YouTube and the page stays mixed-host.
 */
import { api, getSite, getPages, templateMap, toChangedPage, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import { readFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const ONLY = (process.argv.indexOf('--only') > -1) ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null

// youtube id -> vimeo id. The twelve practice-owned films, from the migration manifest.
const MAP = {
  HiNtywrb4Yg: '1222231749', Vp6hSfd3oLI: '1222232372', oveSqavqCIQ: '1222231994',
  R_cKCMsVr8o: '1222231660', yTCwgaq4zqw: '1222231319', bn3vdCgDTrc: '1222231320',
  'x6Dr-YPCUaI': '1222231322', '8DH9ZdyBcp4': '1222231716', fiWLQROMvcg: '1222232076',
  'glyfx-NFHHM': '1222231763', lU62bTDjV64: '1222232339', BnB_W6F_P1g: '1222231321',
}
const THUMBS = JSON.parse(readFileSync('.tmp/vimeo-thumbs.json', 'utf8'))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Vimeo's own embed snippet, identical in shape to the two already live here. */
function snippetFor(vid, title) {
  return '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/'
    + vid
    + '?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="'
    + esc(title)
    + '"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>'
}

function convert(nodes) {
  const out = JSON.parse(JSON.stringify(nodes))
  const log = { video: 0, facade: 0, thumb: 0, skipped: [] }
  for (const [id, n] of Object.entries(out)) {
    const p = n.props || {}

    // 1. eager base.video YouTube iframe -> Vimeo embed block
    if (n.moduleId === 'base.video' && /youtube\.com\/embed\//.test(p.videoUrl || '')) {
      const yt = p.videoUrl.match(/embed\/([A-Za-z0-9_-]{11})/)[1]
      const vid = MAP[yt]
      if (!vid) { log.skipped.push(id + ' base.video ' + yt + ' (not migrated)'); continue }
      out[id] = {
        id: n.id, moduleId: 'brandklout.embed-origins.embed',
        props: { source: 'snippet', url: '', snippet: snippetFor(vid, p.title || ''), title: '',
                 fit: 'auto', height: 600, ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '' },
        breakpointOverrides: n.breakpointOverrides || {}, children: [],
        classIds: n.classIds || [], parentId: n.parentId,
      }
      log.video++; continue
    }

    // 2. click-to-play facade: data-yt -> data-vimeo
    const attrs = p.htmlAttributes
    if (attrs && attrs['data-yt']) {
      const yt = attrs['data-yt'], vid = MAP[yt]
      if (!vid) { log.skipped.push(id + ' facade ' + yt + ' (third-party, stays on YouTube)'); continue }
      const next = Object.assign({}, attrs)
      delete next['data-yt']
      next['data-vimeo'] = vid
      out[id] = Object.assign({}, n, { props: Object.assign({}, p, { htmlAttributes: next }) })
      log.facade++; continue
    }

    // 3. facade thumbnail -> Vimeo still
    if (n.moduleId === 'base.image' && /img\.youtube\.com|ytimg\.com/.test(p.src || '')) {
      const yt = (p.src.match(/vi\/([A-Za-z0-9_-]{11})\//) || [])[1]
      const vid = MAP[yt]
      if (!vid) { log.skipped.push(id + ' thumb ' + yt + ' (third-party, stays on YouTube)'); continue }
      const t = THUMBS[vid]
      if (!t || !t.thumb) { log.skipped.push(id + ' thumb ' + yt + ' -> no Vimeo still'); continue }
      out[id] = Object.assign({}, n, {
        props: Object.assign({}, p, {
          src: t.thumb,
          htmlAttributes: Object.assign({}, p.htmlAttributes || {}, { width: String(t.w), height: String(t.h) }),
        }),
      })
      log.thumb++; continue
    }
  }
  return { nodes: out, log }
}

const counts = (nodes) => ({
  nodes: Object.keys(nodes).length,
  embeds: Object.values(nodes).filter(n => n.moduleId === 'brandklout.embed-origins.embed').length,
  videos: Object.values(nodes).filter(n => n.moduleId === 'base.video').length,
  images: Object.values(nodes).filter(n => n.moduleId === 'base.image').length,
})

console.log('BASE', BASE, APPLY ? '| APPLY' : '| plan only')
const templatesBefore = await templateMap()
const rows = (await getPages()).rows
let touched = 0, bad = 0
const totals = { video: 0, facade: 0, thumb: 0 }

for (const row of rows) {
  const slug = row.cells?.slug ?? row.slug ?? row.id
  if (ONLY && !ONLY.includes(slug)) continue
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const conv = convert(nodes)
  const log = conv.log
  const n = log.video + log.facade + log.thumb
  if (!n) continue
  touched++
  totals.video += log.video; totals.facade += log.facade; totals.thumb += log.thumb
  console.log('\n/' + slug + '  video:' + log.video + ' facade:' + log.facade + ' thumb:' + log.thumb
    + (log.skipped.length ? '  skipped:' + log.skipped.length : ''))
  for (const s of log.skipped) console.log('      - ' + s)
  if (!APPLY) continue

  const site = await getSite()
  const fresh = (await api('GET', '/admin/api/cms/data/rows/' + row.id)).row
  const entry = toChangedPage(fresh, { nodes: conv.nodes })
  let res
  try {
    res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental', site: site.site, changedPages: [entry], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: { [row.id]: fresh.seq }, shellBaseSeq: site.seq,
    })
  } catch (e) { console.log('  FAIL ' + e.message.slice(0, 260)); bad++; continue }
  const back = (await api('GET', '/admin/api/cms/data/rows/' + row.id)).row
  const want = counts(conv.nodes), got = counts(back.cells.body.nodes)
  const slugOk = (back.cells.slug ?? back.slug) === slug
  const ok = JSON.stringify(want) === JSON.stringify(got) && slugOk
  if (!ok) bad++
  console.log('  ' + (ok ? 'OK  ' : 'BAD ') + ' seq ' + res.seq + '  sent ' + JSON.stringify(want)
    + ' got ' + JSON.stringify(got) + ' slug=' + slugOk)
}

const templatesAfter = await templateMap()
const tplOk = JSON.stringify(templatesBefore) === JSON.stringify(templatesAfter)
console.log('\npages touched ' + touched + ' | base.video->embed ' + totals.video
  + ' | facades ' + totals.facade + ' | thumbs ' + totals.thumb + ' | bad ' + bad)
console.log('templates intact: ' + tplOk)
if (bad || !tplOk) process.exit(1)
