# BugHerd comments — decide the scope before the fix

A BugHerd pin sits on one element of one page, but many comments are about the whole site. The team
pinned a comment on one page, wrote that it applied to the whole site, and the fix stayed on that one
page (2026-09-25). So every comment gets a scope decision first, and the fix follows the scope, not
the pin.

## 1. Read the comment in full

Fetch the task by id with its attachments and look at the screenshot
([Scenario 2 step 01](../process/scenario-2-updates-expansions/01-request-intake/01-request-intake.md)).
The list endpoint hides the page, the selector and the screenshot.

## 2. Decide the scope

**Site-wide** when any of these is true:

- The comment says so: "all pages", "everywhere", "throughout", "whole site", "site-wide", "every",
  "all the buttons", "same on the other pages", "in general".
- The pinned element is shared: a type role (H2, body text), a button or link style, a colour,
  spacing between sections, a component (header, footer, nav, CTA band, card, FAQ, form), or a
  class that other pages use.
- The same problem shows on other pages when you look (a wrong phone number, an em dash, a photo
  that does not match its text).

**This page only** when the comment is about content that exists only there: one sentence, one
photo, one link, one section's layout.

**Not sure:** treat it as site-wide, check every page, and say in the reply which pages you changed.
Ask the user before changing something site-wide that the comment might have meant for one page only.

## 3. Fix it at the source

- Site-wide: change the class, the type role, the variable or the component, never the one pinned
  element. A per-element override on the pinned node is exactly the fix that does not cascade.
- On Instatic, contextual CSS (`.section p`) outranks class rules, so compare the computed style of
  the element on a second page after the change; a class edit that loses to a contextual rule looks
  fixed nowhere.
- Content that repeats (phones, names, facts): change it in `docs/facts.md` and everywhere it is used,
  including components, schema and the open-graph store.

## 4. Prove it on every page

- Take the page list from the site (sitemap or `list_pages`), never from memory.
- Check the fix on every page that carries the element, not only the pinned one: a gate if one
  exists (`facts-sweep`, `image-reuse`, `cross-client-grep`), otherwise screenshots of each page at
  1440 and 390.
- Write the scope in the change list and the pin reply: `scope: site-wide, 38 pages checked` or
  `scope: this page only, because …`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
