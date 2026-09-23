## IN PROGRESS 2026-08-26 (session 15c): pin #7, images chosen, awaiting approval

`MAGNIFIC` is now in `.env` — and it is a **Freepik** key, not a Magnific-branded
one: header `x-freepik-api-key`, `https://api.freepik.com/v1/...`, and the CDN
answers on magnific.com. Downloads return full-resolution, unwatermarked files
(verified: 6048x4024) and both `freemium` and `premium` resolve, so the account
carries download rights.

### The data model (this is the part worth keeping)

- The 43 articles are NOT in the pages table. They are rows in the `posts` table:
  `GET /admin/api/cms/data/tables/posts/rows`. `/admin/api/cms/data/rows?table=`
  is a 404; the path form is the only one that works.
- `posts` already has a **`featuredMedia`** field of type `media`, empty on all 43.
  Nothing needs to be added to the schema.
- `page` `post` is the template (`templateTarget: {kind:'postTypes',
  tableSlugs:['posts']}`). Its article area is a single **`base.outlet`**, the only
  child of `.bl-body` — title, date and body all render from it as one block. You
  can restyle it and add furniture AROUND it; you cannot reorder what is inside.
- **Template field binding exists**: `node.dynamicBindings = { <propKey>:
  { source:'currentEntry', field:'featuredMedia', format:'media' } }`. Sources are
  currentEntry / parentEntry / page / site / route; formats plain / html / url /
  media. Confirmed in `src/core/page-tree/pageNode.ts` and
  `src/core/page-tree/dynamicBinding.ts` in `Instatic-main.zip`. String props also
  take inline `{currentEntry.title}` tokens.

### Where it stands

`pick-post-images.mjs` + `post-image-pool.mjs` choose one image per article,
READ-ONLY. 38 come from the practice's own library, 5 from Freepik. Contact sheet
published for approval; `--apply` (not yet written) will download, upload and set
`featuredMedia`. The template redesign — hero, contents from the article's own
H2s, related row, one CTA — is NOT built yet.

### Gotchas earned this session

- **A blocklist cannot curate this media library.** 434 assets, and the case
  photography is not all named `*-before.jpg`: there are bare numeric pairs
  (`1.1.jpg`, `8.2.jpg`, `9-b4.jpg`), duplicate uploads of the same picture, staff
  headshots and NAMED PATIENT portraits (`pt-yolanda.jpg`). A patient's case photo
  on an unrelated article misrepresents the case. `post-image-pool.mjs` is an
  explicit allowlist for that reason, and it warns when an entry goes missing.
- **Keyword-scoring article titles gives one image to the whole blog.** First
  attempt put `Dentist-holding-a-dental-implant.jpg` on 24 of 43, because almost
  every title contains "dental implant". Fixed with ordered topics (specific
  before general) plus a hard `MAX_USES = 2` cap per asset.
- **Do not build a stock query out of the article title.** "uncover lifespan long
  dental" returned a man in glasses; "all-on-four" returned a woman taking a
  selfie. Query the TOPIC with a curated phrase instead.
- **Freepik `source.url` is a 626px PREVIEW on img.b2bpic.net**, not the licensed
  asset. The real file is `GET /v1/resources/:id/download`, which returns a signed,
  expiring URL. Reviewing from previews costs no quota; only `--apply` spends it.
