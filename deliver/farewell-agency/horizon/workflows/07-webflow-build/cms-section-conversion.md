# Experimental Extension: Static Section to Webflow CMS

## Purpose
Convert an already-built static Webflow section into a CMS-backed dynamic section without rebuilding the entire page. This is an experimental extension of `07-webflow-build` for cases where the visual section exists in Webflow but the repeated content should move into a Collection.

## When To Use
Use this extension when:
- A section has repeated static items such as project rows, testimonial cards, FAQ rows, service cards, team members, or portfolio entries.
- The section styling and interactions are already acceptable in Webflow.
- The goal is to preserve the section wrapper, classes, custom attributes, and animation hooks while moving repeated content into CMS fields.

Do not use this extension for one-off static copy, complex hardcoded animations with no repeated content, or production data migrations that have not been reviewed.

## Inputs
- Target Webflow site: Horizon staging, site ID `6a1f7d0be8345316ba21999c`.
- Source section HTML or paste artifact.
- Target section selector, such as `.section_projects`.
- Repeated item selector, such as `.projects_row`.
- Desired CMS collection name.
- Optional mapping overrides if automatic field inference is not precise enough.

## Output Artifacts
All outputs are stored under `.tmp/cms-section-conversion/[section-slug]/`:

| File | Purpose |
|:---|:---|
| `cms-collection-plan.json` | Proposed Webflow CMS collection fields. |
| `cms-import.json` | Extracted CMS item data ready for review/import. |
| `cms-binding-plan.json` | Selector-to-field binding plan for the dynamic section. |
| `README.md` | Human review summary and execution checklist. |

## Planner Command
Example for the Horizon Projects section:

```bash
python workflows/07-webflow-build/cms_section_planner.py \
  --html workflows/04-design/.tmp/new-sections-awwwards/new-sections.html \
  --section-selector .section_projects \
  --item-selector .projects_row \
  --collection "Projects" \
  --slug projects
```

Run the command from `deliver/farewell-agency/horizon/`.

## Execution Protocol
1. Generate the CMS plan with `cms_section_planner.py`.
2. Review `cms-collection-plan.json` and `cms-import.json`.
3. Confirm the target Webflow site, page, section, collection name, and field schema.
4. Create or verify the Collection through Webflow MCP `data_cms_tool`.
5. Import or update Collection items from `cms-import.json`.
6. In Designer or through native Webflow element tools, replace the repeated static item wrapper with a CMS Collection List.
7. Keep the existing item classes and custom attributes on the CMS item template.
8. Bind each element according to `cms-binding-plan.json`.
9. Remove static duplicate items only after the CMS list renders correctly on staging.
10. Publish to staging only after explicit confirmation.
11. Run `08-qa` against desktop, tablet, and mobile breakpoints.

## Binding Rules
- Preserve existing section wrapper classes.
- Preserve animation/data attributes unless the binding plan explicitly replaces them.
- Bind links to URL fields, images to Image fields, image alt text to PlainText fields, headings to PlainText fields, and rich paragraphs to RichText only when formatting must be preserved.
- Keep sort/order as a CMS field when the visual order matters.
- Keep static CTA buttons and section intro copy outside the Collection unless the client needs to edit them frequently.

## Known Constraints
- Webflow clipboard paste payloads can carry style structure, but CMS bindings are safer when authored through Designer/MCP-native elements after the CMS collection exists.
- This first experiment emits reviewable plans and import data. It does not directly mutate Webflow.
- Designer deletion/replacement of static rows is a destructive visual edit and requires confirmation.

## Version Control
This workflow extension follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit documentation and lightweight artifacts that support review or replay. Do not commit secrets or binary/media assets.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
