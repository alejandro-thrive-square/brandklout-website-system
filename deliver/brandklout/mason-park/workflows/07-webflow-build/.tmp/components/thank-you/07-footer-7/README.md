# Thank-You page — 07-footer-7

Source Asana task GID: 1217040406855582 · Site `6a60bdc0340e5f1784b4d553` · https://mason-park-dental.webflow.io

The site footer as a standalone component — only needed when adding to an EXISTING page; the page shell already carries the footer.

| | |
| :--- | :--- |
| payload | `final.json` — 54 nodes · 23 styles · 1 assets · 0 embeds |
| paste page | `PASTE.html` |
| root | single (safe against the multi-root Designer crash) |

## Prerequisites

The SITE-level shared layer must be installed and the fonts enabled first —
see `../PASTE-QUEUE.md` (steps 1–4). A section pasted without the head
bootstrap renders but never animates (`MPD is not defined` per chapter).

## Paste steps

1. Open `PASTE.html` in the SAME browser as the Designer and click
   **Copy to Webflow clipboard** yourself — `execCommand` needs a real user
   gesture, and the copy click must be a standalone action.
2. In the Designer, select the target parent in the **Navigator**:
   the element after `main#main` (the shell wrapper) — the footer sits OUTSIDE `main`.
3. `Ctrl+0` first (100% zoom — zoom drift breaks paste), then `Ctrl+V` **once**.
4. If the paste misses, re-copy fresh — a stale clipboard is the usual cause.

## After the paste

- Content fixes go through the Data API MCP (`set_text`, `set_image_asset`,
  `set_attributes`) — **never re-paste to fix a typo** (a second paste forks
  every class the section carries).
- The section is movable/reorderable: its behaviour and state live inside it.
- Verify motion on a **focused** tab only — background tabs freeze
  transitions and timers, so reveals look broken when they are not.
