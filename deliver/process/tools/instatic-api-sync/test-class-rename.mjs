// node test-class-rename.mjs — class-rename --files on a fixture with every case found on real sites.
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'class-rename-'))
mkdirSync(join(dir, 'src'))
const map = {
  rename: { 'rv-card': 'review_card', 'ch-arrival': 'section_arrival', 'legal_num': 'legal_number', 'result': 'bar-track_result', '.p1': 'text-size-large', 'btn': 'button', 'x-unused': 'y-unused' },
  merge: { 'heading-31': 'heading-43' },
}
// heading-43 is itself renamed in the same map: the merge must follow it to its new name
map.rename['heading-43'] = 'heading-style-display'
// folders expand from the files when there is no live site (a build before launch)
map.folders = { tl: 'timeline' }
writeFileSync(join(dir, 'map.json'), JSON.stringify(map))

writeFileSync(join(dir, 'src', 'a.html'),
  '<div class="rv-card btn"><p class=".p1 heading-31">x</p><a class="btn-ghost">y</a></div>\n' +
  '<style>.rv-card:hover .btn{color:red} .\\.p1{font-size:2rem}</style>\n' +
  '<script>document.querySelector(".rv-card").classList.add("btn")</script>\n')
writeFileSync(join(dir, 'src', 'b.css'), '.rv-card, .ch-arrival > .btn::after {x:1}\n.btn-ghost{y:2}\n@media (max-width:767px){.legal_num{z:3}}\n.tl_stop .tl_spine-fill{w:1}\n')
writeFileSync(join(dir, 'src', 'c.js', ), [
  `WZ.section("ch-arrival", function(){})`,
  `WZ.dom('rv-card', '.rv-card', fn)`,
  `chart.querySelector('.grow-bar.result'); q('div.rv-card > img.result')`,
  `const re = /<span class="legal_num">([^<]+)<\\/span>/g`,
  `load('file.min.js'); obj.result = 1; x = "result"`,
  `el.className = 'rv-card is-open'`,
  `s = "hasn't .btn"`,
].join('\n'))

const r = spawnSync(process.execPath, [join(HERE, 'class-rename.mjs'), '--files', join(dir, 'src'), '--map', join(dir, 'map.json'), '--apply'], { encoding: 'utf8' })
assert.equal(r.status, 0, r.stderr + r.stdout)
const html = readFileSync(join(dir, 'src', 'a.html'), 'utf8')
const css = readFileSync(join(dir, 'src', 'b.css'), 'utf8')
const js = readFileSync(join(dir, 'src', 'c.js'), 'utf8')

assert.match(html, /class="review_card button"/)
assert.match(html, /class="text-size-large heading-style-display"/, 'dotted name + merge into a renamed target')
assert.match(html, /class="btn-ghost"/, 'btn-ghost is not btn')
assert.match(html, /\.review_card:hover \.button\{/)
assert.match(html, /\.text-size-large\{font-size/, 'escaped .\\.p1 selector')
assert.match(html, /querySelector\("\.review_card"\)\.classList\.add\("button"\)/)
assert.match(css, /\.review_card, \.section_arrival > \.button::after/)
assert.match(css, /\.btn-ghost\{/)
assert.match(css, /\.legal_number\{z:3\}/)
assert.match(css, /\.timeline_stop \.timeline_spine-fill\{w:1\}/, 'folder rename expanded from the files')
assert.match(js, /WZ\.section\("section_arrival"/, 'house kit first argument')
assert.match(js, /WZ\.dom\('review_card', '\.review_card'/)
assert.match(js, /'\.grow-bar\.bar-track_result'/, 'second class of a chain')
assert.match(js, /div\.review_card > img\.bar-track_result/, 'tag-qualified selectors')
assert.match(js, /class="legal_number"/, 'regex literal')
assert.match(js, /'file\.min\.js'/)
assert.match(js, /obj\.result = 1/, 'property access untouched')
assert.match(js, /x = "result"/, 'bare word outside a class context untouched (listed for review)')
assert.match(js, /className = 'review_card is-open'/)
assert.match(js, /"hasn't \.button"/)
console.log('class-rename: all cases pass')
