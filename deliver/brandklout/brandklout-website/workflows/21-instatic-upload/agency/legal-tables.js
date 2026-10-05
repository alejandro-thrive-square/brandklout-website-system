/* ---- legal-tables.js, appended by push-site.mjs (agency, 2026-10-05) ----
   Instatic 0.0.20 publishes a collection body through a sanitizer with no table tags, so a markdown
   table typed in the editor reaches the live page as bare text with its header row gone
   (21-instatic-upload.md, "A collection body loses its tables"). A code block is kept verbatim, so
   editors write the table INSIDE a code block, in plain markdown table syntax:

     | Category | Examples |
     | --- | --- |
     | Identifiers | Name, email |

   and this turns every <pre> shaped like that (every line starts with "|", the second line is the
   "| --- |" separator) into a real <table>. Any other code block is left alone. Cells are text;
   **bold** is honoured and "\|" is a literal pipe. At 767px and below each row stacks into a card
   with the column names as labels. The CSS lives here, not in the registry: the registry only keeps
   rules it can bind to imported markup, and this table exists only at runtime. */
(function () {
  var SEP = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/
  var CSS =
    '.bk-table-wrap{margin-top:1.25rem;overflow-x:auto}' +
    '.bk-table{width:100%;border-collapse:collapse;font-size:.875rem;line-height:1.5;text-align:left}' +
    '.bk-table th,.bk-table td{padding:.75rem;border:1px solid #e3e7eb;vertical-align:top;text-align:left}' +
    '.bk-table thead th{background-color:#f3f5f7;color:#0f1b2a;font-weight:600}' +
    '.bk-table tbody th{color:#0f1b2a;font-weight:600}' +
    '.bk-table-label{display:none}' +
    '@media (max-width:767px){' +
    '.bk-table,.bk-table tbody,.bk-table tr,.bk-table th,.bk-table td{display:block;width:100%}' +
    '.bk-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '.bk-table tr{margin-top:1rem;border:1px solid #e3e7eb;border-radius:.5rem;overflow:hidden}' +
    '.bk-table th,.bk-table td{border:0;border-top:1px solid #e3e7eb}' +
    '.bk-table tr>:first-child{border-top:0}' +
    '.bk-table tbody th{background-color:#f3f5f7}' +
    '.bk-table-label{display:block;font-weight:600;color:#0f1b2a}' +
    '}'

  function split(line) {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/(^|[^\\])\|$/, '$1')
      .split(/(?<!\\)\|/)
      .map(function (c) { return c.trim().replace(/\\\|/g, '|') })
  }
  function text(el, s) {
    s.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return
      var m = part.match(/^\*\*([^*]+)\*\*$/)
      if (m) {
        var b = document.createElement('strong')
        b.textContent = m[1]
        el.appendChild(b)
      } else el.appendChild(document.createTextNode(part))
    })
  }
  function cell(tag, role, value) {
    var c = document.createElement(tag)
    c.setAttribute('role', role)
    text(c, value)
    return c
  }
  function convert(pre) {
    var lines = pre.textContent.split('\n').map(function (l) { return l.trim() }).filter(Boolean)
    if (lines.length < 3 || !SEP.test(lines[1])) return false
    for (var i = 0; i < lines.length; i++) if (lines[i].charAt(0) !== '|') return false
    var head = split(lines[0])
    var labels = head.map(function (h) { return h.replace(/\*\*/g, '') })
    var table = document.createElement('table')
    table.className = 'bk-table'
    table.setAttribute('role', 'table')
    var thead = table.appendChild(document.createElement('thead'))
    thead.setAttribute('role', 'rowgroup')
    var hr = thead.appendChild(document.createElement('tr'))
    hr.setAttribute('role', 'row')
    head.forEach(function (h) {
      var th = hr.appendChild(cell('th', 'columnheader', h))
      th.setAttribute('scope', 'col')
    })
    var tbody = table.appendChild(document.createElement('tbody'))
    tbody.setAttribute('role', 'rowgroup')
    lines.slice(2).forEach(function (line) {
      var tr = tbody.appendChild(document.createElement('tr'))
      tr.setAttribute('role', 'row')
      split(line).forEach(function (v, k) {
        if (k >= head.length) return
        var c = k === 0 ? cell('th', 'rowheader', v) : cell('td', 'cell', v)
        if (k === 0) c.setAttribute('scope', 'row')
        else if (labels[k]) {
          var l = document.createElement('span')
          l.className = 'bk-table-label'
          l.setAttribute('aria-hidden', 'true')
          l.textContent = labels[k]
          c.insertBefore(l, c.firstChild)
        }
        tr.appendChild(c)
      })
    })
    var wrap = document.createElement('div')
    wrap.className = 'bk-table-wrap'
    wrap.appendChild(table)
    pre.replaceWith(wrap)
    return true
  }
  function run() {
    var done = 0
    document.querySelectorAll('pre').forEach(function (pre) { if (convert(pre)) done++ })
    if (done && !document.getElementById('bk-table-css')) {
      var s = document.createElement('style')
      s.id = 'bk-table-css'
      s.textContent = CSS
      document.head.appendChild(s)
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
  else run()
})();
