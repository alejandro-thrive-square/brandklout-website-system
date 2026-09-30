# 2026-09-30 — a Google Reviews widget for every client, no duplicates

Repo-level: it covers all 29 Brandklout sites (the Termly registry's keys), so it belongs here
rather than in one client's runbook.

## Done

- **Inventory:** 29 sites scanned, and every Elfsight id queried through the public boot API. All
  23 widgets in Trong's account (`trong@driverank.com`, Google Reviews plan, Enterprise T1) were
  read from the dashboard.
- **Already covered, not recreated: 20 clients.**
  - **19 are `live-on-site`.**
  - **Stone Surgical Arts** has `c92f78df`, but that widget sits on stonedentalimplantcenter.com,
    not dfwsurgicalarts.com.
  - **Mason Park (adult)** has an All-in-One Reviews widget, `32926aff`, in the **other** Elfsight
    account, on its #104A listing. That one was skipped as "unsure", per the user.
- **Created and published, 7:**

  | Client | Widget | Rating (reviews), verified by render |
  | :--- | :--- | :--- |
  | Dr. Nahlah | `da62eaec` | 4.9 (410) |
  | West LA Implants | `670ca31c` | 4.9 (209) |
  | Stone Dental Implant Center | `b694d47f` | 4.9 (16) |
  | Westlake Medical Aesthetics | `73fff4ec` | 5.0 (15) |
  | Kissimmee Oral Surgery | `93b284c3` | 4.3 (1,212) |
  | IFA | `7febe92d` | 5.0 (96) |
  | Oceanic Dental | `093a89eb` | 4.8 (210) |

  Each one was checked on a local test page with `elfsight_render.py`.
- **Restore:** draft `393dc878` exists but is not connected. No Google listing was found for
  "Restore Dental Implant Studio" (its site is pre-launch on `webflow.io`).
- **Quota:** 31 of 50 widgets used.
- **The tool, registry and procedure** are in `deliver/process/tools/elfsight-reviews/`, with a row
  in `PROCESS_INDEX.md`.

## Next

- **Restore:** needs its Google Maps link. Then run
  `elfsight_widget.py --widget 393dc878-ae85-45ac-bb22-fcb25ee8b274 --query <link or name> ...`.
- **Placing widgets is not done.** The 7 new widgets are `created-not-placed`. Nahlah and
  Kissimmee use reputationhub and Oceanic uses Birdeye, so decide per site whether to replace
  those or add alongside.
- **Wrong or dead embeds on live sites:**
  - Stone Dental shows Stone Surgical's reviews and a deleted app, `7b3bee65`.
  - Livewell, South Bay and Atwood embed a deleted app, `daf7a560`, which renders nothing.
- **Duplicates that already existed** (the owner decides on deletion):
  - Livewell: `5dc13b7b`, plus `b825b050`, created 2026-09-29 on request.
  - Marvel: `dd6f5ce5` and "Emergency" `5b4f0a1d`.
  - Legacy: `3574fcbf` in the other account, plus `a3cf2f27` and `33f2eb26` for its Invisalign pages.
- **The second Elfsight account** (Omnia `7af5e247`, Legacy `3574fcbf`, Mason `32926aff`, the
  Instagram feeds) was not browsed. Nobody here can sign in to it.

## Gotchas

- **Elfsight has no API** for listing or creating widgets, only an embed SDK. Its boot endpoint is
  public and keyless, which makes it the inventory tool.
- **Claude in Chrome's screenshots timed out on the editor tab,** and its `find` cannot see into
  the cross-origin iframe. Orca computer use can see in, but it drives the user's own window and
  closed Chrome twice in this session (see memory). The CDP script in a background tab is the
  method that held up.
- **Elfsight ignores `element.click()`.** The rename commits only on an Enter key event that
  carries the text CR. The search dropdown echoes the query, and a hidden live region repeats the
  result text. All of this is in the tool's README.
- **Bash heredocs dropped backslashes three times** while these scripts were written. Use an editor.

## Version Control

Tracked on `main` with the system runbook; see SYSTEM_RULES.md §4.
