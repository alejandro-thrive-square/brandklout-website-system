#!/usr/bin/env python3
"""Upload the downloaded Dr. Nahlah films to Vimeo and record their ids.

Reads .tmp/video-migration-manifest.csv, uploads every row whose status is
'downloaded-*' and whose vimeo_id is still blank, then writes the new id and
thumbnail back into the same CSV. Safe to re-run: a row that already carries a
vimeo_id is skipped, so an interrupted run resumes where it stopped.

    python upload_to_vimeo.py --check     # verify token + quota, upload nothing
    python upload_to_vimeo.py --dry-run   # list what would upload
    python upload_to_vimeo.py             # do it
"""
import argparse, csv, os, pathlib, sys, time

import vimeo

HERE = pathlib.Path(__file__).resolve().parent
TMP = HERE / ".tmp"
MANIFEST = TMP / "video-migration-manifest.csv"
# .env lives at the repo root. Walk up rather than count levels, so moving this
# workflow folder does not silently point the loader at the wrong file.
ENV = next((p / ".env" for p in [HERE, *HERE.parents] if (p / ".env").exists()),
           HERE.parents[4] / ".env")

# The privacy Vimeo needs for the embeds to play on the live domain. 'whitelist'
# means "only these domains may embed it", which is the point of moving off
# YouTube: the film cannot be watched anywhere but the practice's own pages.
EMBED_DOMAINS = ["dresamnahlah.com", "www.dresamnahlah.com", "localhost"]


def load_token():
    tok = os.environ.get("VIMEO_ACCESS_TOKEN")
    if tok:
        return tok.strip()
    if not ENV.exists():
        sys.exit(f"no .env at {ENV} and VIMEO_ACCESS_TOKEN unset")
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if line.startswith(("VIMEO=", "VIMEO_ACCESS_TOKEN=")):
            return line.partition("=")[2].strip().strip("\"'")
    sys.exit("no VIMEO= line in .env")


def client():
    return vimeo.VimeoClient(token=load_token())


def check(v):
    r = v.get("/me")
    if r.status_code != 200:
        sys.exit(f"token rejected: HTTP {r.status_code} {r.text[:300]}")
    me = r.json()
    q = me.get("upload_quota", {})
    free = q.get("space", {}).get("free")
    print(f"account : {me.get('name')} ({me.get('account')})")
    print(f"uri     : {me.get('uri')}")
    if free is not None:
        print(f"free    : {free / 1e9:.2f} GB")
    per = q.get("periodic", {})
    if per.get("free") is not None:
        print(f"periodic: {per['free'] / 1e9:.2f} GB left this {per.get('unit', 'period')}")
    return me


def rows():
    with MANIFEST.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def save(rs):
    cols = ["youtube_id", "title", "embed_type", "used_on", "watch_url",
            "source_channel", "status", "local_file", "vimeo_id", "vimeo_thumb"]
    tmp = MANIFEST.with_suffix(".csv.tmp")
    with tmp.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rs)
    tmp.replace(MANIFEST)


def thumb_of(v, uri, tries=10):
    """Vimeo generates the poster frame after the transcode, so it is not there
    the instant the upload returns. Poll rather than write an empty column."""
    for _ in range(tries):
        r = v.get(uri + "/pictures")
        if r.status_code == 200:
            for pic in r.json().get("data", []):
                sizes = pic.get("sizes") or []
                if sizes:
                    return max(sizes, key=lambda s: s.get("width", 0))["link"]
        time.sleep(6)
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="verify token, upload nothing")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    v = client()
    check(v)
    if args.check:
        return

    rs = rows()
    todo = [r for r in rs
            if r["status"].startswith("downloaded") and not r["vimeo_id"] and r["local_file"]]
    print(f"\n{len(todo)} to upload, {sum(1 for r in rs if r['vimeo_id'])} already done\n")
    if args.dry_run:
        for r in todo:
            print(f"  {r['youtube_id']}  {r['title'][:60]}")
        return

    for i, r in enumerate(todo, 1):
        path = pathlib.Path(r["local_file"])
        if not path.is_absolute():
            path = HERE / path
        if not path.exists():
            print(f"[{i}/{len(todo)}] {r['youtube_id']}: MISSING {path}")
            continue

        print(f"[{i}/{len(todo)}] {r['title'][:55]} ... ", end="", flush=True)
        try:
            uri = v.upload(str(path), data={
                "name": r["title"],
                "description": f"Dr. Esam Nahlah. Originally published as youtube.com/watch?v={r['youtube_id']}",
                "privacy": {"view": "disable", "embed": "whitelist", "download": False},
                "embed": {"buttons": {"share": False, "watchlater": False, "like": False}},
            })
        except Exception as exc:                      # noqa: BLE001 - report and keep going
            print(f"FAILED: {exc}")
            continue

        vid = uri.rsplit("/", 1)[-1]
        for d in EMBED_DOMAINS:
            v.put(f"{uri}/privacy/domains/{d}")

        r["vimeo_id"] = vid
        r["status"] = "uploaded"
        save(rs)                                       # checkpoint after each one
        print(f"-> {vid}")

        r["vimeo_thumb"] = thumb_of(v, uri)
        save(rs)

    done = sum(1 for r in rs if r["vimeo_id"])
    print(f"\n{done}/{len(rs)} rows carry a vimeo_id")


if __name__ == "__main__":
    main()
