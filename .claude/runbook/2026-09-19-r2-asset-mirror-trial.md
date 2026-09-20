# 2026-09-19 — R2 trialled as the client-asset mirror: one client pushed, pulled and hash-verified

Repo-level. Follows [2026-09-18](./2026-09-18-full-backup-before-system-cleanup.md), which found
that client media lives only in worktree folders. Alejandro proposed dropping git for zipped folder
copies on Drive; the answer given was to keep git for code and give media an automatic second home.
He had not used R2, and supplied a token for his **personal** Cloudflare account to try it.
**This was a trial. No `assets` script exists in the repo yet, and nothing is scheduled.**

## Done

- **Token `CLOUDFLARETESTING` works for R2**, account-owned, expires 2026-12-18. He had put it in
  this checkout's generated `.env`, which the next `npm install` would have erased; it is now in
  `~/.webzite/.env` under `[shared]` with a comment (master backed up first as
  `.env.bak-2026-09-19`, every other line verified unchanged). The account is
  "Alejandromilanoescalona@gmail.com's Account", not a Brandklout or agency account.
- **Bucket `brandklout-assets-test` created** in that account (ENAM, Standard, public access off).
- **Full round trip on IFA's assets** — 1,582 files, 1.6 GB, read from the 2026-09-18 backup copy,
  not from the live worktree:

  | Step | Result |
  | :--- | :--- |
  | push | 0 failed, 728 s, 2.2 MB/s |
  | pull into an empty folder | 0 failed, 175 s, 9.3 MB/s |
  | sha256 of every pulled file vs the original, remote size vs local | 1,582 / 1,582 identical |

  The pulled copy was deleted afterwards. The bucket still holds `bk-ifa-dentistry/` (1,582 objects)
  and `institute-for-advanced-dentistry/test/` (one image from the first API test): 1,583 objects,
  1.59 GB, confirmed by a live listing.
- **The trial script is zero-dependency Node** (hand-written SigV4 over `node:crypto` + `fetch`,
  12 parallel transfers, retry on 429/5xx). It lives in the session scratchpad, not the repo — it is
  the seed for `scripts/assets.mjs`, not a deliverable.

## Next

1. Waiting on Alejandro's go-ahead to build `scripts/assets.mjs` (`push` / `pull` / `status`) with a
   tracked per-client manifest (path, size, sha256), then a first full push of all 16 worktrees plus
   the old repository's images (~14 GB, about two hours at this uplink), a nightly scheduled push, a
   push step at the end of each task, and a guard before a worktree is removed.
2. Restore the images missing from `bk-arvada`, `bk-marvel-dental`, `bk-legacy-dental`,
   `bk-grand-mission` and `bk-livewell` with `assets pull` rather than a hand copy.
3. Move to a Cloudflare account the agency owns before this is relied on; only the token and bucket
   name change.
4. Then the directive cleanup, then IFA's design.

## Gotchas

- **One Cloudflare API token is also the R2 S3 credential**: access key id = the token's id (from
  `/accounts/{id}/tokens/verify`), secret = sha256 of the token value, endpoint
  `https://<account>.r2.cloudflarestorage.com`, region `auto`. No separate R2 key is needed.
- **Use the S3 endpoint for bulk, not the REST API.** `/r2/buckets/{b}/objects/{key}` works with the
  bearer token but shares the API's ~1,200 requests per five minutes; 50,000 files would take hours
  and throttle. `curl --aws-sigv4 "aws:amz:auto:s3"` is enough for a quick check.
- **The dashboard's "Bucket Size" read 0 B with 1.59 GB stored.** It is a delayed metric; the
  operation counters (Class A 1.6k, Class B 1.55k) were already right. List the bucket to get the
  real size.
- **`/user/tokens/verify` says "Invalid API Token" for this token** because it is account-owned;
  verify at the account path.
- **Not tested: file names with spaces or non-ASCII characters** — IFA has none. Mason Park and
  Alki House do; cover them before the first full push.
- Upload speed (2.2 MB/s) is the workstation's uplink, possibly the VPN; download was four times
  faster. The devbox mirror from the same day saw the same order of magnitude.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
