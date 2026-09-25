# Scenario 2 · 02 Build

## Purpose
Make each change in `change-list.md` in the site's draft, one change type at a time, and read every
write back.
On Webflow this goes through the MCP from scripts (`tools/webflow-build/wf.mjs`). Native elements and
classes only.
The site keeps working for its visitors the whole time. Nothing here publishes; step 03 does.

## Inputs
- `change-list.md` and `publish-state.txt` from step 01.
- The site id and allowed operations from the client `docs/mcp-access.md`.
- For new pages or sections: approved copy and the approved design (scenario 3 or a client file).
- Images as files (Drive via `node scripts/drive.mjs`, the client's shared drive).

## Checklist
- [ ] Every write goes to the site id from `mcp-access.md` (`wf.mjs` refuses any other)
- [ ] No existing page, shared class or CMS item mutated unless the change list says so and the user agreed
- [ ] New pages created as drafts or duplicates
- [ ] Every write read back (text, settings, embed `code`, image asset binding)
- [ ] `wf-tree-audit.mjs` clean on every touched page
- [ ] Designer-only leftovers listed for a human

## Steps (Webflow)
Set up once per session:
- `WF_SITE_ID=<id>`.
- `WEBFLOW_MCP_INSTANCE` if the client has a dedicated instance.
- Work in `<workdir>` (`deliver/brandklout/<client>/scenario-2-updates-expansions/<step>/output/<date>-<slug>/`).

Keep each change as a small script in the workdir that imports `tools/webflow-build/wf.mjs`, so it can
be replayed. Batch reads, and expect 429s after about 30 fast calls. `wf.mjs` backs off.

**A. Copy patch.**
1. Find the node with `get_all_elements`. Rich text is not in that tree, so use `query_elements`
   with `element_filter.text` for it.
2. Write the new copy:
   - `set_text` on the `String` node edits one run and keeps its `<br>` and `&` siblings. `set_text`
     on the parent flattens them.
   - `set_text` on a `TextBlock` reports success and changes nothing. Use `set_settings` key `text`.
   - A loose string inside a ListItem cannot be edited by the client. Add a TextBlock child and fill it.
3. Read the node back.

**B. Phone numbers and links.** A number lives in several places. Sweep every one of them:
- element text;
- `tel:` links: `set_link` with `linkType: "phone"` and the bare number. A `tel:` value publishes broken;
- rich text (`query_elements`);
- component props;
- page and site custom code;
- schema.

Type numbers with hyphens: an en dash stops the GHL pool from swapping the text. Relative URLs
publish as `https://../`, so link pages with `linkType: "page"`. A DNI pool swaps whatever it matches,
so confirm which number is the campaign line and which is the main practice line.

**C. Images.** Pick them by [`deliver/docs/IMAGES.md`](../../../docs/IMAGES.md): client sources
before stock, every photo showing what its text says, none on more than two pages.
1. `node upload-asset.mjs --site <id> <file>`. It prints the s3 `hostedUrl`.
2. Bind with `set_image_asset`, then read back `assetId`. `set_image_asset` toggles: writing an image
   that is already bound unbinds it.
3. Set `altText` in the settings. A re-cut image needs a new file name, because Webflow skips a name
   it already has.

**D. New page.**
1. Use `create_page` with `duplicateOf` (the Oceanic contact pages) or an empty page, with
   `draft: true` and the right `parentFolderId`. Ads pages go in `/ads-landing-pages/`.
2. Never edit the original.
3. Set the SEO title and description per page. Re-set the OG image: duplicating drops it.
4. Head items from a design (title, meta, canonical) do not travel with markup. Set them on the page.

**E. New sections or a page built from a design (native build).** This is the method that survived
on Arvada v2, Grand Mission, Legacy, Marvel and Stone.
1. Reuse the site's own classes (its Relume or Client-First kit and variables) for structure. Put
   design values in a new, site-scoped class layer (`camp_`, `lp_`, `axon-`). Never reuse another
   client's prefix.
2. Gate the CSS: `node lint-css.mjs camp.css --fonts "<families installed on the site>"`.
3. Push the class layer once:
   - `data_whtml_builder` creates a style for every rule in its `css` field, so attach the whole sheet
     to one throwaway element, then remove that element.
   - A combo class attaches to one base per build; create the others with `create_style` and
     `parent_style_names`.
4. Insert markup section by section:
   - `data_whtml_builder` with no `css`; existing classes resolve by name.
   - One section per call and under about 18 KB. A bad rule aborts the whole call, and an oversized
     one fails silently after clearing the page.
   - Check the tree after any error: a failed batch leaves classless ghost elements.
5. Images in the markup must use the asset's s3 `hostedUrl`, or they ship unmanaged.
6. Anything the client may edit must be a real element. For an FAQ, build real items plus ONE embed
   holding only the behaviour `<style>`/`<script>`.
7. GHL form: use an HtmlEmbed holding the client's snippet verbatim, inside
   `<div class="…" style="min-height:<form height>px">`.
8. Keep a list of items that need the Designer:
   - the YouTube `video` setting;
   - input placeholders;
   - FormSelect options;
   - h2 to h6 tag styles.

**F. Replacing an existing page (a "v2").**
1. Build the new page as a draft on a temporary slug and review it on staging.
2. After approval, promote it:
   - rename the old page to `<slug>-v1-archived`, retitle it and set `draft: true`;
   - give the new page the live slug.
3. There is no `delete_page` in the MCP. Archiving is reversible, which is why it is the rule.

**G. Site-wide script.**
1. Keep the source and the `.min.js` in `deliver/brandklout/<client>/site-scripts/` (or use the
   consent kit in `tools/termly-ghl-consent/kit/`).
2. Minify with `npx terser@5 -c -m`. The cap is 2000 characters.
3. Run `node wf-register-script.mjs --site <id> --name <Name> --version <x.y.z> --file <min.js> --dry`.
   Read the output, then run it without `--dry`.
4. Register in the `header`, and let the script defer itself to `DOMContentLoaded`.
5. Bump the version on every change.
6. DNI: start from `site-scripts/ghl-dni-loader.template.js`.

**H. Freeform head or footer code.**
1. Take `publish-state.txt` first, because this write moves `lastUpdated`.
2. Read the block (`get_site_freeform_code`) and save it to the workdir. `set_site_freeform_code`
   replaces the whole block, so write back the full content with only your lines changed.
3. The Termly line goes first in the head, with `?autoBlock=off`, above GTM.
4. Tag trackers outside GTM with `type="text/plain" data-categories="analytics|advertising"`.
   Never tag a GHL number pool.
5. Webflow's own Google Analytics integration prints above all custom code, so it cannot be tagged.
   Moving it is a Designer-side task (J).

**I. Component edit.**
- A component change hits every instance: 75 pages for Livewell's footer.
- The Data API cannot place a link inside a Designer footer nav. For the Cookie Preferences control,
  use `BrandkloutConsentPreferences` (it clones the footer's Privacy link at runtime), or add a
  component HtmlEmbed, as on Oceanic.

**J. Designer-only.** Write the exact clicks for the human in `change-list.md`:
- the YouTube URL;
- input placeholders;
- moving GA4 out of the integration;
- any visual check the element snapshot cannot make without the Designer open.

After every change type, run
`node wf-tree-audit.mjs --site <id> --pages <touched ids> --foreign "<other clients>" --phone <digits>`
and re-read every HtmlEmbed's `code`: structural edits can empty an embed.

## Instatic path (short)
- Work on the staging environment first, with the same admin logins as production.
- Use the Instatic tools, not Webflow's:
  - `tools/instatic-api-sync/` for page and CSS writes, snapshots and the publish guard;
  - `tools/instatic-embeds/` for third-party embeds and CSP origins;
  - `tools/instatic-domain-origins/` for domains and `PUBLIC_ORIGIN`.
- A page write through `PUT /site-document` drops `seoTitle`/`seoDescription`. Restoring them with
  `PATCH /data/rows` flattens `a/b` slugs, so re-save through site-document.
- Termly and the consent bridge: `tools/termly-ghl-consent/consent-kit.mjs instatic ...`.

## Conditionals
- If the page already has content and you are asked to rebuild it, then build a new draft page (F).
  Clients edit and publish too, so never re-render over their page.
- If a class you need already exists on the site with other values (a page cloned from another
  client), then diff first and send `update_style` with only the differing properties.
  `update_style` ignores shorthands, and re-sending an unchanged value returns a conflict.
- If you would pass an inline `style=` or redefine an existing class in `whtml_builder`, then stop.
  Webflow mints `inline-section-N` or `<name>-1` holding only your properties. On Stone this shipped
  a navy-on-navy trust bar. Use a new class name.
- If a write reports success, then still read it back. Silent no-ops seen:
  - `set_text` on a Block;
  - `set_style` with one unknown class drops the whole list;
  - `remove_properties` does not remove the property;
  - rate-limit replies that look like success.
- If a GHL form or video embed goes blank after edits, then re-set its `code` and re-read it before
  publishing.
- If the client wants call tracking gated behind consent, then ask first. The standing instruction
  is un-gated.
- If a request asks to copy another site's variables or styles into this one (no run has needed it
  yet), then:
  1. Read the source's variable collections (all modes) and its styles at every breakpoint first.
  2. Create variables with concrete values before aliases, and map variable ids, because they differ
     per site.
  3. Overwrite same-named items only with the user's agreement.
- If the site is Instatic, then skip A to J and use the Instatic path.

## Do / Don't
- Do build natively: real Webflow elements and classes the client can edit in the Designer.
- Do give new classes a site-scoped prefix and new names. Reuse the site's kit for structure.
- Do keep house copy rules in the build scripts:
  - no em dashes in copy we write;
  - no other client's names, prices or doctors;
  - no prices except the client's own.
- Do keep every script you ran in the workdir so the change can be replayed.
- Don't paste converted HTML (the `html_to_webflow.py` clipboard route). On Arvada v1 it passed every
  gate and still needed about 15 harnesses and several hundred corrections, because nothing on the
  page was a Webflow class (commit 301acb2d).
- Don't put pages in one big HtmlEmbed, or put section CSS/JS in page settings.
- Don't use `set_page_freeform_code` for `<script>`: it returns 406.
- Don't use `data_whtml_builder` to rebuild existing pages headlessly from converted payloads. It
  loses ids and scripts, and leaves `##INLINE##` text.
- Don't create pages without `draft: true` on a site with pending work.
- Don't touch `customDomains` here. Publishing is step 03.

## Tools
- `tools/webflow-build/wf.mjs`: every MCP call (site guard, shapes, retries, session).
- `tools/webflow-build/upload-asset.mjs`: add an image to the asset library.
- `tools/webflow-build/lint-css.mjs`: gate a class layer before `data_whtml_builder`.
- `tools/webflow-build/wf-register-script.mjs`: site-wide registered scripts.
- `tools/webflow-build/site-scripts/ghl-dni-loader.template.js`: DNI pools.
- `tools/webflow-build/wf-tree-audit.mjs`: after each change.
- `tools/termly-ghl-consent/`: consent kit (bridge, preferences control, Termly head line).
- Reference implementations, read-only: bk-arvada
  `workflows/07-webflow-build/output/v2-native/` (`build-classes.mjs`, `build-page.mjs`,
  `promote-v2.mjs`, `phone-sweep.mjs`), and bk-marvel-dental `output/native/`
  (`diff-classes.mjs`, `apply-classes.mjs` for re-theming a cloned class layer).

## Outputs
- The change, in the site's draft.
- `<workdir>/*.mjs`: the scripts that made it.
- `<workdir>/tree-audit-after.log`.
- `<workdir>/designer-todo.md`, if any item needs the Designer.
- `deliver/brandklout/<client>/site-scripts/`: script source and min files.

## Evidence
- bk-arvada `workflows/07-webflow-build/output/v2-native/STATUS.md`: 18/18 native pages, promote-v2, no delete_page, Designer-only items.
- bk-arvada commits 301acb2d (paste route retired), c1d0efb7 (v1 archived as drafts), 48be6523 (one phone across the ads folder).
- bk-grand-mission commits ed6d225c to cdd37839 (headless whtml abandoned), d3dcfdce (native rebuild), 94e8a400 (editable list copy).
- bk-stone-dental `docs/runbook/2026-09-03-this-session-third-session-em-dash-pass.md`, gotchas 6, 7, 11 to 15 and 20.
- bk-legacy-dental commit 9084e817 and `output/native/`; bk-marvel-dental commit bdb06963 (update_style shorthands).
- bk-livewell `output/IMPLANTS-RUNBOOK.md` (whtml since the implants page; 406 on page script code).
- bk-oceanic-dental `docs/runbook/2026-09-22-contact-pages-forms-dni-consent.md`: duplicated pages, GHL embed, registered DNI, en dash.
- `deliver/process/tools/termly-ghl-consent/termly-ghl-consent.md` (Phase 1 Webflow, gotchas).

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
