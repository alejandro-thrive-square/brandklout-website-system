## 2026-09-15: the admin edits restored (seq 24), branch pushed

Asked (Alejandro, after seq 23): "Do finish everything?", in answer to two open questions: restore
Sang's and Sean's admin edits (dropped at seq 20 on the mistaken belief that they caused "the heading
is not right"; the cause was the fluid root, fixed at seq 23), and push the branch.

### Restored (ported from the seq 19 patches, re-anchored on v16; each anchor occurs once)

- Home client strip: the Oceanic wordmark in capitals (`OCEANIC`), like the other four.
- Home "Why us" headline: "Built from the practice's owner seat, around case acceptance."
- Home founder quote, in italics: "I have sat through the monthly calls, looked at the useless
  impressions chart, and get blamed for mismanaging my leads, then to learn my marketer took on
  another practice near me."
- `/guarantee` h1: "60-Day promise. Month-to-month. No questions asked."
- Home hero paragraph: 40px bottom margin (`agency/site.css`).

### Deliberately NOT restored

- The lower story row's headline, which the admin changed to "Growth you can tie to a real
  practice.", word for word the `#results` headline above it. It stays "Real stories. Results you
  can inspect." It may well be what "the heading is not right" meant after seq 19.
- An inline `font-size: 5rem` on the hero h1 (it would override the seq 23 sizing).

### Gates

- `class-parity`: all identical, 160/160 (32 pages × 1440, 1024, 768, 600, 360).
- Shipped, live seq checked (23), `push-site --apply --force`, published **seq 24**, 32 pages, all
  content intact.
- `verify-live` and `css-parity` FAIL none. `visual-diff` home 0.133% / 0.232%, `/guarantee`
  0.160% / 0.088% (1440 / 390).
- `.tmp/admin-edits-check.mjs` on live: OCEANIC wordmark, the "Why us" headline, the quote (italic),
  "60-Day promise" on `/guarantee`, hero paragraph margin 40px; the story row still reads "Real
  stories. Results you can inspect." (not the `#results` headline).
- `heading-wide.mjs`: hero h1 unchanged from seq 23 (72 / 76 / 82px at 1536 / 1920 / 2560).

### Next

- FormSubmit activation at sales@ (a person has to click it); Calendly URL is personal
  (`mrhuynher/30min`); domain cutover waits for Sang's approval. Nothing else is open on our side.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
