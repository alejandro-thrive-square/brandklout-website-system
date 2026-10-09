/**
 * Spans of the string literals in a JavaScript text: [{ start, end, quote, body }], body being the
 * text between the quotes (template expressions included verbatim). A small lexer, not a regex:
 * it skips comments and regex literals and follows template literals with `${}` nesting, so a
 * minified bundle (an apostrophe inside a double-quoted string, `/'/g`, `a/b/c`) cannot throw it
 * out of sync. Used by class-audit (what scripts reference) and class-rename (what to rewrite).
 */
export function jsStringSpans(js) {
  const spans = []
  const n = js.length
  let i = 0
  let prev = ''
  let prevWord = ''
  const KEYWORDS = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/
  const regexAllowed = () => !prev || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || KEYWORDS.test(prevWord)

  function readString(q) {
    const start = i
    i++
    let body = ''
    while (i < n) {
      const c = js[i]
      if (c === '\\') {
        body += c + (js[i + 1] ?? '')
        i += 2
        continue
      }
      if (q === '`' && c === '$' && js[i + 1] === '{') {
        body += '${'
        i += 2
        let depth = 1
        while (i < n && depth) {
          const d = js[i]
          if (d === '"' || d === "'" || d === '`') {
            const s0 = i
            readString(d)
            body += js.slice(s0, i)
            continue
          }
          if (d === '{') depth++
          else if (d === '}') depth--
          if (depth) body += d
          i++
        }
        body += '}'
        continue
      }
      if (c === q) {
        i++
        break
      }
      if (q !== '`' && c === '\n') break
      body += c
      i++
    }
    spans.push({ start, end: i, quote: q, body })
  }

  while (i < n) {
    const c = js[i]
    if (c === '/' && js[i + 1] === '/') {
      const e = js.indexOf('\n', i)
      i = e === -1 ? n : e
      continue
    }
    if (c === '/' && js[i + 1] === '*') {
      const e = js.indexOf('*/', i + 2)
      i = e === -1 ? n : e + 2
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      readString(c)
      prev = 'a'
      prevWord = ''
      continue
    }
    if (c === '/' && regexAllowed()) {
      const rStart = i
      i++
      let inClass = false
      while (i < n) {
        const d = js[i]
        if (d === '\\') {
          i += 2
          continue
        }
        if (d === '[') inClass = true
        else if (d === ']') inClass = false
        else if (d === '/' && !inClass) {
          i++
          break
        } else if (d === '\n') break
        i++
      }
      const bodyEnd = i // just past the closing slash
      while (i < n && /[a-z]/i.test(js[i])) i++
      spans.push({ start: rStart, end: bodyEnd, quote: '/', kind: 'regex', body: js.slice(rStart + 1, bodyEnd - 1) })
      prev = 'a'
      prevWord = ''
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (/[\w$]/.test(c)) {
      let j = i
      while (j < n && /[\w$]/.test(js[j])) j++
      prevWord = js.slice(i, j)
      prev = 'a'
      i = j
      continue
    }
    prev = c
    prevWord = ''
    i++
  }
  return spans.sort((a, b) => a.start - b.start)
}

/**
 * Rewrite each string literal's body with fn(body, context-before), and each regex literal's body
 * with regexFn(body) when given (a build script that parses its own HTML with
 * `/class="legal_num"/` must be renamed with the HTML it reads: Stone Med Spa, 2026-10-05).
 */
export function mapJsStrings(js, fn, regexFn = null) {
  // Only top-level spans: nested template-literal strings are part of their parent's body.
  const spans = jsStringSpans(js).filter((s) => s.kind !== 'regex' || regexFn)
  const top = []
  let end = -1
  for (const s of spans) if (s.start >= end) { top.push(s); end = s.end }
  let out = ''
  let at = 0
  for (const s of top) {
    out += js.slice(at, s.start)
    const closed = js[s.end - 1] === s.quote && s.end - s.start >= 2
    const body = js.slice(s.start + 1, closed ? s.end - 1 : s.end)
    const next = s.kind === 'regex' ? regexFn(body) : fn(body, js.slice(Math.max(0, s.start - 60), s.start))
    out += s.quote + next + (closed ? s.quote : '')
    at = s.end
  }
  return out + js.slice(at)
}
