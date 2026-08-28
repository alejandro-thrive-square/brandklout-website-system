# Workflow: 19 - Instatic Domain & Admin Origins

## Client-Facing Overview
When a client's real domain goes live, their team should reach the site editor at their own address — `drnahlah.com/admin`, `masonparkdental.com/admin` — log in, edit and save. This module is the step that makes that true, and the check that proves it before anyone is given a link.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the origin model, the checker or `sites.json` must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../PROCESS_INDEX.md). `sites.json` must be re-verified with `node check-origins.mjs --all` in the same commit that changes it.

## Operational Purpose

Instatic's admin refuses any state-changing request whose `Origin` header is not on a configured list. Get the domain cutover half-right — DNS moved, `PUBLIC_ORIGIN` not updated — and you produce the worst possible failure shape:

**The admin at the new domain looks completely fine.** It serves the login page, it accepts the password, it renders the site, the editor opens. Then the first save returns `403 Forbidden: invalid origin`, which reads exactly like a permissions problem and is not. Nothing in the UI says "you are at the wrong address".

That has already happened here, and the cost is not the 403 — it is the hour someone spends looking at user permissions, then at the plugin, then at the session, before anyone thinks about the hostname in the address bar.

So this module exists to answer one question, out loud, before a link is ever sent:

> **From which addresses can a person actually SAVE in this site's admin?**

## The one command

```bash
cd deliver/process/19-instatic-domain-origins

node check-origins.mjs --all                  # every site in sites.json
node check-origins.mjs https://client.com     # any site, registry or not
```

It **sends no credentials, no cookie, and changes nothing**, so anyone on the team can run it against any site at any time. Give it to whoever is about to send the link.

Output is the answer, not a diagnosis to interpret:

```
mason-park — https://mason-park.up.railway.app
  OK        https://mason-park.up.railway.app          serves the admin AND is an allowed origin
  TRAP      https://www.masonparkdental.com            serves the admin but is REJECTED as a foreign origin — saving will 403

  GIVE THIS LINK:  https://mason-park.up.railway.app/admin
```

**`TRAP` is the line that matters.** It means that host serves a working-looking admin that cannot save. Those are the hosts that get pasted into Slack by accident.

## Why it needs no credentials

The server checks the origin **before** it checks authentication (`server/auth/security.ts`), so an unauthenticated POST already separates the two:

| Response | Meaning |
|---|---|
| `403 {"error":"Forbidden: invalid origin"}` | the **origin** was rejected |
| `401 {"error":"Unauthorized"}` | origin accepted, auth stopped it — **this is the pass** |

A 401 is the good answer: it means a logged-in person on that host would have been let through. The probe posts to `/admin/api/cms/plugins/inspect-package` with no session and no file, which does nothing at all.

## What the server actually compares against

`resolvePublicOrigins()` in `server/config.ts`:

```
PUBLIC_ORIGIN set?  ->  a COMMA-SEPARATED list, used verbatim
otherwise           ->  derived from RENDER_EXTERNAL_URL and/or RAILWAY_PUBLIC_DOMAIN
```

`originAllowed()` in `server/auth/security.ts` then allows a state-changing request when:

1. it carries **no `Origin` header at all** — curl, server-to-server. (This is why the `18-instatic-embeds` toolkit works, and why a script is never the thing that catches this bug.)
2. its origin equals `publicOrigins[0]`, the canonical one, **or**
3. its origin is any other entry in the list, **or**
4. it is in the dev allowlist.

> [!WARNING]
> Matching is an **exact string compare** on `scheme://host[:port]`, after lowercasing and dropping a trailing slash. `normalizeOrigin` does **nothing** about `www`. `client.com` and `www.client.com` are two different origins and **both must be listed**. This is the single most common way this gets set wrong.

The **first** entry is canonical: it is what `expectedOrigin()` returns and it decides `publicOriginIsHttps()`, which governs secure cookie flags. Put the client's real domain first, never the platform host.

## The standardized cutover

Run this whenever a domain is pointed at an Instatic site — a launch, a re-point, adding `www`, or moving hosts.

1. **Before touching DNS**, record the platform host (`<app>.up.railway.app`). It must survive the change: it is the toolkit's way in and the fallback when the domain misbehaves.
2. **Point DNS** at the Instatic host and add the domain in the platform (Railway → the service → Networking → custom domain). Do apex *and* `www`, or decide deliberately that only one exists.
3. **Set `PUBLIC_ORIGIN`** on the Instatic service, comma-separated, **client domain first, platform host last**:
   ```
   PUBLIC_ORIGIN=https://www.client.com,https://client.com,https://<app>.up.railway.app
   ```
   Include every host a human might use. Omitting one does not warn you; it produces a trap.
4. **Redeploy.** `resolvePublicOrigins()` runs at boot — an env change with no restart does nothing.
5. **Update `sites.json`** in this folder: set `adminUrl` to the new canonical domain, and list any host you expect people to still have bookmarked under `alternates`.
6. **Prove it**: `node check-origins.mjs --all`. Every host must read `OK`. **Zero `TRAP` lines.** The command exits non-zero while any problem remains.
7. **Update the client's `.env`** in their worktree — `INSTATIC_BASE_URL` must be an origin that passes the gate, or the whole `18-instatic-embeds` toolkit starts failing with 403s that look like permissions.
8. **Only now** send the link, and send the one the checker printed.

## Current state — 2026-08-28

