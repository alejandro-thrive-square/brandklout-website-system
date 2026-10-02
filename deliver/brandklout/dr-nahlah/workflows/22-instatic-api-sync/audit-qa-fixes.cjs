#!/usr/bin/env node
/**
 * audit-qa-fixes.cjs — re-measure QA's 2026-09-28 findings on every sitemap page,
 * rendered in Chrome (scripts run, the way QA's tool reads a page).
 *
 *   node audit-qa-fixes.cjs [host]      # default https://www.drnahlah.com
 *
 * Per page: one h1 and no skipped heading level (D03); title <= 60 and description
 * <= 160 and unique (C04); og:image is 1200x630 (C06, by the -og- upload name);
 * apple-touch-icon declared (D02); no Cloudflare beacon (F08); no British spelling,
 * no [shortcode], no "maclean" link, no "%25"; every maps link is maps/dir (C03).
 * Prints only failures, then a summary.
 */
const puppeteer = require('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/puppeteer-core')
const HOST = process.argv[2] || 'https://www.drnahlah.com'
const BRIT = /\b(practis(e|ing|ed)|anaesth\w*|colou?r(?<=colour)\w*|colour\w*|discolou\w*|millimetre|moulded|programme|enquir\w*)\b/i
;(async () => {
  const sm = await (await fetch(HOST.replace('staging.', 'www.') + '/sitemap.xml')).text()
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://www.drnahlah.com', HOST))
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
  const out = []
  const work = urls.slice()
  async function worker() {
    const p = await b.newPage()
    await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36')
    while (work.length) {
      const u = work.shift()
      try {
        await p.goto(u, { waitUntil: 'load', timeout: 90000 })
        await new Promise((r) => setTimeout(r, 1500))
        out.push({ u, ...(await p.evaluate((BRITsrc) => {
          const BRIT = new RegExp(BRITsrc, 'i')
          const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('[inert],[aria-hidden="true"]')).map((h) => +h.tagName[1])
          let skip = null; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { skip = `h${hs[i - 1]}->h${hs[i]}`; break }
          const text = document.body.innerText
          const meta = (s) => document.querySelector(s)?.getAttribute('content') ?? ''
          return {
            h1: hs.filter((x) => x === 1).length, skip,
            title: document.title, desc: meta('meta[name="description"]'), ogImage: meta('meta[property="og:image"]'),
            touch: !!document.querySelector('link[rel="apple-touch-icon"]'),
            beacon: !!document.querySelector('script[src*="cloudflareinsights"]'),
            brit: (text.match(BRIT) || [null])[0], shortcode: /\[contact-form-7/.test(text), pct: text.includes('%25'),
            maclean: [...document.querySelectorAll('a[href*="maclean"]')].length,
            search: [...document.querySelectorAll('a[href*="maps/search"]')].length,
          }
        }, BRIT.source)) })
      } catch (e) { out.push({ u, err: e.message.slice(0, 80) }) }
    }
    await p.close()
  }
  await Promise.all([worker(), worker(), worker(), worker()])
  await b.close()
  const descs = {}
  for (const r of out) if (r.desc) (descs[r.desc] ||= []).push(r.u)
  let bad = 0
  for (const r of out.sort((a, c) => a.u.localeCompare(c.u))) {
    const f = []
    if (r.err) f.push(r.err)
    else {
      if (r.h1 !== 1) f.push(`h1 x${r.h1}`)
      if (r.skip) f.push(`skip ${r.skip}`)
      if (r.title.length > 60) f.push(`title ${r.title.length}`)
      if (!r.desc || r.desc.length > 160) f.push(`desc ${r.desc.length}`)
      if (descs[r.desc]?.length > 1) f.push('desc shared')
      if (!/-og-[\w-]+\.jpg$/.test(r.ogImage)) f.push(`og:image ${r.ogImage.split('/').pop()}`)
      if (!r.touch) f.push('no apple-touch-icon')
      if (r.beacon) f.push('cf beacon')
      if (r.brit) f.push(`british "${r.brit}"`)
      if (r.shortcode) f.push('shortcode')
      if (r.pct) f.push('%25')
      if (r.maclean) f.push(`${r.maclean} maclean link(s)`)
      if (r.search) f.push(`${r.search} maps/search link(s)`)
    }
    if (f.length) { bad++; console.log(`${r.u.replace(HOST, '') || '/'}  ${f.join('; ')}`) }
  }
  console.log(`\n${out.length} pages, ${out.length - bad} clean, ${bad} with findings`)
})()
