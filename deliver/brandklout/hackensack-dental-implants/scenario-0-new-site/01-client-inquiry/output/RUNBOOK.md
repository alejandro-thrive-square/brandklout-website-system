# scenario-0-new-site · 01-client-inquiry · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · Instatic on Railway: production, staging, logins, plugins

Asked for: "create a new instance in Railway and upload into Instatic". Steps 3 to 6 of the
directive; the form, Asana, Termly and style-selection steps were not part of this run.

### Done

| What | Value |
| :--- | :--- |
| Railway project and service | `Hackensack Dental Implants`, project `d22e4303-f42d-4d86-a8c4-4a3dfb1f956f`, service `cc03ab51-b79e-4bb0-ad7c-c5c43a0a8099`, workspace Brandklout |
| Production | environment `134c463f-4e45-4625-8ae2-8058cbc40b69`, https://hackensack-dental-implants-production.up.railway.app, volume at `/app/storage`. Admin works; **nothing is published there** (`/` answers 404) |
| Staging | environment `07ac8577-7f3c-40bd-9b07-a0a953a9b17b`, https://hackensack-dental-implants-staging.up.railway.app, its own volume, its own `PUBLIC_ORIGIN` |
| Logins | Alejandro (owner, claimed within seconds of first boot) and Sang (admin) on both, the same logins as the other Brandklout sites |
| Plugins | embed-origins 1.8.0, open-graph 1.2.3, aeo-schema 1.2.0 on both; `plugins.mjs status` shows no parity issue |
| Origins | `check-origins.mjs` clean on both hosts |
| Credentials | `[hackensack-dental-implants]` in `~/.webzite/.env`: `RAILWAY_PROJECT_ID`, `INSTATIC_BASE_URL` (production), `INSTATIC_STAGING_URL`, `INSTATIC_PASSWORD` as a reference to the shared default. `env-sync` run |

Commands: `node tools/instatic-site/setup/provision-instance.mjs --name "Hackensack Dental Implants"`
(run through `output/code/with-setup-env.mjs`, which supplies the setup login from the master file
without printing it), then `output/code/staging-env.mjs <project> <production env> <service> "<name>"`.

### Next

1. On `main`: add the two rows to `tools/instatic-domain-origins/sites.json` and the site to
   `tools/instatic-plugins/plugins.json`. They are in this client's copies only.
2. Pin the image by digest (the provisioning script deploys `:latest`).
3. Asana project, Termly website id, and the onboarding answers that are still open
   (`docs/project-overview.md`).
4. At launch: client domain on production, `staging.<domain>` on staging, `PUBLIC_ORIGIN` on both,
   and remove the `*.up.railway.app` staging door per `staging-clone.md`.

### Gotchas

- **The project is named "Hackensack Dental Implants"**, not the full business name, so the hosts
  match the domain and the client slug.
- **Staging has no custom domain yet, so no Cloudflare rule can de-index it.** Until launch the
  page says `noindex` itself (a host-conditional line in the site script) and the Open Graph plugin
  on staging has `emitCanonical` off and `siteUrl` = the staging host.
- `staging-env.mjs` sets `PUBLIC_ORIGIN` **before** the volume and the deploy, so the first boot
  already has the right origin; `environmentCreate` had minted the service domain by itself.
- `plugins.mjs rollout` installs on a new site and then stops with "no published page could be
  fetched": its verify step needs a published page. The install itself succeeded; for production
  `install-plugin.mjs <name> --apply` is the quieter route.
- `railway ssh` fails now and then with "error decoding response body". Retry; every call here was
  idempotent.
- Sang's account is copied as a password hash from Mason Park over `railway ssh` and `bun:sqlite`,
  with a `user.create` audit row. The hash never touched this repo; the scratch copy was deleted.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
