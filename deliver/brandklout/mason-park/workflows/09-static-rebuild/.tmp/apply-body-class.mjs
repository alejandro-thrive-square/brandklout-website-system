// Put each page's <body> classes onto its converted ROOT node.
//
//   node apply-body-class.mjs        # after fetch-nodes.mjs, before import-styles.mjs
//
// `transform()` in to-instatic.mjs ships the body's CHILDREN, so the body's own
// class list never reaches the converter and the root `base.body` node arrives
// with `classIds: []`. On the homepage that one missing class -- `has-journey`
// -- silently disabled about forty rules: the header came up solid white with
// copper links and an un-inverted logo instead of floating transparent over the
// hero, and `.main-wrapper`'s negative top margin never applied so the hero sat
// BELOW the chrome instead of behind it. journey.js checks for the same class
// before running its chrome scene, so `--jr-nav-h` was never even measured.
//
// Nothing failed. The page was styled, the fonts were right, GSAP was running,
// and every gate was green -- because the class that was missing is the one
// that switches the whole treatment on.
//
// ORDER MATTERS: this has to run BEFORE import-styles.mjs. Instatic only emits
// a class attribute for a class it holds a style rule for, and import-styles
// harvests the rules to register from these very classIds. Patch after it and
// the class is in the node graph, absent from the registry, and absent from the
// rendered HTML.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// `--converted <file>` / `--dir <name>` let this run over a second payload set
// -- the blog template pages are converted separately, in instatic/
// pages-templates/, and would otherwise be skipped as "no exported html".
const argv = process.argv.slice(2);
const ci = argv.indexOf("--converted");
const di = argv.indexOf("--dir");
const CONVERTED = path.join(HERE, ci > -1 ? argv[ci + 1] : "converted-pages.json");
const PAGES_DIR = path.join(HERE, "instatic", di > -1 ? argv[di + 1] : "pages");

const converted = JSON.parse(fs.readFileSync(CONVERTED, "utf8"));
const bySlug = new Map();
for (const f of fs.readdirSync(PAGES_DIR)) {
  const p = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
  bySlug.set(p.slug, p.bodyClass ?? "");
}

let changed = 0;
for (const page of converted) {
  const cls = (bySlug.get(page.slug) ?? "").split(/\s+/).filter(Boolean);
  const root = page.body.nodes[page.body.rootNodeId];
  if (!root) { console.error(`  ${page.slug}: no root node`); process.exit(1); }
  if (root.moduleId !== "base.body") {
    console.error(`  ${page.slug}: root is ${root.moduleId}, not base.body - refusing to guess`);
    process.exit(1);
  }
  const before = root.classIds ?? [];
  const after = [...new Set([...before, ...cls])];
  if (after.length !== before.length) changed++;
  root.classIds = after;
  console.log(`  ${String(page.slug).padEnd(24)} body class: ${cls.join(" ") || "(none)"}  -> root.classIds ${JSON.stringify(after)}`);
}

if (!changed) {
  console.log("nothing to change");
} else {
  fs.writeFileSync(CONVERTED, JSON.stringify(converted, null, 1));
  console.log(`\n${changed} page(s) updated -> converted-pages.json`);
  console.log("run import-styles.mjs next, so the class gets a rule and is actually emitted");
}
