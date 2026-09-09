/**
 * The practice's FRONT OF HOUSE, from the client's own "MARKETING PHOTOS"
 * Google Photos album, into `_album/<key>.jpg`. prep-images.py encodes them
 * exactly like the recovered frames and the stock, so there is still one place
 * that owns widths and webp.
 *
 *   node get-album.mjs            download anything missing
 *   node get-album.mjs --force    re-download everything
 *
 * WHY. Until 2026-09-09 the "invitation" chapter on forty-five pages carried
 * `waiting` - a 2.33:1 crop of a wall with an orchid, 290px across at source -
 * captioned as the waiting room. It was the only "place" photograph the
 * recovery mirror had. The client's album (212 frames, shot for the family
 * practice down the hall) has the FRONT DESK and the WAITING ROOM the two
 * practices share - the about page says so in its own words: "Same building,
 * same front desk" - and two children at the gumball machine and the
 * product shelf in that same front area.
 *
 * WHAT IS TAKEN, AND WHAT IS NOT. Only the shared front of house: the desk,
 * the sofa, the shelf, the gumball machine. Nothing clinical from that album
 * is used here - the treatment rooms, the doctor and the patients in it are
 * the adult practice's and would be a false picture of this one. The four
 * intraoral before/after frames and frame 187 (a patient record) are never
 * fetched. See the memory note "google-photos-album-is-fetchable" for how the
 * share link is read.
 *
 * The share link is `photos.app.goo.gl/k9MzHrudUfh4QhpW9`; each frame is a
 * `lh3.googleusercontent.com/pw/<id>` URL and `=w<px>` picks a width. The
 * ids below are the album's, and the number is the frame's position in the
 * album on 2026-09-09 so a later reader can find it on the contact sheet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "_album");
const force = process.argv.includes("--force");
const BASE = "https://lh3.googleusercontent.com/pw/";

/* key -> [album frame no., id, what it shows] */
const FRAMES = {
  "desk-1":     [39,  "AP1GczMU6VoU7dLlt85vaqcwyx40UaNpxjxTH6F_C80Rr76BKRmRvwZkixtbWzx8Ba4tktIZUQSDT0l0Nro6qGlF9LjlDjH6cpOg26__BtC5AChm9jSk70rY", "a patient at the front desk, smiling, with the receptionist (portrait)"],
  "desk-2":     [212, "AP1GczPzz4fRuRLVUhavoM5z5bBVO5bvlDJEUt5xxevF0OabV79Mu9rkcS4GupVRDmzaqIbJhYFoN5oiTHY41AIpMJv6b22JOk7r3w1WpJib_nXqTSxjl6EZ", "the receptionist and a patient over the desk, both smiling (portrait)"],
  "desk-form":  [115, "AP1GczOHxaMTbKSG8HJ0XGBAPFtqyTC1mBa_6tDNytW8uJ5ovi4MSTyOZcy213Uw1pAmF1-7ci2eeiFKb5jQoRz98fTyhY_OUjsa0Ja-0rqMoozHNbBYKZZa", "a form handed across the front desk (portrait)"],
  "desk-phone": [130, "AP1GczOQ2N2Tmhne9Q6mbOtmHdrhMRrla8oOSqp_ymxsA6HH5kNzcnKag1ATLTXCQTMaeEohLOSuahqa34mGoNON9eH9AcvRqY7WzWHO5GtLZgGbjzwOjKlv", "the receptionist on the phone (portrait)"],
  "gumball":    [171, "AP1GczPIxxDbF0Rsmt1KFBUPKTIsp-7REwiNbYwWxHsnLeid13DYxM1jdbApDl8YKOUlSSU-emI9JgJDYncWI6_iFGlyAFSUhYB_r5VE9hWDIEVGEIOVoVQw", "a toddler at the gumball machine by the front desk"],
  "gumball-2":  [156, "AP1GczP8_VMvfm9u2GC-0jkJWezw_rPaxZXFRPGhexN5c4z7_OrgcoIk7aQN6T7KC4PE9aeuBdV88hbkWiT8yF9r0NC6-I_djIKWMkrog3EpBhDurSKrTuJj", "the same toddler, reaching for the handle"],
  "shelf-kid":  [195, "AP1GczPRZKnyTvHKgms9RAvzJHXR_UVa2XlQVcJpQ74t7ciDbXeiOKsPlRg2YiE03MV1K28TWylOWsM1C9tXuERQwXSkuwrVvrFxzluqJQtfT7V88wCsKE7v", "a boy holding a toothpaste box at the product shelf (portrait)"],
  "shelf-kid-2":[125, "AP1GczONiCHHJslYQTQzV9dSanzuNrQD3DPv1ITVpcQ_sKuWvfc3oomA3TUojjrRj8vY1XQAfV4g8nFAarKscioaRg4A_3nwCjsRPp98KuWRVIQiyQlDaCQh", "an older boy at the product shelf (portrait)"],
  "sofa":       [163, "AP1GczPDhwd_dSIDja1lmZytst2X6jj_nD6HvJDbgaLtj-LoNVmNhi1J73B6lMmneLGgydua2rbQQjaW6W-KPcZGLzMEMA-HOdzRQj3ndJVUkw8BQToXxlIN", "two adults on the waiting-room sofa with the check-in tablet"],
};

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [key, [no, id, what]] of Object.entries(FRAMES)) {
  const dest = path.join(OUT, `${key}.jpg`);
  if (!force && fs.existsSync(dest)) { console.log(`skip  ${key.padEnd(12)} #${no}`); continue; }
  const r = await fetch(`${BASE}${id}=w2400`);
  if (!r.ok) { console.log(`FAIL  ${key.padEnd(12)} #${no} ${r.status}`); process.exitCode = 1; continue; }
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  console.log(`ok    ${key.padEnd(12)} #${no} ${(fs.statSync(dest).size / 1024).toFixed(0)}KB  ${what}`);
  n++;
}
console.log(`\n${n} fetched -> ${path.relative(HERE, OUT)}`);
