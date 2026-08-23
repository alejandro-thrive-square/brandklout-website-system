# Workflow: 16 - Vercel Deployment

## Client-Facing Overview
This workflow publishes a static design or client website folder to Vercel so it can be reviewed or delivered on a dedicated Vercel project URL or a branded subdomain.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, Vercel deployment strategy, project naming rules, or artifact schema must be documented here immediately.

## Operational Purpose
Deploy a workflow-owned static output folder, such as `deliver/[client-name]/workflows/05-design-revisions/.tmp/final-design`, to Vercel without moving the client files out of the Deliver project structure. Use this workflow for client previews, final static handoff sites, or temporary review environments when Webflow launch is not the immediate deployment target.

This module is optional for delivery routes that only need Webflow or ad-hoc preview hosting. It is required for the `AI Site with Claude, Vercel & Airtable` route and can be copied into any other client workspace when the Sales handoff, project overview, or delivery decision calls for Vercel preview/deployment.

## Deployment Model
Use one Vercel project per client/product when the deployment needs a stable review URL, custom subdomain, or independent production history.

The default Webzite operating model is **GitHub for source history and Vercel CLI for deployment**. Agents should commit/push the static client folder to GitHub for auditability, then deploy the specific folder with Vercel CLI. Do not require Git-connected Vercel projects for every client/product unless the project explicitly needs Vercel automatic deployments from Git.

Recommended naming:
- **Client slug**: `dr-nahlah`
- **Product/site slug**: `final-design`, `invest`, `scale`, `client-preview`, or another clear product name.
- **Vercel project name**: `webzite-[client-slug]-[product-slug]`
- **Subdomain**: `[client-slug]-[product-slug].[agency-domain]` or `[product-slug].[client-domain]`

Examples:
- `brandklout-dr-nahlah-final-design`
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

## Airtable CMS on Vercel Pattern
Use this pattern when a static client site needs lightweight CMS content without moving immediately to Webflow.

Required folder shape:

```text
deliver/[client-name]/workflows/05-design-revisions/.tmp/final-design/
  index.html
  api/
    [content-route].js
```

Implementation rules:
- Keep Airtable tokens server-side in Vercel Functions under `api/*.js`.
- Browser code should call same-origin routes such as `/api/portfolio`; never call Airtable directly from the browser.
- Store only environment variable names in docs. Never commit values, `.env` files, Personal Access Tokens, base IDs, or private table IDs unless masked and intentionally documented for debugging.
- Trim environment variable values in the Vercel Function before use; trailing spaces can break Airtable requests.
- Prefer Airtable IDs for runtime config when possible:
  - base ID begins with `app`
  - table ID begins with `tbl`
- Redeploy after any Vercel environment variable change.

Standard Airtable environment variable pattern:

```text
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
AIRTABLE_[CONTENT]_TABLE
```

For a portfolio route, use:

```text
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
AIRTABLE_PROJECTS_TABLE
AIRTABLE_CATEGORIES_TABLE
```

Cache defaults:
- Use `Cache-Control: no-store, max-age=0` while content is actively reviewed or edited.
- Use browser fetch with `{ cache: 'no-store' }` when immediate Airtable edit visibility is expected.
- Add caching later only when the maintenance expectation allows delayed updates.

Safe diagnostics:
- API responses may include non-secret diagnostic fields such as missing env var names, masked base IDs, configured route/table names, and upstream status codes.
- API responses must never include tokens, full secret values, private credentials, or raw Authorization headers.

Post-deploy checks:
- Visit the public API route directly, for example `/api/portfolio`.
- Confirm it returns expected JSON before testing the page UI.
- Confirm the browser console has no failed API requests.
- Edit a non-sensitive Airtable test record and reload the site to confirm the CMS path updates.

Common debugging sequence:

| Symptom | Meaning | Next Check |
|---|---|---|
| Public page works but `/api/...` returns 404 | Function folder was not deployed. | Confirm `api/*.js` exists inside the exact deployed root. |
| API returns generic content-load error | Function deployed but runtime config or upstream request failed. | Inspect safe `detail`/`config` diagnostics. |
| Airtable returns `404 NOT_FOUND` | Wrong base/table, token lacks access, or whitespace in env vars. | Confirm matching `app...` base ID, `tbl...` table ID, token scope, and trimmed values. |
| Airtable edits do not show after reload | Old deployment or cache policy. | Confirm live code uses no-store headers/fetch and redeploy if needed. |

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
vercel --cwd deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/final-design
vercel --cwd deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/final-design --prod
```

## Git-Connected Setup
Use Git-connected setup only when a client/product specifically needs automatic Vercel deployments from GitHub. It is not the default for client/product folders because each Vercel project requires its own repository/root-directory configuration.

When using the GitHub repository from the Vercel dashboard:

1. Import the repository.
2. Set **Root Directory** to the client/product output folder, for example:

```text
deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/final-design
```

3. Use **Framework Preset**: `Other`.
4. Leave **Build Command** empty for plain HTML/CSS/JS.
5. Leave **Output Directory** empty or set it to `.` if Vercel asks for one.
6. Set the project name using `webzite-[client-slug]-[product-slug]`.

## Subdomain Rules
- Use a Vercel-generated URL for internal preview unless the client needs a branded link.
- Use one custom subdomain per production-facing client/product preview.
- Do not reuse the same production subdomain for unrelated clients or products.
- Keep DNS changes in `09-launch` when the website's primary launch is in scope.
- Keep Vercel preview subdomains in this workflow when the deployment is a review/demo artifact.

## Output Artifacts
- `deliver/process/16-vercel-deployment/.tmp/deployment-manifest.json`
- `deliver/process/16-vercel-deployment/.tmp/vercel-preview-url.txt`
- `deliver/process/16-vercel-deployment/.tmp/vercel-production-url.txt`
- `deliver/process/16-vercel-deployment/.tmp/domain-notes.md`
- `deliver/process/16-vercel-deployment/.tmp/post-deploy-check.md`

## Deployment Manifest Schema
Store a lightweight JSON manifest when a deployment is created:

```json
{
  "client_slug": "dr-nahlah",
  "product_slug": "final-design",
  "deployment_root": "deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/final-design",
  "vercel_project": "brandklout-dr-nahlah-final-design",
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
