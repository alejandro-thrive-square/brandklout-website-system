# Workflow: 11 - Mason Park 404 Page

> [!IMPORTANT]
> **Integrity Rule**: any change to the page's copy, its donor, or the class table in
> `push-404-page.mjs` must be reflected here in the same commit.

## What this is

Before this, every Mason Park hostname answered an unmatched URL with a **21-byte**
`{"error":"Not found"}` — no header, no navigation, no way back. This workflow builds a real
designed 404 from the site's own design system and wires it to Instatic's `notFound`
template target.

| | |
|---|---|
| script | `push-404-page.mjs` (dry run by default) |
| staging | `https://staging.masonparkdental.com/<anything>` → **404**, 14,150 B |
| production | **not shipped** — awaiting sign-off (see *Status*) |
| `/404` direct | **200**, same body — static-hosting convention, not a bug |
| page row | slug `404`, title `Page Not Found \| Mason Park Dental of Katy` |
| donor | `about-us` — 327 nodes in, 7 `main` sections stripped, 237 out |

## Status

**Staging only.** Production still serves the bare JSON error, deliberately: Instatic's
publish is all-or-nothing, so shipping this to production republishes every page on the live
site. Ship it with:

```bash
cd deliver/brandklout/mason-park/workflows/11-instatic-404
INSTATIC_BASE_URL=https://www.masonparkdental.com node push-404-page.mjs            # dry run
INSTATIC_BASE_URL=https://www.masonparkdental.com node push-404-page.mjs --apply --publish
```

The script refuses to publish if production's draft does not already match its published
state — i.e. if someone has unreviewed work sitting in the draft that a publish would ship
with it. That guard is the reason to run it rather than clicking publish in the admin.

## The mechanism

Instatic serves public 404s from whichever page carries
`template.target = { kind: 'notFound' }`. On publish, `publishSite.ts` bakes that page to the
`404.html` artefact, and `renderNotFoundResponse` in `publish/publicRouter.ts` serves it with
a real **status 404** for every GET no route claimed. Without one the dispatcher falls
through to the bare JSON body.

A template page is deliberately **not** baked at its own slug (`isTemplatePage(page) ->
continue`), so slug `404` cannot collide with the `404.html` artefact and never appears as an
ordinary route. `/404` answering **200** with the same body is therefore expected.

**Instatic ships this feature; nothing was patched.**

## How the page is built

Mason Park has **no templates at all** and no `everywhere` layout, so every page carries its
own chrome. The script clones `about-us`, keeps the topbar, navbar, scrim, contact band,
accreditations, footer and call bar byte for byte, strips every child of
`main.main-wrapper`, and rebuilds one hero from the site's own classes. Nothing is added to
the style registry. Node ids are remapped to fresh ones.

The hero, in the site's own Client-First classes:

```
section.section_hero.hero_component.is-plain
  div.padding-global > div.container-large > div.padding-section-large
    p.text-style-eyebrow   "404 - Page not found"
    h1.heading-style-h1    "We could not find that page."
    p.text-size-medium     lead
    div.button-group       [Back to home] [Schedule online] [Call (281) 769-8878]
    p.card_meta            address
```

### Why the class assertion matters more than it looks

A class id that resolves to nothing publishes a node with **no styling and no error** — a
completely unstyled live page. `assertClasses()` refuses to build unless all 14 ids resolve
to the selector recorded in the script, **on the host being written**.

Mason Park is easier than Dr. Nahlah here: its style-rule **ids are the class names**
(`section_hero` → `.section_hero`), so the table reads as documentation. Dr. Nahlah's are
random nanoids, and its equivalent script has to carry twelve opaque strings.

> [!NOTE]
> `.section_hero` has **no CSS rule** — and neither do `.section_intro`, `.section_booking`,
> `.section_footer` or any other `section_*` class. They are rule-less semantic markers used
> site-wide; the styling comes from `.hero_component` and `.is-plain`. A CSS audit that flags
> `.section_hero` as missing is finding the site's convention, not a defect in this page.

## Traps

- **`INSTATIC_BASE_URL` is not staging by default.** The repo `.env` points at production.
  The script refuses to run without an explicit value.
- **`insta-api.mjs` caches one session cookie** in `lib/.tmp/.session` with no record of
  which host it came from, so switching environments silently reuses the other one's. The
  script deletes it on every run.
- **`GET /pages` returns the template FLATTENED** across `templateEnabled` /
  `templateTarget` / `templatePriority`, while `PUT /site-document` takes a nested
  `template` object. Reading `cells.template` back returns `undefined` for every row — which
  looks exactly like *"the template did not save"* on a save that worked perfectly. This cost
  a run: the save was fine, the verification was wrong, and the script aborted before
  publishing.
- **Overwriting an existing row needs its `seq` in `baseSeqs`.** Sending `{}` against a row
  that already exists is a `409 Another admin saved a newer version` — which names no other
  admin, because there isn't one: the newer version is the row's own current seq, unquoted.
- **`site` is REQUIRED in the `PUT /site-document` body** even when the shell is unchanged.
  Omit it and you get a bare `400 Invalid request body` that reads like a problem with the
  page payload.
- **`publish` bakes the WHOLE draft, not your change.** The guard reads publish status
  *before* the save — after it, the draft is dirty by definition (with this script's own
  page) and the check could never pass on a second run. `--allow-dirty-draft` overrides it,
  and is only safe when you know the pending delta is yours.
- **`seo-head.js` can never title this page.** It keys off `location.pathname`, which on a
  404 is the missed URL, and returns early on a miss. `page.title` is the only title this
  page will ever have.

## Flags

| flag | effect |
|---|---|
| *(none)* | dry run — builds, asserts, writes `.tmp/page-404.json`, changes nothing |
| `--apply` | save to draft |
| `--publish` | publish after saving (with `--apply`) |
| `--overwrite` | reuse the existing `/404` row instead of refusing — needed for every re-run |
| `--allow-dirty-draft` | publish even though the draft already differs from published |

## Still open

1. **Production has not shipped it.** See *Status*.
2. **`/404` returns 200 and is indexable.** Harmless today — Mason Park's Open Graph plugin
   has an empty `siteUrl`, so it emits no canonical at all, and the page is in no sitemap and
   linked from nowhere. If canonicals are ever turned on (they should be — see the SEO gap in
   [`.claude/RUNBOOK.md`](../../../../../.claude/RUNBOOK.md)), pair it with a Cloudflare
   Response Header Transform on `http.host eq "www.masonparkdental.com" and
   http.request.uri.path eq "/404"`.
3. **The static rebuild package has no `404.html`.** `09-static-rebuild` is the static mirror
   of the site and is now one page behind; a future re-import would silently drop the 404.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). `.tmp/` is not
committed — it carries a full page payload. No secrets here.
