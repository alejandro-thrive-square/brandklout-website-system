# Workflow: 14 - Vercel Deployment

## Client-Facing Overview
This workflow publishes a static design or client website folder to Vercel so it can be reviewed or delivered on a dedicated Vercel project URL or a branded subdomain.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, Vercel deployment strategy, project naming rules, or artifact schema must be documented here immediately.

## Operational Purpose
Deploy a workflow-owned static output folder, such as `deliver/[client-name]/workflows/03-design/.tmp/final-design`, to Vercel without moving the client files out of the Deliver project structure. Use this workflow for client previews, final static handoff sites, or temporary review environments when Webflow launch is not the immediate deployment target.

This module is optional. It can be copied into any client workspace when the Sales handoff, project overview, or delivery decision calls for Vercel preview/deployment.

## Deployment Model
Use one Vercel project per client/product when the deployment needs a stable review URL, custom subdomain, or independent production history.

The default Webzite operating model is **GitHub for source history and Vercel CLI for deployment**. Agents should commit/push the static client folder to GitHub for auditability, then deploy the specific folder with Vercel CLI. Do not require Git-connected Vercel projects for every client/product unless the project explicitly needs Vercel automatic deployments from Git.

Recommended naming:
- **Client slug**: `giovanni-serrano`
- **Product/site slug**: `final-design`, `invest`, `scale`, `client-preview`, or another clear product name.
- **Vercel project name**: `webzite-[client-slug]-[product-slug]`
- **Subdomain**: `[client-slug]-[product-slug].[agency-domain]` or `[product-slug].[client-domain]`

Examples:
- `webzite-giovanni-serrano-final-design`
- `giovanni-final.webzitestudio.com`
- `preview.giovannidomain.com`

## Inputs From Sales / Previous Phase
- Client slug and product/site slug.
- Static deployment root folder.
- Intended environment: `preview` or `production`.
- Vercel team/account name.
- Domain or subdomain decision, if custom domain is needed.
- Confirmation that the folder contains no secrets and no private client files that should not be publicly accessible.

## Execution Steps
1. Confirm the deployment root exists and contains an entry file, usually `index.html`.
2. Confirm the deployment root is safe to publish and contains no secrets.
3. Commit and push the changed deployment root to GitHub when this is a real client/project update.
4. Run Vercel CLI with `--cwd` pointed at the deployment root.
5. Create or link the Vercel project using the recommended project naming convention.
6. Deploy to preview first unless this is an approved production update.
7. Review the generated Vercel URL for layout, assets, routing, and form behavior.
8. Promote or deploy to production only after approval.
9. Add the custom domain/subdomain in Vercel when needed.
10. Store the deployment manifest and verification notes in this workflow's `.tmp/` folder.

## Standard Update Flow
Use this flow when updating an existing CLI-managed Vercel project:

```powershell
git status
git add deliver/[client-name]/workflows/[workflow-name]/.tmp/[deployment-folder]
git commit -m "Update [client-name] [product-slug] deployment"
git push origin main
vercel --cwd deliver/[client-name]/workflows/[workflow-name]/.tmp/[deployment-folder] --prod
```

This keeps GitHub as the record of what changed while using Vercel CLI as the deployment mechanism. If the update is only a temporary preview experiment, the commit can wait until the work is approved.

## CLI Setup
Run from the repository root:

```powershell
vercel --cwd deliver/[client-name]/workflows/[workflow-name]/.tmp/[deployment-folder]
```

Production deployment:

```powershell
vercel --cwd deliver/[client-name]/workflows/[workflow-name]/.tmp/[deployment-folder] --prod
```

For Giovanni Serrano's current final design:

```powershell
vercel --cwd deliver/giovanni-serrano/workflows/03-design/.tmp/final-design
vercel --cwd deliver/giovanni-serrano/workflows/03-design/.tmp/final-design --prod
```

## Git-Connected Setup
Use Git-connected setup only when a client/product specifically needs automatic Vercel deployments from GitHub. It is not the default for client/product folders because each Vercel project requires its own repository/root-directory configuration.

When using the GitHub repository from the Vercel dashboard:

1. Import the repository.
2. Set **Root Directory** to the client/product output folder, for example:

```text
deliver/giovanni-serrano/workflows/03-design/.tmp/final-design
```

3. Use **Framework Preset**: `Other`.
4. Leave **Build Command** empty for plain HTML/CSS/JS.
5. Leave **Output Directory** empty or set it to `.` if Vercel asks for one.
6. Set the project name using `webzite-[client-slug]-[product-slug]`.

## Subdomain Rules
- Use a Vercel-generated URL for internal preview unless the client needs a branded link.
- Use one custom subdomain per production-facing client/product preview.
- Do not reuse the same production subdomain for unrelated clients or products.
- Keep DNS changes in `07-launch` when the website's primary launch is in scope.
- Keep Vercel preview subdomains in this workflow when the deployment is a review/demo artifact.

## Output Artifacts
- `deliver/process/14-vercel-deployment/.tmp/deployment-manifest.json`
- `deliver/process/14-vercel-deployment/.tmp/vercel-preview-url.txt`
- `deliver/process/14-vercel-deployment/.tmp/vercel-production-url.txt`
- `deliver/process/14-vercel-deployment/.tmp/domain-notes.md`
- `deliver/process/14-vercel-deployment/.tmp/post-deploy-check.md`

## Deployment Manifest Schema
Store a lightweight JSON manifest when a deployment is created:

```json
{
  "client_slug": "giovanni-serrano",
  "product_slug": "final-design",
  "deployment_root": "deliver/giovanni-serrano/workflows/03-design/.tmp/final-design",
  "vercel_project": "webzite-giovanni-serrano-final-design",
  "environment": "preview",
  "deployment_url": "",
  "custom_domain": "",
  "deployed_from_branch": "main",
  "deployed_commit": "",
  "deployed_at": ""
}
```

## Technical Setup
- **Executor status**: Planning and manifest helper. The executor validates the local deployment root and writes a deployment manifest draft; it does not call Vercel until CLI/API automation is intentionally added.
- **Future automation**: Create/link Vercel projects, deploy with Vercel CLI, attach custom domains, write deployment URLs back to `.tmp`, and run post-deploy checks.
- **Likely integrations**: Vercel CLI, Vercel REST API, GitHub, DNS provider, [Playwright Browser Tool](../../../manage/browser-tools/playwright-browser/playwright-browser.md).

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight deployment manifests, URLs, and post-deploy notes that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-vercel-deployment-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
