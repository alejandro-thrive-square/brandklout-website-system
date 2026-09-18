# Webflow Template Library Plan (Relume-Based)

Future evolution of the 07-webflow-build workflow, conceived 2026-06-12 during
the Giovanni Serrano build. Status: **planned, not started**. This document is
the working plan to resume from.

## Vision

Build a library of **20–30 Webflow templates**. Each template is a Webflow
site containing:

1. The **Relume style guide** installed — variables and classes already bound
   to them.
2. A **finished home page** demonstrating one distinct style direction.

Clients scroll through the library and pick a style. A new client site is then
**cloned from the chosen template** (variables + bound classes + style
direction pre-installed), and the client's actual pages are produced through
the pasteable-components converter
([html_to_webflow.py](./html_to_webflow.py), now the canonical home of the
converter in this `07-webflow-build` template).

## Why This Model

- **Variable bindings cannot ride the clipboard** (ground truth, 2026-06-04:
  Webflow strips bindings to concrete values on copy; the `@webflow/XscpData`
  format has no field for them). Cloning a pre-bound style guide is the only
  scalable binding path — the Relume model.
- Webflow merges pasted styles **by class name, site-wide, existing
  definitions win**. Pasting components that reference pre-bound classes makes
  them adopt the bound definitions automatically.
- The library doubles as a **sales asset**: clients choose a real, finished
  style instead of going through open-ended design exploration, shrinking the
  05-design-revisions cycle. Template-based builds can get standardized
  pricing/timelines.

## Core Principle: One Class System, N Themes

**Never fork classes per template.** All templates share ONE class library
(Relume / Client-First conventions). Style directions differ only by:

- **Variable values** (colors, font pairs, radii, spacing scale), and
- **Home-page composition** (which sections, what art direction).

A fix to the class library propagates everywhere; the converter targets a
single class inventory; "style direction" is a variable-collection swap.
30 templates = 30 *theme + demo page* pairs on one foundation.

## Pipeline (Target State)

1. **Choose**: client browses the template showcase and picks a style.
2. **Clone**: new site duplicated from the chosen template. Variables, bound
   classes, and theme arrive free. The post-paste variable-binding step
   disappears for everything the library covers.
3. **Design**: 04-design authors the client's pages as HTML **against the
   shared class inventory** + the theme's variables. Bespoke art-directed
   pieces get custom classes; the library covers layout/spacing/typography
   scaffolding. Candidate home for the inventory:
   [design-system-library](../../../process/design-system-library/LIBRARY_INDEX.md).
4. **Convert**: 07-webflow-build runs with a new `--known-classes
   library.json` mode — library classes are emitted **thin** (name only,
   empty styleLess) so the paste-merge adopts the project's bound definitions;
   only custom classes carry baked CSS. Natural extension of the existing
   shared-utility thin-class mechanism.
5. **Paste + verify**: per the "Build → Paste → Verify Protocol" in
   the converter directive
  ([html-to-webflow-clipboard.md](./html-to-webflow-clipboard.md)).

## Milestones (in order)

1. **Binding-preservation test (~10 min, do first).** On a scratch clone of a
   style guide, paste a component whose class already exists bound in the
   site, publish, and confirm the published CSS still renders `var(--…)` for
   that class. This is the load-bearing assumption of the whole model and is
   still an open verification in the converter directive.
2. **Capture the class inventory.** Copy the Relume style guide pages in
   Webflow, save the `@webflow/XscpData` clipboard JSON (Clipboard Inspector
   procedure in the converter directive), and distill a machine-readable
   inventory: class names → role, styled properties, breakpoints. NOTE: the
   capture holds **concrete values, never bindings** — the inventory is a
   naming/authoring reference; bindings live only inside Webflow projects.
3. **Add `--known-classes` thin emission** to `html_to_webflow.py` + payload
   QA check that no library class is ever fat-baked or name-forked.
4. **Build 3–5 pilot templates** (not 30). One master style-guide site +
   per-template variable themes + demo home pages.
5. **Run one real client project end-to-end** (choose → clone → design →
   convert → paste → publish) before scaling the library.
6. **Scale toward 20–30 templates** + client-facing showcase.

## Watch-Outs

- **Webflow workspace site limits**: 20–30 unhosted template sites need the
  right workspace tier — verify before committing to the count.
- **Version drift**: when the master style guide evolves, templates go stale.
  Keep one master site as source of truth and a propagation checklist.
- **Relume licensing**: cloning their style guide into client projects
  requires an active Relume subscription.
- **Don't retrofit finished bespoke builds** (e.g. Giovanni Serrano) onto the
  library — translating a custom stylesheet onto Relume utilities is
  re-authoring, not converting. Apply the model to new projects only.
- All converter lessons from the Giovanni build still apply to the custom
  (non-library) classes: runtime-states head CSS, `@import` fonts (Webflow's
  native Google-variant selection reverts on publish), `body`-only overflow,
  specificity-boosted state rules, foreground-tab verification.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md)
and the Deliver pillar rules in
[DELIVER_SYSTEM_RULES.md](../../../DELIVER_SYSTEM_RULES.md). Update this plan as
milestones complete; fold the final mechanism into
[07-webflow-build.md](./07-webflow-build.md) once the workflow is live.
