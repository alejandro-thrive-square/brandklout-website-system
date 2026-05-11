# Workflow: 03 - Design (Giovanni Serrano)

## Client-Facing Overview
Cloud design has already produced an improved design system with two homepage variants. This phase presents the variants for client selection, then formalizes both the selected homepage direction and the service page template into production-ready Figma files.

## Operational Purpose
Convert the cloud design outputs into Figma files with proper auto-layout, components, design tokens, and responsive breakpoints. Produce 2 Figma pages: Home + Service template.

## Design Reference Sources
- deliver/giovanni-serrano/workflows/03-design/.tmp/Giovanni Serrano - Design System.html (main design system)
- deliver/giovanni-serrano/workflows/03-design/.tmp/variant-a.html (homepage variant A)
- deliver/giovanni-serrano/workflows/03-design/.tmp/variant-b.html (homepage variant B)
- deliver/giovanni-serrano/workflows/03-design/.tmp/final-design/index.html (selected final homepage, formerly variant B)
- deliver/giovanni-serrano/workflows/03-design/.tmp/final-design/_ignored/variant-a.html (archived alternate homepage; ignored and excluded from handoff)
- deliver/giovanni-serrano/workflows/03-design/.tmp/design-system.html (alternate design system)
- deliver/giovanni-serrano/workflows/03-design/.tmp/scroll-cinema.html (scroll animation variant)

## Execution Steps

### Phase 1: Variant Presentation & Selection
1. Present variant A and variant B to the client with rationale for each design direction.
2. Document client feedback and secure homepage selection.
3. Merge selected direction with the design system tokens.

### Phase 2: Homepage Figma Production
4. Convert the selected variant HTML to Figma via html.to.design or Figma MCP.
5. Apply Figma auto-layout, components, and constraints.
6. Import design tokens as Figma Variables (colors, typography, spacing).
7. Ensure responsive breakpoints: 1440px, 1024px, 768px, 375px.

### Phase 3: Service Template Figma Production
8. Build the service page template in Figma based on the selected design direction.
9. This template covers Invest, Scale, and Develop pages -- all share the same structure with different content.
10. Apply same auto-layout, component, and breakpoint standards.

### Phase 4: Refinement & Approval
11. Document component specifications: interaction states, CMS bindings, responsive behavior.
12. Capture screenshots of both Figma pages at all breakpoints.
13. Run token-consistency audit.
14. Present both pages to client for feedback and iterate.
15. Record client approval.

## Output Artifacts
- deliver/giovanni-serrano/workflows/03-design/.tmp/style-direction.md
- deliver/giovanni-serrano/workflows/03-design/.tmp/design-tokens.json
- deliver/giovanni-serrano/workflows/03-design/.tmp/figma-homepage.figma (or link)
- deliver/giovanni-serrano/workflows/03-design/.tmp/figma-service-template.figma (or link)
- deliver/giovanni-serrano/workflows/03-design/.tmp/figma-conversion-log.json
- deliver/giovanni-serrano/workflows/03-design/.tmp/mcp-prompt.txt (generated prompt for Claude Code Figma MCP)
- deliver/giovanni-serrano/workflows/03-design/.tmp/component-spec.json
- deliver/giovanni-serrano/workflows/03-design/.tmp/screenshots/
- deliver/giovanni-serrano/docs/design-approval.md (final, persisted)

### Ignored Final Design Archive
- `deliver/giovanni-serrano/workflows/03-design/.tmp/final-design/_ignored/` stores alternate concepts retained for internal reference only.
- `variant-a.html` lives in this ignored archive after final selection and must not be linked from final-design pages, included in client handoff files, or rebuilt in Webflow.
- The `_ignored/` folder is explicitly listed in the root `.gitignore`; `.tmp/` remains globally ignored.

## Technical Setup
- **Executor status**: Functional.
- **Conversion method**: Figma MCP via Claude Code. The `03-design.py` executor starts a local server, extracts design tokens, and generates a structured MCP prompt. Claude Code (with Figma MCP connected) captures the HTML as a live UI into Figma using the `generate_figma_design` tool.
- **Figma MCP setup**: Run `claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp` to connect Figma MCP to Claude Code.
- **Integration**: Figma MCP, Claude Code, Figma Variables.
- **Usage**: `python 03-design.py --variant a` (or `--variant b`, `--variant both`).

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Ignored final-design archive**: `deliver/giovanni-serrano/workflows/03-design/.tmp/final-design/_ignored/` is for internal alternates only and must remain ignored.
- **Branch naming:** deliver/giovanni-serrano-design-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS



