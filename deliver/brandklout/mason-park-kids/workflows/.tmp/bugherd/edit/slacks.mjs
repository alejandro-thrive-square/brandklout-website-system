// BugHerd #28: the reviewer's edit ("the woman in the background has black slacks") never arrived.
// Ask an image-edit model for the same change, then paste back ONLY the trousers (see composite.py).
// node slacks.mjs <in.jpg> <out.jpg> [endpoint]  > log   (never pipe)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const env = fs.readFileSync(path.join(os.homedir(), '.webzite', '.env'), 'utf8');
const key = env.match(/^MAGNIFIC\s*=\s*"?([^"\r\n]+)"?/m)[1];
const [inp, out, ep = 'gemini-2-5-flash-image-preview'] = process.argv.slice(2);
const b64 = fs.readFileSync(inp).toString('base64');
const prompt = 'Edit this photo: change only the floral patterned trousers/leggings of the adult woman standing in the background to plain solid black slacks. Keep everything else exactly the same: the child, her hair, face, clothing, the gumball machine, the bag, hands, lighting, framing and composition. Photorealistic, no text.';
const H = { 'x-freepik-api-key': key, 'Content-Type': 'application/json' };
const bodies = {
  'gemini-2-5-flash-image-preview': { prompt, reference_images: [b64] },
  'text-to-image/seedream-v4-edit': { prompt, reference_images: [b64] },
};
const url = `https://api.freepik.com/v1/ai/${ep}`;
let r, j;
for (let i = 0; i < 3; i++) { r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(bodies[ep]) }); j = await r.json().catch(() => ({})); if (r.status < 500) break; }
console.log('create', r.status, JSON.stringify(j).slice(0, 300));
const id = j?.data?.task_id; if (!id) process.exit(1);
for (let i = 0; i < 90; i++) {
  await new Promise(s => setTimeout(s, 4000));
  const g = await (await fetch(`${url}/${id}`, { headers: H })).json();
  const st = g?.data?.status; if (i % 5 === 0) console.log('status', st);
  if (st === 'COMPLETED') { const u = g.data.generated[0]; const b = Buffer.from(await (await fetch(u)).arrayBuffer()); fs.writeFileSync(out, b); console.log('saved', out, b.length); process.exit(0); }
  if (st === 'FAILED') { console.log(JSON.stringify(g).slice(0, 400)); process.exit(1); }
}
console.log('timeout');
