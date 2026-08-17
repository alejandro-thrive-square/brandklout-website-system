/**
 * gen_component_docs.mjs — write the indications that ship with every
 * pasteable component: README.md per component + PASTE-QUEUE.md per page.
 * Regenerable from .tmp/components/manifest.json; edit this script, not the
 * outputs.
 *
 * Usage: node gen_component_docs.mjs   (from 07-webflow-build)
 */
import fs from "node:fs";
import path from "node:path";

const OUT = ".tmp/components";
const manifest = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
const GID = "1217040406855582";
const SITE = "6a60bdc0340e5f1784b4d553";
const STAGING = "https://mason-park-dental.webflow.io";

const PAGES = {
  invisalign: { title: "Invisalign LP", pageKey: "invisalign" },
  "new-patient-special": { title: "New Patient Special LP", pageKey: "new-patient-special" },
  "thank-you": { title: "Thank-You page", pageKey: "thank-you" },
};

const PREREQS = `## Prerequisites (once per SITE — check before ANY paste)

1. **Backup**: duplicate the site in the dashboard first.
2. **Site Settings → Fonts**: **Fraunces** and **Inter** must be enabled BEFORE
   pasting. Webflow silently strips \`font-family\` from pasted styles when the
   family is not registered — no error, the whole page lands in system-ui.
3. **Site Settings → Custom Code → Head** ← \`.tmp/pc/install-head.html\`
   (REPLACES the old site head block: fonts link → fluid root → reading tier →
   1439 display rung → runtime-state rules → GSAP 3.13 CDN tags → MPD
   bootstrap). The bootstrap must be in the HEAD — section embeds call
   \`MPD.add\` mid-parse.
4. **Site Settings → Custom Code → Footer** ← \`.tmp/pc/install-footer.html\`
   (REPLACES the old site footer: minified mpd-flush.js — registerPlugin,
   conversion layer, selector-driven kit, buildJourney). SITE level only,
   exactly once. There is deliberately NO ScrollSmoother — do not add one.
`;

const CLEANUP = `## Cleanup after the new pages are live (agent, over the MCP)

The old headless build kept each page's chapter scripts in PAGE-level custom
code. The new build carries them inside the sections, so once a page is
rebuilt from these components:

- clear that page's **page-level head and footer custom code**
  (\`data_scripts_tool > put_page_freeform_code\` with empty content — the old
  blocks are archived byte-for-byte in \`.tmp/_installed/\`);
- retire the old page (the old and new class definitions differ, so pasting
  onto a site that still holds the old styles forks \`-2\` twins — build on a
  fresh page, swap slugs at cutover, then delete the old page and remove its
  now-unused styles with \`data_style_tool > remove_style\`);
- re-run the gates against staging: \`staging-verify.mjs\`, \`scrub-proof\`,
  \`root-proof\` (see 08-qa).

Constants still pending from Brandklout (ride in the site-head bootstrap, one
edit patches every page): GHL webhook URL (placeholder — forms SAY they are
not connected), thank-you tracking number, ownership of the two vendor
tracking numbers.
`;

