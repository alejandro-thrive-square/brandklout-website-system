# Marvel Dental - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Webflow access for every Brandklout client, this one included. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | **LIVE.** Reach to this specific site confirmed 2026-08-21 via `get_site`. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM or ad accounts.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, because they all sit in one workspace Brandklout owns — so the tool prefix
> does **not** tell you which client you are acting on. Before any mutating call, take the site ID
> from Target Resources below and pass it explicitly. Never act on a site the tool defaulted to,
> listed first, or that merely came up in conversation.

## Target Resources

- **Webflow site**: **Marvel Dental Main**, site id **`69aedbc6b0c7e78051fd6a2c`**, short name
  `marvel-dental-main`, workspace `63b4b7393e89b78575e9a9bb`, parent folder
  `6913c1f7094146b473c586dc`. Confirmed 2026-08-21 via `get_site`. Timezone
  `America/Los_Angeles`. Created 2026-03-09.
- **Live site**: https://marveldentaldds.com — `customDomains` lists `marveldentaldds.com` and
  `www.marveldentaldds.com`, both on this same Webflow site. **Editing this site edits the
  practice's production website.**
- **Staging URL**: https://marvel-dental-main.webflow.io — live, returns 200.
- **Pages**: **77** as of 2026-08-21, the three funnel pages included.

### Pages relevant to this engagement

| Page | Id | State |
| :--- | :--- | :--- |
| `ads-landing-pages/emergency-dentist` | `6a875326a493a891fd87d30a` | Live on the custom domain |
| `ads-landing-pages/emergency-dentist-consult` | `6a87561bee07bd22cd8998cb` | Live on the custom domain |
| `ads-landing-pages/emergency-dentist-thank-you` | `6a875664e0d205ff3cbd0121` | Live on the custom domain |
| `dental-emergency` | `69c3f921a248aaccdd562b79` | The practice's **own** emergency page, predating this engagement. Not ours — do not edit |

> [!CAUTION]
> **The funnel serves on the custom domain, not only on staging.** Anything published is public to
> paid traffic. Publish to the Webflow subdomain to gate a change
> (`publishToWebflowSubdomain: true`, `customDomains: []`); publishing to `marveldentaldds.com` is
> the user's call, never the agent's.

> [!CAUTION]
> **The client publishes this site too.** `lastPublished` moved on 2026-08-21 without us, and the
> footer copy on the served pages had been edited in the Designer since our last build. Read the
> published HTML before assuming the local build is what is live, and never re-render a whole page
> over live edits.

> [!CAUTION]
> **Four other sites in the workspace carry the Marvel name** (`Marvel Dental`, `… v2`, `… v3`,
> `Copy of … v2`) and are old iterations sitting in scratch and archive folders. Match on the site
> ID above, never on the display name.

## Version Control

Per [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Keep the site ID row here and in
[the Brandklout client registry](../../docs/mcp-access.md) identical.
