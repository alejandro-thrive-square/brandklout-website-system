/**
 * Pulls this site's stock photography from Magnific (api.freepik.com) into
 * `_stock/<key>.jpg`. prep-images.py encodes it, exactly like the practice's
 * own frames, so there is still one place that owns widths and webp.
 *
 *   node get-stock.mjs --dry-run     search only; print what would be taken
 *   node get-stock.mjs               download anything missing
 *   node get-stock.mjs --force       re-download everything
 *   node get-stock.mjs --only st-brush
 *
 * WHY THERE IS STOCK HERE AT ALL. 2026-09-08, the client: "Use more images and
 * extract stock photos from Magnific." The practice owns twenty-three usable
 * frames and eleven pages, so `waiting` was carrying nine of those pages and
 * `team` six; the thin pages (financing, services, reviews, thank-you) had two
 * photographs each, both of them the arrival and the invitation. There was
 * nothing left in the practice's library to reach for.
 *
 * > [!IMPORTANT]
 * > WHAT STOCK MAY AND MAY NOT DO ON THIS SITE.
 * >
 * > MAY: childhood, at a remove. Objects (toothbrushes, books, crayons, a
 * > lunchbox), rooms with nobody in them, and children or families in ORDINARY
 * > life - a sink at home, a park, a kitchen table. These are decorative, they
 * > illustrate a mood, and no reasonable reader takes them for a record of
 * > anything.
 * >
 * > MAY NOT, and `audit-stock.mjs` fails the build on each of these:
 * >   - stand in for a NAMED PERSON. Every doctor and every one of the nine
 * >     staff is a real person with a real photograph; a stock face under a
 * >     real name is a fabrication of that person. This is why the two staff
 * >     portraits Magnific could not upscale were left soft rather than
 * >     replaced - see upscale-images.mjs.
 * >   - be captioned, or alt-texted, as THIS PRACTICE'S room, patient, team or
 * >     result. "The waiting room at Mason Park Dental" over a stock interior
 * >     is a false statement about a real business, whatever the intent.
 * >   - appear in a CLINICAL context: a treatment chair, an instrument, an
 * >     examination, a mouth, a before/after. A stock child in a dental chair
 * >     beside a treatment name reads as that treatment performed here, on a
 * >     patient of this practice, and that is a claim a parent relies on.
 * > Every alt text below is written to the FRAME, never to the practice, and
 * > `people: false` is asserted on every slot that does not need a person.
 *
 * The download is a PREMIUM Magnific resource against the agency's licence.
 * `stock-manifest.json` is committed and records the id, title, author,
 * licence and page URL of every frame, because six months from now that is the
 * only way to answer "where did this picture come from".
 *
 * Auth: MAGNIFIC in the repo-root .env (a Freepik API key).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STOCK = path.join(HERE, "_stock");
const MANIFEST = path.join(HERE, "stock-manifest.json");

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const force = argv.includes("--force");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim();
  let dir = HERE;
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, ".env");
    if (fs.existsSync(c)) {
      const line = fs.readFileSync(c, "utf8").split("\n").find((l) => l.startsWith("MAGNIFIC="));
      if (line) return line.slice("MAGNIFIC=".length).trim().replace(/^["']|["']$/g, "");
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error("no MAGNIFIC and no .env above " + HERE);
}
const KEY = apiKey();

/* One entry per picture the markup will ask for.
     key          the pool name; the markup points at `<key>-<width>.webp`
     term         the search
     orientation  horizontal | vertical | square
     people       true only where a person is the subject and is ORDINARY life
     prefer       title words that re-rank the results toward what is wanted
     avoid        title words that drop a candidate outright
     alt          the alt text the markup will carry, written to the FRAME
     for          which chapter it is for, so a later reader knows why it exists */
const AVOID_ALWAYS = [
  // never a clinic, never a procedure, never a result
  "dentist", "dental", "clinic", "surgery", "surgeon", "patient", "teeth whitening",
  "implant", "braces", "x-ray", "xray", "before after", "orthodont",
  // never an illustration standing in for a photograph
  "illustration", "vector", "cartoon", "3d render", "clipart", "icon",
];

