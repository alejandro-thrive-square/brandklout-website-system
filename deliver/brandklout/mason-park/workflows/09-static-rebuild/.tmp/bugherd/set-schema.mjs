// brandklout.aeo-schema, filled in (2026-09-25, with the Open Graph work). Every page emitted a
// Dentist entity with no name, address or phone, because every setting was empty.
// organizationJson REPLACES the generated entity, so it carries the whole practice: the build's
// own Dentist JSON-LD (address, hours, Facebook), with url set to this instance's address and the
// logo from its media library. The telephone is the PUBLIC number; the call-tracking pool swaps
// visible numbers only, never the schema. Read-merge-write. Idempotent. --apply also publishes.
//   INSTATIC_BASE_URL=... node bugherd/set-schema.mjs [--apply]
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const URL_ = "/admin/api/cms/plugins/brandklout.aeo-schema/settings";
const got = await I.api("GET", URL_);
const before = got.settings ?? got;
const media = await I.listMedia();
const items = media.assets ?? media.rows ?? media ?? [];
const logoAsset = items.find((a) => (a.filename ?? a.name ?? a.originalName) === "mp-logo-nav-422x180.png");
if (!logoAsset) throw new Error("mp-logo-nav-422x180.png is not in this instance's media library");
const logo = I.BASE + (logoAsset.publicPath ?? logoAsset.public_path ?? logoAsset.url ?? logoAsset.path);
const NAME = "Mason Park Dental of Katy";
const PHONE = "(281) 769-8878";
const org = {
  "@type": "Dentist",
  name: NAME,
  url: I.BASE + "/",
  logo,
  image: logo,
  telephone: PHONE,
  email: "office@masonparkdental.com",
  address: { "@type": "PostalAddress", streetAddress: "21830 Kingsland Blvd #104A", addressLocality: "Katy", addressRegion: "TX", postalCode: "77450", addressCountry: "US" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Thursday"], opens: "09:00", closes: "17:00" },
  ],
  sameAs: ["https://www.facebook.com/p/Mason-Park-Dental-100083179359693/"],
};
const next = {
  ...before,
  siteUrl: I.BASE,
  siteName: NAME,
  organizationName: NAME,
  logo,
  telephone: PHONE,
  sameAs: org.sameAs.join("\n"),
  organizationJson: JSON.stringify(org),
};
const changed = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(before[k]));
console.log(`${I.BASE}: ${changed.length ? "will set " + changed.join(", ") : "already set"}`);
if (!APPLY || !changed.length) process.exit(0);
await I.api("PUT", URL_, { settings: next });
const got2 = await I.api("GET", URL_);
const after = got2.settings ?? got2;
for (const k of Object.keys(next)) if (JSON.stringify(after[k]) !== JSON.stringify(next[k])) throw new Error(`${k} did not stick`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 120)}`);
