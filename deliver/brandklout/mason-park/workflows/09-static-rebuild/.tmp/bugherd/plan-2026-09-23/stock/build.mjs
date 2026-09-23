// Builds F-fill.json and a crop-check sheet (crops rendered from the previews / attachment files).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const here = import.meta.dirname;
const bug = path.join(here, "..", "..");
const T = JSON.parse(fs.readFileSync(path.join(here, "..", "F-fill-targets.json"), "utf8"));
const S = "plan-2026-09-23/stock/";
// [page, card, src, dims, box, key, alt, source, notes, preview]
const rows = [
  ["/services/airflow-one/", 6, S + "fill-airflow-gum-disease.jpg", "5472x3648", "410,0,4864,3648", "fill-airflow-gum-disease", "A man lifting his upper lip to show a red, swollen patch of gum above his front teeth", "Freepik 429140192 (licensed download, 5472x3648)", "", "prev/perio/429140192.jpg"],
  ["/services/bonding/", 3, S + "fill-bonding-worn-edges.jpg", "4626x3084", "257,0,4112,3084", "fill-bonding-worn-edges", "Close-up of front teeth with chipped, worn and uneven biting edges", "Freepik 24498097 (licensed download, 4626x3084)", "Card 1 on this page (#192) is the practice's own before/after of a broken tooth; this one is a different mouth and a stock close-up.", "prev/worn/24498097.jpg"],
  ["/services/comprehensive-care/", 3, "screens-2026-09-23/240-att1-image.png", "2443x1656", "235,0,2208,1656", "fill-cc-swollen-gums", "A finger drawing down the lower lip to show red, inflamed gums around the lower front teeth", "Agency attachment reused from BugHerd #240 (extractions, 'Advanced gum disease', 2026-09-22), 2443x1656; the agency's own attachment for this card (#228) arrived empty", "Reused image: also planned on /services/extractions/ card 2 (#240), not on this page.", null],
  ["/services/comprehensive-care/", 4, S + "fill-cc-receding-gums.jpg", "6720x4480", "373,0,5973,4480", "fill-cc-receding-gums", "Lower lip held down to show gum pulled back from a lower front tooth, its root exposed", "Freepik 42874364 (licensed download, 6720x4480)", "Same lip-held-down framing as card 3 (#240 reuse) but a different person and a different condition.", "prev/recede2/42874364.jpg"],
  ["/services/comprehensive-care/", 6, S + "fill-cc-loose-tooth.jpg", "7000x4667", "1575,210,4200,3150", "fill-cc-loose-tooth", "A man wincing as he pinches one of his front teeth between finger and thumb to test if it moves", "Freepik 9583597 (licensed download, 7000x4667)", "", "prev/loose/9583597.jpg"],
  ["/services/crown-lengthening/", 2, "screens-2026-09-23/192-att1-image.png", "1052x1560", "110,76,904,678", "fill-cl-broken-tooth", "An upper front tooth broken off close to the gum, too little left above the gumline to hold a crown", "Practice's own case photo, the 'Before' half of the before/after the agency attached to BugHerd #192 (bonding, 2026-09-22), 1052x1560; cropped below the 'Before' label", "Clinical intraoral shot with a little red at the gum edge (no blood). Crop avoids the 'Before' label and the Mason Park logo on the After half. Small source: 904 px wide, 1024 is a 1.13x upscale. Also used on /services/bonding/ card 1 by #192 as the full before/after.", null],
  ["/services/crown-lengthening/", 3, S + "fill-cl-gummy-smile.jpg", "6240x4160", "346,0,5547,4160", "fill-cl-gummy-smile", "A woman's smile showing a wide band of gum above short upper teeth", "Freepik 19949203 (licensed download, 6240x4160)", "", "prev/worn/19949203.jpg"],
  ["/services/crown-lengthening/", 4, S + "fill-cl-access.jpg", "6016x4016", "330,0,5355,4016", "fill-cl-access", "A patient with a cheek retractor in place while a gloved dentist works on her front teeth", "Freepik 249938583 (licensed download, 6016x4016)", "", "prev/crownfit/249938583.jpg"],
  ["/services/crown-lengthening/", 6, S + "fill-cl-shade-guide.jpg", "6000x4000", "450,0,5333,4000", "fill-cl-shade-guide", "A dentist holding a tooth shade guide up to a smiling patient to match a new crown", "Freepik 29629055 (licensed download, 6000x4000)", "Price card. The shade guide carries tiny printed shade numbers and a line of product text, unreadable at card size.", "prev/foundation/29629055.jpg"],
  ["/services/extractions/", 6, S + "fill-ext-toothache.jpg", "5760x3840", "320,0,5120,3840", "fill-ext-toothache", "A man with his eyes shut in pain, holding his jaw", "Freepik 64865589 (licensed download, 5760x3840)", "Price card ('Same day'): toothache image chosen over a front-desk shot because the card lists emergencies.", "prev/toothache/64865589.jpg"],
  ["/services/fluoride-treatment/", 3, S + "fill-fluoride-mirror.jpg", "7380x4928", "404,0,6571,4928", "fill-fluoride-mirror", "A dental mirror held inside an adult's open mouth, checking the back teeth", "Freepik 44914567 (licensed download, 7380x4928)", "", "prev/filling/44914567.jpg"],
  ["/services/root-canal-therapy/", 3, S + "fill-rct-swelling.jpg", "6720x3844", "630,0,5125,3844", "fill-rct-swelling", "A man frowning and pressing his palm to a tender cheek", "Freepik 138810181 (licensed download, 6720x3844)", "A man on purpose: card 1 on this page (#220) is a woman holding her jaw.", "prev/toothache/138810181.jpg"],
  ["/services/sedation-dentistry/", 2, S + "fill-sed-fear.jpg", "6000x4000", "0,0,5333,4000", "fill-sed-fear", "A man in a dental chair with his fists pressed to his mouth, eyes wide with fear", "Freepik 19485874 (licensed download, 6000x4000)", "", "prev/anxious/19485874.jpg"],
  ["/services/sedation-dentistry/", 3, S + "fill-sed-numbing.jpg", "5000x3333", "278,0,4444,3333", "fill-sed-numbing", "A woman in the dental chair watching a gloved hand hold up an anaesthetic syringe", "Freepik 41015350 (licensed download, 5000x3333)", "", "prev/inject/41015350.jpg"],
  ["/services/sedation-dentistry/", 4, S + "fill-sed-impression.jpg", "6000x4004", "330,0,5339,4004", "fill-sed-impression", "A gloved hand pressing an orange impression tray into a patient's mouth", "Freepik 34669984 (licensed download, 6000x4004)", "", "prev/gag/34669984.jpg"],
  ["/services/sedation-dentistry/", 6, S + "fill-sed-relaxed.jpg", "5760x3840", "320,0,5120,3840", "fill-sed-relaxed", "A woman lying back in a dental chair, eyes closed and hands folded, fully at ease", "Freepik 7572680 (licensed download, 5760x3840)", "", "prev/relaxed/7572680.jpg"],
  ["/services/wisdom-teeth/", 6, S + "fill-wisdom-young-adult.jpg", "6000x4000", "1200,450,3600,2700", "fill-wisdom-young-adult", "A young bearded man looking down with a hand pressed to his back jaw", "Freepik 9913020 (licensed download, 6000x4000)", "Price card ('17-25'): a young adult, not a teen. Card 4 on this page (#247) is a young man in a chair; different person and setting.", "prev/wisdom/9913020.jpg"],
  ["/services/dental-implant-placement/", 2, S + "fill-implant-bridge.jpg", "5052x3368", "155,0,4491,3368", "fill-implant-bridge", "Gloved hands screwing a multi-tooth bridge onto implants in a stone model", "Freepik 10058255 (licensed download, 5052x3368)", "", "prev/foundation/10058255.jpg"],
];

