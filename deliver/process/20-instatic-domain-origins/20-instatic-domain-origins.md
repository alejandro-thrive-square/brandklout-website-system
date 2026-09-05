# Workflow: 20 - Instatic Domain & Admin Origins

## Client-Facing Overview
When a client's real domain goes live, their team should reach the site editor at their own address — `drnahlah.com/admin`, `masonparkdental.com/admin` — log in, edit and save. This module is the step that makes that true, and the check that proves it before anyone is given a link.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the origin model, the checker or `sites.json` must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../PROCESS_INDEX.md). `sites.json` must be re-verified with `node check-origins.mjs --all` in the same commit that changes it.

## Operational Purpose

Instatic's admin refuses any state-changing request whose `Origin` header is not on a configured list. Get the domain cutover half-right — DNS moved, `PUBLIC_ORIGIN` not updated — and you produce the worst possible failure shape:

**The login page at the new domain looks completely fine.** It renders, it takes an email and a password — and then the login itself is refused with `403 Forbidden: invalid origin`. Nobody gets in at all. The message reads exactly like a permissions or password problem and is neither, and nothing in the UI says "you are at the wrong address".

That has already happened here, and the cost is not the 403 — it is the hour someone spends looking at user permissions, then at the plugin, then at the session, before anyone thinks about the hostname in the address bar.

So this module exists to answer one question, out loud, before a link is ever sent:

> **From which addresses can a person actually LOG IN TO and use this site's admin?**

## The one command

```bash
cd deliver/process/20-instatic-domain-origins

node check-origins.mjs --all                  # every site in sites.json
node check-origins.mjs https://client.com     # any site, registry or not
```

It **sends no credentials, no cookie, and changes nothing**, so anyone on the team can run it against any site at any time. Give it to whoever is about to send the link.

Output is the answer, not a diagnosis to interpret:

```
mason-park — https://mason-park.up.railway.app
  OK        https://mason-park.up.railway.app          serves the admin AND is an allowed origin
  TRAP      https://www.masonparkdental.com            serves the login page but REFUSES THE LOGIN — 403 invalid origin

  GIVE THIS LINK:  https://mason-park.up.railway.app/admin
```

**`TRAP` is the line that matters.** It means that host serves a perfectly normal-looking login page and then refuses the login. Those are the hosts that get pasted into Slack by accident.

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
4. **Redeploy, and confirm a new deployment actually appeared.** `resolvePublicOrigins()` runs once at boot
   (`server/index.ts:17-19`), so an env change with no restart does nothing. `railway variables --set`
   normally triggers the deploy for you — but Mason Park's earlier change proves it does not always,
   so check: `railway deployment list --service "<Service>"` must show a NEW entry, newer than your edit.
5. **Update `sites.json`** in this folder: set `adminUrl` to the new canonical domain, and list any host you expect people to still have bookmarked under `alternates`.
6. **Prove it against the RUNNING server**: `node check-origins.mjs --all`. Every host must read `OK`,
   **zero `TRAP` lines**, exit 0. Do not substitute "I checked the variable in Railway" — Mason Park's
   variable read correctly for a day while the running container ignored it.
7. **Update the client's `[<client>]` section in `~/.webzite/.env`**, then re-run `node scripts/env-sync.mjs` in their worktree — `INSTATIC_BASE_URL` must be an origin that passes the gate, or the whole `18-instatic-embeds` toolkit starts failing with 403s that look like permissions. Editing the worktree `.env` directly does not survive the next sync.
8. **Only now** send the link, and send the one the checker printed.

## Read the live value: you have Railway CLI access

The Railway CLI on this machine is authenticated against workspace **Brandklout**, which holds one
*project per client* (not one project with many services):

| Client | Project id | Service |
|---|---|---|
| Dr. Nahlah | `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5` | `Dr Nahlah` |
| Mason Park | `e4a73ef0-64a3-48e5-b3c3-b2ea60737acc` | `Mason Park` |

```bash
railway link -p <projectId> -s "<Service>" -e production
railway variables --service "<Service>" --json     # PRINTS EVERY SECRET - filter before showing anyone
railway variables --set "PUBLIC_ORIGIN=..." --service "<Service>"   # auto-triggers a redeploy
railway deployment list --service "<Service>"      # confirm a NEW deployment actually appeared
```

