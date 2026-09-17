## DONE 2026-08-22: the live Google review widget is on the site — `eee062a`

**The reviews on `encorercm.com` are now the client's real vendor widget**, not
the generated `.rv-card` wall. The cards stay in the DOM as the no-JS copy and
as the fallback.

**`script-src` was never granted, and that is the point.** The embed gate's
table reads as though a working widget costs both `frame-src` and `script-src`.
It does not. The vendor's parent script has one job — resize the iframe from the
`lc.setHeight` message the frame posts — and the frame posts that message with
no parent script present at all. `16-instatic-plugins/probe-widget-postmessage.mjs`
proves it off the client's site: a bare localhost page, no CSP, no vendor
script, and the widget reports `{height: 1968}` unprompted.

So `site.js` applies the height itself and no longer injects the vendor script.
`reputationhub.site` stays a cross-origin iframe, which cannot touch the
document, its storage or its cookies. **Run that probe before granting any
`script-src` origin on any client.** Many vendor parent scripts are pure
convenience and the grant is not.

Live allowlist now: `frameOrigins = https://reputationhub.site`, script and
connect empty.

**The trap that hid this:** `site.js` wired `sc.onerror = reject`, so widening
`frame-src` WITHOUT `script-src` tore the *working* widget back down. The
low-risk half of the allowlist looked useless when it was only our own code
insisting on the script.

**The second trap, worse:** `probe-rv-live.mjs --block` was not blocking
anything. `Network.setBlockedURLs` is scoped to the CDP session it is sent on,
and the widget frame is cross-origin so it renders out-of-process with its own
target. It only ever worked because the blocked resource was a SCRIPT the main
frame requested; the moment that went away, the "blocked" run loaded the widget
happily and still printed PASS. Blocking now happens at the browser with
`--host-resolver-rules=MAP reputationhub.site 127.0.0.1:1`, and the assertions
read the rendered box rather than the `height` attribute the vendor script used
to set.

Gates on the PUBLISHED site, both viewports:

```bash
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/                     # PASS  884px
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/ --viewport=390,844  # PASS 2156px
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/ --block             # PASS  cards hold
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/ --viewport=390,844 --block
```

The two heights differ because the postMessage sizing is real, not a baked
number.

**NEW TOOL: `15-instatic-api-sync/push-script-asset.mjs`.** Replaces one code
asset's content in a single atomic shell write (`PUT /site-document`, optimistic
`seq`), instead of the MCP bridge's ~10 KB chunks — the path that silently
truncated `site.css` once. It reads the asset back and refuses to report success
unless byte-exact. Use it instead of `13-content-export-import/.tmp/push-site-js.mjs`,
which needs the editor open in a browser.

Volume before this publish: **32% used, 593 MB free** (~35 publishes of room).
Published 35 pages.

### Still open — the HighLevel form

The other half of the original question is untouched. The consultation/booking
form would need `frameOrigins` extended to the HighLevel origin, and the same
probe should be run first to see whether its parent script is load-bearing.
Nothing has been decided about placing it.

## Audit of the published site after the widget went live — 73/73 clean

`node 08-qa/.tmp/audit-site.mjs --base https://encorercm.com`, one complete run,
~20 minutes, exit 0.

**73 URLs audited, 73 `ok: true`, every one HTTP 200.** Across all 73 the audit
finds exactly one thing:

    netFailed: [" Script"]

An unnamed script that fails to load on **every** page. It is **pre-existing and
not ours** — the home page carried `[" Script", "net::ERR_BLOCKED_BY_CSP
Document", " Script"]` before this work and carries `[" Script"]` now. The
blocked Document was the review widget being refused; one of the two failed
Scripts was the vendor script we stopped injecting. **Identifying that remaining
script is the top open item** — it has never been diagnosed.

Everything else is empty: zero `jsErrors`, zero `imgNoAlt`, no broken images, no
`overflowX`, no stuck reveals, no drawer problems, every page exactly one `h1`.

Home page, confirming the upgrade landed:

    iframes: ["https://www.youtube.com/embed/HiNtywrb4Yg",
              "https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7?…"]

### Read this before you quote a number from `audit-out/`

Two ways this run misled me, both now avoidable:

**1. A file count is NOT a completion signal.** `audit-out/` already held 77
files from the previous run and this one overwrites them **one at a time**. I saw
77 files, concluded "finished", aggregated, reported "77/77 ok" and committed —
while the run was still going. The aggregate was over a mix of two runs. Check
mtimes instead:

```bash
find audit-out -name '*.json' -newermt "-25 minutes" | wc -l   # this run
find audit-out -name '*.json' | wc -l                          # all files present
```

**2. Four files are STALE LEFTOVERS from 2026-08-19** for slugs the site no
longer serves, and they are indistinguishable from real results by name alone:

- `all-on-four-your-questions.json`
- `are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with.json`
- `dental-implants-everything-you-need-to-know.json`
- `porcelain-veneers-the-answers-to-your-questions.json`

I quoted `all-on-four-your-questions` as evidence that a `TypeError` in
Instatic's bundle was "pre-existing and unchanged". It was neither — I was
diffing a 2026-08-19 file against its own committed copy, which is unchanged by
construction and proves nothing. **In the real run there are no `jsErrors` at
all.** Delete these four, or re-derive the page list, before the next audit.

**3. The background run's stdout is truncated to the tail** (~2.5 KB retained),
so it shows perhaps 30 of the rows. The per-page JSON is the record; stdout is
not.
