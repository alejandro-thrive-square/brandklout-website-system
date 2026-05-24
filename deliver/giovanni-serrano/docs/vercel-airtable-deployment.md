# Giovanni Serrano - Vercel + Airtable Deployment

## Purpose
This document records the first successful Giovanni Serrano deployment path using a static Vercel site with a serverless Airtable-backed portfolio CMS. It is the operational source of truth for maintaining the published Vercel version while the Webflow Build workflow remains available if the client later requests a Webflow implementation.

## Published Deployment
| Field | Value |
|---|---|
| Published URL | `https://giovanni-serrano.vercel.app` |
| Deployment root | `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-design/` |
| Frontend entry | `index.html` |
| API route | `api/portfolio.js` |
| CMS source | Airtable |
| Dynamic section | Home page portfolio section |

## Airtable CMS Architecture
- Airtable stores portfolio project records.
- The Vercel Function at `api/portfolio.js` fetches Airtable records server-side so the Airtable token is never exposed to browser code.
- The home page calls `/api/portfolio` and renders:
  - featured portfolio project into `#portfolio-featured`
  - featured tags into `#portfolio-featured-tags`
  - grouped portfolio cards into `#portfolio-groups`
- The current implementation uses client-side rendering for the portfolio section. This is acceptable for the proposed Vercel version, but SEO-critical portfolio detail pages should later be server-rendered, static-generated, or built as Webflow CMS template pages.

## Vercel Environment Variables
Set these in the Vercel project settings for the intended environment, usually Production. Store names only in documentation; never commit values.

| Variable | Required | Notes |
|---|---:|---|
| `AIRTABLE_TOKEN` | Yes | Personal Access Token with read access to the Airtable base. |
| `AIRTABLE_BASE_ID` | Yes | Must be the Airtable base ID beginning with `app`, not the base display name. |
| `AIRTABLE_PROJECTS_TABLE` | Yes | Prefer the Airtable table ID beginning with `tbl`; table names are case-sensitive. |
| `AIRTABLE_CATEGORIES_TABLE` | No | Set only when a separate categories table is used for linked category sorting. |

After adding or changing environment variables, redeploy the site. Existing Vercel deployments do not automatically receive new env var values.

## Deployment Procedure
1. Confirm the deployment root contains `index.html` and `api/portfolio.js`.
2. Confirm no secrets or `.env` files exist in the deployment root.
3. Confirm Vercel environment variables are configured for Production.
4. Deploy the folder manually or through the Vercel CLI from the deployment root.
5. Test the API directly at `https://giovanni-serrano.vercel.app/api/portfolio`.
6. Reload the home page and verify the portfolio section renders Airtable content.

PowerShell can block the `vercel.ps1` shim on this machine. Use `cmd /c vercel ...` when needed.

## Post-Deploy Checks
- `/api/portfolio` returns JSON with `featured` and `groups`.
- The public home page renders the featured project and grouped portfolio cards.
- Airtable content edits appear after a normal reload.
- The browser console has no `/api/portfolio` 404 or 500 errors.
- No response exposes `AIRTABLE_TOKEN`.

## Debugging Notes
| Symptom | Likely Cause | Fix |
|---|---|---|
| `/api/portfolio` returns 404 | `api/portfolio.js` was not included in the deployed folder. | Redeploy the correct `05-design-revisions/.tmp/final-design/` folder. |
| `Unable to load portfolio content` | The function deployed, but Airtable config or access failed. | Check the diagnostic `detail` and `config` fields. |
| Airtable `404 NOT_FOUND` | Wrong base ID, wrong table ID/name, token lacks base access, or env var whitespace. | Use the `app...` base ID and `tbl...` table ID from the same Airtable URL; trim env vars; confirm token access. |
| Content does not update after Airtable edits | API/browser caching or an old deployment. | Current code uses `no-store`; redeploy if the live site is still on an older build. |
| Env changes do not affect the site | Vercel env vars apply only to new deployments. | Redeploy after every env var change. |

## Cache Behavior
- `api/portfolio.js` sends `Cache-Control: no-store, max-age=0`.
- `index.html` requests `/api/portfolio` with `{ cache: 'no-store' }`.
- This makes Airtable edits visible on reload during review and lightweight client maintenance.

## SEO Notes
- The current portfolio section is rendered by browser JavaScript after the initial HTML loads.
- Google can render JavaScript, but SEO-critical CMS content is more reliable when it appears in the initial HTML response.
- If portfolio items need individual indexable pages, use one of these future paths:
  - generate static portfolio pages from Airtable before deployment,
  - add server-rendered Vercel routes for portfolio slugs,
  - or move the portfolio into Webflow CMS template pages.

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Secrets:** Never commit Airtable tokens, full secret values, `.env` files, or private credentials.
- **Deployment root:** Commit lightweight code and documentation for replayability. Binary/media assets remain governed by root `.gitignore` and VPS asset rules.
- **Branch naming:** `deliver/giovanni-serrano-vercel-airtable-<change>`.

## Infrastructure
- **Hosting:** Hostinger VPS
- **Runtime deployment:** Vercel
- **CMS:** Airtable
- **OS:** Ubuntu 24.04 LTS
