// Convert ONE page (home/terms-of-service) to an Instatic node graph, without touching the shared
// chain's files: no instatic/ rewrite, no /tmp/payload.b64 or /tmp/nodes.b64 on the container.
//
//   node .tmp/terms/convert-terms.mjs        # staging container by default
//
// Same steps as to-instatic -> ship-payload -> run-convert -> fetch-nodes -> apply-body-class ->
// apply-image-alt, for one page, in /tmp/terms1003 and /app/terms1003-convert.ts, so it can run
// while another agent's publish chain is using the shared /tmp paths ("one publish chain at a time").
// Output: terms/converted.json  { slug, title, description, body }
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ssh } from "../railway-ssh.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.resolve(HERE, "..");
const SRC = path.resolve(TMP, "..", "home", "terms-of-service", "index.html");
// instatic-media-map.json is rewritten by every `--only` chain with just that chain's images (round
// seven's left it without the two this page uses). These are the uploads /hipaa-disclosure and
// /privacy-policy already reference, 200 on both instances (checked 2026-10-03); the map wins if it has them.
const KNOWN = {
  "uploads/st-window-960.webp": "/uploads/oh3kZAk-3tL7VYJvS8qpv-st-window-960.webp",
  "uploads/sofa-960.webp": "/uploads/SJCVrpq2zzairLde0Bgtx-sofa-960.webp",
};
const MEDIA = { ...KNOWN, ...JSON.parse(fs.readFileSync(path.join(TMP, "instatic-media-map.json"), "utf8")) };
const RDIR = "/tmp/terms1003";
const RCONV = "/app/terms1003-convert.ts";
const CHUNK = 7000;

