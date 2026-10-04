# Scenario 6 · 01 Request Intake

## Purpose
Turn a request about a live Webflow site into a scoped change list before anything is written.
Confirm which Webflow site it is, what access the MCP grant gives, and what is already pending on it.
Most damage on live Webflow sites came from acting on the wrong site or on top of someone else's
pending Designer work.

The platform-neutral half of intake (pulling the Asana or BugHerd request, reading the client
runbook, scoping each item site-wide or single-page, asking what you cannot know) is
[Scenario 2 · 01 Request Intake](../../scenario-2-updates-expansions/01-request-intake/01-request-intake.md),
steps 1, 2, 5 and 6. Do those, then the Webflow steps below.

## Inputs
- The request, pulled as in Scenario 2 step 01. On Webflow it can also come from Designer comments
  (`data_comments_tool`; Livewell's audit read 191 of them that way).
- The client folder `deliver/brandklout/<client>/` in its own worktree `bk-<client>`.
- The client's `docs/mcp-access.md` (site id, domains, allowed operations) and the partner registry
  in `deliver/docs/mcp-access.md`.
- The client's `RUNBOOK.md` and the `output/RUNBOOK.md` of the steps you are about to run.

## Checklist
- [ ] Request pulled in full and scoped (Scenario 2 step 01, steps 1, 2, 5, 6)
- [ ] MCP instance confirmed authenticated; site id matched against `get_site`
- [ ] Baseline publish state captured BEFORE any write
- [ ] Existing-site audit of the affected surface done
- [ ] `change-list.md` written: every item typed (table below), with a release path

## Steps
1. **Confirm the site.** Read the site id from the client `docs/mcp-access.md`.
   Then run `node wf-publish.mjs state --site <id> > <workdir>/publish-state.txt 2>&1`. Check that:
   - the display name and custom domains are the client's;
   - the domain list holds no second brand. If it does, record it (Stone serves
     `stonesurgicalarts.com`; Legacy carries `caldentalpasadena.com`).
2. **Confirm access.**
   - Brandklout sites use `webflow-brandklout`. Oceanic uses its own `webflow-oceanic-dental`
     (`WEBFLOW_MCP_INSTANCE=webflow-oceanic-dental`).
   - A site that is not in the grant is read-only. Tell the user. Do not re-authorize the partner
     instance yourself: re-authorizing replaces the grant, and every site left unticked loses access.
   - A 404 "The site cannot be found" means the site is not in the grant, not a wrong id. On
     2026-09-24 a narrower re-auth had shrunk the grant to the two Arvada sites; the user
     re-authorized with every site ticked (74 sites).
3. **Record the baseline.** `publish-state.txt` shows `lastUpdated` against `lastPublished` and lists
   every page changed since the last publish. Keep it. Writing freeform head or footer code moves
   `lastUpdated` and destroys this signal.
4. **Audit the affected surface.** For each page or area the request touches, note:
   - pages: id, slug, folder, draft state, and whether ads traffic points at it;
   - CMS collections involved;
   - components with many instances (Livewell's `Main Footer` has 75);
   - forms (native Webflow form or GHL embed, and the GHL form id);
   - custom code: site freeform head/footer (`get_site_freeform_code`), registered scripts
     (`get_site_scripts`), and page code;
   - integrations: GTM, Webflow's Google Analytics integration, GHL number pools, Termly;
   - foreign content already on the page:
     `node wf-tree-audit.mjs --site <id> --pages <ids> --foreign "<other clients, doctors, towns>"`.
5. **Write `change-list.md`** as Scenario 2 step 01 describes, typing every item with the table
   below and giving it a release path: staging review, applied-but-unpublished, or live publish on
   go-ahead.

### Change types (used by step 02)
| Type | Example | Step 02 section |
| :--- | :--- | :--- |
| Copy patch | fix a sentence, remove em dashes | A |
| Phone / link change | new campaign number, dead CTA | B |
| Image | replace a photo, add alt text | C |
| New page | location contact page, thank-you page | D |
| New sections or page from a design | ads landing page, v2 page | E, F |
| Ads combo designed in Scenario 3 | landing, consultation, thank you | K |
| Site-wide script | consent bridge, DNI, preferences control | G |
| Freeform head/footer code | Termly line, tracker tags | H |
| Component edit | footer link | I |
| Designer-only | YouTube URL, input placeholders, GA integration | J (list for a human) |

## Conditionals
- If the workspace holds several sites with the client's name, then match on the site id and the
  custom domain. Arvada and Marvel each have four decoy copies.
- If `publish-state.txt` says PENDING, then someone has unpublished work on the site. Plan for
  "applied but unpublished", and tell the user before step 03.
- If the request is a paid-traffic combo that has not been designed yet, then design it in
  `scenario-3-ads-landing-pages` first; it comes back here as type K.
- If the request needs Designer-only work, then list it for a human in `change-list.md`.
- If the site is on Instatic, then this is the wrong scenario: use `scenario-2-updates-expansions`.

## Do / Don't
- Do capture the baseline before the first write.
- Do read the client's gotchas. Every site has its own traps, such as a second brand's domain or
  another practice's sections already pasted in.
- Don't trust a page list from memory. Pull `list_pages`; gates with hardcoded lists go blind.

## Tools
- `tools/webflow-build/wf-publish.mjs state --site <id>`: site record, domains, pending pages.
- `tools/webflow-build/wf-tree-audit.mjs`: foreign content, empty embeds and minted classes in the Designer tree.
- `tools/webflow-build/wf.mjs data_scripts_tool '{"label":"c","get_site_freeform_code":{}}' --site <id>`: read custom code.
- `deliver/scripts/asana-context.mjs --task <gid> --out <dir>`: the full Asana brief with attachments.

## Outputs
- `deliver/brandklout/<client>/scenario-6-webflow-sites/<step>/output/<date>-<slug>/request/` (Asana/BugHerd pull)
- `.../publish-state.txt` (baseline)
- `.../tree-audit.log`
- `.../change-list.md`

## Evidence
- bk-arvada: commits 29a0ddf7 (five decoy sites), 1676a2c8 (round 1 rejected); `docs/project-overview.md` (Asana parent 1217040406855586).
- bk-grand-mission: `docs/project-overview.md` (Asana 1217040406855578, approver Sang); `output/v2/PLAN.md` (the originals were never written to).
- bk-livewell: `workflows/15-improvement-intake-audit/output/existing-site-audit.md` and `client-comments.json` (the only run of module 15).
- bk-stone-dental: `docs/runbook/2026-09-03-this-session-third-session-em-dash-pass.md` (gotchas 2, 4, 18, 19).
- bk-oceanic-dental: `docs/runbook/2026-09-22-webflow-mcp.md`, `docs/runbook/2026-09-22-contact-pages-forms-dni-consent.md`.
- `deliver/docs/mcp-access.md` (registry, second-brand domains, decoy sites).

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
