/**
 * Runs ON the Railway container. Converts the Stone static build into an
 * Instatic site document, using **Instatic's own** importer rather than a
 * reimplementation — same reasoning as convert-css.md: the classification,
 * breakpoint handling and class-token binding all have to match what the
 * editor expects, and a hand-rolled version drifts invisibly.
 *
 * In:  /app/import-input.json.gz   { css, pages: [{ slug, title, seoTitle, seoDescription, html }] }
 * Out: /app/import-out.json        { styleRules, conditions, pages, stats }
 *
 * Pipeline, in the order the platform requires:
 *
 *   1. cssToStyleRules(css)                 — site.css -> NewStyleRule[]
 *   2. mergeImportedStyleRules(...)         — NewStyleRule[] -> the registry
 *   3. importHtml(html) per page            — HTML -> flat PageNode fragment
 *   4. linkImportedClassNames(...) per node — class NAMES -> registry class ids
 *   5. wrap each page's roots in a base.body node
 *
 * Step 2 MUST precede step 4 (importLinking.ts says so): merging first means a
 * class name from the markup links to the REAL rule carrying its declarations.
 * Reverse them and every class auto-creates as a bare style-less class, the
 * merge then skips it as already-present, and the site publishes with a
 * complete class registry and no styling whatsoever.
 *
 * Copied to /app alongside conv-preload.ts and conv-encode.ts.
 * Run: bun run /app/import-run.ts
 */
import './conv-preload.ts'
import { encodeLossyDeclarations } from './conv-encode.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

// The base modules SELF-REGISTER as a side effect of this import, and
// `walkAndMap` calls `registry.getOrThrow(moduleId)` for every element it
// maps. Without it the very first anchor on the very first page throws
// `Module "base.link" is not registered` — the registry is a singleton that
// nothing else populates outside app boot.
await import('./src/modules/base/index.ts')

const { cssToStyleRules } = await import('@core/siteImport')
const { importHtml } = await import('@core/htmlImport')
const { createNode } = await import('@core/page-tree')
const {
  createStyleRuleOrderAllocator,
  indexStyleRulesByName,
  linkImportedClassNames,
  mergeImportedStyleRules,
} = await import('./src/admin/pages/site/store/slices/site/importLinking.ts')

const input = JSON.parse(gunzipSync(readFileSync('/app/import-input.json.gz')).toString('utf8'))

/* --- 1. CSS -------------------------------------------------------------- */
// Both normalisations are load-bearing and both are documented in
// convert-css.md; they are repeated here rather than imported because
// conv-run.ts is a script, not a module.
let css: string = input.css
let normalised = 0
css = css.replace(/@(media|supports|container)\s*(\([^{]*)/g, (_m: string, at: string, prelude: string) => {
  const tidy = prelude.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
  normalised++
  return `@${at} ${tidy}`
})
const enc = encodeLossyDeclarations(css)
css = enc.css

// No breakpoint folding — see conv-run.ts for why a folded @media lands at the
// end of the cascade permanently. This site is fluid-first and would break.
const converted: any = cssToStyleRules(css, { breakpoints: [] })

/* --- 2. registry --------------------------------------------------------- */
const styleRules: Record<string, any> = {}
const allocateOrder = createStyleRuleOrderAllocator(styleRules)
const byName = indexStyleRulesByName(styleRules)
mergeImportedStyleRules(converted.rules, styleRules, byName, allocateOrder)

/* --- 3-5. pages ---------------------------------------------------------- */
const pages: any[] = []
const perPage: any[] = []
for (const p of input.pages) {
  const { nodes, rootIds, body, stripped, warnings } = importHtml(p.html) as any

  // Class NAMES -> registry ids, for every node in the fragment.
  let autoCreatedBefore = Object.keys(styleRules).length
  for (const node of Object.values<any>(nodes)) {
    node.classIds = linkImportedClassNames(node.classIds, styleRules, byName, allocateOrder)
  }

  // The page root. `body.classIds` carries what was on the source <body>.
  const root: any = createNode('base.body')
  root.children = rootIds
  root.classIds = linkImportedClassNames(body?.classIds, styleRules, byName, allocateOrder)
  for (const id of rootIds) if (nodes[id]) nodes[id].parentId = root.id
  nodes[root.id] = root

  pages.push({
    slug: p.slug,
    title: p.title,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    nodes,
    rootNodeId: root.id,
  })
  perPage.push({
    slug: p.slug,
    nodes: Object.keys(nodes).length,
    roots: rootIds.length,
    autoCreatedClasses: Object.keys(styleRules).length - autoCreatedBefore,
    strippedScripts: stripped?.scripts ?? 0,
    strippedHandlers: stripped?.inlineHandlers ?? 0,
    warnings: (warnings ?? []).length,
  })
}

writeFileSync(
  '/app/import-out.json',
  JSON.stringify({ styleRules, conditions: converted.conditions, pages }),
)

const byKind: Record<string, number> = {}
for (const r of Object.values<any>(styleRules)) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1
console.log(
  JSON.stringify(
    {
      normalisedPreludes: normalised,
      encodedDeclarations: enc.encoded,
      cssRules: converted.rules.length,
      registryRules: Object.keys(styleRules).length,
      byKind,
      withContexts: Object.values<any>(styleRules).filter((r) => Object.keys(r.contextStyles ?? {}).length).length,
      conditions: converted.conditions.map((c: any) => c.id),
      cssWarnings: converted.warnings.length,
      pages: perPage,
    },
    null,
    1,
  ),
)
