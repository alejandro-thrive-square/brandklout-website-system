import { writeFile } from 'node:fs/promises'
const BASE = 'https://www.marveldentaldds.com'
const paths = ['/', '/services/dental-emergency', '/about-us', '/contact-us', '/patient-stories',
  '/elmwood-park-dentist', '/montclair-dentist', '/about-anna-gazu', '/services/tooth-extraction',
  '/services/root-canal-therapy', '/dental-implants-offer', '/office-tour']
for (const p of paths) {
  const r = await fetch(BASE + p, { headers: { 'user-agent': 'Mozilla/5.0 webzite-intake' } })
  const html = await r.text()
  const name = (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '__')) + '.html'
  await writeFile(name, html)
  console.log(r.status, String(html.length).padStart(7), name)
}
