#!/usr/bin/env node
/**
 * Install (or upgrade) `webzite.open-graph` / `webzite.aeo-schema` on the
 * Instatic instance named by INSTATIC_BASE_URL.
 *
 *   node ../18-instatic-embeds/pack-plugin.mjs open-graph .tmp/open-graph.zip
 *   node install-plugin.mjs .tmp/open-graph.zip            # dry run: inspect only
 *   node install-plugin.mjs .tmp/open-graph.zip --apply    # install
 *
 * Deliberately a SEPARATE installer from `18-instatic-embeds/install-plugin.mjs`
 * rather than two more entries in that file's grant list. The grant list IS the
 * security review, written down; keeping the embed plugin's and the SEO
 * plugins' in different files means widening one can never silently widen the
 * other. The transport is shared (`../18-instatic-embeds/lib/insta-api.mjs`)
 * because that is mechanism, not policy.
 *
 * `POST /admin/api/cms/plugins/inspect-package` reads the manifest WITHOUT
 * installing, and is called here with NO grants at all: sending a grant list
 * before we know which plugin the zip contains would defeat the per-id table
 * below. `POST /admin/api/cms/plugins/package` is the install, and needs
 * step-up auth, which `requestForm` performs and retries through.
 */
import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { requestForm } from '../18-instatic-embeds/lib/insta-api.mjs'

const zipPath = process.argv[2]
const apply = process.argv.includes('--apply')
if (!zipPath || !existsSync(zipPath)) {
  console.error('usage: node install-plugin.mjs <package.zip> [--apply]')
  process.exit(2)
}

// What this operator is willing to grant, PER PLUGIN. A permission a manifest
// asks for that is not on its list is reported and the install refused; a
// plugin id with no entry here cannot be installed by this script at all.
// Both lists are carried across unchanged from the review in the bk-dr-nahlah
// worktree, where both plugins were written and first installed.
const GRANTS = {
  // ---- Open Graph ---------------------------------------------------------
  //   cms.hooks         the `publish.html` filter that writes the tags into
  //                     <head> at publish. Same mechanism as Embed Origins.
  //   cms.storage       the per-page overrides, in the plugin's own record
  //                     table. Nothing else on the site is written.
  //   cms.routes        the admin page and the bulk API are endpoints under
  //                     `/admin/api/cms/plugins/<id>/runtime/`. NOT
  //                     `cms.routes.public` - every one is behind a session.
  //   cms.content.read  READ ONLY, and only `pages` + `posts`, declared in the
  //                     manifest's contentAccess[]. It is what lets the plugin
  //                     publish the `seoDescription` the platform stores and
  //                     never emits. There is no `cms.content.write` here: the
  //                     plugin cannot alter a page.
  //   admin.navigation  the sidebar item.
  //   editor.code       REQUIRED by the host for an adminPages[].content.kind
  //                     = 'app' page. Rated `dangerous`: unsandboxed code in
  //                     the admin window. One hand-written file, no build step,
  //                     no third-party dependency, talks only to its own routes.
  'webzite.open-graph': [
    'cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read',
    'admin.navigation', 'editor.code',
  ],

  // ---- AEO Schema ---------------------------------------------------------
  // Identical set, for identical reasons - the two are siblings. This filter
  // writes ONE `application/ld+json` graph per page; the content read is again
  // `pages` + `posts`, read-only, for the titles, descriptions and dates that
  // go into WebPage and Article.
  'webzite.aeo-schema': [
    'cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read',
    'admin.navigation', 'editor.code',
  ],
}

const bytes = readFileSync(zipPath)
const asForm = (grant) => {
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'application/zip' }), basename(zipPath))
  form.append('grantedPermissions', JSON.stringify(grant))
  return form
}

const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', asForm([]))
const m = inspected.manifest ?? inspected.plugin ?? inspected

const GRANT = GRANTS[m.id]
if (!GRANT) {
  console.error(`\nREFUSED - no grant list for plugin id "${m.id}".`)
  console.error('Add one to GRANTS in this script, deliberately, after reviewing the plugin.')
  process.exit(1)
}
console.log(`\n${m.name ?? '(unnamed)'}  ${m.id}  v${m.version}`)
console.log(`  ${m.description ?? ''}`)
console.log(`\n  requests : ${(m.permissions ?? []).join(', ') || '(none)'}`)
console.log(`  granting : ${GRANT.join(', ')}`)

const extra = (m.permissions ?? []).filter((p) => !GRANT.includes(p))
if (extra.length) {
  console.error(`\nREFUSED - the package asks for permissions this script does not grant: ${extra.join(', ')}`)
  console.error('Review the plugin, then add them to GRANTS deliberately.')
  process.exit(1)
}

if (!apply) {
  console.log('\nDRY RUN - re-run with --apply to install')
  process.exit(0)
}

const res = await requestForm('/admin/api/cms/plugins/package', asForm(GRANT))
console.log(`\n${JSON.stringify(res, null, 2).slice(0, 1200)}`)
