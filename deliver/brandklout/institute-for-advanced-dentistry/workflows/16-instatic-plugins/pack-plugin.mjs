#!/usr/bin/env node
/**
 * Zip a plugin folder into an installable package.
 *
 * Written by hand rather than shelling out to `Compress-Archive`, which writes
 * entry names with BACKSLASH separators on Windows. The host looks up
 * `server/index.js` by its manifest path, so a backslashed entry installs a
 * plugin whose entrypoint can never be found — and the failure surfaces later,
 * as a plugin parked in `error`, not as a bad zip.
 *
 *   node pack-plugin.mjs embed-origins [out.zip]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { deflateRawSync, crc32 } from 'node:zlib'

const dir = process.argv[2]
if (!dir) { console.error('usage: node pack-plugin.mjs <plugin-dir> [out.zip]'); process.exit(2) }
const out = process.argv[3] ?? `${dir}.zip`

function walk(root, base = root) {
  const files = []
  for (const name of readdirSync(root)) {
    const p = join(root, name)
    if (statSync(p).isDirectory()) files.push(...walk(p, base))
    // Zip entry names are always forward-slashed, on every platform.
    else files.push({ path: p, name: relative(base, p).split(sep).join('/') })
  }
  return files
}

const files = walk(dir).sort((a, b) => (a.name < b.name ? -1 : 1))
if (!files.some((f) => f.name === 'plugin.json')) {
  console.error(`${dir}/plugin.json is missing — not a plugin package`)
  process.exit(1)
}

// Fixed DOS timestamp (1980-01-01) so the same input always produces the same
// bytes: a rebuilt package with no source change should not look different.
const DOS_TIME = 0, DOS_DATE = 33

const locals = []
const central = []
let offset = 0

for (const f of files) {
  const data = readFileSync(f.path)
  const comp = deflateRawSync(data)
  const crc = crc32(data)
  const nameBuf = Buffer.from(f.name, 'utf8')

  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)          // version needed
  local.writeUInt16LE(0, 6)           // flags
  local.writeUInt16LE(8, 8)           // deflate
  local.writeUInt16LE(DOS_TIME, 10)
  local.writeUInt16LE(DOS_DATE, 12)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(comp.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBuf.length, 26)
  local.writeUInt16LE(0, 28)
  locals.push(local, nameBuf, comp)

  const cd = Buffer.alloc(46)
  cd.writeUInt32LE(0x02014b50, 0)
  cd.writeUInt16LE(20, 4)             // version made by
  cd.writeUInt16LE(20, 6)             // version needed
  cd.writeUInt16LE(0, 8)
  cd.writeUInt16LE(8, 10)
  cd.writeUInt16LE(DOS_TIME, 12)
  cd.writeUInt16LE(DOS_DATE, 14)
  cd.writeUInt32LE(crc, 16)
  cd.writeUInt32LE(comp.length, 20)
  cd.writeUInt32LE(data.length, 24)
  cd.writeUInt16LE(nameBuf.length, 28)
  cd.writeUInt32LE(0, 38)             // external attrs
  cd.writeUInt32LE(offset, 42)
  central.push(cd, nameBuf)

  offset += local.length + nameBuf.length + comp.length
  console.log(`  ${f.name}  ${data.length} -> ${comp.length}`)
}

const cdBuf = Buffer.concat(central)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(files.length, 8)
end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(cdBuf.length, 12)
end.writeUInt32LE(offset, 16)

writeFileSync(out, Buffer.concat([...locals, cdBuf, end]))
console.log(`\nwrote ${out} (${files.length} entries, ${statSync(out).size} bytes)`)
