# Workflow: 17 - Instatic Platform Patch

> [!WARNING]
> **NOT DEPLOYED, AND DELIBERATELY SO (2026-08-24).** The client's decision: patching the
> Instatic image creates maintenance debt, because the diff has to be re-applied on every
> upstream release. The same problem is now solved by the **Link Editor plugin**
> ([workflow 16](../16-instatic-plugins/16-instatic-plugins.md)), which needs no platform
> change and survives an upgrade like any other plugin.
>
> This workflow is kept as **reference**, not as a pending deployment. The analysis of
> `UrlControl` / `isValidUrl` in it is accurate and was re-verified against source; only the
> remedy was rejected. Do not deploy it without a fresh decision.
>
> One correction to the record below: the claim that a plugin cannot fix this was reached by
> testing only `modules.register`. It never examined the **editor-plugin surface**
> (`editor.code`, `editor.store.read` / `.write`, `editor.panels`), which is fully implemented
> in 0.0.16 and is what the Link Editor uses.

## Client-Facing Overview
Link addresses can be edited in the Instatic visual editor again — internal pages, on-page anchors and phone numbers included — instead of only full `https://` web addresses.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the patches or technical logic of this workflow must be documented here immediately.

> [!IMPORTANT]
> **This patches a THIRD-PARTY platform.** Instatic is `corebunch/instatic`; we
> self-host it. Everything here is a diff against a released version, never a
> fork we maintain in this repository. Re-read [Upgrading](#upgrading) before
> taking any new upstream release.

## Operational Purpose

**The editor could not express a link its own publisher emits.**

`UrlControl` — the "Link URL" field on every Button and Link — commits a value
only when `isValidUrl()` passes:

```ts
const valid = isValidUrl(v)
setError(!valid)
if (valid) onChange(propKey, v)   // invalid values are never committed
```

And `isValidUrl()` accepted **absolute `https:`, `http:` and `mailto:` only**.
Its own doc comment listed what it rejected: *"custom schemes, **schemeless
values**, and malformed absolute URLs."*

So `#book`, `/contact`, `contact.html` and `tel:+15717029900` could not be
typed into a link field at all. On the Dr. Nahlah site that is **2,362 of 2,510
link and button nodes** — every internal link, every telephone link, every
anchor.

**It presents as a broken field, not a restricted one.** The input is
controlled from the store and the store is only written on a valid value, so
every keystroke that leaves the value invalid is discarded and the field
re-renders from the unchanged value. Backspacing `#invitation` passes through
`#invitatio`, `#invitati`, … — each schemeless, each rejected, each snapped
back. The empty string that *would* be accepted is unreachable. The field
cannot be edited **or cleared**, and shows a red "Invalid URL".

### Why relaxing it is not a security change

The platform separates the two gates itself, and says so in
`src/core/utils/urlValidation.ts`:

> These are the **input-boundary** gates, applied at user-input / site-load
> time. `isSafeUrl()` in `@core/html-sanitize` is the **enforcement** gate,
> applied at HTML export time.

`isSafeUrl()` has always allowed every relative form — its comment lists `/a`,
`./a`, `../a`, `a.html`, `#anchor`, `?q=1`, `//cdn.example/x` — plus
`SAFE_URL_SCHEMES` = http, https, mailto, **tel, sms**. The input gate had
simply drifted narrower than the gate that actually protects the output.

The patch makes the input gate import `SAFE_URL_SCHEMES` from the enforcement
gate rather than restate a list. **The input gate is now provably a subset of
the enforcement gate**: the editor can no longer save an href the publisher
would strip to `#`, and the two cannot drift apart again in a later edit. Every
dangerous scheme is still rejected in both places.

Typo-catching, which was the strict validator's one real benefit, is kept: a
schemeless value containing whitespace or a control character is still refused,
so `not a url` and a value carrying a pasted non-breaking space still fail.

## The patch

`patches/0001-isvalidurl-accept-relative-and-safe-schemes.patch` — three files,
+131 / −14, against **0.0.16**.

| File | Change |
| :--- | :--- |
| `src/core/html-sanitize/index.ts` | `SAFE_URL_SCHEMES` becomes an export. No logic change. |
| `src/core/utils/urlValidation.ts` | `isValidUrl()` accepts relative values and every `SAFE_URL_SCHEMES` scheme. `isValidImageUrl()` untouched. |
| `src/__tests__/utils/urlValidation.test.ts` | Two assertions inverted deliberately; 13 cases added, including a subset-property test. |

### Blast radius is one control

The shared `isValidUrl` has exactly **one** consumer,
`src/admin/pages/site/property-controls/UrlControl.tsx`. Checked, because the
name appears elsewhere:

- `src/core/forms/validation.ts` declares its **own local** `isValidUrl` for
  submitted form values and does not import this one — form URL fields are
  unaffected;
- `MediaLibraryControl.tsx` uses `isValidImageUrl` and a local `isHttpUrl`.

### The two inverted assertions

`/relative/path` and `//example.com` were asserted invalid and are now valid.
That is the point of the patch, not a casualty of it. `not a url` still fails.

## Execution Steps

### A. Verify the logic (no toolchain needed)
```bash
node verify-isvalidurl.mjs        # 36 assertions, ~1s
```
Transliterates both patched functions into plain JS and drives them against the
platform's own existing assertions, the two that change, the cases the patch
unblocks, and the C0-control / tab `javascript:` bypasses. It re-reads the real
`.ts` files and **fails if either function body has drifted** from what it
exercises, so it cannot silently test a stale copy.

Run it against a checkout at `C:\ifork\Instatic-main`, or edit the two paths in
`assertMatchesSource()`.

### B. Apply
```bash
# from a clean 0.0.16 source tree
git apply --check deliver/.../17-instatic-platform-patch/patches/0001-*.patch
git apply           deliver/.../17-instatic-platform-patch/patches/0001-*.patch
```

### C. Build and test
```bash
bun install --frozen-lockfile
bun test src/__tests__/utils/urlValidation.test.ts
bun test src/__tests__/security/urlSchemeBypass.test.ts       # must stay green
bun test src/__tests__/architecture/single-url-scheme-guard.test.ts
bun run build                                                  # tsc -b typechecks
docker build -t <registry>/instatic:0.0.16-urlpatch .
```

### D. Deploy
Railway project `Brandklout` → service `Dr Nahlah`. Repoint the image from
`ghcr.io/corebunch/instatic:latest` to the patched tag. **Pin a version tag,
never `latest`** — see below.

## Technical Setup

- **Deployed version, confirmed 2026-08-24**: the GHCR tag list tops out at
  `0.0.16`, and `latest` and `0.0.16` resolve to the **same digest**
  (`sha256:d940465d…f623fcbe`). The source drop this patch was written against
  is therefore exactly what is running. **Re-check this before applying** —
  patching an older tree than production would be a downgrade.
- **Build toolchain**: bun 1.3.11 (per the Dockerfile). Neither bun nor a
  running Docker daemon is required for step A.
- **Upstream**: <https://github.com/corebunch/instatic>. This is worth offering
  upstream — it is a two-line behaviour change that brings the input gate in
  line with the project's own documented design, and it removes a duplicated
  scheme list rather than adding one.

## Gotchas

- **Extract to a short path on Windows.** `zipfile.extractall` into the session
  scratchpad dies on `MAX_PATH` partway through
  (`agent-system-prompt-no-module-enumeration.test.ts` is the usual casualty),
  leaving a half-extracted tree. `C:\ifork` works.
- **Do not write the regex through a bash heredoc.** Heredocs here collapse
  doubled backslashes, so `\\u0000` becomes a real NUL byte in the TypeScript
  source — valid as a regex, invisible in review, and a NUL in a `.ts` file.
  Write it from a script file. This is the same trap recorded in the runbook for
  `16-instatic-plugins`.
- **The architecture guard is name-keyed, not concept-keyed.**
  `single-url-scheme-guard.test.ts` fails the build if anything outside
  `@core/html-sanitize` declares `isSafeUrl`, `safeUrl`, `hasDangerousUrlScheme`
  or `urlScheme`. Exporting a *constant* is fine; do not solve a future problem
  by re-implementing one of those four names here.
- **`new URL()` is a weak check for opaque schemes.** It accepts
  `tel:(571) 702-9900`, spaces and all. It earns its keep only on http/https,
  where it catches `http://` and `https://exa mple.com`.

## Rollback

**Repoint the image and redeploy.** Stock 0.0.16 is
`ghcr.io/corebunch/instatic@sha256:d940465d2b0f68b76d3e8347448d065df70763ae878ab748c2d8ce56f623fcbe`
(confirmed 2026-08-24 to be the same digest `latest` resolves to). Railway also
keeps deployment history, so redeploying the previous deployment does the same
thing without touching the image field.

**Pin by DIGEST, not by `latest`.** If the service tracks `latest` and upstream
publishes 0.0.17, a rollback would silently land on a version this patch was
never tested against.

### Rolling back cannot lose data — verified, not assumed

The patch adds one export and relaxes one predicate. There is no migration, no
schema change, and no change to how anything is stored.

The question that actually matters is what happens to hrefs saved WHILE patched
— `#book`, `/contact`, `tel:+15717029900` — if the image goes back to stock.
They survive, and they keep publishing correctly:

- **Nothing validates on load.** `isValidUrl` has exactly two callers in the
  whole codebase: `UrlControl.tsx` (on keystroke) and a separate local copy in
  `core/forms/validation.ts`. The module's own header says these gates apply "at
  user-input / site-load time", but no load-time caller exists. Checked, because
  if one did, a rollback would scrub those values on the next site load.
- **The stored prop has no URL constraint.** `base.link` and `base.button`
  declare `href: Type.String({ default: '#' })`, so `validateNodeProps` cannot
  coerce or drop a relative value.
- **The publisher always accepted them.** `isSafeUrl()` allows every relative
  form and `tel:`/`sms:`, so the published page is byte-identical either way.

So a rollback costs exactly one thing: those fields become uneditable in the
panel again — which is today's behaviour. It returns you to the status quo, not
to a broken site.

### The other two layers

Rolling back the image is unrelated to rolling back CONTENT. If a publish goes
wrong, that is:

- the **draft** — `15-instatic-api-sync`'s `restore-pages.mjs` +
  `rollback-registry.mjs`, from a `backup.mjs` snapshot;
- the **published site** — the platform's own version history, which as of
  2026-08-24 holds **1,190+ retained versions**.

> [!CAUTION]
> That history is also filling the disk. The Railway volume is **669 MB of 879 MB
> (78%), ~194 MB free**, and a publish costs ~15 MB — roughly 13 publishes of
> headroom. **At ~90% writes fail SILENTLY**, with no 5xx and no error. Run
> `node ../15-instatic-api-sync/prune-versions.mjs --keep 3` (frees ~265 MB)
> before a run of publishes. Pruning permanently deletes the ability to roll
> back to an older publish, so take a `backup.mjs` snapshot first.

## Upgrading

The patch touches three files that upstream is likely to keep editing.

1. Confirm the new tag's digest, then extract that version's source.
2. `git apply --3way`. If `urlValidation.ts` has been rewritten upstream, check
   whether they have fixed this themselves — if `isValidUrl` already accepts
   relative values, **drop this patch entirely** rather than reapplying it.
3. Re-run step A, then C.
4. If the patch is dropped, delete this workflow and say so in the runbook.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **Committed**: the patch, this directive, and `verify-isvalidurl.mjs`.
- **Never committed**: the extracted Instatic source tree or any built image.
  `Instatic-main.zip` at the repo root is already gitignored (`*.zip`) and is
  the input, not an artifact of this workflow.
