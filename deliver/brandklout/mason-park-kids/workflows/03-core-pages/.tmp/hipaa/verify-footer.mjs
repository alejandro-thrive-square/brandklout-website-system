// Every published page carries the footer link, right after Privacy, and the link resolves.
//
//   node .tmp/hipaa/verify-footer.mjs <host>      e.g. masonparkpediatricdental.com
// Slugs come from the CMS of the instance INSTATIC_BASE_URL points at (PROMOTE=production for the apex).
import { getPages } from "../insta.mjs";

const host = process.argv[2];
const slugs = ((await getPages()).rows ?? []).map((r) => (r.slug === "index" ? "" : r.slug));
const LINK = '<a href="/privacy-policy" target="_self">Privacy</a><a href="/hipaa-disclosure" target="_self">HIPAA Disclosure</a>';
let ok = 0;
const bad = [];
for (let i = 0; i < slugs.length; i += 8) {
  await Promise.all(slugs.slice(i, i + 8).map(async (s) => {
    const res = await fetch(`https://${host}/${s}`);
    const html = await res.text();
    const n = html.split('href="/hipaa-disclosure"').length - 1;
    if (res.status === 200 && html.includes(LINK) && n === 1) ok++;
    else bad.push(`/${s} ${res.status} links=${n}`);
  }));
}
const target = await fetch(`https://${host}/hipaa-disclosure`);
console.log(`${host}: ${ok}/${slugs.length} pages carry Privacy -> HIPAA Disclosure; /hipaa-disclosure -> ${target.status}`);
for (const b of bad) console.log(`  BAD ${b}`);
process.exit(bad.length || target.status !== 200 ? 1 : 0);
