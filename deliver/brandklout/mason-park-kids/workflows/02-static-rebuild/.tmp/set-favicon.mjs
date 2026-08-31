/**
 * Set the site favicon from the logo in the media manifest's `headOnly` list.
 *
 *   node set-favicon.mjs [--publish]
 *
 * The favicon is the one asset the page export cannot carry: it lives in the
 * document `<head>` as `<link rel="icon">`, and the export is a BODY. So it
 * reaches neither the page HTML nor - before `push-media.mjs` learned to walk
 * `headOnly` - the upload. It is uploaded with everything else now; this points
 * the site at it.
 *
 * It is a single string, `site.settings.faviconUrl` (see
 * `/app/src/core/page-tree/siteSettings.ts`), and it is what
 * `GET /admin/api/cms/public-site` reports back - so that endpoint is the
 * check, not the admin UI.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  api, getSite, saveShell, publish as doPublish, BASE,
} from "../../../../../process/18-instatic-embeds/lib/insta-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");

const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "instatic", "media-manifest.json"), "utf8"));
const map = JSON.parse(fs.readFileSync(path.join(HERE, "instatic-media-map.json"), "utf8"));

const local = (manifest.headOnly ?? [])[0];
if (!local) {
  console.error("media-manifest.json has no headOnly entry - nothing to use as a favicon");
  process.exit(2);
}
const name = local.replace(/^\/assets\//, "");
const url = map[name];
if (!url) {
  console.error(`${name} is not in media-map.json - run push-media.mjs first`);
  process.exit(1);
}

console.log(`site: ${BASE}`);
console.log(`favicon: ${name}\n      -> ${url}`);

const { site: shell, seq } = await getSite();
const settings = { ...(shell.settings ?? {}), faviconUrl: url };
console.log(`save: ${JSON.stringify(await saveShell({ ...shell, settings }, seq)).slice(0, 160)}`);

const publicSite = await api("GET", "/admin/api/cms/public-site");
console.log(`public-site: ${JSON.stringify(publicSite)}`);
if (publicSite.faviconUrl !== url) {
  console.error("faviconUrl did not persist");
  process.exit(1);
}

if (PUBLISH) console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
