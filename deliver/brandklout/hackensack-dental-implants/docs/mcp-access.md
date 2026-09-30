# hackensack-dental-implants · MCP access

## Access Level

Client delivery, **read-only** until the scope is recorded in
[`project-overview.md`](./project-overview.md).

## Referenced Profile

[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md), under the partner-level
grants in [deliver/docs/mcp-access.md](../../../docs/mcp-access.md).

## Target Resources

| Platform | Resource | Id | Status |
| :--- | :--- | :--- | :--- |
| Webflow, through `webflow-brandklout` | Hackensack Center for Dental Implants, serving `www.hackensackdentalimplants.com` | `6a1f4de5739bab24f074660f` | Id read from the live site's `data-wf-site`; **in the grant**, confirmed 2026-09-30 by `get_collection_list` (Blogs, Blog types, Categories) |
| Google Drive, through `scripts/drive.mjs` | Shared drive "Hackensack Center for Dental Implants" | `0ADqUKcTkH0SxUk9PVA` | Readable 2026-09-30: Before and Afters, Clinical Photos, Logos PNG, Logos SVG, two brief documents (shortcuts), office photos dated 2026-09-14 |

## Allowed Operations

- Read the Webflow site: pages, CMS collections and items, assets, scripts.
- Read and pull from the shared drive.

## Forbidden Operations

- No Webflow write of any kind (page, class, CMS item, script, publish). This is the practice's
  live website, and the job recorded so far is to capture it, not to change it.
- No DNS change on `hackensackdentalimplants.com`.

## Confirmation Requirements

A Webflow write needs the scope written down first and an explicit go-ahead in the conversation,
with the site id above passed explicitly.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). The partner-level site registry in
`deliver/docs/mcp-access.md` and the drive map in `deliver/docs/GOOGLE_DRIVE.md` are system files on
`main`; both still need this client's row.
