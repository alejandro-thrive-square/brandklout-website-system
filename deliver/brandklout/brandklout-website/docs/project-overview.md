# Project overview — Brandklout website

| | |
| :--- | :--- |
| **Client** | Brandklout, the agency's own marketing site (not a dental practice) |
| **Slug / branch / worktree** | `brandklout-website` / `bk-brandklout-website` / `orca/workspaces/Brandklout Website System/bk-brandklout-website` |
| **Requested by** | Sang, Brandklout CEO |
| **Engagement** | Partner engagement. **No price, rate, quote or cost is recorded anywhere in this folder.** |
| **Platform** | Instatic, on a Railway instance of its own (see [`21-instatic-upload`](../workflows/21-instatic-upload/21-instatic-upload.md)) |
| **`process_baseline_commit`** | `116efa21` (`main`, 2026-09-11) |
| **Opened** | 2026-09-11 |

## Scope, in two phases

### Phase 1: compliance emergency (now)

Sang supplied a page he built with ChatGPT. It goes onto Instatic **as supplied**, to fix a
compliance problem on the current site quickly. It is not a design exercise. Keep the markup and
copy as Sang wrote them. Only change what the import needs (see the traps in `21-instatic-upload`),
and flag anything else instead of fixing it silently.

- Source: `workflows/00-client-delivery-initialization/.tmp/client-handoff/`. Alejandro drops the
  HTML there.
- Target: a **review link** on the Railway host first. Sang approves it, and the domain moves
  after that. Do not point any Brandklout domain at the instance before Sang has approved.

### Phase 2: redesign and expand (after phase 1 is live)

The site gets a proper redesign and more pages. When that starts, apply the house rule: Brandklout
rejects static first builds, so go straight to the elevated version (a photo on every page, GSAP
scroll moves, varied grounds, one sentence per idea). Phase 1 is the only exception, and only
because it is an emergency fix of Sang's own page.

## Routed workflows

| Module | Where | Why |
| :--- | :--- | :--- |
| `00` Client delivery initialization | this folder's layout | setup only, not an execution phase |
| `21` Instatic upload | [`workflows/21-instatic-upload/`](../workflows/21-instatic-upload/21-instatic-upload.md) | HTML → import → publish → gates. Copied from `bk-stone-med-spa` (`05-instatic-upload`), which is itself Stone Surgical Arts' `21` |
| `18` Instatic embeds | canonical, `deliver/process/18-instatic-embeds/` | **installed 2026-09-11**: `brandklout.embed-origins` v1.5.1 from `5b5e6137`, settings `connectOrigins: https://sheetdb.io https://formsubmit.co`: `/survey` POSTs to Sang's SheetDB sheet, and the home lead form to FormSubmit → sales@brandklout.com |
| `20` Instatic domain & admin origins | canonical, `deliver/process/20-instatic-domain-origins/` | at the domain cutover |
| `22` Instatic API sync | canonical, `deliver/process/22-instatic-api-sync/` | `insta-api.mjs`, which the `21` scripts import |

Phase 2 routes `02-wireframe` → `04-design` → `06-content-seo` → `08-qa` → `09-launch` when it starts.

## Open questions

1. **What exactly is the compliance issue?** Which page or claim on the current site has to
   change, and does Sang's HTML replace the whole site or just one page? This decides whether the
   current site's other pages have to come down, and whether anything needs redirecting.
2. **Which domain?** The live Brandklout domain and its DNS host were not confirmed at kickoff.
3. **Asana**: no task was linked at kickoff.
4. **Where do "Check my market" leads go?** Answered in part 2026-09-11: nowhere. Sang's page
   has a prototype handler that shows "Prototype form submitted…". Instatic's own form storage
   (`base.form`), a CRM webhook, or an embed via `18-instatic-embeds` are the options. He picks.
   **The survey is settled (2026-09-11):** `/survey` is his Netlify 21-point assessment rebuilt,
   posting to the same SheetDB sheet as before (Alejandro's call). **The home "Check my market"
   form is settled too (2026-09-11):** it emails sales@brandklout.com through FormSubmit, which
   needs a one-time activation click at that inbox before anything is delivered.
5. **Legal pages.** Privacy, Terms and HIPAA link to `#` in Sang's page. They have to exist
   before the domain moves.
6. **Claims.** "60-day guarantee", "5.0★ reputation", "Henry Schein One API vendor listing", and
   the three case-study figures. Only Sang can confirm these, and for a compliance fix they matter.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). No credentials in this file.
Instance IDs and public URLs only.
