/**
 * site.mjs — the Instatic admin client for tools/instatic-site scripts.
 *
 * Loads the worktree .env and asserts INSTATIC_BASE_URL (./env.mjs) BEFORE the shared client
 * evaluates, then re-exports tools/instatic-api-sync/insta-api.mjs unchanged (getSite, getPages,
 * api, requestForm, saveShell, toChangedPage, assertTemplatesIntact, templateMap, publish, BASE ...).
 * ESM evaluates imports in source order, so the guard always runs first.
 */
import './env.mjs'
export * from '../../instatic-api-sync/insta-api.mjs'
