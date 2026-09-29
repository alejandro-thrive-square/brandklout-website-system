## 2026-09-28: IV sedation and the anaesthesiologist taken off the site — PUBLISHED AND VERIFIED LIVE (production + staging)

Asana task "Update Website" (1218960088571515, from Jessica, due today), the practice's words:

> Does not do IV sedation / no anesthesiologist on team / oral and nitro only.
> We do oral sedation and nitrous oxide (laughing gas); we had an issue today with
> a patient [who] read that in our website.

**What the site says now:** the practice offers **nitrous oxide and oral sedation**, given
by its own team, under local anaesthetic. `/sedation-dentistry`, the `/all-on-4` FAQ and
the sedation FAQ state plainly that the practice **does not offer IV sedation or general
anaesthesia**, because a patient had already been misled.

Gate: `22-instatic-api-sync/audit-live-sedation.mjs` swept **99 URLs** on production
(sitemap + every page row, so the 19 noindex ads pages are included) and 56 on staging:
**0 hits** both. Before: 29 sentences on 9 sitemap URLs, plus 26 on the ads pages the
sitemap never lists.

### What changed

| where | before | after |
|---|---|---|
| /sedation-dentistry hero stats | IV certified · Anaesthesiologist · 3 levels | 2 options · BLS & ACLS · Awake |
| /sedation-dentistry options | Nitrous / Oral / **IV sedation** ("Strongest") | Nitrous / Oral / **Local anaesthetic** ("Always"), new licensed photo |
| /sedation-dentistry "why it is safe" | "holds an IV Sedation Certificate … works with a medical anaesthesiologist" | "kept to the two kinds given safely in a dental chair … BLS & ACLS provider. The practice does not offer IV sedation or general anaesthesia." |
| every "nitrous, oral or IV" | 17 pages incl. all 9 all-on-4/implant ads pages + ChatGPT clone | "nitrous oxide or oral sedation" |
| "most patients have no memory of the appointment" | 12 places (an IV-level promise) | "you stay relaxed throughout" |
| home short credential list | 8 items incl. IV Sedation Certificate | 7 items |
| head: title, meta, OG, JSON-LD | "Nitrous, Oral & IV … medical anaesthesiologist" | "Nitrous & Oral Sedation" |
| 2 migrated blog posts | "Anesthesiologist put them to sleep", "induce deep sleep" | local anaesthetic and sedation; nitrous or an oral sedative |

**Kept on purpose:** "08 IV Sedation Certificate" on `/meet-dr-nahlah`'s full credential
list. It's the doctor's qualification, not an offer, and the list is counted as "fourteen"
on three pages. **Ask the client** whether they want it off too. If yes, remove item 08,
renumber 09-14, and change "fourteen" on /meet-dr-nahlah, /all-on-4 and the home comment.

### Files

- `22-instatic-api-sync/sedation-copy-map.mjs`: the one replacement table (substring +
  whole-string), shared by live and source.
- `22-instatic-api-sync/push-sedation-copy.mjs`: the live fix, **seven stores** (below).
  Dry-run by default, backs up to `.tmp/backups/pre-sedation-<host>-*.json`, audits the
  planned state and refuses to apply while anything survives. Idempotent: a re-run plans
  0 edits. `INSTATIC_BASE_URL=https://staging.drnahlah.com` runs it on staging.
- `22-instatic-api-sync/swap-sedation-card-photo.mjs`: Freepik 28265937 (licensed,
  ledger in `03-graphic-resources/.tmp/stock/ledger.tsv`) as `sedation-local-anaesthetic.jpg`.
- `22-instatic-api-sync/audit-live-sedation.mjs`: the gate. It allows only the explicit
  denial and the /meet-dr-nahlah credential.
- `22-instatic-api-sync/sedation-api.mjs`: loads THIS worktree's `.env`, then imports
  `insta-api.mjs` from the main checkout (see gotchas).
- `04-design/.tmp/retarget-sedation-copy.mjs`: the same table on `site-src` (56 edits +
  4 by hand), exits 1 while a claim survives, comments included. Rebuilt 56/56.
- `13-content-export-import/.tmp/posts.json`: the two post sentences, so a re-import
  can't restore them.

### Gotchas

- **The claim lived in SEVEN stores.** Page nodes; the page row's `title` cell (the
  `<title>`, which a node pass never touches); code assets `src/scripts/jsonld/*.js` +
  `seo-head.js`; the `brandklout.open-graph` runtime store; **`brandklout.aeo-schema`
  stored blocks** (`/plugins/brandklout.aeo-schema/runtime/entries`, per-page JSON-LD
  merged into the generated WebPage node); media-library alt text; `posts` rows. The
  first publish still showed the old title and a stale `MedicalWebPage` in the head.
  Only the audit's HEAD half caught it. This adds two stores to the phone-number trap's
  "four places".
- **`process.loadEnvFile` truncates at `#`.** This instance's password contains one. The
  first login attempt sent 11 of 15 characters and got a 401 (one strike of the five that
  lock the account). `sedation-api.mjs` parses `.env` the way `insta-api.mjs` does.
- **Since system v2 (2026-09-27) every older script here is broken as written:** they
  import `../../../../process/22-instatic-api-sync/insta-api.mjs`, and the worktree has
  no `deliver/process`. The helper is now at
  `<main>/deliver/process/tools/instatic-api-sync/insta-api.mjs`. Importing it directly
  makes its own `loadEnv()` read **main's** `.env`, so go through `sedation-api.mjs`
  (it refuses any host that isn't drnahlah).
- **The site-document write drops `seoTitle`/`seoDescription` again** (known trap). The
  home row lost them on both instances. Restored from the backup by PATCH, body and
  slug verified intact.
- **A TO that contains its own FROM makes the push non-idempotent.** The first draft
  appended the denial sentence to a sentence it also matched. It was caught on the second
  dry run before a second apply, and the table now throws on it.
- Post rows need `POST /data/rows/:id/publish`. The script refuses to row-publish a post
  whose draft already differed from the published version, so it can't ship someone
  else's work.
- The Chrome extension didn't answer. Screenshots were taken with puppeteer-core
  (borrowed from `bk-stone/node_modules`) and the installed Chrome.

### Not done / open

- **Staging** is corrected and published. **The Wellness Hour "Sedation Dentistry"
  film** on `/video-library` is third-party (YouTube `zjvRSifApBs`, rights on hold). Its
  content was not reviewed and may describe IV sedation. Ask the client whether to pull it.
- Asana task not commented or closed from here.
- Process: `instatic-api-sync.md` on main should list the aeo-schema stored blocks and
  the page `title` cell among the places copy lives, and the client scripts'
  import path needs repointing. That's main's work, not this branch's.

### Version Control

Committed on `bk-dr-nahlah`. Live, staging and `site-src` agree on the sedation copy.
