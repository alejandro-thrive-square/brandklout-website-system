#!/usr/bin/env python3
"""
Split a media-bearing export archive into pieces the Railway edge will accept.

    python chunk-media.py prod-full.zip ./chunks [target_mb]

Produces `chunks/chunkNN.zip` plus `chunks/chunks.json` listing the media ids
in each, which `import-media-chunks.mjs` feeds back as the import `selection`.

WHY
---
`POST /admin/api/cms/export {includeMedia:true}` on Dr. Nahlah returns 535 MB.
Importing that returns **HTTP 413 in 1.2 s** — rejected on Content-Length by
Railway's edge before the body is sent, NOT by Instatic (whose only related cap,
MAX_ARCHIVE_MANIFEST_BYTES, is 256 MB and applies to the manifest ENTRY, which
is 4.9 MB here). Chunks of ~90-95 MB import fine; 7 of them took ~58 s total.

FORMAT RULES the importer enforces, and why this writes zips by hand:
  - `.instatic/site-bundle.json` must be the FIRST entry,
  - STORED (uncompressed),
  - with its size in the local header (no data descriptor).
The full manifest goes in EVERY chunk — the importer filters it by the
`selection` query param, so each chunk carries ~5 MB of manifest overhead.
Media entries are already STORED in the source archive; they are copied as-is.
"""
import json
import os
import shutil
import sys
import zipfile

SRC = sys.argv[1] if len(sys.argv) > 1 else None
OUT = sys.argv[2] if len(sys.argv) > 2 else "./chunks"
TARGET = int(sys.argv[3]) * 1024 * 1024 if len(sys.argv) > 3 else 90 * 1024 * 1024

if not SRC or not os.path.exists(SRC):
    print("usage: python chunk-media.py <full-export.zip> [outdir] [target_mb]")
    raise SystemExit(2)

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)

z = zipfile.ZipFile(SRC)
MANIFEST = ".instatic/site-bundle.json"
manifest_bytes = z.read(MANIFEST)
manifest = json.loads(manifest_bytes)

by_path = {m["storagePath"]: m["id"] for m in (manifest.get("media") or [])}
media = [n for n in z.namelist() if n.startswith("media/")]
print(f"source {SRC}: {len(media)} media entries, manifest {len(manifest_bytes)/1048576:.2f} MB")

chunks, cur, cur_size = [], [], 0
for name in media:
    size = z.getinfo(name).file_size
    if cur and cur_size + size > TARGET:
        chunks.append(cur)
        cur, cur_size = [], 0
    cur.append(name)
    cur_size += size
if cur:
    chunks.append(cur)

meta = []
for i, entries in enumerate(chunks):
    path = os.path.join(OUT, f"chunk{i:02d}.zip")
    ids = []
    with zipfile.ZipFile(path, "w") as out:
        zi = zipfile.ZipInfo(MANIFEST)
        zi.compress_type = zipfile.ZIP_STORED
        out.writestr(zi, manifest_bytes)
        for name in entries:
            storage_path = name[len("media/"):]
            if storage_path in by_path:
                ids.append(by_path[storage_path])
            zi2 = zipfile.ZipInfo(name)
            zi2.compress_type = zipfile.ZIP_STORED
            out.writestr(zi2, z.read(name))
    meta.append({"file": os.path.basename(path), "mediaIds": ids})
    print(f"  chunk{i:02d}: {len(entries):4d} files, {len(ids):4d} ids, {os.path.getsize(path)/1048576:7.1f} MB")

with open(os.path.join(OUT, "chunks.json"), "w") as fh:
    json.dump(meta, fh)

total = sum(len(m["mediaIds"]) for m in meta)
print(f"{len(chunks)} chunk(s); {total} of {len(by_path)} media ids covered")
if total != len(by_path):
    print("WARNING: some manifest media had no file in the archive")
