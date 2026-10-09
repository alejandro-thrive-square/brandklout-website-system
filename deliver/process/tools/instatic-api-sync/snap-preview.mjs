#!/usr/bin/env node
/**
 * STEP C PREVIEW (read-only): what would snapping off-scale spacing to the house steps look like?
 *
 *   node snap-preview.mjs --site <client>:staging [--pages home,about,contact] [--widths 1440,390]   # needs PUPPETEER_DIR
 *
 * Phase 2 step C (CLASS-STANDARD §10) is a VISIBLE change, decided per site by a person after a
 * before/after. This produces that before/after without writing anything: it fetches the published
 * registry stylesheet (`/_instatic/css/style-<hash>.css`), snaps it in memory, and screenshots each page
 * twice in a headless browser, once as published and once with the snapped stylesheet served in its
 * place (request interception). Staging is only read.
 *
 * THE SNAP RULE (the same rule a later `--snap` apply must use; `snapValue` is exported for it):
 *   - only rem literals in padding / margin / gap / row-gap / column-gap (base and every breakpoint,
 *     inside calc()/clamp() too), the properties step A points at the scale;
 *   - only values from 0.25rem to 12rem (4–192px, the house range): smaller hairlines, larger values,
 *     negatives and zeros stay literal;
 *   - to the NEAREST STEP BY RATIO (log scale): spacing is perceived proportionally, so 24px goes to
 *     32 (24/16 = 1.5 > 32/24 = 1.33) and 20px to 16. Linear nearest would tie at 12, 24, 40, 56, 72, 88,
 *     112 and 160px, the values this fleet uses most.
 *   - the snapped value is the step's rem number (it computes like var(--space-*), which step A added).
 *
 * Writes output/fleet/<client>/snap-preview/: <page>@<width>.before.jpg / .after.jpg (full page, capped
 * at 6000px; 1440 at half scale) and summary.json (values snapped, shift histogram, most common
 * changes, page heights before/after). Screenshots run with prefers-reduced-motion: reduce, so reveals
 * are settled and the two states compare.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const STEPS_PX = [4, 8, 16, 32, 48, 64, 80, 96, 128, 192] // framework-spec.template.json "Spacing"
const SPACING_PROP = /^(padding|margin)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$|^(row-|column-)?gap$/

/** rem -> snapped rem, or null when the value stays (on a step already, or outside the house range). */
export function snapValue(rem) {
  const px = rem * 16
  if (!(px >= 4 && px <= 192)) return null
  if (STEPS_PX.some((s) => Math.abs(s - px) < 0.01)) return null
  let best = STEPS_PX[0]
  for (const s of STEPS_PX) if (Math.abs(Math.log(px / s)) < Math.abs(Math.log(px / best))) best = s
  return best / 16
}

