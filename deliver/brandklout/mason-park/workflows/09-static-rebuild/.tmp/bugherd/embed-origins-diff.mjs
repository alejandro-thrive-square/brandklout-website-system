// Compare brandklout.embed-origins settings between staging and production: which
// origins staging allows that production does not. Read-only.
//   node embed-origins-diff.mjs > embed-origins-diff.log
import { execFileSync } from "node:child_process";
const get = (base) => JSON.parse(execFileSync(process.execPath, ["-e", `
  import("../insta.mjs").then(async (I) => {
    const s = await I.api("GET", "/admin/api/cms/plugins/brandklout.embed-origins/settings");
    process.stdout.write(JSON.stringify(s));
  });`], { cwd: import.meta.dirname, env: { ...process.env, INSTATIC_BASE_URL: base }, encoding: "utf8" }));
const P = get("https://www.masonparkdental.com"), S = get("https://staging.masonparkdental.com");
const flat = (o) => (o.settings ?? o);
const p = flat(P), s = flat(S);
console.log("keys prod:", Object.keys(p).join(","), "\nkeys staging:", Object.keys(s).join(","));
for (const k of new Set([...Object.keys(p), ...Object.keys(s)])) {
  const a = p[k], b = s[k];
  if (Array.isArray(a) || Array.isArray(b)) {
    const A = new Set((a || []).map((x) => (typeof x === "string" ? x : JSON.stringify(x))));
    const B = (b || []).map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
    console.log(`${k}: prod ${A.size}, staging ${B.length}; staging-only: ${B.filter((x) => !A.has(x)).map((x) => x.slice(0, 90)).join(" | ") || "-"}`);
  } else console.log(`${k}: prod ${JSON.stringify(a)?.slice(0, 160)} | staging ${JSON.stringify(b)?.slice(0, 160)}`);
}
