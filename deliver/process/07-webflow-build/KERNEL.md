# 07 Webflow Build — Kernel cloud-browser paste (experimental)

A token-light alternative to driving the Webflow Designer through the
Claude-in-Chrome extension. The extension is expensive because an LLM *perceives*
the Designer (DOM dumps + screenshots) on every step. Here a **deterministic
Playwright script** drives a [Kernel](https://www.kernel.sh/) cloud browser
instead, so per-action LLM cost is ~zero — the model only writes/maintains the
script and reads the `verify.mjs` staging diff.

This reuses the existing paste pipeline unchanged: same `paste_*.html` files,
same `@webflow/XscpData` clipboard payload, same `verify.mjs`. The only thing
that changes is **who clicks "Copy" and Ctrl+V**.

## Why this clears the two blockers

1. **Login / CAPTCHA** — a stock headless Playwright can't log into Webflow
   ([reference_webflow_playwright_verify]). Kernel **profiles** persist a
   logged-in session: you log in once by hand through the live view, and every
   later run reuses the cookies with no re-auth.
2. **Token cost** — the script drives the browser directly; no LLM-in-the-loop
   perception.

## The clipboard detail that makes it work

Webflow's paste handler reads the payload from the `application/json` MIME type.
The modern async Clipboard API **cannot** write arbitrary `application/json`, so
you cannot just set the clipboard from code. The generated `paste_*.html` already
solves this with the legacy `execCommand('copy')` + copy-event trick (see
`html-to-webflow-clipboard.md` §Clipboard Format). Playwright's `.click()` is a
**trusted** gesture, so clicking that page's button fires the same handler and
writes `application/json` exactly like the manual flow. That's why the spike
loads the real `paste_*.html` rather than reinventing the clipboard write.

## Setup

```bash
# from this folder (07-webflow-build)
npm install            # @onkernel/sdk + playwright already in package.json
```

Set your key (get it from the Kernel dashboard):

```bash
export KERNEL_API_KEY=...                 # bash
# $env:KERNEL_API_KEY='...'               # PowerShell
```

## Step 1 — capture the Webflow login once

```bash
node kernel-login.mjs
```

Open the printed live-view URL, log into Webflow fully (CAPTCHA/2FA included),
then press Enter. The script deletes the browser, which persists the session into
the `webflow` profile. Re-run only if the session later expires.

## Step 2 — prove the paste on a scratch page

Make an empty scratch page in the target Webflow site, open it in the Designer,
and copy that Designer URL.

```bash
# clipboard-proof mode: you do the canvas-click + Ctrl+V in the live view
node kernel-paste.mjs "<designer-url>" .tmp/index/paste_03_home.html
```

If the section appears, the clipboard mechanism works in the cloud browser — the
one real unknown. Then try the unattended path:

```bash
node kernel-paste.mjs "<designer-url>" .tmp/index/paste_03_home.html --auto-paste
```

Screenshots land in `.tmp/kernel/`.

## Step 3 — verify (unchanged)

Publish, then run the existing token-light staging diff:

```bash
node verify.mjs https://[client-name].webflow.io/<page>
```

## Known limits / next steps

- **No Relume extension in the cloud browser**, so cross-page class dedup isn't
  available. Prove on a scratch/first page. For real multi-page paste without the
  extension, regenerate with the converter's `--avoid` (see
  `html-to-webflow-clipboard.md` §A.2), or load Relume via
  `kernel.browsers.loadExtensions(...)` (the SDK supports unpacked extensions) —
  a later step.
- **Designer canvas selectors** aren't hard-coded; `--auto-paste` clicks the
  canvas centre by coordinate. If paste targets the wrong element, fall back to
  default mode and click the intended element in the live view.
- **Stealth is off on purpose** — a stable IP keeps the saved Webflow session
  valid; stealth's rotating proxy tends to invalidate it.

## Files

- [kernel-login.mjs](kernel-login.mjs) — one-time login capture into a profile.
- [kernel-paste.mjs](kernel-paste.mjs) — paste-one-section spike (default +
  `--auto-paste`).

## Version Control

Follows [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit the scripts and
this doc; never commit `KERNEL_API_KEY` or any `.env`.
