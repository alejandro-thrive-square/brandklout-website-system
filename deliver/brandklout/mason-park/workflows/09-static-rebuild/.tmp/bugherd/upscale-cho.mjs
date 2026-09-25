// Upscale Dr. Cho's 750x750 practice headshot 2x through Freepik's Magnific endpoint,
// with the settings that keep a real face (creativity 1, resemblance 3, sharpy,
// soft_portraits). The result must be compared with the original before use.
//   node upscale-cho.mjs <in.jpg> <out.jpg> > upscale-cho.log
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const [inp, out] = process.argv.slice(2);
const env = fs.readFileSync(path.join(os.homedir(), ".webzite", ".env"), "utf8");
const KEY = (env.match(/^\s*MAGNIFIC\s*=\s*"?([^"\r\n]+)"?/m) || [])[1];
const H = { "x-freepik-api-key": KEY, "content-type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let task;
for (let i = 0; i < 4 && !task; i++) {
  const r = await fetch("https://api.freepik.com/v1/ai/image-upscaler", { method: "POST", headers: H, body: JSON.stringify({
    image: fs.readFileSync(inp).toString("base64"), scale_factor: "2x", optimized_for: "soft_portraits",
    creativity: 1, hdr: 2, resemblance: 3, fractality: 0, engine: "magnific_sharpy" }) });
  if (r.status >= 500) { await sleep(3000); continue; }
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300));
  task = j.data.task_id;
}
console.log("task", task);
for (let i = 0; i < 90; i++) {
  await sleep(5000);
  const j = await (await fetch(`https://api.freepik.com/v1/ai/image-upscaler/${task}`, { headers: H })).json();
  const st = j.data?.status; if (i % 6 === 0) console.log(st);
  if (st === "COMPLETED") { const u = j.data.generated[0]; fs.writeFileSync(out, Buffer.from(await (await fetch(u)).arrayBuffer())); console.log("saved", out); process.exit(0); }
  if (st === "FAILED") throw new Error("FAILED");
}
throw new Error("timeout");
