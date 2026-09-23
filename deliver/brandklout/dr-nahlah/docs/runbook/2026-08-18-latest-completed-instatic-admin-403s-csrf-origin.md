## Latest completed: Instatic admin 403s — CSRF origin + owner email typo (2026-08-18)

Volume was grown to 1 GB (23% used) but errors continued. **Three reported symptoms, two root causes,
neither of them disk.**

### Cause 1 — `PUBLIC_ORIGIN` listed only one of three live domains
Instatic CSRF-checks every state-changing admin request against `PUBLIC_ORIGIN`
(`server/auth/security.ts` → `originAllowed`; rejections at `handlers/cms/index.ts:73`
"Forbidden: invalid origin" and `collab/socket.ts:199` "Origin not allowed").
`PUBLIC_ORIGIN` was `https://encorercm.com` alone, but the service serves **three** active domains —
`encorercm.com`, `www.encorercm.com`, `dr-nahlah.up.railway.app`. **`www` does not redirect to the apex**,
it serves its own 200, so an admin sitting on `www` had every mutating request 403'd. Proof:

```
POST /admin/api/cms/logout   Origin: https://encorercm.com            -> 200 {"ok":true}
                             Origin: https://www.encorercm.com        -> 403 invalid origin
                             Origin: https://dr-nahlah.up.railway.app -> 403 invalid origin
```

That single check explains all three symptoms: editor stuck "reconnecting" (collab socket 403),
cannot sign out (logout POST 403), new user cannot log in (login POST 403).

**Fix:** `PUBLIC_ORIGIN=https://encorercm.com,https://www.encorercm.com,https://dr-nahlah.up.railway.app`
(the var is documented as a comma-separated list precisely so platform + custom domains coexist; entry [0]
stays canonical for `expectedOrigin`). Railway auto-redeployed (`45fdaa26`). All three origins now 200 on
both hosts; public pages unaffected.

### Cause 2 — the owner account email was typo'd, locking out login
Owner was saved as `alejandro@`**`trivesquare`**`.com` — missing the `h`. `login_attempts` showed repeated
`no_user` for both `alejandro@thrivesquare.com` and `alejandromilanoescalona@gmail.com` (the original owner
email). `alejandro@thrivesquare.com` also existed as a **soft-deleted** admin (created 2026-08-14 00:38:28,
deleted 76 s later), which resolves as `no_user` too. Access survived **only** on a session cookie from
2026-08-12 (expires 2026-11-10) — so fixing logout had actually armed a lockout.

**Fix:** corrected owner `email`/`email_normalized` to `alejandro@thrivesquare.com`. Safe because the unique
index is **partial** — `users_email_normalized_active_idx ... WHERE deleted_at IS NULL` — so the soft-deleted
row holding that address does not conflict. Password unchanged. Verified by probe:
`thrivesquare -> bad_password` (account found), `trivesquare -> no_user` (gone). Probe's
`failed_login_count` reset to 0 (`LOCKOUT_THRESHOLD = 5`, 15 min initial, doubling, 24 h cap).

### Gotchas
- **403 vs 401 is the tell**: 401 = not authenticated, 403 = authenticated-but-forbidden **or** bad origin.
  Do not assume a capability gap — grep `status: 403` across `/app/server`; origin checks live in
  `handlers/cms/index.ts`, `collab/socket.ts`, `ai/handlers/index.ts`, `forms/handler.ts`.
- Login responses are deliberately identical (`"Invalid email or password"`) for missing vs wrong-password.
  The real reason is only in `login_attempts.result` (`no_user` | `bad_password` | `locked` | …).
- Adding a custom domain in Railway does **not** update `PUBLIC_ORIGIN`, and `www` is a separate domain.
  Any new domain must be appended or the admin breaks on it while the public site keeps working.
- Soft-deleted users keep their address but resolve as `no_user`; the partial unique index means the address
  is still reusable by an active account.

### Still open
- **No version retention** (see the 2026-08-18 bloat entry) — bloat returns with every publish.
- `about`, `contact`, `all-on-4`, `cosmetic-dentistry`, `emergency-dentistry` remain unpublished drafts.
- Confirm the editor's "reconnecting" loop is gone with an admin tab actually open (socket 403 was only
  observable while a tab polled).
