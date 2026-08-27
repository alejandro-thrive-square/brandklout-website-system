// Convert all exported pages into Instatic page bodies, using Instatic's own
// HTML importer so the node graphs are correct by construction.
//
// THIS RUNS INSIDE THE INSTATIC CONTAINER, NOT HERE. It is kept in the repo
// because it is the only copy: /app is ephemeral and a redeploy erases it.
//
//   node ship-payload.mjs                    # instatic/pages -> /tmp/payload.b64
//   base64 -w0 container-convert.ts          # then, via railway ssh:
//     echo <b64> | base64 -d > /app/mp-convertall.ts && cd /app && bun run /app/mp-convertall.ts
//   node fetch-nodes.mjs                     # /tmp/nodes.b64 -> converted-pages.json
//
// It MUST be written to /app and run from /app: the `@core/*` and `@modules/*`
// aliases resolve against /app/tsconfig.json, so the same file in /tmp fails
// with "Cannot find module '@core/htmlImport'".
//
// Why this exists at all: pages are stored as node trees, not HTML, and the
// tool that converts HTML to nodes (site_insert_html) is an MCP `site_*` tool
// that proxies to a live browser editor and "cannot run headlessly". Calling
// the same importer directly inside the container sidesteps that.
//
// Two environment problems are worked around here, both specific to running
// this code under bun in the production image:
//
//  1. happy-dom 20.9.0's selector engine throws on EVERY selector, down to 'p',
//     and then dies constructing `this.window.SyntaxError`. getElementsByTagName
//     works. htmlImport only ever asks for '*', 'script', 'style', and matches
//     against '*', bare tags, comma-separated tag lists and one 'a.btn' - so a
//     small shim covers the real vocabulary exactly. It throws on anything it
//     does not recognise rather than silently returning nothing.
//  2. The module registry throws on an unregistered id, so the base module set
//     has to be imported for its side effects before importing any HTML.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { Window } from "happy-dom";

const TAG_ONLY = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const SIMPLE = /^([a-zA-Z][a-zA-Z0-9-]*)?(?:\.([A-Za-z0-9_-]+))?$/;

const qsa = function (this: any, sel: string) {
  if (sel === "*" || TAG_ONLY.test(sel)) return Array.from(this.getElementsByTagName(sel));
  throw new Error(`selector shim does not handle ${JSON.stringify(sel)}`);
};
const qs = function (this: any, sel: string) { return (this as any).querySelectorAll(sel)[0] ?? null; };
const matchesOne = (el: any, sel: string): boolean => {
  if (sel === "*") return true;
  const m = SIMPLE.exec(sel);
  if (!m) throw new Error(`matches shim does not handle ${JSON.stringify(sel)}`);
  const [, tag, cls] = m;
  if (tag && String(el.tagName ?? "").toLowerCase() !== tag.toLowerCase()) return false;
  if (cls && !el.classList?.contains(cls)) return false;
  return true;
};
const matchesFn = function (this: any, sel: string) {
  return sel.split(",").map((s) => s.trim()).filter(Boolean).some((s) => matchesOne(this, s));
};

function shimSelectors(win: any) {
  const patch = (proto: any) => {
    if (!proto || proto === Object.prototype) return;
    for (const [name, fn] of [["querySelectorAll", qsa], ["querySelector", qs], ["matches", matchesFn]] as const) {
      if (!(name in proto)) continue;
      try { Object.defineProperty(proto, name, { value: fn, writable: true, configurable: true }); } catch {}
    }
  };
  const walk = (obj: any) => {
    let p = Object.getPrototypeOf(obj);
    while (p && p !== Object.prototype) { patch(p); p = Object.getPrototypeOf(p); }
  };
  walk(win.document);
  walk(win.document.createElement("div"));
  return win;
}

function assertShimWorks(win: any) {
  win.document.body.innerHTML = "<div><p>x</p><p>y</p></div>";
  if (win.document.querySelectorAll("p").length !== 2) throw new Error("shim self-test: tag selector");
  if (win.document.querySelectorAll("*").length < 3) throw new Error("shim self-test: '*'");
  const p0 = win.document.getElementsByTagName("p")[0];
  if (!p0.matches("h1, h2, p")) throw new Error("shim self-test: tag list");
  if (p0.matches("a.btn")) throw new Error("shim self-test: a.btn false positive");
  win.document.body.innerHTML = "";
}

const base = shimSelectors(new Window());
assertShimWorks(base);
(globalThis as any).DOMParser = class {
  parseFromString(source: string, _t?: string) {
    const w = shimSelectors(new Window());
    w.document.write(source);
    return w.document;
  }
};
(globalThis as any).window = base;
(globalThis as any).document = base.document;
(globalThis as any).Node = base.Node;

await import("@modules/base");
const { importHtml } = await import("@core/htmlImport");
const { nanoid } = await import("nanoid");

const pages = JSON.parse(gunzipSync(Buffer.from(readFileSync("/tmp/payload.b64", "utf8"), "base64")).toString("utf8"));
console.log(`converting ${pages.length} pages`);

const out: any[] = [];
const failures: any[] = [];
const warningCounts: Record<string, number> = {};
let styleCssTotal = 0;

for (const page of pages) {
  try {
    const r: any = await importHtml(page.html);
    const nodes = { ...r.nodes };
    const rootIds: string[] = r.rootIds ?? [];

    // importHtml returns a forest. A page body is a single tree rooted at a
    // base.body node, which is what the default page row uses.
    const bodyId = nanoid();
    for (const id of rootIds) if (nodes[id]) nodes[id] = { ...nodes[id], parentId: bodyId };
    nodes[bodyId] = {
      id: bodyId, moduleId: "base.body", props: {}, breakpointOverrides: {},
      children: rootIds, classIds: [], parentId: null,
    };

    for (const w of r.warnings ?? []) {
      const k = w.code ?? w.type ?? "unknown";
      warningCounts[k] = (warningCounts[k] ?? 0) + 1;
    }
    styleCssTotal += (r.styleCss ?? "").length;

    out.push({
      slug: page.slug,
      title: page.title,
      description: page.description,
      body: { nodes, rootNodeId: bodyId },
      styleCss: r.styleCss ?? "",
      nodeCount: Object.keys(nodes).length,
      stripped: r.stripped ?? [],
    });
  } catch (e: any) {
    failures.push({ slug: page.slug, error: String(e.message ?? e).slice(0, 300) });
  }
}

console.log(`converted: ${out.length}   failed: ${failures.length}`);
for (const f of failures) console.log(`  ! ${f.slug}: ${f.error}`);
console.log(`total nodes: ${out.reduce((a, p) => a + p.nodeCount, 0)}`);
console.log(`styleCss total chars: ${styleCssTotal}`);
console.log(`warnings by code: ${JSON.stringify(warningCounts)}`);

const blob = gzipSync(Buffer.from(JSON.stringify(out)), { level: 9 });
writeFileSync("/tmp/nodes.b64", blob.toString("base64"));
console.log(`RESULT /tmp/nodes.b64  ${blob.toString("base64").length} bytes base64`);