const out = rows.map(([page, card, src, dims, box, key, alt, source, notes]) => {
  const t = T.find((x) => x.page === page && x.card === card);
  if (!t) throw new Error("no target " + page + card);
  const [bx, by, bw, bh] = box.split(",").map(Number);
  const [W, H] = dims.split("x").map(Number);
  if (bx < 0 || by < 0 || bx + bw > W || by + bh > H) throw new Error("box out " + key);
  if (Math.abs(bw / bh - 4 / 3) > 0.0133) throw new Error("aspect " + key);
  const ws = [410, 768, 1024, 1536].filter((w) => w <= bw * 1.2);
  return { n: null, action: "add-media", page, section: "qualify", card, cardName: t.name.replace("&ndash;", "–"), slot: "qualify svc-card_media", current: null, src, srcDims: dims, box, aspect: "4:3", widths: ws.join(","), upscale: ws.some((w) => w > bw), key, alt, source, notes };
});
fs.writeFileSync(path.join(here, "..", "F-fill.json"), JSON.stringify(out, null, 1));

const cells = rows.map((r) => {
  const [, , src, dims, box, key, , , , prev] = r;
  const f = prev ? path.join(here, prev) : path.join(bug, src);
  const [W] = dims.split("x").map(Number);
  const pw = prev ? 2000 : W; const s = pw / W;
  const [bx, by, bw] = box.split(",").map(Number);
  const k = 320 / (bw * s);
  const mime = f.endsWith(".png") ? "image/png" : "image/jpeg";
  const b64 = fs.readFileSync(f).toString("base64");
  return `<div class=c><div class=f><img src="data:${mime};base64,${b64}" style="width:${pw * k}px;left:${-bx * s * k}px;top:${-by * s * k}px"></div><b>${key}</b></div>`;
}).join("");
const html = `<style>body{margin:0;font:12px sans-serif;background:#fff}.g{display:grid;grid-template-columns:repeat(6,324px);gap:4px}.f{position:relative;width:320px;height:240px;overflow:hidden}.f img{position:absolute}b{display:block}</style><div class=g>${cells}</div>`;
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const page = await browser.newPage({ viewport: { width: 6 * 328, height: 400 } });
await page.setContent(html);
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(here, "crop-check.png"), fullPage: true });
await browser.close();
console.log("ok", out.length);
