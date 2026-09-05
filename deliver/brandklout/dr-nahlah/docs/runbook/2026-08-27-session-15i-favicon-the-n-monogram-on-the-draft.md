## DONE 2026-08-27 (session 15i): favicon — the "N" monogram, on the DRAFT

Client's ask was "extract the current icon from the Webflow site". **That is a
no-op, and the reason is worth writing down.**

### Instatic's favicon and Webflow's favicon were already the same file

    Instatic  settings.faviconUrl = /uploads/SeUCjBROuHcDic1KpO7jq-favicon-512.png
    Webflow   dr-nahlah.webflow.io 512x512 rel="icon"
    md5       70d7f59c3ebc262c9f605aeb355c1b6d   -- BOTH

Session 14 had already pulled it across. Re-extracting changes nothing.

### And the client is right about what it is

The Webflow asset's filename is
`494207457_1212754494184350_3295429528119679185_n.jpg` — a Facebook/Instagram
**profile-picture** filename. Webflow's site icon *is* the social profile image:
the 1024x309 gold wordmark letterboxed into a square. At 32px it is a smear.
Webflow has the same defect; there is no better icon to take from it. Checked the
whole home page asset list — no monogram anywhere on that site.

### The real mark was on the OLD WordPress site all along

`03-graphic-resources/.tmp/downloads/wp-content/uploads/2022/01/cropped-nahlah-favicon.png`
— 512x512, square, gold script "N", transparent. The 32x32 sibling reads as an N.
Scraped back on 2026-07-30 and never used.

Uploaded and set (client picked it over asking for a vector master):

    uploaded  Jr5Ik4MEhU-kIeRh8yno1
              /uploads/PhKVdS1R0_xk-mtalvGAw-cropped-nahlah-favicon.png
    saved     seq 92 -> 93
    verified  settings.faviconUrl read back equal
    served    200 image/png 23289, md5 == source

**DRAFT ONLY — not published.** `draftMatchesPublished` was already `false`
before this write, so someone else's in-progress work is sitting in the same
draft. Publishing ships theirs too. `lastPublishedAt` 2026-08-27T01:45:24Z had
not moved in the ~1h45m before the write.

### Gotchas

- **`www.drnahlah.com` is now INSTATIC, not Webflow.** Its `rel="icon"` points at
  `/uploads/...`. Earlier runbook entries call that domain "the Webflow build" —
  stale. The Webflow build is only reachable at `dr-nahlah.webflow.io`.
- **Instatic emits ONE `<link rel="icon">`** — no icon set, no apple-touch-icon,
  no `sizes`. Webflow emits six. So a wordmark that Webflow can hide behind a
  32x32 crop has nowhere to hide here: whatever is in `faviconUrl` IS the 16px
  tab. Square-and-legible-at-16px is a hard requirement, not a preference.
- **Confirm a "extract X from the old site" ask before doing it.** Both sides were
  byte-identical here; the diff that mattered was against a third source nobody
  named.
