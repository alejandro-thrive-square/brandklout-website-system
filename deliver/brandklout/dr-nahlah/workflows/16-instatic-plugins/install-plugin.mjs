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
import { requestForm } from '../15-instatic-api-sync/insta-api.mjs'

const zipPath = process.argv[2]
const apply = process.argv.includes('--apply')
if (!zipPath || !existsSync(zipPath)) {
  console.error('usage: node install-plugin.mjs <package.zip> [--apply]')
  process.exit(2)
}

// What this operator is willing to grant. Anything the manifest asks for that
// is not on this list is reported and the install is refused.
//
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
const GRANT = ['cms.hooks', 'modules.register', 'frontend.assets']

const bytes = readFileSync(zipPath)
const asForm = () => {
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'application/zip' }), basename(zipPath))
  form.append('grantedPermissions', JSON.stringify(GRANT))
  return form
}

const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', asForm())
const m = inspected.manifest ?? inspected.plugin ?? inspected
console.log(`\n${m.name ?? '(unnamed)'}  ${m.id}  v${m.version}`)
console.log(`  ${m.description ?? ''}`)
console.log(`\n  requests : ${(m.permissions ?? []).join(', ') || '(none)'}`)
console.log(`  granting : ${GRANT.join(', ')}`)

const extra = (m.permissions ?? []).filter((p) => !GRANT.includes(p))
if (extra.length) {
  console.error(`\nREFUSED — the package asks for permissions this script does not grant: ${extra.join(', ')}`)
  console.error('Review the plugin, then add them to GRANT deliberately.')
  process.exit(1)
}

if (!apply) {
  console.log('\nDRY RUN — re-run with --apply to install')
  process.exit(0)
}

const res = await requestForm('/admin/api/cms/plugins/package', asForm())
console.log(`\n${JSON.stringify(res, null, 2).slice(0, 1200)}`)
