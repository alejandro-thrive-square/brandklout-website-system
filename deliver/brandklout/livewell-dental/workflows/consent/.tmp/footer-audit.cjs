// Every staging page: does it carry the Consent Preferences link, and a footer at all?
;(async () => {
  const base = 'https://livewelldentalva.webflow.io'
  const map = await (await fetch(base + '/sitemap.xml?v=' + Date.now())).text()
  let urls = [...map.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => base + new URL(m[1]).pathname)
  if (!urls.length) urls = [base + '/']
  const out = { withLink: 0, missing: [] }
  for (const u of urls) {
    const h = await (await fetch(u + '?v=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
    const link = /<a[^>]*href="#consent-preferences"[^>]*>Consent Preferences<\/a>/.test(h)
    if (link) out.withLink++
    else out.missing.push(new URL(u).pathname + (h.includes('footer-bottom') ? ' (has footer!)' : ' (no main footer)'))
  }
  console.log(JSON.stringify({ pages: urls.length, ...out }, null, 1))
  const sample = await (await fetch(base + '/contact-us?v=' + Date.now())).text()
  console.log(sample.match(/<div class="wrapper-legal-pages">.*?<\/div>/)?.[0])
})()
