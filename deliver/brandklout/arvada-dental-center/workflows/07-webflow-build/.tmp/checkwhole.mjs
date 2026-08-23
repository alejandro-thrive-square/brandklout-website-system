import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const base = '.tmp/payload';
for (const page of readdirSync(base).filter(p => { try { return statSync(join(base,p)).isDirectory(); } catch { return false; } })) {
  const f = join(base, page, 'whole', 'paste_00_full-page.html');
  let h; try { h = readFileSync(f, 'utf8'); } catch { continue; }
  const m = h.match(/<script[^>]*id="payload"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) { console.log(page, 'payload element not found'); continue; }
  const raw = m[1].replaceAll('<\/', '</').trim();
  let p; try { p = JSON.parse(raw); } catch (e) { console.log(page, 'parse fail', e.message.slice(0,90)); continue; }
  const pay = p.payload || p;
  const child = new Set();
  for (const n of pay.nodes) for (const c of (n.children || [])) child.add(c);
  const roots = pay.nodes.filter(n => !child.has(n._id));
  const emb = pay.nodes.filter(n => n.type === 'HtmlEmbed').length;
  const styled = pay.styles.filter(s => (s.styleLess||'').trim() && !s.name.endsWith('-br-line'));
  writeFileSync(join(base, page, 'whole', 'payload.json'), JSON.stringify(p));
  console.log(`${page.padEnd(17)} roots=${roots.length} [${roots.map(r=>r.type).join(',')}] nodes=${pay.nodes.length} embeds=${emb} styles=${pay.styles.length} nonEmpty=${styled.length} kb=${Math.round(raw.length/1024)}`);
  if (styled.length) console.log('    nonEmpty:', styled.map(s=>s.name).slice(0,8).join(', '));
}
