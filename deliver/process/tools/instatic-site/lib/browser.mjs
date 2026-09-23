/**
 * browser.mjs — resolve puppeteer-core for the tools/instatic-site gates.
 *
 * puppeteer-core is not a dependency of this repo. Resolution order:
 *   1. PUPPETEER_DIR (a node_modules folder that has it)
 *   2. the current directory upward (a worktree that ran `npm i --no-save puppeteer-core`)
 *   3. this tools folder upward
 * Chrome: CHROME_PATH or the default Windows install. The reviewer uses Safari; for WebKit checks
 * use playwright-core instead (see the BugHerd memories), this helper is Chrome only.
 */
import { createRequire } from 'node:module'
import path from 'node:path'

const tries = [process.env.PUPPETEER_DIR, path.join(process.cwd(), 'x.js'), import.meta.url].filter(Boolean)
let mod = null
for (const t of tries) {
  try { mod = createRequire(t.endsWith('/') || t.endsWith('\\') ? t + 'x.js' : t)('puppeteer-core'); break } catch { /* next */ }
}
if (!mod) {
  console.error('puppeteer-core not found. Run `npm i --no-save puppeteer-core` in the worktree, or set PUPPETEER_DIR to a node_modules folder that has it.')
  process.exit(2)
}
export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export default mod.default ?? mod