// ---- to-instatic's transform, --lean --media, for this one file
const html = fs.readFileSync(SRC, "utf8");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)[1].trim());
const description = decode(html.match(/<meta name="description" content="([^"]*)"/i)[1].trim());
const bodyClass = html.match(/<body[^>]*\sclass="([^"]*)"/i)[1].trim();
const route = (href) => {
  const [p, hash = ""] = href.split(/(?=#)/);
  return p === "/" ? "/" + hash : p.replace(/\/+$/, "") + hash;
};
const unmapped = [];
const upload = (src) => {
  const name = src.replace(/^\/assets\//, "");
  const hit = MEDIA[name] || MEDIA[path.basename(name)];
  if (!hit) unmapped.push(src);
  return hit || src;
};
let body = html.replace(/(["\s])(?:\.\.\/)+assets\//g, "$1/assets/");
body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<link\b[^>]*>/gi, "");
body = body.slice(body.indexOf(">", body.indexOf("<body")) + 1, body.lastIndexOf("</body>"));
body = body.replace(/\bhref="(\/[^"]*)"/g, (_, h) => `href="${h.startsWith("/assets/") ? upload(h) : route(h)}"`);
body = body.replace(/\s(?:srcset|data-srcset|sizes)="[^"]*"/g, "");
body = body.replace(/\bsrc="(\/assets\/[^"]+)"/g, (_, s) => `src="${upload(s)}"`);
body = body.replace(/\bdata-src="(\/assets\/[^"]+)"/g, (_, s) => `data-src="${upload(s)}"`);
body = body.replace(/\n{3,}/g, "\n\n").trim();
if (unmapped.length) { console.error(`unmapped media: ${unmapped.join(", ")}`); process.exit(1); }
if (/\/assets\//.test(body)) { console.error("a /assets/ path survived"); process.exit(1); }
const page = { slug: "/terms-of-service", title, description, html: body };
console.log(`${page.slug}: ${title} | ${body.length} bytes`);

// ---- ship, convert, fetch (sha-checked both ways)
const put = (b64, remoteDir) => {
  ssh(`rm -rf ${remoteDir} && mkdir -p ${remoteDir}`);
  for (let i = 0; i < b64.length; i += CHUNK) ssh(`printf '%s' '${b64.slice(i, i + CHUNK)}' > ${remoteDir}/${String(i / CHUNK).padStart(4, "0")}`);
};
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

const payload = zlib.gzipSync(Buffer.from(JSON.stringify([page])), { level: 9 }).toString("base64");
put(payload, `${RDIR}/parts`);
ssh(`cat ${RDIR}/parts/* > ${RDIR}/payload.b64`);
if (ssh(`sha256sum ${RDIR}/payload.b64`).trim().split(/\s+/)[0] !== sha(payload)) throw new Error("payload sha mismatch");

const conv = fs.readFileSync(path.join(TMP, "container-convert.ts"), "utf8")
  .split("/tmp/payload.b64").join(`${RDIR}/payload.b64`)
  .split("/tmp/nodes.b64").join(`${RDIR}/nodes.b64`);
if (/\/tmp\/(payload|nodes)\.b64/.test(conv)) throw new Error("converter still points at the shared /tmp files");
const convB64 = Buffer.from(conv).toString("base64");
put(convB64, `${RDIR}/conv`);
ssh(`cat ${RDIR}/conv/* | base64 -d > ${RCONV}`);
if (ssh(`sha256sum ${RCONV}`).trim().split(/\s+/)[0] !== sha(conv)) throw new Error("converter sha mismatch");
console.log(ssh(`cd /app && bun run ${RCONV} 2>&1`, 2));

const out = ssh(`cat ${RDIR}/nodes.b64`).replace(/[\r\n]/g, "");
if (sha(out) !== ssh(`sha256sum ${RDIR}/nodes.b64`).trim().split(/\s+/)[0]) throw new Error("nodes sha mismatch");
ssh(`rm -rf ${RDIR} ${RCONV}`);
const [conv1] = JSON.parse(zlib.gunzipSync(Buffer.from(out, "base64")).toString("utf8"));
if (!conv1 || conv1.slug !== page.slug) throw new Error("conversion failed");

// ---- apply-body-class + apply-image-alt, same rules
const nodes = conv1.body.nodes;
const root = nodes[conv1.body.rootNodeId];
if (root.moduleId !== "base.body") throw new Error("root is not base.body");
root.classIds = [...new Set([...(root.classIds ?? []), ...bodyClass.split(/\s+/).filter(Boolean)])];
const imgs = [...body.matchAll(/<img\b[^>]*>/g)].map((m) => ({
  src: (m[0].match(/\ssrc="([^"]*)"/) || [])[1] ?? "",
  alt: (m[0].match(/\salt="([^"]*)"/) || [])[1] ?? "",
  loading: (m[0].match(/\sloading="([^"]*)"/) || [])[1] ?? "eager",
  fetchPriority: (m[0].match(/\sfetchpriority="([^"]*)"/i) || [])[1] ?? "auto",
}));
const inodes = Object.values(nodes).filter((n) => n.moduleId === "base.image");
if (inodes.length !== imgs.length) throw new Error(`${inodes.length} image nodes vs ${imgs.length} <img>`);
inodes.forEach((n, i) => {
  if (n.props?.src !== imgs[i].src) throw new Error(`image ${i} order differs`);
  n.props.htmlAttributes = { ...(n.props.htmlAttributes || {}), alt: imgs[i].alt };
  delete n.props.alt;
  n.props.loading = imgs[i].loading;
  n.props.fetchPriority = imgs[i].fetchPriority;
});
for (const n of Object.values(nodes)) if (!Array.isArray(n.children)) n.children = [];

fs.writeFileSync(path.join(HERE, "converted.json"), JSON.stringify({ slug: page.slug, title, description, body: conv1.body }, null, 1));
const mods = {};
for (const n of Object.values(nodes)) mods[n.moduleId] = (mods[n.moduleId] || 0) + 1;
console.log(`converted: ${Object.keys(nodes).length} nodes ${JSON.stringify(mods)}; body class ${JSON.stringify(root.classIds)}; ${inodes.length} images`);
