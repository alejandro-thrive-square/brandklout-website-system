# Workflow: 20 - Instatic Domain & Admin Origins

## Client-Facing Overview
When a client's real domain goes live, their team should reach the site editor at their own address — `drnahlah.com/admin`, `masonparkdental.com/admin` — log in, edit and save. This module is the step that makes that true, and the check that proves it before anyone is given a link.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the origin model, the checker or `sites.json` must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../PROCESS_INDEX.md). `sites.json` must be re-verified with **both** `node check-origins.mjs --all` and `node check-dns.mjs` in the same commit that changes it.

## Operational Purpose

Instatic's admin refuses any state-changing request whose `Origin` header is not on a configured list. Get the domain cutover half-right — DNS moved, `PUBLIC_ORIGIN` not updated — and you produce the worst possible failure shape:

**The login page at the new domain looks completely fine.** It renders, it takes an email and a password — and then the login itself is refused with `403 Forbidden: invalid origin`. Nobody gets in at all. The message reads exactly like a permissions or password problem and is neither, and nothing in the UI says "you are at the wrong address".

That has already happened here, and the cost is not the 403 — it is the hour someone spends looking at user permissions, then at the plugin, then at the session, before anyone thinks about the hostname in the address bar.

So this module exists to answer one question, out loud, before a link is ever sent:

> **From which addresses can a person actually LOG IN TO and use this site's admin?**

## The two commands

There are two independent ways this breaks, so there are two checks. Run both.

```bash
cd deliver/process/20-instatic-domain-origins

node check-origins.mjs --all                  # THE GATE: who can actually log in
node check-origins.mjs https://client.com     # any site, registry or not

node check-dns.mjs                            # THE POINTER: does the domain still reach us
```

`check-origins.mjs` **sends no credentials, no cookie, and changes nothing**, so anyone on the team can run it against any site at any time. Give it to whoever is about to send the link.

