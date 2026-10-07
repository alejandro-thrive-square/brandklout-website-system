#!/usr/bin/env node
/**
 * build-schema.mjs — step 3 of the content-built schema chain: the aeo-schema blocks, built from what
 * each page shows. Engine and house rules: lib/schema-build.mjs; the mapping language: README.
 *
 *   node build-schema.mjs [--config output/seo-config.json] [--out output/schema] [--offline]
 *     reads  <out>/sections.json (scan-sections.mjs), <out>/facts.json (fetch-facts.mjs),
 *            files.base from the config (the practice's stated facts; seo-base.template.json)
 *     writes <out>/organization.json, <out>/blocks.json ({ sitewide, pages, posts }),
 *            <out>/sections-used.txt (every section the build depends on)
 *
 * Scanned pages the base does not cover start from the block stored live in the aeo-schema plugin:
 * that one READ needs the Instatic login of INSTATIC_BASE_URL (the worktree .env, through
 * ../lib/site.mjs). --offline skips it (such pages start from a bare WebPage). Nothing is written to
 * any instance here; push-schema.mjs ships the result.
 *
 * A renamed heading, a changed line a `[?…]` lookup depends on, or a stated fact the page no longer
 * says (`pageSays`) stops the build with the page and the rule: rescan, fix the config, rebuild.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, configPath, outDir, flag } from './lib/seo-config.mjs'
import { buildSchema } from './lib/schema-build.mjs'

const C = loadConfig()
const OUT = outDir()
mkdirSync(OUT, { recursive: true })
const need = (f, how) => { if (!existsSync(join(OUT, f))) { console.error(`no ${join(OUT, f)}: run ${how} first`); process.exit(2) } return JSON.parse(readFileSync(join(OUT, f), 'utf8')) }
const pages = need('sections.json', 'scan-sections.mjs')
const facts = need('facts.json', 'fetch-facts.mjs')
const baseFile = configPath(C, C.files.base)
if (baseFile && !existsSync(baseFile)) { console.error(`files.base ${baseFile} does not exist`); process.exit(2) }
const base = baseFile ? JSON.parse(readFileSync(baseFile, 'utf8')) : {}

const isArticle = (s) => !!C.articles && s.startsWith(C.articles.prefix)
const uncovered = Object.keys(pages).filter((s) => !isArticle(s) && !base.pages?.[s])
const postsUncovered = C.articles ? Object.keys(pages).filter(isArticle).filter((s) => !base.posts?.[C.articles.keyPrefix + s.slice(C.articles.prefix.length)]) : []
let live = []
if ((uncovered.length || postsUncovered.length) && !flag('--offline')) {
  const { api, BASE } = await import('../lib/site.mjs')
  live = (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')).entries
  console.log(`read     ${live.length} stored aeo entries from ${BASE} (base covers neither ${uncovered.length} page(s) nor ${postsUncovered.length} article(s))`)
}

let r
try {
  r = buildSchema({ config: C, pages, facts, base, live })
} catch (e) {
  console.error(`BUILD STOPPED: ${e.message}`)
  process.exit(1)
}
if (r.organization) writeFileSync(join(OUT, 'organization.json'), JSON.stringify(r.organization, null, 2))
writeFileSync(join(OUT, 'blocks.json'), JSON.stringify(r.blocks, null, 1))
writeFileSync(join(OUT, 'sections-used.txt'), r.used.join('\n') + '\n')
const bytes = (o) => JSON.stringify(o).length
console.log(`pages ${Object.keys(r.blocks.pages).length}, articles ${Object.keys(r.blocks.posts).length} (FAQPage on ${r.postFaqs}), ` +
  `sections read ${r.used.length}, ${bytes(r.blocks)} bytes${r.organization ? ` + organization ${bytes(r.organization)}` : ''} → ${OUT}`)
console.log(`notes ${r.notes.length} — next: node vocab-check.mjs, then push-schema.mjs (plan)`)
