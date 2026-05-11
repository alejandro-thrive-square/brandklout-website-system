"""Vercel deployment manifest helper.

This executor validates a local static deployment root and writes a manifest
draft for later Vercel dashboard or CLI deployment.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def build_manifest(args: argparse.Namespace) -> dict[str, str]:
    return {
        "client_slug": args.client_slug,
        "product_slug": args.product_slug,
        "deployment_root": args.deployment_root,
        "vercel_project": args.vercel_project
        or f"webzite-{args.client_slug}-{args.product_slug}",
        "environment": args.environment,
        "deployment_url": "",
        "custom_domain": args.custom_domain or "",
        "deployed_from_branch": args.branch or "",
        "deployed_commit": args.commit or "",
        "deployed_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate a static Vercel deployment root and write a manifest draft."
    )
    parser.add_argument("--client-slug", required=True)
    parser.add_argument("--product-slug", required=True)
    parser.add_argument("--deployment-root", required=True)
    parser.add_argument("--environment", choices=["preview", "production"], default="preview")
    parser.add_argument("--vercel-project", default="")
    parser.add_argument("--custom-domain", default="")
    parser.add_argument("--branch", default="")
    parser.add_argument("--commit", default="")
    parser.add_argument(
        "--manifest-path",
        default="deliver/process/14-vercel-deployment/.tmp/deployment-manifest.json",
    )
    args = parser.parse_args()

    root = Path(args.deployment_root)
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Deployment root does not exist or is not a directory: {root}")

    index_file = root / "index.html"
    if not index_file.exists():
        raise SystemExit(f"Deployment root is missing index.html: {index_file}")

    manifest = build_manifest(args)
    manifest_path = Path(args.manifest_path)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote deployment manifest: {manifest_path}")
    print(f"Suggested Vercel project: {manifest['vercel_project']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
