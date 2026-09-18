## DONE 2026-09-18: Gage and Jessica given content-editor accounts on all four staging instances

Two teammates now have their own Instatic logins on every Railway instance that has a
`staging` environment. Both hold the built-in **Client** role — page copy, images and
links only. Neither can touch structure, styles, code assets, plugins, users or runtime.

### Scope — which instances actually have staging

The Brandklout Railway workspace has **8 projects**; only **4** carry a `staging`
environment. Queried via GraphQL, not guessed:

| Project | Railway service | staging env id | staging domain |
|---|---|---|---|
| Dr Nahlah | `Dr Nahlah` | `bfaded13-d2e4-49bb-982d-6533fb19f285` | `staging.drnahlah.com` |
| Mason Park | `Mason Park` | `a05d3098-3049-452c-aea7-32b7e898c457` | `staging.masonparkdental.com` |
| Stone Surgical Arts | `Stone Surgical Arts` | `7c0d13f8-824e-4d81-8ebb-531abf478aeb` | `staging.dfwsurgicalarts.com` |
| Stone Med Spa | `Westlake Medical Aesthetics` | `ca87e7fd-2965-4fad-a082-0eaec9e8e3cf` | `staging.westlaketxmedspa.com` |

Production-only, deliberately skipped: Institute for Advanced Dentistry, Brandklout,
West LA Implants, Mason Park Kids.

Every staging env has **exactly one custom domain and no `*.up.railway.app` host** —
the platform host is deleted on all four (module 20). Use the custom domain.

### What was created

`gage@thrivesquare.com` and `jessica@thrivesquare.com`, display names `Gage` and
`Jessica`, status `active`, `roleId: client` — 8 accounts, one pair per instance.
Passwords are one-per-person, reused across the four instances; they live nowhere in
this repo. Ask Alejandro, or reset via `PATCH /admin/api/cms/users/:id`.

Created through the API, not the DB, so each one carries a `user.create` audit event.

### Verified

Logged in as **each of the 8 accounts** and read `GET /admin/api/cms/me`. All returned
`role=client` with exactly:

```
dashboard.read  site.read  site.content.edit  media.read  data.custom.tables.read
```

Explicitly checked absent on all 8: `site.structure.edit`, `site.style.edit`,
`pages.publish`, `media.write`, `plugins.install`, `plugins.configure`, `users.manage`,
`roles.manage`, `runtime.dependencies`, `data.system.tables.manage`.

### The gotchas

- **`me { projects }` on the Railway GraphQL API returns almost nothing.** It showed
  1 project when there are 8. The projects hang off the *workspace*:
  `me { workspaces { projects(first:100) { edges { node { ... } } } } }`. There is no
  `team` on these workspaces (both are `personal`), so `workspaces { team { projects } }`
  returns null and looks like an empty account. Do not conclude "no projects".
- **The first GraphQL call after an idle period 401s with `Not Authorized`.** The CLI's
  `accessToken` in `~/.railway/config.json` is refreshed lazily. Run any `railway`
  command (`railway whoami`) first, then re-read the config — the retry succeeds.
  `tokenExpiresAt` can still be an hour in the future while the token is rejected.
- **`customDomains { status }` is an object, not a scalar.** Selecting it bare fails
  validation. Select `{ id domain }` unless you actually need the status subfields.
- **`railway ssh` needs project/service/environment as UUIDs.** Passing the display
  names (`-p "Dr Nahlah"`) returns `Project not found. Run railway link`, which reads
  like an auth problem and is not.
- **`POST /admin/api/cms/users` requires an open step-up window,** and step-up rotates
  the session cookie. Capture the rotated cookie from the step-up response or every
  subsequent call 401s. Same trap as module 22's publish path.
- **Creating a user is not a role decision you can defer.** `roleId` is required at
  create and `owner` is rejected outright. The four seeded roles are `owner`, `admin`,
  `client`, `member` — the ids equal the slugs on all four instances.
- **`client` cannot upload media.** It has `media.read` only, so the picker works but
  "swap this image for a new one" does not. If a teammate reports they cannot add an
  image, that is the role, not a bug. A custom role adding `media.write` +
  `pages.publish` was offered and declined on 2026-09-18.
- Node fetch scripts on this workstation still die with a libuv assertion when stdout
  is a pipe — write results to a file and `cat` it.

### Next

- Nothing outstanding. If the same accounts are wanted on **production**, it is the
  same call against the production base URL with that client's own `INSTATIC_PASSWORD`;
  this run deliberately touched staging only.
