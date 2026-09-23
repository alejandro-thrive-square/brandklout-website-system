import fs from 'node:fs';
import { callTool } from './instatic-mcp.mjs';
const out = process.argv[2] || 'snap-try';
for (let i = 0; i < 6; i++) {
  const { raw, text } = await callTool('site_render_snapshot', {});
  const imgs = (raw.content || []).filter((c) => c.type === 'image');
  console.log(`try ${i + 1}: types=${(raw.content||[]).map(c=>c.type).join(',')} err=${!!raw.isError} text=${(text||'').slice(0,120)}`);
  if (imgs.length) {
    imgs.forEach((c, n) => fs.writeFileSync(`${out}${n?'-'+n:''}.png`, Buffer.from(c.data, 'base64')));
    fs.writeFileSync(`${out}.json`, text || '');
    console.log('saved', imgs.length, 'image(s)');
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 3000));
}
process.exit(1);
