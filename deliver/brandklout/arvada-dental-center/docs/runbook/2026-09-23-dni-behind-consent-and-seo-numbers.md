# 2026-09-23 — Consent now holds call tracking; SEO display numbers on both Arvada sites

User request, 2026-09-23: on both Webflow sites *"the cookie consent should block the DNI script"*;
arvadadentalimplants.com had no cookie banner at all; display numbers "for SEO":
**Arvada Dental Implant Center (720) 719-9579** and **Arvada Dental Center "304-421-7611"**.

**Nothing was published.** Both sites were published 00:02 UTC and edited again 00:04 by someone in the
Designer, so a publish would have shipped their unfinished work. Everything below is in the draft and
ships with the next publish.

## The domains moved — read this first

| Domain | Webflow site | Before |
| :--- | :--- | :--- |
| www.arvadadentalcenter.com | `693c51e685b19f0d0c149cab` "Arvada Dental Center" | was the SiteGround research site |
| www.arvadadentalimplants.com | `69f2fe636ca87b3f22fa54c1` "Arvada Implants Center" | was `693c51e6…` |

`69f2fe63…` was listed as "copy — do not touch" in `docs/mcp-access.md`. The user named its domain
explicitly, so it is now in scope; mcp-access.md is updated.

## Done

**Consent (both sites), site freeform code**
- Center `693c51e6…` footer: the GHL pair (`pool/VIUeQ9lGlp8zQOPKe1BY/number_pool.js` + `user_session.js`)
  now `type="text/plain" data-categories="advertising"`. Head comment rewritten to say so. Termly,
  preferences 1.3.0, bridge 2.2.0 were already there.
- Implants `69f2fe63…` head: Termly `77ba2aba-…?autoBlock=off` first (the **same** Termly website as the
  Center site — no separate Termly website exists for this domain). The **Practice By Numbers**
  `phone_number_replace_a0793a2d….js` loader — a second number-swap script — is tagged `advertising`.
- Implants footer: its own GHL pair (`pool/e6Nxv1b5a0x84MFFUZbK`) tagged `advertising`.
- Implants registered scripts: `BrandkloutConsentPreferences` 1.3.0 (header) and
  `BrandkloutConsentBridge` 2.2.0 (footer), applied with `set_site_scripts` (site had none).
  Both hosted copies `cmp`-identical to the kit min files.
- Pre-change freeform code: `workflows/09-launch/.tmp/2026-09-23-freeform-backup.md`.

**Implants display number → (720) 719-9579**
- Header + Footer components: text and the three `tel:` links (`+17207199579`).
- SEO descriptions on 25 pages (OG/Twitter copy them).
- JSON-LD on 26 pages (`(720) 719-9579` / `+1-720-719-9579`), read back and deep-compared: 0 diffs.
  Backup: `.tmp/2026-09-23-implants-jsonld-backup.json`.
- Page copy: Contact (text + `tel:`), FAQ intro, Terms "Notices" (text, and its `tel:` which already
  pointed at `(720)419-3699` — now `+17207199579`).
- Blog CMS (6 posts): meta descriptions, three FAQ answers, two bodies. Re-read and compared: only the
  number changed. Backup: `.tmp/2026-09-23-implants-blog-backup.json`.

**Center display number**: user wrote 304-421-7611; the practice line is **(303) 421-7611** (304 is West
Virginia). Kept 303 pending confirmation. Navbar and Footer components read `(303)-421-7611`, which
the GHL pool can't match; they now read `(303) 421-7611`.

## Not done / next

1. **Publish** both sites once the Designer work is finished. Then, per site, in a fresh private window
   with `consent-kit.mjs check <url> --termly-proxy`: before choice no `number_pool.js`/`practicenumbers`
   request; after Accept `script[type="text/plain"][data-categories]` count is **0** and the number swaps.
2. **GHL pool `e6Nxv1b5a0x84MFFUZbK` must list (720) 719-9579 as the number to swap**, or the Implants site
   shows 720-719-9579 and tracks nothing. Same check for Practice By Numbers.
3. Confirm 303 vs 304 for the Center site.
4. Registry on main: `kit/termly-websites.json` `arvada` → `url` arvadadentalcenter.com,
   `poolsWaitForConsent: true`; add the Implants site; module 23 "pools are never tagged" now has an
   Arvada exception. Not edited from here (module 23 is not in this worktree's checkout).
5. Left alone, flag to the user: the `sms:+13034217611` "Text" button in the Implants footer; the
   Center navbar's mobile call icon dials **+1 719-631-5419**; ad landing pages use the campaign line
   (720) 419-3699 and 3 of them still show `(303)-421-7611`; McShane JSON-LD carries a Vietnamese
   placeholder `[DDS HOẶC DMD]`; 205 `/es-mx` pages on the Center site not reviewed.

## Gotchas

- `bulk_update_pages` (SEO) returned a bare 404 on the whole batch; `update_page_settings` one page per
  action works. `bulk_update_pages_schema_markup` works.
- JSON-LD and CMS writes replace the whole value — generate the replaced text with a script, paste it,
  then re-read and deep-compare against the script's output. Never hand-edit.
- The Designer MCP `webflow` (no suffix) is a different workspace: every Arvada site 404s there. Use
  `webflow-brandklout`.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
