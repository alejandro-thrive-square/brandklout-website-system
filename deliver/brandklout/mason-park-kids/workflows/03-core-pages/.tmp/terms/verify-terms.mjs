// Verify /terms-of-service over HTTP on one host.
//   node .tmp/terms/verify-terms.mjs <host>
const host = process.argv[2];
if (!host) throw new Error("usage: verify-terms.mjs <host>");
let bad = 0;
const ok = (c, m) => { console.log(`  ${c ? "ok  " : "FAIL"} ${m}`); if (!c) bad++; };
for (const p of ["/terms-of-service", "/terms-of-service/"]) {
  const r = await fetch(`https://${host}${p}`, { redirect: "manual", headers: { "cache-control": "no-cache" } });
  ok(r.status === 200, `${p} -> ${r.status}${r.headers.get("location") ? " " + r.headers.get("location") : ""}`);
}
const r = await fetch(`https://${host}/terms-of-service/`, { headers: { "cache-control": "no-cache" } });
const html = await r.text();
const main = (html.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const text = main.replace(/<[^>]+>/g, " ");
const get = (re) => (html.match(re) || [])[1];
const title = get(/<title>([^<]*)<\/title>/);
ok(title === "Terms of Service | Mason Park Dental for Kids", `title: ${title}`);
const desc = get(/<meta name="description" content="([^"]*)"/);
ok(desc && desc.startsWith("The Terms of Service of Mason Park Dental for Kids"), `description: ${desc}`);
ok(get(/<meta property="og:description" content="([^"]*)"/) === desc, "og:description matches");
const canon = get(/<link rel="canonical" href="([^"]*)"/);
// Staging emits no canonical (emitCanonical off, de-indexed at the edge); production does, on the apex.
const STAGING = /^staging\./.test(host);
ok(STAGING ? canon === undefined : canon === `https://${host}/terms-of-service/`, `canonical: ${canon ?? "(none)"}${STAGING ? " (staging emits none)" : ""}`);
const ogUrl = get(/<meta property="og:url" content="([^"]*)"/);
ok(ogUrl === `https://${host}/terms-of-service/`, `og:url: ${ogUrl}`);
ok(/Mason Park Dental for Kids \(“we,” “us,” or “our”\), located at https:\/\/masonparkpediatricdental\.com\//.test(text), "entity + website in the scope sentence");
ok(text.includes("Effective Date:") && text.includes("October 3, 2026"), "effective date October 3, 2026");
ok(/A2P 10DLC/.test(text) && /replying STOP/.test(text), "SMS terms present");
ok((main.match(/<h3>\d+\. /g) || []).length === 20, `20 numbered sections (${(main.match(/<h3>\d+\. /g) || []).length})`);
ok(/href="\/privacy-policy\/?"/.test(main), "links /privacy-policy");
ok(main.includes("21830 Kingsland Blvd #104B") && main.includes("(281) 578-7100"), "kids address + phone");
for (const re of [/of Katy/i, /PLLC/, /bestdentistinkatytx/i, /(?<!office@)masonparkdental\.com/i, /769-8878/, /104A/, /Smile Preview/i, /—/]) {
  ok(!re.test(text), `no ${re}`);
}
console.log(`robots meta: ${get(/<meta name="robots" content="([^"]*)"/) ?? "-"}; x-robots-tag: ${r.headers.get("x-robots-tag") ?? "-"}; chapters: ${(main.match(/data-chapter="/g) || []).length}`);
console.log(bad ? `${host}: ${bad} FAIL` : `${host}: all ok`);
process.exit(bad ? 1 : 0);
