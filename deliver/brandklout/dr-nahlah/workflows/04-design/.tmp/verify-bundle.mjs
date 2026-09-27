import fs from "node:fs";
import path from "node:path";
const SRC = "site-src";
function bundle(dirs, ext) {
  const parts = [];
  for (const dir of dirs) {
    const abs = path.join(SRC, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((n) => n.endsWith(ext)).sort()) {
      parts.push("/* ===== " + dir + "/" + f + " ===== */
" + fs.readFileSync(path.join(abs, f), "utf8").replace(/\s*$/, "") + "
");
    }
  }
  return parts.join("
");
}
const runtimeJs = bundle(["js"], ".js");
const sectionJs = bundle(["sections"], ".js");
const boot = runtimeJs.indexOf("/* ===== js/90-boot.js ===== */");
const siteJs = runtimeJs.slice(0, boot) + sectionJs + "
" + runtimeJs.slice(boot);
const onDisk = fs.readFileSync("final-site/assets/site.js", "utf8");
console.log(siteJs === onDisk ? "IDENTICAL to a fresh build" : "DIFFERS (len " + siteJs.length + " vs " + onDisk.length + ")");
