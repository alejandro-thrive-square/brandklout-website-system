// Read-only: for every Termly-registry site, which Elfsight apps it embeds, which other review
// vendors it loads, and its own Google listing facts (name/address from JSON-LD).
// node scan-reviews.mjs <termly-websites.json> > out.json
import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const list = Array.isArray(rows) ? rows : rows.websites ?? Object.values(rows)[0];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const VENDORS = ["reputationhub", "leadconnectorhq.com/reputation", "trustindex", "birdeye", "podium", "embedsocial",
  "sociablekit", "grade.us", "reviewsonmywebsite", "widget.reviews", "featurable", "elfsightcdn"];

const get = async (url) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: ctl.signal });
    return { status: r.status, url: r.url, html: await r.text() };
  } catch (e) { return { status: 0, url, html: "", err: String(e.message || e) }; }
  finally { clearTimeout(t); }
};

const out = [];
for (const r of list) {
  const site = r.url;
  const home = await get(site);
  const html = home.html;
  // a /reviews-like page linked from home, for widgets that live off the homepage
  const links = [...new Set([...html.matchAll(/href="([^"#?]*(review|testimonial)[^"#?]*)"/gi)].map((m) => m[1]))].slice(0, 3);
  let extra = "";
  for (const l of links) {
    const u = new URL(l, home.url || site).href;
    if (!u.startsWith(new URL(home.url || site).origin)) continue;
    extra += (await get(u)).html;
  }
  const all = html + extra;
  const ids = [...new Set(all.match(/elfsight-app-[0-9a-f-]{36}/g) || [])].map((s) => s.slice(13));
  const vendors = VENDORS.filter((v) => all.toLowerCase().includes(v));
  const ld = {};
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const s = m[1];
    for (const k of ["streetAddress", "addressLocality", "addressRegion", "postalCode"]) {
      const v = s.match(new RegExp(`"${k}"\\s*:\\s*"([^"]+)"`));
      if (v && !ld[k]) ld[k] = v[1];
    }
    const n = s.match(/"@type"\s*:\s*"(Dentist|LocalBusiness|MedicalBusiness|MedicalClinic|DentalClinic|Physician|HealthAndBeautyBusiness|MedicalSpa)"[\s\S]{0,400}?"name"\s*:\s*"([^"]+)"/);
    if (n && !ld.name) ld.name = n[2];
  }
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1]?.trim();
  out.push({ key: r.key, label: r.label, url: site, finalUrl: home.url, status: home.status, err: home.err,
    platform: r.platform, clientFolder: r.clientFolder, reviewPages: links, elfsight: ids, vendors, ld, title });
  process.stderr.write(`${r.key} ${home.status} elfsight=${ids.length} ${vendors.join(",")}\n`);
}
process.stdout.write(JSON.stringify(out, null, 1));
