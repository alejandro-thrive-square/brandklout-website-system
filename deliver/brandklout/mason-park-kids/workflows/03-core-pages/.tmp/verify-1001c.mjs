// #82 (play area) and the Canva team portraits (#502 #504 #506), checked on the published site.
//   node verify-1001c.mjs > verify-1001c.log      (BASE=https://masonparkpediatricdental.com for production)
const BASE = process.env.BASE || "https://staging.masonparkpediatricdental.com";
const get = async (p) => (await fetch(`${BASE}/${p ? p + "/" : ""}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/130" } })).text();
let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : (fail++, console.log("FAIL", msg)); };
const home = await get(""), team = await get("our-team"), docs = await get("our-doctors");
ok(home.includes("playarea-382"), "home has playarea-382");
ok(!home.includes("st-play-"), "home lacks the st-play band");
ok(home.includes("A dinosaur wall to keep little hands busy."), "home has the play-area line");
ok(home.includes("elfsight-app-d359c3c4"), "home keeps the Elfsight widget");
const people = ["priscilla", "amanda", "nicole", "anabel", "ivon", "caisy", "josh", "alison", "luis", "genevieve", "tiffany", "lola"];
for (const k of people) ok(team.includes(`canva-${k}-`), `our-team has canva-${k}`);
for (const n of ["Priscilla", "Amanda", "Nicole", "Josh", "Alison", "Luis", "Lola"]) ok(team.includes(`<b>${n}</b>`) || team.includes(`>${n}<`), `our-team names ${n}`);
ok(!/staff-(anabel|ivon|caisy|genevieve|tiffany)-/.test(team), "our-team has no old staff- portraits");
ok(docs.includes("canva-cho-") && !docs.includes("dr-cho-"), "our-doctors uses canva-cho only");
ok(!team.includes("dr-cho-"), "our-team has no dr-cho");
console.log(`${pass} pass, ${fail} fail on ${BASE}`);
