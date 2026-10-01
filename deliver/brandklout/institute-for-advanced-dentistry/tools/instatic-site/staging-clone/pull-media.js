/**
 * Runs INSIDE the target container, under Bun. Pulls every media file from the
 * source site's public /uploads over HTTPS, straight onto the target's volume.
 *
 * Not run directly — shipped in through `railway ssh`:
 *
 *   # 1. file list, from the SOURCE container
 *   railway ssh -s "<Service>" -e production \
 *     "sh -lc 'cd /app/storage/uploads && find . -type f -not -path \"./plugins/*\" | sed s,^\\./,, | sort'" \
 *     | grep -v '^Using SSH' > uploads-list.txt
 *
 *   # 2. put the list on the TARGET volume
 *   MSYS_NO_PATHCONV=1 railway volume files --volume <id> upload ./uploads-list.txt /data/uploads-list.txt
 *
 *   # 3. run this there
 *   B64=$(base64 -w0 pull-media.js)
 *   railway ssh -s "<Service>" -e staging \
 *     "sh -lc 'echo $B64 | base64 -d > /tmp/pull.js && bun /tmp/pull.js https://www.drnahlah.com'"
 *
 *   # 4. clean up
 *   railway ssh ... "sh -lc 'rm -f /app/storage/data/uploads-list.txt /tmp/pull.js'"
 *
 * WHY NOT THE OBVIOUS ROUTES
 * --------------------------
 * - `railway volume files download/upload` runs at ~170 KB/s and charges ~3 s
 *   of overhead per file. 3,478 files is hours.
 * - The export archive WITH media is 535 MB and the Railway edge answers 413
 *   before the body is even sent. ~95 MB chunks are accepted (chunk-media.py).
 *
 * Container-to-container over the public internet is neither: measured on
 * Dr. Nahlah 2026-08-31, 670.5 MB / 3,478 files in 10.3 s, zero failures.
 *
 * This copies BYTES ONLY. The media asset ROWS are separate and still have to
 * be imported (chunk-media.py + import-media-chunks.mjs) or the media library
 * is empty. Existing non-empty files are skipped, so it is safe to re-run.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SOURCE = (process.argv[2] || '').replace(/\/+$/, '')
if (!SOURCE) { console.log('usage: bun pull.js https://source-site.com'); process.exit(2) }

const LIST = '/app/storage/data/uploads-list.txt'
const DEST = process.env.UPLOADS_DIR || '/app/storage/uploads'
const CONCURRENCY = 24

const list = readFileSync(LIST, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
console.log(`pulling ${list.length} file(s) from ${SOURCE}/uploads/ -> ${DEST}`)

let done = 0, bytes = 0, skipped = 0
const failures = []

async function worker(queue) {
  while (queue.length) {
    const rel = queue.pop()
    const target = join(DEST, rel)
    try {
      if (existsSync(target) && statSync(target).size > 0) { skipped++; done++; continue }
      // Encode per segment: filenames contain characters that must not be
      // encoded as a whole path (the '/' separators must survive).
      const r = await fetch(`${SOURCE}/uploads/` + rel.split('/').map(encodeURIComponent).join('/'))
      if (!r.ok) { failures.push(`${rel} -> ${r.status}`); done++; continue }
      const buf = Buffer.from(await r.arrayBuffer())
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, buf)
      bytes += buf.length
      done++
      if (done % 500 === 0) console.log(`  ${done}/${list.length}  ${(bytes / 1048576).toFixed(0)} MB`)
    } catch (e) {
      failures.push(`${rel} -> ${e.message}`)
      done++
    }
  }
}

const t0 = Date.now()
const queue = list.slice()
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))

console.log(`DONE ${done}/${list.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
console.log(`downloaded ${(bytes / 1048576).toFixed(1)} MB, skipped(existing) ${skipped}, failures ${failures.length}`)
for (const f of failures.slice(0, 10)) console.log('  FAIL', f)
