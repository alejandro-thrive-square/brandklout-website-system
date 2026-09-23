#!/usr/bin/env node
/**
 * probe-adblock.mjs - does an ad blocker's cosmetic filter hit any element on a PUBLISHED page?
 *
 * Origin: mason-park/workflows/09-static-rebuild/.tmp/probe-adblock.mjs (bk-mason-park,
 * 2026-09-18). Ported from playwright-core to the dependency-free CDP harness in lib/cdp.mjs and
 * given --combo so it walks every campaign page.
 *
 * Generic element-hiding lists (uBlock, AdGuard, Brave, and this workstation's NordVPN Threat
 * Protection) apply `position:absolute !important; clip-path:inset(100%) !important` to classes
 * like is-ad, ad-hero, ad-rail. The rules live in a browser-injected sheet that
 * document.styleSheets does NOT list, and they are absent on file://, so a local render is
 * always clean. On Mason Park the whole hero, lead form included, collapsed to 0px on staging
 * while every other gate was green.
 *
 * This asks Chrome itself which rules match every element with a class or id, and reports any
 * hiding rule (display:none, clip-path, position:absolute, visibility:hidden with !important)
 * that is not from one of the page's own sheets. Exit 1 on any hit. A clean run on a network
 * with no filter proves less: the script says so when it sees no foreign sheet. The fetch-only
 * name check in verify-combo-live.mjs catches the class names on any network.
 *
 *   node probe-adblock.mjs <url> [url...]                 > .tmp/adblock.log 2>&1
 *   node probe-adblock.mjs --combo combo.json [--origin …] > .tmp/adblock.log 2>&1
 */
import { parseArgs, loadCombo, comboUrls } from './lib/combo.mjs'
import { launch, wait } from './lib/cdp.mjs'

const { flags, rest } = parseArgs()
const urls = flags.combo ? comboUrls(loadCombo(flags.combo, flags.origin)).map((u) => u.url) : rest
if (!urls.length) { console.error('usage: probe-adblock.mjs <url> [url...] | --combo combo.json'); process.exit(2) }

let problems = 0
const b = await launch({ width: 1440 })
const own = new Set()
const foreign = new Map()
b.on((m) => {
  if (m.method !== 'CSS.styleSheetAdded') return
  const h = m.params.header
  if (h.sourceURL || h.ownerNode) own.add(h.styleSheetId); else foreign.set(h.styleSheetId, h.origin)
})
for (const url of urls) {
  try { await b.S('CSS.disable'); await b.S('DOM.disable') } catch {}
  own.clear(); foreign.clear()
  await b.S('Page.navigate', { url })
  await wait(6000)
  await b.S('DOM.enable')
  await b.S('CSS.enable')
  await wait(500)
  const { root } = await b.S('DOM.getDocument', { depth: -1 })
  const { nodeIds } = await b.S('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[class], [id]' })
  const hits = new Map()
  for (const nodeId of nodeIds) {
    let m; try { m = await b.S('CSS.getMatchedStylesForNode', { nodeId }) } catch { continue }
    for (const { rule } of m.matchedCSSRules ?? []) {
      if (rule.origin !== 'regular' && rule.origin !== 'injected') continue
      if (rule.styleSheetId && own.has(rule.styleSheetId)) continue
      // Hiding lists always use !important. A JS-injected widget sheet (the Sienna accessibility
      // widget's .asw-*) is foreign too but never !important; without this it reads as a hit.
      if (!/(display\s*:\s*none|clip-path|position\s*:\s*absolute|visibility\s*:\s*hidden)[^;]*!important/i.test(rule.style.cssText || '')) continue
      const { node } = await b.S('DOM.describeNode', { nodeId })
      const at = {}; for (let i = 0; i < (node.attributes ?? []).length; i += 2) at[node.attributes[i]] = node.attributes[i + 1]
      const name = `${node.localName}${at.id ? '#' + at.id : ''}${at.class ? '.' + at.class.split(/\s+/).join('.') : ''}`.slice(0, 90)
      hits.set(name, `{ ${rule.style.cssText.slice(0, 110)} }  origin:${rule.origin}`)
    }
  }
  console.log(`${hits.size ? 'FAIL' : 'ok  '} ${url}  ${nodeIds.length} elements, ${foreign.size} foreign sheet(s), ${hits.size} element(s) hit`)
  for (const [name, rule] of hits) console.log(`     ${name}  <-  ${rule}`)
  if (!foreign.size) console.log('     (no foreign sheet seen: this network may not be filtering, so a clean result proves less)')
  problems += hits.size
}
b.close()
console.log(`${problems} problem(s)`)
process.exitCode = problems ? 1 : 0
