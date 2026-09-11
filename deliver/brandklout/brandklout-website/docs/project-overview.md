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
| `18` Instatic embeds | canonical, `deliver/process/18-instatic-embeds/` | only if the page carries a form or widget |
| `20` Instatic domain & admin origins | canonical, `deliver/process/20-instatic-domain-origins/` | at the domain cutover |
| `22` Instatic API sync | canonical, `deliver/process/22-instatic-api-sync/` | `insta-api.mjs`, which the `21` scripts import |

Phase 2 routes `02-wireframe` → `04-design` → `06-content-seo` → `08-qa` → `09-launch` when it starts.

## Open questions

1. **What exactly is the compliance issue?** Which page or claim on the current site has to
   change, and does Sang's HTML replace the whole site or just one page? This decides whether the
   current site's other pages have to come down, and whether anything needs redirecting.
2. **Which domain?** The live Brandklout domain and its DNS host were not confirmed at kickoff.
3. **Asana**: no task was linked at kickoff.
4. **Forms and third-party scripts**: Instatic strips every `<script>` on import and blocks
   third-party scripts and frames. If Sang's page has a contact form, analytics or a chat widget,
   it needs `18-instatic-embeds` or a bundle module, and that goes back to him as a question.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). No credentials in this file.
Instance IDs and public URLs only.