Both live Instatic sites have step 3 of the cutover undone, and in both cases the **client's own brand domain is the trap**. Verified with `node check-origins.mjs --all`:

| Client | Send this today | Client domain | Status |
|---|---|---|---|
| Dr. Nahlah | `https://encorercm.com/admin` | `drnahlah.com` | `encorercm.com` + `www` pass. `drnahlah.com` **301s to `www.drnahlah.com`**, which serves the admin and is **rejected** — a live trap. |
| Mason Park | `https://mason-park.up.railway.app/admin` | `masonparkdental.com` | `PUBLIC_ORIGIN` never set; falls back to `RAILWAY_PUBLIC_DOMAIN`. `www.masonparkdental.com` serves the admin and is **rejected** — a live trap. Apex does not resolve. |

> [!WARNING]
> **Do not send `drnahlah.com/admin` or `masonparkdental.com/admin` to anyone.** Both let a person log in and then fail on the first save. These are precisely the addresses a client or teammate would guess, which is why they are the ones that get sent by mistake.

Neither is fixable from this repository — `PUBLIC_ORIGIN` lives on the Instatic service in Railway. The two values to set, each **merged into** whatever is already there rather than pasted over:

```
# Dr. Nahlah  (Railway: project "Brandklout" -> service "Dr Nahlah")
PUBLIC_ORIGIN=https://encorercm.com,https://www.encorercm.com,https://www.drnahlah.com,https://drnahlah.com

# Mason Park
PUBLIC_ORIGIN=https://www.masonparkdental.com,https://mason-park.up.railway.app
```

> [!CAUTION]
> **Read the current value first and merge into it.** Dr. Nahlah's Railway subdomain is recorded nowhere in this repository — audited across every file type, the only `*.up.railway.app` host we have written down anywhere is Mason Park's. So the line above is deliberately missing it. Whoever edits that variable must read the platform host off the Railway service and keep it in the list; dropping it breaks `INSTATIC_BASE_URL` and every script in `18-instatic-embeds`.

Redeploy, then re-run the checker until it exits 0. Once Dr. Nahlah's is clean, move `adminUrl` in `sites.json` to `https://www.drnahlah.com` — the client's own domain is what their team should be using, and that field is what declares canonical.

## Gotchas

- **A trap host is indistinguishable from a working one until someone saves.** Login, navigation, and reading all work fine; only state-changing requests are checked. So "I can log in" is never evidence the link is right.
- **`www` is not implied.** See the warning above. Half the traps in this system will be a missing `www` entry.
- **An env change without a redeploy does nothing.** The list is read once at boot.
- **Scripts do not reproduce the bug.** Anything sending no `Origin` header — curl, our own toolkit — passes the gate unconditionally. A green scripted run says nothing about whether a *person in a browser* can save. Only this checker, which sets `Origin` deliberately, or a real human test.
- **Do not "fix" a 403 by removing the platform host from `PUBLIC_ORIGIN`.** The `18-instatic-embeds` toolkit points at it via `INSTATIC_BASE_URL`; dropping it breaks every install and gate.
- **The apex may not resolve even when `www` does.** Mason Park's does not. Check both rather than assuming the pair.
- **An apex that 301s to `www` is not the host to fix.** The browser follows the redirect and then sends `www` as its `Origin`, so `www` is what must be listed. `drnahlah.com` does exactly this. The checker reports a `redirect` row naming the destination rather than pretending the apex passed or failed.
- **Never paste a suggested `PUBLIC_ORIGIN` over the existing one.** The checker only knows the hosts it was given, so its suggestion cannot include a platform host or an old domain it never saw. Merge; dropping the `<app>.up.railway.app` entry silently breaks `INSTATIC_BASE_URL` and every script in `18-instatic-embeds`.
- **This is not the embed origin allowlist.** Three different things in this system are called "origin": `PUBLIC_ORIGIN` (gates the **admin**, set on the host), `INSTATIC_BASE_URL` (which site our **toolkit** talks to, per-worktree `.env`), and the frame/script/connect origins in the Embed Origins plugin settings (what a **published page** may load — [18-instatic-embeds](../18-instatic-embeds/18-instatic-embeds.md)). Changing one never affects the others.

## Technical Setup

- **Executor status**: Working. `check-origins.mjs` is the executor; `19-instatic-domain-origins.py` is a thin orchestrator over it, in the same spirit as `18-instatic-embeds`.
- **Credentials**: none. Deliberately — the whole point is that anyone can run it.
- **Endpoints**: `GET /admin/login` (is there an admin here), `POST /admin/api/cms/plugins/inspect-package` (which gate rejects first). If a future Instatic build removes the plugin routes, the probe returns `unknown` with the status rather than guessing, and `PROBE_PATH` needs pointing at another state-changing admin route.
- **Where `PUBLIC_ORIGIN` lives**: the Instatic instance's own hosting environment (Railway today), **not** this repository. Nothing here can set it.

## Output Artifacts
- `check-origins.mjs` — the checker. No credentials, changes nothing, exits non-zero on any problem
- `sites.json` — canonical admin URL per client: the single answer to "what link do I send?"
- `19-instatic-domain-origins.py` — orchestrator (`check`, `cutover`)
- `TRIGGER_PROMPT.txt` — the agent entry point

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). `check-origins.mjs`, `sites.json` and this `.md` are committed. `sites.json` holds no secrets — hostnames only; credentials stay in the per-worktree `.env`.
