// One-shot receiver: the WhatsApp Web tab opens this page and postMessages the catalogue JSON;
// the page POSTs it back here and the server writes it to argv[2].
import http from 'node:http';
import fs from 'node:fs';

const out = process.argv[2];
const port = Number(process.argv[3] || 47821);

const page = `<!doctype html><meta charset="utf-8"><title>alki receiver</title>
<body style="font:16px system-ui;padding:24px">waiting for data…<script>
addEventListener('message', async (e) => {
  if (e.origin !== 'https://web.whatsapp.com') return;
  document.body.textContent = 'received ' + e.data.length + ' chars, saving…';
  const r = await fetch('/save', { method: 'POST', body: e.data });
  const t = await r.text();
  document.body.textContent = t;
  if (e.source) e.source.postMessage('saved:' + t, e.origin);
});
if (window.opener) window.opener.postMessage('ready', 'https://web.whatsapp.com');
</script>`;

http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(page);
  }
  if (req.method === 'POST' && req.url === '/save') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(out, buf);
      res.end(`saved ${buf.length} bytes`);
      console.log(`saved ${buf.length} bytes to ${out}`);
      setTimeout(() => process.exit(0), 500);
    });
    return;
  }
  res.writeHead(404).end();
}).listen(port, '127.0.0.1', () => console.log(`listening on ${port}`));
