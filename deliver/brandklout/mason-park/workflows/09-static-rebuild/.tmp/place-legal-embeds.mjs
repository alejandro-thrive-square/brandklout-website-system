/**
 * Turn the two placeholders on /contacts into real `webzite.embed-origins`
 * Embed blocks.
 *
 *   node place-legal-embeds.mjs      # rewrites legal-live/converted-pages.json in place
 *
 * WHY AN EMBED BLOCK AND NOT AN <iframe>
 * Instatic's publisher strips <iframe> out of a page body and writes
 * `frame-src 'none'` into the published page's CSP. Both embeds on the live
 * contact page are therefore invisible today: the appointment form and the
 * Google Maps pin each render as an empty section. The ONLY thing that puts a
 * frame on a published Instatic page is the embed-origins Embed module, whose
 * `publish.html` hook reads the published page and widens `frame-src` for that
 * one page (autoTrust, on by default). See deliver/process/18-instatic-embeds.
 *
 * The form is placed in `snippet` mode carrying GoHighLevel's snippet verbatim
 * — the iframe AND `form_embed.js`, which is what sizes the iframe to the form.
 * `url` mode would emit the iframe without that loader. The map has no loader,
 * so it goes in `url` mode.
 *
 * Modelled on 10-lp-instatic/.tmp/place-embeds.mjs. The one substantive
 * difference: the landing pages carry two campaign forms that must never cross,
 * so that script asserts a slug->form mapping. There is one form here, so the
 * assertion is simply that the id in the placeholder is the one the client
 * supplied and that it is NOT the old agency's form.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, "legal-live", "converted-pages.json");
const MODULE_ID = "webzite.embed-origins.embed";

// Supplied by the client on 2026-08-28, from Brandklout's GoHighLevel location.
const FORM_ID = "JuzM9SxuJMPDMwfO6cgj";
const FORM_NAME = "Contact form";
// The form the crawler harvested off the old WordPress site. It belongs to the
// previous agency's GHL location; a lead submitted through it does not reach
// this pipeline. It must not survive this swap.
const OLD_FORM_ID = "9tzFcq7rgDGIvq5wJfWL";

const FORM_SNIPPET = `<iframe
    src="https://api.leadconnectorhq.com/widget/form/${FORM_ID}"
    style="width:100%;height:100%;border:none;border-radius:8px"
    id="inline-${FORM_ID}"
    data-layout="{'id':'INLINE'}"
    data-trigger-type="alwaysShow"
    data-trigger-value=""
    data-activation-type="alwaysActivated"
    data-activation-value=""
    data-deactivation-type="neverDeactivate"
    data-deactivation-value=""
    data-form-name="${FORM_NAME}"
    data-height="1398"
    data-layout-iframe-id="inline-${FORM_ID}"
    data-form-id="${FORM_ID}"
    data-cookie-consent="true"
    data-cookie-consent-provider="auto"
    title="${FORM_NAME}"
>
</iframe>
<script src="https://link.msgsndr.com/js/form_embed.js"></script>`;

const pages = JSON.parse(fs.readFileSync(FILE, "utf8"));
const problems = [];
let placed = 0;

/** Replace a node in place: same id, same parent, same slot among its siblings. */
const asEmbed = (slot, props) => ({
  id: slot.id,
  moduleId: MODULE_ID,
  props: {
    source: "url",
    snippet: "",
    url: "",
    title: "",
    fit: "fixed",
    height: 600,
    ratio: "16 / 9",
    lazy: true,
    allowFullscreen: false,
    allow: "",
    ...props,
  },
  breakpointOverrides: {},
  children: [],
  classIds: slot.classIds ?? [],
  parentId: slot.parentId ?? null,
});

for (const page of pages) {
  const nodes = page.body.nodes;
  const slots = Object.values(nodes).filter((n) => n.props?.htmlAttributes?.["data-embed-slot"]);

  if (page.slug !== "/contacts") {
    if (slots.length) problems.push(`${page.slug}: has ${slots.length} embed slot(s) but takes none`);
    continue;
  }
  if (slots.length !== 2) {
    problems.push(`${page.slug}: expected 2 embed slots (form, map), found ${slots.length}`);
    continue;
  }

  for (const slot of slots) {
    const a = slot.props.htmlAttributes;
    const height = Number(a["data-embed-height"]) || 600;

    if (a["data-embed-slot"] === "form") {
      if (a["data-ghl-form"] !== FORM_ID) {
        problems.push(`${page.slug}: form slot carries ${a["data-ghl-form"]}, expected ${FORM_ID}`);
        continue;
      }
      if (FORM_SNIPPET.includes(OLD_FORM_ID)) {
        problems.push("the snippet still references the old agency's form id");
        continue;
      }
      if (!FORM_SNIPPET.includes(`data-form-id="${FORM_ID}"`)) {
        problems.push("the snippet does not carry its own form id");
        continue;
      }
      nodes[slot.id] = asEmbed(slot, {
        source: "snippet", snippet: FORM_SNIPPET, title: FORM_NAME, height,
      });
      console.log(`${page.slug.padEnd(18)} form  ${FORM_ID}  (${FORM_NAME})  h=${height}`);
      placed++;
    } else if (a["data-embed-slot"] === "map") {
      const url = a["data-embed-url"];
      if (!/^https:\/\/www\.google\.com\/maps\/embed\?/.test(url || "")) {
        problems.push(`${page.slug}: map slot carries a url that is not a Google Maps embed`);
        continue;
      }
      nodes[slot.id] = asEmbed(slot, {
        source: "url", url, title: "Map to Mason Park Dental of Katy", height, allowFullscreen: true,
      });
      console.log(`${page.slug.padEnd(18)} map   ${url.slice(0, 48)}...  h=${height}`);
      placed++;
    } else {
      problems.push(`${page.slug}: unknown embed slot "${a["data-embed-slot"]}"`);
    }
  }
}

// Nothing anywhere may still point at the old agency's form.
const dump = JSON.stringify(pages);
if (dump.includes(OLD_FORM_ID)) problems.push(`${OLD_FORM_ID} is still present after the swap`);
if (!dump.includes(FORM_ID)) problems.push(`${FORM_ID} is not present after the swap`);

if (problems.length) {
  console.error("\n" + problems.map((p) => "  ! " + p).join("\n"));
  process.exit(1);
}

fs.writeFileSync(FILE, JSON.stringify(pages, null, 2));
console.log(`\n${placed} embed block(s) placed -> legal-live/converted-pages.json`);
