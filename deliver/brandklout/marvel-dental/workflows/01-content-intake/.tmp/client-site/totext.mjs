import { readFile, writeFile, readdir } from 'node:fs/promises'
const files = (await readdir('.')).filter(f => f.endsWith('.html'))
for (const f of files) {
  let h = await readFile(f, 'utf8')
  h = h.replace(/<!--[\s\S]*?-->/g, '')
  h = h.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  h = h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|section|tr)>/gi, '\n')
  h = h.replace(/<[^>]+>/g, ' ')
  h = h.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, "'")
  h = h.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n')
  h = h.replace(/\n{3,}/g, '\n\n')
  await writeFile(f.replace(/\.html$/, '.txt'), h)
  console.log(String(h.length).padStart(7), f.replace(/\.html$/, '.txt'))
}
