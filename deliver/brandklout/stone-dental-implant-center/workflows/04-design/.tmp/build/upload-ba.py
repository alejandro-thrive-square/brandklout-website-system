# -*- coding: utf-8 -*-
"""Upload cropped before/after halves as new Webflow assets."""
import json, sys, io, os, hashlib, mimetypes, uuid
sys.path.insert(0, ".")
from build import call
import content as C
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PAIRS = "C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/.tmp/ba-split/pairs.json"
OUT = "C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/.tmp/ba-split/uploaded.json"


def md5_file(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def upload_asset(path, display_name):
    digest = md5_file(path)
    d = call("data_assets_tool", {
        "siteId": C.SITE,
        "actions": [{"label": "create", "create_asset": {
            "site_id": C.SITE,
            "file_name": display_name,
            "file_hash": digest,
        }}],
    })
    res = d["actions"][0] if "actions" in d else d
    node = res[0] if isinstance(res, list) else res
    data = node.get("data") or node.get("result") or node
    upload_url = data["uploadUrl"]
    details = data["uploadDetails"]
    asset_id = data.get("id")

    # S3 POST with exact field-name mapping (per webflow://guides/asset-upload)
    fields = [
        ("acl", details.get("acl")),
        ("bucket", details.get("bucket")),
        ("X-Amz-Algorithm", details.get("xAmzAlgorithm")),
        ("X-Amz-Credential", details.get("xAmzCredential")),
        ("X-Amz-Date", details.get("xAmzDate")),
        ("key", details.get("key")),
        ("Policy", details.get("policy")),
        ("X-Amz-Signature", details.get("xAmzSignature")),
        ("success_action_status", details.get("successActionStatus")),
        ("Content-Type", details.get("contentType")),
        ("Cache-Control", details.get("cacheControl")),
    ]
    ctype = details.get("contentType") or mimetypes.guess_type(display_name)[0] or "image/jpeg"
    boundary = "----bkstone" + uuid.uuid4().hex
    with open(path, "rb") as f:
        file_bytes = f.read()
    body = b""
    for k, v in fields:
        if v is None:
            continue
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += f"--{boundary}\r\n".encode()
    body += f'Content-Disposition: form-data; name="file"; filename="{display_name}"\r\n'.encode()
    body += f"Content-Type: {ctype}\r\n\r\n".encode()
    body += file_bytes + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    import urllib.request
    req = urllib.request.Request(upload_url, data=body, method="POST", headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    })
    resp = urllib.request.urlopen(req, timeout=120)
    hosted = data.get("hostedUrl") or data.get("assetUrl")
    print(f"  {display_name}: upload {resp.status}, asset id {asset_id}")
    return asset_id, hosted


if __name__ == "__main__":
    pairs = json.load(open(PAIRS))
    out = {}
    for p in pairs:
        tag = p["tag"]
        for kind in ("before", "after"):
            name = f"allonx-{tag}-{kind}.jpg"
            asset_id, hosted = upload_asset(p[kind], name)
            out[f"{tag}-{kind}"] = {"id": asset_id, "url": hosted}
    json.dump(out, open(OUT, "w"), indent=1)
    print("uploaded", len(out), "assets")
