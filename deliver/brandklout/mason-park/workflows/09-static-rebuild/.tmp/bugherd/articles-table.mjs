// Read the Articles postType table (routeBase /blog) on INSTATIC_BASE_URL, and with
// --create-from <staging-url> create it here with the same name, slug, routeBase and
// fields when it is missing. Idempotent: an existing /blog table is left alone.
//   INSTATIC_BASE_URL=<prod> node articles-table.mjs [--create-from articles-table-staging.json]
import * as I from "../insta.mjs";
const argv = process.argv.slice(2);
const find = (tables) => tables.find((t) => t.routeBase === "/blog" && t.kind === "postType");
const here = find((await I.api("GET", "/admin/api/cms/data/tables")).tables);
if (process.env.DUMP) { console.log(JSON.stringify(here)); process.exit(0); }
console.log(`${I.BASE}: ${here ? `table ${here.id} ${here.name} slug=${here.slug} fields=${here.fields.map((f) => f.id).join(",")}` : "no /blog table"}`);
// --create-from reads the source table from a JSON file written by DUMP=1 against
// the source instance. A child node process on a pipe dies on Windows (libuv
// assertion) and failed the launch chain once, so the dump is a separate step.
const from = argv.includes("--create-from") ? argv[argv.indexOf("--create-from") + 1] : null;
if (!from) process.exit(0);
const src = JSON.parse((await import("node:fs")).readFileSync(from, "utf8").split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith("{")));
console.log(`source table: ${JSON.stringify(src).slice(0, 400)}`);
if (here) { console.log("exists here, nothing to create"); process.exit(0); }
const body = { name: src.name, slug: src.slug, kind: src.kind, routeBase: src.routeBase, fields: src.fields };
for (const k of ["description", "settings", "singularLabel", "pluralLabel", "primaryFieldId"]) if (src[k] !== undefined) body[k] = src[k];
const res = await I.api("POST", "/admin/api/cms/data/tables", body);
console.log(`created: ${JSON.stringify(res).slice(0, 300)}`);
