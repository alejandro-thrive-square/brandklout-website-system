/**
 * The Mason Park Dental for Kids values for `brandklout.open-graph` and
 * `brandklout.aeo-schema`.
 *
 *   node configure-seo.mjs            show the diff, write nothing
 *   node configure-seo.mjs --apply
 *
 * WHY THESE PLUGINS ARE HERE. `diff-live.mjs` reported the same thing on all
 * eleven core routes, and `audit-live.mjs` then found it on all fifty-seven:
 * the published pages carry NO meta description, NO canonical, NO og: tags and
 * NO JSON-LD. Not a mistake in the import - a page row on Instatic is a title,
 * a slug and a body, and `buildDocumentMetaTags` writes the title, one
 * site-wide description and the favicon. Everything in the local <head> was
 * being dropped on the way in, and had been since the 02 migration.
 *
 * So: 228 of the 285 faults the audit counted across the whole instance were
 * this one gap, and these two plugins close it at publish time for every page,
 * the forty-six migrated ones included, without touching a single page row.
 *
 * The plugins ship with EMPTY defaults on purpose - an address and a telephone
 * number are facts about one practice and have no business inside a package
 * another client installs. This file is where this practice's facts live, and
 * it is idempotent: a re-run prints `=` and writes nothing.
 *
 * WHERE THE FACTS COME FROM. The organisation block is the JSON-LD the eleven
 * local pages already carry in their own <head> (home/index.html), which in
 * turn is what the chrome publishes on every page: the suite, the number and
 * the hours. It is deliberately the same string a parent reads on the page,
 * because a LocalBusiness whose NAP disagrees with the page it sits on is
 * worse than none - it is the machine-readable copy a directory will trust.
 *
 * > [!IMPORTANT]
 * > `SITE` is the PUBLIC domain, which does not point at this instance yet.
 * > That is deliberate and it matches what the eleven pages already declare in
 * > their own canonical and og:url. It is also the one value to re-check at
 * > the domain cutover, along with open item 1 in the README - the suite and
 * > the telephone number are still unconfirmed by the practice.
 */
import { api } from "./insta.mjs";

const APPLY = process.argv.includes("--apply");

const SITE = "https://pediatricdentistkatytx.com";
const NAME = "Mason Park Dental for Kids";
const LOGO = "/uploads/Cij5leM8-W0W5EUmwh-vA-logo.png";
// The whole team in the waiting room. The share card is the first thing a
// parent sees when somebody pastes the address into a message, so it is the
// people, not a room and not a treatment.
const SHARE = "/uploads/c4YY3oFRXVp2Ne63HFwyE-team-1440.webp";

const ORGANIZATION = {
  "@type": "Dentist",
  "@id": `${SITE}/#organization`,
  name: NAME,
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: SITE + LOGO },
  image: SITE + SHARE,
  telephone: "(281) 578-7100",
  email: "office@masonparkdental.com",
  medicalSpecialty: "Pediatric dentistry",
  address: {
    "@type": "PostalAddress",
    streetAddress: "21830 Kingsland Blvd #104B",
    addressLocality: "Katy",
    addressRegion: "TX",
    postalCode: "77450",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Wednesday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Thursday"], opens: "08:00", closes: "17:00" },
  ],
  areaServed: [{ "@type": "City", name: "Katy" }],
  parentOrganization: {
    "@type": "Dentist",
    name: "Mason Park Dental of Katy",
    url: "https://www.masonparkdental.com/",
  },
};

const WANT = {
  "brandklout.open-graph": {
    enabled: true,
    siteUrl: SITE,
    siteName: NAME,
    defaultImage: SHARE,
    defaultImageAlt: "The team at Mason Park Dental for Kids",
    defaultType: "website",
    locale: "en_US",
    twitterCard: "summary_large_image",
    // On: a page with no override takes its title, description and picture
    // from itself. That is what makes this useful across fifty-seven pages
    // without anyone typing fifty-seven sets of tags.
    deriveFromPage: true,
    // The platform emits ONE description on every page. This replaces it with
    // the page's own wherever the row has one - which is what populate-seo.mjs
    // is for.
    syncMetaDescription: true,
    emitCanonical: true,
  },
  "brandklout.aeo-schema": {
    enabled: true,
    siteUrl: SITE,
    siteName: NAME,
    organizationJson: JSON.stringify(ORGANIZATION, null, 2),
  },
};

let changed = 0;
for (const [id, want] of Object.entries(WANT)) {
  const current = (await api("GET", `/admin/api/cms/plugins/${id}/settings`)).settings ?? {};
  console.log(`\n${id}`);
  const diff = {};
  for (const [k, v] of Object.entries(want)) {
    const now = current[k];
    const same = JSON.stringify(now) === JSON.stringify(v);
    const show = (x) => (typeof x === "string" && x.length > 60 ? x.slice(0, 57) + "..." : JSON.stringify(x));
    console.log(`  ${same ? "=" : "~"} ${k.padEnd(20)} ${same ? show(v) : `${show(now)}  ->  ${show(v)}`}`);
    if (!same) diff[k] = v;
  }
  if (!Object.keys(diff).length) { console.log("  (nothing to change)"); continue; }
  changed++;
  if (!APPLY) continue;
  const res = await api("PUT", `/admin/api/cms/plugins/${id}/settings`, { settings: { ...current, ...diff } });
  const back = res.settings ?? {};
  const bad = Object.keys(diff).filter((k) => JSON.stringify(back[k]) !== JSON.stringify(diff[k]));
  console.log(bad.length ? `  WROTE, but did not come back: ${bad.join(", ")}` : `  wrote ${Object.keys(diff).length} setting(s)`);
}
console.log(APPLY ? "\napplied" : `\n${changed} plugin(s) would change - re-run with --apply`);
