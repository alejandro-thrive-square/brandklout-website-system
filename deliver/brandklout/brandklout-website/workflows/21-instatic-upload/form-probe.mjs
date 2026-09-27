/**
 * v11 (2026-09-14): do the published forms, the assessment, the legal pages and the players work?
 *
 * Every `form[data-lead-form]` (home, /market-opportunity, /authority-score) is filled and submitted
 * the way a visitor would. Its POST to FormSubmit (patches/assets/site.js.mjs -> sales@brandklout.com)
 * is CAPTURED AND ABORTED, so this probe never emails anyone: the CORS preflight is let through (it
 * carries no body) so that the real POST is formed and can be inspected. Because the POST is
 * aborted, the page must take its FAILURE path (the "could not be confirmed" status, the button
 * re-enabled): that proves Sang's handler ran with the patched endpoint.
 *
 * Also: the 21-question assessment scores as it is answered; the legal pages show brandklout.com's
 * text with bullets; a story's in-place player and the home video pop-up create their iframes with
 * no CSP error.
 *
 * Every other non-GET request is recorded and aborted. Instatic's own beacons (same host, random
 * 40+ character paths) are ignored.
 *
 * Usage: node form-probe.mjs > .tmp/form-probe.log 2>&1
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const BASE = (process.env.INSTATIC_BASE_URL || 'https://brandklout-production.up.railway.app').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })

async function open(route) {
  const page = await browser.newPage()
  const rec = { posts: [], other: [], errors: [], dialogs: [] }
  page.on('pageerror', (e) => rec.errors.push(e.message))
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && rec.errors.push(`${m.type()}: ${m.text()}`))
  page.on('dialog', async (d) => { rec.dialogs.push(d.message()); await d.dismiss() })
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    const url = r.url()
    if (r.method() === 'OPTIONS' && /^https:\/\/formsubmit\.co\//.test(url)) return r.continue()
    if (r.method() === 'POST' && /^https:\/\/formsubmit\.co\//.test(url)) {
      rec.posts.push({ url, contentType: r.headers()['content-type'], accept: r.headers().accept, body: r.postData() ?? '' })
      return r.abort()
    }
    if (r.method() !== 'GET' && r.method() !== 'HEAD') {
      if (!/\/[A-Za-z0-9_-]{40,}$/.test(url)) rec.other.push(`${r.method()} ${url}`)
      return r.abort()
    }
    r.continue()
  })
  await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 90000 })
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'))
  return { page, rec }
}

const FILL = {
  name: 'Form Probe (aborted, never sent)',
  email: 'probe@example.com',
  phone: '5555555555',
  practice: 'Probe Practice',
  website: 'https://example.com',
  market: 'Austin, TX',
  bottleneck: 'form probe: aborted in the browser, never sent',
}

const results = {}
for (const route of ['/', '/market-opportunity', '/authority-score']) {
  const { page, rec } = await open(route)
  const out = {}
  if (route === '/authority-score') {
    out.quizBefore = await page.evaluate(() => ({
      questions: document.querySelectorAll('[data-authority-quiz] .question[data-category]').length,
      radios: document.querySelectorAll('[data-authority-quiz] input[type="radio"]').length,
      progress: document.querySelector('[data-quiz-progress]')?.textContent,
      score: document.querySelector('[data-score]')?.textContent,
    }))
    // Yes on the even questions, No on the odd ones: 11 of 21 Yes.
    await page.evaluate(() => {
      document.querySelectorAll('[data-authority-quiz] .question[data-category]').forEach((q, i) => q.querySelectorAll('input[type="radio"]')[i % 2].click())
    })
    await wait(800)
    out.quizAfter = await page.evaluate(() => ({
      progress: document.querySelector('[data-quiz-progress]')?.textContent,
      score: document.querySelector('[data-score]')?.textContent,
      yes: document.querySelector('[data-yes-count]')?.textContent,
      state: document.querySelector('[data-score-state]')?.textContent,
      hiddenScore: document.querySelector('#assessment-lead-form [name="authority_score"]')?.value,
    }))
  }
  const form = 'form[data-lead-form]'
  out.fields = await page.evaluate((form) => [...document.querySelector(form).elements].filter((e) => e.name && e.type !== 'hidden').map((e) => `${e.name}${e.required ? '*' : ''}:${e.type}`), form)
  // An empty submit first: the browser's own `required` checks must stop it before any request.
  await page.click(`${form} [type="submit"]`)
  await wait(600)
  out.emptySubmitSent = rec.posts.length > 0
  for (const [name, value] of Object.entries(FILL)) {
    const el = await page.$(`${form} [name="${name}"]`)
    if (el) await el.type(value)
  }
  const selects = await page.$$eval(`${form} select`, (els) => els.map((s) => [s.name, [...s.options].find((o) => o.value)?.value ?? '']))
  for (const [name, value] of selects) await page.select(`${form} select[name="${name}"]`, value)
  await wait(500)
  await page.click(`${form} [type="submit"]`)
  await wait(3000)
  out.after = await page.evaluate((form) => {
    const f = document.querySelector(form)
    return {
      status: f.querySelector('[data-form-status]')?.textContent.trim(),
      statusIsError: f.querySelector('[data-form-status]')?.classList.contains('error'),
      successShown: f.querySelector('.success')?.classList.contains('show'),
      buttonEnabled: !f.querySelector('[type="submit"]').disabled,
    }
  }, form)
  const post = rec.posts[0]
  let body = null
  try { body = post ? JSON.parse(post.body) : null } catch { body = 'not JSON' }
  out.formsubmit = post
    ? { url: post.url, contentType: post.contentType, accept: post.accept, subject: body?._subject, template: body?._template, keys: body && typeof body === 'object' ? Object.keys(body) : body, q01: body?.Q01, categoryScores: body?.category_scores }
    : 'NO REQUEST to formsubmit.co: blocked by CSP, or the handler never sent'
  out.posts = rec.posts.length
  out.otherRequests = rec.other
  out.dialogs = rec.dialogs
  out.errors = rec.errors
  results[route] = out
  await page.close()
}
console.log(JSON.stringify({ forms: results }, null, 1))

const legal = {}
// v18: the legal pages are rows of the `legal` collection (pages.json `entries`: file -> /legal/<slug>).
const LEGAL_ROUTES = Object.values(JSON.parse(fs.readFileSync(new URL('./.tmp/site/site-src/pages.json', import.meta.url), 'utf8')).entries ?? {})
for (const route of LEGAL_ROUTES.length ? LEGAL_ROUTES : ['/privacy', '/terms', '/hipaa']) {
  const { page, rec } = await open(route)
  legal[route] = await page.evaluate(() => {
    const box = document.querySelector('.legal')
    const li = box?.querySelector('li')
    return {
      h1: document.querySelector('h1')?.textContent,
      first: box?.innerText.slice(0, 60),
      chars: box?.innerText.length ?? 0,
      h3: box?.querySelectorAll('h3').length ?? 0,
      bullets: li ? getComputedStyle(li).listStyleType : 'no list',
      // v18: the notice is a bound cell; the element is always there, hidden by `:empty` when blank
      draftNote: !!box?.querySelector('.legal-note')?.textContent.trim(),
    }
  })
  legal[route].errors = rec.errors
  await page.close()
}
console.log(JSON.stringify({ legal }, null, 1))

const video = {}
{
  const { page, rec } = await open('/customer-story-legacy-dental-pasadena')
  const play = await page.$('[data-story-play]')
  if (play) {
    await play.click()
    await wait(1500)
  }
  video.story = await page.evaluate(() => ({ iframe: document.querySelector('[data-story-player] iframe')?.src ?? null }))
  video.story.errors = rec.errors.filter((e) => /Content Security Policy|frame/i.test(e))
  await page.close()
}
{
  const { page, rec } = await open('/book')
  const link = await page.$('[data-video]')
  if (link) {
    await link.click()
    await wait(1500)
  }
  video.popup = await page.evaluate(() => ({ modal: !!document.querySelector('.bk-video-modal'), iframe: document.querySelector('.bk-video-modal iframe')?.src ?? null }))
  video.popup.errors = rec.errors.filter((e) => /Content Security Policy|frame/i.test(e))
  await page.close()
}
console.log(JSON.stringify({ video }, null, 1))
await browser.close()