`check-dns.mjs` is read-only too, but needs `railway login` — see [The DNS pointer](#the-dns-pointer-what-changes-it-and-what-does-not) for why nothing credential-free can answer that question.

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

## The DNS pointer: what changes it, and what does not

This is a **second, independent** way for the same site to break, and it does not
look like the origin bug at all. `PUBLIC_ORIGIN` decides who may *log in*. The DNS
pointer decides whether anyone reaches the server *at all*. Get the pointer wrong and
there is no login page to be refused from — the domain simply stops resolving to
anything of ours.

```bash
node check-dns.mjs               # every site: recorded target vs. Railway vs. the world
node check-dns.mjs mason-park    # one client
node check-dns.mjs --record      # print Railway's current targets in sites.json shape
```

### Railway mints a random target per domain

Adding a custom domain in Railway does not give you `<app>.up.railway.app`. It mints a
**fresh eight-character host, one per domain**, and that is what DNS must point at:

| Domain | Railway wants |
|---|---|
| `masonparkdental.com` | `@` -> `l6wotb3m.up.railway.app` |
| `www.masonparkdental.com` | `www` -> `pkez8lkn.up.railway.app` |
| `drnahlah.com` | `@` -> `3dz0c6o1.up.railway.app` |
| `www.drnahlah.com` | `www` -> `msrhxbm8.up.railway.app` |
| `encorercm.com` | `@` -> `ekr06qos.up.railway.app` |
| `www.encorercm.com` | `www` -> `1dsz1ru0.up.railway.app` |

They are unrelated to each other and unrelated to the service domain. **The apex's target
is not the `www` target.** Reading one off the dashboard and using it for both is a real
and easy mistake — it happened here on 2026-08-29 — and it is nearly invisible, because
Railway's edge routes on the `Host` header and will happily serve the site through the
wrong target anyway. Railway even reports `Verified: yes` for a domain whose record points
at a *sibling* domain's target, so its own dashboard will not flag it either. Fix it
because it is wrong, not because you can see a symptom.

> [!IMPORTANT]
> **A redeploy does not change the target.** That belief is the wrong lesson to draw
> from the 2026-08-28 outage, and acting on it means re-checking Cloudflare after every
> deploy forever while the actual trigger goes unguarded.
>
> The evidence, from `railway domain status`:
>
> | | domain created | target | deploys since | target now |
> |---|---|---|---|---|
> | `encorercm.com` | 2026-08-14 | `ekr06qos` | many, incl. the 2026-08-18 and 08-28 origin fixes | `ekr06qos` — unchanged |
> | `drnahlah.com` | 2026-08-25 | `3dz0c6o1` | incl. 2026-08-28 | `3dz0c6o1` — unchanged |
> | `www.masonparkdental.com` | 2026-08-28 08:41 | `pkez8lkn` | the 2026-08-28 **18:29** deploy | `pkez8lkn` — unchanged |
>
> Mason Park's own domains survived a redeploy ten hours later with their `Updated`
> timestamps still reading 08:42. A deploy does not touch them.

### What does change it: deleting and re-adding the domain

The target is minted when the **domain record** is created and lives as long as that
record. Remove the domain in Railway and add it back — for any reason, including
"it looked broken so I recreated it" — and you get a **new random target**. The old one
now belongs to nobody. DNS still points at it. The site is down, and nothing anywhere
says why.

That is what happened to Mason Park. All of it inside three minutes on 2026-08-28:

```
08:39:21  Cloudflare custom WAF rule created on masonparkdental.com
08:41:02  new Railway service domain  mason-park-production.up.railway.app
08:41:21  masonparkdental.com      re-created in Railway -> new target l6wotb3m
08:41:47  www.masonparkdental.com  re-created in Railway -> new target pkez8lkn
```

**So the rule is not "update Cloudflare after every redeploy". It is:**

> **Never delete a custom domain in Railway.** Changing `PUBLIC_ORIGIN`, changing the
> admin route, upgrading the image, restarting — none of these require touching the
> domain, and none of them move the pointer. If a domain genuinely must be re-added,
> that is a **DNS cutover**, not a redeploy: read the new target with
> `railway domain status`, change Cloudflare, and re-verify before walking away.

### What `check-dns.mjs` can and cannot see

`sites.json` now records the expected target per host, so drift is detectable at all.
The check has three independent sources and is honest about which ones answered:

| Source | Answers | Needs |
|---|---|---|
| `railway domain status` | what the target **should** be | `railway login` |
| system DNS | whether the host resolves **at all** | nothing |
| Cloudflare API | what the record **actually holds** | a token with Zone -> DNS -> Read |

> [!WARNING]
> **Public DNS cannot see a proxied record's target.** An orange-clouded record answers
> with Cloudflare's own IPs and never reveals its CNAME content, so `www` pointing at the
> *apex's* target is indistinguishable from `www` pointing at the right one. Only the
> Cloudflare API closes that gap.
>
> **Closed 2026-08-30.** `CLOUDFLAREDIAGNOSIS` in the repo `.env` is a read-scoped token
> that can read `dns_records`, and `check-dns.mjs` prefers it. It immediately caught what
> nothing else could see: `www.masonparkdental.com` pointing at the **apex's** target.
> The older `CLOUDFLAREAPI` still returns `Authentication error` on `dns_records`, so it is
> tried last and must never shadow the working one. Oddity worth knowing: the new token
> fails `/user/tokens/verify` while working fine on every endpoint we actually use — do not
> add a verify call as a gate.

## The standardized cutover

Run this whenever a domain is pointed at an Instatic site — a launch, a re-point, adding `www`, or moving hosts.

1. **Before touching DNS**, record the platform host (`<app>.up.railway.app`). It must survive the change: it is the toolkit's way in and the fallback when the domain misbehaves.
2. **Add the domain in Railway** (the service → Networking → custom domain), apex *and* `www`, or decide deliberately that only one exists — then **read back the target Railway minted for each one**, separately:
   ```bash
   railway domain status masonparkdental.com     --service "Mason Park" --environment production
   railway domain status www.masonparkdental.com --service "Mason Park" --environment production
   ```
   **Point each Cloudflare record at its own domain's target.** They differ. The apex's target on the `www` record is a real failure mode, and Railway will not warn you about it — it reports `Verified: yes` either way, because its edge routes on `Host`.
3. **Record the targets in `sites.json`** under `dns`, so the next person can tell a changed pointer from a working one: `node check-dns.mjs --record` prints them in the right shape. Record only *after* Cloudflare matches — recording first just files the outage as expected.
4. **Set `PUBLIC_ORIGIN`** on the Instatic service, comma-separated, **client domain first, platform host last**:
   ```
   PUBLIC_ORIGIN=https://www.client.com,https://client.com,https://<app>.up.railway.app
   ```
   Include every host a human might use. Omitting one does not warn you; it produces a trap.
5. **Redeploy, and confirm a new deployment actually appeared.** `resolvePublicOrigins()` runs once at boot
   (`server/index.ts:17-19`), so an env change with no restart does nothing. `railway variables --set`
   normally triggers the deploy for you — but Mason Park's earlier change proves it does not always,
   so check: `railway deployment list --service "<Service>"` must show a NEW entry, newer than your edit.
   **This step does not touch the domains.** If you are here because a domain looks broken, do not
   "fix" it by deleting and re-adding it — that mints new targets and takes the site down for real.
6. **Update `sites.json`** in this folder: set `adminUrl` to the new canonical domain, list any host you expect people to still have bookmarked under `alternates`, and keep the `dns` targets from step 3 current.
7. **Prove BOTH, against reality rather than the dashboard**:
   ```bash
   node check-dns.mjs        # the pointer: Railway vs. sites.json vs. what resolves
   node check-origins.mjs --all   # the gate: probed on the RUNNING server
   ```
   Both must exit 0. Every host `OK`, zero `TRAP`, zero `CHANGED`. Do not substitute "I checked the
   variable in Railway" — Mason Park's variable read correctly for a day while the running container
   ignored it. A `BLOCKED` row is not a pass either: it means a CDN answered instead of the origin
   and that host was never actually tested.
8. **Update the client's `.env`** in their worktree — `INSTATIC_BASE_URL` must be an origin that passes the gate, or the whole `18-instatic-embeds` toolkit starts failing with 403s that look like permissions.
9. **Only now** send the link, and send the one the checker printed.

## The Cloudflare geo-block, and the two things it silently breaks

Several of these zones carry a Cloudflare custom WAF rule that blocks every request
from outside the United States:

```
[block]  "Geography-based rule [Template]"
(ip.src.country ne "US") or (not ip.src.country in {"US"})
```

Present on `masonparkdental.com` (added 2026-08-28 08:39 UTC) and `encorercm.com`
("Block None US Traffic", 2026-08-18). Absent on `drnahlah.com`. For a Katy dentist that
is a defensible choice, and this module does not argue with it. But it has two
consequences nobody signed up for, and both are invisible until something is already
broken.

**1. It blocks our own verification.** `check-origins.mjs` runs from wherever you are.
Outside the US it gets Cloudflare's block page, not the admin — and before 2026-08-29 it
reported that as `no admin ... (http 403)` and still exited 0. `www.masonparkdental.com`
read as a clean pass while the checker had never once reached the server. It now reports
`BLOCKED` and exits non-zero, because *not having looked* must never render as *looked
and fine*.

**2. It blocks certificate issuance.** ACME validates from multiple vantage points around
the world, and the non-US ones are blocked like anything else. The correlation is exact:

| Zone | Geo rule | Domain added | Railway certificate |
|---|---|---|---|
| `drnahlah.com` | none | 2026-08-25 | `VALID` |
| `encorercm.com` | added 2026-08-18 | 2026-08-14 — **before** the rule | `VALID` |
| `masonparkdental.com` | added 2026-08-28 08:39 | 2026-08-28 08:41 — **after** the rule | `ISSUE_FAILED` |

Mason Park's pair — the only domains here added *after* their zone's rule existed — are
the only ones that cannot get a certificate. Confirmed directly: connecting to either
Railway target with SNI `www.masonparkdental.com` fails the TLS handshake with
`SEC_E_WRONG_PRINCIPAL`, i.e. Railway is not serving a certificate for that name.

The padlock the public sees is therefore **Cloudflare's, not Railway's**, and it holds
only while Cloudflare is proxying in a mode that does not verify the origin certificate.
Grey-clouding the record, or moving the zone to **Full (strict)**, would break the site.
That has not been verified from here — the WAF rule blocks this machine before any
request reaches the origin, and the repo's Cloudflare token cannot read
`/zones/<id>/settings/ssl` — so treat it as the shape of the risk and check the zone's
SSL mode in the dashboard before changing anything about the proxy.

**Proven, not inferred** (2026-08-30): the rule's expression is
`(ip.src.country ne "US") or (not ip.src.country in {"US"})` with **no path condition**, and
`http(s)://www.masonparkdental.com/.well-known/acme-challenge/test` returns **403** from a
non-US client while the same path at the Railway origin returns a clean 404. ACME
validation is simply blocked at the edge.

**To add a domain to a zone that has this rule**, disable the rule — or, better, put an
`skip`/allow rule ABOVE it for `http.request.uri.path contains "/.well-known/acme-challenge/"`
so renewals never hit this again — until `railway domain status` reports
`CERTIFICATE_STATUS_TYPE_VALID`, then restore it. Certificates renew, so a one-off manual
lift is a trap you will fall into again in ~60 days.

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

## Current state — 2026-08-29: origins fixed, Mason Park's DNS is NOT

`PUBLIC_ORIGIN` was repaired on both sites on 2026-08-28 and has stayed correct. What is
open is the layer underneath it, on Mason Park only.

| Client | Send this | Also works | DNS |
|---|---|---|---|
| Dr. Nahlah | `https://www.drnahlah.com/admin` | `encorercm.com`, `www.encorercm.com`, `dr-nahlah.up.railway.app` | clean — all four targets match, certs `VALID` |
| Mason Park | `https://www.masonparkdental.com/admin` | `mason-park.up.railway.app` | **two open faults, below** |

**Mason Park, as of 2026-08-29:**

1. **FIXED during this session — the apex now resolves.** `masonparkdental.com` returned
   `ENODATA` (no record at all) for the whole day; an apex record was added and it now
   answers. Both hosts resolve.
2. **OPEN — `www` points at the apex's target.** Cloudflare holds
   `www CNAME l6wotb3m.up.railway.app`, which is the **apex's** target; `www` wants
   `pkez8lkn.up.railway.app`. Confirmed against the Cloudflare API on 2026-08-30. The site
   serves either way (Railway routes on `Host`) and Railway still says `Verified: yes`, so
   nothing surfaces this but `check-dns.mjs`.
3. **OPEN — both certificates are `CERTIFICATE_STATUS_TYPE_ISSUE_FAILED`.** The
   **demonstrated** cause is the geo-block rule, not the `www` mismatch: the rule carries no
   path exemption, so `/.well-known/acme-challenge/…` returns **403 through Cloudflare** to
   any non-US client, and ACME validates from non-US vantage points. Verified 2026-08-30.
   Fixing the `www` record alone will probably not issue the certificate.

The two records Cloudflare should hold (`masonparkdental.com` zone, both proxied):

| Name | Type | Content |
|---|---|---|
| `@` | CNAME | `l6wotb3m.up.railway.app` |
| `www` | CNAME | `pkez8lkn.up.railway.app` |

Done when `node check-dns.mjs mason-park` exits 0 and both certificates read
`CERTIFICATE_STATUS_TYPE_VALID`.

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
`bk-dr-nahlah/.claude/RUNBOOK.md`. That entry diagnosed this exact class of bug (editor stuck
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

- **A redeploy does not move the DNS pointer; deleting and re-adding the domain does.** Two weeks of Dr. Nahlah deploys left every target untouched. Mason Park's targets changed the minute its domains were re-created. Never delete a custom domain in Railway to "reset" it — that is the outage, not the fix.
- **Each custom domain gets its OWN random target, and the apex's is not the `www` one.** Mason Park currently has `www` pointing at the apex's target. It still serves, because Railway's edge routes on `Host`, and **Railway still reports `Verified: yes`** — so neither the site nor the dashboard shows anything wrong. Only `check-dns.mjs` comparing the two does. A working site is not evidence the pointer is right.
- **Public DNS cannot verify a Cloudflare-proxied record.** The proxy answers with its own IPs and never reveals the CNAME content, so a mis-pointed record looks exactly like a correct one. Only the Cloudflare API can tell them apart, and the repo's `CLOUDFLAREAPI` token cannot read `dns_records` — a scoped token is the missing piece.
- **A geo-block rule blocks our checkers and ACME as well as visitors.** The non-US block on `masonparkdental.com` and `encorercm.com` returns Cloudflare's 403 to `check-origins.mjs`, and blocks certificate validation from non-US vantage points. A `BLOCKED` row means nothing was learned about that host — it is not a pass and it is not a failure.
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

- **Executor status**: Working. Two executors: `check-origins.mjs` (the gate — who can log in) and `check-dns.mjs` (the pointer — whether anyone arrives). `20-instatic-domain-origins.py` is a thin orchestrator over both, in the same spirit as `18-instatic-embeds`.
- **Credentials**: `check-origins.mjs` needs none, deliberately — the whole point is that anyone can run it. `check-dns.mjs` needs `railway login`, because a Cloudflare-proxied record hides its target from the world and Railway is the only source of truth for what it should be. It optionally reads `CLOUDFLARE_DNS_TOKEN` (or the repo `.env`'s `CLOUDFLAREAPI`) to see what Cloudflare actually holds; without a token that column degrades to `not read`, never to a pass.
- **Endpoints**: `GET /admin/login` (is there an admin here), `POST /admin/api/cms/plugins/inspect-package` (which gate rejects first). If a future Instatic build removes the plugin routes, the probe returns `unknown` with the status rather than guessing, and `PROBE_PATH` needs pointing at another state-changing admin route.
- **Where `PUBLIC_ORIGIN` lives**: the Instatic instance's own hosting environment (Railway today), **not** this repository. Nothing here can set it.

## Output Artifacts
- `check-origins.mjs` — the origin gate checker. No credentials, changes nothing, exits non-zero on any problem
- `check-dns.mjs` — the DNS pointer checker: recorded target vs. Railway vs. public DNS vs. Cloudflare. Read-only; needs `railway login`
- `sites.json` — canonical admin URL per client (the single answer to "what link do I send?") and the expected CNAME target per host
- `20-instatic-domain-origins.py` — orchestrator (`check`, `dns`, `cutover`)
- `TRIGGER_PROMPT.txt` — the agent entry point

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). `check-origins.mjs`, `sites.json` and this `.md` are committed. `sites.json` holds no secrets — hostnames only; credentials stay in the per-worktree `.env`.
