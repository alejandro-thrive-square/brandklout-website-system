/**
 * Turn each form placeholder into a real `webzite.embed-origins` Embed block.
 *
 *   node place-embeds.mjs            # rewrites converted-pages.json in place
 *
 * Instatic's HTML importer knows nothing about plugin modules, so the swap has
 * to happen on the node graph after conversion. build.mjs leaves a placeholder
 * carrying `data-ghl-form`; this replaces that node with the Embed module,
 * keeping its id, parent and position so the page tree is otherwise untouched.
 *
 * TWO CAMPAIGNS, TWO FORMS - crossing them would send Invisalign leads into the
 * New Patient pipeline, so the id is taken from the placeholder that the page
 * itself carried, matched against forms.json, and every page is asserted to end
 * up with the form its Webflow original had:
 *
 *   Invisalign        YbX91GhEDKkCN4GH4gka  /invisalign, /invisalign-consultation
 *   $189 New Patient  AFu5BpJpMjgSnSf8yybc  /new-patient-special, /new-patient-special-consultation
 *   thank-you pages   none
 *
 * The embed is placed in `snippet` mode carrying the vendor snippet verbatim -
 * the iframe AND GoHighLevel's `form_embed.js`, which is what resizes the
 * iframe to the form. `url` mode would emit the iframe without that loader.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ID = "webzite.embed-origins.embed";

const pages = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const forms = JSON.parse(fs.readFileSync(path.join(HERE, "out", "forms.json"), "utf8"));
const bySlug = new Map(forms.map((f) => [f.slug, f]));

let placed = 0;
const problems = [];

for (const page of pages) {
  const nodes = page.body.nodes;
  const slots = Object.values(nodes).filter(
    (n) => n.props?.htmlAttributes?.["data-ghl-form"],
  );
  const want = bySlug.get(page.slug);

  if (!want) {
    if (slots.length) problems.push(`${page.slug}: has ${slots.length} placeholder(s) but no form is expected`);
    console.log(`${page.slug.padEnd(34)} no form (correct - thank-you pages take no lead form)`);
    continue;
  }
  if (slots.length !== 1) {
    problems.push(`${page.slug}: expected exactly 1 placeholder, found ${slots.length}`);
    continue;
  }

  const slot = slots[0];
  const id = slot.props.htmlAttributes["data-ghl-form"];
  if (id !== want.formId) {
    problems.push(`${page.slug}: placeholder carries ${id} but forms.json says ${want.formId}`);
    continue;
  }
  if (!want.snippet.includes(`data-form-id="${want.formId}"`)) {
    problems.push(`${page.slug}: the snippet does not carry its own form id`);
    continue;
  }

  const height = Number(slot.props.htmlAttributes["data-ghl-height"]) || want.height || 723;

  // Replace in place: same node id, same parent, same slot in children.
  nodes[slot.id] = {
    id: slot.id,
    moduleId: MODULE_ID,
    props: {
      source: "snippet",
      snippet: want.snippet,
      url: "",
      title: want.formName || "Contact form",
      fit: "fixed",
      height,
      ratio: "16 / 9",
      lazy: true,
      allowFullscreen: false,
      allow: "",
    },
    breakpointOverrides: {},
    children: [],
    classIds: slot.classIds ?? [],
    parentId: slot.parentId ?? null,
  };
  placed++;
  console.log(`${page.slug.padEnd(34)} ${want.formId}  (${want.formName.trim()})  h=${height}`);
}

// ------------------------------------------------- call tracking + reviews
//
// The Webflow pages load these at the end of <body>; the port strips them with
// every other script, so they come back as a second Embed block appended to the
// page root. `fit: 'auto'` matters - the wrapper then takes its height from its
// contents, and script tags have none, so this adds no visible box.
//
// This is what restores the per-campaign call-tracking number. Without it the
// pages render the practice's public number and every ad call attributes to the
// main site.
const tracking = JSON.parse(fs.readFileSync(path.join(HERE, "out", "tracking.json"), "utf8"));
const trackBySlug = new Map(tracking.map((t) => [t.slug, t]));
let tracked = 0;

for (const page of pages) {
  const t = trackBySlug.get(page.slug);
  if (!t?.scripts?.length) continue;
  const nodes = page.body.nodes;
  const root = page.body.rootNodeId;

  const existing = Object.values(nodes).find((n) => n.classIds?.includes("lp-tracking"));
  const nodeId = existing?.id ?? `lptrack${Math.random().toString(36).slice(2, 12)}`;

  nodes[nodeId] = {
    id: nodeId,
    moduleId: MODULE_ID,
    props: {
      source: "snippet",
      snippet: t.scripts.join(""),
      url: "",
      title: "Call tracking and reviews",
      fit: "auto",
      height: 0,
      ratio: "16 / 9",
      lazy: false,
      allowFullscreen: false,
      allow: "",
    },
    breakpointOverrides: {},
    children: [],
    classIds: ["lp-tracking"],
    parentId: root,
  };
  if (!nodes[root].children.includes(nodeId)) nodes[root].children.push(nodeId);
  tracked++;
  console.log(`${page.slug.padEnd(34)} tracking: ${t.scripts.length} script(s)`);
}
console.log(`${tracked} tracking block(s) placed`);

// Every campaign's pages must agree with each other.
const campaigns = new Map();
for (const page of pages) {
  // A page now carries up to two Embed blocks - the form and the tracking
  // scripts - so pick the one that actually holds a form.
  const node = Object.values(page.body.nodes).find(
    (n) => n.moduleId === MODULE_ID && /data-form-id="/.test(n.props?.snippet ?? ""),
  );
  if (!node) continue;
  const id = (node.props.snippet.match(/data-form-id="([^"]+)"/) || [])[1];
  const campaign = page.slug.startsWith("invisalign") ? "invisalign" : "new-patient";
  if (!campaigns.has(campaign)) campaigns.set(campaign, new Set());
  campaigns.get(campaign).add(id);
}
console.log("");
for (const [campaign, ids] of campaigns) {
  console.log(`${campaign.padEnd(14)} -> ${[...ids].join(", ")}`);
  if (ids.size !== 1) problems.push(`${campaign}: pages disagree on the form id (${[...ids].join(", ")})`);
}
if (campaigns.size === 2) {
  const [a, b] = [...campaigns.values()].map((s) => [...s][0]);
  if (a === b) problems.push("both campaigns resolved to the SAME form id - the mapping is crossed");
}

fs.writeFileSync(path.join(HERE, "converted-pages.json"), JSON.stringify(pages, null, 2));
console.log(`\n${placed} embed block(s) placed, ${problems.length} problems`);
for (const p of problems) console.log(`  PROBLEM  ${p}`);
process.exitCode = problems.length ? 1 : 0;
