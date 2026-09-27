const fs = require('fs')
;(async () => {
  for (const [host, want] of [['https://livewelldentalva.webflow.io', 'after'], ['https://www.livewelldentalva.com', 'before']]) {
    const html = await (await fetch(host + '/contact-us?v=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
    const head = fs.readFileSync(want === 'after' ? 'after/head.html' : 'before-head.html', 'utf8')
    const foot = fs.readFileSync(want === 'after' ? 'after/footer.html' : 'before-footer.html', 'utf8')
    console.log(host, 'expects', want, '| head verbatim:', html.includes(head), '| footer verbatim:', html.includes(foot), '| bridge tag:', (html.match(/brandkloutconsentbridge-[\d.]+\.js/) || ['none'])[0])
  }
})()
