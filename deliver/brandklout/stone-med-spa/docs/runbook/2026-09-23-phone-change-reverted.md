# 2026-09-23 — A phone change applied here by mistake, and reverted

A request to put (817) 767-4188 and a GoHighLevel number pool on "the Westlake" was applied to
this site (commit `309b7647`), but it was meant for **Stone Surgical Arts**. It was undone within
the hour:

- Live: page nodes and `site.js` are back to `(817) 383-8361` on production (13 pages, seq 20)
  and staging (24 pages, seq 15). The pool, `user_session.js` and the two LeadConnector
  `connectOrigins` came off production's Embed Origins settings, which were then republished.
  Verified in the live HTML.
- Git: reverted in `b9a9db7a` and `fb6eb8c0`. Pre-change backups are in
  `05-instatic-upload/.tmp/backup-*-2026-09-23-pre-phone*/`.

**This site has no number pool.** The Surgical Arts run is in the `bk-stone` worktree
(`docs/runbook/2026-09-23-new-phone-and-dni-pool.md`).

## Gotchas

- "Westlake" names both Stone sites: this one is Westlake Medical Aesthetics, and Surgical Arts
  shares the Westlake address. Ask which domain.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
