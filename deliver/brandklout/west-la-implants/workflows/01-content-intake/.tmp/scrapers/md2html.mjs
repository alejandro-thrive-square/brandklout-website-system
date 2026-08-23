// Minimal markdown -> HTML for the research package. Handles the subset these
// documents actually use: headings, tables, fenced code, blockquotes, lists,
// bold/inline-code/links, and thematic breaks.
import { readFileSync, writeFileSync } from 'node:fs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  let s = esc(text);
  // code spans first, protected from further processing
  const spans = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${spans.push(`<code>${c}</code>`) - 1}\u0000`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
    /^https?:/.test(href) ? `<a href="${href}">${label}</a>` : label);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => spans[Number(i)]);
  return s;
}

function slug(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function render(md, headings) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const txt = inline(h[2]);
      const id = slug(h[2]);
      if (lvl <= 2 && headings) headings.push({ lvl, id, txt });
      out.push(`<h${lvl} id="${id}">${txt}</h${lvl}>`);
      i++;
      continue;
    }

    // table
    if (/^\|/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      const aligns = cells(lines[i + 1]).map((a) =>
        a.endsWith(':') && a.startsWith(':') ? 'center' : a.endsWith(':') ? 'right' : 'left');
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push('<div class="tw"><table><thead><tr>' +
        head.map((c, n) => `<th style="text-align:${aligns[n] || 'left'}">${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c, n) =>
          `<td style="text-align:${aligns[n] || 'left'}">${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${render(buf.join('\n'), null)}</blockquote>`);
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!m) {
          // continuation line of the previous item
          if (items.length && /^\s+\S/.test(lines[i])) { items[items.length - 1] += ' ' + lines[i].trim(); i++; continue; }
          break;
        }
        items.push(m[3]);
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>` + items.map((t) => `<li>${inline(t)}</li>`).join('') + `</${tag}>`);
      continue;
    }

    if (!line.trim()) { i++; continue; }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\||>|```|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// CLI: node md2html.mjs out.html "Title" file1.md::Label1 file2.md::Label2 ...
const [outPath, title, ...specs] = process.argv.slice(2);
const sections = specs.map((s) => {
  const [file, label] = s.split('::');
  const headings = [];
  const body = render(readFileSync(file, 'utf8'), headings);
  return { label, body, headings, id: slug(label) };
});

const toc = sections.map((s) =>
  `<li><a href="#${s.id}">${s.label}</a><ul>` +
  s.headings.filter((h) => h.lvl === 2).map((h) => `<li><a href="#${h.id}">${h.txt}</a></li>`).join('') +
  '</ul></li>').join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
:root{--ink:#16181d;--mut:#5c6370;--line:#e3e6ea;--bg:#fff;--accent:#0a5ad4;--soft:#f6f7f9}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:48px 28px 96px}
h1{font-size:2rem;line-height:1.2;margin:0 0 .4em;letter-spacing:-.02em}
h2{font-size:1.35rem;margin:2.4em 0 .6em;padding-top:.6em;border-top:1px solid var(--line);letter-spacing:-.01em}
h3{font-size:1.08rem;margin:1.8em 0 .5em}
h4{font-size:1rem;margin:1.4em 0 .4em;color:var(--mut)}
p{margin:.7em 0}
a{color:var(--accent)}
code{background:var(--soft);padding:.12em .35em;border-radius:4px;font:.86em/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-word}
pre{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:14px 16px;overflow-x:auto}
pre code{background:none;padding:0;font-size:.82rem;line-height:1.55}
blockquote{margin:1.2em 0;padding:.2em 0 .2em 18px;border-left:3px solid var(--accent);color:var(--mut)}
blockquote p{margin:.4em 0}
.tw{overflow-x:auto;margin:1.1em 0;border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{padding:9px 13px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--soft);font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:none}
ul,ol{margin:.7em 0;padding-left:1.3em}
li{margin:.3em 0}
hr{border:none;border-top:1px solid var(--line);margin:2em 0}
.doc{margin-top:64px}
.toc{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:18px 24px;margin:28px 0 0}
.toc h2{margin:0 0 .4em;border:none;padding:0;font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}
.toc ul{margin:.3em 0;padding-left:1.1em;font-size:.92rem}
.toc>ul>li{margin:.5em 0;font-weight:600}
.toc ul ul{font-weight:400}
.lede{color:var(--mut);font-size:1.02rem;margin-top:0}
@media print{.toc{break-inside:avoid}h2{break-after:avoid}}
</style></head><body><div class="wrap">
<h1>${title}</h1>
<p class="lede">Prepared for Brandklout. Crawl date 2026-08-20, package built 2026-08-21.</p>
<nav class="toc"><h2>Contents</h2><ul>${toc}</ul></nav>
${sections.map((s) => `<section class="doc" id="${s.id}">${s.body}</section>`).join('\n')}
</div></body></html>`;

writeFileSync(outPath, html);
console.log('wrote', outPath, html.length, 'bytes');
