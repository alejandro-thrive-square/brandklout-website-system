# Converting the code-asset CSS into registry rules

The conversion uses **Instatic's own `cssToStyleRules`** rather than a reimplementation. That function decides class-vs-ambient, folds `@media` into the site's breakpoints, mints condition ids, and turns `@keyframes` into `rawCss` — reproducing that by hand would drift from what the editor expects, and the drift would only show up as a subtly wrong Styles panel weeks later.

It is a pure function with no DB or network dependency, but it needs a `CSSStyleSheet` constructor. The Railway container already carries the full TypeScript source (`/app/src`), `node_modules` including `happy-dom`, bun, and the tsconfig path aliases — so it runs there with nothing to install.

## Procedure

```bash
# 1. Assemble the input in cascade order: runtime-states.css, then site.css.
#    Take them from the LIVE published bundle, not a local copy — the draft
#    copy of site.css is the truncated one.
curl -s https://<site>/_instatic/css/userStyles-<hash>.css > migrate-input.css

# 2. Ship it (gzip + base64, in chunks — `railway ssh` takes the payload on the
#    command line and fails silently past ~10 KB per invocation).
gzip -9 -c migrate-input.css | base64 -w0 > migrate-input.b64
split -b 6000 migrate-input.b64 chunk-
for f in chunk-*; do railway ssh "printf '%s' '$(cat $f)' >> /app/mi.b64"; done
railway ssh "base64 -d /app/mi.b64 > /app/migrate-input.css.gz"

# 3. Convert.
railway ssh "cd /app && bun run /app/conv-run.ts"

# 4. Bring the result back into output/conv-out.json.
railway ssh "gzip -9 -c /app/conv-out.json | base64 -w0" > conv-out.b64
tr -d '\r\n' < conv-out.b64 | base64 -d | gunzip > output/conv-out.json
```

`conv-preload.ts` and `conv-run.ts` in this folder are the two files copied to `/app`.

## Why `conv-preload.ts` uses `GlobalWindow`

happy-dom's `Window` is not enough: its CSS parser reaches for `this.window.SyntaxError` when it rejects a selector, and with a plain `Window` that constructor is undefined, so the parse dies with `undefined is not a constructor` instead of a warning. `GlobalWindow` exposes the JS built-ins as window properties. Instatic's own test setup (`src/__tests__/setup.ts`) documents the same trap.

## The silent-loss trap

**`@media(min-width:720px)` — no space after `@media` — converts to nothing. No rule, no warning, no error.**

Browsers accept the space-less prelude, so the published site looks fine and the CSS is genuinely valid in the wild. happy-dom's parser rejects it, and `cssToStyleRules` reports an empty result for the whole block rather than a warning. 52 of this site's 64 `@media` blocks are that form, because the local build minifies them — a conversion without normalisation drops nearly all responsive CSS while reporting success.

`conv-run.ts` normalises the preludes first and prints the count. Two things it fixes:

1. `@media(` -> `@media (` so the block parses at all.
2. `(min-width:720px)` -> `(min-width: 720px)` so the derived condition id matches the site's existing `site.conditions` entries, which are all spelled with the space. Without this you get `media:(max-width: 679px)` and `media:(max-width:679px)` as two separate conditions and two `@media` blocks in the output.

Verify after every run: the printed condition list should contain no two entries differing only in whitespace, and `withContexts` should be in the dozens, not single digits. Single digits means the normalisation regressed.

## Result on this site (2026-08-21)

```
614 rules — 286 class, 328 ambient
 71 rules carry breakpoint or condition overrides
 23 conditions (13 already existed on the site)
 45 duplicate-class warnings — expected: runtime-states.css and site.css
    overlap, and later-wins is the correct cascade reading
```

Against the existing 680-rule registry: 51 converted rules fill an **empty** class rule, 291 merge into a live rule, 272 are new selectors. `.rv-card` gains its 5 declarations and `.rv-card:hover` appears for the first time.
