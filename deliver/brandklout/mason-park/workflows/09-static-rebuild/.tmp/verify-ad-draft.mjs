/** Verify the six paid-campaign pages and shared assets before publishing. */
import * as I from "./insta.mjs";

if (!I.IS_STAGING) throw new Error("This verifier only runs against staging.");

const campaigns = new Map([
  ["invisalign", "YbX91GhEDKkCN4GH4gka"],
  ["invisalign-consultation", "YbX91GhEDKkCN4GH4gka"],
  ["invisalign-thank-you", null],
  ["new-patient-special", "AFu5BpJpMjgSnSf8yybc"],
  ["new-patient-special-consultation", "AFu5BpJpMjgSnSf8yybc"],
  ["new-patient-thank-you", null],
]);

const rows = (await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows ?? [];
let problems = 0;
for (const [slug, expectedForm] of campaigns) {
  const row = rows.find((candidate) => (candidate.cells?.slug ?? candidate.slug) === slug);
  if (!row) {
    console.error(`MISSING /${slug}`);
    problems++;
    continue;
  }
  const body = row.cells?.body ?? {};
  const nodes = Object.values(body.nodes ?? {});
  const embeds = nodes.filter((node) => node.moduleId === "brandklout.embed-origins.embed");
  const formIds = embeds.flatMap((node) => {
    const match = (node.props?.snippet ?? "").match(/data-form-id="([^"]+)"/);
    return match ? [match[1]] : [];
  });
  const tracking = embeds.filter((node) => /number_pool\.js/.test(node.props?.snippet ?? ""));
  const root = body.nodes?.[body.rootNodeId];
  const ok = tracking.length === 1
    && formIds.length === (expectedForm ? 1 : 0)
    && (!expectedForm || formIds[0] === expectedForm)
    && root?.classIds?.includes("is-ad-page");
  if (!ok) problems++;
  console.log(`${ok ? "PASS" : "FAIL"} /${slug}  nodes=${nodes.length}  form=${formIds[0] ?? "none"}  tracking=${tracking.length}`);
}

const blog = rows.find((row) => row.cells?.slug === "blog-article");
const notFound = rows.find((row) => row.cells?.slug === "404");
const site = (await I.getSite()).site;
const script = (site.files ?? []).find((file) => file.path === "src/scripts/mason-park.js");
const style = (site.files ?? []).find((file) => file.path === "src/styles/mason-park.css");
const scriptScope = site.runtime?.scripts?.[script?.id]?.scope?.pageIds ?? [];
const sharedOk = rows.length === 63
  && scriptScope.length === rows.length
  && (script?.content?.length ?? 0) > 100_000
  && (style?.content?.length ?? 0) > 100_000
  && blog?.cells?.templateEnabled === true
  && blog?.cells?.templateTarget?.tableSlugs?.includes("articles")
  && notFound?.cells?.templateEnabled === true
  && notFound?.cells?.templateTarget?.kind === "notFound";
if (!sharedOk) problems++;
console.log(`${sharedOk ? "PASS" : "FAIL"} shared  pages=${rows.length}  scriptScope=${scriptScope.length}  style=${style?.content?.length ?? 0}  script=${script?.content?.length ?? 0}`);
console.log(`publish ${JSON.stringify(await I.publishStatus())}`);
console.log(`${problems} problem(s)`);
if (problems) process.exit(1);
