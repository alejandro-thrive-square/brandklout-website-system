/**
 * Replace paid-page form placeholders with brandklout.embed-origins modules
 * after the HTML converter has written converted-pages.json.
 *
 * It also adds the existing GHL number-pool scripts to all six campaign pages.
 * No Elfsight script is copied: the redesign uses the site's own proof chapter.
 *
 *   node place-ad-embeds.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES_FILE = path.join(HERE, "converted-pages.json");
const FORMS_FILE = path.join(HERE, "..", "..", "10-lp-instatic", ".tmp", "out", "forms.json");
const TRACKING_FILE = path.join(HERE, "..", "..", "10-lp-instatic", ".tmp", "out", "tracking.json");
const MODULE_ID = "brandklout.embed-origins.embed";
const AD_SLUGS = new Set([
  "/invisalign", "/invisalign-consultation", "/invisalign-thank-you",
  "/new-patient-special", "/new-patient-special-consultation", "/new-patient-thank-you",
]);

const pages = JSON.parse(fs.readFileSync(PAGES_FILE, "utf8"));
const forms = JSON.parse(fs.readFileSync(FORMS_FILE, "utf8"));
const tracking = JSON.parse(fs.readFileSync(TRACKING_FILE, "utf8"));
const formBySlug = new Map(forms.map((f) => [`/${f.slug}`, f]));
const trackingBySlug = new Map(tracking.map((t) => [`/${t.slug}`, t]));
const newId = () => `ad${crypto.randomBytes(8).toString("hex")}`;
const problems = [];
let formsPlaced = 0;
let trackingPlaced = 0;

for (const page of pages.filter((p) => AD_SLUGS.has(p.slug))) {
  const nodes = page.body.nodes;
  const slots = Object.values(nodes).filter((n) => n.props?.htmlAttributes?.["data-ghl-form"]);
  const form = formBySlug.get(page.slug);

  if (!form) {
    if (slots.length) problems.push(`${page.slug}: thank-you page unexpectedly has a form slot`);
  } else if (slots.length !== 1) {
    problems.push(`${page.slug}: expected one form slot, found ${slots.length}`);
  } else {
    const slot = slots[0];
    const carried = slot.props.htmlAttributes["data-ghl-form"];
    if (carried !== form.formId) problems.push(`${page.slug}: ${carried} does not match ${form.formId}`);
    nodes[slot.id] = {
      id: slot.id,
      moduleId: MODULE_ID,
      props: {
        source: "snippet",
        snippet: form.snippet,
        url: "",
        title: form.formName,
        fit: "fixed",
        height: Number(slot.props.htmlAttributes["data-ghl-height"]) || form.height || 723,
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
    formsPlaced++;
  }

  const sourceScripts = trackingBySlug.get(page.slug)?.scripts ?? [];
  const scripts = sourceScripts.filter((s) => s.includes("backend.leadconnectorhq.com"));
  if (scripts.length !== 2) {
    problems.push(`${page.slug}: expected the two GHL tracking scripts, found ${scripts.length}`);
    continue;
  }
  const root = page.body.rootNodeId;
  const nodeId = newId();
  nodes[nodeId] = {
    id: nodeId,
    moduleId: MODULE_ID,
    props: {
      source: "snippet",
      snippet: scripts.join(""),
      url: "",
      title: "Call tracking",
      fit: "auto",
      height: 0,
      ratio: "16 / 9",
      lazy: false,
      allowFullscreen: false,
      allow: "",
    },
    breakpointOverrides: {},
    children: [],
    classIds: ["ad-tracking"],
    parentId: root,
  };
  nodes[root].children.push(nodeId);
  trackingPlaced++;
}

const adPages = pages.filter((p) => AD_SLUGS.has(p.slug));
if (adPages.length !== 6) problems.push(`expected six converted ad pages, found ${adPages.length}`);
if (formsPlaced !== 4) problems.push(`expected four forms, placed ${formsPlaced}`);
if (trackingPlaced !== 6) problems.push(`expected six tracking blocks, placed ${trackingPlaced}`);

const idsByCampaign = new Map();
for (const page of adPages) {
  const formNode = Object.values(page.body.nodes).find(
    (n) => n.moduleId === MODULE_ID && /data-form-id=/.test(n.props?.snippet ?? ""),
  );
  if (!formNode) continue;
  const id = formNode.props.snippet.match(/data-form-id="([^"]+)"/)?.[1];
  const campaign = page.slug.startsWith("/invisalign") ? "invisalign" : "new-patient";
  if (!idsByCampaign.has(campaign)) idsByCampaign.set(campaign, new Set());
  idsByCampaign.get(campaign).add(id);
}
for (const [campaign, ids] of idsByCampaign) {
  if (ids.size !== 1) problems.push(`${campaign}: crossed form mapping (${[...ids].join(", ")})`);
}
if ([...idsByCampaign.values()].map((ids) => [...ids][0]).filter(Boolean).length === 2) {
  const ids = [...idsByCampaign.values()].map((set) => [...set][0]);
  if (ids[0] === ids[1]) problems.push("both campaigns use the same form id");
}

if (!problems.length) fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2));
console.log(`${formsPlaced} forms, ${trackingPlaced} tracking blocks, ${problems.length} problems`);
for (const problem of problems) console.log(`  PROBLEM ${problem}`);
process.exitCode = problems.length ? 1 : 0;