> [!CAUTION]
> `railway variables --json` dumps **every** variable including `DATABASE_URL` and
> `INSTATIC_SECRET_KEY`. Filter to the keys you need before putting output anywhere a human
> will read it.

**Reading the variable is not the same as knowing the running config**, and that distinction is
the whole reason the checker exists. See the Mason Park case below.

## Current state — 2026-08-28, both FIXED

Both sites were repaired on 2026-08-28. `node check-origins.mjs --all` exits 0.

| Client | Send this | Also works |
|---|---|---|
| Dr. Nahlah | `https://www.drnahlah.com/admin` | `encorercm.com`, `www.encorercm.com`, `dr-nahlah.up.railway.app` |
| Mason Park | `https://www.masonparkdental.com/admin` | `mason-park.up.railway.app` |

Live values now:

```
# Dr. Nahlah   (was: the first three only)
PUBLIC_ORIGIN=https://encorercm.com,https://www.encorercm.com,https://dr-nahlah.up.railway.app,https://www.drnahlah.com,https://drnahlah.com

# Mason Park   (was: https://masonparkdental.com alone)
PUBLIC_ORIGIN=https://www.masonparkdental.com,https://masonparkdental.com,https://mason-park.up.railway.app
```

### What each site had actually gone wrong — two different failures

**Dr. Nahlah — set once, never extended.** `PUBLIC_ORIGIN` already held
`encorercm.com,www.encorercm.com,dr-nahlah.up.railway.app` from a fix on **2026-08-18**, recorded in
[`dr-nahlah/docs/runbook/2026-08-18-latest-completed-instatic-admin-403s-csrf-origin.md`](../../brandklout/dr-nahlah/docs/runbook/2026-08-18-latest-completed-instatic-admin-403s-csrf-origin.md). That entry diagnosed this exact class of bug (editor stuck
"reconnecting", cannot sign out, new user cannot log in — all one origin check) and even wrote down
the rule: *"Adding a custom domain in Railway does not update `PUBLIC_ORIGIN`, and `www` is a
separate domain."* Then `drnahlah.com` went live on 2026-08-25 and was not appended. **The knowledge
existed and the failure happened anyway, because it lived in one worktree's runbook instead of in a
process anyone hits at cutover time.** That is what this module is for.

**Mason Park — set, but never applied.** `PUBLIC_ORIGIN` was `https://masonparkdental.com`, and it
was wrong twice over:

1. the **apex has no DNS record** (`ENOTFOUND`) — everyone reaches the site at `www.`, a different
   origin, which was not listed;
2. it **had never taken effect**. The live server rejected `masonparkdental.com` (the configured
   value) while accepting `mason-park.up.railway.app` (not in the variable at all) — the container
   was still running its boot-time derived value. Last deployment predated the variable change, so
   the setting had been sitting there inert.

> [!IMPORTANT]
> Mason Park is the case that proves reading the dashboard is not enough. The variable *looked*
> configured. Only probing the **running server** showed that the value in effect was something
> else entirely. Always finish with `check-origins.mjs`, never with "I checked Railway".

### The redeploy, measured

`railway variables --set` **does** auto-trigger a redeploy — observed on both sites. Mason Park's
earlier change evidently did not, so confirm a new deployment appears rather than assuming.

Downtime, measured by polling the public site once a second through both deploys:

| Site | Failed samples | Outage |
|---|---|---|
| Mason Park | 2 of 58 | ~5–10 s |
| Dr. Nahlah | 1 of 24 | ~5 s |

There is no zero-downtime rollover, and there cannot be: **a Railway volume mounts to one container
at a time**, so the old container must stop before the new one starts. Both services keep all state
on that volume — SQLite at `DATABASE_URL` under `/app/storage`, uploads at `/app/storage/uploads`,
and the published version history — so a restart loses **no data**. What it does lose is unsaved
in-browser editor state: the collab socket drops. Do not redeploy while someone is mid-edit.

> [!WARNING]
> **Both services run `ghcr.io/corebunch/instatic:latest`, unpinned.** A redeploy re-pulls that tag,
> so if upstream publishes a new version a routine origin change silently becomes a platform
> upgrade. Checked 2026-08-28: `latest` and `0.0.16` both resolve to
> `sha256:d940465d…f623fcbe`, and `0.0.16` is the newest tag published — so today it is a no-op.
> That is luck, not design. **Pin by digest**, and use `railway redeploy` *without* `--from-source`
> to re-run the existing deployment rather than pulling the tag again.

