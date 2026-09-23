# 2026-09-09, later — BugHerd removed from the build

Continues [`2026-09-09-bugherd-board-key-swapped.md`](./2026-09-09-bugherd-board-key-swapped.md),
which has the full diagnosis. That run swapped the board key and found the sidebar still would not
render because Instatic publishes `script-src 'self'; frame-src 'none'`.

## The decision

The client's call, once the diagnosis was in: *"So if it's not installed on the other sites might
be good to just remove it here."* Correct — the code was loading nothing on any host, and leaving a
dead third-party loader in a medical practice's bundle is worse than leaving nothing.

Two points from that exchange worth keeping straight:

- **"We don't have any plugins installed on Instatic for Stone, might be that."** Close to the
  mechanism but not the cause. That CSP is Instatic's unconditional **baseline** —
  `createBaseCspPlan` emits it whether or not plugins exist. Plugins are what could *relax* it, and
  only a plugin declaring bugherd.com in `frontend.assets[]` would have. Installing plugins
  generally would have changed nothing, so there was no misconfiguration to repair.
- **NordVPN was already excluded** before protection was disabled: the same tag injected into
  `example.com`, in the same browser, in the same session, loaded fine. The block was only ever in
  this page's CSP context.

## Done

- Deleted `site-src/js/90-bugherd.js` and `site-src/bugherd-test.mjs`. The test's only subject was
  the deleted module, and it was never able to prove what everyone assumed it proved — it aborts
  bugherd.com requests and asserts the HOST GATE, so it passed 104/104 throughout the period the
  widget did not work.
- Rebuilt: `site.js` 61.1KB -> **56.4KB**, zero occurrences of `bugherd` in the bundle.
- `audit.mjs` `FAIL none` / `WARN none`; `check-copy.mjs` clean.
- Republished all 52 pages; `verify-live.mjs` `FAIL none`; `compare-live.mjs` no differences.
- Corrected the directive. `21-instatic-upload.md` told the next reader that a third-party tag
  belongs in a `site-src/js/` module — **advice that cannot work on this instance**. It now carries
  a warning pointing at trap 29, and trap 29 is written about the CSP rather than about BugHerd, so
  it still applies to the next analytics tag or chat widget somebody proposes.

## Gotchas

- **Do not re-add BugHerd, or any third-party script, as a tag or a runtime injection.** Both are
  blocked identically; the runtime injection just fails later and less visibly. The two supported
  routes are an Instatic module declaring `cspSources` and a plugin declaring `frontend.assets[]`.
- **A script working on another client's site proves nothing here.** `westlaimplants.com` and
  `novismilerogers.com` serve no CSP at all — older Instatic. Check the target instance's CSP
  first, with `curl -s <url> | grep -o '<meta http-equiv="Content-Security-Policy"[^>]*>'`.
- **`check-standalone.mjs` does not run** — it wants a `preview-home.html` that does not exist.
  Pre-existing, unrelated to this removal, and not investigated.
- The BugHerd board key `whxgp1fjoqpgvwaf6mdttg` is recorded in the previous run file if the review
  round is ever revived through a supported route. It is a public client-side key, not a secret.

## Next

Unchanged: `capture()` in `compare-live.mjs` still needs a `pg.close()` so `--shots` survives a
full run. The journal still has had no client review pass — through the BugHerd browser extension,
or by having Instatic relax the CSP, not through this repository.

## Version Control

Tracked. Committed with the work it describes.
