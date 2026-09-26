// Every logo in _logos/ as a PNG 120px tall, transparent, trimmed to its box: ins-<slug>.png in uploads/.
import fs from "node:fs";
import { chromium } from "playwright-core";
const want = ["aetna.svg","alphaeon-credit.png","ameritas.png","assurant.svg","carecredit.svg","careington.png","cigna.svg","delta-dental.svg","dnoa.svg","guardian.svg","humana.svg","lendingclub.svg","metlife.svg","principal.svg","sun-life.svg"];
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1600, height: 400 } });
for (const f of want) {
  const buf = fs.readFileSync("_logos/" + f);
  const mime = f.endsWith(".svg") ? "image/svg+xml" : "image/png";
  await p.setContent(`<html><body style="margin:0;background:transparent"><img id="i" style="display:block;height:120px;width:auto;max-width:1500px" src="data:${mime};base64,${buf.toString("base64")}"></body></html>`);
  await p.waitForTimeout(300);
  const out = "../home/assets/uploads/ins-" + f.replace(/\.(svg|png)$/, "") + ".png";
  await p.locator("#i").screenshot({ path: out, omitBackground: true });
  console.log(out);
}
await b.close();
