# Mason Park Dental for Kids — MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Sibling client folder
[`mason-park/docs/mcp-access.md`](../../mason-park/docs/mcp-access.md) — the same practice's main
site. **A grant recorded there does not extend to this site**, and vice versa: the two brands sit
on different hosting accounts with different databases. See the boundary note below.

## Active MCP Servers

| MCP Server | Purpose | Status |
| :--- | :--- | :--- |
| `webflow-brandklout` | Webflow access for every Brandklout client. Shared instance — the site ID is the boundary, not the tool prefix. | Available, **but no Webflow site exists for this brand.** Do not write to the main site's `6a60bdc0340e5f1784b4d553` while working here. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by [`../../docs/mcp-access.md`](../../docs/mcp-access.md)
and is **read-only**.

## Non-MCP credentials in use

| Credential | Where | Scope |
| :--- | :--- | :--- |
| SiteGround SSH | repo-root `.env` (`HOSTNAME`/`USERNAME`/`PORT`) + key at `.secrets/sg_pediatric_recovery` | Shell on the `u2155-s8yzq05oaqg3` account, which hosts **this domain only** |

> [!IMPORTANT]
> **The `PRIVATEKEY` value in `.env` does not work** — it is one base64 character short and is
> passphrase-protected, and no passphrase is recorded anywhere. The working credential is the
> passphrase-less key generated on 2026-08-27 at `.secrets/sg_pediatric_recovery`, whose public
> half was installed in Site Tools. **Revoke it once the recovery is finished.** Detail in
> [`../workflows/01-site-recovery/README.md`](../workflows/01-site-recovery/README.md).

> [!CAUTION]
> **This SSH account hosts a live-compromised WordPress install.** Read
> [`security-incident-2026-08-27.md`](./security-incident-2026-08-27.md) before running anything
> against it. The standing rules: read-only unless there is a reason not to be, write only inside
> `~/recovery-tmp`, never modify the site's files or database, and never download PHP.

## Boundary

Two sites, one client, **two hosting accounts**. The SSH credential above reaches
`pediatricdentistkatytx.com` and nothing else — the main site is on a different SiteGround account
at `35.208.39.228` that we do not hold. Do not assume access to one implies access to the other,
in either direction.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
