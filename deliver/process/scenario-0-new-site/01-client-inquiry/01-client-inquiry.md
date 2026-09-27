# Scenario 0 · 01 Client Inquiry

## Purpose

Turn a signed client into a working setup: their worktree, a production Instatic site on Railway,
a staging mirror with the same logins, the plugins, an Asana project, a shared drive, and a style
direction the client picked.

## Inputs

- The onboarding form submission.
- The Asana project or task that assigns the client.

## Checklist

- [ ] Onboarding form submitted and complete
- [ ] Client worktree, `.env` section and runbook created
- [ ] Railway project with Instatic, deployed as production on `business-name.up.railway.app`
- [ ] Admin logins for Sang and Alejandro, claimed
- [ ] Staging environment mirroring production, same logins
- [ ] Plugins installed on production and staging, same versions
- [ ] Asana project with the template tasks
- [ ] Shared drive with the client, assets requested
- [ ] Termly account created, website ID recorded
- [ ] Style selection sent to the client and answered

## Steps

1. **Read the onboarding form.** It must give: business name and logo, services, locations (one row
   per office: address, phone, hours, GHL sub-account, number pool, form), meeting recordings, old
   site if any, domain registrar and DNS host, current tracking (GTM, analytics, number pools, GHL
   forms), privacy, terms and SMS consent text, brand guidelines, assets, and approval for AI images
   and stock photos. Missing answers go to `docs/open-questions.md` and back to the client.
   Two answers are **asked, never assumed**, because each reshapes every page: the **site
   language(s)** and regional variant (Alki House's brief was in English, its ledger in Spanish, and
   the site had to be Spanish, 2026-09-13), and **how a customer buys or gets in touch** (form,
   phone, WhatsApp, a cart that checks out to WhatsApp or email, or real payment, and the number or
   account it goes to). Record both in `docs/project-overview.md` before any design.
2. **Worktree.** Create the Orca worktree, rename the branch to the bare `bk-<client>`, add the client
   folder to the sparse checkout (`git sparse-checkout add deliver/brandklout/<client>`), add a
   `[<client>]` section to `~/.webzite/.env` (even empty) and run `node scripts/env-sync.mjs`. Then
   `node scripts/scenario.mjs start <client> 0` copies this scenario into the client folder with its
   `README.md`, `RUNBOOK.md`, `docs/` and an `output/` per step; work from there. See [SYSTEM_RULES.md §4.2](../../../../SYSTEM_RULES.md).
3. **Production site.** Create a new Railway project from the Instatic image with
   [`tools/instatic-site/setup/provision-instance.mjs`](../../tools/instatic-site/setup/provision-instance.mjs):
   service, volume at `/app/storage`, `PUBLIC_ORIGIN`, and the public domain `business-name.up.railway.app`
   named after the business. It deploys as **production**. Pin the image by digest, not `latest`.
4. **Admin logins.** Claim the admin at once with `--setup` (until the first login, anyone can claim it),
   then add Sang and Alejandro with the default passwords. Passwords live only in `~/.webzite/.env`.
   Register the site in [`tools/instatic-domain-origins/sites.json`](../../tools/instatic-domain-origins/sites.json)
   and run `check-origins.mjs` against it.
5. **Staging mirror.** Duplicate the Railway environment as `staging` following
   [`tools/instatic-site/staging-clone/staging-clone.md`](../../tools/instatic-site/staging-clone/staging-clone.md)
   §A. A duplicated environment copies variables only: create its own volume, set its own
   `PUBLIC_ORIGIN`, redeploy, claim the admin, and add the same Sang and Alejandro logins. Fonts and
   plugins do not copy over.
6. **Plugins.** From the client worktree, install the `brandklout.*` plugins (embed-origins,
   open-graph, aeo-schema) on production and staging with
   [`tools/instatic-plugins/install-plugin.mjs`](../../tools/instatic-plugins/install-plugin.mjs). Same
   version on both environments. Add the site to `sites` in `tools/instatic-plugins/plugins.json`
   and its staging host to `sites.json` as `<client>-staging`, then
   `plugins.mjs status --sites <client>` must show no drift. Later updates follow
   [Scenario 4](../../scenario-4-update-plugins/README.md).
7. **Asana.** Create the project from the template and assign the tasks to the developer. Agents read
   Asana with `deliver/scripts/asana-pull.mjs`; any status change or comment is confirmed
   with a person first.
8. **Drive.** Share a drive with the client for assets and follow up until they arrive. Before asking
   the client again, check the drive (`node scripts/drive.mjs ls/pull`) and every Asana attachment in
   the workspace, not only the main task.
9. **Termly.** Create the client's Termly account by hand (agents cannot) and record the website ID in
   [`tools/termly-ghl-consent/kit/termly-websites.json`](../../tools/termly-ghl-consent/kit/termly-websites.json).
10. **Style selection.** Research reference sites for the specialty, screenshot them, and turn the
    folder into an HTML page on staging for the client to choose from. Record the choice in
    `docs/project-overview.md`.
11. **Brand authority.** Write `scenario-0-new-site/01-client-inquiry/output/reference-inventory.md`: every source
    that can carry design direction (brand guide, logo files, old site, style pick), what it controls,
    and which one wins. If brand identity is unresolved, stop and ask before any design work.

## Conditionals

- **If the client has a website today:** run Scenario 1 (Migration) first, then continue at step 02.
- **If the client sends a finished design:** skip the style selection and import it exactly as given
  (`visual-diff --source` must be 0.000%). No agency changes on top of it.
- **If it is a sister brand of a current client:** its own worktree, Railway project and domain, and no
  shared section shapes. A second office of the same practice is not a sister brand; it is a location.
- **If the trading name or logo is missing:** do not create the Railway project yet. The name becomes
  the link.

## Do / Don't

- Do confirm the business name before creating the Railway project.
- Do record the `business-name.up.railway.app` link in `docs/project-overview.md`; it stays the fallback
  admin address after launch.
- Don't write passwords on the board, in Asana, in docs or in chat.
- Don't leave a new admin unclaimed.
- Don't ask the client for files before checking the drive and Asana.

## Tools

- `tools/instatic-site/setup/provision-instance.mjs` — Railway project, service, volume, domain, variables; `--setup` claims the admin.
- `tools/instatic-site/staging-clone/` — staging environment recipe and scripts.
- `tools/instatic-plugins/install-plugin.mjs` — install or upgrade a `brandklout.*` plugin; `plugins.mjs status` proves both environments match (Scenario 4).
- `tools/instatic-domain-origins/check-origins.mjs` — prove the admin login works on every host.
- `deliver/scripts/asana-pull.mjs`, `asana-context.mjs` — read the Asana project.
- `scripts/drive.mjs` — list and pull the client drive.

## Outputs

- `deliver/brandklout/<client>/docs/project-overview.md` (hosts, business name, style pick, locations)
- `deliver/brandklout/<client>/docs/facts.md` (started from the form: phones, hours, addresses)
- `deliver/brandklout/<client>/docs/open-questions.md`
- `deliver/brandklout/<client>/scenario-0-new-site/01-client-inquiry/output/reference-inventory.md`

## Evidence

Runbooks: bk-brandklout-website 2026-09-11 worktree and instance; bk-west-la-implants 2026-09-10
instance provisioned; bk-stone-med-spa 2026-09-18 logo on staging; bk-dr-nahlah 2026-08-18 admin 403s;
repo 2026-08-28 both admins fixed; repo 2026-09-10 plugin ids renamed; repo 2026-09-21 Termly API.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
