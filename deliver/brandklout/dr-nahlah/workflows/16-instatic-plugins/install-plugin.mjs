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
import { requestForm } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const zipPath = process.argv[2]
const apply = process.argv.includes('--apply')
if (!zipPath || !existsSync(zipPath)) {
  console.error('usage: node install-plugin.mjs <package.zip> [--apply]')
  process.exit(2)
}

// What this operator is willing to grant, PER PLUGIN. Anything a manifest asks
// for that is not on its list is reported and the install is refused; a plugin
// id with no entry here cannot be installed by this script at all.
//
// Keyed by id rather than kept as one flat list so that adding a second plugin
// cannot silently widen what the first one gets.
const GRANTS = {
  // ---- Embed Origins ------------------------------------------------------
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
  'webzite.embed-origins': ['cms.hooks', 'modules.register', 'frontend.assets'],

  // ---- Link Editor --------------------------------------------------------
  //   editor.code       REQUIRED by the host for any `entrypoints.editor`
  //                     (`parsePluginManifest` refuses the manifest without it).
  //                     Rated `dangerous`: the entrypoint is unsandboxed code in
  //                     the admin window. This is our own hand-written module —
  //                     two files, no build step, no third-party dependency, no
  //                     network access of its own.
  //   editor.panels     mounts the "Link URL" panel in the editor rail.
  //   editor.store.read reads the selected node so the panel can show its
  //                     current address.
  //   editor.store.write the plugin mutates editor state. Note the write goes
  //                     through `store.read().updateNodeProps(...)` — the same
  //                     action the platform's own property panel calls — rather
  //                     than `store.transaction`, which hands out a Mutative
  //                     draft that a store action must not be re-entered on.
  //                     The permission is requested anyway because the plugin
  //                     genuinely writes, and the consent screen should say so.
  'webzite.link-editor': ['editor.code', 'editor.panels', 'editor.store.read', 'editor.store.write'],

  // ---- Open Graph ---------------------------------------------------------
  //   cms.hooks         the `publish.html` filter that writes og:/twitter: tags,
  //                     a canonical link and the page's own meta description
  //                     into `<head>`. Same mechanism as Embed Origins.
  //   cms.storage       the per-page overrides, in the plugin's own record
  //                     table. Nothing else on the site is written.
  //   cms.routes        the admin page and the bulk API are the same six
  //                     endpoints under `/admin/api/cms/plugins/<id>/runtime/`.
  //                     NOT `cms.routes.public` — every one of them is behind a
  //                     session, and the write routes behind `content.manage`.
  //   cms.content.read  READ ONLY, and only `pages` + `posts`, declared in the
  //                     manifest's `contentAccess[]`. It is what lets the plugin
  //                     publish the `seoDescription` the platform stores and
  //                     never emits. There is no `cms.content.write` here: the
  //                     plugin cannot alter a page.
  //   admin.navigation  the "Open Graph" item in the admin sidebar.
  //   editor.code       REQUIRED by the host for an `adminPages[].content.kind
  //                     = 'app'` page (`adminRuntime.ts` refuses to import the
  //                     module without the explicit grant). Rated `dangerous`:
  //                     the admin app is unsandboxed code in the admin window.
  //                     Ours is one hand-written file, no build step, no
  //                     third-party dependency, and it talks only to this
  //                     plugin's own routes.
  'webzite.open-graph': [
    'cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read',
    'admin.navigation', 'editor.code',
  ],

  // ---- AEO Schema ---------------------------------------------------------
  // Identical set, for identical reasons — the two are siblings. The filter
  // writes ONE `application/ld+json` graph per page; the content read is again
  // `pages` + `posts`, read-only, for the titles, descriptions and publish
  // dates that go into WebPage and Article.
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

// Inspect with NO grants — the call only reads the manifest, and sending a
// grant list before we know which plugin this is would defeat the per-id table.
const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', asForm([]))
const m = inspected.manifest ?? inspected.plugin ?? inspected

const GRANT = GRANTS[m.id]
if (!GRANT) {
  console.error(`\nREFUSED — no grant list for plugin id "${m.id}".`)
  console.error('Add one to GRANTS in this script, deliberately, after reviewing the plugin.')
  process.exit(1)
}
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

const res = await requestForm('/admin/api/cms/plugins/package', asForm(GRANT))
console.log(`\n${JSON.stringify(res, null, 2).slice(0, 1200)}`)
