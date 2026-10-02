/**
 * paths.mjs — where a tools/instatic-site script reads the local build and writes its output.
 *
 * Written 2026-09-23. The client scripts these were promoted from hardcoded
 * `../04-design/.tmp/site-src` relative to their own folder. Here:
 *
 *   WORK      the folder you run from: the step folder in the client's scenario copy
 *             (e.g. deliver/brandklout/<client>/scenario-0-new-site/04-qa/). Outputs go to WORK/output.
 *   SITE_SRC  the build root: --site-src <dir> or env SITE_SRC, resolved against WORK.
 *             Expected layout (West LA Implants, the most general build):
 *               <SITE_SRC>/dist/            every page as .html (index.html = home), assets/,
 *                                           media/img, media/video, fonts/, assets/gsap/
 *               <SITE_SRC>/css/             the source stylesheets, in load order
 *             Default: output/code/site-src when run from step 03, else ../03-design-build/output/code/site-src
 */
import fs from 'node:fs'
import path from 'node:path'

export const WORK = process.cwd()

const argv = process.argv
const i = argv.indexOf('--site-src')
const DEFAULT_SRC = ['output/code/site-src', '../03-design-build/output/code/site-src']
  .find((p) => fs.existsSync(path.resolve(process.cwd(), p))) || 'output/code/site-src'
const raw = (i >= 0 && argv[i + 1]) || process.env.SITE_SRC || DEFAULT_SRC
// Remove the flag so scripts that read positional args (page slug, width) never see it.
if (i >= 0) argv.splice(i, 2)
export const SITE_SRC = path.resolve(WORK, raw)
export const DIST = path.join(SITE_SRC, 'dist')
export const CSS_DIR = path.join(SITE_SRC, 'css')
export const TMP = path.join(WORK, 'output')
fs.mkdirSync(TMP, { recursive: true })

/** Every page in dist, derived rather than listed (a gate with a page list goes blind). */
export function distPages(dist = DIST) {
  const out = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) { if (!/^(assets|media|fonts|node_modules)$/.test(e.name)) walk(p) }
      else if (e.name.endsWith('.html')) out.push(p)
    }
  }
  if (!fs.existsSync(dist)) throw new Error(`no build at ${dist} — pass --site-src or set SITE_SRC`)
  walk(dist)
  return out.map((file) => {
    let rel = path.relative(dist, file).replace(/\\/g, '/').replace(/\.html$/, '')
    rel = rel.replace(/(^|\/)index$/, '')
    return { file, slug: rel || 'index', route: '/' + rel }
  })
}
