## CURRENT PRIORITY (2026-08-21): Dr. Nahlah on Instatic — migration DONE and live; embeds are the open question

**You are in the `bk-dr-nahlah` worktree** at
`C:/Users/ACER/orca/workspaces/Webzite Agentic Workflow/bk-dr-nahlah`, branch
`bk-dr-nahlah`, head **`d8b1255`**. All Dr. Nahlah work lives here now (see the
Moved-here note at the top of this file). Main still holds its own copy; nothing
was deleted there.

Everything below is in
`deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/`. Read
`15-instatic-api-sync.md` and `convert-css.md` there before touching any of it —
they carry detail this summary does not.

### State: the CSS migration is complete, published, and verified

The client could not edit the Google-reviews hover because Instatic keeps **two
CSS layers** and the Styles panel reads only one. The design had been pushed as
code-asset stylesheets (`userStyles.css`, loads LAST, wins every tie) while the
panel reads `site.styleRules`. Result: 158 empty class chips, no hover rule to
select, and panel edits silently overridden.

Now: **885 registry rules, both code assets `enabled:false`, `userStyles.css` no
longer linked at all.** `.rv-card:hover` is a real ambient rule the panel can
edit. Parity against the old code-asset rendering is **0 differences on 557,670
computed values across 28 pages, at BOTH 1440 and 390**.

Rollback for the whole thing is one command:
`node toggle-code-assets.mjs on --apply` then publish. Content was never deleted.

### Also fixed this session

- **The draft `site.css` was truncated** (a chunked push lost its opening
  ~13.7 KB). Publishing would have dropped the global box-sizing reset, the
  fluid type scale and six `--gold*`/`--black` tokens. Repaired from the served
  bundle, byte-exact.
- **The web fonts were never installed.** The build loads Playfair Display +
  Raleway from Google Fonts via `<link>`; Instatic drops external link tags and
  the CSP blocks the origins anyway, so **every heading had been rendering in
  Times New Roman**. Installed via `POST /admin/api/cms/fonts/install` (22 files,
  743 KB, self-hosted under `/uploads/fonts/`, CSP-clean). `@font-face` lands in
  **`framework.css`**, not `style.css` — grepping style.css returns 0 and looks
  like failure.
- **Four panel edits were re-applied, then reverted.** `.wrap` lost `width:100%`
  and `max-width`, and `.tf-pin` is a grid, so the wrapper collapsed 1440px to
  770px and broke Chapter Four. Those edits had never rendered before, so their
  real effect only appeared once the panel started winning. Authored values
  restored. They are still recorded in `.tmp/unpublished-panel-edits.json` if the
  client wants them redone deliberately.

### THE OPEN QUESTION: third-party embeds (HighLevel forms, review widgets)

**Proven impossible today, and it is NOT an API or markup problem.** Run
`node test-embed.mjs` — it injects the real LeadConnector snippet into a live
page and reports what the browser does. Current verdict:

```
script  ->  net::ERR_BLOCKED_BY_CSP   violates script-src 'self' 'sha256-...'
iframe  ->  element is created and sits in the DOM, but the load is refused:
            "Framing 'https://reputationhub.site/' violates ... frame-src
             https://www.youtube-nocookie.com https://www.youtube.com"
```

Three facts that close the easy answers:
- the `<iframe>` element exists — the policy just will not load it, so no
  cleverness in HOW we insert it helps;
- there is **no configuration escape**: the server reads no CSP env var, there is
  no site setting, and `frame-src` is only ever lifted by a module's
  `cspSources` contribution, of which `base.video` (YouTube) is the only one
  shipped. Plugins cannot do it either — `moduleAdapter.ts` does not forward
  `cspSources` from plugin modules;
- **`frame-src` never includes `'self'`**, so even proxying the widget through
  our own origin would not render it.

**Decided:** no fork. The user rejected patching the image (maintenance burden
across every client) and I agreed.

**Not decided — this is what to pick up.** Instatic is **MIT,
`github.com/corebunch/instatic`, v0.0.16**, pre-1.0, with a CONTRIBUTING.md
inviting contributions. Upstream therefore costs no maintenance, and the feature
is small: `base.video` already renders an iframe AND declares its origin as a
per-page `cspSources` contribution — an Embed module with an author-supplied
origin is the same shape.

Offered, never answered yes/no:
1. open the upstream issue with the evidence above;
2. start the **native reviews** pull for Dr. Nahlah — the site ALREADY renders
   Google reviews as real `.rv-card` markup, so the pattern is proven here and
   the work is automating the data, not embedding anything;
3. HighLevel forms via native `base.forms` posting to their inbound endpoint.

Cloudflare edge CSP rewrite is the shelved bridge if one client needs a specific
widget before upstream lands.

### DONE 2026-08-21 (late): the Railway volume, reclaimed — `0c0ce63`

**It was at 97%, 28 MB free — past the point where writes fail silently.** Now
**24%, 657 MB free**. `cms.db` went 636 MB → 25.8 MB.

There is now a tool for this; it is not an archaeology exercise any more:

    cd deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync
    node prune-versions.mjs                    # report
    node prune-versions.mjs --keep 3 --apply   # prune, compact, swap, restart

**Plan around ~15 MB per publish.** 657 MB is roughly 40 publishes. A heavy
debugging session spends that in an afternoon, so check the report before one.

Verified after the swap: all **38 published URLs 200**; ten pages **byte-identical**
to hashes taken before the swap; `integrity_check ok`, 0 FK violations; every
published row still owns its active version; 43/44 referenced runtime assets 200
(the 44th is a truncated prefix in the probe regex, not an asset).

**Retention is 1 version per page, not 3.** That was forced: mid-swap the volume
could not hold a 53 MB compacted copy *alongside* the live file (see trap 2 in
the directive — `rm` frees nothing while the server holds the inode), so the
database was shrunk to active-versions-only to fit in 47 MB. Page content is
completely intact; what is gone is platform-UI rollback to an older publish, and
the pre-prune backup went with `/tmp` on the restart. It cannot be recovered.
The next publish starts building history again under the keep-3 default.

The four traps that made this expensive — in-place `VACUUM` dies on a full
volume, `rm` frees nothing while the process runs, `/tmp` dies on restart, and an
unbatched `DELETE` fills the disk while emptying it — are written up in
`15-instatic-api-sync.md`, "The Railway volume, and pruning it".

Also removed: a stray `.claude/RUNBOOK.md` **template** that a Stop hook had
written inside `workflows/15-instatic-api-sync/`. Starting a session with that as
the cwd would have injected an empty runbook and hidden all of this.

### Still deferred
- **`migrate-css-to-registry.mjs --merge` is not idempotent**: it re-splits the
  43 interleaved @media overrides on every run, so the registry drifted 885 to
  928 once. Harmless to rendering; it should detect existing split rules.
- ~180 dead code assets still listed though disabled.
