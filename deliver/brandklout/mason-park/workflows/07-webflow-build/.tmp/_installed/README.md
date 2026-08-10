# `_installed/` — what the Webflow site actually serves

Source Asana task GID: 1217040406855582

Every file here is a **byte-for-byte copy of a block installed on Webflow**, written at the
moment it was installed and read back to confirm it stored verbatim.

| file | where it lives on the site |
| :--- | :--- |
| `site.head.html` | site-level head custom code (all pages, including Home) |
| `<page>.head.html` | that page's head custom code |
| `<page>.footer.html` | that page's footer custom code |
| `<page>.form-embed.html` | the `code` setting of that page's lead-form HtmlEmbed |

There is no `site.footer.html`: the site footer holds `mpd-flush.js`, which the re-theme did
not touch.

## Why this folder exists

`_js/` holds what a build *intended* to install, and it drifted. `_js/site-head.html` still
carried the old font link and had never gained the body base size or the sub-479 reading tier
that were live on the site — patching against it would have silently reverted both. Worse,
`_js/<page>.page-head.html` is misnamed: its contents are the page **footer** script bundle.

So: **read the site before you patch it** (`dump_custom_code.mjs`), patch what you read
(`build_head_blocks.mjs`), install and read back (`push_custom_code.mjs`), and record the
result here.

## Regenerating

```bash
node dump_custom_code.mjs   <dir>      # what the site serves now
node build_page_footers.mjs            # rebuild _js/<page>.sections.min.js from the payload
node build_head_blocks.mjs  <dir> <out>
node push_custom_code.mjs   <out>      # installs and verifies
node push_embeds.mjs                   # the two lead-form embeds
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
Text artifacts only; never secrets or binary/media assets.
