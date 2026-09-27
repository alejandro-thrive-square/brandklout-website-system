#!/usr/bin/env node
/**
 * Copy production's plugin SETTINGS onto staging, minus what must never run on
 * a clone. Use after a re-seed, once both sides run the same plugin versions
 * (clone-plugins.mjs installs; this only refreshes settings).
 *
 *   node sync-plugin-settings.mjs            # show what would change
 *   node sync-plugin-settings.mjs --apply
 *
 * Held back on staging, on purpose (2026-09-23):
 *  - GoHighLevel number pools + user_session.js: every visitor claims a REAL
 *    tracking number from the pool, so reviewers would burn production's numbers.
 *  - Google Tag Manager: fires the production container's analytics and ad tags.
 *  - open-graph `emitCanonical` stays false: staging is noindex, and noindex plus
 *    a canonical can carry the noindex over to production.
 * Everything else, including Termly, Sienna and the OpenAI Ads SDK, is copied.
 * The OpenAI pixel's own code asset refuses to run off www.drnahlah.com, so the
 * SDK line on staging records nothing.
 */
import { login, session, api } from './lib.mjs'

const PROD = 'https://www.drnahlah.com'
const STAGING = 'https://staging.drnahlah.com'
const APPLY = process.argv.includes('--apply')
const PLUGINS = ['brandklout.embed-origins', 'brandklout.open-graph', 'brandklout.aeo-schema']
const NEVER_ON_STAGING = /\/number_pool\.js|\/user_session\.js|googletagmanager\.com\/gtm\.js/

const pc = await login(PROD)
const sc = await session(STAGING)
const plan = []
for (const id of PLUGINS) {
  const prod = (await api(PROD, pc, 'GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
  const stg = (await api(STAGING, sc, 'GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
  const next = { ...prod }
  if (id === 'brandklout.embed-origins') {
    next.siteScripts = String(prod.siteScripts ?? '').split(/\r?\n/).filter((l) => l.trim() && !NEVER_ON_STAGING.test(l)).join('\n')
  }
  if (id === 'brandklout.open-graph') next.emitCanonical = false
  const changed = Object.keys({ ...stg, ...next }).filter((k) => JSON.stringify(stg[k]) !== JSON.stringify(next[k]))
  console.log(`${id}: ${changed.length ? 'CHANGE ' + changed.join(', ') : 'in sync'}`)
  if (changed.length) plan.push({ id, next })
}
if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }
for (const { id, next } of plan) {
  await api(STAGING, sc, 'PUT', `/admin/api/cms/plugins/${id}/settings`, { settings: next })
  const back = (await api(STAGING, sc, 'GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
  const ok = Object.keys(next).every((k) => JSON.stringify(back[k]) === JSON.stringify(next[k]))
  console.log(`${id}: ${ok ? 'written and read back' : 'READ-BACK MISMATCH'}`)
  if (!ok) process.exit(1)
}
console.log('publish staging for the CSP and tags to reach its pages')
