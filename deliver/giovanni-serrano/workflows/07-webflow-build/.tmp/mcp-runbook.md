# Webflow MCP Precompile Runbook

## Review Gate
Do not execute these payloads until the optional Webflow path is activated, the target Webflow site ID is confirmed, and the Webflow MCP Bridge App is open in Designer.

## Source
- Prototype: `C:\Users\pc\Documents\Webzite Studio\Webzite Agentic Workflow\deliver\giovanni-serrano\workflows\05-design-revisions\.tmp\final-design`
- Artifacts: `C:\Users\pc\Documents\Webzite Studio\Webzite Agentic Workflow\deliver\giovanni-serrano\workflows\07-webflow-build\.tmp`

## Execution Order
1. Review `precompile-report.json` and resolve any validation errors.
2. Use `token-map.input.json` with `variable_tool`.
3. Use `style-actions.json` with `style_tool`.
4. Upload assets from `asset-upload-plan.json` with `data_assets_tool`.
5. Create or select each page with `de_page_tool`.
6. Execute the relevant `element-actions/*.json` batches with `element_builder`.
7. Use `cms-import.json` with `data_cms_tool` where CMS collections are approved.
8. Use `embed-plan.json` for targeted `whtml_builder` and `data_scripts_tool` work only after review.

## Pages
- `develop` from `develop.html`: 20 top-level actions, max schema depth 7
- `index` from `index.html`: 10 top-level actions, max schema depth 9
- `invest` from `invest.html`: 18 top-level actions, max schema depth 7
- `scale` from `scale.html`: 16 top-level actions, max schema depth 7
- `sell` from `sell.html`: 16 top-level actions, max schema depth 7

## Notes
- `{PAGE_ROOT}`, `{siteId}`, and `{asset:*}` placeholders must be replaced by the MCP-enabled agent at runtime.
- This precompiler does not publish, delete, overwrite, or mutate Webflow data.

## Version Control
This artifact follows the root-level version control rules in `SYSTEM_RULES.md`. Commit lightweight JSON/Markdown artifacts only; never commit secrets or binary media.

## Infrastructure
- Hosting: Hostinger VPS
- OS: Ubuntu 24.04 LTS