const SLOTS = [
  {
    key: "st-brush", term: "child brushing teeth bathroom sink morning", orientation: "vertical",
    people: true, prefer: ["child", "kid", "brushing", "toothbrush", "bathroom"], avoid: [],
    alt: "A child brushing their teeth at a bathroom sink",
    for: "the habit chapters - new patients, the service page",
  },
  {
    key: "st-brushes", term: "childrens toothbrushes in a white cup bright clean bathroom shelf", orientation: "horizontal",
    people: false, prefer: ["toothbrush", "white", "bright", "clean", "cup", "bathroom"], avoid: ["concrete", "dark", "grunge", "rustic", "moody", "old"],
    alt: "Children's toothbrushes in a cup",
    for: "the plan and the offers - an object, not a room",
  },
  {
    key: "st-books", term: "stack of childrens picture books on a table", orientation: "horizontal",
    people: false, prefer: ["book", "children", "stack", "reading"], avoid: [],
    alt: "A stack of children's picture books",
    for: "the waiting and the reading chapters",
  },
  {
    key: "st-crayons", term: "crayons and childs drawing on a table overhead", orientation: "horizontal",
    people: false, prefer: ["crayon", "drawing", "colour", "color", "paper"], avoid: [],
    alt: "Crayons and a child's drawing on a table",
    for: "the questions chapters - something to look at while you read",
  },
  {
    key: "st-lunchbox", term: "healthy school lunchbox fruit vegetables overhead", orientation: "horizontal",
    people: false, prefer: ["lunch", "lunchbox", "healthy", "fruit", "school"], avoid: [],
    alt: "A packed school lunch of fruit and vegetables",
    for: "the diet and the prevention chapters",
  },
  {
    key: "st-play", term: "bright childrens playroom wooden toys daylight", orientation: "horizontal",
    people: false, prefer: ["playroom", "toy", "wooden", "bright", "children"], avoid: [],
    alt: "A bright playroom with wooden toys",
    for: "the comfort chapters",
  },
  {
    key: "st-nook", term: "cosy childrens reading nook by a window cushions daylight", orientation: "vertical",
    people: false, prefer: ["nook", "reading", "window", "cushion", "cosy", "cozy", "children"], avoid: ["concrete", "empty", "corridor", "office"],
    alt: "A reading nook by a window",
    for: "a vertical plate where a room is wanted and none of ours fits",
  },
  {
    key: "st-family", term: "parent and young child laughing at home kitchen daylight", orientation: "horizontal",
    people: true, prefer: ["family", "parent", "mother", "father", "child", "home", "laughing"], avoid: [],
    alt: "A parent and a young child laughing together at home",
    for: "the invitation chapters",
  },
  {
    key: "st-infant", term: "parent holding smiling baby at home natural light", orientation: "horizontal",
    people: true, prefer: ["baby", "infant", "parent", "mother", "holding", "home"], avoid: [],
    alt: "A parent holding a smiling baby",
    for: "the first tooth chapters",
  },
  {
    key: "st-teen", term: "smiling teenager outdoors portrait natural light", orientation: "vertical",
    people: true, prefer: ["teen", "teenager", "smiling", "outdoor", "portrait"], avoid: [],
    alt: "A smiling teenager outdoors",
    for: "the by-age rail, the last band",
  },
  {
    key: "st-calendar", term: "calendar page and pen on a white desk warm natural light", orientation: "horizontal",
    people: false, prefer: ["calendar", "planner", "white", "warm", "pen", "schedule"], avoid: ["blue background", "dark"],
    alt: "A calendar and a pen on a desk",
    for: "what happens next, and the booking chapters",
  },
  {
    key: "st-desk", term: "clipboard with paperwork and pen on a light wooden desk warm daylight", orientation: "horizontal",
    people: false, prefer: ["clipboard", "paperwork", "form", "document", "wooden", "warm"], avoid: ["plant", "pot", "grey", "gray", "dark"],
    alt: "A clipboard and a pen on a desk",
    for: "the paperwork and the front-desk chapters",
  },
  {
    key: "st-backpack", term: "childs backpack by the front door morning", orientation: "vertical",
    people: false, prefer: ["backpack", "bag", "school", "door", "child"], avoid: [],
    alt: "A child's backpack by a door",
    for: "the school-age chapters",
  },
  {
    key: "st-apple", term: "child holding an apple outdoors smiling", orientation: "horizontal",
    people: true, prefer: ["apple", "child", "fruit", "outdoor", "smiling"], avoid: [],
    alt: "A child holding an apple outdoors",
    for: "the prevention and the plan chapters",
  },

  /* --- 2026-09-09: the 46 migrated pages ---------------------------------
     Fourteen slots served eleven pages. Forty-six more pages arrived in the
     redesign and the pool ran out: `waiting` and `knee` would have carried
     nine treatment pages each. Everything below is an OBJECT or an ordinary
     moment, per the policy at the top of this file - the practice's own
     clinical frames stay the only pictures that appear beside a treatment
     name, and these sit in the second half of a page as the mood.
     AVOID_ALWAYS already drops "braces", "orthodont", "x-ray" and "dental",
     so a slot for an orthodontic page is searched by the object a parent
     recognises (a case on a shelf, a gum shield on grass), never the
     appliance in a mouth. */
  {
    key: "st-case", term: "small clear plastic container with lid on a white bathroom countertop", orientation: "horizontal",
    people: false, prefer: ["container", "case", "box", "plastic", "clear", "lid", "countertop"], avoid: ["jewellery", "jewelry", "makeup", "cosmetic", "pill", "medicine", "soap", "lily", "flower", "food", "lunch"],
    alt: "A small clear case on a bathroom shelf",
    for: "the appliance pages - aligners, retainers, night guards. An object on a shelf, never in a mouth",
  },
  {
    key: "st-field", term: "empty grass sports field at a school on a bright morning", orientation: "horizontal",
    people: false, prefer: ["field", "grass", "sport", "pitch", "school", "green"], avoid: ["stadium", "crowd", "night", "floodlight"],
    alt: "A school sports field on a bright morning",
    for: "mouth guards, and the knock that brings a family in for emergency care",
  },
  {
    key: "st-sleep", term: "childs bedroom with a made bed and soft morning light", orientation: "horizontal",
    people: false, prefer: ["bedroom", "bed", "child", "nursery", "morning", "soft"], avoid: ["hotel", "hospital", "dark", "adult"],
    alt: "A child's bedroom in the morning",
    for: "night guards, grinding, and the sedation pages where calm is the subject",
  },
  {
    key: "st-floss", term: "dental floss and toothpaste on a clean white bathroom shelf", orientation: "horizontal",
    people: false, prefer: ["floss", "toothpaste", "bathroom", "shelf", "white", "clean"], avoid: ["grunge", "dark", "rustic"],
    alt: "Floss and toothpaste on a bathroom shelf",
    for: "dental hygiene education, and the home-routine half of the preventive pages",
  },
  {
    key: "st-water", term: "glass of clear water standing on a wooden kitchen table by a window", orientation: "horizontal",
    people: false, prefer: ["water", "glass", "table", "kitchen", "window", "wooden"], avoid: ["cocktail", "splash", "dark", "lemon", "ice", "isolated", "white background", "bottle"],
    alt: "A glass of water on a kitchen table",
    for: "fluoride, and the acidity pages - the thing we ask them to drink instead",
  },
  {
    key: "st-soda", term: "assorted colourful sweets and candy laid out on a table overhead flat lay", orientation: "horizontal",
    people: false, prefer: ["candy", "sweet", "assorted", "colorful", "colourful", "flat lay", "table", "overhead"], avoid: ["alcohol", "beer", "cocktail", "bar", "splash", "mockup", "isolated", "white background"],
    alt: "Fizzy drinks and sweets on a table",
    for: "the pH and acidity table, the toothpaste chart, and the decay half of prevention",
  },
  {
    key: "st-tube", term: "toothbrush with toothpaste on it resting on a bathroom sink", orientation: "horizontal",
    people: false, prefer: ["toothpaste", "toothbrush", "sink", "bathroom", "counter"], avoid: ["dark", "grunge", "mockup", "blank", "isolated", "white background", "3d"],
    alt: "Toothpaste tubes on a bathroom counter",
    for: "the toothpaste chart and the RDA table",
  },
  {
    key: "st-blocks", term: "child wooden building blocks stacked on a wooden floor in a playroom", orientation: "horizontal",
    people: false, prefer: ["block", "wooden", "toy", "floor", "playroom", "stack", "build"], avoid: ["plastic", "lego", "dark", "yellow background", "isolated", "white background", "studio"],
    alt: "Wooden building blocks on a table",
    for: "space maintainers and early intervention - holding a gap, building in order",
  },
  {
    key: "st-hands", term: "adult hand holding a small childs hand outdoors close up", orientation: "horizontal",
    people: true, prefer: ["hand", "holding", "child", "parent", "together", "outdoor"], avoid: ["hospital", "elderly", "clinical"],
    alt: "An adult and a child holding hands",
    for: "special needs patient care, and the referral page",
  },
  {
    key: "st-window", term: "soft morning sunlight falling through a window onto a calm bedroom wall", orientation: "vertical",
    people: false, prefer: ["window", "sunlight", "morning", "calm", "quiet", "curtain", "light"], avoid: ["office", "corridor", "dark", "abandoned", "tropical", "night"],
    alt: "Sunlight through a window in a quiet room",
    for: "sedation, and the accessibility and privacy pages, where the mood is stillness",
  },
  {
    key: "st-laptop", term: "open laptop and a mug on a kitchen table at home in daylight", orientation: "horizontal",
    people: false, prefer: ["laptop", "kitchen", "table", "home", "mug", "coffee", "daylight"], avoid: ["office", "coworking", "dark", "night", "mockup", "whitescreen", "blank screen", "isolated"],
    alt: "An open laptop on a kitchen table",
    for: "the virtual consultation and the online-forms pages",
  },
  {
    key: "st-park", term: "tree lined park path in a suburban neighbourhood on a sunny day", orientation: "horizontal",
    people: false, prefer: ["park", "path", "tree", "neighbourhood", "neighborhood", "suburb", "sunny"], avoid: ["city", "crowd", "autumn leaves macro"],
    alt: "A tree-lined path in a neighbourhood park",
    for: "the town resource page - Katy itself, not the practice",
  },

  /* --- 2026-09-09 (evening): pictures that match the words ----------------
     The client: "better image selections that match the content they are
     attached to." The 2026-09-09 morning pool was searched around the object
     a parent recognises, and some of those searches landed wide: `st-case`
     came back as a food container and stood for aligners on four pages,
     `st-floss` and `st-tube` are both electric toothbrushes, technology got a
     laptop and a sunlit curtain. Every slot below was picked BY EYE from a
     candidate sheet and is pinned by `id`, so the search is recorded but is
     not what decides the frame.

     The policy above is unchanged, with one line made explicit: the OBJECT of
     a treatment (an aligner in its case, a mouth guard in a child's hand at a
     match) is an object and may appear; a procedure, an instrument in a mouth,
     a chair, a result may not. */
  {
    key: "st-aligner", id: 428880239, term: "clear teeth aligner in open case on white bathroom countertop", orientation: "horizontal",
    people: false, prefer: [], avoid: [],
    alt: "A clear aligner in its case on a bathroom counter",
    for: "Invisalign, the Invisalign FAQ, orthodontics and retainers - replaces st-case, which was a food container",
  },
  {
    key: "st-guard", id: 44211479, term: "mouthguard", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A sports mouth guard and its case",
    for: "mouth guards",
  },
  {
    key: "st-gap", id: 77890253, term: "smiling child with missing front baby tooth outdoors", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A laughing boy with a front tooth missing",
    for: "extractions and space maintainers - the gap itself, in ordinary life",
  },
  {
    key: "st-asleep", id: 37300690, term: "young child asleep in bed soft morning light", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A young boy asleep in striped pyjamas",
    for: "sedation and night guards - the subject is calm, and sleep",
  },
  {
    key: "st-phone", id: 308415629, term: "worried mother on the phone at home holding young child", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A parent on the phone at the kitchen table, a child on her lap",
    for: "emergency care - the call is the first step on that page",
  },
  {
    key: "st-video", id: 76906684, term: "parent and child at laptop video call kitchen table", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A family waving at a laptop on a video call",
    for: "the virtual consultation",
  },
  {
    key: "st-paste", id: 347291843, term: "squeezing toothpaste from tube onto toothbrush close up", orientation: "horizontal",
    people: false, prefer: [], avoid: [],
    alt: "Toothpaste being squeezed onto a toothbrush",
    for: "the toothpaste chart, the RDA table and product recommendations - actual toothpaste, which st-tube is not",
  },
  {
    key: "st-flossbox", id: 354116946, term: "dental floss container close up on white bathroom shelf", orientation: "horizontal",
    people: false, prefer: [], avoid: [],
    alt: "A container of floss on a marble shelf",
    for: "hygiene education and periodontics - actual floss, which st-floss is not",
  },
  {
    key: "st-crown", id: 22051959, term: "child wearing a paper crown at a birthday party smiling", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A girl in a paper crown, sitting on the grass",
    for: "dental crowns - the word, in ordinary life",
  },
  {
    key: "st-bottle", id: 404748021, term: "baby bottle and pacifier on a table soft light", orientation: "horizontal",
    people: false, prefer: [], avoid: [],
    alt: "A baby bottle and a teddy bear on a table",
    for: "the knee-to-knee exam, early intervention and frenectomy - bottles, pacifiers and thumbs are what the first visit is about",
  },
  {
    key: "st-piggy", id: 426528976, term: "child putting coin into piggy bank at kitchen table", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A girl dropping a coin into a piggy bank",
    for: "financing and the savings plan",
  },
  {
    key: "st-story", id: 360021819, term: "parent reading bedtime story to child in bed", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A parent and child reading a book in bed",
    for: "the dental library and the reading chapters",
  },
  {
    key: "st-wave", id: 357318314, term: "toddler waving goodbye at the door smiling", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A toddler waving through a doorway",
    for: "the thank-you page and the invitations that say come and look",
  },
  {
    key: "st-milk", id: 37954136, term: "toddler drinking water from a cup at home", orientation: "horizontal",
    people: true, prefer: [], avoid: [],
    alt: "A toddler drinking from a cup in a high chair",
    for: "fluoride, and the first-tooth chapters",
  },
];

