## Latest completed: Relume MCP authenticated + Kit Foundation V1 test build (2026-08-11)

No commit — the work landed **in Webflow**, not in this repo.

- **`relume` OAuth is now done** on the personal profile (the pending item below is cleared for that
  profile only; `claude team` still needs its own round trip).
- **Re-authenticating `webflow-brandklout` widened the grant from 9 sites to 79.** If a Brandklout
  site appears to be missing, re-auth before concluding it does not exist. `Kit Foundation V1`
  (`6a7a804cfed7e6e46272c6b0`) only became visible after that.
- **Kit Foundation V1 is a stock, unbranded Relume Style Guide v3.0** — 526 styles, 37 variables,
  `system-ui` fonts, `0px` radii, one colour scheme, never published. Clone it to start a client
  build (variable bindings only travel by cloning, never by clipboard). It still needs a brand token
  pass before it is *the* foundation.
- **Built a 6-section Home stack on it from the Relume MCP** (Navbar 1, Header 1, Layout 240,
  Testimonial 1, CTA 1, Footer 1), Relume placeholder copy only, no images bound.
- **The Relume MCP serves React/TSX + Tailwind, not Webflow markup.** The route that works is to
  read the TSX as a structural spec and rebuild natively with `data_element_builder` against the
  kit's class vocabulary — zero forked classes, no HtmlEmbed, fully Designer-editable. Full method
  and the gotchas (`set_style` chain resolution, the `padding-section-medium` ambiguity, `Form`
  aborting a whole build, `buttonText`, unreachable `placeholder`) are in the agent memory notes
  `reference_webflow_relume_mcp_native_build` and `project_brandklout_kit_foundation`.
- **Both build gaps then closed.** Navbar: hamburger + animated bars + absolute drawer built from
  Designer classes, toggled by a script in the **site footer** freeform block
  (`set_site_freeform_code`), which travels with a duplicated site. Placeholder: unreachable from
  the Data API five different ways, so the input carries `data-placeholder` and a second, opt-in
  self-retiring shim mirrors it.
- **Not published, so no runtime verification yet** — the footer script only executes on the
  published site. Publishing to the `.webflow.io` subdomain is the next step and needs the
  operator's go-ahead.
