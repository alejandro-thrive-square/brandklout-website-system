# 2026-10-03 - /terms-of-service added, on staging AND production

One new page, **Terms of Service** at `/terms-of-service`, the sister adult practice's live terms
(<https://www.masonparkdental.com/terms-of-service>) in this site's /privacy-policy template. The site's
GoHighLevel form links to `https://masonparkpediatricdental.com/terms-of-service`, which now answers 200.
It was an injection, done the /hipaa-disclosure way (`2026-10-01-hipaa-disclosure-page.md`): no full chain,
and no other page, footer, nav, component or stylesheet was written.

### What is live

| | |
| :-- | :-- |
| Staging | <https://staging.masonparkpediatricdental.com/terms-of-service/> (200; `x-robots-tag: noindex, nofollow` at the edge and no canonical, like every staging page) |
| Production | <https://masonparkpediatricdental.com/terms-of-service/> (200 with and without the slash; canonical and og:url on the apex; no robots meta/header; `www` 301s to the apex) |
| Title | `Terms of Service \| Mason Park Dental for Kids` |
| Description | Open Graph override `terms-of-service`, written BEFORE each publish: "The Terms of Service of Mason Park Dental for Kids in Katy, TX: use of this website, appointment requests, and our text messaging program." (138 chars) |
| Entity | **Mason Park Dental for Kids** (no legal entity, as on /hipaa-disclosure; user's decision). The scope sentence drops the duplicate alias: "operated by Mason Park Dental for Kids (“we,” “us,” or “our”), located at https://masonparkpediatricdental.com/". Swap `ENTITY` in `build-terms.mjs` if the practice gives a legal name. |
| Contact | 21830 Kingsland Blvd #104B, Katy, TX 77450; (281) 578-7100; office@masonparkdental.com; masonparkpediatricdental.com |
| Effective date | October 3, 2026 (arrival lede and an "Effective Date:" line under chapter 2's h2, which section 19's "shown above" points at) |
| Links | "Privacy Policy" (sections 17, 18) -> `/privacy-policy/`; "Notice of Privacy Practices" (section 4) -> `/hipaa-disclosure/` |
| Layout | 8 chapters: arrival, The Important Parts (the source's three-card summary + "not" ledger), sections 1-4, 5 (SMS / A2P 10DLC, kept in full), 6-9, 10-15, 16-20, invitation (Related: Privacy policy, HIPAA disclosure, Accessibility, Contact, Sitemap) |

The intro and the twenty numbered sections are the source **verbatim** except these swaps, each asserted by
count in the build: "Mason Park Dental of Katy PLLC" / "of Katy" -> the practice (11), bestdentistinkatytx.com
-> masonparkpediatricdental.com, (281) 769-8878 -> (281) 578-7100, #104A -> #104B, the Cloudflare-obfuscated
e-mail decoded (it was already office@masonparkdental.com), "the Virtual Consultation / Smile Preview tool" ->
"the Virtual Consultation", and **three em-dash pairs turned into `;` `,` and parentheses** (check.mjs rule 8:
the client wants none). The build throws on any leftover: `of Katy`, `PLLC`, `bestdentistinkatytx`,
`masonparkdental.com` not after `office@`, the adult phone, `104A`, `Smile Preview`, Cloudflare e-mail tokens,
implant/veneer/denture/whitening, em dashes.

### How it was built

All in `workflows/03-core-pages/.tmp/terms/` (siblings of `../hipaa/`):

- `build-terms.mjs` writes `home/terms-of-service/index.html` from `reference-masonpark.html` (fetched 2026-10-03)
  and `home/privacy-policy/index.html` (chrome, compact arrival, crumbs, invitation). `stamp.mjs --check` 0 differ;
  `check.mjs` 217 pages, 0 errors, 5 warnings (the same 5 as before).
- `convert-terms.mjs`: one page, in `/tmp/terms1003` and `/app/terms1003-convert.ts` on the container. Converted on staging; the same `converted.json` went to production.
- `inject-terms.mjs` (draftMatchesPublished guard, one new row, OG override, no other seq moved, publish).
  New: `--update` rewrites the existing row (same id, `baseSeqs = {id: seq}`), used once on staging.
- `slots-diff.mjs` (work files `/tmp/terms1003-*`), `hash-pages.mjs`, `verify-terms.mjs <host>`, `shot-terms.mjs <url>` (1440 + 390, top viewport + full page, overflow), `clip.mjs` (one element).

### Verification

- **Staging**, published 06:03 UTC, then re-published 06:08 UTC with `--update` after the first screenshots
  showed chapter 2's head stacking four intro paragraphs with no gap; the intro moved into the body as an
  untitled first section. Slots: 216/216 identical (masked), then 216/217 with only `terms-of-service.html`
  different; scripts and CSS identical both times.
- **Production**, published 06:10 UTC: slots 216/216 identical (masked), only `terms-of-service.html` new,
  scripts and CSS identical. No pending OG overrides rode along (unlike the HIPAA publish).
- `verify-terms.mjs` all ok on both hosts: 200 x2, title, description = og:description, canonical (production
  apex; none on staging), og:url per host, entity sentence, effective date, A2P 10DLC terms, 20 sections,
  /privacy-policy link, kids address and phone, no adult-practice leftovers.
- Screenshots at 1440 and 390 on both hosts: 0 px horizontal overflow, 8 chapters, h1 "Terms of Service". Looked at.

### Not done (by scope) and flagged

- **No footer link**, and the /sitemap page and the edge Worker's static sitemap.xml do not list the page.
- **Cookie Policy:** sections 17 and 18 say "our Privacy Policy and Cookie Policy". Kept verbatim, but this site
  has **no Cookie Policy page** (Termly runs the banner; its policy is not published here). Either publish one
  (Termly can generate it) or drop the words.
- **Section 1** ("at least 18 years old, or have the involvement of a parent or legal guardian") is the adult
  text; it reads correctly for a kids practice, where parents use the site, so it was kept.
- **Section 8 / section 6** assume a Virtual Consultation *tool or form*; this site's /virtual-consultation is
  phone/e-mail only. "Smile Preview" was dropped; the rest kept.
- **Section 5** keeps the promotional/marketing text-message category and the carrier list as the adult page has them; confirm the kids practice's GHL A2P campaign is registered with those use cases.
- **Section 16** venue is Harris County (the source's; same building).

### Gotchas

- **`instatic-media-map.json` is rewritten by every `--only` chain** with just that chain's images: round
  seven's left out `st-window-960.webp` and `sofa-960.webp`, so the HIPAA converter would now fail with
  "unmapped media". `convert-terms.mjs` carries those two upload paths as a fallback (200 on both hosts).
- **Staging emits no `<link rel=canonical>`** (only og:url); a canonical check must expect none there.
- Element screenshots after a scroll walk catch the sticky header and the mobile call bar mid-crop; that is
  the screenshot, not the page.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
