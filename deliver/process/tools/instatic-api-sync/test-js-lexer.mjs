// node test-js-lexer.mjs — the cases that broke a regex tokenizer on real bundles.
import assert from 'node:assert/strict'
import { jsStringSpans, mapJsStrings } from './js-lexer.mjs'

const strings = (js) => jsStringSpans(js).filter((s) => s.kind !== 'regex').map((s) => js.slice(s.start + 1, s.end - 1))
assert.deepEqual(strings(`var a="hasn't been called";b='.card'`), ["hasn't been called", '.card'])
assert.deepEqual(strings(`x=y/2/z;s='.wrap'`), ['.wrap'], 'division is not a regex')
assert.deepEqual(strings(`r=/['"]/g;s=".btn"`), ['.btn'], 'quotes inside a regex literal')
assert.deepEqual(strings(`if(a)return/'x'/.test(b);s='.ok'`), ['.ok'], 'regex after return')
assert.deepEqual(strings('// it\'s a comment\ns=".a" /* don\'t */ ;t=\'.b\''), ['.a', '.b'], 'comments')
assert.deepEqual(strings('q(`.card ${f("x")} .wrap`)'), ['.card ${f("x")} .wrap', 'x'], 'template with nested string')
assert.deepEqual(strings(`a='x\\'y';b="z"`), ["x\\'y", 'z'], 'escaped quote')

const js = `el.classList.add('btn');q("a .btn, .btn-x");s="hasn't .btn";r=/'/g;t='.btn'`
const out = mapJsStrings(js, (b) => b.replace(/\.btn(?![\w-])/g, '.button'))
assert.equal(out, `el.classList.add('btn');q("a .button, .btn-x");s="hasn't .button";r=/'/g;t='.button'`)
assert.equal(mapJsStrings(js, (b) => b), js, 'identity rewrite is byte-identical')

// regex literals are rewritten only when a regex function is given, flags kept
const rx = 'const re = /<span class="legal_num">([^<]+)<\\/span>/g; x = "legal_num"'
const rxOut = mapJsStrings(rx, (b) => b, (r) => r.replace('legal_num', 'legal_number'))
assert.equal(rxOut, 'const re = /<span class="legal_number">([^<]+)<\\/span>/g; x = "legal_num"')
assert.equal(mapJsStrings(rx, (b) => b, (r) => r), rx, 'identity regex rewrite is byte-identical')
console.log('js-lexer: all cases pass')
