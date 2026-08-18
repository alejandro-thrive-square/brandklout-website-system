#!/usr/bin/env node
// upload-posters.mjs — fetch a poster frame for every YouTube video the reference embeds and
// upload it to the site's assets.
//
// Needed because a native Webflow `Video` element cannot be made to render through this API:
// it stores {src, title} and reads back correctly, but publishes as an EMPTY
// `<div class="w-video w-embed"></div>` — Webflow only generates the embed markup when the
// Designer fetches oEmbed. The reference pages get their videos from HtmlEmbed iframes, which
// this build is not allowed to use (their own `Video` elements are all hidden). So v2 renders
// each video as a poster image linking to the watch URL: native, no custom code, and it still
// gets the viewer to the film.
//
// Writes poster-map.json { videoId: {assetId, name} }.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SITE, tree, all } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WFMCP = path.join(HERE, "..", "wfmcp.mjs");
const OUT = path.join(HERE, "poster-map.json");
const map = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};

// every video id the six reference pages embed
const ids = new Set();
for (const slug of ["cosmetic", "dental-implants"]) {
  let T; try { T = tree(slug); } catch { continue; }
  for (const s of T.sections) {
    for (const n of all(s, (x) => x.tag === "iframe" && /youtube\.com\/embed\//.test(x.src || ""))) {
      ids.add(n.src.split("/embed/")[1].split(/[?&]/)[0]);
    }
  }
}
console.log("video ids:", [...ids].join(" "));

/** YouTube serves maxres only for some uploads; hq is always present. */
async function poster(id) {
  for (const name of ["maxresdefault", "hqdefault"]) {
    const r = await fetch(`https://img.youtube.com/vi/${id}/${name}.jpg`);
    if (r.ok) {
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length > 2000) return b;      // the 120x90 "unavailable" placeholder is tiny
    }
  }
  throw new Error(`no poster for ${id}`);
}

for (const id of ids) {
  if (map[id]?.assetId) { console.log("skip (done)", id); continue; }
  const bytes = await poster(id);
  const name = `gm-video-poster-${id}.jpg`;
  const md5 = crypto.createHash("md5").update(bytes).digest("hex");
  const argFile = path.join(HERE, "raw", ".args-poster.json");
  fs.writeFileSync(argFile, JSON.stringify({
    context: "Upload a video poster frame so the v2 pages can show the film without custom code.",
    actions: [{ label: id, create_asset: { site_id: SITE, file_name: name, file_hash: md5 } }],
  }));
  const raw = execFileSync("node", [WFMCP, "call", "data_assets_tool", "--file", argFile], { encoding: "utf8" });

  let created = null;
  const dig = (o) => {
    if (!o || typeof o !== "object" || created) return;
    if (o.uploadUrl && o.uploadDetails) { created = o; return; }
    for (const k of Object.keys(o)) dig(o[k]);
  };
  for (const line of raw.trim().split(/\r?\n/)) { try { dig(JSON.parse(line)); } catch {} }
  if (!created) { console.error("no uploadUrl for", id, raw.slice(0, 300)); process.exitCode = 1; continue; }

  // Webflow hands back camelCased keys; the signed S3 policy expects the canonical names.
  const S3KEY = {
    xAmzAlgorithm: "X-Amz-Algorithm", xAmzCredential: "X-Amz-Credential",
    xAmzDate: "X-Amz-Date", xAmzSignature: "X-Amz-Signature",
    successActionStatus: "success_action_status", contentType: "Content-Type",
    cacheControl: "cache-control",
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(created.uploadDetails)) fd.append(S3KEY[k] ?? k, v);
  fd.append("file", new Blob([bytes], { type: "image/jpeg" }), name);
  const resp = await fetch(created.uploadUrl, { method: "POST", body: fd });
  if (!resp.ok && resp.status !== 201 && resp.status !== 204) {
    console.error("S3 FAIL", id, resp.status, (await resp.text()).slice(0, 200));
    process.exitCode = 1; continue;
  }
  map[id] = { assetId: created.id, name, bytes: bytes.length };
  fs.writeFileSync(OUT, JSON.stringify(map, null, 1));
  console.log("uploaded", id, "->", created.id, `(${(bytes.length / 1024).toFixed(0)}KB)`);
}
console.log("posters mapped:", Object.keys(map).length);
