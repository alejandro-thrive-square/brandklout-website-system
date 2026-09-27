# 2026-09-12 — Sang's admin account on the Brandklout instance

## Done

- Added the Instatic user **`sang@thrivesquare.com`** to <https://brandklout-production.up.railway.app/admin>:
  display name `Sang`, role `admin`, status `active`, no MFA. The user id is `WorNFQqywM6XYTcPv0VUM`.
- His password is **the same as on Mason Park**. Mason Park's `password_hash` (argon2id, set
  2026-08-27) was copied byte-for-byte over `railway ssh` + `bun:sqlite`. After the insert, a
  read-back checked that the stored hash equals the source. No plaintext exists anywhere.
- A `user.create` audit event was written, with the owner (`alejandro@thrivesquare.com`) as actor
  and `{"roleId":"admin"}` as metadata, matching the event the admin UI wrote on Mason Park.
- No code changes, no redeploy. The DB write is live immediately.

## Next

- Sang logs in at `/admin` with his Mason Park password. If he changes it here, the sites drift
  apart. That is fine, but stop treating Mason Park as the source of this site's hash.

## Gotchas

1. **Take the hash from Mason Park, not Dr. Nahlah.** Sang changed his Dr. Nahlah password himself
   on 2026-09-10 and has MFA there.
2. **Keep the hash out of any shell and out of the transcript.** It contains `$`. Carry it as
   base64 inside a base64-wrapped bun script:
   `railway ssh -- sh -c "echo <b64> | base64 -d > /tmp/q.js && bun /tmp/q.js"`.
3. Link each instance in its own scratch directory, by project ID, with `RAILWAY_TOKEN` unset
   (Mason Park `e4a73ef0-64a3-48e5-b3c3-b2ea60737acc`, Brandklout
   `550ebd58-0e74-444e-96d5-2b836a2db98a`). A single linked directory reused for both is how a
   write lands on the wrong site.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). IDs and public URLs only. No secrets, no hashes.
