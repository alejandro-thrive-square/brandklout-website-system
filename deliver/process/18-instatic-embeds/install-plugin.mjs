#!/usr/bin/env node
/**
 * Install (or upgrade) a plugin package on the live Instatic instance.
 *
 *   node install-plugin.mjs .tmp/embed-origins.zip            # dry run: inspect only
 *   node install-plugin.mjs .tmp/embed-origins.zip --apply    # install
 *
 * `POST /admin/api/cms/plugins/inspect-package` reads the manifest WITHOUT
 * installing, so the dry run shows exactly which permissions the operator is
 * about to grant. Install needs `plugins.install` plus step-up auth; the
 * step-up rotates the session cookie and `requestForm` carries the new one.
 *
 * Permissions are granted explicitly rather than echoed from the manifest, so
 * a package that quietly widens what it asks for cannot be installed by a
 * re-run of this script without the diff showing up here first.
 */
import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { requestForm } from './lib/insta-api.mjs'

const zipPath = process.argv[2]
const apply = process.argv.includes('--apply')
if (!zipPath || !existsSync(zipPath)) {
  console.error('usage: node install-plugin.mjs <package.zip> [--apply]')
  process.exit(2)
}

// What this operator is willing to grant, PER PLUGIN. Anything a manifest asks
// for beyond its own entry is reported and the install is refused, and a plugin
// id with no entry here cannot be installed at all — so a package that quietly
// widens what it asks for, or an unrecognised package altogether, has to be
// reviewed and added deliberately before it can go on a site.
//
// These four are the Webzite first-party set and belong on every new site.
//
// webzite.embed-origins — the one that makes third-party embeds possible:
//   cms.hooks        the `publish.html` filter that rewrites the CSP meta tag.
//   modules.register the Embed block in the canvas module library. Rated `high`
//                    by the host because a module renders HTML into every page
//                    that uses it — here that HTML is the embed itself.
//   frontend.assets  authority for module render() `js`, dropped without it
//                    (`moduleAdapter.ts`). Used for ONE thing: the auto-height
//                    listener, served same-origin from
//                    `/_instatic/module-js/webzite.embed-origins.embed.js`.
//                    It grants no third-party origin anything — those are still
//                    typed into plugin settings, one at a time.
//
// webzite.aeo-schema / webzite.open-graph — publish-time <head> writers. Both
// read page content, keep their own settings, serve a small admin page and add
// a nav entry, hence cms.storage / cms.routes / cms.content.read /
// admin.navigation / editor.code.
//
// webzite.link-editor — editor-only. It never runs on a published page: it
// reads and writes the editor store to fix up links in the canvas.
const GRANTS = {
  'webzite.embed-origins': ['cms.hooks', 'modules.register', 'frontend.assets'],
  'webzite.aeo-schema': [
    'cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read',
    'admin.navigation', 'editor.code',
  ],
  'webzite.open-graph': [
    'cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read',
    'admin.navigation', 'editor.code',
  ],
  'webzite.link-editor': [
    'editor.code', 'editor.panels', 'editor.store.read', 'editor.store.write',
  ],
}

const bytes = readFileSync(zipPath)
const asForm = (grant) => {
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'application/zip' }), basename(zipPath))
  form.append('grantedPermissions', JSON.stringify(grant))
  return form
}

// Inspect first, granting nothing: the endpoint only reads the manifest, and
// the plugin's id is what decides which grant list applies.
const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', asForm([]))
const m = inspected.manifest ?? inspected.plugin ?? inspected
const grant = GRANTS[m.id]
console.log(`\n${m.name ?? '(unnamed)'}  ${m.id}  v${m.version}`)
console.log(`  ${m.description ?? ''}`)
console.log(`\n  requests : ${(m.permissions ?? []).join(', ') || '(none)'}`)
console.log(`  granting : ${grant ? grant.join(', ') : '(this plugin is not in GRANTS)'}`)

if (!grant) {
  console.error(`\nREFUSED — ${m.id} has no entry in GRANTS.`)
  console.error('Review the plugin, then add it deliberately.')
  process.exit(1)
}

const extra = (m.permissions ?? []).filter((p) => !grant.includes(p))
if (extra.length) {
  console.error(`\nREFUSED — the package asks for permissions this script does not grant: ${extra.join(', ')}`)
  console.error(`Review the plugin, then add them to GRANTS['${m.id}'] deliberately.`)
  process.exit(1)
}

if (!apply) {
  console.log('\nDRY RUN — re-run with --apply to install')
  process.exit(0)
}

const res = await requestForm('/admin/api/cms/plugins/package', asForm(grant))
console.log(`\n${JSON.stringify(res, null, 2).slice(0, 1200)}`)
