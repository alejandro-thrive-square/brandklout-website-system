## ~~!! READ FIRST — the draft's site.css is in an UNKNOWN state~~ (2026-08-20) — RESOLVED 2026-08-21

> [!NOTE]
> **Superseded.** The draft `site.css` WAS truncated (its opening ~13.7 KB lost
> to a chunked push). It was repaired byte-exact from the served bundle on
> 2026-08-21 and has since been retired entirely: the CSS now lives in the style
> registry and both code-asset stylesheets are `enabled:false`. Kept below for
> the history of how it was diagnosed. Do not act on it.


**DO NOT PUBLISH until `site.css` is verified.** The live site is fine: it serves the last good
publish (`userStyles-dc00cfb52c42.css`, 108,545 bytes, contains `.nav-logo`). But the DRAFT's
`src/styles/site.css` went through **six failed clear-and-fill attempts** when the Site editor
bridge dropped mid-push, and each attempt clears before it fills. It may be truncated.

**First command of the next session**, with the Instatic Site editor open AND focused:

    cd deliver/brandklout/dr-nahlah/workflows/13-content-export-import/.tmp
    node instatic-mcp.mjs call get_context '{}'        # want siteConnected:true
    node push-site-css.mjs --verify                    # want "MATCHES local site.css"
    node push-site-css.mjs                             # if it does not match
    node instatic-mcp.mjs call site_publish '{}'

`push-site-css.mjs` is idempotent and its clear loop is adaptive, so re-running is safe. It is
`site.css` alone that is outstanding — everything else below is already published and verified.

**The bridge needs the Site editor open and in focus.** It dropped twice today mid-run. The
Content workspace being connected is NOT enough (`contentConnected:true, siteConnected:false` is
the shape of that mistake).

### What IS live and verified on encorercm.com
Journal in the nav / drawer / footer; `/posts` serving 43 cards from the CMS loop; all 43 articles
through the template with the drawer present; 487 image alts restored; hero poster; the article
headline at 42px. Desktop and mobile audits: **70/77 clean**, the 7 being `no-jsonld` on the four
legal pages, both choosers and thank-you, which do not want it.

### What is committed locally but NOT yet live
- **`d99390a` — the nav logo.** It collapses to 0x0 above ~3000px and is already squeezed to 105px
  at 2560. This is the fix the client will look for; it is CSS, so it ships with `site.css`.
- **`bdcad3a` — the Path chapter at 4K.** Also CSS. The live site still shows the three-way split.
- Both were verified on the LOCAL build only.

### The trap that cost a round trip today
**A page push does not carry a stylesheet change.** `push-all.mjs` moves markup; `site.css` and
`site.js` are code assets with their own push scripts. The sequence is:

    push-all.mjs -> restore-img-attrs.mjs -> fix-video-poster.mjs -> swap-blog-dynamic.mjs
    -> push-site-css.mjs -> push-site-js.mjs -> site_publish

`restore-img-attrs` must run BEFORE `swap-blog-dynamic`, while the image counts still match.

### Unverified
`fluid-qa` was mid-run when work stopped; it had just been fixed to wait for `document.body`
instead of a fixed sleep. Re-run it: `node fluid-qa.mjs http://127.0.0.1:8902` from
`04-design/.tmp` with `final-site` served on 8902.

### Two sessions have been editing this worktree
`46c2e23` (another session) and `ddd9c31` (this one) are both "the blog is reachable". The trees
merged implicitly because both edited the same files. `10-nav.css`'s `.nav-slot{flex-shrink:0}`
came from the other session and is what made the logo collapse. `to-instatic.mjs`'s nested-route
case and `audit-site.mjs`'s derived page list also came from there, and both were kept.

## Objective

This is the **orchestration** worktree (`main`). It does not build client pages. It runs Brandklout
dispatch, owns the design standard and shared tooling, and merges client branches. Client work
happens in one Orca worktree per client (`bk-*`), on the **team** Claude profile.

Current campaign: 12 paid landing pages across three Brandklout dental clients, being rebuilt from
"stack of animated colour bands" into chaptered interactive journeys.
