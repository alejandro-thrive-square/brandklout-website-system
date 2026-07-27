# CMS Section Conversion - Projects

- Section selector: `.section_projects`
- Repeated item selector: `.projects_row`
- Extracted items: `5`

## Review Order
1. Review `cms-collection-plan.json`.
2. Review `cms-import.json` for content accuracy.
3. Confirm the target Webflow site, page, section, collection name, and fields.
4. Create/update the Webflow CMS collection.
5. Import items.
6. Replace the static repeated item block with a CMS Collection List.
7. Bind fields using `cms-binding-plan.json`.
8. Verify staging and run QA before deleting static fallbacks.

## Version Control
Follows the root-level version control rules in `SYSTEM_RULES.md`. Commit lightweight artifacts only.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
