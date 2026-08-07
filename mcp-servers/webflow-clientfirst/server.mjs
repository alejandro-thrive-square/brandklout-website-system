#!/usr/bin/env node
// webflow-clientfirst — local MCP server.
//
// Purpose: make Client-First class REUSE the default when converting a coded
// design package into Webflow, and stop broken payloads before they are pasted.
//
// Deliberately dependency-free (hand-rolled JSON-RPC over stdio) so it runs with
// no npm install anywhere the repo is checked out.
//
// Every tool returns a COMPACT summary and writes full data to disk. Large blobs
// must never travel through an agent's context — that is the scalability rule
// this server exists to enforce.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  harvestCss, summarizeVocab, validatePayload, suggestReuse,
  resolveFluid, evalLength, BREAKPOINTS, readJson, writeJson,
} from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const STATE = path.join(HERE, ".tmp");
const abs = (p) => (path.isAbsolute(p) ? p : path.resolve(REPO, p));

const TOOLS = [
  {
    name: "harvest_style_guide",
    description:
      "Parse a compiled Webflow/Client-First stylesheet into a reusable vocabulary of classes and variables. Writes the full vocabulary to disk and returns only a family summary. Run this once per design system, then point the other tools at the saved vocabulary.",
    inputSchema: {
      type: "object",
      properties: {
        css_path: { type: "string", description: "Path to the compiled .css (repo-relative or absolute)." },
        out: { type: "string", description: "Where to write the vocabulary JSON. Defaults to .tmp/vocab.json beside the server." },
      },
      required: ["css_path"],
    },
  },
  {
    name: "analyze_structure",
    description:
      "Summarise a harvested vocabulary: how many classes per Client-First family, which variables exist, and which base components are available for reuse. Read-only, compact output.",
    inputSchema: {
      type: "object",
      properties: {
        vocab: { type: "string", description: "Path to a vocabulary JSON produced by harvest_style_guide." },
        family: { type: "string", description: "Optional: list every class in one family instead of the summary." },
      },
      required: ["vocab"],
    },
  },
  {
    name: "validate_payload",
    description:
      "Check a Webflow clipboard payload before pasting. Flags CSS functions surviving in styleLess (the cause of the '0px font-size' bug in the Designer style panel), bare tag-name classes that will collide site-wide, and — when a vocabulary is supplied — how much of the payload reuses style-guide classes versus forking new ones.",
    inputSchema: {
      type: "object",
      properties: {
        payload: { type: "string", description: "Path to a converter payload JSON." },
        vocab: { type: "string", description: "Optional vocabulary JSON to enable reuse analysis." },
      },
      required: ["payload"],
    },
  },
  {
    name: "suggest_reuse",
    description:
      "For each style in a payload, propose the closest existing style-guide class so base components (headings, text sizes, spacing, buttons) reuse rather than fork. Returns a mapping you can feed back into the converter.",
    inputSchema: {
      type: "object",
      properties: {
        payload: { type: "string" },
        vocab: { type: "string" },
        threshold: { type: "number", description: "Minimum match score 0-1. Default 0.6." },
        out: { type: "string", description: "Optional path to write the full mapping." },
      },
      required: ["payload", "vocab"],
    },
  },
  {
    name: "resolve_fluid",
    description:
      "Rewrite clamp()/min()/max()/calc() values into concrete px per Webflow breakpoint (desktop 1440, tablet 991, mobile-landscape 767, mobile-portrait 478). Webflow's style panel cannot parse CSS functions, so this is what keeps font sizes editable instead of reading 0. Writes the rewritten payload plus a per-breakpoint override map.",
    inputSchema: {
      type: "object",
      properties: {
        payload: { type: "string" },
        out_dir: { type: "string", description: "Directory for the rewritten payload and breakpoint overrides." },
      },
      required: ["payload"],
    },
  },
  {
    name: "eval_length",
    description:
      "Evaluate a single CSS length expression at each Webflow breakpoint. Useful for spot-checking a type scale without converting anything.",
    inputSchema: {
      type: "object",
      properties: { expr: { type: "string", description: "e.g. clamp(1.9rem,3.6vw,3.75rem)" } },
      required: ["expr"],
    },
  },
];

