# CENTRA — 16 Vercel Deployment (instance)

**Canonical template (source of truth):** [16-vercel-deployment.md](../../../process/16-vercel-deployment/16-vercel-deployment.md)

Follow the canonical template for method, naming, and manifest schema. Record only CENTRA-specific adaptations here.

## Status
✅ **Live (production):** https://centra-two.vercel.app — public, all four pages verified 200. Project `centra` under the **webzite-studio** team.

Notes:
- Vercel auto-named the public alias `centra-two` because `centra.vercel.app` is owned by another Vercel account. The clean alias is public (like `giovanni-serrano.vercel.app`); team-suffixed/preview URLs stay behind Vercel Deployment Protection (401).
- To update: re-run the prod deploy command below; the `centra-two.vercel.app` alias follows the latest production deployment.

### Resolved blocker (for future deploys)
The machine intercepts HTTPS, so Node didn't trust the cert ("unable to verify the first certificate"). Connectivity and auth were fine. Fix: prefix Vercel CLI commands with `NODE_OPTIONS=--use-system-ca` (Node 22 reads the Windows cert store). Not a network outage.

## Adaptations
- **Vercel project name:** `centra` — per client request, the project is named after the company (overrides the canonical `webzite-[client-slug]-[product-slug]` convention).
- **Deployment root:** [../02-wireframe/.tmp/wireframes/](../02-wireframe/.tmp/wireframes/) (static HTML/CSS, entry `index.html`, no secrets).
- **Environment:** preview first; promote to production for a clean `centra*.vercel.app` URL after review.

## Deploy commands (run from repo root, with Vercel authenticated)
```powershell
# 1. Link/create the Vercel project named "centra"
vercel link --cwd deliver/centra/workflows/02-wireframe/.tmp/wireframes --project centra --yes

# 2. Preview deploy (shareable hashed URL)
vercel deploy --cwd deliver/centra/workflows/02-wireframe/.tmp/wireframes --yes

# 3. Production deploy (clean project URL) — after review
vercel deploy --cwd deliver/centra/workflows/02-wireframe/.tmp/wireframes --prod --yes
```

## Artifacts
- Manifest: [.tmp/deployment-manifest.json](./.tmp/deployment-manifest.json).
- On deploy: write preview/production URLs and the deployed commit back into the manifest.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/centra-vercel-deployment-<change>`.
- Keep `.vercel/` (created by `vercel link`) out of git — it is gitignored by the CLI and excluded from uploads.

## Infrastructure
- **Hosting:** Hostinger VPS (project repo) · Vercel (static preview)
- **OS:** Ubuntu 24.04 LTS
