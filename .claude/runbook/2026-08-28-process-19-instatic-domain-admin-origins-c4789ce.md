## 2026-08-28 — process 19: Instatic domain & admin origins (`c4789ce`, `e188a65`)

Standardized the domain-cutover / "which admin link do I send?" process. A half-done cutover
produces an admin at the new domain that logs in, opens the editor, and then 403s
`invalid origin` on the first save — which reads like a permissions problem and is not.

New module `deliver/process/20-instatic-domain-origins/`: directive, `.py` orchestrator,
`TRIGGER_PROMPT.txt`, `sites.json` (canonical admin URL per client) and **`check-origins.mjs`**.

**The checker needs no credentials** and changes nothing, so anyone on the team can run it:

```bash
cd deliver/process/20-instatic-domain-origins
node check-origins.mjs --all               # every site in sites.json
node check-origins.mjs https://client.com  # any site
```

It works because the CSRF origin gate runs BEFORE authentication: an unauthenticated POST
returns 403 `invalid origin` if the ORIGIN was rejected, 401 if it got through. **401 is the
pass.** It prints GIVE THIS LINK, flags TRAP hosts, and exits non-zero while any remain.

### Both live sites have their own brand domain as a TRAP

| Client | Send today | The trap |
| --- | --- | --- |
| Dr. Nahlah | `https://encorercm.com/admin` | `drnahlah.com` 301s to `www.drnahlah.com`, which serves the admin and is rejected |
| Mason Park | `https://mason-park.up.railway.app/admin` | `www.masonparkdental.com`, same shape |

**Do not send `drnahlah.com/admin` or `masonparkdental.com/admin` to anyone** — they can log in
and then cannot save. Neither is fixable from this repo: `PUBLIC_ORIGIN` lives on the Instatic
service in Railway. The values to **merge** (never paste over) are in the directive's
"Current state" section.

Dr. Nahlah's Railway subdomain is **not recorded anywhere in the repo** (audited across all file
types) — only "project Brandklout, service Dr Nahlah". Whoever edits that env var must read the
platform host off Railway and keep it in the list.

### Mechanism, read from the v0.0.16 source rather than guessed

`resolvePublicOrigins()` (`server/config.ts`) takes `PUBLIC_ORIGIN` as a COMMA-SEPARATED list,
else derives from `RENDER_EXTERNAL_URL` / `RAILWAY_PUBLIC_DOMAIN`. `originAllowed()`
(`server/auth/security.ts`) allows a state-changing request with **no `Origin` header at all**
(curl, our toolkit), or one whose origin is in that list. Exact string compare on
`scheme://host[:port]`; **nothing about `www` is implied**. The first entry is canonical
(`expectedOrigin`, and `publicOriginIsHttps` for secure cookies).

### Also fixed here

- `18-instatic-embeds` was never registered in `PROCESS_INDEX.md` despite its own Integrity Rule.
  Both 18 and 19 are listed now, with a note that neither is offer-routed.
- `09-launch` knew only Webflow and Vercel as publishing targets. It now names Instatic and folds
  the origin step into "connect the custom domain" — exactly where it was silently missing.
- `18-instatic-embeds` gained a table separating the three things here called "origin".

### Gotchas

- **Scripts cannot reproduce this bug.** Anything sending no `Origin` header passes the gate
  unconditionally, so a green scripted run says nothing about whether a person in a browser can
  save. Only the checker (which sets `Origin` deliberately) or a real human test.
- **An apex that 301s to `www` is not the host to fix** — the browser follows and then sends
  `www` as its origin, so `www` is what must be listed.
- **Never paste the checker's suggested `PUBLIC_ORIGIN` over the existing value.** It only knows
  the hosts it was handed, so it cannot include a platform host it never saw; dropping that
  breaks `INSTATIC_BASE_URL` and all of `18-instatic-embeds`. The output says MERGE every time.
- **An env change needs a redeploy** — the list is read once at boot.
- **Do not build markdown with backticks inside a double-quoted `python -c "..."` in bash.** The
  shell command-substitutes them before Python sees the string. It corrupted this runbook once
  today. Write the file with the Write tool, or use a single-quoted outer string.

# Runbook — session handoff (`main`)