const api = async (url) => {
  const r = await fetch(url, { headers: { "x-freepik-api-key": KEY } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)} on ${url}`);
  return JSON.parse(t);
};

const hasAny = (s, words) => words.some((w) => s.includes(w));

async function pick(slot) {
  // A slot with an `id` was chosen BY EYE from a candidate sheet (2026-09-09,
  // the content-matching pass): fetch that resource and skip the search, so a
  // re-run cannot quietly swap the reviewed frame for a different one.
  if (slot.id) {
    // Some ids answer the search endpoint but 404 on /resources/{id}; the
    // download endpoint still serves them, so a failed lookup is not a failed slot.
    let d = {};
    try { const { data } = await api(`https://api.freepik.com/v1/resources/${slot.id}`); d = data?.resource ?? data ?? {}; } catch {}
    return { id: slot.id, title: d.title || slot.alt, author: d.author, licenses: d.licenses, url: d.url || `https://www.magnific.com/premium-photo/${slot.id}` };
  }
  let url =
    `https://api.freepik.com/v1/resources?term=${encodeURIComponent(slot.term)}` +
    `&limit=60&order=relevance&filters[content_type][photo]=1` +
    `&filters[orientation][${slot.orientation}]=1`;
  // A slot that does not need a person must not get one: a stray face in a
  // decorative frame is the thing the policy above is trying to prevent.
  if (!slot.people) url += `&filters[people][exclude]=1`;
  const { data } = await api(url);
  const avoid = [...AVOID_ALWAYS, ...(slot.avoid ?? [])];
  const candidates = (data || [])
    .map((d) => ({ ...d, t: String(d.title || "").toLowerCase() }))
    .filter((d) => !hasAny(d.t, avoid));
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const score = (d) => slot.prefer.filter((w) => d.t.includes(w)).length;
    return score(b) - score(a);
  });
  return candidates[0];
}

