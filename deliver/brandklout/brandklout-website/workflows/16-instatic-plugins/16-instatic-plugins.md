# Workflow: 16 - Instatic SEO Plugins (Brandklout)

> [!IMPORTANT]
> **Integrity Rule**: any change to the plugin sources, the installer or the Brandklout facts in
> `configure-seo-plugins.mjs` must be documented here in the same commit.

## Client-Facing Overview

The site's pages carry a canonical link, social share cards and structured data, so a link pasted
into LinkedIn or a message shows a title, a description and a picture instead of a bare URL, and
answer engines can tell what BrandKlout is.

## Why this folder exists

Instatic has **no SEO controls of its own**. A page cell is `title`, `slug` and `body`; `canonical`,
`og:*` and JSON-LD come from two first-party plugins. Brandklout's instance was provisioned on
2026-09-11 with `embed-origins` only, so until **2026-09-22** the agency's own website emitted:

- no `<link rel="canonical">` on any page,
- no `og:*` or `twitter:*` — every shared link was a bare URL,
- no JSON-LD at all,
- and no `sitemap.xml` (`/sitemap.xml` 404s; Instatic does not generate one).

That is the agency that sells search authority, ranking on nothing it controls.

## What is here

| File | What it is |
| :--- | :--- |
| `open-graph/`, `aeo-schema/` | plugin SOURCE, vendored verbatim from `bk-dr-nahlah/.../16-instatic-plugins/` at v1.1.2 / v1.2.0 |
| `pack-plugin.mjs` | the house zip packer, vendored for the same reason |
| `install-seo-plugins.mjs` | packs and installs both onto one instance |
| `configure-seo-plugins.mjs` | **the Brandklout facts**, idempotent, `--apply` to write |

**The sources are vendored, not referenced.** One client's worktree cannot read another's and this
one is sparse — the same constraint that made process 21 vendor `pack-plugin.mjs`. Re-vendor with
`git show bk-dr-nahlah:<path> > <path>` if the upstream package moves.

## Running it

```bash
node install-seo-plugins.mjs   --to https://brandklout.ai
node configure-seo-plugins.mjs --to https://brandklout.ai            # diff, writes nothing
node configure-seo-plugins.mjs --to https://brandklout.ai --apply
# then PUBLISH — the tags are written into published pages, not served dynamically
```

Same two commands for `https://staging.brandklout.ai`. The configure script reads the host it is
given and changes its own behaviour on a `staging.` one; there is no second config file.

## Where the Brandklout facts came from

The address (`15911 Pomona Rincon Rd, Suite 120B, Chino Hills, CA 91709`), the telephone
(`(949) 620-6929`) and the YouTube channel are read off the site's **own published footer** — the
same strings a visitor sees. A `LocalBusiness` block that disagrees with the page under it is worse
than none, because it is the machine-readable copy a directory will trust.

`organizationJson` is used rather than the scalar fields because the plugin's scalars have **no
address field**, and because the scalar `organizationType` list is built around dental practices —
Brandklout is `["Organization","ProfessionalService"]`, not a `Dentist`.

## Staging differs, deliberately

On a `staging.` host the script forces `emitCanonical: false` **and** sets `siteUrl` to the staging
host. Both halves are needed: `og:url` is written from `siteUrl` and survives `emitCanonical:
false`. That leak was live on staging for one publish on 2026-09-22 and
`verify-staging-clean.mjs` caught it on all three paths. Never promote these settings to production.

## Gotchas

- **Install is step-up gated, and step-up ROTATES the session cookie.** Use the rotated cookie or
  every following call 401s.
- **Settings are a separate record from the install.** A plugin installed without its settings
  emits nothing useful and looks perfectly healthy in the admin.
- **Nothing appears until a PUBLISH.** The tags are baked into published pages.
- **These two ask for six permissions each**, so `bk-dr-nahlah`'s `install-plugin.mjs` refuses them
  by design — it hard-codes embed-origins' three, which is right for approving a new plugin.
  `install-seo-plugins.mjs` grants the manifest's own list, the same six already granted on
  Dr. Nahlah, Mason Park and IFA.
- **`defaultImage` is the favicon** (`BKFavIcon.jpg`), which is not a 1200x630 share image. It is
  only the fallback — `deriveFromPage` gives each page its own first picture — but the home page
  deserves a real one. Open item.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Sources and scripts are committed;
`.tmp/` (the built zips) is not. No secrets here.
