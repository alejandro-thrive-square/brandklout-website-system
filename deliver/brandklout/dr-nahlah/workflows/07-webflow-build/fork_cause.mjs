/* What actually predicts a fork: a differing definition, or simply not having
   been in the first paste?

   For every source class in a later page's payload, compare the name the payload
   asked for against the name that ended up in the published HTML. Then split the
   forks by whether the class existed in Home's payload (the first paste) and by
   whether its definition matched. Whichever split is clean is the real rule. */
import fs from "node:fs";

const ROOT = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/07-webflow-build";
const PAGES = [
  ["about", "about"], ["patient-stories", "patient-stories"], ["contact", "contact"],
  ["sedation-dentistry", "sedation-dentistry"], ["implant-cost", "implant-cost"],
  ["smile-makeover", "smile-makeover"], ["veneers", "veneers"],
  ["all-on-4", "all-on-4"], ["dental-implants", "dental-implants"],
  ["smile-gallery", "smile-gallery"],
];
const dir = (s) => (s === "home" ? "light" : "p-" + s);
const styles = (slug) => {
  const d = JSON.parse(fs.readFileSync(`${ROOT}/.tmp/${dir(slug)}/final.json`, "utf8"));
  return new Map(d.payload.styles.map((s) => [s.name, s.styleLess || ""]));
};

const home = styles("home");
const rows = [];

for (const [slug, path] of PAGES) {
  const html = await (await fetch(`https://dr-nahlah.webflow.io/${path}`)).text();
  const liveNames = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) liveNames.add(c);
  }
  const want = styles(slug);
  for (const [name, def] of want) {
    if (name.startsWith("nahlah-") || /^[a-z-]+-(p|div|span|a|b|i|img)-?\d*$/.test(name)) continue;
    if (liveNames.has(name)) continue;                 // landed under its own name
    // Did it land under a suffixed variant instead? A candidate that is itself a
    // name the payload defines (`a-after` vs `a-after-2`) is a different class,
    // not a fork of this one — counting those inflates the result badly.
    const forked = [...liveNames].find((n) =>
      n.startsWith(name + "-") && /^[-\d]+$/.test(n.slice(name.length)) && !want.has(n));
    if (!forked) continue;                             // class simply unused on this page
    rows.push({
      slug, name, forked,
      inHome: home.has(name),
      defMatches: home.has(name) ? home.get(name) === def : null,
    });
  }
}

const inHome = rows.filter((r) => r.inHome);
const notInHome = rows.filter((r) => !r.inHome);
console.log(`forked class instances observed live: ${rows.length}`);
console.log(`  present in Home's payload (first paste): ${inHome.length}`);
console.log(`  NOT present in Home's payload          : ${notInHome.length}`);
const mismatched = inHome.filter((r) => r.defMatches === false);
console.log(`  of the Home-present ones, definition differed: ${mismatched.length}`);
console.log("\nsample:");
for (const r of rows.slice(0, 12)) {
  console.log(`  ${r.slug.padEnd(19)} ${r.name.padEnd(14)} -> ${r.forked.padEnd(16)} inHome=${r.inHome} defMatch=${r.defMatches}`);
}
const uniq = [...new Set(rows.map((r) => r.name))];
console.log(`\ndistinct class names affected (${uniq.length}): ${uniq.join(", ")}`);
