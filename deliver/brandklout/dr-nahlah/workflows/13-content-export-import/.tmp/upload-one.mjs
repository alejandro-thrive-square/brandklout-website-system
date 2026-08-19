// Re-upload one asset whose CONTENT changed (same filename) and repoint the map.
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const name = process.argv[2];
const altText = process.argv[3] || '';
const file = path.join(SITE, 'assets', name);
const mapFile = path.join(HERE, 'instatic-media-map.json');
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
console.log('old ->', map[name]);
const r = await callJson('media_upload', { filename: name, data: fs.readFileSync(file).toString('base64'), altText });
const p = r.publicPath || r.media?.publicPath;
if (!p) throw new Error(JSON.stringify(r).slice(0, 300));
map[name] = p;
fs.writeFileSync(mapFile, JSON.stringify(map, null, 1));
console.log('new ->', p);
