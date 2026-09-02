// Replace a page's <main>...</main> with the contents of a file, then expand
// any {{img}} macros in it. The chrome (head, topbar, header, footer, the
// script tags) is never touched, which is the constraint from the README:
// the chrome is stamped and constant, the bodies are authored.
//
//   node splice-main.mjs ../home/about-us/index.html /path/to/about.main.html
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [page, body] = process.argv.slice(2).map((p) => path.resolve(p));
const html = fs.readFileSync(page, "utf8");
const main = fs.readFileSync(body, "utf8").trim();
const a = html.indexOf("<main");
const b = html.indexOf("</main>");
if (a < 0 || b < 0) throw new Error("no <main> in " + page);
if (!main.startsWith("<main") || !main.endsWith("</main>")) throw new Error("body file must start with <main and end with </main>");
fs.writeFileSync(page, html.slice(0, a) + main + html.slice(b + "</main>".length));
execFileSync(process.execPath, [path.join(HERE, "expand-img.mjs"), page], { stdio: "inherit" });
console.log("spliced " + path.relative(process.cwd(), page));