function call(name, args = {}) {
  switch (name) {
    case "harvest_style_guide": {
      const cssPath = abs(args.css_path);
      const out = abs(args.out || path.join(STATE, "vocab.json"));
      const vocab = harvestCss(fs.readFileSync(cssPath, "utf8"));
      writeJson(out, vocab);
      const s = summarizeVocab(vocab);
      return {
        wrote: path.relative(REPO, out),
        classes: s.classes,
        variables: s.variables,
        families: s.families.map((f) => `${f.family}:${f.count}`).join(" "),
        note: "Full vocabulary is on disk. Pass its path to the other tools rather than reading it.",
      };
    }
    case "analyze_structure": {
      const vocab = readJson(abs(args.vocab));
      if (args.family) {
        const names = Object.entries(vocab.classes)
          .filter(([, v]) => v.family === args.family).map(([n]) => n).sort();
        return { family: args.family, count: names.length, classes: names };
      }
      const s = summarizeVocab(vocab);
      return {
        classes: s.classes,
        variables: s.variables,
        families: s.families,
        reusableBaseComponents: s.families
          .filter((f) => ["text-size", "heading-style", "text-weight", "text-style", "padding", "margin", "spacer", "max-width", "button", "background", "align"].includes(f.family))
          .map((f) => ({ family: f.family, count: f.count, sample: f.sample })),
      };
    }
    case "validate_payload": {
      const payload = readJson(abs(args.payload));
      const vocab = args.vocab ? readJson(abs(args.vocab)) : null;
      return validatePayload(payload, vocab);
    }
    case "suggest_reuse": {
      const payload = readJson(abs(args.payload));
      const vocab = readJson(abs(args.vocab));
      const res = suggestReuse(payload, vocab, args.threshold ?? 0.6);
      if (args.out) writeJson(abs(args.out), res);
      return {
        styles: res.styles,
        suggested: res.suggested,
        coveragePct: res.coveragePct,
        top: res.suggestions.slice(0, 25),
        wrote: args.out ? path.relative(REPO, abs(args.out)) : null,
      };
    }
    case "resolve_fluid": {
      const src = abs(args.payload);
      const payload = readJson(src);
      const r = resolveFluid(payload);
      const dir = abs(args.out_dir || path.join(STATE, "resolved"));
      const base = path.basename(src, ".json");
      writeJson(path.join(dir, `${base}.json`), r.payload);
      writeJson(path.join(dir, `${base}.breakpoints.json`), r.breakpoints);
      return {
        resolved: r.resolved,
        unresolved: r.failed.length,
        unresolvedSample: r.failed.slice(0, 8),
        wrote: [path.relative(REPO, path.join(dir, `${base}.json`)),
                path.relative(REPO, path.join(dir, `${base}.breakpoints.json`))],
        breakpoints: BREAKPOINTS.map((b) => `${b.name}@${b.width}`).join(" "),
      };
    }
    case "eval_length":
      return {
        expr: args.expr,
        values: Object.fromEntries(BREAKPOINTS.map((b) => [b.name, evalLength(args.expr, b.width)])),
        note: "null means the expression needs container context (e.g. a percentage) and must stay as-is.",
      };
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

/* ---------------- JSON-RPC over stdio ---------------- */

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const ok = (id, result) => send({ jsonrpc: "2.0", id, result });
const err = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return ok(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "webflow-clientfirst", version: "0.1.0" },
    });
  }
  if (method === "notifications/initialized" || method === "initialized") return;
  if (method === "ping") return ok(id, {});
  if (method === "tools/list") return ok(id, { tools: TOOLS });
  if (method === "tools/call") {
    try {
      const result = call(params?.name, params?.arguments || {});
      return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      return ok(id, { content: [{ type: "text", text: `ERROR: ${e.message}` }], isError: true });
    }
  }
  if (id !== undefined) err(id, -32601, `method not found: ${method}`);
}

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try { handle(JSON.parse(line)); }
    catch (e) { err(null, -32700, `parse error: ${e.message}`); }
  }
});

// CLI passthrough so every capability is usable without an MCP client:
//   node server.mjs <tool> '{"json":"args"}'
if (process.argv[2]) {
  try {
    console.log(JSON.stringify(call(process.argv[2], JSON.parse(process.argv[3] || "{}")), null, 2));
  } catch (e) { console.error("ERROR:", e.message); process.exit(1); }
  process.exit(0);
}
