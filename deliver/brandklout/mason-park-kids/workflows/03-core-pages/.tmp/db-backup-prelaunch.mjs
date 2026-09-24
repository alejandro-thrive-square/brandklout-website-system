// A consistent copy of the live Instatic DB on the volume, before the production launch.
// VACUUM INTO, because a plain cp misses what is still in cms.db-wal.
import { ssh } from './railway-ssh.mjs';
const name = '/app/storage/backups/cms-2026-09-24-pre-production-launch.db';
const js = `const {Database}=require('bun:sqlite');const d=new Database('/app/storage/data/cms.db',{readonly:true});d.run("VACUUM INTO '${name}'");`;
// base64, so no quote survives two shell layers (railway-ssh wraps the command in single quotes)
const b64 = Buffer.from(js).toString('base64');
console.log(ssh(`mkdir -p /app/storage/backups && echo ${b64} | base64 -d > /tmp/vac.js && cd /app && bun /tmp/vac.js && ls -la /app/storage/backups && ls -la /app/storage/data`));
