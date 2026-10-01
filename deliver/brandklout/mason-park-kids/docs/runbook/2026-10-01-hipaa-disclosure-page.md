# 2026-10-01 - /hipaa-disclosure added, on staging AND production

One new page, **HIPAA Disclosure** at `/hipaa-disclosure`, the HHS model Notice of Privacy Practices our
Webflow sites carry (Stone Dental Implant Center's live page is the reference). It was an injection:
no full chain, no other page, footer, nav, component or stylesheet was written.

### What is live

| | |
| :-- | :-- |
| Staging | <https://staging.masonparkpediatricdental.com/hipaa-disclosure/> (200, noindex at the edge like every staging page) |
| Production | <https://masonparkpediatricdental.com/hipaa-disclosure/> (200, canonical on the apex, no robots meta/header, indexable like /privacy-policy) |
| Title | `HIPAA Disclosure \| Mason Park Dental for Kids` |
| Description | Open Graph override `hipaa-disclosure`: "The Notice of Privacy Practices of Mason Park Dental for Kids in Katy, TX: how your child's health information may be used and shared, and your rights." |
| Entity | **Mason Park Dental for Kids**: no legal entity is named on this site's privacy page, any other page, the recovered WordPress export or the live site. **Flagged:** swap `ENTITY` in `build-hipaa.mjs` when the practice confirms its legal name. With entity = practice name, the opening sentence drops the duplicate alias: "applies to Mason Park Dental for Kids (“we,” “us,” or “our”)". |
| Contact block | one location (this site is one practice): 21830 Kingsland Blvd #104B, Katy, TX 77450; (281) 578-7100; office@masonparkdental.com; masonparkpediatricdental.com |
| Effective date | October 1, 2026 |
| Privacy link | `/privacy-policy` (this site's own) |

The notice text is the reference **verbatim** except those swaps (a line-by-line diff in the build check shows only
the effective date, the scope sentence and the contact block differ).

### How it was built

All in `workflows/03-core-pages/.tmp/hipaa/`:

- `build-hipaa.mjs` writes `home/hipaa-disclosure/index.html` from `reference-stone.html` (the notice) and
  `home/privacy-policy/index.html` (chrome, compact arrival hero, crumbs, invitation). The notice's h2s are
  chapters in the privacy page's `lf-layout lf-split` pattern, h3s are `lf-section`s, lists are `lf-ticks`.
  8 chapters (the journey cap). `stamp.mjs --check` 0 differ; `check.mjs` 216 pages, 0 errors.
- `convert-hipaa.mjs` runs to-instatic -> ship -> convert -> fetch -> body class -> alt for **this one page**,
  in `/tmp/hipaa1001` and `/app/hipaa1001-convert.ts` on the container, so it cannot collide with a chain
  using the shared `/tmp/payload.b64` / `/tmp/nodes.b64`. Converted once (staging); the media paths are the
  same on both instances.
- `inject-hipaa.mjs` refuses unless `draftMatchesPublished`, writes one new row (`baseSeqs: {}`), writes the
  OG override, refuses to publish if any other row's seq moved, publishes, checks 216/216.
- `slots-diff.mjs` compares Instatic's two published slots on the volume (`/app/storage/uploads/published/a|b`).
- `hash-pages.mjs` hashes 12 key pages over HTTP (with Cloudflare's email tokens masked).

### Verification

- **Staging** (published 13:33 UTC): 213/215 old pages byte-identical once the per-publish script-folder id is
  masked; `/` and `/patient-reviews` differ only in `brandklout.embed-origins.embed.js?v=11` -> `?v=12`.
  Script contents identical on every page, CSS identical.
- **Production** (published 13:37 UTC): 210/215 identical the same way. `/` and `/patient-reviews` also carry the `?v=` bump. **`/`, `/contacts`,
  `/our-team`, `/special-offers` also changed their meta/OG/JSON-LD descriptions**: round six's
  `populate-seo.mjs` wrote those overrides to production at 23:56 UTC on 09-29, after its 23:44 publish, and
  nobody published again. They were round six's approved edits ($89, "Platinum", the phone hyphen, no
  "nine"), which that runbook already reported as live; this publish is what actually shipped them.
- Both: 200 on `/hipaa-disclosure` and `/hipaa-disclosure/`, entity and date right, no Stone/Westlake/PLLC left.

### Not done (by scope) and flagged

- **Footer:** it has a legal-links row (`.foot_legal`: © / Privacy / Accessibility / Sitemap / Dental library / adult practice). No HIPAA link was added.
- **sitemap.xml** (production) is a static list inside the edge Worker (`workflows/.tmp/production-edge/worker.js`,
  215 URLs); `/hipaa-disclosure/` is not in it until the Worker is rebuilt and redeployed. The `/sitemap` HTML page doesn't list it either.
- The invitation's "Related" list on the new page links Privacy policy, Accessibility statement, Contact, Sitemap.

### Gotchas

- **`draftMatchesPublished` does not see plugin overrides.** An OG override written after a publish
  sits unpublished while the status says the draft matches. Any later publish ships it. Run `populate-seo.mjs`
  BEFORE the publish, or publish again after it.
- **Every publish changes every page's bytes**: script bundles live under a fresh
  `/_instatic/assets/<21-char id>/` per page per publish, and the embed-origins module carries a `?v=` counter.
  Byte-identity over HTTP is meaningless across a publish; compare the two slots on the volume with the id
  masked (`slots-diff.mjs`), which also gives you the pre-publish copy you forgot to save.
- Cloudflare's email obfuscation re-keys `/cdn-cgi/l/email-protection#...` on every response; mask it before hashing.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
