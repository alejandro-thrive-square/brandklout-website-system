## DONE 2026-08-22 (session 8): a pasted SCRIPT now runs — plugin v1.2.0

**The client's requirement was "add iframes AND SCRIPTS in an embed element, so developers and marketers can embed without any problem, like on Webflow".** v1.1.0 delivered half of it: iframes worked, and a pasted script silently did nothing — an inline `<script>` had no `'unsafe-inline'` to run under, and an external one needed an operator to type its origin into plugin settings first.

**v1.2.0 derives the policy from the published page instead of asking for it in advance.** `autoTrust` (a new toggle, default ON) makes the `publish.html` filter read the finished HTML and grant that page exactly what it contains:

| Found in the page | Granted, on that page only |
|---|---|
| `<iframe src>` cross-origin | `frame-src <origin>` |
| `<script src>` cross-origin | `script-src <origin>` |
| an inline `<script>` | `script-src 'sha256-<hash>'` |
| per trusted SCRIPT origin | `connect-src`, `style-src`, `font-src` |

Inline scripts are trusted by HASH, never `'unsafe-inline'` — the filter carries a pure-JS SHA-256 (no `crypto` in the QuickJS sandbox) checked against `node:crypto` in the tests. A frame origin gets frame-src only: the framed document has its own policy and cannot reach into ours. Per-page, so a widget on `/contact` widens nothing on `/veneers`. Turn the toggle off and it is v1.1.0 exactly.

Installed and `active` on `encorercm.com`, `autoTrust: true`.

```bash
node test-embed-origins.mjs                                  # 35/35 (24 new)
node test-embed-module.mjs                                   # 44/44 unchanged
node verify-embed-scripts.mjs --place                        # temp page + publish
node verify-embed-scripts.mjs --check                        # 12/12 at 1440
node verify-embed-scripts.mjs --check --viewport=390,844     # 12/12 at 390
node verify-embed-scripts.mjs --cleanup                      # deleted, 404 confirmed
```

`verify-embed-scripts.mjs` pastes what a marketer would paste — the vendor's iframe, the vendor's script and an inline script — and asserts EXECUTION, not presence, because a refused script still sits in the DOM looking fine. The external half is `reputationhub.site/reputation/assets/review-widget.js`: on `lc.setHeight` it sets the iframe's `height` ATTRIBUTE and a `transition` style, and nothing else on the page does that, so the attribute appearing IS proof a cross-origin script ran.

**Still not supported, deliberately:** an inline `onclick="…"` written on a tag inside a pasted snippet. It needs `'unsafe-hashes'`, a broader grant than it appears. Workaround (in the guide): move the handler into the snippet's own `<script>`.

### The bug the live gate caught, which the unit tests had not

**Creating `font-src` for a vendor silently REVOKED the site's own webfonts.** An absent directive falls back to `default-src 'self'`; writing `font-src https://vendor` replaced that fallback with a list the site's own fonts were not on. Chrome reports it once per font file as a `font-src` violation, which reads like a font problem, and the page renders in Times. `widen()` now seeds a created directive from `default-src` (dropping `'none'`) before adding anything, and there are four unit tests plus a live assertion on it. **Any future directive this filter creates must inherit the same way.**

### Gotchas

- **`.note` was not a class.** The guide defines `td.note` only; a `<p class="note">` styles nothing. Check a class exists before reaching for it in an established design.
- **Bash heredocs collapse doubled backslashes** (already in memory, cost time again twice today). It turned `new RegExp('\b' + name + …)` into `''` — a BACKSPACE character — so `attr()` matched nothing and the derived policy came out empty while every inline-hash test still passed. The regexes are literals now. It also ate a `'` in a JS string and produced a syntax error. When a heredoc must carry backslashes, verify the bytes afterwards.
- **Republishing an artifact you did not publish in this session is refused twice**: once to make you read the live version, once more if you resend identical bytes. `action: "read"` then publish. The live copy differed from the committed file only by the platform's own wrapper.
