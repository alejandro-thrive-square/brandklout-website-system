/**
 * Replace paid-page form placeholders with brandklout.embed-origins modules
 * after the HTML converter has written converted-pages.json.
 *
 * It used to add the GHL number-pool scripts to all six campaign pages; since 2026-09-25
 * the pool is site-wide on production (SITE_WIDE_POOL), so it places none.
 * Since 2026-09-30 it also turns the `data-elfsight-reviews` slot on / and /patient-reviews
 * into the practice's Google reviews widget (elfsight-snippet.mjs).
 *
 * Since 2026-09-25 the forms are the client's own (site-forms.json, copied
 * verbatim from 01-content-intake/.tmp/scripts.html) and each slot is filled
 * by the form id it carries: Invisalign and New Patient Special on the ad
 * pages, and the general Contact form on /contacts, which every "Book"
 * button on the site now links to.
 *
 *   node place-ad-embeds.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WIDGET_ID, MODULE_ID as REVIEWS_MODULE_ID, embedProps } from "./elfsight-snippet.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES_FILE = path.join(HERE, "converted-pages.json");
const FORMS_FILE = path.join(HERE, "..", "..", "10-lp-instatic", ".tmp", "out", "forms.json");
const SITE_FORMS_FILE = path.join(HERE, "site-forms.json");
const CONTACT_SLUG = "/contacts";
const TRACKING_FILE = path.join(HERE, "..", "..", "10-lp-instatic", ".tmp", "out", "tracking.json");
const MODULE_ID = "brandklout.embed-origins.embed";
const REVIEW_SLOTS = 2; // / and /patient-reviews
// The six routes live under /ads-landing-pages/ since 2026-09-18. Workflow 10
// still keys its form and tracking records by the bare production slug, so
// the last path segment is what looks them up.
const PREFIX = "/ads-landing-pages";
const AD_SLUGS = new Set([
  "invisalign", "invisalign-consultation", "invisalign-thank-you",
  "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you",
].map((s) => `${PREFIX}/${s}`));
const bare = (slug) => "/" + slug.split("/").pop();

const pages = JSON.parse(fs.readFileSync(PAGES_FILE, "utf8"));
const forms = JSON.parse(fs.readFileSync(FORMS_FILE, "utf8"));
const tracking = JSON.parse(fs.readFileSync(TRACKING_FILE, "utf8"));
const formBySlug = new Map(forms.map((f) => [`/${f.slug}`, f]));
const siteForms = new Map(JSON.parse(fs.readFileSync(SITE_FORMS_FILE, "utf8")).map((f) => [f.formId, f]));
const slotsOf = (page) => Object.values(page.body.nodes).filter((n) => n.props?.htmlAttributes?.["data-ghl-form"]);
const toEmbed = (slot, form) => ({
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
});
const trackingBySlug = new Map(tracking.map((t) => [`/${t.slug}`, t]));
const newId = () => `ad${crypto.randomBytes(8).toString("hex")}`;
const problems = [];
let formsPlaced = 0;
let trackingPlaced = 0;
const SITE_WIDE_POOL = true;

for (const page of pages.filter((p) => AD_SLUGS.has(p.slug))) {
  const nodes = page.body.nodes;
  const slots = slotsOf(page);
  // Workflow 10's record says which pages carry a form at all; the slot's own
  // id says which form, and it must be one of the client's site forms.
  const hasForm = formBySlug.has(bare(page.slug));

  if (!hasForm) {
    if (slots.length) problems.push(`${page.slug}: thank-you page unexpectedly has a form slot`);
  } else if (slots.length !== 1) {
    problems.push(`${page.slug}: expected one form slot, found ${slots.length}`);
  } else {
    const slot = slots[0];
    const carried = slot.props.htmlAttributes["data-ghl-form"];
    const form = siteForms.get(carried);
    if (!form) problems.push(`${page.slug}: ${carried} is not in site-forms.json`);
    else {
      nodes[slot.id] = toEmbed(slot, form);
      formsPlaced++;
    }
  }

  // Since 2026-09-25 the pool loads site-wide on production (bugherd/set-site-pool.mjs),
  // so no page carries its own copy: twice would ask GHL for two numbers per visitor.
  if (SITE_WIDE_POOL) continue;
  const sourceScripts = trackingBySlug.get(bare(page.slug))?.scripts ?? [];
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
    classIds: ["lp-tracking"],
    parentId: root,
  };
  nodes[root].children.push(nodeId);
  trackingPlaced++;
}

const contact = pages.find((p) => p.slug === CONTACT_SLUG);
let contactPlaced = 0;
if (!contact) problems.push(`${CONTACT_SLUG}: not in converted-pages.json`);
else {
  const slots = slotsOf(contact);
  const form = slots.length === 1 && siteForms.get(slots[0].props.htmlAttributes["data-ghl-form"]);
  if (!form || form.formName !== "Contact form") problems.push(`${CONTACT_SLUG}: expected one Contact form slot, found ${slots.length}`);
  else { contact.body.nodes[slots[0].id] = toEmbed(slots[0], form); contactPlaced++; }
}

// The live Google reviews (2026-09-30): the practice's own Elfsight widget where the
// homepage deck and the reviews wall were. The local slot is
// `<div class="rv-embed" data-elfsight-reviews="<id>">`; it becomes an Embed here so a
// re-import keeps the widget (add-elfsight-reviews.mjs does the same to the live rows).
let reviewsPlaced = 0;
for (const page of pages) {
  for (const slot of Object.values(page.body.nodes).filter((n) => n.props?.htmlAttributes?.["data-elfsight-reviews"])) {
    const id = slot.props.htmlAttributes["data-elfsight-reviews"];
    if (id !== WIDGET_ID) { problems.push(`${page.slug}: reviews slot carries ${id}, not ${WIDGET_ID}`); continue; }
    page.body.nodes[slot.id] = {
      id: slot.id, moduleId: REVIEWS_MODULE_ID, props: embedProps(), breakpointOverrides: {},
      children: [], classIds: slot.classIds ?? [], parentId: slot.parentId ?? null,
    };
    reviewsPlaced++;
  }
}
if (pages.some((p) => p.slug === "/") && reviewsPlaced !== REVIEW_SLOTS) problems.push(`expected ${REVIEW_SLOTS} reviews slots (/ and /patient-reviews), placed ${reviewsPlaced}`);

const adPages = pages.filter((p) => AD_SLUGS.has(p.slug));
if (adPages.length !== 6) problems.push(`expected six converted ad pages, found ${adPages.length}`);
if (formsPlaced !== 4) problems.push(`expected four forms, placed ${formsPlaced}`);
if (trackingPlaced !== (SITE_WIDE_POOL ? 0 : 6)) problems.push(`expected six tracking blocks, placed ${trackingPlaced}`);

const idsByCampaign = new Map();
for (const page of adPages) {
  const formNode = Object.values(page.body.nodes).find(
    (n) => n.moduleId === MODULE_ID && /data-form-id=/.test(n.props?.snippet ?? ""),
  );
  if (!formNode) continue;
  const id = formNode.props.snippet.match(/data-form-id="([^"]+)"/)?.[1];
  const campaign = bare(page.slug).startsWith("/invisalign") ? "invisalign" : "new-patient";
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
console.log(`${formsPlaced} ad forms, ${contactPlaced} contact form, ${trackingPlaced} tracking blocks, ${reviewsPlaced} reviews widgets, ${problems.length} problems`);
for (const problem of problems) console.log(`  PROBLEM ${problem}`);
process.exitCode = problems.length ? 1 : 0;

