// Read-only: what each Elfsight app id is (app type, sources, status), via the public boot API.
// node boot-ids.mjs scan.json [extra ids...] > boot.json
import fs from "node:fs";

const scan = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const ids = new Map();
for (const s of scan) for (const id of s.elfsight) ids.set(id, [...(ids.get(id) || []), s.key]);
for (const id of process.argv.slice(3)) if (!ids.has(id)) ids.set(id, ["(dashboard)"]);

const out = {};
for (const [id, sites] of ids) {
  const site = scan.find((s) => sites.includes(s.key));
  const page = site?.finalUrl || "https://example.com/";
  const u = `https://core.service.elfsight.com/p/boot/?page=${encodeURIComponent(page)}&w=${id}`;
  try {
    const r = await fetch(u, { headers: { referer: page, "user-agent": "Mozilla/5.0" } });
    const j = await r.json();
    const w = j?.data?.widgets?.[id];
    const st = w?.data?.settings ?? {};
    out[id] = {
      sites, status: w?.status, app: w?.data?.app,
      sources: (Array.isArray(st.sources) ? st.sources : []).map((x) => {
        const g = (st.googlePlaceData || {})[x.url] || {};
        return { type: x.type, caption: x.caption || [g.name, g.address].filter(Boolean).join(", "), url: x.url };
      }),
      title: st.headerTitle ?? st.title ?? st.widgetTitle,
      err: w?.data ? undefined : JSON.stringify(j).slice(0, 300),
    };
  } catch (e) { out[id] = { sites, err: String(e.message || e) }; }
  process.stderr.write(`${id} ${out[id].app ?? "?"} ${sites.join(",")} ${(out[id].sources || []).map((s) => s.caption).join(" | ")}\n`);
}
process.stdout.write(JSON.stringify(out, null, 1));
