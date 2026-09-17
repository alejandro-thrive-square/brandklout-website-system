# 2026-09-09 — the six client runbooks copied to main

Commits: `3a19c955` (the copy), `061d81c0` (the snapshot warning).

## Why

Noticed while looking at `deliver/brandklout/<client>/` on `main`: **not one client had a runbook
there.** Every client runbook is written on its own branch and had never left it, so from `main`
there was no way to see what had been done for any client — and three clients had no folder on
`main` at all.

## Done

120 run files, ~605KB of markdown, taken from each branch at its current tip. Runbooks only — no
workflows, no build output, no site source.

| Client | Runs | Branch | Folder on main before |
| :--- | ---: | :--- | :--- |
| dr-nahlah | 78 | `bk-dr-nahlah` | existed |
| stone-surgical-arts | 13 | `bk-stone` | **created** |
| mason-park-kids | 10 | `bk-mason-park-kids` | **created** |
| stone-med-spa | 7 | `bk-stone-med-spa` | **created** |
| stone-dental-implant-center | 5 | `bk-stone-dental` | existed |
| mason-park | 1 | `bk-mason-park` | existed |

The other seven worktrees have no client runbook to bring: arvada, grand-mission, ifa-dentistry,
legacy-dental, livewell, marvel-dental and west-la-implants carry only the repo-level one.

## Next

**This is a snapshot, not a mirror.** The branches keep adding runs; `main` falls behind from the
moment it is taken. The entry-point files now say the branch is authoritative. To re-sync:

```bash
for pair in "bk-dr-nahlah dr-nahlah" "bk-mason-park mason-park" \
            "bk-mason-park-kids mason-park-kids" \
            "bk-stone stone-surgical-arts" \
            "bk-stone-dental stone-dental-implant-center" \
            "bk-stone-med-spa stone-med-spa"; do
  set -- $pair
  git checkout "$1" -- "deliver/brandklout/$2/docs/RUNBOOK.md" \
                       "deliver/brandklout/$2/docs/runbook/"
done
```

Because the copy is byte-identical to each branch tip, a later merge of one of those branches into
`main` resolves these paths as an identical add/add rather than a conflict — provided the copy has
not been edited on `main`. **Do not edit a client runbook on `main`.** Edit it on its branch and
re-sync.

## Gotchas

1. **A BugHerd board key is sitting in a tracked runbook** —
   `stone-surgical-arts/docs/runbook/2026-09-09-bugherd-board-key-swapped.md` quotes
   `apikey=whxgp1fjoqpgvwaf6mdttg`, and a second run file repeats it. This is a **board** key, the
   kind that ships publicly in a `<script src>` on every page while the widget is installed, not the
   `BUGHERD` account API key that `pull-bugherd.mjs` reads from `~/.webzite/.env`. So it is not a
   credential leak. It was already committed on `bk-stone` before this copy. Worth knowing the two
   are different values with similar names before anyone treats one as the other.

2. **Three client folders on `main` now contain only `docs/`.** That is intentional — the client
   exists and its record should be visible — but it means `ls deliver/brandklout/` on `main` is no
   longer a list of clients whose work lives on `main`.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
