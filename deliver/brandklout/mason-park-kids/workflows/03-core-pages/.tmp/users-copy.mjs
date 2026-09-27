// Copy production's non-owner users (with their password hashes) into staging's database.
// Hashes travel base64 inside a base64-wrapped bun script; nothing is printed but emails.
//   node users-copy.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { PROJECT, PRODUCTION, STAGING, SERVICE } from './railway-ssh.mjs';
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^RAILWAY_(API_)?TOKEN$/.test(k)));
const run = (e, js) => {
  const b = Buffer.from(js).toString('base64');
  return execFileSync('bash', ['-c', `railway ssh -p ${PROJECT} -e ${e} -s ${SERVICE} 'sh -c "echo ${b} | base64 -d > /tmp/q.js && cd /app && bun /tmp/q.js"'`], { encoding: 'utf8', env, maxBuffer: 64 << 20 }).split('\n').filter(l => !l.startsWith('Using SSH')).join('\n').trim();
};
const DB = `const { Database } = require('bun:sqlite'); const fs = require('fs');
const f = ['/app/storage/cms.db', '/app/storage/data/cms.db'].find(p => fs.existsSync(p)); const db = new Database(f);`;
const tbl = run(PRODUCTION, `${DB} console.log(JSON.stringify(db.query("select name from sqlite_master where type='table' and name like '%user%'").all()))`);
console.log('tables', tbl);
const out = run(PRODUCTION, `${DB} const rows = db.query("select * from users where email in ('gage@thrivesquare.com','jessica@thrivesquare.com')").all(); console.log(Buffer.from(JSON.stringify(rows)).toString('base64'))`);
const rows = JSON.parse(Buffer.from(out.split('\n').pop(), 'base64').toString());
console.log('from production:', rows.map(r => r.email), 'columns:', Object.keys(rows[0] || {}).join(','));
fs.writeFileSync('.users-tmp.b64', Buffer.from(JSON.stringify(rows)).toString('base64'));
const payload = fs.readFileSync('.users-tmp.b64', 'utf8');
const res = run(STAGING, `${DB} const rows = JSON.parse(Buffer.from('${payload}', 'base64').toString());
const cols = db.query("pragma table_info(users)").all().map(c => c.name);
let n = 0;
for (const r of rows) {
  if (db.query("select 1 from users where email = ?").get(r.email)) { console.log('exists ' + r.email); continue; }
  const keys = Object.keys(r).filter(k => cols.includes(k));
  db.query('insert into users (' + keys.join(',') + ') values (' + keys.map(() => '?').join(',') + ')').run(...keys.map(k => r[k]));
  n++; console.log('inserted ' + r.email);
}
console.log('done ' + n);`);
fs.unlinkSync('.users-tmp.b64');
console.log(res);
