/**
 * Responsive QA captures — every page, every breakpoint.
 *
 * Separate from verify.mjs on purpose, and it needs the opposite instrument.
 * Screenshots are the right tool for layout and responsiveness; they are the
 * wrong one for animation, which is why nothing here asserts anything about
 * motion.
 *
 *   node qa-shots.mjs
 *
 * Output: workflows/08-qa/.tmp/screenshots/<page-slug>/<width>.png
 *
 * Traps this script exists to avoid:
 *  - ScrollSmoother breaks full-page captures, so every shot is taken in the
 *    reduced-motion pass, where no smoother is created and every chapter is
 *    already painted at its resolved state.
 *  - A full-page capture never scrolls, so loading="lazy" images below the
 *    fold never fetch and the shot shows empty frames. Forced eager, then
 *    awaited.
 *  - Cross-origin iframes (the location map) do not paint into
 *    captureBeyondViewport at all. That is a capture limitation, not a page
 *    bug — the map is proven by its load event in verify.mjs instead.
 *  - Never pipe this through `head`: SIGPIPE truncates the run mid-way and
 *    leaves half the breakpoints uncaptured with a zero exit code.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
const OUT = resolve(ROOT, '../../08-qa/.tmp/screenshots')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 8932
const CDP_PORT = 9332

/* Paid dental traffic is mostly mobile, so 360 and 390 matter more than 1920 —
   but a page that only works on a phone is not finished either. */
const WIDTHS = [360, 390, 768, 1024, 1440, 1920]
const SLUGS = ['implant-landing-page', 'cosmetic-landing-page', 'thank-you-landing-page']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0])
      const path = join(ROOT, url.endsWith('/') ? `${url}index.html` : url)
      const body = await readFile(path)
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((ok) => server.listen(PORT, () => ok(server)))
}

async function connect() {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--user-data-dir=' + join(tmpdir(), 'gmd-qa-chrome'),
      '--window-size=1440,1000',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let target
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!target) throw new Error('Chrome did not expose a page target')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok, { once: true })
    ws.addEventListener('error', fail, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result)
    }
  })
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const msgId = ++id
      pending.set(msgId, { ok, fail })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  return { send, chrome, ws }
}

const evaluate = async (send, expression) => {
  const { result } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  return result.value
}

const server = await serve()
const { send, chrome, ws } = await connect()
const report = []

try {
  for (const slug of SLUGS) {
    await mkdir(join(OUT, slug), { recursive: true })
    for (const width of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 800,
      })
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${slug}/index.html` })
      await new Promise((r) => setTimeout(r, 2600))

      const info = await evaluate(
        send,
        `(async () => {
           const deadline = Date.now() + 12000;
           while (document.readyState !== 'complete' && Date.now() < deadline) {
             await new Promise(r => setTimeout(r, 120));
           }
           document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]')
             .forEach(i => { i.loading = 'eager'; });
           const imgs = [...document.images].filter(i => (i.getAttribute('src') || '').trim() !== '');
           await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
           if (document.fonts && document.fonts.ready) await document.fonts.ready;
           // A page that scrolls sideways on a phone is broken, and it is
           // invisible in a desktop-only check — record it next to the shot.
           return {
             scrollWidth: document.documentElement.scrollWidth,
             inner: window.innerWidth,
             height: document.body.scrollHeight,
           };
         })()`
      )
      await new Promise((r) => setTimeout(r, 1400))

      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
      })
      const file = join(OUT, slug, `${width}.png`)
      await writeFile(file, Buffer.from(data, 'base64'))

      const overflow = info.scrollWidth > info.inner
      report.push({ slug, width, ...info, overflow, bytes: Buffer.from(data, 'base64').length })
      console.log(
        `  ${slug.padEnd(24)} ${String(width).padStart(4)}px  ` +
          `${String(info.height).padStart(6)}px tall  ` +
          `${overflow ? `OVERFLOW ${info.scrollWidth}>${info.inner}` : 'no overflow'}`
      )
    }
  }
} finally {
  ws.close()
  chrome.kill()
  server.close()
}

const bad = report.filter((r) => r.overflow)
console.log(`\n${report.length} captures written to ${OUT}`)
console.log(bad.length ? `${bad.length} with horizontal overflow` : 'no horizontal overflow at any breakpoint')
process.exit(bad.length ? 1 : 0)
