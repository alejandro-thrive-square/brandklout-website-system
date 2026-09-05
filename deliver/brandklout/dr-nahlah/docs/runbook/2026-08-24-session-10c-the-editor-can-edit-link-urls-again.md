## DONE 2026-08-24 (session 10c): the editor can edit link URLs again — PATCH WRITTEN, NOT DEPLOYED

> [!WARNING]
> **SUPERSEDED by 10d — the patch was REJECTED and will not be deployed.** The
> diagnosis below is accurate and was re-verified; the remedy was not taken. In
> particular, "a plugin module cannot fix this" was concluded without examining
> the editor-plugin surface, which is what the Link Editor plugin now uses.

The client reported a button URL that would not edit. It is not permissions and
it is not that button: **the Instatic editor cannot express a relative URL, an
anchor or a `tel:` link at all.**

### The mechanism, precisely

`UrlControl` commits only on a valid value — `if (valid) onChange(propKey, v)` —
and `isValidUrl()` accepted absolute `https:` / `http:` / `mailto:` **only**.

Because the input is controlled from the store and the store is only written on
a valid value, every keystroke that leaves the value invalid is discarded and
the field re-renders from the old value. Backspacing `#invitation` passes
through `#invitatio`, `#invitati`, … — each schemeless, each rejected, each
snapped back, so the empty string that WOULD be accepted is unreachable. **The
field cannot be edited or cleared.** It reads as broken, not as restricted.

On this site that is **2,362 of 2,510** link/button nodes: 1,954 relative
`base.link`, 345 `tel:`, 29 `#fragment` buttons, 33 relative buttons.

### What was ruled out first, and why it matters

- **Not a role gate.** A `url` control with no declared category resolves to
  `content` (`CONTENT_CONTROL_TYPES` in `propertySchema.ts` includes `url`), so
  `site.content.edit` covers it. Worth remembering the asymmetry that does
  exist: `site.structure.edit` does NOT imply content editing.
- **Not the publisher.** `isSafeUrl()` explicitly allows `#anchor`, `/a`,
  `./a`, `a.html`, `?q=1`, `//cdn.example/x`, and `tel:`/`sms:`.
- **A plugin module cannot fix this** — and this is the trap worth recording.
  Overriding `base.button` is blocked by a namespace lock in
  `moduleAdapter.ts`, and a plugin's OWN module is worse for styled elements:
  `pluginModuleComponentFactory` puts author classes on a host-rendered
  **wrapper div**, while the publisher's `injectNodeClassIds` puts them on the
  module's **root element**. A migrated CTA would publish as
  `<a class="btn …">` and render in the canvas as
  `<div class="btn …"><a>…</a></div>` — gradient and padding on a div, label
  unstyled, `.btn > span` and `.btn::after` dead. Plugin modules also have no
  `inlineTextEdit`. **Do not migrate styled elements to plugin modules.**

### The patch

`deliver/brandklout/dr-nahlah/workflows/17-instatic-platform-patch/` — read the
directive there. Three files, +131/−14, against **0.0.16**:

- `html-sanitize/index.ts` exports `SAFE_URL_SCHEMES` (no logic change);
- `utils/urlValidation.ts` — `isValidUrl()` imports that set and accepts
  relative values, rejecting only schemeless values that contain whitespace or
  control characters (so `not a url` still fails);
- the test file — two assertions inverted deliberately, 13 cases added.

**Sharing the scheme set is the design, not a tidy-up:** the input gate is now
provably a SUBSET of the enforcement gate, so the editor cannot save an href the
publisher would strip to `#`, and the two cannot drift apart again.

**Blast radius is one control.** The shared `isValidUrl` has exactly one
consumer, `UrlControl.tsx`. `core/forms/validation.ts` has its own local
`isValidUrl` for submitted form values; `MediaLibraryControl` uses
`isValidImageUrl` and a local `isHttpUrl`. Neither is affected.

### Verified

- `node verify-isvalidurl.mjs` — **36/36**. Covers the platform's own existing
  assertions, the two that change, the unblocked cases, and the C0-control and
  tab `javascript:` bypasses. It re-reads the real `.ts` files and fails if
  either function body drifts from what it exercises.
- `git apply` onto a pristine 0.0.16 tree: clean, line endings stay CRLF with
  no mixing, and the applied tree passes the same 36.
- **Deployed version confirmed**: GHCR tops out at `0.0.16` and `latest` +
  `0.0.16` are the SAME digest (`sha256:d940465d…f623fcbe`), so the source drop
  matches production exactly. No downgrade risk.

### NOT done

**`tsc -b` has not run.** `bun` is not installed and Docker Desktop's daemon was
not running, so `docker build` failed to connect. The logic is verified; the
compile is not. Start Docker Desktop and run the step-C block in the directive
before deploying.

Nothing is deployed. Railway service `Dr Nahlah` still runs
`ghcr.io/corebunch/instatic:latest`.

### Also still open from 10a/10b

1. The contact split and the CTA-offices work sit on the **draft at `seq 67`**,
   unpublished and uncommitted.
2. **The CTA scroll change is PARKED at the client's request** until this
   editing route lands: 23 pages with a `#book` CTA section get `#book`;
   `posts`, `post` and `video-library` have no CTA section and get the contact
   page. Once the patched image is live, those hrefs are editable in the panel.
3. The home page still has ZERO `.rv-card` review fallbacks.