fs.mkdirSync(STOCK, { recursive: true });
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : { generatedAt: null, source: "Magnific (api.freepik.com)", policy: "see the header of get-stock.mjs", slots: {} };

const log = [];
let failed = 0;
for (const slot of SLOTS) {
  if (only && slot.key !== only) continue;
  const dest = path.join(STOCK, `${slot.key}.jpg`);
  if (!force && !dryRun && fs.existsSync(dest) && manifest.slots[slot.key]) { log.push(`skip  ${slot.key}`); continue; }
  try {
    const hit = await pick(slot);
    if (!hit) throw new Error("no candidate survived the avoid list");
    if (dryRun) { log.push(`would  ${slot.key.padEnd(14)} ${hit.id}  ${hit.title.slice(0, 70)}`); continue; }
    const dl = await api(`https://api.freepik.com/v1/resources/${hit.id}/download`);
    const bin = await fetch(dl.data.url);
    if (!bin.ok) throw new Error(`download ${bin.status}`);
    fs.writeFileSync(dest, Buffer.from(await bin.arrayBuffer()));
    manifest.slots[slot.key] = {
      id: hit.id,
      title: hit.title,
      author: hit.author?.name ?? null,
      license: hit.licenses?.[0]?.type ?? null,
      pageUrl: hit.url,
      term: slot.term,
      orientation: slot.orientation,
      people: !!slot.people,
      alt: slot.alt,
      usedFor: slot.for,
      bytes: fs.statSync(dest).size,
    };
    log.push(`ok    ${slot.key.padEnd(14)} ${(fs.statSync(dest).size / 1024).toFixed(0)}KB  ${hit.title.slice(0, 60)}`);
  } catch (e) {
    failed++;
    log.push(`FAIL  ${slot.key.padEnd(14)} ${e.message}`);
  }
}

if (!dryRun) {
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
}
console.log(log.join("\n"));
console.log(dryRun ? "\ndry run - nothing written" : `\n-> ${path.relative(HERE, MANIFEST)}`);
if (failed) process.exitCode = 1;