## Gotchas

- **A variable that reads correctly in Railway may not be the one in force.** `resolvePublicOrigins()` runs once at boot, so the dashboard shows intent and the running process shows reality. Mason Park sat for a day with a correct-looking value that had never been applied. The checker probes the running server; that is the only proof.
- **`railway variables --json` prints every secret**, `DATABASE_URL` and `INSTATIC_SECRET_KEY` included. Filter before pasting output anywhere.
- **There is no zero-downtime redeploy on these services, by construction.** A Railway volume mounts to one container at a time, so the old one must stop first. Measured 2026-08-28: ~5-10s on Mason Park, ~5s on Dr. Nahlah. No data is lost (all state is on the volume) but unsaved editor state is - do not redeploy while someone is mid-edit.
- **The image tag is unpinned (`:latest`).** A redeploy re-pulls it, so an origin change can silently become a platform upgrade. `railway redeploy` without `--from-source` re-runs the existing deployment instead. Pin by digest.
- **A trap host is indistinguishable from a working one until someone submits the login form.** The gate applies to state-changing requests, and **logging in is one of them** — so the failure lands at the login POST, not later. Everything up to pressing the button looks right. That is fail-fast and therefore the good case: no half-saved state, no silent data loss. It just does not look like an origin problem to the person hitting it.
- **`www` is not implied.** See the warning above. Half the traps in this system will be a missing `www` entry.
- **An env change without a redeploy does nothing.** The list is read once at boot.
- **Scripts do not reproduce the bug.** Anything sending no `Origin` header — curl, our own toolkit — passes the gate unconditionally. A green scripted run says nothing about whether a *person in a browser* can save. Only this checker, which sets `Origin` deliberately, or a real human test.
- **Do not "fix" a 403 by removing the platform host from `PUBLIC_ORIGIN`.** The `18-instatic-embeds` toolkit points at it via `INSTATIC_BASE_URL`; dropping it breaks every install and gate.
- **The apex may not resolve even when `www` does.** Mason Park's does not. Check both rather than assuming the pair.
- **An apex that 301s to `www` is not the host to fix.** The browser follows the redirect and then sends `www` as its `Origin`, so `www` is what must be listed. `drnahlah.com` does exactly this. The checker reports a `redirect` row naming the destination rather than pretending the apex passed or failed.
- **Never paste a suggested `PUBLIC_ORIGIN` over the existing one.** The checker only knows the hosts it was given, so its suggestion cannot include a platform host or an old domain it never saw. Merge; dropping the `<app>.up.railway.app` entry silently breaks `INSTATIC_BASE_URL` and every script in `18-instatic-embeds`.
- **This is not the embed origin allowlist.** Three different things in this system are called "origin": `PUBLIC_ORIGIN` (gates the **admin**, set on the host), `INSTATIC_BASE_URL` (which site our **toolkit** talks to, per-worktree `.env`), and the frame/script/connect origins in the Embed Origins plugin settings (what a **published page** may load — [18-instatic-embeds](../18-instatic-embeds/18-instatic-embeds.md)). Changing one never affects the others.

## Technical Setup

- **Executor status**: Working. `check-origins.mjs` is the executor; `20-instatic-domain-origins.py` is a thin orchestrator over it, in the same spirit as `18-instatic-embeds`.
- **Credentials**: none. Deliberately — the whole point is that anyone can run it.
- **Endpoints**: `GET /admin/login` (is there an admin here), `POST /admin/api/cms/plugins/inspect-package` (which gate rejects first). If a future Instatic build removes the plugin routes, the probe returns `unknown` with the status rather than guessing, and `PROBE_PATH` needs pointing at another state-changing admin route.
- **Where `PUBLIC_ORIGIN` lives**: the Instatic instance's own hosting environment (Railway today), **not** this repository. Nothing here can set it.

## Output Artifacts
- `check-origins.mjs` — the checker. No credentials, changes nothing, exits non-zero on any problem
- `sites.json` — canonical admin URL per client: the single answer to "what link do I send?"
- `20-instatic-domain-origins.py` — orchestrator (`check`, `cutover`)
- `TRIGGER_PROMPT.txt` — the agent entry point

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). `check-origins.mjs`, `sites.json` and this `.md` are committed. `sites.json` holds no secrets — hostnames only; credentials stay in `~/.webzite/.env` and reach a worktree only through the generated `.env`.
