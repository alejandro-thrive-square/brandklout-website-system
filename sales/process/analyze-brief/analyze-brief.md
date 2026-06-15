# Workflow: Analyze Brief

## 1. Overview
This supporting workflow converts a client-provided brief (Google Slides / PDF deck, or similar) into a concise Markdown analysis **token-efficiently**, so agents can scope a proposal without paying for the full deck as images. It is a reusable Sales tool, like [scrape-page-to-markdown](../scrape-page-to-markdown/scrape-page-to-markdown.md), and is typically invoked by [00-prospect-intake](../00-prospect-intake/00-prospect-intake.md).

> [!IMPORTANT]
> **Integrity Rule**: Any change to this workflow's method or technical logic must be documented here immediately.

## 2. Why This Exists (Token Rationale)
A typical brief is mostly text. The cost of getting it into context varies wildly by method:

| Method | Approx. cost for a 20-slide deck | Keeps |
| :--- | :--- | :--- |
| Plain-text export | ~2k–6k tokens | Words only |
| Slide images (PNG/JPG) | ~30k–37k tokens (after downscale to ~1568px long edge) | Full visuals/layout |
| Raw Slides-API JSON | Often **more** than images | Everything, buried in metadata |

**Decision: text-first hybrid.** Read the words cheaply, then spend image tokens only on the few slides that carry real visual information.

## 3. Method (Text-First Hybrid)
1. **Cheap full pass** — read the Plain Text export to understand all stated goals, scope, and requirements.
2. **Triage** — flag slides that are sparse on text but clearly reference visuals (mockups, wireframes, sitemaps, brand/style references, competitor screenshots, diagrams).
3. **Targeted image pull** — read **only** the flagged slides as PNG. Standard 1920×1080 export is already optimal; do not upscale (anything past ~1568px long edge is downscaled anyway).
4. **Synthesize** — write the analysis artifact.

Avoid: feeding raw Slides-API JSON to the model, and blind full-deck image dumps.

## 4. Manual Fetch Procedure (No Executor)
This workflow is directive-only; fetching is manual.
- **Cheap pass**: in Google Slides, **File → Download → Plain Text (.txt)**.
- **Visual slides**: **File → Download → PNG (.png)** for each flagged slide (or pull those pages from a full PNG/JPEG export).
- Place all assets in the caller-provided drop-zone, e.g. a prospect's `sales/[prospect-name]/workflows/00-prospect-intake/.tmp/brief/`.

A `.py` executor (Drive/Slides API export + automated triage) is a possible future addition but is intentionally not implemented.

## 5. Inputs
- A drop-zone folder containing the brief's Plain Text export and any flagged slide images.

## 6. Output Artifact
- `brief-analysis-[prospect].md` written into the caller's `.tmp/`, containing:
  - Stated goals and scope.
  - Page / template count (drives pricing & timeline).
  - Design direction and brand references.
  - Candidate offer mapping.
  - Open questions and risks.
  - Draft timeline via [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md) (`pages × 2 days`, or `pages × 1 day` dev-only).

## 7. Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets (slide images, source decks) remain gitignored and synced to the VPS.
- **Branch naming**: `sales/analyze-brief-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## 8. Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