/** Snap every eligible rem literal in a stylesheet's spacing declarations. */
export function snapSpacingCss(css) {
  const changes = []
  let fluid = 0
  const out = css.replace(/([{;\s])([a-z-]+)(\s*:\s*)([^;{}]+)/g, (all, pre, prop, colon, value) => {
    if (!SPACING_PROP.test(prop)) return all
    // A fluid value is off-scale on purpose: snapping both ends of clamp(0.75rem, 2vw, 1.25rem) gives
    // clamp(1rem, 2vw, 1rem), a fixed value. Left whole, counted.
    if (/\b(clamp|min|max)\(/.test(value)) { if (/\d*\.?\d+rem\b/.test(value)) fluid++; return all }
    const v = value.replace(/(^|[^\w.-])(\d*\.?\d+)rem\b/g, (m, before, num) => {
      const snapped = snapValue(Number(num))
      if (snapped === null) return m
      changes.push({ prop, from: Number(num), to: snapped })
      return `${before}${+snapped.toFixed(4)}rem`
    })
    return `${pre}${prop}${colon}${v}`
  })
  return { css: out, changes, fluid }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const { connect, argOf } = await import('./target.mjs')
  const { api, target } = await connect()
  const isStaging = target.env === 'staging' || /(^|[.-])staging[.-]/.test(new URL(target.url).hostname)
  if (!isStaging) throw new Error('refusing: staging only (the preview reads the published staging site)')
  const client = (argOf('--site') ?? 'site').split(':')[0]
  const base = target.url.replace(/\/$/, '')
  const widths = (argOf('--widths') ?? '1440,390').split(',').map(Number)
  const LEGAL = /privacy|terms|hipaa|accessib|legal|cookie|thank|404|sitemap|disclos|policy|consent|notice|reviews?$/i
  let pages = argOf('--pages')?.split(',').map((s) => (s === 'home' ? '' : s))
  if (!pages) {
    const { rows } = await api.getPages()
    const slugs = rows.map((r) => r.cells?.slug ?? r.slug ?? '').filter((s) => typeof s === 'string')
    const top = slugs.filter((s) => s && !s.includes('/') && !LEGAL.test(s)).sort()
    pages = ['', ...top.slice(0, 2)]
  }

  const home = await (await fetch(`${base}/`)).text()
  const href = home.match(/href="([^"]*\/_instatic\/css\/style-[^"]+\.css)"/)?.[1]
  if (!href) throw new Error('no /_instatic/css/style-*.css on the home page')
  const styleUrl = new URL(href, `${base}/`).href
  const published = await (await fetch(styleUrl)).text()
  const { css: snapped, changes, fluid } = snapSpacingCss(published)

  const OUT = join(HERE, 'output', 'fleet', client, 'snap-preview')
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'style.published.css'), published)
  writeFileSync(join(OUT, 'style.snapped.css'), snapped)

  const { default: puppeteer, CHROME } = await import('../instatic-site/lib/browser.mjs')
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-crash-reporter', '--hide-scrollbars'] })
  const heights = []
  try {
    for (const slug of pages) {
      for (const w of widths) {
        for (const state of ['before', 'after']) {
          const page = await browser.newPage()
          await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
          await page.setViewport({ width: w, height: w > 800 ? 900 : 844, deviceScaleFactor: w > 800 ? 0.5 : 1 })
          await page.setRequestInterception(true)
          page.on('request', (req) => {
            if (state === 'after' && req.url().split('?')[0] === styleUrl.split('?')[0]) {
              req.respond({ status: 200, contentType: 'text/css; charset=utf-8', body: snapped })
            } else req.continue()
          })
          try {
            await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle2', timeout: 60000 })
          } catch {
            await page.goto(`${base}/${slug}`, { waitUntil: 'load', timeout: 90000 })
          }
          await page.evaluate(async () => {
            document.documentElement.style.scrollBehavior = 'auto'
            await document.fonts.ready
            for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
              scrollTo(0, y)
              await new Promise((r) => setTimeout(r, 120))
            }
            scrollTo(0, 0)
            await new Promise((r) => setTimeout(r, 1500))
          })
          const h = await page.evaluate(() => document.documentElement.scrollHeight)
          const name = `${slug || 'home'}@${w}`
          await page.screenshot({ path: join(OUT, `${name}.${state}.jpg`), type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width: w, height: Math.min(h, 6000) }, captureBeyondViewport: true })
          heights.push({ page: slug || 'home', width: w, state, height: h })
          await page.close()
          console.log(`ok    ${name}.${state}  height ${h}px`)
        }
      }
    }
  } finally {
    await browser.close()
  }

  // shift histogram at the 16px root, and the most common changes
  const buckets = { 'up to 2px': 0, 'up to 4px': 0, 'up to 8px': 0, 'up to 16px': 0, 'over 16px': 0 }
  const common = new Map()
  for (const c of changes) {
    const d = Math.abs(c.to - c.from) * 16
    buckets[d <= 2 ? 'up to 2px' : d <= 4 ? 'up to 4px' : d <= 8 ? 'up to 8px' : d <= 16 ? 'up to 16px' : 'over 16px']++
    const k = `${+c.from.toFixed(4)}rem (${+(c.from * 16).toFixed(1)}px) -> ${+c.to.toFixed(4)}rem (${c.to * 16}px)`
    common.set(k, (common.get(k) ?? 0) + 1)
  }
  const summary = {
    client, site: base, styleUrl, at: new Date().toISOString(), rule: 'nearest house step by ratio; 4-192px only; rem in padding/margin/gap',
    valuesSnapped: changes.length, fluidLeft: fluid, shift: buckets,
    mostCommon: [...common].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([change, n]) => ({ change, n })),
    pages: pages.map((p) => p || 'home'), widths, heights,
  }
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(`\n${client}: ${changes.length} spacing values would snap; shifts ${JSON.stringify(buckets)}`)
  for (const m of summary.mostCommon.slice(0, 6)) console.log(`  ${String(m.n).padStart(4)}  ${m.change}`)
  console.log(`screenshots + summary: ${OUT}`)
}