function componentReadme(e) {
  const pg = PAGES[e.page];
  const what =
    e.kind === "shell"
      ? `The page shell: fixed header (progress bar + chapter readout + phone), offer rail, sticky call bar, an EMPTY \`main#main\`, and the footer. **Paste this FIRST on a blank page**, then paste sections into \`main#main\` in order.`
      : e.kind === "footer"
        ? `The site footer as a standalone component — only needed when adding to an EXISTING page; the page shell already carries the footer.`
        : `Chapter ${String(e.order - 1).padStart(2, "0")} — “${e.chapterName}” (${e.theme || "light"} ground), section \`#${e.sectionId}\`, position ${e.order} of ${e.of} inside \`main#main\`.`;

  return `# ${pg.title} — ${path.basename(e.dir)}${e.chapterName ? ` · ${e.chapterName}` : ""}

Source Asana task GID: ${GID} · Site \`${SITE}\` · ${STAGING}

${what}

| | |
| :--- | :--- |
| payload | \`final.json\` — ${e.nodes} nodes · ${e.styles} styles · ${e.assets} assets · ${e.embeds} embeds${e.scripted ? " · **scripted** (behaviour rides inside as MPD.add embeds)" : ""} |
| paste page | \`PASTE.html\` |
| root | single (safe against the multi-root Designer crash) |

## Prerequisites

The SITE-level shared layer must be installed and the fonts enabled first —
see \`../PASTE-QUEUE.md\` (steps 1–4). A section pasted without the head
bootstrap renders but never animates (\`MPD is not defined\` per chapter).

## Paste steps

1. Open \`PASTE.html\` in the SAME browser as the Designer and click
   **Copy to Webflow clipboard** yourself — \`execCommand\` needs a real user
   gesture, and the copy click must be a standalone action.
2. In the Designer, select the target parent in the **Navigator**:
   ${e.kind === "shell" ? "**Body** of the blank page." : e.kind === "footer" ? "the element after `main#main` (the shell wrapper) — the footer sits OUTSIDE `main`." : "**`main#main`** (sections append at the end — paste in queue order)."}
3. \`Ctrl+0\` first (100% zoom — zoom drift breaks paste), then \`Ctrl+V\` **once**.
4. If the paste misses, re-copy fresh — a stale clipboard is the usual cause.

## After the paste

- Content fixes go through the Data API MCP (\`set_text\`, \`set_image_asset\`,
  \`set_attributes\`) — **never re-paste to fix a typo** (a second paste forks
  every class the section carries).
- The section is movable/reorderable: its behaviour and state live inside it.
- Verify motion on a **focused** tab only — background tabs freeze
  transitions and timers, so reveals look broken when they are not.
`;
}

function pasteQueue(page, entries) {
  const pg = PAGES[page];
  const rows = entries
    .map((e) => {
      const label = e.kind === "shell" ? "Page shell (paste FIRST, on Body)" :
        e.kind === "footer" ? "Footer (SKIP on a fresh rebuild — the shell already has it)" :
        `“${e.chapterName}” (${e.theme || "light"})${e.scripted ? " · scripted" : ""}`;
      return `| ${e.kind === "shell" ? "0" : e.order} | [\`${path.basename(e.dir)}\`](./${path.basename(e.dir)}/README.md) | ${label} | ${e.nodes} nodes / ${e.embeds} embeds |`;
    })
    .join("\n");

  return `# PASTE QUEUE — ${pg.title} (\`/${pg.pageKey === "thank-you" ? "thank-you" : pg.pageKey}\`)

Source Asana task GID: ${GID} · Site \`${SITE}\` · ${STAGING}
Built from \`04-design/.tmp/${page}/\` — regenerate with the pipeline in
\`07-webflow-build.md\`, never by hand-editing payloads.

${PREREQS}
## The queue (paste in this order, into a FRESH blank page)

| # | component | what | size |
| :--- | :--- | :--- | :--- |
${rows}

Every section pastes into \`main#main\` (select it in the Navigator each time;
new pastes append at the end, so queue order = page order). Set the Body's
\`data-page-key\` attribute to **\`${pg.pageKey}\`** after the shell paste
(\`Body → Settings → Custom attributes\`) — the tracking-number lookup and the
QA readiness probe both key on it.

### One-paste alternative

\`.tmp/pc/${page}/PASTE-full-page.html\` holds the WHOLE page as one
single-root paste (shell + all sections + footer). Fastest route for a fresh
page; use the per-section components for surgical moves and partial rebuilds.

## After pasting — ask the agent to

1. Verify page settings: title/meta (\`noindex, nofollow\` stays until launch).
2. Patch any content nits over the MCP — never re-paste for a typo.
3. Publish to staging and run the gates (\`staging-verify\`, \`scrub-proof\`,
   \`root-proof\` — one page at a time).

${CLEANUP}
## Version Control

Follows [SYSTEM_RULES.md — Section 4](../../../../../../SYSTEM_RULES.md).
Regenerate via \`gen_component_docs.mjs\`; do not hand-edit.
`;
}

let readmes = 0;
for (const e of manifest) {
  fs.writeFileSync(path.join(OUT, e.dir, "README.md"), componentReadme(e));
  readmes++;
}
for (const page of Object.keys(PAGES)) {
  const entries = manifest
    .filter((e) => e.page === page)
    .sort((a, b) => (a.kind === "shell" ? -1 : b.kind === "shell" ? 1 : a.order - b.order));
  fs.writeFileSync(path.join(OUT, page, "PASTE-QUEUE.md"), pasteQueue(page, entries));
}
console.log(`${readmes} component READMEs + ${Object.keys(PAGES).length} PASTE-QUEUE.md written`);
