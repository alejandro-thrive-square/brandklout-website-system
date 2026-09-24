// ===========================================================================
// PUBLISH THE 161 ARTICLE ROWS, OLDEST ARTICLE FIRST.
//
//   node publish-articles.mjs --check
//   node publish-articles.mjs
//
// THE ORDER IS THE POINT. `base.loop` can only sort by the columns the
// `data.rows` source offers -- publishedAt, createdAt, updatedAt, slug -- and
// none of those is the date the practice published the article. `publishedAt`
// is when the ROW was published INTO Instatic, and there is no API to backdate
// it: POST .../rows/:id/publish stamps now(), and /schedule refuses any time
// that is not in the future.
//
// So the two orders are made to agree instead: publish the rows in ascending
// ARTICLE date, one request at a time, and `publishedAt DESC` then lists the
// newest article first -- which is what the listing asks for. The row
// timestamps are seconds apart and strictly increasing, so there are no ties.
//
// The one article Yoast never dated is published FIRST, so it lands LAST in
// the listing -- the same place the static build put it.
//
// A row that is already published is left alone: re-publishing would re-stamp
// its timestamp and scramble the order this script exists to create. Pass
// --force to republish everything (after a content re-import, say), which
// re-establishes the order from scratch.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes("--check");
const FORCE = process.argv.includes("--force");
const TABLE_SLUG = "articles";

// Production only on the launch: ALLOW_PRODUCTION=launch is set by the one-off
// push-production-2026-09-24.sh that took the rebuilt site live (2026-09-24).
if (!I.IS_STAGING && process.env.ALLOW_PRODUCTION !== "launch") {
  console.error("REFUSING: INSTATIC_BASE_URL is not a staging instance.");
  process.exit(1);
}

await I.login();
try { await I.stepUp(); } catch {}

const table = (await I.api("GET", "/admin/api/cms/data/tables")).tables
  .find((t) => t.slug === TABLE_SLUG);
if (!table) { console.error(`REFUSING: no data table with slug "${TABLE_SLUG}"`); process.exit(1); }

const rows = (await I.api("GET", `/admin/api/cms/data/tables/${table.id}/rows`)).rows || [];
console.log(`${rows.length} row(s) in ${table.name}`);

// Ascending article date. Undated first, so it ends up last in a DESC listing.
const order = [...rows].sort((a, b) => {
  const da = a.cells?.dateIso || "";
  const db = b.cells?.dateIso || "";
  if (!da && !db) return String(a.cells?.title).localeCompare(String(b.cells?.title));
  if (!da) return -1;
  if (!db) return 1;
  return da.localeCompare(db);
});

const todo = FORCE ? order : order.filter((r) => r.status !== "published");
const already = order.length - todo.length;
console.log(`${already} already published, ${todo.length} to publish`);
console.log(`first: ${todo[0]?.cells?.dateIso || "(undated)"}  ${String(todo[0]?.cells?.title).slice(0, 60)}`);
console.log(`last : ${todo[todo.length - 1]?.cells?.dateIso}  ${String(todo[todo.length - 1]?.cells?.title).slice(0, 60)}`);

if (CHECK) { console.log("\n--check: nothing published."); process.exit(0); }

let done = 0, failed = 0;
for (const [i, r] of todo.entries()) {
  try {
    await I.api("POST", `/admin/api/cms/data/rows/${r.id}/publish`, {});
    done++;
  } catch (e) {
    failed++;
    console.log(`\n  FAIL ${r.cells?.slug}: ${String(e.message).slice(0, 140)}`);
  }
  if ((i + 1) % 10 === 0 || i === todo.length - 1) {
    process.stdout.write(`\r  ${i + 1}/${todo.length}  published ${done}  failed ${failed}`);
  }
}
console.log("");

// Read back, and check the order actually came out the way it was meant to.
const after = (await I.api("GET", `/admin/api/cms/data/tables/${table.id}/rows`)).rows || [];
const pub = after.filter((r) => r.status === "published");
console.log(`\n${pub.length}/${after.length} published`);

// Verified through `loop-preview`, which runs the SAME query the published
// loop runs, and not by re-sorting the row list here: the rows endpoint
// serialises publishedAt truncated to the second ("…:15.000Z"), so several
// rows look tied when the stored timestamps are microseconds apart and order
// perfectly. Sorting on the truncated value reports a divergence that does
// not exist. Ask the source, not the JSON.
const preview = await I.api(
  "GET",
  `/admin/api/cms/data/tables/${table.id}/loop-preview?orderBy=publishedAt&direction=desc&limit=200`,
);
const items = preview.items ?? preview.rows ?? [];
const dates = items.map((it) => String(it.fields?.dateIso ?? ""));
const firstBreak = dates.findIndex((d, i) => i > 0 && d && dates[i - 1] && d > dates[i - 1]);
console.log(`loop order: ${items.length} item(s) as the listing will read them`);
if (firstBreak < 0) {
  console.log("newest article first, all the way down");
} else {
  console.log(`! out of order at position ${firstBreak}: ${dates[firstBreak - 1]} then ${dates[firstBreak]}`);
}

const out = path.join(HERE, "blog", "publish-order.json");
fs.writeFileSync(out, JSON.stringify(items.map((it) => ({
  slug: it.fields?.slug, dateIso: it.fields?.dateIso, publishedAt: it.fields?.publishedAt,
})), null, 2));
console.log(`wrote ${path.relative(process.cwd(), out)}`);
